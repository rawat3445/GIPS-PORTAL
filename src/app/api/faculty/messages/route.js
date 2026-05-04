import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import { requireFaculty } from "../../../lib/auth";
import PortalMessage from "../../../models/PortalMessage";

function safeText(value) {
  return String(value || "").trim();
}

function toPayload(item, userId) {
  const readBy = Array.isArray(item?.readBy) ? item.readBy : [];
  const isRead = readBy.some((entry) => String(entry) === String(userId));

  return {
    _id: String(item._id),
    title: item.title,
    body: item.body,
    targetRole: item.targetRole,
    createdAt: item.createdAt,
    isRead,
  };
}

export async function GET() {
  const auth = await requireFaculty();
  if (!auth.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    await connectDB();

    const messages = await PortalMessage.find({ targetRole: "faculty" })
      .select("title body targetRole createdAt readBy")
      .sort({ createdAt: -1 })
      .lean();

    const data = messages.map((item) => toPayload(item, auth.decoded.id));

    return NextResponse.json({
      unreadCount: data.filter((item) => !item.isRead).length,
      messages: data,
    });
  } catch (error) {
    console.error("GET FACULTY MESSAGES ERROR:", error);
    return NextResponse.json(
      { message: "Unable to load messages" },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  const auth = await requireFaculty();
  if (!auth.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    await connectDB();
    const body = await request.json().catch(() => ({}));
    const id = safeText(body?.id);
    const shouldRead = body?.read !== false;

    if (!id) {
      return NextResponse.json(
        { message: "Message id is required." },
        { status: 400 },
      );
    }

    const updated = await PortalMessage.findOneAndUpdate(
      { _id: id, targetRole: "faculty" },
      shouldRead
        ? { $addToSet: { readBy: auth.decoded.id } }
        : { $pull: { readBy: auth.decoded.id } },
      { new: true },
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { message: "Message not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: shouldRead ? "Marked as read." : "Marked as unread.",
      item: toPayload(updated, auth.decoded.id),
    });
  } catch (error) {
    console.error("PATCH FACULTY MESSAGES ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Unable to update message status" },
      { status: 500 },
    );
  }
}
