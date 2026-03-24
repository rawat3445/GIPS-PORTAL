import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import User from "../../../models/User";
import Attendance from "../../../models/Attendance";
import Holiday from "../../../models/Holiday";
import { requireAdmin } from "../../../lib/auth";

const ATTENDANCE_START_DATE = "2026-01-01";
const WINTER_VACATION_FROM = "2026-01-01";
const WINTER_VACATION_TO = "2026-01-18";

function isoDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function toISODate(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

function parseISODate(dateString) {
  return new Date(`${dateString}T00:00:00`);
}

function addDays(dateString, days) {
  const date = parseISODate(dateString);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

function isSunday(dateString) {
  return parseISODate(dateString).getDay() === 0;
}

function isWinterVacation(dateString) {
  return dateString >= WINTER_VACATION_FROM && dateString <= WINTER_VACATION_TO;
}

function countWorkingDays(fromDate, toDate, holidaySet) {
  if (!fromDate || fromDate > toDate) return 0;

  let total = 0;
  let cursor = fromDate;

  while (cursor <= toDate) {
    if (
      !isWinterVacation(cursor) &&
      !isSunday(cursor) &&
      !holidaySet.has(cursor)
    ) {
      total += 1;
    }

    cursor = addDays(cursor, 1);
  }

  return total;
}

function formatStudent(student) {
  return {
    _id: String(student._id),
    name: student.name,
    email: student.email,
    course: student.course || "",
    year: student.year || "",
    enrollmentNo: student.enrollmentNo || "",
    createdAt: student.createdAt || null,
  };
}

function formatFaculty(faculty) {
  return {
    _id: String(faculty._id),
    name: faculty.name,
    email: faculty.email,
    assignedCourse: faculty.assignedCourse || "",
  };
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    await connectDB();

    const recentSince = isoDateDaysAgo(30);

    const [
      totalStudents,
      totalFaculty,
      studentsByCourseRaw,
      studentsByYearRaw,
      facultyByCourseRaw,
      newlyRegisteredDocs,
      attendancePerformanceRaw,
      recentlyActiveGroups,
      allStudentDocs,
    ] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "faculty" }),
      User.aggregate([
        { $match: { role: "student" } },
        { $group: { _id: "$course", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: { role: "student" } },
        { $group: { _id: "$year", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: { role: "faculty" } },
        { $group: { _id: "$assignedCourse", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      User.find({
        role: "student",
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      })
        .select("name email course year enrollmentNo createdAt")
        .sort({ createdAt: -1 })
        .lean(),
      Attendance.aggregate([
        { $unwind: "$records" },
        {
          $group: {
            _id: "$records.studentId",
            marked: { $sum: 1 },
            present: {
              $sum: {
                $cond: [{ $eq: ["$records.status", "present"] }, 1, 0],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Attendance.aggregate([
        { $match: { date: { $gte: recentSince } } },
        { $unwind: "$records" },
        { $group: { _id: "$records.studentId" } },
      ]),
      User.find({ role: "student" })
        .select("name email course year enrollmentNo createdAt")
        .lean(),
    ]);

    const attendanceByCourseRaw = await Attendance.aggregate([
      { $unwind: "$records" },
      {
        $group: {
          _id: "$course",
          totalMarked: { $sum: 1 },
          presentCount: {
            $sum: {
              $cond: [{ $eq: ["$records.status", "present"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          attendanceRate: {
            $multiply: [
              {
                $cond: [
                  { $eq: ["$totalMarked", 0] },
                  0,
                  { $divide: ["$presentCount", "$totalMarked"] },
                ],
              },
              100,
            ],
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const todayISO = toISODate(new Date());
    const holidayDocs = await Holiday.find({
      date: { $gte: ATTENDANCE_START_DATE, $lte: todayISO },
    })
      .select("date")
      .lean();
    const holidaySet = new Set(holidayDocs.map((holiday) => holiday.date));

    const attendancePerformanceMap = new Map(
      attendancePerformanceRaw.map((item) => [
        String(item._id),
        { present: item.present || 0, marked: item.marked || 0 },
      ])
    );

    const attendanceStudents = allStudentDocs.map((student) => {
      const performance = attendancePerformanceMap.get(String(student._id)) || {
        present: 0,
        marked: 0,
      };
      const workingDays = countWorkingDays(
        ATTENDANCE_START_DATE,
        todayISO,
        holidaySet
      );
      const attendancePercentage =
        performance.marked === 0
          ? 0
          : Number(
              ((performance.present / performance.marked) * 100).toFixed(1)
            );

      return {
        ...formatStudent(student),
        attendancePercentage,
        markedDays: performance.marked,
        presentDays: performance.present,
        workingDays,
      };
    });

    const lowAttendanceStudents = attendanceStudents
      .filter(
        (student) => student.markedDays > 0 && student.attendancePercentage <= 50
      )
      .sort((a, b) => {
        if (a.attendancePercentage !== b.attendancePercentage) {
          return a.attendancePercentage - b.attendancePercentage;
        }
        return a.presentDays - b.presentDays;
      });

    const highestAttendanceStudents = attendanceStudents
      .filter(
        (student) => student.markedDays > 0 && student.attendancePercentage >= 75
      )
      .sort((a, b) => {
        if (a.attendancePercentage !== b.attendancePercentage) {
          return b.attendancePercentage - a.attendancePercentage;
        }
        return b.presentDays - a.presentDays;
      })
      .slice(0, 10);

    const topAttendanceDebugList = [...attendanceStudents]
      .sort((a, b) => {
        if (a.attendancePercentage !== b.attendancePercentage) {
          return b.attendancePercentage - a.attendancePercentage;
        }
        return b.presentDays - a.presentDays;
      })
      .slice(0, 10);

    const activeIds = recentlyActiveGroups.map((item) => item._id);
    const inactiveQuery = {
      role: "student",
      ...(activeIds.length > 0 ? { _id: { $nin: activeIds } } : {}),
    };

    const inactiveStudentDocs = await User.find(inactiveQuery)
      .select("name email course year enrollmentNo createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const facultyDocs = await User.find({ role: "faculty" })
      .select("name email assignedCourse")
      .sort({ name: 1 })
      .lean();

    const facultyByCourseMap = new Map();
    facultyDocs.forEach((faculty) => {
      const courseKey = faculty.assignedCourse || "Unassigned";
      const current = facultyByCourseMap.get(courseKey) || [];
      current.push(formatFaculty(faculty));
      facultyByCourseMap.set(courseKey, current);
    });

    const studentsByCourse = await Promise.all(
      studentsByCourseRaw.map(async (item) => {
        const students = await User.find({
          role: "student",
          course: item._id,
        })
          .select("name email course year enrollmentNo")
          .sort({ name: 1 })
          .lean();

        return {
          course: item._id || "Unassigned",
          count: item.count,
          facultyCount: facultyByCourseMap.get(item._id || "Unassigned")?.length || 0,
          faculty: facultyByCourseMap.get(item._id || "Unassigned") || [],
          students: students.map(formatStudent),
        };
      })
    );

    const studentsByYear = await Promise.all(
      studentsByYearRaw.map(async (item) => {
        const students = await User.find({
          role: "student",
          year: item._id,
        })
          .select("name email course year enrollmentNo")
          .sort({ name: 1 })
          .lean();

        return {
          year: item._id || "N/A",
          count: item.count,
          students: students.map(formatStudent),
        };
      })
    );

    const attendanceRateMap = new Map(
      attendanceByCourseRaw.map((item) => [
        item._id || "Unassigned",
        Number(item.attendanceRate.toFixed(1)),
      ])
    );

    const coursePerformance = studentsByCourse.map((item) => ({
      course: item.course,
      students: item.count,
      faculty: item.facultyCount || 0,
      facultyNames: item.faculty || [],
      attendanceRate: attendanceRateMap.get(item.course) || 0,
    }));

    const overallAttendanceRate =
      attendanceByCourseRaw.length === 0
        ? 0
        : Number(
            (
              attendanceByCourseRaw.reduce(
                (sum, item) => sum + Number(item.attendanceRate || 0),
                0
              ) / attendanceByCourseRaw.length
            ).toFixed(1)
          );

    return NextResponse.json({
      totalStudents,
      totalFaculty,
      overallAttendanceRate,
      coursePerformance,
      studentsByCourse,
      studentsByYear,
      facultyByCourse: facultyByCourseRaw.map((item) => ({
        course: item._id || "Unassigned",
        count: item.count,
        faculty: facultyByCourseMap.get(item._id || "Unassigned") || [],
      })),
      newlyRegisteredStudents: newlyRegisteredDocs.length,
      newlyRegisteredStudentList: newlyRegisteredDocs.map(formatStudent),
      highestAttendanceStudents: highestAttendanceStudents.length,
      highestAttendanceStudentList: highestAttendanceStudents,
      topAttendanceDebugList,
      lowAttendanceStudents: lowAttendanceStudents.length,
      lowAttendanceStudentList: lowAttendanceStudents,
      inactiveStudents: inactiveStudentDocs.length,
      inactiveStudentList: inactiveStudentDocs.map(formatStudent),
      inactiveStudentsNote: "No attendance record in the last 30 days",
    });
  } catch (error) {
    console.error("ADMIN STATS ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: 500 }
    );
  }
}
