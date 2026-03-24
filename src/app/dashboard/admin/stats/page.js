"use client";

import { useEffect, useState } from "react";

const emptyStats = {
  totalStudents: 0,
  totalFaculty: 0,
  overallAttendanceRate: 0,
  studentsByCourse: [],
  studentsByYear: [],
  facultyByCourse: [],
  coursePerformance: [],
  newlyRegisteredStudents: 0,
  lowAttendanceStudents: 0,
  inactiveStudents: 0,
};

export default function AdminStatsPage() {
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/admin/stats", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || "Failed to load statistics");
        }

        setStats({
          totalStudents: data.totalStudents || 0,
          totalFaculty: data.totalFaculty || 0,
          overallAttendanceRate: data.overallAttendanceRate || 0,
          studentsByCourse: Array.isArray(data.studentsByCourse)
            ? data.studentsByCourse
            : [],
          studentsByYear: Array.isArray(data.studentsByYear)
            ? data.studentsByYear
            : [],
          facultyByCourse: Array.isArray(data.facultyByCourse)
            ? data.facultyByCourse
            : [],
          coursePerformance: Array.isArray(data.coursePerformance)
            ? data.coursePerformance
            : [],
          newlyRegisteredStudents: data.newlyRegisteredStudents || 0,
          lowAttendanceStudents: data.lowAttendanceStudents || 0,
          inactiveStudents: data.inactiveStudents || 0,
        });
      } catch (err) {
        setError(err.message || "Failed to load statistics");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Statistics & Analytics
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Live admin overview of students, faculty, and course performance
        </p>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Academic Overview
            </h2>
            <div className="text-sm text-gray-600">
              {loading ? "Loading latest data..." : "Updated from live records"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600">
              Overall Attendance Rate
            </h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {loading ? "..." : `${stats.overallAttendanceRate}%`}
            </p>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${stats.overallAttendanceRate}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Based on all marked attendance records
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600">Total Students</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {loading ? "..." : stats.totalStudents}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Students across all courses
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600">Total Faculty</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {loading ? "..." : stats.totalFaculty}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Faculty assigned to active courses
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600">
              Newly Registered Students
            </h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {loading ? "..." : stats.newlyRegisteredStudents}
            </p>
            <p className="text-sm text-gray-600 mt-1">Joined in the last 30 days</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600">
              Low Attendance Students
            </h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {loading ? "..." : stats.lowAttendanceStudents}
            </p>
            <p className="text-sm text-amber-600 mt-1">Below 75% attendance</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600">
              Inactive Students
            </h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {loading ? "..." : stats.inactiveStudents}
            </p>
            <p className="text-sm text-red-600 mt-1">
              No attendance in the last 30 days
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Course-wise Performance
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">
                    Course
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">
                    Students
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">
                    Faculty
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">
                    Faculty Names
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">
                    Avg. Attendance
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {(loading ? [] : stats.coursePerformance).map((row) => (
                  <tr key={row.course} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {row.course}
                    </td>
                    <td className="py-3 px-4 text-gray-700">{row.students}</td>
                    <td className="py-3 px-4 text-gray-700">{row.faculty}</td>
                    <td className="py-3 px-4 text-gray-700">
                      <div className="flex flex-wrap gap-2">
                        {row.facultyNames?.length > 0 ? (
                          row.facultyNames.map((faculty) => (
                            <span
                              key={faculty._id}
                              className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                            >
                              {faculty.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">
                            No faculty assigned
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-green-600 font-medium">
                      {row.attendanceRate}%
                    </td>
                  </tr>
                ))}
                {!loading && stats.coursePerformance.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-6 px-4 text-sm text-gray-500 text-center"
                    >
                      No course statistics found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Students by Year
            </h2>

            <div className="space-y-3">
              {(loading ? [] : stats.studentsByYear).map((item) => (
                <div
                  key={item.year}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Year {item.year}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.students?.slice(0, 4).map((s) => s.name).join(", ") ||
                        "No students"}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-violet-700">
                    {item.count}
                  </span>
                </div>
              ))}
              {!loading && stats.studentsByYear.length === 0 && (
                <p className="text-sm text-gray-500">No year data found.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Faculty by Course
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Assigned faculty members for each course
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>

            <div className="space-y-4">
              {(loading ? [] : stats.facultyByCourse).map((item) => (
                <div
                  key={item.course}
                  className="overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white"
                >
                  <div className="flex items-center justify-between border-b border-blue-100 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold tracking-wide text-gray-900">
                        {item.course}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Faculty assigned to this course
                      </p>
                    </div>
                    <span className="inline-flex min-w-10 justify-center rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                      {item.count}
                    </span>
                  </div>

                  <div className="px-4 py-3">
                    {item.faculty?.length > 0 ? (
                      <div className="space-y-2">
                        {item.faculty.map((faculty) => (
                          <div
                            key={faculty._id}
                            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {faculty.name}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {faculty.email}
                              </p>
                            </div>
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                              Faculty
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-gray-300 bg-white px-3 py-4 text-center text-sm text-gray-500">
                        No faculty assigned
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {!loading && stats.facultyByCourse.length === 0 && (
                <p className="text-sm text-gray-500">No faculty data found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
