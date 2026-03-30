"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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

function createEmptyForm(facultyType = "teaching") {
  return {
    name: "",
    email: "",
    password: "",
    facultyType,
    assignedCourse: "BPT",
    designation: "",
    phone: "",
  };
}

function FacultyPageContent() {
  const searchParams = useSearchParams();
  const currentType = getFacultyTypeValue(searchParams.get("type"));

  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [form, setForm] = useState(createEmptyForm(currentType));

  const pageTitle =
    currentType === "nonTeaching" ? "Non-Teaching Faculty" : "Teaching Faculty";
  const addHref = `/dashboard/admin/faculty/add?type=${currentType}`;

  useEffect(() => {
    const success = new URLSearchParams(window.location.search).get("success");
    if (success) {
      alert(success);
    }
  }, []);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      facultyType: currentType,
      assignedCourse:
        currentType === "teaching" ? prev.assignedCourse || "BPT" : "",
      designation: currentType === "nonTeaching" ? prev.designation : "",
    }));
  }, [currentType]);

  useEffect(() => {
    async function fetchFaculty() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          role: "faculty",
          facultyType: currentType,
        });

        const res = await fetch(`/api/admin/users?${params.toString()}`, {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || `Failed (HTTP ${res.status})`);
        }

        setFaculty(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Unable to load faculty");
        setFaculty([]);
      } finally {
        setLoading(false);
      }
    }

    fetchFaculty();
  }, [currentType]);

  const summaryText = useMemo(() => {
    if (currentType === "nonTeaching") {
      return "Manage office, lab, support, and other non-teaching staff from one place.";
    }

    return "Manage course-assigned teaching faculty and keep course ownership clear.";
  }, [currentType]);

  function openEditModal(member) {
    const facultyType = getFacultyTypeValue(member.facultyType);
    setEditingFaculty(member);
    setForm({
      name: member.name || "",
      email: member.email || "",
      password: "",
      facultyType,
      assignedCourse: member.assignedCourse || "BPT",
      designation: member.designation || "",
      phone: member.phone || "",
    });
  }

  function closeEditModal() {
    setEditingFaculty(null);
    setForm(createEmptyForm(currentType));
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    if (!editingFaculty?._id) return;

    try {
      setSavingEdit(true);

      const payload = {
        name: form.name,
        email: form.email,
        facultyType: form.facultyType,
        phone: form.phone,
      };

      if (form.facultyType === "teaching") {
        payload.assignedCourse = form.assignedCourse;
      } else {
        payload.designation = form.designation;
      }

      if (form.password.trim()) {
        payload.password = form.password;
      }

      const res = await fetch(`/api/admin/users/${editingFaculty._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || `Update failed (HTTP ${res.status})`);
      }

      const updatedUser = data.user;
      const updatedType = getFacultyTypeValue(updatedUser?.facultyType);

      setFaculty((prev) =>
        prev
          .map((member) =>
            member._id === editingFaculty._id ? updatedUser : member,
          )
          .filter(
            (member) => getFacultyTypeValue(member.facultyType) === currentType,
          ),
      );

      alert(data.message || "Faculty updated successfully");

      if (updatedType !== currentType) {
        closeEditModal();
        return;
      }

      closeEditModal();
    } catch (err) {
      alert(err.message || "Failed to update faculty");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this faculty member?")) return;

    const res = await fetch(`/api/admin/users/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.message || `Delete failed (HTTP ${res.status})`);
      return;
    }

    setFaculty((prev) => prev.filter((member) => member._id !== id));
    alert(data.message || "Deleted");
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {pageTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{summaryText}</p>
          <p className="mt-2 text-sm text-slate-500">
            <span className="font-medium text-slate-900">{faculty.length}</span>{" "}
            member{faculty.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/admin/faculty?type=teaching"
            className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition ${
              currentType === "teaching"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
            }`}
          >
            Teaching
          </Link>
          <Link
            href="/dashboard/admin/faculty?type=nonTeaching"
            className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition ${
              currentType === "nonTeaching"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
            }`}
          >
            Non-Teaching
          </Link>
          <Link
            href={addHref}
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
          >
            <span className="mr-2 text-lg leading-none">+</span>
            Add {currentType === "nonTeaching" ? "Non-Teaching" : "Teaching"}
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400" />

        {loading ? (
          <div className="flex items-center justify-center px-6 py-10 text-sm text-slate-500">
            <div className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
            Loading faculty list...
          </div>
        ) : error ? (
          <div className="px-6 py-6 text-sm text-red-600">{error}</div>
        ) : faculty.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            <p className="mb-2 font-medium text-slate-600">
              No {currentType === "nonTeaching" ? "non-teaching" : "teaching"} faculty found.
            </p>
            <p className="mb-4">
              Start by adding your first{" "}
              {currentType === "nonTeaching"
                ? "non-teaching staff member"
                : "teaching faculty member"}
              .
            </p>
            <Link
              href={addHref}
              className="inline-flex items-center justify-center rounded-md bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200 transition hover:bg-indigo-100"
            >
              + Add {currentType === "nonTeaching" ? "Non-Teaching" : "Teaching"}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Name
                  </th>
                  {currentType === "nonTeaching" ? (
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Designation
                    </th>
                  ) : (
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Assigned Course
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {faculty.map((member) => (
                  <tr key={member._id} className="transition hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-800">
                      {member.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                      {currentType === "nonTeaching"
                        ? member.designation || "-"
                        : member.assignedCourse || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                      {member.email}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                      {member.phone || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <button
                        onClick={() => openEditModal(member)}
                        className="mr-2 inline-flex items-center rounded-md px-2.5 py-1.5 text-xs font-medium text-indigo-600 ring-1 ring-inset ring-indigo-200 transition hover:bg-indigo-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(member._id)}
                        className="inline-flex items-center rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 ring-1 ring-inset ring-red-200 transition hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingFaculty && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 px-3 py-3 md:items-center md:px-4">
          <div className="max-h-[96vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white shadow-xl md:max-h-[92vh]">
            <div className="border-b border-slate-200 px-4 py-4 md:px-6">
              <h2 className="text-lg font-semibold text-slate-900">Edit Faculty</h2>
              <p className="mt-1 text-sm text-slate-500">
                Update the faculty type, course, or non-teaching details here.
              </p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-5 px-4 py-4 md:px-6 md:py-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Faculty type
                </label>
                <select
                  value={form.facultyType}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      facultyType: getFacultyTypeValue(e.target.value),
                      assignedCourse:
                        e.target.value === "teaching"
                          ? prev.assignedCourse || "BPT"
                          : "",
                      designation:
                        e.target.value === "nonTeaching" ? prev.designation : "",
                    }))
                  }
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="teaching">Teaching</option>
                  <option value="nonTeaching">Non-Teaching</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Full name
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Phone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {form.facultyType === "teaching" ? (
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    Assigned course
                  </label>
                  <select
                    value={form.assignedCourse}
                    onChange={(e) =>
                      setForm({ ...form, assignedCourse: e.target.value })
                    }
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
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
                    required={form.facultyType === "nonTeaching"}
                    value={form.designation}
                    onChange={(e) =>
                      setForm({ ...form, designation: e.target.value })
                    }
                    placeholder="e.g. Office Superintendent"
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  New password
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Leave blank to keep current password"
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="inline-flex items-center rounded-md px-3 py-2 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FacultyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400" />
            <div className="flex items-center justify-center px-6 py-10 text-sm text-slate-500">
              Loading faculty panel...
            </div>
          </div>
        </div>
      }
    >
      <FacultyPageContent />
    </Suspense>
  );
}
