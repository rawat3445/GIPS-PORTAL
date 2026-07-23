import {
  addDays,
  getHolidayMapForContext,
  isSunday,
  isWinterVacation,
  toISODate,
} from "./attendanceEvents";

export const STUDENT_LOGIN_ACCESS_START_DATE = "2026-05-06";
export const STUDENT_LOGIN_WORKING_DAYS_ALLOWED = 15;

function safeIsoDate(value) {
  const normalized = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : "";
}

function isWorkingAccessDate(date, holidayMap) {
  return !isSunday(date) && !isWinterVacation(date) && !holidayMap.has(date);
}

export function resolveEffectiveStudentWindowStartDate({
  storedWindowStartDate,
  resetAt: _resetAt,
  firstActivityAt,
  firstLoginAt,
}) {
  if (firstActivityAt) {
    return toISODate(new Date(firstActivityAt));
  }

  if (firstLoginAt) {
    return toISODate(new Date(firstLoginAt));
  }

  const normalizedStoredStartDate = safeIsoDate(storedWindowStartDate);

  if (normalizedStoredStartDate) {
    return normalizedStoredStartDate;
  }

  return "";
}

export async function resolveStudentLoginWindowEndDate({
  startDate,
  course,
  year,
  studentId,
  allowedWorkingDays = STUDENT_LOGIN_WORKING_DAYS_ALLOWED,
}) {
  const normalizedStartDate = safeIsoDate(startDate);
  const workingDaysLimit = Math.max(1, Number(allowedWorkingDays || 0));

  if (!normalizedStartDate) {
    return "";
  }

  let rangeDays = 45;

  while (rangeDays <= 365) {
    const toDate = addDays(normalizedStartDate, rangeDays);
    const holidayMap = await getHolidayMapForContext({
      fromDate: normalizedStartDate,
      toDate,
      course,
      year,
      studentId,
    });

    let cursor = normalizedStartDate;
    let countedWorkingDays = 0;

    while (cursor <= toDate) {
      if (isWorkingAccessDate(cursor, holidayMap)) {
        countedWorkingDays += 1;
        if (countedWorkingDays >= workingDaysLimit) {
          return cursor;
        }
      }

      cursor = addDays(cursor, 1);
    }

    rangeDays += 45;
  }

  return normalizedStartDate;
}

export async function evaluateStudentLoginAccess(user, todayISO = toISODate(new Date())) {
  const role = String(user?.role || "").toLowerCase();

  if (role !== "student") {
    return {
      applies: false,
      isBlocked: false,
      shouldInitializeWindow: false,
      todayISO,
      windowStartDate: "",
      windowEndDate: "",
      reason: "",
    };
  }

  if (todayISO < STUDENT_LOGIN_ACCESS_START_DATE) {
    return {
      applies: true,
      isBlocked: false,
      shouldInitializeWindow: false,
      todayISO,
      windowStartDate: "",
      windowEndDate: "",
      reason: "",
    };
  }

  const windowStartDate = resolveEffectiveStudentWindowStartDate({
    storedWindowStartDate: user?.studentLoginWindowStartDate,
    resetAt: user?.studentLoginResetAt,
    firstActivityAt: user?.studentLastActivityAt,
    firstLoginAt: user?.studentLastLoginAt,
  });

  if (Boolean(user?.studentLoginBlocked)) {
    return {
      applies: true,
      isBlocked: true,
      shouldInitializeWindow: false,
      todayISO,
      windowStartDate,
      windowEndDate: "",
      reason: "blocked",
    };
  }

  if (!windowStartDate) {
    return {
      applies: true,
      isBlocked: false,
      shouldInitializeWindow: true,
      todayISO,
      windowStartDate: "",
      windowEndDate: "",
      reason: "",
    };
  }

  const windowEndDate = await resolveStudentLoginWindowEndDate({
    startDate: windowStartDate,
    course: user?.course,
    year: user?.year,
    studentId: user?._id,
  });

  if (windowEndDate && todayISO > windowEndDate) {
    return {
      applies: true,
      isBlocked: true,
      shouldInitializeWindow: false,
      todayISO,
      windowStartDate,
      windowEndDate,
      reason: "expired",
    };
  }

  return {
    applies: true,
    isBlocked: false,
    shouldInitializeWindow: false,
    todayISO,
    windowStartDate,
    windowEndDate,
    reason: "",
  };
}
