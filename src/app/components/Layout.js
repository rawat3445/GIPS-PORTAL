"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }) {
  const [adminName, setAdminName] = useState("Admin");
  const router = useRouter();

  // Logout function
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-800 text-white flex flex-col">
        <div className="p-6 text-2xl font-bold border-b border-blue-700">
          Admin Panel
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link
            href="/dashboard/admin"
            className="block rounded px-4 py-2 hover:bg-blue-700"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/admin/users"
            className="block rounded px-4 py-2 hover:bg-blue-700"
          >
            Manage Users
          </Link>
          <Link
            href="/dashboard/admin/courses"
            className="block rounded px-4 py-2 hover:bg-blue-700"
          >
            Courses
          </Link>
          <Link
            href="/dashboard/admin/settings"
            className="block rounded px-4 py-2 hover:bg-blue-700"
          >
            Settings
          </Link>
        </nav>
        <button
          onClick={handleLogout}
          className="m-4 mt-auto rounded bg-red-600 px-4 py-2 hover:bg-red-700"
        >
          Logout
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="h-16 bg-white shadow flex items-center justify-between px-6">
          <h1 className="text-xl font-bold">Welcome, {adminName}</h1>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
