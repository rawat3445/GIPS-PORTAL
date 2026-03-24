"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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

        {error && <p className="text-red-600">{error}</p>}
        {success && <p className="text-green-600">{success}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Creating..." : "Add Student"}
        </button>
      </form>
    </div>
  );
}
