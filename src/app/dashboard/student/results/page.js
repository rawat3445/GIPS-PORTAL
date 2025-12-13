"use client";
import { useState } from "react";

export default function StudentResultsPage() {
  const [selectedSemester, setSelectedSemester] = useState("current");

  const semesters = [
    { id: "current", name: "Semester 5 (Current)", year: "2025-26" },
    { id: "sem4", name: "Semester 4", year: "2024-25" },
    { id: "sem3", name: "Semester 3", year: "2024-25" },
    { id: "sem2", name: "Semester 2", year: "2023-24" },
    { id: "sem1", name: "Semester 1", year: "2023-24" },
  ];

  const currentResults = [
    {
      code: "CSE301",
      name: "Data Structures",
      credits: 4,
      internalMarks: 38,
      externalMarks: 55,
      totalMarks: 93,
      maxMarks: 100,
      grade: "A+",
      gradePoint: 9.5,
    },
    {
      code: "CSE302",
      name: "Database Management Systems",
      credits: 4,
      internalMarks: 35,
      externalMarks: 50,
      totalMarks: 85,
      maxMarks: 100,
      grade: "A",
      gradePoint: 9.0,
    },
    {
      code: "CSE303",
      name: "Operating Systems",
      credits: 4,
      internalMarks: 40,
      externalMarks: 58,
      totalMarks: 98,
      maxMarks: 100,
      grade: "A+",
      gradePoint: 10.0,
    },
    {
      code: "CSE304",
      name: "Computer Networks",
      credits: 3,
      internalMarks: 37,
      externalMarks: 52,
      totalMarks: 89,
      maxMarks: 100,
      grade: "A",
      gradePoint: 9.0,
    },
    {
      code: "CSE305",
      name: "Algorithm Lab",
      credits: 2,
      internalMarks: 45,
      externalMarks: 48,
      totalMarks: 93,
      maxMarks: 100,
      grade: "A+",
      gradePoint: 9.5,
    },
    {
      code: "CSE306",
      name: "Web Development",
      credits: 3,
      internalMarks: 32,
      externalMarks: 48,
      totalMarks: 80,
      maxMarks: 100,
      grade: "B+",
      gradePoint: 8.0,
    },
  ];

  const semesterHistory = [
    { semester: "Semester 4", sgpa: 8.9, cgpa: 8.7, status: "Passed" },
    { semester: "Semester 3", sgpa: 8.5, cgpa: 8.6, status: "Passed" },
    { semester: "Semester 2", sgpa: 8.8, cgpa: 8.7, status: "Passed" },
    { semester: "Semester 1", sgpa: 8.4, cgpa: 8.4, status: "Passed" },
  ];

  const calculateSGPA = () => {
    let totalCredits = 0;
    let totalGradePoints = 0;

    currentResults.forEach((result) => {
      totalCredits += result.credits;
      totalGradePoints += result.credits * result.gradePoint;
    });

    return (totalGradePoints / totalCredits).toFixed(2);
  };

  const getGradeColor = (grade) => {
    if (grade.startsWith("A")) return "text-green-600 bg-green-100";
    if (grade.startsWith("B")) return "text-blue-600 bg-blue-100";
    if (grade.startsWith("C")) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const sgpa = calculateSGPA();
  const cgpa = 8.4;
  const totalCredits = currentResults.reduce((sum, r) => sum + r.credits, 0);
  const percentage =
    (currentResults.reduce((sum, r) => sum + r.totalMarks, 0) /
      currentResults.reduce((sum, r) => sum + r.maxMarks, 0)) *
    100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Examination Results
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          View your academic performance and grades
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <p className="text-sm opacity-90">Current SGPA</p>
            <p className="text-4xl font-bold mt-2">{sgpa}</p>
            <p className="text-xs mt-2 opacity-75">Out of 10.0</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <p className="text-sm opacity-90">Overall CGPA</p>
            <p className="text-4xl font-bold mt-2">{cgpa.toFixed(2)}</p>
            <p className="text-xs mt-2 opacity-75">Cumulative GPA</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <p className="text-sm opacity-90">Percentage</p>
            <p className="text-4xl font-bold mt-2">{percentage.toFixed(1)}%</p>
            <p className="text-xs mt-2 opacity-75">Current Semester</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
            <p className="text-sm opacity-90">Credits Earned</p>
            <p className="text-4xl font-bold mt-2">{totalCredits}</p>
            <p className="text-xs mt-2 opacity-75">This Semester</p>
          </div>
        </div>

        {/* Semester Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Semester
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {semesters.map((sem) => (
                  <option key={sem.id} value={sem.id}>
                    {sem.name} ({sem.year})
                  </option>
                ))}
              </select>
            </div>

            <button className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
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
              Download Result
            </button>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              Semester 5 Results - 2025-26
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Computer Science Engineering • 3rd Year
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                    Course Code
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                    Course Name
                  </th>
                  <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">
                    Credits
                  </th>
                  <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">
                    Internal
                  </th>
                  <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">
                    External
                  </th>
                  <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">
                    Total
                  </th>
                  <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">
                    Grade
                  </th>
                  <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">
                    Grade Point
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentResults.map((result, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-4 px-6 text-sm font-medium text-gray-900">
                      {result.code}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900">
                      {result.name}
                    </td>
                    <td className="py-4 px-6 text-center text-sm text-gray-900">
                      {result.credits}
                    </td>
                    <td className="py-4 px-6 text-center text-sm text-gray-600">
                      {result.internalMarks}/40
                    </td>
                    <td className="py-4 px-6 text-center text-sm text-gray-600">
                      {result.externalMarks}/60
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-semibold text-gray-900">
                      {result.totalMarks}/{result.maxMarks}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${getGradeColor(
                          result.grade
                        )}`}
                      >
                        {result.grade}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-semibold text-gray-900">
                      {result.gradePoint}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr>
                  <td
                    colSpan="2"
                    className="py-4 px-6 text-sm font-bold text-gray-900"
                  >
                    Total / SGPA
                  </td>
                  <td className="py-4 px-6 text-center text-sm font-bold text-gray-900">
                    {totalCredits}
                  </td>
                  <td
                    colSpan="2"
                    className="py-4 px-6 text-center text-sm font-bold text-gray-900"
                  >
                    {currentResults.reduce((sum, r) => sum + r.totalMarks, 0)}/
                    {currentResults.reduce((sum, r) => sum + r.maxMarks, 0)}
                  </td>
                  <td className="py-4 px-6 text-center text-sm font-bold text-gray-900">
                    {percentage.toFixed(2)}%
                  </td>
                  <td
                    colSpan="2"
                    className="py-4 px-6 text-center text-sm font-bold text-green-600"
                  >
                    SGPA: {sgpa}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Grading System */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Grading System
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { grade: "A+", range: "90-100", point: "10.0" },
              { grade: "A", range: "80-89", point: "9.0" },
              { grade: "B+", range: "70-79", point: "8.0" },
              { grade: "B", range: "60-69", point: "7.0" },
              { grade: "C", range: "50-59", point: "6.0" },
            ].map((item) => (
              <div
                key={item.grade}
                className="border border-gray-200 rounded-lg p-4 text-center"
              >
                <p className="text-2xl font-bold text-gray-900">{item.grade}</p>
                <p className="text-xs text-gray-600 mt-1">{item.range}%</p>
                <p className="text-sm text-blue-600 font-medium mt-2">
                  GP: {item.point}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Semester History */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              Academic History
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                    Semester
                  </th>
                  <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">
                    SGPA
                  </th>
                  <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">
                    CGPA
                  </th>
                  <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">
                    Status
                  </th>
                  <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {semesterHistory.map((sem, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-4 px-6 text-sm font-medium text-gray-900">
                      {sem.semester}
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-semibold text-green-600">
                      {sem.sgpa}
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-semibold text-blue-600">
                      {sem.cgpa}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                        {sem.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance Chart Placeholder */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Performance Trend
          </h2>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0h-2"
                />
              </svg>
              <p className="text-gray-500 text-sm">
                Performance chart will be displayed here
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
