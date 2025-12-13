"use client";
import { useState } from "react";

export default function StudentAssignmentsPage() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState("all");

  const courses = [
    { id: "all", name: "All Courses" },
    { id: "1", name: "Data Structures" },
    { id: "2", name: "Database Management" },
    { id: "3", name: "Operating Systems" },
    { id: "4", name: "Computer Networks" },
    { id: "5", name: "Algorithm Lab" },
    { id: "6", name: "Web Development" },
  ];

  const assignments = [
    {
      id: 1,
      title: "Binary Tree Implementation",
      course: "Data Structures",
      dueDate: "2025-12-15",
      submittedDate: null,
      status: "pending",
      totalMarks: 100,
      obtainedMarks: null,
      description:
        "Implement binary tree with insertion, deletion, and traversal operations.",
      attachments: ["assignment_3.pdf"],
    },
    {
      id: 2,
      title: "SQL Queries Practice",
      course: "Database Management",
      dueDate: "2025-12-20",
      submittedDate: null,
      status: "pending",
      totalMarks: 100,
      obtainedMarks: null,
      description: "Write SQL queries for the given database schema.",
      attachments: ["dbms_assignment_2.pdf"],
    },
    {
      id: 3,
      title: "Process Scheduling Algorithms",
      course: "Operating Systems",
      dueDate: "2025-12-25",
      submittedDate: null,
      status: "pending",
      totalMarks: 100,
      obtainedMarks: null,
      description:
        "Implement FCFS, SJF, and Round Robin scheduling algorithms.",
      attachments: ["os_assignment_4.pdf"],
    },
    {
      id: 4,
      title: "Sorting Algorithm Analysis",
      course: "Algorithm Lab",
      dueDate: "2025-12-08",
      submittedDate: "2025-12-07",
      status: "graded",
      totalMarks: 100,
      obtainedMarks: 95,
      description: "Analyze time complexity of various sorting algorithms.",
      attachments: ["algo_assignment_1.pdf"],
    },
    {
      id: 5,
      title: "Network Protocol Design",
      course: "Computer Networks",
      dueDate: "2025-12-05",
      submittedDate: "2025-12-04",
      status: "graded",
      totalMarks: 100,
      obtainedMarks: 88,
      description: "Design a simple network protocol for data transmission.",
      attachments: ["cn_assignment_2.pdf"],
    },
    {
      id: 6,
      title: "Responsive Website Design",
      course: "Web Development",
      dueDate: "2025-12-18",
      submittedDate: "2025-12-10",
      status: "submitted",
      totalMarks: 100,
      obtainedMarks: null,
      description:
        "Create a responsive website using HTML, CSS, and JavaScript.",
      attachments: ["web_assignment_3.pdf"],
    },
  ];

  const filteredAssignments = assignments.filter((assignment) => {
    const statusMatch =
      filterStatus === "all" || assignment.status === filterStatus;
    const courseMatch =
      selectedCourse === "all" ||
      assignment.course === courses.find((c) => c.id === selectedCourse)?.name;
    return statusMatch && courseMatch;
  });

  const getDaysRemaining = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (assignment) => {
    if (assignment.status === "graded") {
      return (
        <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
          Graded - {assignment.obtainedMarks}/{assignment.totalMarks}
        </span>
      );
    } else if (assignment.status === "submitted") {
      return (
        <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
          Submitted - Pending Review
        </span>
      );
    } else {
      const daysLeft = getDaysRemaining(assignment.dueDate);
      if (daysLeft < 0) {
        return (
          <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
            Overdue
          </span>
        );
      } else if (daysLeft <= 3) {
        return (
          <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
            Due in {daysLeft} day{daysLeft !== 1 ? "s" : ""}
          </span>
        );
      } else if (daysLeft <= 7) {
        return (
          <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
            Due in {daysLeft} days
          </span>
        );
      } else {
        return (
          <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            Due in {daysLeft} days
          </span>
        );
      }
    }
  };

  const stats = {
    total: assignments.length,
    pending: assignments.filter((a) => a.status === "pending").length,
    submitted: assignments.filter((a) => a.status === "submitted").length,
    graded: assignments.filter((a) => a.status === "graded").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">My Assignments</h1>
        <p className="text-sm text-gray-600 mt-1">
          View and submit your course assignments
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Assignments
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.total}
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {stats.pending}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Submitted</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {stats.submitted}
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Graded</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats.graded}
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="submitted">Submitted</option>
                <option value="graded">Graded</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Course
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
                Search Assignment
              </label>
              <input
                type="text"
                placeholder="Search by title..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Assignments List */}
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => (
            <div
              key={assignment.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {assignment.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {assignment.course}
                          </p>
                        </div>
                        {getStatusBadge(assignment)}
                      </div>

                      <p className="text-sm text-gray-600 mt-3">
                        {assignment.description}
                      </p>

                      <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span>
                            Due:{" "}
                            {new Date(assignment.dueDate).toLocaleDateString(
                              "en-IN"
                            )}
                          </span>
                        </div>

                        {assignment.submittedDate && (
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-green-600"
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
                            <span>
                              Submitted:{" "}
                              {new Date(
                                assignment.submittedDate
                              ).toLocaleDateString("en-IN")}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                            />
                          </svg>
                          <span>
                            {assignment.attachments.length} attachment(s)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-4">
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                          <svg
                            className="w-4 h-4"
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
                          View Details
                        </button>

                        {assignment.status === "pending" && (
                          <button className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition flex items-center gap-2">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                              />
                            </svg>
                            Submit Assignment
                          </button>
                        )}

                        <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                          Download PDF
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredAssignments.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-gray-600">
              No assignments found matching your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
