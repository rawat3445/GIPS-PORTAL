import { NextResponse } from "next/server";
import { logActivityFromRequest } from "../../../lib/activity";

export async function POST(request) {
  try {
    await logActivityFromRequest(request, {
      actionType: "logout",
      actionLabel: "Signed out",
      path: "/login",
      details: "Signed out of the portal",
    });
  } catch (error) {
    console.error("LOGOUT ACTIVITY ERROR:", error);
  }

  const response = NextResponse.json({ message: "Logged out" });

  response.cookies.set("token", "", {
    expires: new Date(0),
    path: "/",
  });

  return response;
}
