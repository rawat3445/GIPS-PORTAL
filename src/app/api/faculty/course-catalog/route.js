import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import User from "../../../models/User";
import CourseCatalog from "../../../models/CourseCatalog";
import ActivityLog from "../../../models/ActivityLog";
import { requireFaculty } from "../../../lib/auth";
import {
  createEmptyCourseCatalog,
  sanitizeCourseCatalogPayload,
} from "../../../lib/courseCatalog";
import { logActivity } from "../../../lib/activity";
import { deleteCourseResourceFromGCS } from "../../../lib/gcs";

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

function normalizeCatalogForFaculty(catalogDoc, { course, year } = {}) {
  if (!catalogDoc) {
    return {
      ...createEmptyCourseCatalog({ course, year }),
      isConfigured: false,
    };
  }

  return {
    ...catalogDoc,
    publishStatus: String(catalogDoc.publishStatus || "published").toLowerCase(),
    isConfigured: true,
  };
}

function collectMaterialRefs(catalogDoc) {
  const refs = new Map();
  const subjects = Array.isArray(catalogDoc?.subjects) ? catalogDoc.subjects : [];

  subjects.forEach((subject) => {
    const materials = Array.isArray(subject?.materials) ? subject.materials : [];
    materials.forEach((material) => {
      const resourcePublicId = String(material?.resourcePublicId || "").trim();
      if (!resourcePublicId) return;

      refs.set(resourcePublicId, {
        title: String(material?.title || "").trim(),
        storageProvider: String(material?.storageProvider || "").trim().toLowerCase(),
        uploadedFileName: String(material?.uploadedFileName || "").trim(),
      });
    });
  });

  return refs;
}

function buildYearSummary(catalogDoc) {
  const subjects = Array.isArray(catalogDoc?.subjects) ? catalogDoc.subjects : [];
  const materialCount = subjects.reduce(
    (total, subject) =>
      total + (Array.isArray(subject?.materials) ? subject.materials.length : 0),
    0,
  );

  return {
    year: Number(catalogDoc?.year || 0),
    subjectCount: subjects.length,
    materialCount,
    publishStatus: String(catalogDoc?.publishStatus || "published").toLowerCase(),
    updatedAt: catalogDoc?.updatedAt || null,
  };
}

function resolvePreferredYear(yearSummaries, fallbackYear) {
  const normalizedFallback = Number(fallbackYear || 0);
  const candidates = Array.isArray(yearSummaries) ? yearSummaries : [];

  const withMaterials = candidates
    .filter((item) => Number(item?.materialCount || 0) > 0)
    .sort(
      (a, b) =>
        new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime(),
    );
  if (withMaterials.length > 0) {
    return Number(withMaterials[0].year || normalizedFallback || 1);
  }

  const withSubjects = candidates
    .filter((item) => Number(item?.subjectCount || 0) > 0)
    .sort(
      (a, b) =>
        new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime(),
    );
  if (withSubjects.length > 0) {
    return Number(withSubjects[0].year || normalizedFallback || 1);
  }

  const latestUpdated = candidates
    .filter((item) => item?.updatedAt)
    .sort(
      (a, b) =>
        new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime(),
    );
  if (latestUpdated.length > 0) {
    return Number(latestUpdated[0].year || normalizedFallback || 1);
  }

  return normalizedFallback || 1;
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

    const [catalogDoc, teachingFacultyDocs, historyDocs, courseCatalogDocs] = await Promise.all([
      CourseCatalog.findOne({ course, year }).lean(),
      User.find(buildTeachingFacultyQuery(course))
        .select("name email assignedCourse")
        .sort({ name: 1 })
        .lean(),
      ActivityLog.find({
        actorId: faculty._id,
        actorRole: "faculty",
        actionType: {
          $in: [
            "course_catalog_saved",
            "course_catalog_published",
            "course_catalog_unpublished",
            "course_catalog_materials_deleted",
          ],
        },
        "metadata.course": course,
        "metadata.year": year,
        })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      CourseCatalog.find({ course })
        .select("year publishStatus updatedAt subjects")
        .sort({ year: 1 })
        .lean(),
    ]);

    const yearSummaries = courseCatalogDocs.map((item) => buildYearSummary(item));
    const preferredYear = resolvePreferredYear(yearSummaries, year);

    return NextResponse.json({
      faculty: {
        _id: faculty._id,
        name: faculty.name,
        email: faculty.email,
        assignedCourse: course,
      },
      catalog: JSON.parse(
        JSON.stringify(normalizeCatalogForFaculty(catalogDoc, { course, year })),
      ),
      yearSummaries,
      preferredYear,
      teachingFaculty: JSON.parse(JSON.stringify(teachingFacultyDocs || [])),
      history: JSON.parse(JSON.stringify(historyDocs || [])),
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
    const action = String(body?.action || "").trim().toLowerCase();
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

    const existingCatalog = await CourseCatalog.findOne({
      course,
      year: payload.year,
    }).lean();
    const existingRefs = collectMaterialRefs(existingCatalog);
    const nextRefs = collectMaterialRefs(payload);
    const removedRefs = [...existingRefs.entries()].filter(
      ([resourcePublicId]) => !nextRefs.has(resourcePublicId),
    );

    await Promise.all(
      removedRefs.map(async ([resourcePublicId, ref]) => {
        if (ref.storageProvider === "gcs") {
          await deleteCourseResourceFromGCS(resourcePublicId);
        }
      }),
    );

    const nextPublishStatus =
      action === "publish"
        ? "published"
        : action === "unpublish"
          ? "draft"
          : String(
              payload.publishStatus ||
                existingCatalog?.publishStatus ||
                "draft",
            ).toLowerCase() === "published"
            ? "published"
            : "draft";
    const nextPublishedAt =
      nextPublishStatus === "published"
        ? action === "publish" || !existingCatalog?.publishedAt
          ? new Date()
          : existingCatalog.publishedAt
        : null;
    const nextPublishedBy =
      nextPublishStatus === "published"
        ? action === "publish" || !existingCatalog?.publishedBy
          ? faculty._id
          : existingCatalog.publishedBy
        : null;
    const nextPublishedByName =
      nextPublishStatus === "published"
        ? action === "publish" || !existingCatalog?.publishedByName
          ? faculty.name || "Faculty"
          : existingCatalog.publishedByName
        : "";

    const catalog = await CourseCatalog.findOneAndUpdate(
      { course, year: payload.year },
      {
        $set: {
          ...payload,
          course,
          publishStatus: nextPublishStatus,
          updatedBy: faculty._id,
          updatedByName: faculty.name || "Faculty",
          publishedAt: nextPublishedAt,
          publishedBy: nextPublishedBy,
          publishedByName: nextPublishedByName,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).lean();

    if (removedRefs.length > 0) {
      await logActivity({
        actor: faculty,
        actionType: "course_catalog_materials_deleted",
        actionLabel: "Deleted course materials",
        path: "/dashboard/faculty/upload-materials",
        details: `Deleted ${removedRefs.length} course material${removedRefs.length === 1 ? "" : "s"} from ${course} Year ${payload.year}`,
        metadata: {
          course,
          year: payload.year,
          deletedMaterials: removedRefs.map(([resourcePublicId, ref]) => ({
            resourcePublicId,
            title: ref.title,
            uploadedFileName: ref.uploadedFileName,
            storageProvider: ref.storageProvider,
          })),
        },
      });
    }

    await logActivity({
      actor: faculty,
      actionType:
        action === "publish"
          ? "course_catalog_published"
          : action === "unpublish"
            ? "course_catalog_unpublished"
            : "course_catalog_saved",
      actionLabel:
        action === "publish"
          ? "Published course content"
          : action === "unpublish"
            ? "Moved course content to draft"
            : "Saved course content draft",
      path: "/dashboard/faculty/upload-materials",
      details:
        action === "publish"
          ? `Published ${course} Year ${payload.year} course content`
          : action === "unpublish"
            ? `Moved ${course} Year ${payload.year} course content to draft`
            : `Saved ${course} Year ${payload.year} course content as draft`,
      metadata: {
        course,
        year: payload.year,
        publishStatus: nextPublishStatus,
        subjectCount: Array.isArray(payload.subjects) ? payload.subjects.length : 0,
        announcementCount: Array.isArray(payload.announcements)
          ? payload.announcements.length
          : 0,
        materialCount: Array.isArray(payload.subjects)
          ? payload.subjects.reduce(
              (total, subject) =>
                total +
                (Array.isArray(subject.materials) ? subject.materials.length : 0),
              0,
            )
          : 0,
      },
    });

    const historyDocs = await ActivityLog.find({
      actorId: faculty._id,
      actorRole: "faculty",
      actionType: {
        $in: [
          "course_catalog_saved",
          "course_catalog_published",
          "course_catalog_unpublished",
          "course_catalog_materials_deleted",
        ],
      },
      "metadata.course": course,
      "metadata.year": payload.year,
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({
      message:
        action === "publish"
          ? "Course content published successfully"
          : action === "unpublish"
            ? "Course content moved to draft successfully"
            : "Course content draft saved successfully",
      catalog: JSON.parse(
        JSON.stringify(normalizeCatalogForFaculty(catalog, { course, year: payload.year })),
      ),
      history: JSON.parse(JSON.stringify(historyDocs || [])),
    });
  } catch (error) {
    console.error("SAVE FACULTY COURSE CATALOG ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Unable to save course content" },
      { status: 500 },
    );
  }
}
