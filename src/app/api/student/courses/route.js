import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import User from "../../../models/User";
import CourseCatalog from "../../../models/CourseCatalog";
import { getAuthenticatedUserFromRequest } from "../../../lib/activity";
import {
  createEmptyCourseCatalog,
  getCourseName,
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

function isPublishedCatalog(catalogDoc) {
  if (!catalogDoc) return false;
  const status = String(catalogDoc.publishStatus || "published").toLowerCase();
  return status === "published";
}

export async function GET(request) {
  try {
    await connectDB();

    const me = await getAuthenticatedUserFromRequest(request);
    if (!me || String(me.role || "").toLowerCase() !== "student") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const course = String(me.course || "").toUpperCase();
    const year = Number(me.year || 0);

    if (!course || !year) {
      return NextResponse.json(
        { message: "Student course profile is incomplete" },
        { status: 400 },
      );
    }

    const [catalogDoc, teachingFacultyDocs, cohortSize] = await Promise.all([
      CourseCatalog.findOne({ course, year }).lean(),
      User.find(buildTeachingFacultyQuery(course))
        .select("name email assignedCourse")
        .sort({ name: 1 })
        .lean(),
      User.countDocuments({ role: "student", course, year }),
    ]);

    const catalog = isPublishedCatalog(catalogDoc)
      ? {
          ...catalogDoc,
          publishStatus: String(catalogDoc.publishStatus || "published").toLowerCase(),
          isConfigured: true,
        }
      : {
          ...createEmptyCourseCatalog({ course, year }),
          overview: `${getCourseName(course)} Year ${year} is ready for subjects, materials, and academic notices once the catalog is published from the admin panel.`,
          isConfigured: false,
        };

    const subjects = Array.isArray(catalog.subjects) ? catalog.subjects : [];
    const announcements = Array.isArray(catalog.announcements)
      ? catalog.announcements
      : [];
    const allMaterials = subjects.flatMap((subject) =>
      Array.isArray(subject.materials)
        ? subject.materials.map((material) => ({
            ...material,
            subjectName: subject.name || "",
            subjectCode: subject.code || "",
            facultyName: subject.facultyName || "",
          }))
        : [],
    );

    const importantMaterialCount = allMaterials.filter(
      (material) => material.isImportant,
    ).length;

    return NextResponse.json({
      student: {
        _id: me._id,
        name: me.name,
        email: me.email,
        course,
        year,
      },
      catalog: JSON.parse(JSON.stringify(catalog)),
      teachingFaculty: JSON.parse(JSON.stringify(teachingFacultyDocs || [])),
      stats: {
        subjectCount: subjects.length,
        materialCount: allMaterials.length,
        importantMaterialCount,
        announcementCount: announcements.length,
        facultyCount: teachingFacultyDocs.length,
        cohortSize,
      },
    });
  } catch (error) {
    console.error("GET STUDENT COURSES ERROR:", error);
    return NextResponse.json(
      { message: "Unable to load your course hub" },
      { status: 500 },
    );
  }
}
