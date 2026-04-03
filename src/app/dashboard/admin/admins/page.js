"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Mail,
  Pencil,
  ShieldCheck,
  Trash2,
  UserPlus,
} from "lucide-react";

function createEmptyForm() {
  return {
    name: "",
    email: "",
    password: "",
  };
}

function formatDate(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function AdminAccountsPage() {
  const [admins, setAdmins] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [form, setForm] = useState(createEmptyForm());
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    const success = new URLSearchParams(window.location.search).get("success");
    if (success) {
      alert(success);
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [meRes, adminsRes] = await Promise.all([
          fetch("/api/auth/me", {
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/admin/users?role=admin", {
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        const meData = await meRes.json().catch(() => ({}));
        const adminData = await adminsRes.json().catch(() => ({}));

        if (!meRes.ok) {
          throw new Error(meData.message || "Failed to load current admin");
        }

        if (!adminsRes.ok) {
          throw new Error(adminData.message || "Failed to load admin list");
        }

        setMe(meData.user || null);
        setAdmins(Array.isArray(adminData) ? adminData : []);
      } catch (loadError) {
        setError(loadError.message || "Unable to load admin accounts");
        setAdmins([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  function openEditModal(admin) {
    setEditingAdmin(admin);
    setForm({
      name: admin.name || "",
      email: admin.email || "",
      password: "",
    });
  }

  function closeEditModal() {
    setEditingAdmin(null);
    setForm(createEmptyForm());
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    if (!editingAdmin?._id) return;

    try {
      setSavingEdit(true);

      const payload = {
        name: form.name,
        email: form.email,
      };

      if (form.password.trim()) {
        payload.password = form.password.trim();
      }

      const res = await fetch(`/api/admin/users/${editingAdmin._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || `Update failed (HTTP ${res.status})`);
      }

      setAdmins((prev) =>
        prev.map((admin) => (admin._id === editingAdmin._id ? data.user : admin)),
      );

      if (me?._id === editingAdmin._id && data.user) {
        setMe(data.user);
      }

      alert(data.message || "Admin updated successfully");
      closeEditModal();
    } catch (saveError) {
      alert(saveError.message || "Failed to update admin");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(admin) {
    if (!admin?._id) return;
    if (String(admin._id) === String(me?._id)) {
      alert("You cannot delete the admin account you are currently using.");
      return;
    }

    if (!confirm(`Delete admin account for ${admin.name}?`)) return;

    const res = await fetch(`/api/admin/users/${admin._id}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.message || `Delete failed (HTTP ${res.status})`);
      return;
    }

    setAdmins((prev) => prev.filter((item) => item._id !== admin._id));
    alert(data.message || "Admin deleted");
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Admin Accounts
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create and manage the protected admin accounts for this portal.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            <span className="font-medium text-slate-900">{admins.length}</span>{" "}
            admin account{admins.length === 1 ? "" : "s"}
          </p>
        </div>

        <Link
          href="/dashboard/admin/admins/add"
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add Admin
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-gradient-to-r from-amber-500 via-indigo-500 to-sky-500" />

        {loading ? (
          <div className="flex items-center justify-center px-6 py-10 text-sm text-slate-500">
            <div className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
            Loading admin accounts...
          </div>
        ) : error ? (
          <div className="px-6 py-6 text-sm text-red-600">{error}</div>
        ) : admins.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            No admin accounts found yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {admins.map((admin) => {
              const isCurrentUser = String(admin._id) === String(me?._id);

              return (
                <div
                  key={admin._id}
                  className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-slate-900">
                        {admin.name || "Admin"}
                      </h2>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Admin
                      </span>
                      {isCurrentUser ? (
                        <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">
                          Current Session
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-400" />
                        {admin.email || "-"}
                      </span>
                      <span>Created {formatDate(admin.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => openEditModal(admin)}
                      className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-200 transition hover:bg-slate-50"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(admin)}
                      disabled={isCurrentUser}
                      className="inline-flex items-center rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editingAdmin ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 px-4 py-6">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Edit Admin
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Update the admin profile. Leave password blank to keep it unchanged.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                x
              </button>
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
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
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
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  New password
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="Leave blank to keep current password"
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
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
                  className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
