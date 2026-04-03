import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import ActivityLog from "../../../models/ActivityLog";
import { requireAdmin } from "../../../lib/auth";

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeLimit(value) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return 120;
  return Math.min(Math.max(parsed, 20), 300);
}

export async function GET(request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const role = String(searchParams.get("role") || "").trim().toLowerCase();
    const actionType = String(searchParams.get("actionType") || "")
      .trim()
      .toLowerCase();
    const search = String(searchParams.get("search") || "").trim();
    const limit = normalizeLimit(searchParams.get("limit"));

    const query = {};

    if (role) {
      query.actorRole = role;
    }

    if (actionType) {
      query.actionType = actionType;
    }

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), "i");
      query.$or = [
        { actorName: searchRegex },
        { actorEmail: searchRegex },
        { targetName: searchRegex },
        { targetEmail: searchRegex },
        { actionLabel: searchRegex },
        { details: searchRegex },
        { path: searchRegex },
      ];
    }

    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      logs: JSON.parse(JSON.stringify(logs)),
    });
  } catch (error) {
    console.error("GET ACTIVITY LOGS ERROR:", error);
    return NextResponse.json(
      { message: "Unable to load activity logs" },
      { status: 500 },
    );
  }
}
