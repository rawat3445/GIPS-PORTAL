import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import { requireFaculty } from "../../../../lib/auth";
import Attendance, {
  ensureAttendanceIndexes,
} from "../../../../models/Attendance";
import AttendanceSession from "../../../../models/AttendanceSession";
import AttendanceScanLog from "../../../../models/AttendanceScanLog";
import User from "../../../../models/User";
import { logActivity } from "../../../../lib/activity";
import {
  findApplicableHoliday,
  getHolidayMapForStudentsOnDate,
} from "../../../../lib/attendanceEvents";
import { getAttendanceDateValidationMessage } from "../../../../lib/qrAttendance";

export const runtime = "nodejs";

function createSessionCode() {
  return `QR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

async function buildSessionResponse(sessionId) {
  const session = await AttendanceSession.findById(sessionId)
    .populate("createdBy", "name email assignedCourse")
    .populate("finalizedAttendanceId", "_id approvalStatus")
    .lean();

  if (!session) {
    return null;
  }

  const scans = await AttendanceScanLog.find({ sessionId: session._id })
    .populate("studentId", "name course year profileImage")
    .sort({ createdAt: -1 })
    .lean();

  return {
    ...session,
    scans: scans.map((scan) => ({
      _id: String(scan._id),
      scanSource: scan.scanSource,
      scannedAt: scan.createdAt,
      student: {
        _id: String(scan.studentId?._id || ""),
        name: String(scan.studentId?.name || "").trim(),
        course: String(scan.studentId?.course || "").trim(),
        year: Number(scan.studentId?.year || 0),
        profileImage: String(scan.studentId?.profileImage || "").trim(),
      },
    })),
  };
}

async function validateFacultyCourse(decoded, course) {
  const faculty = await User.findById(decoded.id).select(
    "name email assignedCourse role",
  );

  if (!faculty || String(faculty.role || "").toLowerCase() !== "faculty") {
    return { error: "Forbidden", status: 403 };
  }

  if (String(faculty.assignedCourse || "").toUpperCase() !== course) {
    return { error: "Course not allowed", status: 403 };
  }

  return { faculty };
}

export async function GET(request) {
  try {
    await connectDB();

    const auth = await requireFaculty();
    if (!auth.ok) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const course = String(searchParams.get("course") || "")
      .trim()
      .toUpperCase();
    const year = Number(searchParams.get("year"));
    const date = searchParams.get("date");
    const status = String(searchParams.get("status") || "open").trim();

    if (sessionId) {
      const session = await AttendanceSession.findById(sessionId)
        .select("createdBy course")
        .lean();

      if (!session || String(session.createdBy) !== String(auth.decoded.id)) {
        return NextResponse.json({ message: "Session not found" }, { status: 404 });
      }

      const detail = await buildSessionResponse(sessionId);
      return NextResponse.json(detail);
    }

    if (!course || !Number.isFinite(year) || year <= 0 || !date) {
      return NextResponse.json(
        { message: "course, year and date are required" },
        { status: 400 },
      );
    }

    const courseValidation = await validateFacultyCourse(auth.decoded, course);
    if (courseValidation.error) {
      return NextResponse.json(
        { message: courseValidation.error },
        { status: courseValidation.status },
      );
    }

    const session = await AttendanceSession.findOne({
      createdBy: auth.decoded.id,
      course,
      year,
      date,
      status,
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!session) {
      return NextResponse.json(null);
    }

    const detail = await buildSessionResponse(session._id);
    return NextResponse.json(detail);
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();

    const auth = await requireFaculty();
    if (!auth.ok) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const course = String(body?.course || "").trim().toUpperCase();
    const year = Number(body?.year);
    const date = String(body?.date || "").trim();

    if (!course || !Number.isFinite(year) || year <= 0 || !date) {
      return NextResponse.json(
        { message: "course, year and date are required" },
        { status: 400 },
      );
    }

    const validationMessage = getAttendanceDateValidationMessage(date);
    if (validationMessage) {
      return NextResponse.json({ message: validationMessage }, { status: 400 });
    }

    const courseValidation = await validateFacultyCourse(auth.decoded, course);
    if (courseValidation.error) {
      return NextResponse.json(
        { message: courseValidation.error },
        { status: courseValidation.status },
      );
    }

    const classHoliday = await findApplicableHoliday({ date, course, year });
    if (classHoliday) {
      return NextResponse.json(
        {
          message: `This date already has an active ${classHoliday.eventType || "holiday"}${
            classHoliday.title ? `: ${classHoliday.title}` : ""
          }`,
        },
        { status: 400 },
      );
    }

    const existingSession = await AttendanceSession.findOne({
      createdBy: auth.decoded.id,
      course,
      year,
      date,
      status: "open",
    })
      .sort({ createdAt: -1 })
      .lean();

    if (existingSession) {
      const detail = await buildSessionResponse(existingSession._id);
      return NextResponse.json({
        reused: true,
        message: "Existing open QR session loaded",
        session: detail,
      });
    }

    const session = await AttendanceSession.create({
      course,
      year,
      date,
      createdBy: auth.decoded.id,
      status: "open",
      sessionCode: createSessionCode(),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    });

    await logActivity({
      actor: courseValidation.faculty,
      actionType: "attendance_marked",
      actionLabel: "Opened QR attendance session",
      path: "/dashboard/faculty/scan-attendance",
      details: `Opened QR attendance session for ${course} Year ${year} on ${date}`,
      metadata: {
        sessionId: session._id,
        course,
        year,
        date,
        mode: "qr_session",
      },
    });

    const detail = await buildSessionResponse(session._id);

    return NextResponse.json(
      {
        message: "QR attendance session created",
        session: detail,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  try {
    await connectDB();
    await ensureAttendanceIndexes();

    const auth = await requireFaculty();
    if (!auth.ok) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const sessionId = String(body?.sessionId || "").trim();
    const action = String(body?.action || "").trim().toLowerCase();

    if (!sessionId || !["finalize", "cancel"].includes(action)) {
      return NextResponse.json(
        { message: "sessionId and a valid action are required" },
        { status: 400 },
      );
    }

    const session = await AttendanceSession.findById(sessionId);
    if (!session || String(session.createdBy) !== String(auth.decoded.id)) {
      return NextResponse.json({ message: "Session not found" }, { status: 404 });
    }

    if (session.status !== "open") {
      return NextResponse.json(
        { message: "Only open sessions can be updated" },
        { status: 400 },
      );
    }

    const courseValidation = await validateFacultyCourse(
      auth.decoded,
      String(session.course || "").toUpperCase(),
    );
    if (courseValidation.error) {
      return NextResponse.json(
        { message: courseValidation.error },
        { status: courseValidation.status },
      );
    }

    if (action === "cancel") {
      session.status = "cancelled";
      await session.save();

      await logActivity({
        actor: courseValidation.faculty,
        actionType: "attendance_marked",
        actionLabel: "Cancelled QR attendance session",
        path: "/dashboard/faculty/scan-attendance",
        details: `Cancelled QR attendance session for ${session.course} Year ${session.year} on ${session.date}`,
        metadata: {
          sessionId: session._id,
          course: session.course,
          year: session.year,
          date: session.date,
          mode: "qr_session",
        },
      });

      return NextResponse.json({ message: "QR attendance session cancelled" });
    }

    const scans = await AttendanceScanLog.find({ sessionId: session._id })
      .select("studentId")
      .lean();

    if (!scans.length) {
      return NextResponse.json(
        { message: "At least one successful scan is required before finalizing" },
        { status: 400 },
      );
    }

    const students = await User.find({
      role: "student",
      course: session.course,
      year: session.year,
    })
      .select("name course year")
      .lean();

    if (!students.length) {
      return NextResponse.json(
        { message: "No students found for this course and year" },
        { status: 400 },
      );
    }

    const holidayMap = await getHolidayMapForStudentsOnDate({
      date: session.date,
      course: session.course,
      year: session.year,
      studentIds: students.map((student) => String(student._id)),
    });

    const markableStudents = students.filter(
      (student) => !holidayMap.has(String(student._id)),
    );

    if (!markableStudents.length) {
      return NextResponse.json(
        { message: "All students are excluded by active events for this date" },
        { status: 400 },
      );
    }

    const presentStudentIds = new Set(scans.map((scan) => String(scan.studentId)));
    const records = markableStudents.map((student) => ({
      studentId: student._id,
      status: presentStudentIds.has(String(student._id)) ? "present" : "absent",
    }));

    const attendance = await Attendance.findOneAndUpdate(
      {
        course: session.course,
        year: session.year,
        date: session.date,
      },
      {
        $set: {
          markedBy: auth.decoded.id,
          approvalStatus: "pending",
          reviewedBy: null,
          reviewedAt: null,
          reviewNote: "",
          records,
        },
      },
      { new: true, upsert: true },
    );

    session.status = "finalized";
    session.finalizedAt = new Date();
    session.finalizedAttendanceId = attendance._id;
    session.scanCount = presentStudentIds.size;
    session.presentCount = records.filter((record) => record.status === "present").length;
    session.absentCount = records.filter((record) => record.status === "absent").length;
    session.rosterCount = records.length;
    await session.save();

    await logActivity({
      actor: courseValidation.faculty,
      actionType: "attendance_marked",
      actionLabel: "Submitted QR attendance",
      path: "/dashboard/faculty/scan-attendance",
      details: [
        `Submitted QR attendance for ${session.course} Year ${session.year} on ${session.date}`,
        `Present: ${session.presentCount}`,
        `Absent: ${session.absentCount}`,
        "Approval: pending admin approval",
      ].join(" | "),
      metadata: {
        sessionId: session._id,
        attendanceId: attendance._id,
        course: session.course,
        year: session.year,
        date: session.date,
        mode: "qr_session",
        presentCount: session.presentCount,
        absentCount: session.absentCount,
        rosterCount: session.rosterCount,
      },
    });

    const detail = await buildSessionResponse(session._id);

    return NextResponse.json({
      message: "QR attendance submitted for admin approval",
      attendanceId: attendance._id,
      session: detail,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: 500 },
    );
  }
}
