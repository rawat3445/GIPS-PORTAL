import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "../../../lib/db";
import Holiday, { ensureHolidayIndexes } from "../../../models/Holiday";
import {
  buildHolidayDeleteFilter,
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
    const view = searchParams.get("view");
    const date = searchParams.get("date");
    const course = searchParams.get("course");
    const year = searchParams.get("year");
    const studentId = searchParams.get("studentId");

    if (view === "recent") {
      const requestedLimit = Number(searchParams.get("limit") || 8);
      const limit = Number.isFinite(requestedLimit)
        ? Math.min(Math.max(requestedLimit, 1), 25)
        : 8;

      const recentDocs = await Holiday.find({})
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(2000)
        .select({
          fromDate: 1,
          toDate: 1,
          title: 1,
          eventType: 1,
          scopeType: 1,
          course: 1,
          year: 1,
          studentId: 1,
          batchId: 1,
          updatedAt: 1,
          createdAt: 1,
        })
        .lean();

      const groupedEvents = new Map();

      recentDocs.forEach((doc) => {
        const batchId = String(doc?.batchId || "").trim();
        const groupKey =
          batchId ||
          [
            doc?.fromDate || "",
            doc?.toDate || "",
            doc?.title || "",
            doc?.eventType || "",
            doc?.scopeType || "",
            doc?.course || "",
            doc?.year ?? "",
          ].join("|");

        const existing = groupedEvents.get(groupKey);
        if (!existing) {
          groupedEvents.set(groupKey, {
            batchId,
            fromDate: doc?.fromDate || "",
            toDate: doc?.toDate || "",
            title: doc?.title || "Holiday",
            eventType: doc?.eventType || "holiday",
            scopeType: doc?.scopeType || "global",
            courses: new Set(doc?.course ? [doc.course] : []),
            years:
              Number.isFinite(Number(doc?.year)) && Number(doc.year) > 0
                ? new Set([Number(doc.year)])
                : new Set(),
            studentIds: new Set(doc?.studentId ? [String(doc.studentId)] : []),
            totalEntries: 1,
            latestUpdatedAt: doc?.updatedAt || null,
            latestCreatedAt: doc?.createdAt || null,
          });
          return;
        }

        if (doc?.course) existing.courses.add(doc.course);
        if (Number.isFinite(Number(doc?.year)) && Number(doc.year) > 0) {
          existing.years.add(Number(doc.year));
        }
        if (doc?.studentId) {
          existing.studentIds.add(String(doc.studentId));
        }
        existing.totalEntries += 1;
      });

      const recentEvents = [...groupedEvents.values()]
        .sort(
          (a, b) =>
            new Date(b.latestUpdatedAt || 0).getTime() -
              new Date(a.latestUpdatedAt || 0).getTime() ||
            new Date(b.latestCreatedAt || 0).getTime() -
              new Date(a.latestCreatedAt || 0).getTime()
        )
        .slice(0, limit)
        .map((event) => {
          const courses = [...event.courses].sort();
          const years = [...event.years].sort((a, b) => a - b);
          const studentIds = [...event.studentIds].sort();

          return {
            batchId: event.batchId,
            fromDate: event.fromDate,
            toDate: event.toDate,
            title: event.title,
            eventType: event.eventType,
            scopeType: event.scopeType,
            course: courses.length === 1 ? courses[0] : "",
            year: years.length === 1 ? years[0] : null,
            courses,
            years,
            studentIds,
            studentCount: studentIds.length,
            totalEntries: event.totalEntries,
            latestUpdatedAt: event.latestUpdatedAt,
            latestCreatedAt: event.latestCreatedAt,
          };
        });

      return NextResponse.json(recentEvents);
    }

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
          courses: body?.courses,
          years: body?.years,
          studentIds: body?.studentIds,
        });
    } catch (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    let replaceExistingScope = null;
    let replaceExistingFromDate = "";
    let replaceExistingToDate = "";
    if (body?.replaceExisting) {
      try {
        replaceExistingScope = normalizeEventScope({
          scopeType: body.replaceExisting.scopeType || "global",
          course: body.replaceExisting.course,
          year: body.replaceExisting.year,
          courses: body.replaceExisting.courses,
          years: body.replaceExisting.years,
          studentIds: body.replaceExisting.studentIds,
        });
      } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 400 });
      }

      replaceExistingFromDate =
        body.replaceExisting.fromDate || body.replaceExisting.date || "";
      replaceExistingToDate =
        body.replaceExisting.toDate || body.replaceExisting.date || "";

      if (!replaceExistingFromDate || !replaceExistingToDate) {
        return NextResponse.json(
          { message: "Existing event start date and end date are required" },
          { status: 400 },
        );
      }
    }

    const dates = validDates;

    if (replaceExistingScope) {
      await Holiday.deleteMany(
        buildHolidayDeleteFilter({
          fromDate: replaceExistingFromDate,
          toDate: replaceExistingToDate,
          scope: replaceExistingScope,
          batchId: body.replaceExisting.batchId,
        })
      );
    }

    const batchId =
      String(body?.batchId || "").trim() ||
      `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    await Holiday.bulkWrite(
      buildHolidayBulkOperations({
        dates,
        title,
        eventType,
        markedBy: adminId,
        batchId,
        scopeType: scope.scopeType,
        course: scope.course,
        year: scope.year,
        courses: scope.courses,
        years: scope.years,
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
          courses: body?.courses,
          years: body?.years,
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

    const result = await Holiday.deleteMany(
      buildHolidayDeleteFilter({
        fromDate,
        toDate,
        scope,
        batchId: body?.batchId,
      })
    );

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
