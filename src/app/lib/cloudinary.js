import crypto from "crypto";

const CLOUDINARY_FOLDER = "gips_portal/student_profiles";
const COURSE_RESOURCE_FOLDER = "gips_portal/course_resources";

function getConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured");
  }

  return {
    cloudName,
    apiKey,
    apiSecret,
  };
}

function signParams(params, apiSecret) {
  const sorted = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(`${sorted}${apiSecret}`)
    .digest("hex");
}

function sanitizeFolderSegment(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getFileExtension(value) {
  const normalized = String(value || "").trim().toLowerCase();
  const segments = normalized.split(".");
  return segments.length > 1 ? segments.at(-1) : "";
}

function getExtensionFromMimeType(mimeType) {
  const normalized = String(mimeType || "").trim().toLowerCase();

  if (normalized === "application/pdf") {
    return "pdf";
  }

  if (normalized === "application/msword") {
    return "doc";
  }

  if (
    normalized ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "docx";
  }

  return "";
}

export function isBase64Image(value) {
  return String(value || "").trim().startsWith("data:image/");
}

export function isRemoteImageUrl(value) {
  return /^https?:\/\//i.test(String(value || "").trim());
}

export async function uploadStudentProfileImage(imageDataUrl) {
  const { cloudName, apiKey, apiSecret } = getConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signParams(
    {
      folder: CLOUDINARY_FOLDER,
      timestamp,
    },
    apiSecret,
  );

  const formData = new FormData();
  formData.append("file", imageDataUrl);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("folder", CLOUDINARY_FOLDER);
  formData.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error?.message || "Failed to upload image");
  }

  return {
    profileImage: data.secure_url || "",
    profileImagePublicId: data.public_id || "",
  };
}

export async function deleteStudentProfileImage(publicId) {
  const value = String(publicId || "").trim();
  if (!value) return;

  const { cloudName, apiKey, apiSecret } = getConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signParams(
    {
      public_id: value,
      timestamp,
    },
    apiSecret,
  );

  const body = new URLSearchParams({
    public_id: value,
    api_key: apiKey,
    timestamp: String(timestamp),
    signature,
    invalidate: "true",
  });

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    },
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error?.message || "Failed to delete image");
  }
}

export async function uploadCourseResource(file, { course, year } = {}) {
  if (!file) {
    throw new Error("Please select a file to upload");
  }

  const normalizedCourse = sanitizeFolderSegment(course) || "course";
  const normalizedYear = sanitizeFolderSegment(year) || "general";
  const { cloudName, apiKey, apiSecret } = getConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `${COURSE_RESOURCE_FOLDER}/${normalizedCourse}/year-${normalizedYear}`;
  const signature = signParams(
    {
      folder,
      timestamp,
    },
    apiSecret,
  );

  const formData = new FormData();
  formData.append("file", file, file.name || "course-resource");
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("folder", folder);
  formData.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error?.message || "Failed to upload file");
  }

  return {
    resourceUrl: data.secure_url || "",
    resourcePublicId: data.public_id || "",
    uploadedFileName: file.name || data.original_filename || "",
    uploadedMimeType: file.type || "",
  };
}

export function buildCourseResourceAccessUrl({
  resourcePublicId,
  uploadedFileName = "",
  uploadedMimeType = "",
  attachment = false,
  expiresInSeconds = 300,
} = {}) {
  const publicId = String(resourcePublicId || "").trim();
  if (!publicId) {
    throw new Error("Course resource is missing");
  }

  const format =
    getFileExtension(uploadedFileName) ||
    getExtensionFromMimeType(uploadedMimeType) ||
    getFileExtension(publicId);

  if (!format) {
    throw new Error("Course resource format is missing");
  }

  const { cloudName, apiKey, apiSecret } = getConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const expiresAt =
    timestamp + Math.max(60, Number(expiresInSeconds || 300));
  const signaturePayload = {
    expires_at: expiresAt,
    format,
    public_id: publicId,
    timestamp,
    type: "upload",
  };

  if (attachment) {
    signaturePayload.attachment = "true";
  }

  const signature = signParams(signaturePayload, apiSecret);
  const query = new URLSearchParams({
    api_key: apiKey,
    expires_at: String(expiresAt),
    format,
    public_id: publicId,
    signature,
    timestamp: String(timestamp),
    type: "upload",
  });

  if (attachment) {
    query.set("attachment", "true");
  }

  return `https://api.cloudinary.com/v1_1/${cloudName}/raw/download?${query.toString()}`;
}
