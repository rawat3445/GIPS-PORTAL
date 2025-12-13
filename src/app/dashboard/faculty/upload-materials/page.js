"use client";
import { useState } from "react";

export default function UploadMaterialsPage() {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [materialType, setMaterialType] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const courses = [
    { id: "1", name: "Data Structures - CSE 3rd Year" },
    { id: "2", name: "Database Management - CSE 2nd Year" },
    { id: "3", name: "Algorithm Lab - CSE 3rd Year" },
  ];

  const recentUploads = [
    {
      id: 1,
      title: "Unit 3 - Trees and Graphs",
      course: "Data Structures",
      type: "PDF",
      uploadDate: "2025-12-10",
      size: "2.5 MB",
    },
    {
      id: 2,
      title: "SQL Queries Practice",
      course: "Database Management",
      type: "PDF",
      uploadDate: "2025-12-09",
      size: "1.8 MB",
    },
    {
      id: 3,
      title: "Sorting Algorithms Video",
      course: "Data Structures",
      type: "Video",
      uploadDate: "2025-12-08",
      size: "45 MB",
    },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ selectedCourse, materialType, title, description });
    alert("Material uploaded successfully!");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Upload Materials</h1>
        <p className="text-sm text-gray-600 mt-1">
          Share study materials and resources with students
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Upload New Material
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Course Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Course *
                  </label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Choose a course...</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Material Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Material Type *
                  </label>
                  <select
                    value={materialType}
                    onChange={(e) => setMaterialType(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select type...</option>
                    <option value="lecture-notes">Lecture Notes</option>
                    <option value="assignment">Assignment</option>
                    <option value="reference">Reference Material</option>
                    <option value="video">Video Lecture</option>
                    <option value="practice">Practice Questions</option>
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Unit 3 - Binary Trees"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a brief description of the material..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload File *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition">
                    <svg
                      className="w-12 h-12 text-gray-400 mx-auto mb-4"
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
                    <p className="text-sm text-gray-600 mb-2">
                      Drag and drop your file here, or click to browse
                    </p>
                    <input
                      type="file"
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.avi"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-block px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg cursor-pointer hover:bg-indigo-700 transition"
                    >
                      Choose File
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      Supported: PDF, DOC, PPT, MP4 (Max 50MB)
                    </p>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
                  >
                    Upload Material
                  </button>
                  <button
                    type="button"
                    className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-4">
                Upload Statistics
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Total Uploads</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">24</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">8</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Storage Used</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    125 MB
                  </p>
                </div>
              </div>
            </div>

            {/* File Type Guide */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                File Guidelines
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  PDF for documents
                </li>
                <li className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  MP4 for videos
                </li>
                <li className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Max file size: 50MB
                </li>
                <li className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Clear file naming
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Recent Uploads */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Uploads
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                    Title
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                    Course
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                    Type
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                    Upload Date
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                    Size
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentUploads.map((upload) => (
                  <tr key={upload.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-indigo-600"
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
                        <span className="text-sm font-medium text-gray-900">
                          {upload.title}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {upload.course}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                        {upload.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {new Date(upload.uploadDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {upload.size}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Download"
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
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                        </button>
                        <button
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                          title="Delete"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
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
