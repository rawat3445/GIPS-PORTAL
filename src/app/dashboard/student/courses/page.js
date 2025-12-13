"use client";
import { useState } from "react";

export default function StudentCoursesPage() {
  const [selectedCourse, setSelectedCourse] = useState(null);

  const courses = [
    {
      id: 1,
      code: "CSE301",
      name: "Data Structures",
      instructor: "Dr. Rajesh Kumar",
      credits: 4,
      attendance: 92.5,
      grade: "A",
      schedule: "Mon, Wed, Fri - 9:00 AM",
      room: "Room 201",
      materials: 12,
      assignments: 3,
    },
    {
      id: 2,
      code: "CSE302",
      name: "Database Management Systems",
      instructor: "Prof. Meera Sharma",
      credits: 4,
      attendance: 88.0,
      grade: "A-",
      schedule: "Tue, Thu - 11:00 AM",
      room: "Room 105",
      materials: 8,
      assignments: 2,
    },
    {
      id: 3,
      code: "CSE303",
      name: "Operating Systems",
      instructor: "Prof. Sunita Patel",
      credits: 4,
      attendance: 95.0,
      grade: "A+",
      schedule: "Mon, Wed, Fri - 4:00 PM",
      room: "Room 302",
      materials: 15,
      assignments: 4,
    },
    {
      id: 4,
      code: "CSE304",
      name: "Computer Networks",
      instructor: "Dr. Amit Singh",
      credits: 3,
      attendance: 90.0,
      grade: "A",
      schedule: "Tue, Thu - 2:00 PM",
      room: "Room 205",
      materials: 10,
      assignments: 2,
    },
    {
      id: 5,
      code: "CSE305",
      name: "Algorithm Lab",
      instructor: "Dr. Vikram Yadav",
      credits: 2,
      attendance: 94.0,
      grade: "A",
      schedule: "Thu - 2:00 PM",
      room: "Lab 3",
      materials: 6,
      assignments: 5,
    },
    {
      id: 6,
      code: "CSE306",
      name: "Web Development",
      instructor: "Prof. Priya Verma",
      credits: 3,
      attendance: 87.0,
      grade: "B+",
      schedule: "Fri - 11:00 AM",
      room: "Lab 1",
      materials: 9,
      assignments: 3,
    },
  ];

  const studyMaterials = [
    {
      id: 1,
      title: "Unit 3 - Trees and Graphs",
      type: "PDF",
      date: "2025-12-10",
      size: "2.5 MB",
    },
    {
      id: 2,
      title: "Lecture Notes - Chapter 5",
      type: "PDF",
      date: "2025-12-08",
      size: "1.8 MB",
    },
    {
      id: 3,
      title: "Practice Problems Set 1",
      type: "PDF",
      date: "2025-12-05",
      size: "0.9 MB",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
        <p className="text-sm text-gray-600 mt-1">
          View enrolled courses and study materials
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Semester Info */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Semester 5 - 2025</h2>
              <p className="text-sm text-blue-100 mt-1">
                Computer Science Engineering • 3rd Year
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">6</p>
              <p className="text-sm text-blue-100">Total Courses</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <p className="text-2xl font-bold">20</p>
              <p className="text-xs text-blue-100">Total Credits</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <p className="text-2xl font-bold">91.2%</p>
              <p className="text-xs text-blue-100">Avg. Attendance</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <p className="text-2xl font-bold">8.4</p>
              <p className="text-xs text-blue-100">Current GPA</p>
            </div>
          </div>
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition cursor-pointer"
              onClick={() => setSelectedCourse(course)}
            >
              {/* Course Header */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium opacity-90">
                      {course.code}
                    </p>
                    <h3 className="text-lg font-bold mt-1">{course.name}</h3>
                  </div>
                  <span className="px-2 py-1 bg-white/20 rounded text-xs font-medium">
                    {course.credits} Credits
                  </span>
                </div>
              </div>

              {/* Course Body */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span>{course.instructor}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{course.schedule}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
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
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>{course.room}</span>
                </div>

                {/* Attendance Progress */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-600">Attendance</span>
                    <span
                      className={`text-xs font-semibold ${
                        course.attendance >= 90
                          ? "text-green-600"
                          : course.attendance >= 75
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {course.attendance}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        course.attendance >= 90
                          ? "bg-green-600"
                          : course.attendance >= 75
                          ? "bg-yellow-600"
                          : "bg-red-600"
                      }`}
                      style={{ width: `${course.attendance}%` }}
                    ></div>
                  </div>
                </div>

                {/* Footer Stats */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
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
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                      {course.materials}
                    </span>
                    <span className="flex items-center gap-1">
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
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      {course.assignments}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      course.grade.startsWith("A")
                        ? "bg-green-100 text-green-700"
                        : course.grade.startsWith("B")
                        ? "bg-blue-100 text-blue-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    Grade: {course.grade}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Study Materials Section */}
        {selectedCourse && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Study Materials - {selectedCourse.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedCourse.instructor} • {selectedCourse.code}
                </p>
              </div>
              <button
                onClick={() => setSelectedCourse(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
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
              </button>
            </div>

            <div className="space-y-3">
              {studyMaterials.map((material) => (
                <div
                  key={material.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-4">
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
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {material.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {material.type} • {material.size} • Uploaded on{" "}
                        {new Date(material.date).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  </div>
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
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
