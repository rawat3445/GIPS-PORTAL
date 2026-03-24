import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function requireAdmin() {
  const cookieStore = await cookies(); // ✅ FIX
  const token = cookieStore.get("token")?.value;

  if (!token) return { ok: false };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return { ok: false };
    }

    return { ok: true, decoded };
  } catch (err) {
    return { ok: false };
  }
}
