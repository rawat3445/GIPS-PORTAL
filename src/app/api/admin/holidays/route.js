import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "../../../lib/db";
import Holiday, { ensureHolidayIndexes } from "../../../models/Holiday";
import {
  buildHolidayBulkOperations,
  findApplicableHoliday,
  getProcessableEventRange,
  getScopeLabel,
  normalizeEventScope,
} from "../../../lib/attendanceEvents";

function getAdminId(req) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    throw new Error("Unauthorized");
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (String(decoded.role || "").toLowerCase() !== "admin") {
    throw new Error("Forbidden");
  }

  return decoded.id;
}

export async function GET(req) {
  try {
    await connectDB();
    await ensureHolidayIndexes();
    getAdminId(req);

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const course = searchParams.get("course");
    const year = searchParams.get("year");
    const studentId = searchParams.get("studentId");

    if (!date) {
      return NextResponse.json(
        { message: "date is required" },
        { status: 400 }
      );
    }

    const holiday = await findApplicableHoliday({ date, course, year, studentId });
    return NextResponse.json(holiday || null);
  } catch (error) {
    const status =
      error.message === "Unauthorized"
        ? 401
        : error.message === "Forbidden"
        ? 403
        : 500;

    return NextResponse.json(
      { message: error.message || "Server error" },
      { status }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();
    await ensureHolidayIndexes();
    const adminId = getAdminId(req);

    const body = await req.json();
    const fromDate = body?.fromDate || body?.date;
    const toDate = body?.toDate || body?.date;
    const title = String(body?.title || "Holiday").trim() || "Holiday";
    const eventType =
      body?.eventType === "internship"
        ? "internship"
        : body?.eventType === "event"
        ? "event"
        : "holiday";

    const { validationMessage, validDates, skippedDates, skippedReasons } =
      getProcessableEventRange(fromDate, toDate, {
      allowFuture: true,
      });
    if (validationMessage) {
      return NextResponse.json({ message: validationMessage }, { status: 400 });
    }

    let scope;
    try {
      scope = normalizeEventScope({
        scopeType: body?.scopeType || "global",
        course: body?.course,
        year: body?.year,
        studentIds: body?.studentIds,
      });
    } catch (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    const dates = validDates;

    await Holiday.bulkWrite(
      buildHolidayBulkOperations({
        dates,
        title,
        eventType,
        markedBy: adminId,
        scopeType: scope.scopeType,
        course: scope.course,
        year: scope.year,
        studentIds: scope.studentIds,
        fromDate,
        toDate,
      })
    );

    const holiday = await findApplicableHoliday({
      date: fromDate,
      course: scope.course,
      year: scope.year,
      studentId: scope.studentIds?.[0],
    });

    const skippedParts = [];
    if (skippedReasons.sunday) {
      skippedParts.push(
        `${skippedReasons.sunday} Sunday${skippedReasons.sunday === 1 ? "" : "s"}`
      );
    }
    if (skippedReasons.winterVacation) {
      skippedParts.push(
        `${skippedReasons.winterVacation} winter vacation day${skippedReasons.winterVacation === 1 ? "" : "s"}`
      );
    }

    return NextResponse.json({
      message: `${title} saved for ${getScopeLabel(scope)} from ${fromDate} to ${toDate} (${dates.length} working day${dates.length === 1 ? "" : "s"}${skippedParts.length ? `, skipped ${skippedParts.join(" and ")}` : ""})`,
      holiday,
      savedDays: dates.length,
      skippedDays: skippedDates.length,
      skippedDates,
      scopeLabel: getScopeLabel(scope),
    });
  } catch (error) {
    const status =
      error.message === "Unauthorized"
        ? 401
        : error.message === "Forbidden"
        ? 403
        : 500;

    return NextResponse.json(
      { message: error.message || "Server error" },
      { status }
    );
  }
}

export async function DELETE(req) {
  try {
    await connectDB();
    await ensureHolidayIndexes();
    getAdminId(req);

    const body = await req.json();
    const fromDate = body?.fromDate || body?.date;
    const toDate = body?.toDate || body?.date;

    let scope;
    try {
      scope = normalizeEventScope({
        scopeType: body?.scopeType || "global",
        course: body?.course,
        year: body?.year,
        studentIds: body?.studentIds,
      });
    } catch (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { message: "Start date and end date are required" },
        { status: 400 }
      );
    }

    const result = await Holiday.deleteMany({
      date: { $gte: fromDate, $lte: toDate },
      scopeType: scope.scopeType,
      course: scope.course,
      year: scope.year,
      ...(scope.scopeType === "student"
        ? { studentId: { $in: scope.studentIds } }
        : { studentId: null }),
    });

    return NextResponse.json({
      message: `Removed event for ${getScopeLabel(scope)} from ${fromDate} to ${toDate}`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    const status =
      error.message === "Unauthorized"
        ? 401
        : error.message === "Forbidden"
        ? 403
        : 500;

    return NextResponse.json(
      { message: error.message || "Server error" },
      { status }
    );
  }
}
