import crypto from "crypto";

const GCS_HOST = "storage.googleapis.com";
const COURSE_RESOURCE_FOLDER = "gips_portal/course_resources";

function getConfig() {
  const projectId = process.env.GCS_PROJECT_ID;
  const bucketName = process.env.GCS_BUCKET_NAME;
  const accessKeyId = process.env.GCS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.GCS_SECRET_ACCESS_KEY;

  if (!projectId || !bucketName || !accessKeyId || !secretAccessKey) {
    throw new Error("Google Cloud Storage is not configured");
  }

  return {
    projectId,
    bucketName,
    accessKeyId,
    secretAccessKey,
  };
}

function sanitizeFolderSegment(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sanitizeFileName(fileName) {
  const normalized = String(fileName || "").trim();
  const fallback = "course-resource";
  const safeName = normalized || fallback;

  return safeName
    .replace(/[^\w.\-() ]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "") || fallback;
}

function encodePathSegment(value) {
  return encodeURIComponent(String(value || "").trim()).replace(/%2F/g, "/");
}

function buildObjectKey({ course, year, fileName }) {
  const normalizedCourse = sanitizeFolderSegment(course) || "course";
  const normalizedYear = sanitizeFolderSegment(year) || "general";
  const timestamp = Date.now();
  const safeFileName = sanitizeFileName(fileName);

  return `${COURSE_RESOURCE_FOLDER}/${normalizedCourse}/year-${normalizedYear}/${timestamp}-${safeFileName}`;
}

function buildCanonicalResource(objectKey) {
  const { bucketName } = getConfig();
  return `/${bucketName}/${objectKey}`;
}

function buildGCSObjectUrl(objectKey) {
  const { bucketName } = getConfig();
  return `https://${GCS_HOST}/${bucketName}/${encodePathSegment(objectKey)}`;
}

function buildV2AuthHeaders({
  method,
  objectKey,
  contentType = "",
  contentMd5 = "",
  extensionHeaders = {},
} = {}) {
  const { accessKeyId, secretAccessKey } = getConfig();
  const date = new Date().toUTCString();
  const normalizedExtensionHeaders = Object.entries(extensionHeaders)
    .map(([key, value]) => [String(key || "").trim().toLowerCase(), String(value || "").trim()])
    .filter(([key, value]) => key && value)
    .sort(([a], [b]) => a.localeCompare(b));
  const canonicalizedExtensionHeaders = normalizedExtensionHeaders
    .map(([key, value]) => `${key}:${value}\n`)
    .join("");
  const stringToSign = [
    String(method || "GET").toUpperCase(),
    contentMd5,
    contentType,
    date,
    `${canonicalizedExtensionHeaders}${buildCanonicalResource(objectKey)}`,
  ].join("\n");
  const signature = crypto
    .createHmac("sha1", secretAccessKey)
    .update(stringToSign)
    .digest("base64");

  const headers = {
    Authorization: `AWS ${accessKeyId}:${signature}`,
    Date: date,
  };

  normalizedExtensionHeaders.forEach(([key, value]) => {
    headers[key] = value;
  });

  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  if (contentMd5) {
    headers["Content-MD5"] = contentMd5;
  }

  return headers;
}

export function buildGCSObjectOriginUrl(objectKey) {
  const normalizedObjectKey = String(objectKey || "").trim();
  if (!normalizedObjectKey) {
    throw new Error("GCS object key is missing");
  }

  return buildGCSObjectUrl(normalizedObjectKey);
}

export async function uploadCourseResourceToGCS(file, { course, year } = {}) {
  if (!file) {
    throw new Error("Please select a file to upload");
  }

  const objectKey = buildObjectKey({
    course,
    year,
    fileName: file.name,
  });
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const response = await fetch(buildGCSObjectUrl(objectKey), {
    method: "PUT",
    headers: {
      ...buildV2AuthHeaders({
        method: "PUT",
        objectKey,
        contentType: file.type || "application/octet-stream",
      }),
      "Content-Length": String(fileBuffer.length),
    },
    body: fileBuffer,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText || "Failed to upload file to Google Cloud Storage");
  }

  return {
    resourceUrl: buildGCSObjectOriginUrl(objectKey),
    resourcePublicId: objectKey,
    uploadedFileName: file.name || "",
    uploadedMimeType: file.type || "",
    storageProvider: "gcs",
  };
}

export async function deleteCourseResourceFromGCS(objectKey) {
  const normalizedObjectKey = String(objectKey || "").trim();
  if (!normalizedObjectKey) return;

  const response = await fetch(buildGCSObjectUrl(normalizedObjectKey), {
    method: "DELETE",
    headers: buildV2AuthHeaders({
      method: "DELETE",
      objectKey: normalizedObjectKey,
    }),
  });

  if (!response.ok && response.status !== 404) {
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText || "Failed to delete file from Google Cloud Storage");
  }
}

export async function fetchCourseResourceFromGCS(objectKey) {
  const normalizedObjectKey = String(objectKey || "").trim();
  if (!normalizedObjectKey) {
    throw new Error("GCS object key is missing");
  }

  const response = await fetch(buildGCSObjectUrl(normalizedObjectKey), {
    method: "GET",
    headers: buildV2AuthHeaders({
      method: "GET",
      objectKey: normalizedObjectKey,
    }),
  });

  return response;
}
