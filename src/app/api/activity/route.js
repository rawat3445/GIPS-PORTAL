import { NextResponse } from "next/server";
import {
  buildDashboardVisitDetails,
  logActivityFromRequest,
} from "../../lib/activity";

const EXCLUDED_PAGE_PREFIXES = ["/dashboard/admin/activity-logs"];

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const path = String(body?.path || "").trim();

    if (!path.startsWith("/dashboard/")) {
      return NextResponse.json(
        { message: "Dashboard path is required" },
        { status: 400 },
      );
    }

    if (EXCLUDED_PAGE_PREFIXES.some((prefix) => path.startsWith(prefix))) {
      return NextResponse.json({ message: "Tracking skipped" });
    }

    const { actionLabel, details } = buildDashboardVisitDetails(path);
    await logActivityFromRequest(request, {
      actionType: "page_view",
      actionLabel,
      path,
      details,
      dedupeWindowMs: 30 * 60 * 1000,
    });

    return NextResponse.json({ message: "Activity recorded" });
  } catch (error) {
    console.error("ACTIVITY TRACK ERROR:", error);
    return NextResponse.json(
      { message: "Unable to record activity" },
      { status: 500 },
    );
  }
}
