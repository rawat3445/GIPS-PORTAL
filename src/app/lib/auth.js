import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

async function getDecodedToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const decoded = await getDecodedToken();
  if (!decoded) {
    return { ok: false };
  }

  if (String(decoded.role || "").toLowerCase() !== "admin") {
    return { ok: false };
  }

  return { ok: true, decoded };
}

export async function requireFaculty() {
  const decoded = await getDecodedToken();
  if (!decoded) {
    return { ok: false };
  }

  if (String(decoded.role || "").toLowerCase() !== "faculty") {
    return { ok: false };
  }

  return { ok: true, decoded };
}

export async function requireStudent() {
  const decoded = await getDecodedToken();
  if (!decoded) {
    return { ok: false };
  }

  if (String(decoded.role || "").toLowerCase() !== "student") {
    return { ok: false };
  }

  return { ok: true, decoded };
}
