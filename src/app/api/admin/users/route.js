import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "../../../lib/db";
import User from "../../../models/User";
import { requireAdmin } from "../../../lib/auth";
import {
  deleteStudentProfileImage,
  isBase64Image,
  isRemoteImageUrl,
  uploadStudentProfileImage,
} from "../../../lib/cloudinary";

export const runtime = "nodejs";

function normalizeProfileImage(profileImage) {
  const value = String(profileImage || "").trim();
  if (!value) return "";
  if (!isBase64Image(value) && !isRemoteImageUrl(value)) {
    throw new Error("Invalid profile image");
  }
  return value;
}

/* ================= CREATE USER ================= */
export async function POST(req) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  let uploadedImage = null;

  try {
    await connectDB();

    const {
      name,
      email,
      password,
      role,
      facultyType,
      assignedCourse,
      designation,
      enrollmentNo,
      course,
      year,
      phone,
      profileImage,
    } = await req.json();

    const normalizedName = String(name || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPassword = String(password || "");
    const normalizedRole = String(role || "").trim().toLowerCase();
    const normalizedFacultyType =
      String(facultyType || "").trim() === "nonTeaching"
        ? "nonTeaching"
        : "teaching";
    const normalizedAssignedCourse = String(assignedCourse || "")
      .trim()
      .toUpperCase();
    const normalizedDesignation = String(designation || "").trim();
    const normalizedEnrollmentNo = String(enrollmentNo || "").trim();
    const normalizedCourse = String(course || "").trim().toUpperCase();
    const normalizedPhone = String(phone || "").trim();
    const normalizedProfileImage = normalizeProfileImage(profileImage);
    const normalizedYear =
      year === undefined || year === null || year === ""
        ? undefined
        : Number(year);

    if (normalizedProfileImage && isBase64Image(normalizedProfileImage)) {
      uploadedImage = await uploadStudentProfileImage(normalizedProfileImage);
    }

    const hashedPassword = await bcrypt.hash(normalizedPassword, 10);

    const createdUser = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      role: normalizedRole,
      facultyType:
        normalizedRole === "faculty" ? normalizedFacultyType : undefined,
      assignedCourse:
        normalizedRole === "faculty" && normalizedFacultyType !== "nonTeaching"
          ? normalizedAssignedCourse || undefined
          : undefined,
      designation:
        normalizedRole === "faculty" && normalizedFacultyType === "nonTeaching"
          ? normalizedDesignation || undefined
          : undefined,
      enrollmentNo: normalizedEnrollmentNo || undefined,
      course: normalizedCourse || undefined,
      year: Number.isNaN(normalizedYear) ? undefined : normalizedYear,
      phone:
        normalizedRole === "student" || normalizedRole === "faculty"
          ? normalizedPhone || undefined
          : undefined,
    });

    if (uploadedImage?.profileImage) {
      await User.collection.updateOne(
        { _id: createdUser._id },
        {
          $set: {
            profileImage: uploadedImage.profileImage,
            profileImagePublicId: uploadedImage.profileImagePublicId || "",
          },
        },
      );
    }

    return NextResponse.json({ message: "User created" }, { status: 201 });
  } catch (error) {
    if (uploadedImage?.profileImagePublicId) {
      try {
        await deleteStudentProfileImage(uploadedImage.profileImagePublicId);
      } catch (cleanupError) {
        console.error("CREATE USER CLOUDINARY CLEANUP ERROR:", cleanupError);
      }
    }

    console.error("CREATE USER ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: 500 },
    );
  }
}

/* ================= GET USERS ================= */
export async function GET(req) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const facultyType = searchParams.get("facultyType");

    if (!role) {
      return NextResponse.json(
        { message: "Role query missing" },
        { status: 400 },
      );
    }

    const query = { role };

    if (role === "faculty") {
      if (facultyType === "nonTeaching") {
        query.facultyType = "nonTeaching";
      } else if (facultyType === "teaching") {
        query.$or = [
          { facultyType: "teaching" },
          { facultyType: { $exists: false } },
          { facultyType: null },
        ];
      }
    }

    const users = await User.find(query).select("-password").sort({ name: 1 });

    return NextResponse.json(users);
  } catch (error) {
    console.error("GET USERS ERROR:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
