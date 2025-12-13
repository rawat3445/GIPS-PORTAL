export default function StudentDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">
          Welcome back, Rahul Sharma! 👋
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Attendance</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">92.5%</p>
                <p className="text-xs text-green-600 mt-1">
                  Above required 75%
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
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Pending Tasks
                </p>
                <p className="text-3xl font-bold text-orange-600 mt-2">3</p>
                <p className="text-xs text-gray-500 mt-1">Assignments due</p>
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
                <p className="text-sm font-medium text-gray-600">
                  Overall CGPA
                </p>
                <p className="text-3xl font-bold text-blue-600 mt-2">8.4</p>
                <p className="text-xs text-gray-500 mt-1">Out of 10</p>
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0h-2"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Courses
                </p>
                <p className="text-3xl font-bold text-purple-600 mt-2">6</p>
                <p className="text-xs text-gray-500 mt-1">This semester</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-600"
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
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Classes */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Today&apos;s Classes
              </h2>
              <span className="text-xs text-gray-500">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 bg-blue-50 border-l-4 border-blue-600 rounded-lg">
                <div className="text-center">
                  <p className="text-sm font-bold text-blue-600">9:00 AM</p>
                  <p className="text-xs text-gray-500">1 hour</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    Data Structures
                  </p>
                  <p className="text-xs text-gray-600">
                    Dr. Rajesh Kumar • Room 201
                  </p>
                </div>
                <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded">
                  Now
                </span>
              </div>

              <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-600">11:00 AM</p>
                  <p className="text-xs text-gray-500">1.5 hours</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    Database Management
                  </p>
                  <p className="text-xs text-gray-600">
                    Prof. Meera Sharma • Room 105
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-600">2:00 PM</p>
                  <p className="text-xs text-gray-500">2 hours</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    Algorithm Lab
                  </p>
                  <p className="text-xs text-gray-600">
                    Dr. Amit Singh • Lab 3
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-600">4:00 PM</p>
                  <p className="text-xs text-gray-500">1 hour</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    Operating Systems
                  </p>
                  <p className="text-xs text-gray-600">
                    Prof. Sunita Patel • Room 302
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Assignments & Notices */}
          <div className="space-y-6">
            {/* Upcoming Assignments */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Upcoming Assignments
              </h2>
              <div className="space-y-3">
                <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded">
                  <p className="text-sm font-medium text-gray-900">
                    Binary Tree Implementation
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Data Structures • Due: Dec 15
                  </p>
                  <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                    Due in 3 days
                  </span>
                </div>

                <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                  <p className="text-sm font-medium text-gray-900">
                    SQL Queries Practice
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    DBMS • Due: Dec 20
                  </p>
                  <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                    Due in 8 days
                  </span>
                </div>

                <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
                  <p className="text-sm font-medium text-gray-900">
                    Scheduling Algorithms
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Operating Systems • Due: Dec 25
                  </p>
                  <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                    Due in 13 days
                  </span>
                </div>
              </div>
              <a
                href="/dashboard/student/assignments"
                className="block mt-4 text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All Assignments →
              </a>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="space-y-2">
                <a
                  href="/dashboard/student/attendance"
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition"
                >
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
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">
                    View Attendance
                  </span>
                </a>

                <a
                  href="/dashboard/student/results"
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition"
                >
                  <svg
                    className="w-5 h-5 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0h-2"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">
                    Check Results
                  </span>
                </a>

                <a
                  href="/dashboard/student/fees"
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition"
                >
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">
                    Pay Fees
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Notices */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Notices & Announcements
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Mid-term Examination Schedule Released
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  The mid-term exams will begin from December 20, 2025. Please
                  check the detailed schedule on the notice board.
                </p>
                <p className="text-xs text-gray-500 mt-2">Posted 2 hours ago</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-yellow-50 rounded-lg">
              <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Library Holiday Notice
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  The college library will remain closed on Sunday, December 14,
                  2025 for maintenance work.
                </p>
                <p className="text-xs text-gray-500 mt-2">Posted yesterday</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  New Study Materials Available
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Study materials for Data Structures Unit 3 have been uploaded.
                  Check the Courses section.
                </p>
                <p className="text-xs text-gray-500 mt-2">Posted 2 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
