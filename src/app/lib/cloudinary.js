import crypto from "crypto";

const CLOUDINARY_FOLDER = "gips_portal/student_profiles";

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
