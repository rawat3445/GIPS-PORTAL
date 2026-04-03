"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

export default function AddAdminPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: "admin",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || `Failed (HTTP ${res.status})`);
      }

      router.push(
        `/dashboard/admin/admins?success=${encodeURIComponent(
          data.message || "Admin created",
        )}`,
      );
    } catch (submitError) {
      setError(submitError.message || "Failed to create admin");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin Access
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
            Add Admin
          </h1>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Create another protected admin account from inside the admin panel.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="h-1 bg-gradient-to-r from-amber-500 via-indigo-500 to-sky-500" />

          <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6 sm:px-8 sm:py-7">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Full name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Portal Operations Admin"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                required
                placeholder="admin@example.edu"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="Set an initial password"
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
              Only an already logged-in admin can create another admin from this page.
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <Link
                href="/dashboard/admin/admins"
                className="inline-flex items-center rounded-md px-3 py-2 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200 transition hover:bg-slate-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create Admin"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
