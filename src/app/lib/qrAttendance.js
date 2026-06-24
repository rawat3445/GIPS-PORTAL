import crypto from "crypto";
import {
  ATTENDANCE_START_DATE,
  WINTER_VACATION_FROM,
  WINTER_VACATION_TO,
  isSunday,
  toISODate,
} from "./attendanceEvents";

const QR_VERSION = "gips-student-id-v1";

function getQrSecret() {
  return (
    process.env.QR_ATTENDANCE_SECRET ||
    process.env.JWT_SECRET ||
    "gips-qr-development-secret"
  );
}

function toBase64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const normalized = String(value || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );
  return Buffer.from(padded, "base64").toString("utf8");
}

function signBody(body) {
  return crypto
    .createHmac("sha256", getQrSecret())
    .update(body)
    .digest("base64url");
}

export function createStudentQrToken(student) {
  const payload = {
    v: QR_VERSION,
    s: String(student?._id || "").trim(),
  };

  const body = toBase64Url(JSON.stringify(payload));
  const signature = signBody(body);

  return `${body}.${signature}`;
}

export function verifyStudentQrToken(token) {
  const parts = String(token || "").trim().split(".");

  if (parts.length !== 2) {
    throw new Error("Invalid QR format");
  }

  const [body, signature] = parts;
  const expectedSignature = signBody(body);

  if (signature !== expectedSignature) {
    throw new Error("QR signature mismatch");
  }

  const payload = JSON.parse(fromBase64Url(body));

  if (payload?.v !== QR_VERSION) {
    throw new Error("Unsupported QR version");
  }

  if (!payload?.s) {
    throw new Error("Incomplete QR payload");
  }

  return {
    version: payload.v,
    studentId: String(payload.s).trim(),
    course: "",
    year: 0,
    issuedAt: null,
  };
}

export function getAttendanceDateValidationMessage(dateString) {
  const todayISO = toISODate(new Date());

  if (!dateString) return "Attendance date is required";
  if (dateString < ATTENDANCE_START_DATE) {
    return "Attendance cannot be marked before January 1, 2026";
  }
  if (dateString >= WINTER_VACATION_FROM && dateString <= WINTER_VACATION_TO) {
    return "Attendance cannot be marked during winter vacation (January 1 to January 18, 2026)";
  }
  if (isSunday(dateString)) {
    return "Attendance cannot be marked on Sundays";
  }
  if (dateString > todayISO) {
    return "Attendance cannot be marked for a future date";
  }

  return "";
}
