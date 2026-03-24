"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddFacultyPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    assignedCourse: "", // ✅ NEW
  });

  async function handleSubmit(e) {
    e.preventDefault();

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ...form, role: "faculty" }), // ✅ sends assignedCourse too
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      router.push(
        `/dashboard/admin/faculty?success=${encodeURIComponent(
          data.message || "Faculty created"
        )}`
      );
    } else {
      alert(data.message || `Failed (HTTP ${res.status})`);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Add Faculty
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create a new faculty account with login credentials.
          </p>
        </div>
      </div>

      <div className="max-w-xl">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400" />

          <form
            onSubmit={handleSubmit}
            className="space-y-5 px-6 py-6 sm:px-8 sm:py-7"
          >
            {/* Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-700"
              >
                Full name
              </label>
              <input
                id="name"
                type="text"
                required
                placeholder="e.g. Dr. Ananya Singh"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="faculty@example.edu"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <p className="text-xs text-slate-400">
                Use the official institutional email address.
              </p>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                placeholder="Set an initial password"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <p className="text-xs text-slate-400">
                The faculty member can change this after first login.
              </p>
            </div>

            {/* ✅ NEW: Assigned Course */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Assigned course
              </label>
              <select
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                value={form.assignedCourse}
                onChange={(e) =>
                  setForm({ ...form, assignedCourse: e.target.value })
                }
              >
                <option value="BPT">Bachelor of Physiotherapy (BPT)</option>
                <option value="BOPTOM">Bachelor of Optometry (B.Optom)</option>
                <option value="BMRIT">
                  Medical Radiology & Imaging (BMRIT)
                </option>
                <option value="DOPTOM">Diploma in Optometry (D.Optom)</option>
                <option value="BOTT">
                  Operation Theater Technology (BOTT)
                </option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => router.push("/dashboard/admin/faculty")}
                className="inline-flex items-center rounded-md px-3 py-2 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Create Faculty
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
