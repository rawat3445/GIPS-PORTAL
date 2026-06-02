import crypto from "crypto";

const R2_REGION = "auto";
const R2_SERVICE = "s3";
const COURSE_RESOURCE_FOLDER = "gips_portal/course_resources";

function getConfig() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error("Cloudflare R2 is not configured");
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    endpointHost: `${accountId}.r2.cloudflarestorage.com`,
  };
}

function hashSha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function hmacSha256(key, value, encoding) {
  return crypto.createHmac("sha256", key).update(value).digest(encoding);
}

function toAmzDate(date = new Date()) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function getDateStamp(amzDate) {
  return amzDate.slice(0, 8);
}

function encodePathSegment(value) {
  return encodeURIComponent(String(value || "").trim()).replace(/%2F/g, "/");
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

function getSigningKey(secretAccessKey, dateStamp) {
  const kDate = hmacSha256(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, R2_REGION);
  const kService = hmacSha256(kRegion, R2_SERVICE);
  return hmacSha256(kService, "aws4_request");
}

function buildCredentialScope(dateStamp) {
  return `${dateStamp}/${R2_REGION}/${R2_SERVICE}/aws4_request`;
}

function buildCanonicalQuery(params) {
  return Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value ?? ""))}`,
    )
    .join("&");
}

function buildObjectKey({ course, year, fileName }) {
  const normalizedCourse = sanitizeFolderSegment(course) || "course";
  const normalizedYear = sanitizeFolderSegment(year) || "general";
  const timestamp = Date.now();
  const safeFileName = sanitizeFileName(fileName);

  return `${COURSE_RESOURCE_FOLDER}/${normalizedCourse}/year-${normalizedYear}/${timestamp}-${safeFileName}`;
}

export function buildR2ObjectOriginUrl(objectKey) {
  const normalizedObjectKey = String(objectKey || "").trim();
  if (!normalizedObjectKey) {
    throw new Error("R2 object key is missing");
  }

  const { endpointHost, bucketName } = getConfig();
  return `https://${endpointHost}/${bucketName}/${encodePathSegment(normalizedObjectKey)}`;
}

export async function uploadCourseResourceToR2(file, { course, year } = {}) {
  if (!file) {
    throw new Error("Please select a file to upload");
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const objectKey = buildObjectKey({
    course,
    year,
    fileName: file.name,
  });
  const payloadHash = hashSha256(fileBuffer);
  const { endpointHost, bucketName, accessKeyId, secretAccessKey } = getConfig();
  const method = "PUT";
  const amzDate = toAmzDate();
  const dateStamp = getDateStamp(amzDate);
  const canonicalUri = `/${bucketName}/${encodePathSegment(objectKey)}`;
  const canonicalHeaders =
    `host:${endpointHost}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    method,
    canonicalUri,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const credentialScope = buildCredentialScope(dateStamp);
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    hashSha256(canonicalRequest),
  ].join("\n");
  const signature = hmacSha256(
    getSigningKey(secretAccessKey, dateStamp),
    stringToSign,
    "hex",
  );
  const authorization = [
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`,
  ].join(", ");

  const response = await fetch(`https://${endpointHost}${canonicalUri}`, {
    method,
    headers: {
      Authorization: authorization,
      "Content-Type": file.type || "application/octet-stream",
      "Content-Length": String(fileBuffer.length),
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
    },
    body: fileBuffer,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText || "Failed to upload file to Cloudflare R2");
  }

  return {
    resourceUrl: buildR2ObjectOriginUrl(objectKey),
    resourcePublicId: objectKey,
    uploadedFileName: file.name || "",
    uploadedMimeType: file.type || "",
    storageProvider: "r2",
  };
}

export function buildR2ResourceAccessUrl({
  objectKey,
  uploadedFileName = "",
  attachment = false,
  expiresInSeconds = 300,
} = {}) {
  const normalizedObjectKey = String(objectKey || "").trim();
  if (!normalizedObjectKey) {
    throw new Error("R2 object key is missing");
  }

  const { endpointHost, bucketName, accessKeyId, secretAccessKey } = getConfig();
  const amzDate = toAmzDate();
  const dateStamp = getDateStamp(amzDate);
  const credentialScope = buildCredentialScope(dateStamp);
  const canonicalUri = `/${bucketName}/${encodePathSegment(normalizedObjectKey)}`;
  const signedHeaders = "host";
  const query = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${accessKeyId}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": Math.max(60, Number(expiresInSeconds || 300)),
    "X-Amz-SignedHeaders": signedHeaders,
  };

  if (attachment && uploadedFileName) {
    query["response-content-disposition"] = `attachment; filename="${sanitizeFileName(uploadedFileName)}"`;
  }

  const canonicalQuery = buildCanonicalQuery(query);
  const canonicalRequest = [
    "GET",
    canonicalUri,
    canonicalQuery,
    `host:${endpointHost}\n`,
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    hashSha256(canonicalRequest),
  ].join("\n");
  const signature = hmacSha256(
    getSigningKey(secretAccessKey, dateStamp),
    stringToSign,
    "hex",
  );

  return `https://${endpointHost}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}
