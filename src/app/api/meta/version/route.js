import { NextResponse } from "next/server";
import {
  buildCommitSha,
  buildGeneratedAt,
  buildVersion,
} from "../../../lib/buildVersion";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    version: String(buildVersion || "1"),
    commitSha: String(buildCommitSha || ""),
    generatedAt: String(buildGeneratedAt || ""),
  });
}
