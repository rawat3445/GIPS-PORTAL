"use client";
import { useState } from "react";

export default function MarkAttendancePage() {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [attendance, setAttendance] = useState({});

  const courses = [
    { id: "1", name: "Data Structures", class: "CSE 3rd Year" },
    { id: "2", name: "Database Management", class: "CSE 2nd Year" },
    { id: "3", name: "Algorithm Lab", class: "CSE 3rd Year" },
  ];

  const students = [
    { id: 1, rollNo: "CS001", name: "Rahul Sharma" },
    { id: 2, rollNo: "CS002", name: "Priya Singh" },
    { id: 3, rollNo: "CS003", name: "Amit Kumar" },
    { id: 4, rollNo: "CS004", name: "Sneha Patel" },
    { id: 5, rollNo: "CS005", name: "Vikram Yadav" },
  ];

  const toggleAttendance = (studentId) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "present" ? "absent" : "present",
    }));
  };

  const markAllPresent = () => {
    const allPresent = {};
    students.forEach((student) => {
      allPresent[student.id] = "present";
    });
    setAttendance(allPresent);
  };

  const markAllAbsent = () => {
    const allAbsent = {};
    students.forEach((student) => {
      allAbsent[student.id] = "absent";
    });
    setAttendance(allAbsent);
  };

  const handleSubmit = () => {
    console.log("Attendance submitted:", attendance);
    alert("Attendance marked successfully!");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Mark Attendance</h1>
        <p className="text-sm text-gray-600 mt-1">
          Record student attendance for your classes
        </p>
      </div>

      <div className="p-6 space-y-6">
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
                <option value="">Choose a course...</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name} - {course.class}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Actions
              </label>
              <div className="flex gap-2">
                <button
                  onClick={markAllPresent}
                  className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
                >
                  All Present
                </button>
                <button
                  onClick={markAllAbsent}
                  className="flex-1 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition"
                >
                  All Absent
                </button>
              </div>
            </div>
          </div>
        </div>

        {selectedCourse && (
          <>
            {/* Attendance Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">
                  Student List
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Click on status to toggle attendance
                </p>
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
                      <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map((student) => {
                      const status = attendance[student.id] || "not-marked";
                      return (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="py-4 px-6 text-sm font-medium text-gray-900">
                            {student.rollNo}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-indigo-600">
                                  {student.name.charAt(0)}
                                </span>
                              </div>
                              <span className="text-sm text-gray-900">
                                {student.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <button
                              onClick={() => toggleAttendance(student.id)}
                              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                                status === "present"
                                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                                  : status === "absent"
                                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              {status === "present"
                                ? "Present"
                                : status === "absent"
                                ? "Absent"
                                : "Not Marked"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Present:{" "}
                  <span className="font-semibold text-green-600">
                    {
                      Object.values(attendance).filter((v) => v === "present")
                        .length
                    }
                  </span>{" "}
                  | Absent:{" "}
                  <span className="font-semibold text-red-600">
                    {
                      Object.values(attendance).filter((v) => v === "absent")
                        .length
                    }
                  </span>{" "}
                  | Total: {students.length}
                </div>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
                >
                  Submit Attendance
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
