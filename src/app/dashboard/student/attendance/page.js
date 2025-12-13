"use client";
import { useState } from "react";

export default function StudentAttendancePage() {
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("december");

  const courses = [
    { id: "all", name: "All Courses" },
    { id: "1", name: "Data Structures" },
    { id: "2", name: "Database Management" },
    { id: "3", name: "Operating Systems" },
    { id: "4", name: "Computer Networks" },
    { id: "5", name: "Algorithm Lab" },
    { id: "6", name: "Web Development" },
  ];

  const attendanceData = [
    { course: "Data Structures", present: 37, total: 40, percentage: 92.5 },
    { course: "Database Management", present: 35, total: 40, percentage: 87.5 },
    { course: "Operating Systems", present: 38, total: 40, percentage: 95.0 },
    { course: "Computer Networks", present: 36, total: 40, percentage: 90.0 },
    { course: "Algorithm Lab", present: 19, total: 20, percentage: 95.0 },
    { course: "Web Development", present: 17, total: 20, percentage: 85.0 },
  ];

  const monthlyAttendance = [
    { date: "2025-12-01", course: "Data Structures", status: "present" },
    { date: "2025-12-01", course: "Operating Systems", status: "present" },
    { date: "2025-12-02", course: "Database Management", status: "present" },
    { date: "2025-12-02", course: "Computer Networks", status: "absent" },
    { date: "2025-12-03", course: "Data Structures", status: "present" },
    { date: "2025-12-03", course: "Operating Systems", status: "present" },
    { date: "2025-12-04", course: "Algorithm Lab", status: "present" },
    { date: "2025-12-05", course: "Web Development", status: "present" },
    { date: "2025-12-05", course: "Data Structures", status: "present" },
    { date: "2025-12-06", course: "Database Management", status: "absent" },
  ];

  const overallStats = {
    totalClasses: 200,
    totalPresent: 182,
    totalAbsent: 18,
    percentage: 91.0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
        <p className="text-sm text-gray-600 mt-1">
          Track your class attendance and records
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Overall Attendance
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {overallStats.percentage}%
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${overallStats.percentage}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Classes
                </p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {overallStats.totalClasses}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Classes Present
                </p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {overallStats.totalPresent}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Classes Absent
                </p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {overallStats.totalAbsent}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Course
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="december">December 2025</option>
                <option value="november">November 2025</option>
                <option value="october">October 2025</option>
                <option value="september">September 2025</option>
              </select>
            </div>
          </div>
        </div>

        {/* Course-wise Attendance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              Course-wise Attendance
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                    Course Name
                  </th>
                  <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">
                    Classes Held
                  </th>
                  <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">
                    Present
                  </th>
                  <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">
                    Absent
                  </th>
                  <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">
                    Percentage
                  </th>
                  <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attendanceData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {item.course}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center text-sm text-gray-900">
                      {item.total}
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-medium text-green-600">
                      {item.present}
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-medium text-red-600">
                      {item.total - item.present}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex flex-col items-center">
                        <span
                          className={`text-sm font-bold ${
                            item.percentage >= 90
                              ? "text-green-600"
                              : item.percentage >= 75
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {item.percentage}%
                        </span>
                        <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-1">
                          <div
                            className={`h-1.5 rounded-full ${
                              item.percentage >= 90
                                ? "bg-green-600"
                                : item.percentage >= 75
                                ? "bg-yellow-600"
                                : "bg-red-600"
                            }`}
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          item.percentage >= 75
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.percentage >= 75 ? "Good" : "Low"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Attendance Records */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Attendance Records
          </h2>
          <div className="space-y-3">
            {monthlyAttendance.map((record, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      record.status === "present"
                        ? "bg-green-100"
                        : "bg-red-100"
                    }`}
                  >
                    {record.status === "present" ? (
                      <svg
                        className="w-6 h-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-6 h-6 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {record.course}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(record.date).toLocaleDateString("en-IN", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    record.status === "present"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {record.status === "present" ? "Present" : "Absent"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Warning Notice */}
        {overallStats.percentage < 75 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-red-600 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-800">
                  Attendance Warning!
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Your attendance is below the required 75%. Please attend
                  classes regularly to avoid academic penalties.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
