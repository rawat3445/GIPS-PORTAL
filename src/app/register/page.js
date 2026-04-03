"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registration failed");
        setLoading(false);
        return;
      }

      router.push("/login");
    } catch (err) {
      setError("Something went wrong");
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-800">
          Student Registration
        </h1>

        {error && (
          <div className="mb-4 rounded bg-red-100 px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            required
            className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
            onChange={handleChange}
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            required
            className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
            onChange={handleChange}
          />

          <input
            type="text"
            name="enrollmentNo"
            placeholder="Enrollment Number"
            required
            className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
            onChange={handleChange}
          />

          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            required
            className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
            onChange={handleChange}
          />

          <select
            name="course"
            required
            className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
            onChange={handleChange}
          >
            <option value="">Select Course</option>
            <option value="BPT">Bachelor of Physiotherapy (BPT)</option>
            <option value="BOPTOM">Bachelor of Optometry (BOPTOM)</option>
            <option value="BMRIT">Medical Radiology & Imaging (BMRIT)</option>
            <option value="DOPTOM">Diploma in Optometry (DOPTOM)</option>
            <option value="BOTT">Operation Theater Technology (BOTT)</option>
          </select>

          <select
            name="year"
            required
            className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
            onChange={handleChange}
          >
            <option value="">Select Year</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-green-600 py-2 font-semibold text-white hover:bg-green-700 transition disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Student Account"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <a href="/login" className="font-semibold text-blue-600">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
