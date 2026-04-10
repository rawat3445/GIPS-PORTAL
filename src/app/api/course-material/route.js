import { NextResponse } from "next/server";
import connectDB from "../../lib/db";
import CourseCatalog from "../../models/CourseCatalog";
import { getAuthenticatedUserFromRequest } from "../../lib/activity";
import { buildCourseResourceAccessUrl } from "../../lib/cloudinary";

function normalizeValue(value) {
  return String(value || "").trim();
}

function findMaterialByPublicId(catalog, publicId) {
  const subjects = Array.isArray(catalog?.subjects) ? catalog.subjects : [];

  for (const subject of subjects) {
    const materials = Array.isArray(subject?.materials) ? subject.materials : [];

    for (const material of materials) {
      if (normalizeValue(material?.resourcePublicId) === publicId) {
        return material;
      }
    }
  }

  return null;
}

export async function GET(request) {
  try {
    await connectDB();

    const me = await getAuthenticatedUserFromRequest(request);
    if (!me) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const publicId = normalizeValue(searchParams.get("publicId"));
    const shouldDownload = searchParams.get("download") === "1";
    const role = normalizeValue(me.role).toLowerCase();

    if (!publicId) {
      return NextResponse.json(
        { message: "Resource id is required" },
        { status: 400 },
      );
    }

    let course = "";
    let year = 0;

    if (role === "student") {
      course = normalizeValue(me.course).toUpperCase();
      year = Number(me.year || 0);
    } else if (role === "faculty") {
      if (normalizeValue(me.facultyType) === "nonTeaching") {
        return NextResponse.json(
          { message: "Non-teaching faculty cannot access course files" },
          { status: 403 },
        );
      }

      course = normalizeValue(me.assignedCourse).toUpperCase();
      year = Number(searchParams.get("year") || 0);
    } else if (role === "admin") {
      course = normalizeValue(searchParams.get("course")).toUpperCase();
      year = Number(searchParams.get("year") || 0);
    } else {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (!course || !year) {
      return NextResponse.json(
        { message: "Course and year are required" },
        { status: 400 },
      );
    }

    const catalog = await CourseCatalog.findOne({ course, year }).lean();
    if (!catalog) {
      return NextResponse.json(
        { message: "Course catalog not found" },
        { status: 404 },
      );
    }

    const material = findMaterialByPublicId(catalog, publicId);
    if (!material) {
      return NextResponse.json(
        { message: "Course file not found" },
        { status: 404 },
      );
    }

    const accessUrl = buildCourseResourceAccessUrl({
      resourcePublicId: material.resourcePublicId,
      uploadedFileName: material.uploadedFileName,
      uploadedMimeType: material.uploadedMimeType,
      attachment: shouldDownload,
    });

    return NextResponse.redirect(accessUrl);
  } catch (error) {
    console.error("COURSE MATERIAL ACCESS ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Unable to open course file" },
      { status: 500 },
    );
  }
}
