import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "../../../../lib/db";
import User from "../../../../models/User";
import { requireAdmin } from "../../../../lib/auth";
import {
  describeManagedUser,
  getAdminManagementPath,
  getUserById,
  logActivity,
} from "../../../../lib/activity";
import {
  deleteStudentProfileImage,
  isBase64Image,
  isRemoteImageUrl,
  uploadStudentProfileImage,
} from "../../../../lib/cloudinary";
import { toISODate } from "../../../../lib/attendanceEvents";

export const runtime = "nodejs";

function normalizeProfileImage(profileImage) {
  const value = String(profileImage || "").trim();
  if (!value) return "";
  if (!isBase64Image(value) && !isRemoteImageUrl(value)) {
    throw new Error("Invalid profile image");
  }
  return value;
}

function buildManagedUserActionLabel(action, role) {
  const normalizedRole = String(role || "").trim().toLowerCase() || "user";
  const roleLabel =
    normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1);

  return `${action} ${roleLabel}`;
}

function pushChangedField(changedFields, label) {
  if (!changedFields.includes(label)) {
    changedFields.push(label);
  }
}

export async function DELETE(req, { params }) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    await connectDB();

    const actor = await getUserById(auth.decoded.id);
    const { id } = await params;
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

    await logActivity({
      actor,
      actionType: "user_delete",
      actionLabel: buildManagedUserActionLabel("Deleted", deletedUser.role),
      target: deletedUser,
      path: getAdminManagementPath(deletedUser),
      details: describeManagedUser(deletedUser),
    });

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

    const actor = await getUserById(auth.decoded.id);
    const { id } = await params;
    const body = await req.json();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const previousProfileImagePublicId = user.profileImagePublicId || "";
    const updates = {};
    const unsetFields = {};
    const changedFields = [];

    if (typeof body.name === "string" && body.name.trim()) {
      updates.name = body.name.trim();
      pushChangedField(changedFields, "name");
    }

    if (typeof body.email === "string" && body.email.trim()) {
      updates.email = body.email.trim().toLowerCase();
      pushChangedField(changedFields, "email");
    }

    if (user.role === "student") {
      if (typeof body.phone === "string" && body.phone.trim()) {
        updates.phone = body.phone.trim();
        pushChangedField(changedFields, "phone");
      }

      if (typeof body.parentContactNo === "string") {
        const trimmedParentContactNo = body.parentContactNo.trim();
        if (trimmedParentContactNo) {
          updates.parentContactNo = trimmedParentContactNo;
          pushChangedField(changedFields, "parent contact no");
        } else if (user.parentContactNo) {
          unsetFields.parentContactNo = 1;
          pushChangedField(changedFields, "parent contact no");
        }
      }

      if (typeof body.studentCardAddress === "string") {
        const trimmedStudentCardAddress = body.studentCardAddress.trim();
        if (trimmedStudentCardAddress) {
          updates.studentCardAddress = trimmedStudentCardAddress;
          pushChangedField(changedFields, "student residential address");
        } else if (user.studentCardAddress) {
          unsetFields.studentCardAddress = 1;
          pushChangedField(changedFields, "student residential address");
        }
      }

      if (typeof body.bloodGroup === "string") {
        const trimmedBloodGroup = body.bloodGroup.trim().toUpperCase();
        if (trimmedBloodGroup) {
          updates.bloodGroup = trimmedBloodGroup;
          pushChangedField(changedFields, "blood group");
        } else if (user.bloodGroup) {
          unsetFields.bloodGroup = 1;
          pushChangedField(changedFields, "blood group");
        }
      }

      if (typeof body.session === "string") {
        const trimmedSession = body.session.trim();
        if (trimmedSession) {
          updates.session = trimmedSession;
          pushChangedField(changedFields, "session");
        } else if (user.session) {
          unsetFields.session = 1;
          pushChangedField(changedFields, "session");
        }
      }

      if (typeof body.course === "string" && body.course.trim()) {
        updates.course = body.course.trim().toUpperCase();
        pushChangedField(changedFields, "course");
      }

      if (body.year !== undefined && body.year !== null && body.year !== "") {
        const parsedYear = Number(body.year);
        if (!Number.isNaN(parsedYear) && parsedYear >= 1 && parsedYear <= 4) {
          updates.year = parsedYear;
          pushChangedField(changedFields, "year");
        }
      }
    }

    if (user.role === "faculty") {
      const nextFacultyType =
        typeof body.facultyType === "string" && body.facultyType.trim()
          ? body.facultyType.trim() === "nonTeaching"
            ? "nonTeaching"
            : "teaching"
          : user.facultyType || "teaching";

      if (typeof body.facultyType === "string" && body.facultyType.trim()) {
        updates.facultyType = nextFacultyType;
        pushChangedField(changedFields, "faculty type");
      }

      if (typeof body.phone === "string") {
        const trimmedPhone = body.phone.trim();
        if (trimmedPhone) {
          updates.phone = trimmedPhone;
          pushChangedField(changedFields, "phone");
        } else if (user.phone) {
          unsetFields.phone = 1;
          pushChangedField(changedFields, "phone");
        }
      }

      if (typeof body.facultyCardAddress === "string") {
        const trimmedFacultyCardAddress = body.facultyCardAddress.trim();
        if (trimmedFacultyCardAddress) {
          updates.facultyCardAddress = trimmedFacultyCardAddress;
          pushChangedField(changedFields, "faculty address");
        } else if (user.facultyCardAddress) {
          unsetFields.facultyCardAddress = 1;
          pushChangedField(changedFields, "faculty address");
        }
      }

      if (nextFacultyType === "nonTeaching") {
        unsetFields.assignedCourse = 1;
        pushChangedField(changedFields, "assigned course");

        if (typeof body.designation === "string") {
          const trimmedDesignation = body.designation.trim();
          if (trimmedDesignation) {
            updates.designation = trimmedDesignation;
            pushChangedField(changedFields, "designation");
          } else if (user.designation) {
            unsetFields.designation = 1;
            pushChangedField(changedFields, "designation");
          }
        }
      } else {
        unsetFields.designation = 1;
        pushChangedField(changedFields, "designation");

        if (
          typeof body.assignedCourse === "string" &&
          body.assignedCourse.trim()
        ) {
          updates.assignedCourse = body.assignedCourse.trim().toUpperCase();
          pushChangedField(changedFields, "assigned course");
        }
      }
    }

    if (typeof body.password === "string" && body.password.trim()) {
      updates.password = await bcrypt.hash(body.password.trim(), 10);
      if (user.role === "student") {
        const resetDate = toISODate(new Date());
        updates.studentLoginBlocked = false;
        updates.studentLoginBlockedAt = null;
        updates.studentLoginWindowStartDate = resetDate;
        updates.studentLoginResetAt = resetDate;
        updates.studentLastLoginAt = null;
        updates.studentLastActivityAt = null;
        pushChangedField(changedFields, "student login access reset");
      }
      pushChangedField(changedFields, "password");
    }

    if (body.removeProfileImage === true) {
      updates.profileImage = "";
      updates.profileImagePublicId = "";
      pushChangedField(changedFields, "profile image");
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

      pushChangedField(changedFields, "profile image");
    }

    if (
      Object.keys(updates).length === 0 &&
      Object.keys(unsetFields).length === 0
    ) {
      return NextResponse.json(
        { message: "No valid fields provided for update" },
        { status: 400 },
      );
    }

    const updateDoc = {};
    if (Object.keys(updates).length > 0) {
      updateDoc.$set = updates;
    }
    if (Object.keys(unsetFields).length > 0) {
      updateDoc.$unset = unsetFields;
    }

    await User.collection.updateOne({ _id: user._id }, updateDoc);

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
      (body.removeProfileImage === true ||
        uploadedImage?.profileImagePublicId) &&
      previousProfileImagePublicId !== updatedUser.profileImagePublicId
    ) {
      try {
        await deleteStudentProfileImage(previousProfileImagePublicId);
      } catch (cleanupError) {
        console.error("PATCH CLOUDINARY CLEANUP ERROR:", cleanupError);
      }
    }

    await logActivity({
      actor,
      actionType: "user_update",
      actionLabel: buildManagedUserActionLabel("Updated", updatedUser.role),
      target: updatedUser,
      path: getAdminManagementPath(updatedUser),
      details: [
        describeManagedUser(updatedUser),
        changedFields.length ? `Fields: ${changedFields.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join(" | "),
      metadata: {
        changedFields,
      },
    });

    return NextResponse.json(
      { message: "User updated successfully", user: updatedUser },
      { status: 200 },
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
