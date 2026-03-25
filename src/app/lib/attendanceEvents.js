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
  { allowFuture = true, allowAutoExcludedDays = false } = {}
) {
  const todayISO = toISODate(new Date());

  if (!dateString) return "Event date is required";
  if (dateString < ATTENDANCE_START_DATE) {
    return "Event cannot be marked before January 1, 2026";
  }
  if (!allowAutoExcludedDays && isWinterVacation(dateString)) {
    return "Winter vacation is already excluded";
  }
  if (!allowAutoExcludedDays && isSunday(dateString)) {
    return "Sundays are already treated as holidays";
  }
  if (!allowFuture && dateString > todayISO) {
    return "Future event dates are not allowed";
  }

  return "";
}

export function getProcessableEventRange(
  fromDate,
  toDate,
  { allowFuture = true } = {}
) {
  if (!fromDate || !toDate) {
    return {
      validationMessage: "Start date and end date are required",
      validDates: [],
      skippedDates: [],
      skippedReasons: {
        sunday: 0,
        winterVacation: 0,
      },
    };
  }

  if (toDate < fromDate) {
    return {
      validationMessage: "End date cannot be earlier than start date",
      validDates: [],
      skippedDates: [],
      skippedReasons: {
        sunday: 0,
        winterVacation: 0,
      },
    };
  }

  const validDates = [];
  const skippedDates = [];
  const skippedReasons = {
    sunday: 0,
    winterVacation: 0,
  };

  const dates = getDateRange(fromDate, toDate);
  for (const date of dates) {
    const validationMessage = getEventDateValidationMessage(date, {
      allowFuture,
      allowAutoExcludedDays: true,
    });
    if (validationMessage) {
      return {
        validationMessage,
        validDates: [],
        skippedDates: [],
        skippedReasons,
      };
    }

    if (isWinterVacation(date)) {
      skippedDates.push(date);
      skippedReasons.winterVacation += 1;
      continue;
    }

    if (isSunday(date)) {
      skippedDates.push(date);
      skippedReasons.sunday += 1;
      continue;
    }

    validDates.push(date);
  }

  if (!validDates.length) {
    let validationMessage =
      "Selected range only covers Sundays or winter vacation dates, so nothing can be marked";

    if (skippedReasons.sunday && !skippedReasons.winterVacation) {
      validationMessage = "Selected range only covers Sundays, so nothing can be marked";
    } else if (skippedReasons.winterVacation && !skippedReasons.sunday) {
      validationMessage =
        "Selected range only covers winter vacation dates, so nothing can be marked";
    }

    return {
      validationMessage,
      validDates,
      skippedDates,
      skippedReasons,
    };
  }

  return {
    validationMessage: "",
    validDates,
    skippedDates,
    skippedReasons,
  };
}

export function getEventRangeValidationMessage(
  fromDate,
  toDate,
  { allowFuture = true } = {}
) {
  return getProcessableEventRange(fromDate, toDate, {
    allowFuture,
  }).validationMessage;
}

export function normalizeCourse(course) {
  return String(course || "").trim().toUpperCase();
}

export function normalizeStudentIds(studentIds) {
  const values = Array.isArray(studentIds) ? studentIds : [];
  return Array.from(
    new Set(values.map((value) => String(value || "").trim()).filter(Boolean))
  );
}

export function normalizeEventScope({ scopeType, course, year, studentIds }) {
  const nextScope = String(scopeType || "global").trim() || "global";
  const normalizedCourse = normalizeCourse(course);
  const normalizedYear = Number(year);
  const normalizedStudentIds = normalizeStudentIds(studentIds);

  if (nextScope === "global") {
    return {
      scopeType: "global",
      course: "",
      year: null,
      studentIds: [],
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
      studentIds: [],
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
      studentIds: [],
    };
  }

  if (nextScope === "student") {
    if (!normalizedCourse) {
      throw new Error("Course is required for a student event");
    }

    if (!Number.isFinite(normalizedYear) || normalizedYear <= 0) {
      throw new Error("Valid year is required for a student event");
    }

    if (!normalizedStudentIds.length) {
      throw new Error("Select at least one student for a student event");
    }

    return {
      scopeType: "student",
      course: normalizedCourse,
      year: normalizedYear,
      studentIds: normalizedStudentIds,
    };
  }

  throw new Error("Invalid event scope");
}

export function getScopeLabel(scope) {
  if (scope?.scopeType === "student") {
    const studentCount = Array.isArray(scope?.studentIds)
      ? scope.studentIds.length
      : 0;
    return `${scope.course} Year ${scope.year} (${studentCount} selected student${studentCount === 1 ? "" : "s"})`;
  }

  if (scope?.scopeType === "courseYear") {
    return `${scope.course} Year ${scope.year}`;
  }

  if (scope?.scopeType === "course") {
    return `${scope.course} (all years)`;
  }

  return "all courses";
}

function getScopePriority(scopeType) {
  if (scopeType === "student") return 4;
  if (scopeType === "courseYear") return 3;
  if (scopeType === "course") return 2;
  return 1;
}

function buildApplicableScopeConditions(course, year, studentId) {
  const normalizedCourse = normalizeCourse(course);
  const normalizedYear = Number(year);
  const normalizedStudentId = String(studentId || "").trim();
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

  if (
    normalizedCourse &&
    Number.isFinite(normalizedYear) &&
    normalizedYear > 0 &&
    normalizedStudentId
  ) {
    conditions.push({
      scopeType: "student",
      course: normalizedCourse,
      year: normalizedYear,
      studentId: normalizedStudentId,
    });
  }

  return conditions;
}

export async function findApplicableHoliday({ date, course, year, studentId }) {
  if (!date) return null;

  const holidays = await Holiday.find({
    date,
    $or: buildApplicableScopeConditions(course, year, studentId),
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
      studentId: 1,
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
  studentId,
}) {
  const holidays = await Holiday.find({
    date: { $gte: fromDate, $lte: toDate },
    $or: buildApplicableScopeConditions(course, year, studentId),
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
      studentId: 1,
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

export async function getCalendarEndDateForContext({
  course,
  year,
  studentId,
}) {
  const todayISO = toISODate(new Date());

  const latestHoliday = await Holiday.findOne({
    date: { $gte: ATTENDANCE_START_DATE },
    $or: buildApplicableScopeConditions(course, year, studentId),
  })
    .sort({ date: -1 })
    .select({ date: 1 })
    .lean();

  if (latestHoliday?.date && latestHoliday.date > todayISO) {
    return latestHoliday.date;
  }

  return todayISO;
}

export function buildHolidayBulkOperations({
  dates,
  title,
  eventType,
  markedBy,
  scopeType,
  course,
  year,
  studentIds = [],
  fromDate,
  toDate,
}) {
  const normalizedStudentIds =
    scopeType === "student" ? normalizeStudentIds(studentIds) : [null];

  return dates.flatMap((date) =>
    normalizedStudentIds.map((studentId) => ({
      updateOne: {
        filter: {
          date,
          scopeType,
          course: course || "",
          year: year ?? null,
          studentId,
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
            studentId,
            markedBy,
          },
        },
        upsert: true,
      },
    }))
  );
}

export async function getHolidayMapForStudentsOnDate({
  date,
  course,
  year,
  studentIds,
}) {
  const normalizedCourse = normalizeCourse(course);
  const normalizedYear = Number(year);
  const normalizedStudentIds = normalizeStudentIds(studentIds);

  const studentHolidayMap = new Map();
  if (!date || !normalizedCourse || !normalizedStudentIds.length) {
    return studentHolidayMap;
  }

  const holidays = await Holiday.find({
    date,
    $or: [
      { scopeType: "global" },
      { scopeType: "course", course: normalizedCourse },
      { scopeType: "courseYear", course: normalizedCourse, year: normalizedYear },
      {
        scopeType: "student",
        course: normalizedCourse,
        year: normalizedYear,
        studentId: { $in: normalizedStudentIds },
      },
    ],
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
      studentId: 1,
    })
    .lean();

  let genericHoliday = null;

  holidays.forEach((holiday) => {
    if (holiday.scopeType === "student" && holiday.studentId) {
      const key = String(holiday.studentId);
      const existing = studentHolidayMap.get(key);
      if (
        !existing ||
        getScopePriority(holiday.scopeType) > getScopePriority(existing.scopeType)
      ) {
        studentHolidayMap.set(key, holiday);
      }
      return;
    }

    if (
      !genericHoliday ||
      getScopePriority(holiday.scopeType) > getScopePriority(genericHoliday.scopeType)
    ) {
      genericHoliday = holiday;
    }
  });

  if (genericHoliday) {
    normalizedStudentIds.forEach((studentId) => {
      if (!studentHolidayMap.has(studentId)) {
        studentHolidayMap.set(studentId, genericHoliday);
      }
    });
  }

  return studentHolidayMap;
}
