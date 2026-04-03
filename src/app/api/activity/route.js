import { NextResponse } from "next/server";
import {
  buildDashboardVisitDetails,
  logActivityFromRequest,
} from "../../lib/activity";

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

    const { actionLabel, details } = buildDashboardVisitDetails(path);
    await logActivityFromRequest(request, {
      actionType: "page_view",
      actionLabel,
      path,
      details,
      dedupeWindowMs: 90 * 1000,
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
