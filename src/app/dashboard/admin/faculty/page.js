"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function FacultyPage() {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    assignedCourse: "BPT",
  });
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  
  useEffect(() => {
    const success = new URLSearchParams(window.location.search).get("success");
    if (success) {
      alert(success); // replace with toast later
    }
  }, []);

  function openEditModal(member) {
    setEditingFaculty(member);
    setForm({
      name: member.name || "",
      email: member.email || "",
      password: "",
      assignedCourse: member.assignedCourse || "BPT",
    });
  }

  function closeEditModal() {
    setEditingFaculty(null);
    setForm({
      name: "",
      email: "",
      password: "",
      assignedCourse: "BPT",
    });
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    if (!editingFaculty?._id) return;

    try {
      setSavingEdit(true);

      const payload = {
        name: form.name,
        email: form.email,
        assignedCourse: form.assignedCourse,
      };

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

      setFaculty((prev) =>
        prev.map((member) =>
          member._id === editingFaculty._id ? data.user : member
        )
      );
      alert(data.message || "Faculty updated successfully");
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

    setFaculty((prev) => prev.filter((f) => f._id !== id));
    alert(data.message || "Deleted");
  }


  useEffect(() => {
    async function fetchFaculty() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/admin/users?role=faculty", {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || `Failed (HTTP ${res.status})`);
        }

        if (!Array.isArray(data)) {
          throw new Error("API did not return an array");
        }

        setFaculty(data);
      } catch (err) {
        setError(err.message || "Unable to load faculty");
        setFaculty([]);
      } finally {
        setLoading(false);
      }
    }

    fetchFaculty();
  }, []);


  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Faculty
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            <span className="font-medium text-slate-900">{faculty.length}</span>
          </p>
        </div>

        <Link
          href="/dashboard/admin/faculty/add"
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          <span className="mr-2 text-lg leading-none">+</span>
          Add Faculty
        </Link>
      </div>

      {/* Card */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Top border accent */}
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
            <p className="mb-2 font-medium text-slate-600">No faculty found.</p>
            <p className="mb-4">
              Start by adding your first faculty member to the system.
            </p>
            <Link
              href="/dashboard/admin/faculty/add"
              className="inline-flex items-center justify-center rounded-md bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200 transition hover:bg-indigo-100"
            >
              + Add Faculty
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
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Course
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {faculty.map((f) => (
                  <tr key={f._id} className="transition hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-800">
                      {f.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {f.email}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {f.assignedCourse || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <button
                        onClick={() => openEditModal(f)}
                        className="mr-2 inline-flex items-center rounded-md px-2.5 py-1.5 text-xs font-medium text-indigo-600 ring-1 ring-inset ring-indigo-200 transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(f._id)}
                        className="inline-flex items-center rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 ring-1 ring-inset ring-red-200 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-xl rounded-xl bg-white shadow-xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Edit Faculty</h2>
              <p className="mt-1 text-sm text-slate-500">
                Update only the fields you want to change. Leaving password blank keeps it unchanged.
              </p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-5 px-6 py-6">
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
                  Assigned course
                </label>
                <select
                  value={form.assignedCourse}
                  onChange={(e) =>
                    setForm({ ...form, assignedCourse: e.target.value })
                  }
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="BPT">Bachelor of Physiotherapy (BPT)</option>
                  <option value="BOPTOM">Bachelor of Optometry (BOPTOM)</option>
                  <option value="BMRIT">Medical Radiology & Imaging (BMRIT)</option>
                  <option value="DOPTOM">Diploma in Optometry (DOPTOM)</option>
                  <option value="BOTT">Operation Theater Technology (BOTT)</option>
                </select>
              </div>

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

              <div className="flex items-center justify-end gap-3 pt-2">
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
