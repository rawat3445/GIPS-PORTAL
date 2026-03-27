import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import User from "../../../models/User";
import Attendance from "../../../models/Attendance";
import { buildStudentAttendancePerformanceList } from "../../../lib/attendancePerformance";
import { requireAdmin } from "../../../lib/auth";

function isoDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
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
        { $match: { date: { $gte: recentSince } } },
        { $unwind: "$records" },
        { $group: { _id: "$records.studentId" } },
      ]),
      User.find({ role: "student" })
        .select("name email course year enrollmentNo createdAt")
        .lean(),
    ]);

    const attendanceStudentsRaw = await buildStudentAttendancePerformanceList(
      allStudentDocs
    );
    const attendanceStudents = attendanceStudentsRaw.map((student) => ({
      ...formatStudent(student),
      attendancePercentage: student.attendancePercentage,
      markedDays: student.markedDays,
      presentDays: student.presentDays,
      workingDays: student.workingDays,
    }));

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

    const courseAttendanceMap = new Map();
    let overallPresentDays = 0;
    let overallWorkingDays = 0;

    attendanceStudents.forEach((student) => {
      const courseKey = student.course || "Unassigned";
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

    const coursePerformance = studentsByCourse.map((item) => ({
      course: item.course,
      students: item.count,
      faculty: item.facultyCount || 0,
      facultyNames: item.faculty || [],
      attendanceRate:
        (courseAttendanceMap.get(item.course)?.workingDays || 0) === 0
          ? 0
          : Number(
              (
                ((courseAttendanceMap.get(item.course)?.presentDays || 0) /
                  (courseAttendanceMap.get(item.course)?.workingDays || 1)) *
                100
              ).toFixed(1)
            ),
    }));

    const overallAttendanceRate =
      overallWorkingDays === 0
        ? 0
        : Number(((overallPresentDays / overallWorkingDays) * 100).toFixed(1));

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
