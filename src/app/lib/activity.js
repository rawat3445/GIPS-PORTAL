import jwt from "jsonwebtoken";
import connectDB from "./db";
import User from "../models/User";
import ActivityLog from "../models/ActivityLog";

function safeTrim(value) {
  return String(value || "").trim();
}

function titleizeSegment(segment) {
  return safeTrim(segment)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function capitalizeWord(value) {
  const normalized = safeTrim(value).toLowerCase();
  return normalized
    ? `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`
    : "";
}

function getTokenFromRequest(request) {
  const directCookie = request?.cookies?.get?.("token");
  if (typeof directCookie === "string") {
    return directCookie;
  }
  if (directCookie?.value) {
    return directCookie.value;
  }

  const cookieHeader = request?.headers?.get?.("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function createActorSnapshot(user) {
  return {
    actorId: user?._id || null,
    actorName: safeTrim(user?.name) || "Unknown User",
    actorRole: safeTrim(user?.role).toLowerCase() || "unknown",
    actorEmail: safeTrim(user?.email).toLowerCase(),
  };
}

export function createTargetSnapshot(user) {
  return {
    targetId: user?._id || null,
    targetName: safeTrim(user?.name),
    targetRole: safeTrim(user?.role).toLowerCase(),
    targetEmail: safeTrim(user?.email).toLowerCase(),
  };
}

export async function getUserById(userId) {
  if (!userId) return null;

  await connectDB();
  return User.findById(userId).select(
    "name email role course year assignedCourse facultyType designation",
  );
}

export async function getAuthenticatedUserFromRequest(request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return await getUserById(decoded.id);
  } catch {
    return null;
  }
}

export function buildDashboardVisitDetails(path) {
  const pathname = safeTrim(path).split("?")[0];
  const segments = pathname.split("/").filter(Boolean);
  const role = safeTrim(segments[1]).toLowerCase();
  const section = segments.slice(2).map(titleizeSegment).join(" / ");
  const roleLabel = capitalizeWord(role) || "Portal";

  return {
    actionLabel: `Visited ${roleLabel} Dashboard`,
    details: section ? `Opened ${section}` : "Opened dashboard home",
  };
}

export function getAdminManagementPath(targetUser) {
  const role = safeTrim(targetUser?.role).toLowerCase();

  if (role === "admin") {
    return "/dashboard/admin/admins";
  }

  if (role === "faculty") {
    return "/dashboard/admin/faculty";
  }

  return "/dashboard/admin/students";
}

export function describeManagedUser(targetUser) {
  const role = safeTrim(targetUser?.role).toLowerCase();
  const parts = [
    safeTrim(targetUser?.name),
    safeTrim(targetUser?.email).toLowerCase(),
  ];

  if (role === "student") {
    if (safeTrim(targetUser?.course)) {
      parts.push(safeTrim(targetUser.course).toUpperCase());
    }
    if (targetUser?.year) {
      parts.push(`Year ${targetUser.year}`);
    }
  }

  if (role === "faculty") {
    if (safeTrim(targetUser?.facultyType) === "nonTeaching") {
      if (safeTrim(targetUser?.designation)) {
        parts.push(safeTrim(targetUser.designation));
      }
    } else if (safeTrim(targetUser?.assignedCourse)) {
      parts.push(safeTrim(targetUser.assignedCourse).toUpperCase());
    }
  }

  return parts.filter(Boolean).join(" | ");
}

export async function logActivity({
  actor,
  actionType,
  actionLabel,
  target = null,
  path = "",
  details = "",
  metadata = {},
  dedupeWindowMs = 0,
}) {
  if (!actor || !actionType || !actionLabel) {
    return null;
  }

  try {
    await connectDB();

    const actorSnapshot = createActorSnapshot(actor);
    const targetSnapshot = target ? createTargetSnapshot(target) : {};
    const normalizedPath = safeTrim(path);

    if (dedupeWindowMs > 0) {
      const since = new Date(Date.now() - dedupeWindowMs);
      const existing = await ActivityLog.findOne({
        actorId: actorSnapshot.actorId || null,
        actionType: safeTrim(actionType),
        path: normalizedPath,
        createdAt: { $gte: since },
      }).sort({ createdAt: -1 });

      if (existing) {
        return existing;
      }
    }

    const createdLog = await ActivityLog.create({
      ...actorSnapshot,
      ...targetSnapshot,
      actionType: safeTrim(actionType),
      actionLabel: safeTrim(actionLabel),
      path: normalizedPath,
      details: safeTrim(details),
      metadata: metadata && typeof metadata === "object" ? metadata : {},
    });

    if (actorSnapshot.actorRole === "student" && actorSnapshot.actorId) {
      await User.collection.updateOne(
        { _id: actorSnapshot.actorId },
        {
          $set: {
            studentLastActivityAt: createdLog.createdAt || new Date(),
          },
        },
      );
    }

    return createdLog;
  } catch (error) {
    console.error("ACTIVITY LOG WRITE ERROR:", error);
    return null;
  }
}

export async function logActivityFromRequest(request, options) {
  const actor = await getAuthenticatedUserFromRequest(request);
  if (!actor) return null;

  return logActivity({
    actor,
    ...options,
  });
}
