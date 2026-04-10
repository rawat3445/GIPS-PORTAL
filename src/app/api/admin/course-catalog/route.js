import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import User from "../../../models/User";
import CourseCatalog from "../../../models/CourseCatalog";
import { requireAdmin } from "../../../lib/auth";
import {
  createEmptyCourseCatalog,
  sanitizeCourseCatalogPayload,
} from "../../../lib/courseCatalog";

function buildTeachingFacultyQuery(course) {
  return {
    role: "faculty",
    assignedCourse: String(course || "").toUpperCase(),
    $or: [
      { facultyType: "teaching" },
      { facultyType: { $exists: false } },
      { facultyType: null },
    ],
  };
}

export async function GET(request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const course = String(searchParams.get("course") || "")
      .trim()
      .toUpperCase();
    const year = Number(searchParams.get("year"));

    if (!course || !year) {
      return NextResponse.json(
        { message: "Course and year are required" },
        { status: 400 },
      );
    }

    const [catalogDoc, teachingFacultyDocs] = await Promise.all([
      CourseCatalog.findOne({ course, year }).lean(),
      User.find(buildTeachingFacultyQuery(course))
        .select("name email assignedCourse")
        .sort({ name: 1 })
        .lean(),
    ]);

    return NextResponse.json({
      catalog: JSON.parse(
        JSON.stringify(
          catalogDoc || {
            ...createEmptyCourseCatalog({ course, year }),
            isConfigured: false,
          },
        ),
      ),
      teachingFaculty: JSON.parse(JSON.stringify(teachingFacultyDocs || [])),
    });
  } catch (error) {
    console.error("GET COURSE CATALOG ERROR:", error);
    return NextResponse.json(
      { message: "Unable to load course catalog" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    await connectDB();

    const body = await request.json();
    const payload = sanitizeCourseCatalogPayload(body);

    if (!payload.course || !payload.year) {
      return NextResponse.json(
        { message: "Course and year are required" },
        { status: 400 },
      );
    }

    const actor = await User.findById(auth.decoded.id).select("name");

    const catalog = await CourseCatalog.findOneAndUpdate(
      { course: payload.course, year: payload.year },
      {
        $set: {
          ...payload,
          updatedBy: auth.decoded.id,
          updatedByName: actor?.name || "Admin",
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).lean();

    return NextResponse.json({
      message: "Course catalog saved successfully",
      catalog: JSON.parse(JSON.stringify(catalog)),
    });
  } catch (error) {
    console.error("SAVE COURSE CATALOG ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Unable to save course catalog" },
      { status: 500 },
    );
  }
}
