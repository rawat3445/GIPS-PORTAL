import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import User from "../../../models/User";
import CourseCatalog from "../../../models/CourseCatalog";
import { requireFaculty } from "../../../lib/auth";
import {
  createEmptyCourseCatalog,
  sanitizeCourseCatalogPayload,
} from "../../../lib/courseCatalog";

async function getFacultyProfile(userId) {
  return User.findById(userId).select(
    "name email role facultyType assignedCourse designation",
  );
}

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
  const auth = await requireFaculty();
  if (!auth.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    await connectDB();

    const faculty = await getFacultyProfile(auth.decoded.id);
    if (!faculty) {
      return NextResponse.json({ message: "Faculty not found" }, { status: 404 });
    }

    if (String(faculty.facultyType || "").trim() === "nonTeaching") {
      return NextResponse.json(
        { message: "Non-teaching faculty cannot manage course content" },
        { status: 403 },
      );
    }

    const course = String(faculty.assignedCourse || "").toUpperCase();
    const { searchParams } = new URL(request.url);
    const year = Number(searchParams.get("year"));

    if (!course || !year) {
      return NextResponse.json(
        { message: "Assigned course and year are required" },
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
      faculty: {
        _id: faculty._id,
        name: faculty.name,
        email: faculty.email,
        assignedCourse: course,
      },
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
    console.error("GET FACULTY COURSE CATALOG ERROR:", error);
    return NextResponse.json(
      { message: "Unable to load course content" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const auth = await requireFaculty();
  if (!auth.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    await connectDB();

    const faculty = await getFacultyProfile(auth.decoded.id);
    if (!faculty) {
      return NextResponse.json({ message: "Faculty not found" }, { status: 404 });
    }

    if (String(faculty.facultyType || "").trim() === "nonTeaching") {
      return NextResponse.json(
        { message: "Non-teaching faculty cannot manage course content" },
        { status: 403 },
      );
    }

    const course = String(faculty.assignedCourse || "").toUpperCase();
    if (!course) {
      return NextResponse.json(
        { message: "Assigned course is missing" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const payload = sanitizeCourseCatalogPayload({
      ...body,
      course,
    });

    if (!payload.year) {
      return NextResponse.json(
        { message: "Year is required" },
        { status: 400 },
      );
    }

    const catalog = await CourseCatalog.findOneAndUpdate(
      { course, year: payload.year },
      {
        $set: {
          ...payload,
          course,
          updatedBy: faculty._id,
          updatedByName: faculty.name || "Faculty",
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
      message: "Course content saved successfully",
      catalog: JSON.parse(JSON.stringify(catalog)),
    });
  } catch (error) {
    console.error("SAVE FACULTY COURSE CATALOG ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Unable to save course content" },
      { status: 500 },
    );
  }
}
