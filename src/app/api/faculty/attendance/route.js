import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import Attendance, { ensureAttendanceIndexes } from "../../../models/Attendance";
import User from "../../../models/User";
import {
  ATTENDANCE_START_DATE,
  findApplicableHoliday,
  isSunday,
  toISODate,
  WINTER_VACATION_FROM,
  WINTER_VACATION_TO,
} from "../../../lib/attendanceEvents";
import { logActivity } from "../../../lib/activity";

function formatStudentLabel(student) {
  const parts = [
    String(student?.name || "").trim(),
    String(student?.enrollmentNo || "").trim(),
  ].filter(Boolean);

  return parts.join(" ");
}

function summarizeStudentLabels(students, limit = 5) {
  const labels = students
    .map((student) => formatStudentLabel(student))
    .filter(Boolean);

  if (labels.length === 0) {
    return "";
  }

  if (labels.length <= limit) {
    return labels.join(", ");
  }

  return `${labels.slice(0, limit).join(", ")} and ${labels.length - limit} more`;
}

function serializeStudent(student, extra = {}) {
  return {
    studentId: String(student?._id || extra.studentId || ""),
    name: String(student?.name || extra.name || "").trim(),
    enrollmentNo: String(student?.enrollmentNo || extra.enrollmentNo || "").trim(),
    course: String(student?.course || extra.course || "").trim(),
    year: Number(student?.year || extra.year || 0),
    ...extra,
  };
}

function getApprovalStateLabel(status) {
  if (status === "approved") return "approved";
  if (status === "denied") return "denied";
  return "pending admin approval";
}

function getDateValidationMessage(dateString) {
  const todayISO = toISODate(new Date());

  if (!dateString) return "Attendance date is required";
  if (dateString < ATTENDANCE_START_DATE) {
    return "Attendance cannot be marked before January 1, 2026";
  }
  if (dateString >= WINTER_VACATION_FROM && dateString <= WINTER_VACATION_TO) {
    return "Attendance cannot be marked during winter vacation (January 1 to January 18, 2026)";
  }
  if (isSunday(dateString)) {
    return "Attendance cannot be marked on Sundays";
  }
  if (dateString > todayISO) {
    return "Attendance cannot be marked for a future date";
  }

  return "";
}

// NOTE: replace this with your real auth method
async function getMeOrThrow(request) {
  // Example: you already have /api/auth/me in your project
  const res = await fetch(new URL("/api/auth/me", request.url), {
    headers: { cookie: request.headers.get("cookie") || "" },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error("Unauthorized");
  return data.user;
}

export async function POST(request) {
  try {
    await connectDB();
    await ensureAttendanceIndexes();

    const me = await getMeOrThrow(request);
    if (String(me?.role || "").toLowerCase() !== "faculty") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { course, date, records, year } = body || {};
    const normalizedCourse = String(course || "").toUpperCase().trim();
    const normalizedYear = Number(year);

    if (!normalizedCourse || !date || !normalizedYear || !Array.isArray(records)) {
      return NextResponse.json(
        { message: "course, date, records[] required" },
        { status: 400 }
      );
    }

    const dateValidationMessage = getDateValidationMessage(date);
    if (dateValidationMessage) {
      return NextResponse.json(
        { message: dateValidationMessage },
        { status: 400 }
      );
    }

    // lock to assigned course
    if (
      String(me.assignedCourse || "").toUpperCase() !==
      normalizedCourse
    ) {
      return NextResponse.json(
        { message: "Course not allowed" },
        { status: 403 }
      );
    }

    const existingHoliday = await findApplicableHoliday({
      date,
      course: normalizedCourse,
      year: normalizedYear,
    });

    if (existingHoliday) {
      return NextResponse.json(
        {
          message: `This date is marked as a holiday${
            existingHoliday.title ? `: ${existingHoliday.title}` : ""
          }`,
        },
        { status: 400 }
      );
    }

    const normalizedRecords = records.map((record) => ({
      studentId: String(record?.studentId || "").trim(),
      status: String(record?.status || "").trim().toLowerCase(),
    }));

    if (
      normalizedRecords.some(
        (record) =>
          !record.studentId ||
          (record.status !== "present" && record.status !== "absent"),
      )
    ) {
      return NextResponse.json(
        { message: "Each attendance record must include a valid student and status" },
        { status: 400 },
      );
    }

    const uniqueStudentIds = [...new Set(normalizedRecords.map((record) => record.studentId))];
    if (uniqueStudentIds.length !== normalizedRecords.length) {
      return NextResponse.json(
        { message: "Duplicate students are not allowed in one attendance submission" },
        { status: 400 },
      );
    }

    const students = await User.find({
      _id: { $in: uniqueStudentIds },
      role: "student",
    })
      .select("name enrollmentNo course year")
      .lean();

    const studentMap = new Map(
      students.map((student) => [String(student._id), student]),
    );

    if (studentMap.size !== uniqueStudentIds.length) {
      return NextResponse.json(
        { message: "Some selected students could not be verified" },
        { status: 400 },
      );
    }

    const invalidStudent = normalizedRecords.find((record) => {
      const student = studentMap.get(record.studentId);
      return (
        !student ||
        String(student.course || "").toUpperCase() !== normalizedCourse ||
        Number(student.year || 0) !== normalizedYear
      );
    });

    if (invalidStudent) {
      return NextResponse.json(
        { message: "Selected students do not match the chosen course and year" },
        { status: 400 },
      );
    }

    const previousDoc = await Attendance.findOne({
      course: normalizedCourse,
      year: normalizedYear,
      date,
    }).lean();

    const previousStatusMap = new Map(
      (previousDoc?.records || []).map((record) => [
        String(record.studentId),
        String(record.status || "").trim().toLowerCase(),
      ]),
    );

    const detailedRecords = normalizedRecords.map((record) => {
      const student = studentMap.get(record.studentId);
      return {
        student,
        studentId: record.studentId,
        status: record.status,
        previousStatus: previousStatusMap.get(record.studentId) || "",
      };
    });

    const presentStudents = detailedRecords
      .filter((record) => record.status === "present")
      .map((record) => serializeStudent(record.student, { status: record.status }));
    const absentStudents = detailedRecords
      .filter((record) => record.status === "absent")
      .map((record) => serializeStudent(record.student, { status: record.status }));
    const changedStudents = detailedRecords
      .filter(
        (record) => record.previousStatus && record.previousStatus !== record.status,
      )
      .map((record) =>
        serializeStudent(record.student, {
          fromStatus: record.previousStatus,
          toStatus: record.status,
        }),
      );
    const newlyMarkedStudents = detailedRecords
      .filter((record) => !record.previousStatus)
      .map((record) => serializeStudent(record.student, { status: record.status }));

    // Upsert = create if not exists, otherwise replace records
    const doc = await Attendance.findOneAndUpdate(
      { course: normalizedCourse, year: normalizedYear, date },
      {
        $set: {
          markedBy: me._id,
          approvalStatus: "pending",
          reviewedBy: null,
          reviewedAt: null,
          reviewNote: "",
          records: normalizedRecords.map((record) => ({
            studentId: record.studentId,
            status: record.status,
          })),
        },
      },
      { new: true, upsert: true }
    );

    await logActivity({
      actor: me,
      actionType: "attendance_marked",
      actionLabel: previousDoc ? "Submitted attendance update" : "Submitted attendance",
      path: "/dashboard/faculty/mark-attendance",
      details: [
        `${previousDoc ? "Updated" : "Marked"} ${normalizedCourse} Year ${normalizedYear} attendance for ${date}`,
        `Approval: ${getApprovalStateLabel("pending")}`,
        `Present: ${presentStudents.length}`,
        `Absent: ${absentStudents.length}`,
        changedStudents.length ? `Changed: ${changedStudents.length}` : "",
        newlyMarkedStudents.length ? `Newly marked: ${newlyMarkedStudents.length}` : "",
        presentStudents.length
          ? `Present students: ${summarizeStudentLabels(presentStudents)}`
          : "",
        absentStudents.length
          ? `Absent students: ${summarizeStudentLabels(absentStudents)}`
          : "",
      ]
        .filter(Boolean)
        .join(" | "),
      metadata: {
        attendanceId: doc._id,
        course: normalizedCourse,
        year: normalizedYear,
        date,
        approvalStatus: "pending",
        recordCount: normalizedRecords.length,
        submissionMode: previousDoc ? "updated" : "created",
        presentCount: presentStudents.length,
        absentCount: absentStudents.length,
        changedCount: changedStudents.length,
        newlyMarkedCount: newlyMarkedStudents.length,
        presentStudents,
        absentStudents,
        changedStudents,
        newlyMarkedStudents,
      },
    });

    return NextResponse.json({
      message: "Attendance submitted for admin approval",
      attendanceId: doc._id,
      approvalStatus: doc.approvalStatus || "pending",
    });
  } catch (e) {
    return NextResponse.json(
      { message: e.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await connectDB();

    const me = await getMeOrThrow(request);
    if (String(me?.role || "").toLowerCase() !== "faculty") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const course = searchParams.get("course");
    const year = searchParams.get("year");
    const date = searchParams.get("date");

    if (!course || !year || !date) {
      return NextResponse.json(
        { message: "course, year & date required" },
        { status: 400 }
      );
    }

    if (
      String(me.assignedCourse || "").toUpperCase() !==
      String(course).toUpperCase()
    ) {
      return NextResponse.json(
        { message: "Course not allowed" },
        { status: 403 }
      );
    }

    const doc = await Attendance.findOne({
      course: String(course).toUpperCase(),
      year: Number(year),
      date,
    }).lean();

    return NextResponse.json(doc || null);
  } catch (e) {
    return NextResponse.json(
      { message: e.message || "Server error" },
      { status: 500 }
    );
  }
}
