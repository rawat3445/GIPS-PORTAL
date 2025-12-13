export default function AdminStatsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Statistics & Analytics
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          View detailed reports and insights
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Time Period Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Overview</h2>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">
                This Week
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition">
                This Month
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition">
                This Year
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Attendance Rate */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">
                Attendance Rate
              </h3>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">87.5%</p>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: "87.5%" }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">+5.2% from last month</p>
          </div>

          {/* Assignment Submission */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">
                Assignment Submissions
              </h3>
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">456</p>
            <p className="text-sm text-gray-600 mt-2">Out of 520 total</p>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: "87.7%" }}
              ></div>
            </div>
          </div>

          {/* Average Marks */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">
                Average Marks
              </h3>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
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
                    d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">78.4%</p>
            <p className="text-sm text-green-600 mt-2">↑ 3.1% improvement</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-gray-500">
                Last semester: 75.3%
              </span>
            </div>
          </div>
        </div>

        {/* Department-wise Performance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Department-wise Performance
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Department
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Students
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Faculty
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Avg. Attendance
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Avg. Marks
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                    Computer Science
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">245</td>
                  <td className="py-3 px-4 text-sm text-gray-600">18</td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-green-600 font-medium">
                      92.3%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-900 font-medium">
                      81.2%
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                    Mechanical Engineering
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">198</td>
                  <td className="py-3 px-4 text-sm text-gray-600">15</td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-green-600 font-medium">
                      88.7%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-900 font-medium">
                      76.8%
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                    Electrical Engineering
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">223</td>
                  <td className="py-3 px-4 text-sm text-gray-600">16</td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-green-600 font-medium">
                      85.4%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-900 font-medium">
                      77.5%
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                    Civil Engineering
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">187</td>
                  <td className="py-3 px-4 text-sm text-gray-600">14</td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-yellow-600 font-medium">
                      83.1%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-900 font-medium">
                      74.9%
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                    Paramedical Sciences
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">381</td>
                  <td className="py-3 px-4 text-sm text-gray-600">28</td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-green-600 font-medium">
                      89.6%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-900 font-medium">
                      79.3%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activities Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Top Performing Students
            </h2>
            <div className="space-y-3">
              {[
                { name: "Priya Sharma", marks: "94.5%", dept: "CSE" },
                { name: "Rahul Verma", marks: "92.8%", dept: "ECE" },
                { name: "Anjali Singh", marks: "91.3%", dept: "Paramedical" },
                { name: "Amit Kumar", marks: "90.7%", dept: "ME" },
                { name: "Sneha Patel", marks: "89.9%", dept: "Civil" },
              ].map((student, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {student.name}
                      </p>
                      <p className="text-xs text-gray-500">{student.dept}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-green-600">
                    {student.marks}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Faculty Performance */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Faculty Ratings
            </h2>
            <div className="space-y-3">
              {[
                {
                  name: "Dr. Rajesh Kumar",
                  rating: 4.8,
                  subject: "Data Structures",
                },
                {
                  name: "Prof. Meera Devi",
                  rating: 4.7,
                  subject: "Thermodynamics",
                },
                { name: "Dr. Amit Singh", rating: 4.6, subject: "Anatomy" },
                {
                  name: "Prof. Sunita Sharma",
                  rating: 4.5,
                  subject: "Circuit Theory",
                },
                {
                  name: "Dr. Vikram Patel",
                  rating: 4.4,
                  subject: "Structural Analysis",
                },
              ].map((faculty, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {faculty.name}
                    </p>
                    <p className="text-xs text-gray-500">{faculty.subject}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-900">
                      {faculty.rating}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
