import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import ActivityLog from "../../../models/ActivityLog";
import Attendance from "../../../models/Attendance";
import User from "../../../models/User";
import { requireAdmin } from "../../../lib/auth";
import {
  STUDENT_LOGIN_ACCESS_START_DATE,
  resolveEffectiveStudentWindowStartDate,
  resolveStudentLoginWindowEndDate,
} from "../../../lib/studentAccess";

const IST_TIME_ZONE = "Asia/Kolkata";
const DAY_MS = 24 * 60 * 60 * 1000;

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeLimit(value) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return 120;
  return Math.min(Math.max(parsed, 20), 300);
}

function normalizeWindow(value, fallback, min, max) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

async function buildExactUserStats() {
  const groupedCounts = await User.aggregate([
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
      },
    },
  ]);

  const stats = {
    total: 0,
    admin: 0,
    faculty: 0,
    student: 0,
  };

  groupedCounts.forEach((row) => {
    const role = String(row?._id || "").toLowerCase();
    const count = Number(row?.count || 0);

    stats.total += count;

    if (role === "admin" || role === "faculty" || role === "student") {
      stats[role] = count;
    }
  });

  return stats;
}

function getDatePartsInTimeZone(date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.formatToParts(date).reduce((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});
}

function getDateKeyInTimeZone(date) {
  const parts = getDatePartsInTimeZone(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function getDateFromDayKey(dayKey) {
  return new Date(`${dayKey}T00:00:00+05:30`);
}

function getRecentDayKeys(days) {
  return Array.from({ length: days }, (_, index) =>
    getDateKeyInTimeZone(new Date(Date.now() - index * DAY_MS)),
  );
}

function formatDayLabel(dayKey) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIME_ZONE,
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(getDateFromDayKey(dayKey));
}

function calculatePercentage(count, total) {
  if (!total) return 0;
  return Number(((Number(count || 0) / Number(total || 0)) * 100).toFixed(1));
}

function getDayDifferenceInTimeZone(fromDate, toDate = new Date()) {
  if (!fromDate) return null;

  const fromDayKey = getDateKeyInTimeZone(new Date(fromDate));
  const toDayKey = getDateKeyInTimeZone(new Date(toDate));

  return Math.max(
    0,
    Math.round(
      (getDateFromDayKey(toDayKey).getTime() -
        getDateFromDayKey(fromDayKey).getTime()) /
        DAY_MS,
    ),
  );
}

function calculateDaysSince(activityAt) {
  if (!activityAt) return null;
  return getDayDifferenceInTimeZone(activityAt);
}

function serializeAttendanceStudent(student, status) {
  return {
    studentId: String(student?._id || ""),
    name: String(student?.name || "").trim(),
    course: String(student?.course || "").trim(),
    year: Number(student?.year || 0),
    status,
  };
}

async function enrichAttendanceLog(log) {
  if (String(log?.actionType || "") !== "attendance_marked") {
    return log;
  }

  const metadata = log?.metadata && typeof log.metadata === "object" ? log.metadata : {};
  const presentStudents = Array.isArray(metadata.presentStudents)
    ? metadata.presentStudents
    : [];
  const absentStudents = Array.isArray(metadata.absentStudents)
    ? metadata.absentStudents
    : [];

  if (presentStudents.length > 0 || absentStudents.length > 0) {
    return log;
  }

  const attendanceId = String(metadata.attendanceId || "").trim();
  const fallbackCourse = String(metadata.course || "").trim().toUpperCase();
  const fallbackYear = Number(metadata.year || 0);
  const fallbackDate = String(metadata.date || "").trim();

  const attendanceDoc = attendanceId
    ? await Attendance.findById(attendanceId).lean()
    : await Attendance.findOne({
        course: fallbackCourse,
        year: fallbackYear,
        date: fallbackDate,
      }).lean();

  if (!attendanceDoc || !Array.isArray(attendanceDoc.records) || attendanceDoc.records.length === 0) {
    return log;
  }

  const studentIds = attendanceDoc.records
    .map((record) => String(record?.studentId || "").trim())
    .filter(Boolean);

  if (studentIds.length === 0) {
    return log;
  }

  const students = await User.find({ _id: { $in: studentIds } })
    .select("name course year")
    .lean();
  const studentMap = new Map(students.map((student) => [String(student._id), student]));

  const enrichedPresentStudents = [];
  const enrichedAbsentStudents = [];

  attendanceDoc.records.forEach((record) => {
    const studentId = String(record?.studentId || "").trim();
    const status = String(record?.status || "").trim().toLowerCase();
    const student = studentMap.get(studentId);
    if (!student) return;

    const serializedStudent = serializeAttendanceStudent(student, status);
    if (status === "present") {
      enrichedPresentStudents.push(serializedStudent);
    } else if (status === "absent") {
      enrichedAbsentStudents.push(serializedStudent);
    }
  });

  return {
    ...log,
    metadata: {
      ...metadata,
      submissionMode: metadata.submissionMode || "saved",
      presentCount: enrichedPresentStudents.length,
      absentCount: enrichedAbsentStudents.length,
      changedCount: Number(metadata.changedCount || 0),
      newlyMarkedCount:
        metadata.newlyMarkedCount !== undefined
          ? Number(metadata.newlyMarkedCount || 0)
          : attendanceDoc.records.length,
      recordCount:
        metadata.recordCount !== undefined
          ? Number(metadata.recordCount || 0)
          : attendanceDoc.records.length,
      presentStudents: enrichedPresentStudents,
      absentStudents: enrichedAbsentStudents,
      changedStudents: Array.isArray(metadata.changedStudents)
        ? metadata.changedStudents
        : [],
    },
  };
}

async function buildStudentLoginReport({ reportDays, inactiveDays }) {
  const today = new Date();
  const todayISO = getDateKeyInTimeZone(today);
  const dayKeys = getRecentDayKeys(reportDays);
  const oldestDayKey = dayKeys.at(-1);
  const reportStartDate = oldestDayKey
    ? getDateFromDayKey(oldestDayKey)
    : new Date(Date.now() - DAY_MS);

  const [studentUsers, dailyActivityRows, lastLoginRows] = await Promise.all([
    User.find({ role: "student" })
      .select(
        "name email course year studentLastLoginAt studentLastActivityAt studentLoginWindowStartDate studentLoginResetAt studentLoginBlocked studentLoginBlockedAt",
      )
      .sort({ course: 1, year: 1, name: 1 })
      .lean(),
    ActivityLog.aggregate([
      {
        $match: {
          actorRole: "student",
          actorId: { $ne: null },
          actionType: { $in: ["login", "logout"] },
          createdAt: { $gte: reportStartDate },
        },
      },
      {
        $group: {
          _id: {
            dayKey: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: IST_TIME_ZONE,
              },
            },
            actionType: "$actionType",
          },
          eventCount: { $sum: 1 },
          actorIds: { $addToSet: "$actorId" },
        },
      },
      {
        $project: {
          _id: 1,
          eventCount: 1,
          studentCount: { $size: "$actorIds" },
        },
      },
      {
        $sort: {
          "_id.dayKey": -1,
        },
      },
    ]),
    ActivityLog.aggregate([
      {
        $match: {
          actorRole: "student",
          actorId: { $ne: null },
          actionType: "login",
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $group: {
          _id: "$actorId",
          lastLoginAt: { $first: "$createdAt" },
        },
      },
    ]),
  ]);

  const totalStudents = studentUsers.length;
  const dailyCounts = new Map();

  dailyActivityRows.forEach((row) => {
    const dayKey = String(row?._id?.dayKey || "");
    const actionType = String(row?._id?.actionType || "");
    if (!dayKey || !actionType) return;

    const existing = dailyCounts.get(dayKey) || {
      login: { studentCount: 0, eventCount: 0 },
      logout: { studentCount: 0, eventCount: 0 },
    };

    existing[actionType] = {
      studentCount: Number(row?.studentCount || 0),
      eventCount: Number(row?.eventCount || 0),
    };
    dailyCounts.set(dayKey, existing);
  });

  const daily = dayKeys.map((dayKey) => {
    const entry = dailyCounts.get(dayKey) || {
      login: { studentCount: 0, eventCount: 0 },
      logout: { studentCount: 0, eventCount: 0 },
    };
    const loggedInCount = Number(entry.login?.studentCount || 0);
    const loggedOutCount = Number(entry.logout?.studentCount || 0);
    const loginEventCount = Number(entry.login?.eventCount || 0);
    const logoutEventCount = Number(entry.logout?.eventCount || 0);

    return {
      dayKey,
      label: formatDayLabel(dayKey),
      loggedInCount,
      loggedOutCount,
      loginEventCount,
      logoutEventCount,
      loginPercentage: calculatePercentage(loggedInCount, totalStudents),
      logoutPercentage: calculatePercentage(loggedOutCount, totalStudents),
    };
  });

  const todaySnapshot = daily[0] || {
    dayKey: todayISO,
    label: formatDayLabel(todayISO),
    loggedInCount: 0,
    loggedOutCount: 0,
    loginEventCount: 0,
    logoutEventCount: 0,
    loginPercentage: 0,
    logoutPercentage: 0,
  };

  const lastLoginMap = new Map(
    lastLoginRows.map((row) => [
      String(row._id),
      {
        lastLoginAt: row.lastLoginAt
          ? new Date(row.lastLoginAt).toISOString()
          : null,
      },
    ]),
  );

  const enrichedStudents = await Promise.all(
    studentUsers.map(async (student) => {
      const loginSummary = lastLoginMap.get(String(student._id)) || {};
      const lastLoginAt =
        loginSummary.lastLoginAt ||
        (student.studentLastLoginAt
          ? new Date(student.studentLastLoginAt).toISOString()
          : null);
      const lastActivityAt = student.studentLastActivityAt
        ? new Date(student.studentLastActivityAt).toISOString()
        : lastLoginAt;
      const lastActivityDate = lastActivityAt ? new Date(lastActivityAt) : null;
      const daysSinceLastActivity = calculateDaysSince(lastActivityDate);
      const effectiveWindowStartDate = resolveEffectiveStudentWindowStartDate({
        storedWindowStartDate: student.studentLoginWindowStartDate,
        resetAt: student.studentLoginResetAt,
        firstActivityAt: lastActivityAt,
        firstLoginAt: lastLoginAt,
      });
      const accessWindowEndDate = effectiveWindowStartDate
        ? await resolveStudentLoginWindowEndDate({
            startDate: effectiveWindowStartDate,
            course: student.course,
            year: student.year,
            studentId: student._id,
          })
        : "";
      const isBlocked = Boolean(student.studentLoginBlocked);
      const windowExpired =
        Boolean(accessWindowEndDate) && todayISO > accessWindowEndDate;
      const accessStatus = !effectiveWindowStartDate
        ? todayISO >= STUDENT_LOGIN_ACCESS_START_DATE
          ? "not_started"
          : "scheduled"
        : isBlocked
          ? "blocked"
          : windowExpired
            ? "expired"
            : "active";

      return {
        studentId: String(student._id),
        name: student.name || "Student",
        email: student.email || "",
        course: student.course || "",
        year: Number(student.year || 0),
        lastLoginAt,
        lastActivityAt,
        daysSinceLastActivity,
        isInactive:
          daysSinceLastActivity === null ||
          Number(daysSinceLastActivity) >= Number(inactiveDays),
        accessStatus,
        accessWindowStartDate: effectiveWindowStartDate || null,
        accessWindowEndDate: accessWindowEndDate || null,
        blockedAt: student.studentLoginBlockedAt
          ? new Date(student.studentLoginBlockedAt).toISOString()
          : null,
      };
    }),
  );

  const inactiveStudents = enrichedStudents
    .filter((student) => student.isInactive)
    .sort((a, b) => {
      if (!a.lastActivityAt && !b.lastActivityAt) {
        return a.name.localeCompare(b.name);
      }

      if (!a.lastActivityAt) return -1;
      if (!b.lastActivityAt) return 1;

      return (
        new Date(a.lastActivityAt).getTime() -
          new Date(b.lastActivityAt).getTime() ||
        a.name.localeCompare(b.name)
      );
    });

  const allStudents = [...enrichedStudents].sort((a, b) => {
    const accessPriority = {
      blocked: 0,
      expired: 1,
      active: 2,
      scheduled: 3,
    };
    const aPriority = accessPriority[a.accessStatus] ?? 9;
    const bPriority = accessPriority[b.accessStatus] ?? 9;

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    if (!a.lastActivityAt && !b.lastActivityAt) {
      return a.name.localeCompare(b.name);
    }

    if (!a.lastActivityAt) return -1;
    if (!b.lastActivityAt) return 1;

    return (
      new Date(b.lastActivityAt).getTime() -
        new Date(a.lastActivityAt).getTime() ||
      a.name.localeCompare(b.name)
    );
  });

  return {
    generatedAt: new Date().toISOString(),
    reportDays,
    inactiveDays,
    accessStartDate: STUDENT_LOGIN_ACCESS_START_DATE,
    totalStudents,
    today: todaySnapshot,
    daily,
    inactiveStudentCount: inactiveStudents.length,
    neverLoggedInCount: inactiveStudents.filter((student) => !student.lastLoginAt)
      .length,
    blockedStudentCount: enrichedStudents.filter(
      (student) =>
        student.accessStatus === "blocked" || student.accessStatus === "expired",
    ).length,
    activeWindowStudentCount: enrichedStudents.filter(
      (student) => student.accessStatus === "active",
    ).length,
    inactiveStudents: inactiveStudents.slice(0, 80),
    allStudents: allStudents.slice(0, 200),
  };
}

export async function GET(request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const role = String(searchParams.get("role") || "").trim().toLowerCase();
    const actionType = String(searchParams.get("actionType") || "")
      .trim()
      .toLowerCase();
    const search = String(searchParams.get("search") || "").trim();
    const limit = normalizeLimit(searchParams.get("limit"));
    const reportDays = normalizeWindow(searchParams.get("reportDays"), 7, 1, 30);
    const inactiveDays = normalizeWindow(
      searchParams.get("inactiveDays"),
      15,
      1,
      60,
    );

    const query = {};

    if (role) {
      query.actorRole = role;
    }

    if (actionType) {
      query.actionType = actionType;
    }

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), "i");
      query.$or = [
        { actorName: searchRegex },
        { actorEmail: searchRegex },
        { targetName: searchRegex },
        { targetEmail: searchRegex },
        { actionLabel: searchRegex },
        { details: searchRegex },
        { path: searchRegex },
      ];
    }

    const [rawLogs, studentLoginReport, exactUserStats] = await Promise.all([
      ActivityLog.find(query).sort({ createdAt: -1 }).limit(limit).lean(),
      buildStudentLoginReport({ reportDays, inactiveDays }),
      buildExactUserStats(),
    ]);

    const logs = await Promise.all(rawLogs.map((log) => enrichAttendanceLog(log)));

    return NextResponse.json({
      logs: JSON.parse(JSON.stringify(logs)),
      studentLoginReport,
      exactUserStats,
    });
  } catch (error) {
    console.error("GET ACTIVITY LOGS ERROR:", error);
    return NextResponse.json(
      { message: "Unable to load activity logs" },
      { status: 500 },
    );
  }
}
