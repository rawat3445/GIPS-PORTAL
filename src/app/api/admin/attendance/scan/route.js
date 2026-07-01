import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import { requireAdmin } from "../../../../lib/auth";
import AttendanceSession from "../../../../models/AttendanceSession";
import AttendanceScanLog from "../../../../models/AttendanceScanLog";
import User from "../../../../models/User";
import { findApplicableHoliday } from "../../../../lib/attendanceEvents";
import {
  getAttendanceDateValidationMessage,
  verifyStudentQrToken,
} from "../../../../lib/qrAttendance";

export const runtime = "nodejs";

async function buildCounts(sessionId) {
  const scanCount = await AttendanceScanLog.countDocuments({ sessionId });
  return { scanCount };
}

export async function POST(request) {
  try {
    await connectDB();

    const auth = await requireAdmin();
    if (!auth.ok) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const sessionId = String(body?.sessionId || "").trim();
    const date = String(body?.date || "").trim();
    const qrText = String(body?.qrText || "").trim();
    const scanSource = ["camera", "hardware", "manual"].includes(
      String(body?.scanSource || "").trim().toLowerCase(),
    )
      ? String(body?.scanSource || "").trim().toLowerCase()
      : "camera";

    if ((!sessionId && !date) || !qrText) {
      return NextResponse.json(
        { message: "qrText and either sessionId or date are required" },
        { status: 400 },
      );
    }

    let student = null;

    try {
      const payload = verifyStudentQrToken(qrText);
      student = await User.findOne({
        _id: payload.studentId,
        role: "student",
      })
        .select("name course year profileImage")
        .lean();
    } catch {
      student = null;
    }

    if (!student) {
      return NextResponse.json(
        {
          message:
            "Student could not be verified from this QR code",
        },
        { status: 400 },
      );
    }

    let session = null;

    if (sessionId) {
      session = await AttendanceSession.findById(sessionId).lean();
      if (!session || String(session.createdBy) !== String(auth.decoded.id)) {
        return NextResponse.json({ message: "Session not found" }, { status: 404 });
      }

      if (session.status !== "open") {
        return NextResponse.json(
          { message: "This session is no longer open for scanning" },
          { status: 400 },
        );
      }
    } else {
      const validationMessage = getAttendanceDateValidationMessage(date);
      if (validationMessage) {
        return NextResponse.json({ message: validationMessage }, { status: 400 });
      }

      const classHoliday = await findApplicableHoliday({
        date,
        course: student.course,
        year: student.year,
      });
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
        course: String(student.course || "").trim().toUpperCase(),
        year: Number(student.year || 0),
        date,
        status: "open",
      })
        .sort({ createdAt: -1 })
        .lean();

      if (existingSession) {
        session = existingSession;
      } else {
        session = await AttendanceSession.create({
          course: String(student.course || "").trim().toUpperCase(),
          year: Number(student.year || 0),
          date,
          createdBy: auth.decoded.id,
          status: "open",
          sessionCode: `AQR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        });
        session = session.toObject();
      }
    }

    if (
      String(student.course || "").toUpperCase() !== String(session.course || "").toUpperCase() ||
      Number(student.year || 0) !== Number(session.year || 0)
    ) {
      return NextResponse.json(
        { message: "This student does not belong to the current course and year session" },
        { status: 400 },
      );
    }

    const activeEvent = await findApplicableHoliday({
      date: session.date,
      course: session.course,
      year: session.year,
      studentId: student._id,
    });

    if (activeEvent) {
      return NextResponse.json(
        {
          message: `Attendance is skipped for this student on ${session.date}${
            activeEvent.title ? `: ${activeEvent.title}` : ""
          }`,
        },
        { status: 400 },
      );
    }

    try {
      await AttendanceScanLog.create({
        sessionId: session._id,
        studentId: student._id,
        scannedBy: auth.decoded.id,
        course: session.course,
        year: session.year,
        date: session.date,
        scanSource,
        rawPayload: qrText,
      });
    } catch (error) {
      if (error?.code === 11000) {
        return NextResponse.json(
          { message: "This student has already been scanned for the current session" },
          { status: 409 },
        );
      }

      throw error;
    }

    const { scanCount } = await buildCounts(session._id);
    await AttendanceSession.findByIdAndUpdate(session._id, { $set: { scanCount } });

    return NextResponse.json({
      message: "Student marked present in the admin QR session",
      scanCount,
      session: {
        _id: String(session._id),
        course: String(session.course || "").trim(),
        year: Number(session.year || 0),
        date: String(session.date || "").trim(),
      },
      student: {
        _id: String(student._id),
        name: String(student.name || "").trim(),
        course: String(student.course || "").trim(),
        year: Number(student.year || 0),
        profileImage: String(student.profileImage || "").trim(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: 500 },
    );
  }
}
