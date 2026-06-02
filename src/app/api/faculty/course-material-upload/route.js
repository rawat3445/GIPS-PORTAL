import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import User from "../../../models/User";
import { requireFaculty } from "../../../lib/auth";
import { uploadCourseResourceToGCS } from "../../../lib/gcs";

const MAX_FILE_SIZE_BYTES = 250 * 1024 * 1024;
const FILE_KIND_BY_MIME_TYPE = new Map([
  ["application/pdf", "pdf"],
  ["application/msword", "doc"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "doc"],
]);

const FILE_KIND_BY_EXTENSION = new Map([
  ["pdf", "pdf"],
  ["doc", "doc"],
  ["docx", "doc"],
]);

const MIME_TYPE_BY_EXTENSION = new Map([
  ["pdf", "application/pdf"],
  ["doc", "application/msword"],
  ["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
]);

function getFileExtension(fileName) {
  const normalized = String(fileName || "").trim().toLowerCase();
  const segments = normalized.split(".");
  return segments.length > 1 ? segments.at(-1) : "";
}

function getUploadFileMeta(file) {
  const mimeType = String(file?.type || "").trim().toLowerCase();
  const extension = getFileExtension(file?.name);
  const kindFromMimeType = FILE_KIND_BY_MIME_TYPE.get(mimeType);
  const kindFromExtension = FILE_KIND_BY_EXTENSION.get(extension);
  const materialType = kindFromMimeType || kindFromExtension || "";

  if (!materialType) {
    return null;
  }

  return {
    materialType,
    mimeType: mimeType || MIME_TYPE_BY_EXTENSION.get(extension) || "",
  };
}

export async function POST(request) {
  const auth = await requireFaculty();
  if (!auth.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    await connectDB();

    const faculty = await User.findById(auth.decoded.id).select(
      "name facultyType assignedCourse",
    );

    if (!faculty) {
      return NextResponse.json({ message: "Faculty not found" }, { status: 404 });
    }

    if (String(faculty.facultyType || "").trim() === "nonTeaching") {
      return NextResponse.json(
        { message: "Non-teaching faculty cannot upload course files" },
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

    const formData = await request.formData();
    const file = formData.get("file");
    const year = Number(formData.get("year"));

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "Please choose a file to upload" },
        { status: 400 },
      );
    }

    if (!year) {
      return NextResponse.json(
        { message: "Year is required for this upload" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { message: "File must be 250 MB or smaller" },
        { status: 400 },
      );
    }

    const fileMeta = getUploadFileMeta(file);

    if (!fileMeta) {
      return NextResponse.json(
        { message: "Only PDF, DOC, and DOCX files are supported right now" },
        { status: 400 },
      );
    }

    const uploadedFile = await uploadCourseResourceToGCS(file, {
      course,
      year,
    });

    return NextResponse.json({
      message: "File uploaded successfully",
      file: {
        ...uploadedFile,
        type: fileMeta.materialType,
        uploadedMimeType: uploadedFile.uploadedMimeType || fileMeta.mimeType,
      },
    });
  } catch (error) {
    console.error("FACULTY MATERIAL UPLOAD ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Unable to upload file" },
      { status: 500 },
    );
  }
}
