"use client";

const PAGE_VIEW_DEDUPE_WINDOW_MS = 90 * 1000;

export async function trackDashboardPageView({ userId, pathname }) {
  if (!userId || !pathname || typeof window === "undefined") {
    return;
  }

  const currentPath = `${window.location.pathname}${window.location.search || ""}`;
  if (!currentPath.startsWith("/dashboard/")) {
    return;
  }

  const dedupeKey = `portal-activity:${userId}:${currentPath}`;
  const now = Date.now();

  try {
    const lastSeen = Number(window.sessionStorage.getItem(dedupeKey) || "0");
    if (lastSeen && now - lastSeen < PAGE_VIEW_DEDUPE_WINDOW_MS) {
      return;
    }
    window.sessionStorage.setItem(dedupeKey, String(now));
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
