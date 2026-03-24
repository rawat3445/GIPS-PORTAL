import Holiday from "../models/Holiday";

export const ATTENDANCE_START_DATE = "2026-01-01";
export const WINTER_VACATION_FROM = "2026-01-01";
export const WINTER_VACATION_TO = "2026-01-18";
export const COLLEGE_RESUME_DATE = "2026-01-19";

export function toISODate(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

export function parseISODate(dateString) {
  return new Date(`${dateString}T00:00:00`);
}

export function addDays(dateString, days) {
  const date = parseISODate(dateString);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function getDateRange(fromDate, toDate) {
  const dates = [];
  let cursor = fromDate;

  while (cursor <= toDate) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return dates;
}

export function isSunday(dateString) {
  return parseISODate(dateString).getDay() === 0;
}

export function isWinterVacation(dateString) {
  return dateString >= WINTER_VACATION_FROM && dateString <= WINTER_VACATION_TO;
}

export function getEventDateValidationMessage(
  dateString,
  { allowFuture = true } = {}
) {
  const todayISO = toISODate(new Date());

  if (!dateString) return "Event date is required";
  if (dateString < ATTENDANCE_START_DATE) {
    return "Event cannot be marked before January 1, 2026";
  }
  if (isWinterVacation(dateString)) {
    return "Winter vacation is already excluded";
  }
  if (isSunday(dateString)) {
    return "Sundays are already treated as holidays";
  }
  if (!allowFuture && dateString > todayISO) {
    return "Future event dates are not allowed";
  }

  return "";
}

export function getEventRangeValidationMessage(
  fromDate,
  toDate,
  { allowFuture = true } = {}
) {
  if (!fromDate || !toDate) {
    return "Start date and end date are required";
  }

  if (toDate < fromDate) {
    return "End date cannot be earlier than start date";
  }

  const dates = getDateRange(fromDate, toDate);
  for (const date of dates) {
    const validationMessage = getEventDateValidationMessage(date, {
      allowFuture,
    });
    if (validationMessage) return validationMessage;
  }

  return "";
}

export function normalizeCourse(course) {
  return String(course || "").trim().toUpperCase();
}

export function normalizeEventScope({ scopeType, course, year }) {
  const nextScope = String(scopeType || "global").trim() || "global";
  const normalizedCourse = normalizeCourse(course);
  const normalizedYear = Number(year);

  if (nextScope === "global") {
    return {
      scopeType: "global",
      course: "",
      year: null,
    };
  }

  if (nextScope === "course") {
    if (!normalizedCourse) {
      throw new Error("Course is required for a course event");
    }

    return {
      scopeType: "course",
      course: normalizedCourse,
      year: null,
    };
  }

  if (nextScope === "courseYear") {
    if (!normalizedCourse) {
      throw new Error("Course is required for a course-year event");
    }

    if (!Number.isFinite(normalizedYear) || normalizedYear <= 0) {
      throw new Error("Valid year is required for a course-year event");
    }

    return {
      scopeType: "courseYear",
      course: normalizedCourse,
      year: normalizedYear,
    };
  }

  throw new Error("Invalid event scope");
}

export function getScopeLabel(scope) {
  if (scope?.scopeType === "courseYear") {
    return `${scope.course} Year ${scope.year}`;
  }

  if (scope?.scopeType === "course") {
    return `${scope.course} (all years)`;
  }

  return "all courses";
}

function getScopePriority(scopeType) {
  if (scopeType === "courseYear") return 3;
  if (scopeType === "course") return 2;
  return 1;
}

function buildApplicableScopeConditions(course, year) {
  const normalizedCourse = normalizeCourse(course);
  const normalizedYear = Number(year);
  const conditions = [{ scopeType: "global" }];

  if (normalizedCourse) {
    conditions.push({ scopeType: "course", course: normalizedCourse });
  }

  if (normalizedCourse && Number.isFinite(normalizedYear) && normalizedYear > 0) {
    conditions.push({
      scopeType: "courseYear",
      course: normalizedCourse,
      year: normalizedYear,
    });
  }

  return conditions;
}

export async function findApplicableHoliday({ date, course, year }) {
  if (!date) return null;

  const holidays = await Holiday.find({
    date,
    $or: buildApplicableScopeConditions(course, year),
  })
    .select({
      date: 1,
      fromDate: 1,
      toDate: 1,
      title: 1,
      eventType: 1,
      scopeType: 1,
      course: 1,
      year: 1,
    })
    .lean();

  if (!holidays.length) return null;

  return holidays.sort(
    (a, b) => getScopePriority(b.scopeType) - getScopePriority(a.scopeType)
  )[0];
}

export async function getHolidayMapForContext({
  fromDate,
  toDate,
  course,
  year,
}) {
  const holidays = await Holiday.find({
    date: { $gte: fromDate, $lte: toDate },
    $or: buildApplicableScopeConditions(course, year),
  })
    .select({
      date: 1,
      fromDate: 1,
      toDate: 1,
      title: 1,
      eventType: 1,
      scopeType: 1,
      course: 1,
      year: 1,
    })
    .lean();

  const holidayMap = new Map();

  holidays.forEach((holiday) => {
    const existing = holidayMap.get(holiday.date);
    if (
      !existing ||
      getScopePriority(holiday.scopeType) > getScopePriority(existing.scopeType)
    ) {
      holidayMap.set(holiday.date, holiday);
    }
  });

  return holidayMap;
}

export function buildHolidayBulkOperations({
  dates,
  title,
  eventType,
  markedBy,
  scopeType,
  course,
  year,
  fromDate,
  toDate,
}) {
  return dates.map((date) => ({
    updateOne: {
      filter: {
        date,
        scopeType,
        course: course || "",
        year: year ?? null,
      },
      update: {
        $set: {
          date,
          fromDate,
          toDate,
          title,
          eventType: ["holiday", "internship", "event"].includes(eventType)
            ? eventType
            : "holiday",
          scopeType,
          course: course || "",
          year: year ?? null,
          markedBy,
        },
      },
      upsert: true,
    },
  }));
}
