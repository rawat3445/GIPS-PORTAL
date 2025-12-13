export default function FacultyDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Faculty Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">
          Welcome back, Dr. Rajesh Kumar!
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">My Courses</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">5</p>
                <p className="text-xs text-gray-500 mt-1">Active courses</p>
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
                  Total Students
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">245</p>
                <p className="text-xs text-gray-500 mt-1">Across all courses</p>
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
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Pending Grades
                </p>
                <p className="text-3xl font-bold text-orange-600 mt-2">12</p>
                <p className="text-xs text-gray-500 mt-1">
                  Assignments to grade
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Avg. Attendance
                </p>
                <p className="text-3xl font-bold text-green-600 mt-2">89%</p>
                <p className="text-xs text-gray-500 mt-1">This month</p>
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
        </div>

        {/* Today's Schedule & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Classes */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Today&apos;s Schedule
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                <div className="text-center">
                  <p className="text-sm font-bold text-indigo-600">9:00 AM</p>
                  <p className="text-xs text-gray-500">1 hour</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    Data Structures
                  </p>
                  <p className="text-xs text-gray-600">
                    CSE 3rd Year - Room 201
                  </p>
                </div>
                <button className="px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 transition">
                  Mark Attendance
                </button>
              </div>

              <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                <div className="text-center">
                  <p className="text-sm font-bold text-indigo-600">11:00 AM</p>
                  <p className="text-xs text-gray-500">1.5 hours</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    Database Management
                  </p>
                  <p className="text-xs text-gray-600">
                    CSE 2nd Year - Room 105
                  </p>
                </div>
                <button className="px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 transition">
                  Mark Attendance
                </button>
              </div>

              <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                <div className="text-center">
                  <p className="text-sm font-bold text-indigo-600">2:00 PM</p>
                  <p className="text-xs text-gray-500">1 hour</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    Algorithm Lab
                  </p>
                  <p className="text-xs text-gray-600">CSE 3rd Year - Lab 3</p>
                </div>
                <button className="px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 transition">
                  Mark Attendance
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <a
                href="/dashboard/faculty/mark-attendance"
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition group"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition">
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
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Mark Attendance
                  </p>
                  <p className="text-xs text-gray-500">Today&apos;s classes</p>
                </div>
              </a>

              <a
                href="/dashboard/faculty/grade-assignments"
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition group"
              >
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition">
                  <svg
                    className="w-5 h-5 text-orange-600"
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
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Grade Assignments
                  </p>
                  <p className="text-xs text-gray-500">12 pending</p>
                </div>
              </a>

              <a
                href="/dashboard/faculty/upload-materials"
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition group"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition">
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
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Upload Materials
                  </p>
                  <p className="text-xs text-gray-500">Study resources</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-4 pb-3 border-b border-gray-100">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  Assignment submitted by{" "}
                  <span className="font-medium">Rahul Sharma</span>
                </p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4 pb-3 border-b border-gray-100">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  Attendance marked for{" "}
                  <span className="font-medium">Data Structures</span>
                </p>
                <p className="text-xs text-gray-500">5 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4 pb-3 border-b border-gray-100">
              <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  Study material uploaded for{" "}
                  <span className="font-medium">DBMS Unit 3</span>
                </p>
                <p className="text-xs text-gray-500">Yesterday</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
