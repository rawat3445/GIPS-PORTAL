import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req) {
  const token = req.cookies.get("token")?.value;
  const path = req.nextUrl.pathname;

  if (path.startsWith("/dashboard")) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      const role = String(payload.role || "").toLowerCase();

      if (path.startsWith("/dashboard/admin") && role !== "admin")
        return NextResponse.redirect(new URL("/unauthorized", req.url));

      if (path.startsWith("/dashboard/faculty") && role !== "faculty")
        return NextResponse.redirect(new URL("/unauthorized", req.url));

      if (path.startsWith("/dashboard/student") && role !== "student")
        return NextResponse.redirect(new URL("/unauthorized", req.url));
    } catch (err) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
