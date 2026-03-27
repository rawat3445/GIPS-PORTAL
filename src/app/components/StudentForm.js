"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProfileAvatar from "./ProfileAvatar";
import { resizeImageToAvatarDataUrl } from "../lib/avatarUpload";

const COURSES = [
  { value: "BPT", label: "Bachelor of Physiotherapy (BPT)" },
  { value: "BOPTOM", label: "Bachelor of Optometry (B.Optom)" },
  { value: "BMRIT", label: "Medical Radiology & Imaging (BMRIT)" },
  { value: "DOPTOM", label: "Diploma in Optometry (D.Optom)" },
  { value: "BOTT", label: "Operation Theater Technology (BOTT)" },
];

export default function StudentForm({
  apiEndpoint,
  redirectPath,
  hideCourseField = false,
}) {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    enrollmentNo: "",
    course: "",
    year: "",
    phone: "",
    profileImage: "",
  });

  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImageLoading(true);
      setError("");
      const profileImage = await resizeImageToAvatarDataUrl(file);
      setForm((prev) => ({ ...prev, profileImage }));
    } catch (uploadError) {
      setError(uploadError.message || "Failed to process image");
    } finally {
      setImageLoading(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          role: "student",
          year: Number(form.year),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || `Error (HTTP ${res.status})`);
      } else {
        setSuccess(data.message || "Student added successfully");

        setTimeout(() => router.push(redirectPath), 800);
      }
    } catch {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl bg-gray-600 p-6 rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Add Student</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Student Name"
          value={form.name}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />

        <input
          type="text"
          name="enrollmentNo"
          placeholder="Enrollment No."
          value={form.enrollmentNo}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />

        {/* Show only if admin */}
        {!hideCourseField && (
          <select
            name="course"
            value={form.course}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          >
            <option value="">Select Course</option>

            {COURSES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        )}

        <select
          name="year"
          value={form.year}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        >
          <option value="">Select Year</option>
          <option value="1">Year 1</option>
          <option value="2">Year 2</option>
          <option value="3">Year 3</option>
          <option value="4">Year 4</option>
        </select>

        <input
          type="tel"
          name="phone"
          placeholder="Phone"
          value={form.phone}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Temporary Password"
          value={form.password}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <ProfileAvatar
              src={form.profileImage}
              name={form.name}
              sizeClass="h-20 w-20"
              textClassName="text-lg"
            />

            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Student Profile Picture
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-full file:border-0 file:bg-blue-100 file:px-4 file:py-2 file:font-medium file:text-blue-700 hover:file:bg-blue-200"
              />
              <p className="mt-2 text-xs text-gray-500">
                Admin can upload a square student photo here. It will be shown as a circular avatar.
              </p>
              {form.profileImage && (
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, profileImage: "" }))
                  }
                  className="mt-2 text-xs font-semibold text-red-600 hover:text-red-700"
                >
                  Remove photo
                </button>
              )}
              {imageLoading && (
                <p className="mt-2 text-xs font-medium text-blue-600">
                  Processing image...
                </p>
              )}
            </div>
          </div>
        </div>

        {error && <p className="text-red-600">{error}</p>}
        {success && <p className="text-green-600">{success}</p>}

        <button
          type="submit"
          disabled={loading || imageLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Creating..." : "Add Student"}
        </button>
      </form>
    </div>
  );
}
