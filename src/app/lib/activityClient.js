"use client";

const EXCLUDED_PAGE_PREFIXES = ["/dashboard/admin/activity-logs"];

function shouldSkipPageTracking(path) {
  return EXCLUDED_PAGE_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export async function trackDashboardPageView({ userId, pathname }) {
  if (!userId || !pathname || typeof window === "undefined") {
    return;
  }

  const currentPath = `${window.location.pathname}${window.location.search || ""}`;
  if (!currentPath.startsWith("/dashboard/")) {
    return;
  }

  if (shouldSkipPageTracking(currentPath)) {
    return;
  }

  const dedupeKey = `portal-activity:${userId}:${currentPath}`;

  try {
    if (window.sessionStorage.getItem(dedupeKey)) {
      return;
    }
    window.sessionStorage.setItem(dedupeKey, "1");
  } catch {
    // Ignore session storage issues and still attempt the request.
  }

  try {
    await fetch("/api/activity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        path: currentPath,
      }),
    });
  } catch {
    // Ignore telemetry errors in the client UI.
  }
}
