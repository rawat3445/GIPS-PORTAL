"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MarkAttendanceRedirectPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      setError("");

      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          router.replace("/login");
          return;
        }

        const user = data.user;

        if (String(user?.role || "").toLowerCase() !== "faculty") {
          router.replace(
            `/dashboard/${String(user?.role || "").toLowerCase()}`
          );
          return;
        }

        if (String(user?.facultyType || "").trim() === "nonTeaching") {
          router.replace("/dashboard/faculty/see-attendance");
          return;
        }

        if (!user?.assignedCourse) {
          setError("Course not assigned. Contact admin.");
          return;
        }

        router.replace(`/dashboard/faculty/${user.assignedCourse}/attendance`);
      } catch (e) {
        setError("Failed to redirect to attendance page");
      }
    };

    run();
  }, [router]);

  return (
    <div className="p-6">
      {error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <p>Redirecting to your course attendance...</p>
      )}
    </div>
  );
}
