import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import Holiday, { ensureHolidayIndexes } from "../../../models/Holiday";
import {
  buildHolidayBulkOperations,
  findApplicableHoliday,
  getProcessableEventRange,
  getScopeLabel,
  normalizeCourse,
  normalizeEventScope,
} from "../../../lib/attendanceEvents";

async function getMeOrThrow(request) {
  const res = await fetch(new URL("/api/auth/me", request.url), {
    headers: { cookie: request.headers.get("cookie") || "" },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error("Unauthorized");
  return data.user;
}

export async function GET(request) {
  try {
    await connectDB();
    await ensureHolidayIndexes();

    const me = await getMeOrThrow(request);
    if (String(me?.role || "").toLowerCase() !== "faculty") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const year = searchParams.get("year");
    const course = normalizeCourse(searchParams.get("course") || me.assignedCourse);
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
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    await ensureHolidayIndexes();

    const me = await getMeOrThrow(request);
    if (String(me?.role || "").toLowerCase() !== "faculty") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const assignedCourse = normalizeCourse(me?.assignedCourse);
    if (!assignedCourse) {
      return NextResponse.json(
        { message: "Faculty course missing" },
        { status: 400 }
      );
    }

    const body = await request.json();
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
        scopeType:
          body?.scopeType === "student"
            ? "student"
            : body?.scopeType === "courseYear"
            ? "courseYear"
            : "course",
        course: assignedCourse,
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
        markedBy: me._id,
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
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    await ensureHolidayIndexes();

    const me = await getMeOrThrow(request);
    if (String(me?.role || "").toLowerCase() !== "faculty") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const assignedCourse = normalizeCourse(me?.assignedCourse);
    if (!assignedCourse) {
      return NextResponse.json(
        { message: "Faculty course missing" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const fromDate = body?.fromDate || body?.date;
    const toDate = body?.toDate || body?.date;

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { message: "Start date and end date are required" },
        { status: 400 }
      );
    }

    let scope;
    try {
      scope = normalizeEventScope({
        scopeType:
          body?.scopeType === "student"
            ? "student"
            : body?.scopeType === "courseYear"
            ? "courseYear"
            : "course",
        course: assignedCourse,
        year: body?.year,
        studentIds: body?.studentIds,
      });
    } catch (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
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
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
