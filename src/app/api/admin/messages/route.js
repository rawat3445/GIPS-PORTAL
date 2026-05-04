import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import { requireAdmin } from "../../../lib/auth";
import PortalMessage from "../../../models/PortalMessage";

function safeText(value) {
  return String(value || "").trim();
}

function normalizeRole(value) {
  const role = safeText(value).toLowerCase();
  return role === "faculty" ? "faculty" : role === "student" ? "student" : "";
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    await connectDB();

    const messages = await PortalMessage.find({})
      .select("targetRole title body createdAt readBy")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      messages: messages.map((item) => ({
        _id: String(item._id),
        targetRole: item.targetRole,
        title: item.title,
        body: item.body,
        createdAt: item.createdAt,
        readCount: Array.isArray(item.readBy) ? item.readBy.length : 0,
      })),
    });
  } catch (error) {
    console.error("GET ADMIN MESSAGES ERROR:", error);
    return NextResponse.json(
      { message: "Unable to load messages" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    await connectDB();

    const body = await request.json().catch(() => ({}));
    const targetRole = normalizeRole(body?.targetRole);
    const title = safeText(body?.title);
    const bodyText = safeText(body?.body);

    if (!targetRole) {
      return NextResponse.json(
        { message: "Choose whether to send this to students or faculty." },
        { status: 400 },
      );
    }

    if (!title) {
      return NextResponse.json(
        { message: "Message title is required." },
        { status: 400 },
      );
    }

    if (bodyText.length < 4) {
      return NextResponse.json(
        { message: "Message body is required." },
        { status: 400 },
      );
    }

    const created = await PortalMessage.create({
      targetRole,
      title,
      body: bodyText,
      createdBy: auth.decoded.id,
    });

    return NextResponse.json({
      message: `Message sent to ${targetRole === "student" ? "students" : "faculty"}.`,
      item: {
        _id: String(created._id),
        targetRole: created.targetRole,
        title: created.title,
        body: created.body,
        createdAt: created.createdAt,
      },
    });
  } catch (error) {
    console.error("CREATE ADMIN MESSAGE ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Unable to send message" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = safeText(searchParams.get("id"));

    if (!id) {
      return NextResponse.json(
        { message: "Message id is required." },
        { status: 400 },
      );
    }

    const deleted = await PortalMessage.findByIdAndDelete(id).lean();
    if (!deleted) {
      return NextResponse.json(
        { message: "Message not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Message deleted successfully." });
  } catch (error) {
    console.error("DELETE ADMIN MESSAGE ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Unable to delete message" },
      { status: 500 },
    );
  }
}
