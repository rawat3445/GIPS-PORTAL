import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "../../../../lib/db";
import User from "../../../../models/User";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import {
  deleteStudentProfileImage,
  isBase64Image,
  isRemoteImageUrl,
  uploadStudentProfileImage,
} from "../../../../lib/cloudinary";
export const runtime = "nodejs";

function normalizeProfileImage(profileImage) {
  const value = String(profileImage || "").trim();
  if (!value) return "";
  if (!isBase64Image(value) && !isRemoteImageUrl(value)) {
    throw new Error("Invalid profile image");
  }
  return value;
}

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return { ok: false };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (String(decoded.role).toLowerCase() !== "admin") return { ok: false };
    return { ok: true, decoded };
  } catch {
    return { ok: false };
  }
}

export async function DELETE(req, { params }) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    await connectDB();

    const { id } =await  params; // ✅ FIX: params is a Promise in your setup [web:170]
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (deletedUser.profileImagePublicId) {
      try {
        await deleteStudentProfileImage(deletedUser.profileImagePublicId);
      } catch (cleanupError) {
        console.error("DELETE CLOUDINARY CLEANUP ERROR:", cleanupError);
      }
    }

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE ERROR:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  let uploadedImage = null;

  try {
    await connectDB();

    const { id } = await params;
    const body = await req.json();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const previousProfileImagePublicId = user.profileImagePublicId || "";
    const updates = {};

    if (typeof body.name === "string" && body.name.trim()) {
      updates.name = body.name.trim();
    }

    if (typeof body.email === "string" && body.email.trim()) {
      updates.email = body.email.trim().toLowerCase();
    }

    if (user.role === "student") {
      if (typeof body.phone === "string" && body.phone.trim()) {
        updates.phone = body.phone.trim();
      }

      if (
        typeof body.enrollmentNo === "string" &&
        body.enrollmentNo.trim()
      ) {
        updates.enrollmentNo = body.enrollmentNo.trim();
      }

      if (typeof body.course === "string" && body.course.trim()) {
        updates.course = body.course.trim().toUpperCase();
      }

      if (body.year !== undefined && body.year !== null && body.year !== "") {
        const parsedYear = Number(body.year);
        if (!Number.isNaN(parsedYear) && parsedYear >= 1 && parsedYear <= 4) {
          updates.year = parsedYear;
        }
      }
    }

    if (user.role === "faculty") {
      if (typeof body.assignedCourse === "string" && body.assignedCourse.trim()) {
        updates.assignedCourse = body.assignedCourse.trim().toUpperCase();
      }
    }

    if (typeof body.password === "string" && body.password.trim()) {
      updates.password = await bcrypt.hash(body.password.trim(), 10);
    }

    if (body.removeProfileImage === true) {
      updates.profileImage = "";
      updates.profileImagePublicId = "";
    } else if (
      typeof body.profileImage === "string" &&
      body.profileImage.trim()
    ) {
      const normalizedProfileImage = normalizeProfileImage(body.profileImage);

      if (isBase64Image(normalizedProfileImage)) {
        uploadedImage = await uploadStudentProfileImage(normalizedProfileImage);
        updates.profileImage = uploadedImage.profileImage;
        updates.profileImagePublicId = uploadedImage.profileImagePublicId;
      } else {
        updates.profileImage = normalizedProfileImage;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { message: "No valid fields provided for update" },
        { status: 400 }
      );
    }

    await User.collection.updateOne(
      { _id: user._id },
      { $set: updates },
    );

    const updatedUser = await User.collection.findOne(
      { _id: user._id },
      {
        projection: {
          password: 0,
        },
      },
    );

    if (!updatedUser) {
      throw new Error("User not found after update");
    }

    if (uploadedImage?.profileImage && !updatedUser.profileImage) {
      throw new Error("Student photo could not be saved to the database");
    }

    if (
      previousProfileImagePublicId &&
      (body.removeProfileImage === true || uploadedImage?.profileImagePublicId) &&
      previousProfileImagePublicId !== updatedUser.profileImagePublicId
    ) {
      try {
        await deleteStudentProfileImage(previousProfileImagePublicId);
      } catch (cleanupError) {
        console.error("PATCH CLOUDINARY CLEANUP ERROR:", cleanupError);
      }
    }

    return NextResponse.json(
      { message: "User updated successfully", user: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    if (uploadedImage?.profileImagePublicId) {
      try {
        await deleteStudentProfileImage(uploadedImage.profileImagePublicId);
      } catch (cleanupError) {
        console.error("PATCH CLOUDINARY ROLLBACK ERROR:", cleanupError);
      }
    }

    console.error("PATCH ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: 500 },
    );
  }
}
