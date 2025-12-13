"use client";
import { useState } from "react";

export default function GradeAssignmentsPage() {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const courses = [
    { id: "1", name: "Data Structures" },
    { id: "2", name: "Database Management" },
    { id: "3", name: "Algorithm Lab" },
  ];

  const assignments = [
    {
      id: 1,
      student: "Rahul Sharma",
      rollNo: "CS001",
      assignment: "Binary Tree Implementation",
      submittedDate: "2025-12-10",
      status: "pending",
      score: null,
    },
    {
      id: 2,
      student: "Priya Singh",
      rollNo: "CS002",
      assignment: "Binary Tree Implementation",
      submittedDate: "2025-12-09",
      status: "graded",
      score: 95,
    },
    {
      id: 3,
      student: "Amit Kumar",
      rollNo: "CS003",
      assignment: "Binary Tree Implementation",
      submittedDate: "2025-12-11",
      status: "pending",
      score: null,
    },
    {
      id: 4,
      student: "Sneha Patel",
      rollNo: "CS004",
      assignment: "Binary Tree Implementation",
      submittedDate: "2025-12-08",
      status: "graded",
      score: 88,
    },
    {
      id: 5,
      student: "Vikram Yadav",
      rollNo: "CS005",
      assignment: "Binary Tree Implementation",
      submittedDate: "2025-12-10",
      status: "pending",
      score: null,
    },
  ];

  const filteredAssignments = assignments.filter((assignment) => {
    if (filterStatus === "all") return true;
    return assignment.status === filterStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Grade Assignments</h1>
        <p className="text-sm text-gray-600 mt-1">
          Review and grade student submissions
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600">Total Submissions</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {assignments.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600">Pending Review</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {assignments.filter((a) => a.status === "pending").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600">Graded</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {assignments.filter((a) => a.status === "graded").length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Course
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="graded">Graded</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Student
              </label>
              <input
                type="text"
                placeholder="Search by name or roll no..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Assignments Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              Assignment Submissions
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                    Roll No
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                    Student Name
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                    Assignment
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                    Submitted Date
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                    Score
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                    Status
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAssignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6 text-sm font-medium text-gray-900">
                      {assignment.rollNo}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-indigo-600">
                            {assignment.student.charAt(0)}
                          </span>
                        </div>
                        <span className="text-sm text-gray-900">
                          {assignment.student}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {assignment.assignment}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {new Date(assignment.submittedDate).toLocaleDateString(
                        "en-IN"
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {assignment.score !== null ? (
                        <span className="text-sm font-semibold text-gray-900">
                          {assignment.score}/100
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          assignment.status === "graded"
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {assignment.status === "graded" ? "Graded" : "Pending"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                          title="View Submission"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </button>
                        {assignment.status === "pending" ? (
                          <button className="px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 transition">
                            Grade Now
                          </button>
                        ) : (
                          <button className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-300 transition">
                            Edit Grade
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
