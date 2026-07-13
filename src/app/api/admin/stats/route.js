import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import User from "../../../models/User";
import Attendance from "../../../models/Attendance";
import { requireAdmin } from "../../../lib/auth";
import { buildStudentAttendancePerformanceList } from "../../../lib/attendancePerformance";
import { evaluateStudentLoginAccess } from "../../../lib/studentAccess";
import { toISODate } from "../../../lib/attendanceEvents";

function isoDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function formatStudent(student) {
  return {
    _id: String(student._id),
    name: student.name || "Student",
    email: student.email || "",
    course: student.course || "",
    year: Number(student.year || 0) || "",
    createdAt: student.createdAt || null,
    studentLastLoginAt: student.studentLastLoginAt || null,
    studentLastActivityAt: student.studentLastActivityAt || null,
    studentLoginBlockedAt: student.studentLoginBlockedAt || null,
  };
}

function formatFaculty(faculty) {
  return {
    _id: String(faculty._id),
    name: faculty.name || "Faculty",
    email: faculty.email || "",
    assignedCourse: faculty.assignedCourse || "",
    facultyType: faculty.facultyType || "teaching",
    designation: faculty.designation || "",
  };
}

function getCourseKey(value) {
  return String(value || "").trim() || "Unassigned";
}

function getYearKey(value) {
  const year = Number(value || 0);
  return Number.isFinite(year) && year > 0 ? year : "N/A";
}

function roundToOne(value) {
  return Number(Number(value || 0).toFixed(1));
}

function daysSince(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
}

function isApprovedOrLegacyAttendance(doc) {
  return !doc?.approvalStatus || doc.approvalStatus === "approved";
}

function sortStudentsByName(list) {
  return [...list].sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    await connectDB();

    const todayISO = toISODate(new Date());
    const recentSince = isoDateDaysAgo(30);

    const [
      totalFaculty,
      allStudentDocs,
      allFacultyDocs,
      newlyRegisteredDocs,
      recentlyActiveGroups,
      todayAttendanceDocs,
    ] = await Promise.all([
      User.countDocuments({ role: "faculty" }),
      User.find({ role: "student" })
        .select(
          "name email course year createdAt studentLastLoginAt studentLastActivityAt studentLoginBlocked studentLoginBlockedAt studentLoginWindowStartDate studentLoginResetAt role",
        )
        .sort({ name: 1 })
        .lean(),
      User.find({ role: "faculty" })
        .select("name email assignedCourse facultyType designation")
        .sort({ name: 1 })
        .lean(),
      User.find({
        role: "student",
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      })
        .select(
          "name email course year createdAt studentLastLoginAt studentLastActivityAt studentLoginBlocked studentLoginBlockedAt",
        )
        .sort({ createdAt: -1 })
        .lean(),
      Attendance.aggregate([
        { $match: { date: { $gte: recentSince } } },
        { $unwind: "$records" },
        { $group: { _id: "$records.studentId" } },
      ]),
      Attendance.find({ date: todayISO })
        .select("course year date approvalStatus records")
        .lean(),
    ]);

    const totalStudents = allStudentDocs.length;
    const teachingFacultyDocs = allFacultyDocs.filter(
      (faculty) => faculty.facultyType !== "nonTeaching",
    );
    const totalTeachingFaculty = teachingFacultyDocs.length;
    const totalNonTeachingFaculty = Math.max(totalFaculty - totalTeachingFaculty, 0);

    const attendanceStudentsRaw = await buildStudentAttendancePerformanceList(
      allStudentDocs,
      { endDate: todayISO },
    );

    const attendanceStudents = attendanceStudentsRaw.map((student) => ({
      ...formatStudent(student),
      attendancePercentage: Number(student.attendancePercentage || 0),
      markedDays: Number(student.markedDays || 0),
      presentDays: Number(student.presentDays || 0),
      workingDays: Number(student.workingDays || 0),
      absentDays: Number(student.absentDays || 0),
    }));

    const blockedStudentResults = await Promise.all(
      allStudentDocs.map(async (student) => {
        const accessState = await evaluateStudentLoginAccess(student, todayISO);

        if (!accessState?.isBlocked) {
          return null;
        }

        return {
          ...formatStudent(student),
          accessStatus: accessState.reason === "expired" ? "expired" : "blocked",
          accessWindowStartDate: accessState.windowStartDate || null,
          accessWindowEndDate: accessState.windowEndDate || null,
          blockedAt: student.studentLoginBlockedAt
            ? new Date(student.studentLoginBlockedAt).toISOString()
            : null,
          daysSinceLastActivity: daysSince(student.studentLastActivityAt),
        };
      }),
    );

    const blockedStudentList = blockedStudentResults
      .filter(Boolean)
      .sort((a, b) => {
        const statusPriority = { blocked: 0, expired: 1 };
        const priorityGap =
          (statusPriority[a.accessStatus] ?? 9) - (statusPriority[b.accessStatus] ?? 9);

        if (priorityGap !== 0) return priorityGap;

        const aTime = a.blockedAt ? new Date(a.blockedAt).getTime() : 0;
        const bTime = b.blockedAt ? new Date(b.blockedAt).getTime() : 0;

        return bTime - aTime || a.name.localeCompare(b.name);
      });

    const blockedStudentsCount = blockedStudentList.length;

    const lowAttendanceStudentList = [...attendanceStudents]
      .filter((student) => student.markedDays > 0)
      .sort((a, b) => {
        if (a.attendancePercentage !== b.attendancePercentage) {
          return a.attendancePercentage - b.attendancePercentage;
        }

        return a.presentDays - b.presentDays || a.name.localeCompare(b.name);
      })
      .slice(0, 10);

    const highAttendanceStudentList = [...attendanceStudents]
      .filter((student) => student.markedDays > 0)
      .sort((a, b) => {
        if (a.attendancePercentage !== b.attendancePercentage) {
          return b.attendancePercentage - a.attendancePercentage;
        }

        return b.presentDays - a.presentDays || a.name.localeCompare(b.name);
      })
      .slice(0, 10);

    const atRiskStudents = attendanceStudents.filter(
      (student) => student.markedDays > 0 && student.attendancePercentage <= 50,
    );

    const activeIds = new Set(recentlyActiveGroups.map((item) => String(item._id)));
    const inactiveStudentList = allStudentDocs
      .filter((student) => !activeIds.has(String(student._id)))
      .map((student) => formatStudent(student))
      .sort((a, b) => {
        const aTime = a.studentLastActivityAt
          ? new Date(a.studentLastActivityAt).getTime()
          : 0;
        const bTime = b.studentLastActivityAt
          ? new Date(b.studentLastActivityAt).getTime()
          : 0;

        return aTime - bTime || a.name.localeCompare(b.name);
      });

    const facultyByCourseMap = new Map();
    teachingFacultyDocs.forEach((faculty) => {
      const courseKey = getCourseKey(faculty.assignedCourse);
      const current = facultyByCourseMap.get(courseKey) || [];
      current.push(formatFaculty(faculty));
      facultyByCourseMap.set(courseKey, current);
    });

    const studentByCourseMap = new Map();
    const studentByYearMap = new Map();
    const blockedByCourseMap = new Map();
    const courseAttendanceMap = new Map();

    blockedStudentList.forEach((student) => {
      const courseKey = getCourseKey(student.course);
      blockedByCourseMap.set(courseKey, (blockedByCourseMap.get(courseKey) || 0) + 1);
    });

    allStudentDocs.forEach((student) => {
      const formatted = formatStudent(student);
      const courseKey = getCourseKey(student.course);
      const yearKey = getYearKey(student.year);

      const courseStudents = studentByCourseMap.get(courseKey) || [];
      courseStudents.push(formatted);
      studentByCourseMap.set(courseKey, courseStudents);

      const yearStudents = studentByYearMap.get(yearKey) || [];
      yearStudents.push(formatted);
      studentByYearMap.set(yearKey, yearStudents);
    });

    let overallPresentDays = 0;
    let overallWorkingDays = 0;

    attendanceStudents.forEach((student) => {
      const courseKey = getCourseKey(student.course);
      const current = courseAttendanceMap.get(courseKey) || {
        presentDays: 0,
        workingDays: 0,
      };

      current.presentDays += Number(student.presentDays || 0);
      current.workingDays += Number(student.workingDays || 0);
      courseAttendanceMap.set(courseKey, current);

      overallPresentDays += Number(student.presentDays || 0);
      overallWorkingDays += Number(student.workingDays || 0);
    });

    const approvedTodayDocs = todayAttendanceDocs.filter(isApprovedOrLegacyAttendance);
    const pendingTodayDocs = todayAttendanceDocs.filter(
      (doc) => doc.approvalStatus === "pending",
    );
    const todayMarkedStudentIds = new Set();
    let todayPresentCount = 0;
    let todayAbsentCount = 0;

    const courseTodayMap = new Map();

    approvedTodayDocs.forEach((doc) => {
      const courseKey = getCourseKey(doc.course);
      const current = courseTodayMap.get(courseKey) || {
        markedStudents: 0,
        presentCount: 0,
        absentCount: 0,
      };

      (Array.isArray(doc.records) ? doc.records : []).forEach((record) => {
        const studentId = String(record.studentId || "");
        if (studentId) {
          todayMarkedStudentIds.add(studentId);
        }

        current.markedStudents += 1;

        if (record.status === "present") {
          current.presentCount += 1;
          todayPresentCount += 1;
        } else if (record.status === "absent") {
          current.absentCount += 1;
          todayAbsentCount += 1;
        }
      });

      courseTodayMap.set(courseKey, current);
    });

    const todayMarkedStudents = todayMarkedStudentIds.size;
    const todayAttendanceRate =
      todayMarkedStudents === 0
        ? 0
        : roundToOne((todayPresentCount / todayMarkedStudents) * 100);
    const overallAttendanceRate =
      overallWorkingDays === 0
        ? 0
        : roundToOne((overallPresentDays / overallWorkingDays) * 100);

    const sortedCourseKeys = Array.from(
      new Set([
        ...studentByCourseMap.keys(),
        ...facultyByCourseMap.keys(),
        ...courseAttendanceMap.keys(),
        ...courseTodayMap.keys(),
        ...blockedByCourseMap.keys(),
      ]),
    ).sort((a, b) => a.localeCompare(b));

    const courseHighlights = sortedCourseKeys.map((course) => {
      const students = sortStudentsByName(studentByCourseMap.get(course) || []);
      const faculty = facultyByCourseMap.get(course) || [];
      const overallStats = courseAttendanceMap.get(course) || {
        presentDays: 0,
        workingDays: 0,
      };
      const todayStats = courseTodayMap.get(course) || {
        markedStudents: 0,
        presentCount: 0,
        absentCount: 0,
      };

      return {
        course,
        totalStudents: students.length,
        facultyCount: faculty.length,
        faculty,
        blockedStudents: blockedByCourseMap.get(course) || 0,
        studentsPreview: students.slice(0, 4),
        todayMarkedStudents: todayStats.markedStudents,
        todayPresentCount: todayStats.presentCount,
        todayAbsentCount: todayStats.absentCount,
        todayAttendanceRate:
          todayStats.markedStudents === 0
            ? 0
            : roundToOne((todayStats.presentCount / todayStats.markedStudents) * 100),
        overallAttendanceRate:
          overallStats.workingDays === 0
            ? 0
            : roundToOne((overallStats.presentDays / overallStats.workingDays) * 100),
      };
    });

    const studentsByCourse = courseHighlights.map((item) => ({
      course: item.course,
      count: item.totalStudents,
      facultyCount: item.facultyCount,
      faculty: item.faculty,
      students: sortStudentsByName(studentByCourseMap.get(item.course) || []),
    }));

    const studentsByYear = Array.from(studentByYearMap.entries())
      .sort((a, b) => {
        if (a[0] === "N/A") return 1;
        if (b[0] === "N/A") return -1;
        return Number(a[0]) - Number(b[0]);
      })
      .map(([year, students]) => ({
        year,
        count: students.length,
        students: sortStudentsByName(students),
      }));

    const facultyByCourse = sortedCourseKeys.map((course) => ({
      course,
      count: (facultyByCourseMap.get(course) || []).length,
      faculty: facultyByCourseMap.get(course) || [],
    }));

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      todayISO,
      totalStudents,
      totalFaculty,
      totalTeachingFaculty,
      totalNonTeachingFaculty,
      overallAttendanceRate,
      coursePerformance: courseHighlights.map((item) => ({
        course: item.course,
        students: item.totalStudents,
        faculty: item.facultyCount,
        facultyNames: item.faculty,
        attendanceRate: item.overallAttendanceRate,
      })),
      todayAttendance: {
        date: todayISO,
        markedStudents: todayMarkedStudents,
        presentCount: todayPresentCount,
        absentCount: todayAbsentCount,
        unmarkedStudents: Math.max(totalStudents - todayMarkedStudents, 0),
        attendanceRate: todayAttendanceRate,
        approvedCourseEntries: approvedTodayDocs.length,
        pendingCourseEntries: pendingTodayDocs.length,
      },
      courseHighlights,
      blockedStudentsCount,
      blockedStudentList,
      highestAttendanceStudents: highAttendanceStudentList.length,
      highestAttendanceStudentList: highAttendanceStudentList,
      lowestAttendanceStudents: lowAttendanceStudentList.length,
      lowestAttendanceStudentList: lowAttendanceStudentList,
      lowAttendanceStudents: atRiskStudents.length,
      lowAttendanceStudentList: atRiskStudents
        .sort((a, b) => {
          if (a.attendancePercentage !== b.attendancePercentage) {
            return a.attendancePercentage - b.attendancePercentage;
          }

          return a.presentDays - b.presentDays || a.name.localeCompare(b.name);
        })
        .slice(0, 10),
      inactiveStudents: inactiveStudentList.length,
      inactiveStudentList,
      inactiveStudentsNote: "No attendance record in the last 30 days",
      newlyRegisteredStudents: newlyRegisteredDocs.length,
      newlyRegisteredStudentList: newlyRegisteredDocs.map(formatStudent),
      studentsByCourse,
      studentsByYear,
      facultyByCourse,
    });
  } catch (error) {
    console.error("ADMIN STATS ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: 500 },
    );
  }
}
