import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export function middleware(req) {
  const token = req.cookies.get("token")?.value;
  const path = req.nextUrl.pathname;

  if (path.startsWith("/dashboard")) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));

    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);

      if (path.startsWith("/dashboard/admin") && user.role !== "admin")
        return NextResponse.redirect(new URL("/unauthorized", req.url));

      if (path.startsWith("/dashboard/faculty") && user.role !== "faculty")
        return NextResponse.redirect(new URL("/unauthorized", req.url));

      if (path.startsWith("/dashboard/student") && user.role !== "student")
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