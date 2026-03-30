"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const COURSE_OPTIONS = [
  { value: "BPT", label: "Bachelor of Physiotherapy (BPT)" },
  { value: "BOPTOM", label: "Bachelor of Optometry (BOPTOM)" },
  { value: "BMRIT", label: "Medical Radiology & Imaging (BMRIT)" },
  { value: "DOPTOM", label: "Diploma in Optometry (DOPTOM)" },
  { value: "BOTT", label: "Operation Theater Technology (BOTT)" },
];

function getFacultyTypeValue(value) {
  return value === "nonTeaching" ? "nonTeaching" : "teaching";
}

function AddFacultyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = getFacultyTypeValue(searchParams.get("type"));

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    facultyType: initialType,
    assignedCourse: "BPT",
    designation: "",
    phone: "",
  });

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      facultyType: initialType,
      assignedCourse: initialType === "teaching" ? prev.assignedCourse || "BPT" : "",
      designation: initialType === "nonTeaching" ? prev.designation : "",
    }));
  }, [initialType]);

  async function handleSubmit(e) {
    e.preventDefault();

    const payload = {
      name: form.name,
      email: form.email,
      password: form.password,
      role: "faculty",
      facultyType: form.facultyType,
      phone: form.phone,
      ...(form.facultyType === "teaching"
        ? { assignedCourse: form.assignedCourse }
        : { designation: form.designation }),
    };

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      router.push(
        `/dashboard/admin/faculty?type=${form.facultyType}&success=${encodeURIComponent(
          data.message || "Faculty created",
        )}`,
      );
    } else {
      alert(data.message || `Failed (HTTP ${res.status})`);
    }
  }

  const pageTitle =
    form.facultyType === "nonTeaching" ? "Add Non-Teaching Faculty" : "Add Teaching Faculty";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {pageTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create a faculty record that can be managed by admin attendance.
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
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Faculty type
              </label>
              <select
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                value={form.facultyType}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    facultyType: getFacultyTypeValue(e.target.value),
                    assignedCourse:
                      e.target.value === "teaching" ? prev.assignedCourse || "BPT" : "",
                    designation:
                      e.target.value === "nonTeaching" ? prev.designation : "",
                  }))
                }
              >
                <option value="teaching">Teaching</option>
                <option value="nonTeaching">Non-Teaching</option>
              </select>
            </div>

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
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-slate-700"
              >
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                required={form.facultyType === "nonTeaching"}
                placeholder="Enter contact number"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

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
            </div>

            {form.facultyType === "teaching" ? (
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
                  {COURSE_OPTIONS.map((course) => (
                    <option key={course.value} value={course.value}>
                      {course.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Designation
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lab Assistant"
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  value={form.designation}
                  onChange={(e) =>
                    setForm({ ...form, designation: e.target.value })
                  }
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() =>
                  router.push(`/dashboard/admin/faculty?type=${form.facultyType}`)
                }
                className="inline-flex items-center rounded-md px-3 py-2 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
              >
                Create {form.facultyType === "nonTeaching" ? "Non-Teaching" : "Teaching"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AddFacultyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
          <div className="max-w-xl">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400" />
              <div className="px-6 py-10 text-center text-sm text-slate-500">
                Loading faculty form...
              </div>
            </div>
          </div>
        </div>
      }
    >
      <AddFacultyPageContent />
    </Suspense>
  );
}
