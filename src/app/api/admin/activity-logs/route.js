import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import ActivityLog from "../../../models/ActivityLog";
import User from "../../../models/User";
import { requireAdmin } from "../../../lib/auth";

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

function calculateDaysSince(lastLoginAt) {
  if (!lastLoginAt) return null;
  return getDayDifferenceInTimeZone(lastLoginAt);
}

async function buildStudentLoginReport({ reportDays, inactiveDays }) {
  const dayKeys = getRecentDayKeys(reportDays);
  const oldestDayKey = dayKeys.at(-1);
  const reportStartDate = oldestDayKey
    ? getDateFromDayKey(oldestDayKey)
    : new Date(Date.now() - DAY_MS);

  const [studentUsers, dailyActivityRows, lastLoginRows] = await Promise.all([
    User.find({ role: "student" })
      .select("name email enrollmentNo course year")
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

  const today = daily[0] || {
    dayKey: getDateKeyInTimeZone(new Date()),
    label: formatDayLabel(getDateKeyInTimeZone(new Date())),
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
      row.lastLoginAt ? new Date(row.lastLoginAt).toISOString() : null,
    ]),
  );

  const inactiveStudents = studentUsers
    .map((student) => {
      const lastLoginAt = lastLoginMap.get(String(student._id)) || null;
      const lastLoginDate = lastLoginAt ? new Date(lastLoginAt) : null;
      const daysSinceLastLogin = calculateDaysSince(lastLoginDate);

      return {
        studentId: String(student._id),
        name: student.name || "Student",
        email: student.email || "",
        enrollmentNo: student.enrollmentNo || "",
        course: student.course || "",
        year: Number(student.year || 0),
        lastLoginAt,
        daysSinceLastLogin,
        isInactive:
          daysSinceLastLogin === null ||
          Number(daysSinceLastLogin) >= Number(inactiveDays),
      };
    })
    .filter((student) => student.isInactive)
    .sort((a, b) => {
      if (!a.lastLoginAt && !b.lastLoginAt) {
        return a.name.localeCompare(b.name);
      }

      if (!a.lastLoginAt) return -1;
      if (!b.lastLoginAt) return 1;

      return (
        new Date(a.lastLoginAt).getTime() - new Date(b.lastLoginAt).getTime() ||
        a.name.localeCompare(b.name)
      );
    });

  return {
    generatedAt: new Date().toISOString(),
    reportDays,
    inactiveDays,
    totalStudents,
    today,
    daily,
    inactiveStudentCount: inactiveStudents.length,
    neverLoggedInCount: inactiveStudents.filter((student) => !student.lastLoginAt)
      .length,
    inactiveStudents: inactiveStudents.slice(0, 80),
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
      7,
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

    const [logs, studentLoginReport, exactUserStats] = await Promise.all([
      ActivityLog.find(query).sort({ createdAt: -1 }).limit(limit).lean(),
      buildStudentLoginReport({ reportDays, inactiveDays }),
      buildExactUserStats(),
    ]);

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
