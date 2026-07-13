"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import ProfileAvatar from "../../../components/ProfileAvatar";
import { resizeImageToAvatarDataUrl } from "../../../lib/avatarUpload";

const COURSE_NAMES = {
  BPT: "Bachelor of Physiotherapy",
  BOPTOM: "Bachelor of Optometry",
  BMRIT: "Bachelor of Medical Radiology and Imaging Technology",
  DOPTOM: "Diploma in Optometry",
  BOTT: "Bachelor of Operation Theatre Technology",
};

const COLLEGE_NAME = "Garhwal Institute of Paramedical Sciences";
const COLLEGE_AFFILIATION =
  "Affiliated to HNB Uttarakhand Medical Education University, Dehradun";
const CARD_AUTHORITY = "Principal";
const COLLEGE_PHONE = "+91 7454998289";
const COLLEGE_WEBSITE = "gips.institute";
const CARD_FOUND_MESSAGE = "If found, please return to GIPS";
const ID_CARD_WIDTH_PX = 204;
const ID_CARD_HEIGHT_PX = 324;
const ID_CARD_GAP_PX = 20;

const ATTENDANCE_START_MONTH = "2026-01";
const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getSessionStartYear(session, createdAt) {
  const sessionText = String(session || "").trim();
  const matchedYear = sessionText.match(/\b(20\d{2})\b/);
  if (matchedYear) {
    return matchedYear[1];
  }

  if (createdAt) {
    const createdDate = new Date(createdAt);
    if (!Number.isNaN(createdDate.getTime())) {
      return String(createdDate.getFullYear());
    }
  }

  return String(new Date().getFullYear());
}

function getStudentCardSerial(student) {
  const objectIdText = String(student?._id || "").trim();
  if (objectIdText) {
    const numericValue = parseInt(objectIdText.slice(-6), 16);
    if (!Number.isNaN(numericValue)) {
      return String(numericValue % 1000).padStart(3, "0");
    }
  }

  return "001";
}

function getStudentCardId(student) {
  const courseCode = String(student?.course || "GEN")
    .trim()
    .toUpperCase();
  const startYear = getSessionStartYear(student?.session, student?.createdAt);
  const serial = getStudentCardSerial(student);

  return `GIPS-${courseCode}-${startYear}-${serial}`;
}

function getDaysInMonth(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

function getMonthStartDay(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).getDay();
}

function getStatusClasses(status) {
  switch (status) {
    case "present":
      return "border-green-200 bg-green-50 text-green-800";
    case "absent":
      return "border-red-200 bg-red-50 text-red-800";
    case "holiday":
      return "border-slate-200 bg-slate-100 text-slate-700";
    case "vacation":
      return "border-amber-200 bg-amber-50 text-amber-800";
    default:
      return "border-gray-200 bg-white text-gray-700";
  }
}

function getStatusLabel(status) {
  switch (status) {
    case "present":
      return "Present";
    case "absent":
      return "Absent";
    case "holiday":
      return "Holiday";
    case "vacation":
      return "Vacation";
    default:
      return "Not Marked";
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sanitizeFileName(value) {
  return String(value || "student-id-card")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "student-id-card";
}

function readBlobAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read image file"));
    reader.readAsDataURL(blob);
  });
}

async function loadImageAsDataUrl(src) {
  if (!src) {
    return "";
  }

  if (String(src).startsWith("data:")) {
    return src;
  }

  const response = await fetch(src, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error("Unable to load card image");
  }

  const blob = await response.blob();
  return readBlobAsDataUrl(blob);
}

function buildIdCardMarkup({
  student,
  courseLabel,
  sessionLabel,
  bloodGroupLabel,
  parentContactLabel,
  studentCardId,
  phoneLabel,
  websiteHost,
  messageLabel,
  studentResidentialAddress,
  qrDataUrl,
  logoUrl,
  signatureUrl,
  profileImageUrl,
}) {
  const studentName = escapeHtml(student?.name || "-");
  const initials = escapeHtml(String(student?.name || "S").charAt(0).toUpperCase());
  const photoMarkup = profileImageUrl
    ? `<img src="${profileImageUrl}" alt="${studentName}" class="photo-image" />`
    : `<div class="photo-fallback">${initials}</div>`;

  return `
    <div class="wrap">
      <div class="card front">
        <div class="hero hero-front"></div>
        <div class="wave-layer wave-one"></div>
        <div class="wave-layer wave-two"></div>
        <div class="wave-layer wave-three"></div>
        <div class="inner">
          <div class="band"></div>
          <div class="header header-front">
            <img class="logo" src="${logoUrl}" alt="GIPS Logo" />
            <div class="college">
              <strong>${escapeHtml(COLLEGE_NAME)}</strong>
              <span>${escapeHtml(COLLEGE_AFFILIATION)}</span>
            </div>
          </div>

          <div class="photo-wrap">
            <div class="photo">
              ${photoMarkup}
            </div>
          </div>

          <div class="name">${studentName}</div>
          <div class="subline">${escapeHtml(courseLabel)}</div>

          <div class="meta">
            <div class="row">
              <div class="row-label">Student ID</div>
              <div class="row-value">${escapeHtml(studentCardId)}</div>
            </div>
            <div class="row">
              <div class="row-label">Session</div>
              <div class="row-value">${escapeHtml(sessionLabel)}</div>
            </div>
            <div class="row">
              <div class="row-label">Parent Contact No</div>
              <div class="row-value">${escapeHtml(parentContactLabel)}</div>
            </div>
            <div class="row">
              <div class="row-label">Blood Group</div>
              <div class="row-value">${escapeHtml(bloodGroupLabel)}</div>
            </div>
          </div>

          <div class="bottom">
            <div class="signature-box">
              <img src="${signatureUrl}" alt="Authority Signature" />
              <div class="signature-label">Signature</div>
            </div>
            <div class="authority-meta">
              <div class="authority-label">Issuing Authority</div>
              <div class="authority-role">${escapeHtml(CARD_AUTHORITY)}</div>
              <div class="authority-org">${escapeHtml(COLLEGE_NAME)}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card back">
        <div class="hero hero-back"></div>
        <div class="wave-layer wave-one"></div>
        <div class="wave-layer wave-two"></div>
        <div class="wave-layer wave-three"></div>
        <div class="inner">
          <div class="band band-hidden"></div>
          <div class="back-center">
            <div class="back-qr">
              <img src="${qrDataUrl}" alt="QR Code" />
            </div>
            <div class="back-note">Scan for attendance</div>
          </div>
          <div class="meta">
            <div class="row">
              <div class="row-label">College Phone No</div>
              <div class="row-value">${escapeHtml(phoneLabel)}</div>
            </div>
            <div class="row">
              <div class="row-label">Website</div>
              <div class="row-value">${escapeHtml(websiteHost)}</div>
            </div>
            <div class="row">
              <div class="row-label">Message</div>
              <div class="row-value">${escapeHtml(messageLabel)}</div>
            </div>
          </div>
          <div class="address-box">
            <div class="address-label">Student Residential Address</div>
            <div class="address-value">${escapeHtml(studentResidentialAddress)}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildIdCardDocument(content, title, { includeToolbar = false } = {}) {
  return `
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          * { box-sizing: border-box; }
          html, body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            margin: 0;
            font-family: "Trebuchet MS", "Arial Narrow", Arial, sans-serif;
            background: #e2e8f0;
            color: #0f172a;
            padding: 24px;
          }
          .toolbar {
            display: flex;
            justify-content: center;
            gap: 12px;
            margin: 0 auto 18px;
          }
          .toolbar button {
            border: 0;
            border-radius: 999px;
            padding: 12px 18px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            color: #ffffff;
            background: #0f172a;
            box-shadow: 0 12px 24px -18px rgba(15, 23, 42, 0.6);
          }
          .toolbar button.secondary {
            background: #0369a1;
          }
          .wrap {
            display: flex;
            flex-wrap: wrap;
            gap: ${ID_CARD_GAP_PX}px;
            justify-content: center;
          }
          .card {
            position: relative;
            overflow: hidden;
            width: 5.4cm;
            height: 8.56cm;
            border-radius: 14px;
            border: 1px solid rgba(15, 23, 42, 0.08);
            background: #ffffff;
            box-shadow: 0 22px 48px -26px rgba(15, 23, 42, 0.45);
          }
          .inner {
            position: relative;
            z-index: 2;
            height: 100%;
            display: flex;
            flex-direction: column;
            padding: 10px 9px;
          }
          .hero {
            position: absolute;
            inset: 0 0 auto 0;
            z-index: 0;
          }
          .hero-front {
            height: 108px;
            background: linear-gradient(90deg, #eab308 0%, #ffffff 54%, #38bdf8 100%);
          }
          .hero-back {
            height: 118px;
            background: #facc15;
          }
          .wave-layer {
            position: absolute;
            left: -18px;
            right: -18px;
            border-radius: 999px;
            transform: rotate(-5deg);
            z-index: 1;
          }
          .wave-one {
            top: 70px;
            height: 42px;
            background: linear-gradient(90deg, #164e63 0%, #0f766e 40%, #0ea5e9 100%);
          }
          .wave-two {
            top: 82px;
            left: -10px;
            right: -34px;
            height: 34px;
            background: linear-gradient(90deg, #38bdf8 0%, #22d3ee 48%, #67e8f9 100%);
            transform: rotate(-4deg);
          }
          .wave-three {
            top: 92px;
            left: 20px;
            right: -10px;
            height: 26px;
            background: #ffffff;
            transform: rotate(-3deg);
          }
          .band {
            height: 7px;
            border-radius: 999px;
          }
          .band-hidden {
            opacity: 0;
          }
          .header {
            position: relative;
            z-index: 2;
            margin-top: 8px;
            display: flex;
            align-items: flex-start;
            gap: 8px;
            border-radius: 12px;
            padding: 6px;
          }
          .header-front {
            border: 1px solid rgba(255, 255, 255, 0.95);
            background: #facc15;
          }
          .logo {
            width: 28px;
            height: 28px;
            flex-shrink: 0;
            object-fit: contain;
          }
          .college {
            min-width: 0;
            font-size: 5.5px;
            line-height: 1.1;
            color: #dc2626;
          }
          .college strong {
            display: block;
            font-size: 8px;
            line-height: 1.05;
            font-weight: 700;
            color: #ffffff;
          }
          .college span {
            display: block;
            margin-top: 2px;
          }
          .photo-wrap {
            margin: 16px auto 0;
            padding: 0;
            width: 66px;
            height: 66px;
            border-radius: 999px;
            border: 4px solid rgba(255, 255, 255, 0.9);
            background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(219,234,254,0.92));
            box-shadow: 0 18px 40px -20px rgba(15, 23, 42, 0.3);
          }
          .photo {
            width: 100%;
            height: 100%;
            border-radius: 999px;
            overflow: hidden;
            background: rgba(255,255,255,0.96);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #334155;
            font-size: 22px;
            font-weight: 700;
          }
          .photo-image {
            width: 100%;
            height: 100%;
            border-radius: 999px;
            object-fit: cover;
            display: block;
          }
          .photo-fallback {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .name {
            margin-top: 8px;
            text-align: center;
            font-size: 14px;
            line-height: 1.1;
            font-weight: 900;
            color: #020617;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            font-family: "Franklin Gothic Medium", "Arial Narrow", Arial, sans-serif;
          }
          .subline {
            margin-top: 3px;
            text-align: center;
            font-size: 7px;
            font-weight: 700;
            color: #1f2937;
          }
          .meta {
            margin-top: 6px;
            display: grid;
            gap: 2px;
          }
          .row {
            border-radius: 6px;
            background: linear-gradient(90deg, rgba(224,242,254,0.72), rgba(255,255,255,0.18));
            border: 1px solid rgba(125, 211, 252, 0.35);
            border-left: 2px solid rgba(14, 165, 233, 0.9);
            padding: 2px 4px 2px 5px;
            color: #0f172a;
          }
          .row-label {
            font-size: 5px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #0369a1;
          }
          .row-value {
            margin-top: 2px;
            font-size: 7px;
            font-weight: 700;
            line-height: 1.05;
            word-break: break-word;
            color: #0f172a;
          }
          .bottom {
            margin-top: auto;
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 8px;
          }
          .signature-box {
            width: 72px;
            min-height: 30px;
            border-radius: 8px;
            background: linear-gradient(180deg, rgba(255,255,255,0.94), rgba(239,246,255,0.82));
            padding: 3px 5px;
            border: 1px solid rgba(255,255,255,0.88);
          }
          .signature-box img {
            width: 100%;
            height: 14px;
            object-fit: contain;
            display: block;
          }
          .signature-label {
            margin-top: 1px;
            font-size: 3.4px;
            color: #334155;
          }
          .authority-meta {
            text-align: right;
          }
          .authority-label {
            font-size: 3.9px;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #475569;
          }
          .authority-role {
            margin-top: 2px;
            font-size: 5.6px;
            font-weight: 800;
            color: #0f172a;
          }
          .authority-org {
            margin-top: 2px;
            max-width: 80px;
            font-size: 3.6px;
            line-height: 1.25;
            color: #334155;
          }
          .back-center {
            margin-top: 8px;
            display: flex;
            flex: 1;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
          .back-qr {
            border-radius: 18px;
            background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(239,246,255,0.9));
            padding: 8px;
            box-shadow: 0 18px 36px -24px rgba(15, 23, 42, 0.45);
          }
          .back-qr img {
            display: block;
            width: 126px;
            height: 126px;
            border-radius: 10px;
            object-fit: contain;
            background: #ffffff;
          }
          .back-note {
            margin: 0;
            text-align: center;
            font-size: 7px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #334155;
          }
          .address-box {
            margin-top: 4px;
            border-radius: 10px;
            background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(239,246,255,0.86));
            padding: 4px 6px;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.9);
          }
          .address-label {
            font-size: 5px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #64748b;
          }
          .address-value {
            margin-top: 2px;
            font-size: 7px;
            font-weight: 600;
            line-height: 1.05;
            color: #0f172a;
          }
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
          @media print {
            body {
              background: #ffffff;
              padding: 0;
            }
            .toolbar {
              display: none;
            }
            .card {
              box-shadow: none;
              break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        ${includeToolbar ? `
          <div class="toolbar">
            <button type="button" onclick="window.print()">Print</button>
            <button type="button" class="secondary" onclick="window.close()">Close</button>
          </div>
        ` : ""}
        ${content}
      </body>
    </html>
  `;
}

function AttendanceSummaryModal({
  summary,
  loading,
  error,
  monthKey,
  onMonthChange,
  onClose,
}) {
  const maxMonthKey = useMemo(() => {
    const endDate = summary?.calendarEndDate || summary?.currentDate;
    return endDate ? endDate.slice(0, 7) : getCurrentMonthKey();
  }, [summary]);

  const selectedMonthStats = useMemo(() => {
    return (
      summary?.months?.find((item) => item.monthKey === monthKey) || {
        monthKey,
        label: monthKey,
        workingDays: 0,
        markedDays: 0,
        present: 0,
        absent: 0,
        percentage: 0,
      }
    );
  }, [summary, monthKey]);

  const calendarMap = useMemo(() => {
    const map = new Map();
    (summary?.calendar || []).forEach((item) => {
      if (item.monthKey === monthKey) {
        map.set(item.day, item);
      }
    });
    return map;
  }, [summary, monthKey]);

  const monthGrid = useMemo(() => {
    const startDay = getMonthStartDay(monthKey);
    const totalDays = getDaysInMonth(monthKey);
    const cells = [];

    for (let i = 0; i < startDay; i += 1) cells.push(null);
    for (let day = 1; day <= totalDays; day += 1) {
      cells.push(
        calendarMap.get(day) || { day, status: "not_marked", note: "" },
      );
    }

    return cells;
  }, [calendarMap, monthKey]);

  const overall = summary?.overall || {
    workingDays: 0,
    markedDays: 0,
    present: 0,
    absent: 0,
    percentage: 0,
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 px-3 py-3 md:items-center md:px-4 md:py-6">
      <div className="max-h-[96vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white shadow-2xl md:max-h-[92vh]">
        <div className="flex flex-col gap-4 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-start sm:justify-between md:px-6 md:py-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900 md:text-2xl">
              Student Attendance Summary
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              {summary?.student?.name || "Loading..."} |{" "}
              {summary?.student?.course || "-"} | Year{" "}
              {summary?.student?.year || "-"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="self-end rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 sm:self-auto"
          >
            x
          </button>
        </div>

        <div className="space-y-5 p-4 md:space-y-6 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <p className="text-sm leading-6 text-gray-600">
              Full attendance record with calendar view, monthly percentage, and
              overall percentage.
            </p>
            <div className="w-full max-w-xs">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Select Month
              </label>
              <input
                type="month"
                min={ATTENDANCE_START_MONTH}
                max={maxMonthKey}
                value={monthKey}
                onChange={(e) => onMonthChange(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
              Loading attendance summary...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-sm font-medium text-gray-600">Monthly %</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {selectedMonthStats.percentage}%
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-sm font-medium text-gray-600">Overall %</p>
                  <p className="mt-2 text-2xl font-bold text-blue-700">
                    {overall.percentage}%
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-sm font-medium text-gray-600">Present</p>
                  <p className="mt-2 text-2xl font-bold text-green-600">
                    {selectedMonthStats.present}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-sm font-medium text-gray-600">Absent</p>
                  <p className="mt-2 text-2xl font-bold text-red-600">
                    {selectedMonthStats.absent}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-sm font-medium text-gray-600">
                    Working Days
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {selectedMonthStats.workingDays}
                  </p>
                </div>
              </div>

              <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
                <div className="min-w-[720px]">
                  <div className="grid grid-cols-7 gap-2 md:gap-3">
                    {WEEK_DAYS.map((day) => (
                      <div
                        key={day}
                        className="pb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500 md:text-xs"
                      >
                        {day}
                      </div>
                    ))}

                    {monthGrid.map((item, index) =>
                      item ? (
                        <div
                          key={`${monthKey}-${item.day}-${index}`}
                          className={`min-h-[80px] rounded-xl border p-2.5 md:min-h-[88px] md:p-3 ${getStatusClasses(
                            item.status,
                          )}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-bold">
                              {item.day}
                            </span>
                            <span className="text-[9px] font-semibold uppercase tracking-wide md:text-[10px]">
                              {getStatusLabel(item.status)}
                            </span>
                          </div>
                          {item.note && (
                            <p className="mt-2 text-[10px] leading-4 md:mt-3 md:text-[11px]">
                              {item.note}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div
                          key={`${monthKey}-empty-${index}`}
                          className="min-h-[80px] rounded-xl border border-transparent md:min-h-[88px]"
                        />
                      ),
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StudentQrPanel({ student, onStudentUpdated }) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrError, setQrError] = useState("");
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [cardAddressSaving, setCardAddressSaving] = useState(false);
  const [cardAddressMessage, setCardAddressMessage] = useState("");
  const [cardDownloadBusy, setCardDownloadBusy] = useState(false);
  const [cardActionMessage, setCardActionMessage] = useState("");
  const [cardBackFields, setCardBackFields] = useState({
    phone: COLLEGE_PHONE,
    website: COLLEGE_WEBSITE,
    message: CARD_FOUND_MESSAGE,
    address: student.studentCardAddress || "",
  });
  const courseLabel =
    COURSE_NAMES[student.course] || student.course || "Student";
  const initials = String(student.name || "S")
    .charAt(0)
    .toUpperCase();
  const sessionLabel = student.session || "-";
  const bloodGroupLabel = student.bloodGroup || "-";
  const parentContactLabel = student.parentContactNo || "-";
  const studentCardId = getStudentCardId(student);
  const websiteLabel =
    cardBackFields.website || COLLEGE_WEBSITE;
  const studentResidentialAddress =
    cardBackFields.address || "Student residential address not saved";

  function getCardMarkupAssets(overrides = {}) {
    const baseOrigin = window.location.origin;

    return {
      logoUrl: overrides.logoUrl || `${baseOrigin}/collage_logo.png`,
      signatureUrl:
        overrides.signatureUrl ||
        signatureDataUrl ||
        `${baseOrigin}/signature-vice-principal.jpeg`,
      profileImageUrl:
        overrides.profileImageUrl || student.profileImage || "",
      phoneLabel: cardBackFields.phone || COLLEGE_PHONE,
      websiteHost: cardBackFields.website || COLLEGE_WEBSITE,
      messageLabel: cardBackFields.message || CARD_FOUND_MESSAGE,
    };
  }

  function handlePrintCard() {
    if (typeof window === "undefined" || !qrDataUrl) {
      return;
    }

    const printWindow = window.open("", "_blank", "width=1000,height=800");
    if (!printWindow) {
      setCardActionMessage("Allow popups to open the print preview.");
      return;
    }

    const markup = buildIdCardMarkup({
      student,
      courseLabel,
      sessionLabel,
      bloodGroupLabel,
      parentContactLabel,
      studentCardId,
      studentResidentialAddress,
      qrDataUrl,
      ...getCardMarkupAssets(),
    });

    printWindow.document.write(
      buildIdCardDocument(markup, `${student.name || "Student"} ID Card`, {
        includeToolbar: true,
      }),
    );

    printWindow.document.close();
    printWindow.focus();
    setCardActionMessage("");
  }

  async function handleDownloadCard() {
    if (typeof window === "undefined" || !qrDataUrl || cardDownloadBusy) {
      return;
    }

    try {
      setCardDownloadBusy(true);
      setCardActionMessage("");

      const baseOrigin = window.location.origin;
      const logoUrl = await loadImageAsDataUrl(`${baseOrigin}/collage_logo.png`);
      const signatureUrl = signatureDataUrl
        ? signatureDataUrl
        : await loadImageAsDataUrl(`${baseOrigin}/signature-vice-principal.jpeg`);
      const profileImageUrl = student.profileImage
        ? await loadImageAsDataUrl(student.profileImage).catch(() => "")
        : "";

      const markup = buildIdCardMarkup({
        student,
        courseLabel,
        sessionLabel,
        bloodGroupLabel,
        parentContactLabel,
        studentCardId,
        studentResidentialAddress,
        qrDataUrl,
        ...getCardMarkupAssets({
          logoUrl,
          signatureUrl,
          profileImageUrl,
        }),
      });

      const exportWidth = ID_CARD_WIDTH_PX * 2 + ID_CARD_GAP_PX + 40;
      const exportHeight = ID_CARD_HEIGHT_PX + 40;
      const xhtmlDocument = buildIdCardDocument(
        markup,
        `${student.name || "Student"} ID Card`,
      ).replace("<html>", '<html xmlns="http://www.w3.org/1999/xhtml">');
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${exportWidth}" height="${exportHeight}" viewBox="0 0 ${exportWidth} ${exportHeight}">
          <foreignObject width="100%" height="100%">${xhtmlDocument}</foreignObject>
        </svg>
      `;
      const svgBlob = new Blob([svg], {
        type: "image/svg+xml;charset=utf-8",
      });
      const svgUrl = URL.createObjectURL(svgBlob);

      await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            const scale = 2;
            canvas.width = exportWidth * scale;
            canvas.height = exportHeight * scale;

            const context = canvas.getContext("2d");
            if (!context) {
              throw new Error("Unable to prepare card download");
            }

            context.scale(scale, scale);
            context.drawImage(image, 0, 0, exportWidth, exportHeight);

            const link = document.createElement("a");
            link.href = canvas.toDataURL("image/png");
            link.download = `${sanitizeFileName(student.name)}-id-card.png`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            resolve();
          } catch (error) {
            reject(error);
          } finally {
            URL.revokeObjectURL(svgUrl);
          }
        };
        image.onerror = () => {
          URL.revokeObjectURL(svgUrl);
          reject(new Error("Unable to render ID card download"));
        };
        image.src = svgUrl;
      });

      setCardActionMessage("ID card download started.");
    } catch (error) {
      setCardActionMessage(error.message || "Unable to download ID card");
    } finally {
      setCardDownloadBusy(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function generateQr() {
      try {
        const res = await fetch(`/api/admin/users/${student._id}/qr`, {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || "Unable to load student QR");
        }

        const token = String(data.token || "").trim();
        if (!token) {
          throw new Error("QR token was empty");
        }

        const dataUrl = await QRCode.toDataURL(token, {
          width: 820,
          margin: 2,
          errorCorrectionLevel: "M",
          color: {
            dark: "#0f172a",
            light: "#ffffff",
          },
        });

        if (active) {
          setQrDataUrl(dataUrl);
          setQrError("");
        }
      } catch (error) {
        if (active) {
          setQrDataUrl("");
          setQrError(error.message || "Unable to generate student QR");
        }
      }
    }

    generateQr();

    return () => {
      active = false;
    };
  }, [student]);

  useEffect(() => {
    let active = true;
    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      if (!active) {
        return;
      }

      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;

        const context = canvas.getContext("2d");
        if (!context) {
          setSignatureDataUrl("");
          return;
        }

        context.drawImage(image, 0, 0);
        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        );
        const { data } = imageData;

        for (let index = 0; index < data.length; index += 4) {
          const red = data[index];
          const green = data[index + 1];
          const blue = data[index + 2];
          const alpha = data[index + 3];

          if (alpha === 0) {
            continue;
          }

          const isNearlyWhite = red > 235 && green > 235 && blue > 235;
          if (isNearlyWhite) {
            data[index + 3] = 0;
            continue;
          }

          const average = (red + green + blue) / 3;
          data[index] = 20;
          data[index + 1] = 24;
          data[index + 2] = 39;
          data[index + 3] =
            average < 180 ? 255 : Math.max(0, 255 - (average - 180) * 3);
        }

        context.putImageData(imageData, 0, 0);
        setSignatureDataUrl(canvas.toDataURL("image/png"));
      } catch {
        setSignatureDataUrl("");
      }
    };

    image.onerror = () => {
      if (active) {
        setSignatureDataUrl("");
      }
    };

    image.src = "/signature-vice-principal.jpeg";

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

  }, []);

  useEffect(() => {
    setCardBackFields({
      phone: COLLEGE_PHONE,
      website: COLLEGE_WEBSITE,
      message: CARD_FOUND_MESSAGE,
      address: student.studentCardAddress || "",
    });
    setCardAddressMessage("");
  }, [student._id, student.studentCardAddress]);

  async function handleSaveCardAddress() {
    if (!student?._id) return;

    try {
      setCardAddressSaving(true);
      setCardAddressMessage("");

      const res = await fetch(`/api/admin/users/${student._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentCardAddress: cardBackFields.address,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Unable to save address");
      }

      if (data?.user) {
        onStudentUpdated?.(data.user);
      }
      setCardAddressMessage("Student residential address saved.");
    } catch (error) {
      setCardAddressMessage(error.message || "Unable to save address");
    } finally {
      setCardAddressSaving(false);
    }
  }

  return (
    <div className="space-y-5 px-4 py-4 md:px-6 md:py-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
            Admin ID Card
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Preview both sides, print the card, and use the QR for attendance
            scanning.
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleDownloadCard}
              disabled={!qrDataUrl || cardDownloadBusy}
              className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cardDownloadBusy ? "Downloading..." : "Download ID Card"}
            </button>
            <button
              type="button"
              onClick={handlePrintCard}
              disabled={!qrDataUrl}
              className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Print ID Card
            </button>
          </div>
          {cardActionMessage ? (
            <p className="text-xs text-slate-500">{cardActionMessage}</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Front Side Preview
          </p>
          <div
            className="mx-auto relative flex flex-col overflow-hidden rounded-[14px] border border-sky-100 bg-white/90 p-[10px] text-slate-900 shadow-[0_22px_48px_-26px_rgba(15,23,42,0.45)]"
            style={{
              fontFamily: '"Trebuchet MS", "Arial Narrow", Arial, sans-serif',
              width: "5.4cm",
              height: "8.56cm",
            }}
          >
            <div className="absolute inset-x-0 top-0 h-[108px] bg-linear-to-r from-yellow-500 via-white to-sky-400" />
            <div className="absolute left-[-18px] right-[-18px] top-[70px] h-[42px] rotate-[-5deg] rounded-full bg-[linear-gradient(90deg,#164e63_0%,#0f766e_40%,#0ea5e9_100%)]" />
            <div className="absolute left-[-10px] right-[-34px] top-[82px] h-[34px] rotate-[-4deg] rounded-full bg-[linear-gradient(90deg,#38bdf8_0%,#22d3ee_48%,#67e8f9_100%)]" />
            <div className="absolute left-[20px] right-[-10px] top-[92px] h-[26px] rotate-[-3deg] rounded-full bg-white" />
            <div className="relative z-[2] h-[7px] rounded-full opacity-1" />
            <div className="relative z-[2]  rounded-[12px] border border-white/100 bg-yellow-400 p-1.5">
              <div className="flex items-start gap-2">
                <img
                  src="/collage_logo.png"
                  alt="GIPS Logo"
                  className="h-7 w-7 flex-shrink-0 object-contain"
                />
                <div className="min-w-0">
                  <p className="text-[8px] font-bold leading-tight text-white">
                    {COLLEGE_NAME}
                  </p>
                  <p className="mt-0.5 text-[5.5px] leading-[1.1] text-red-600">
                    {COLLEGE_AFFILIATION}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative z-[2] mx-auto mt-4 h-[66px] w-[66px] items-center justify-center rounded-full border-[4px] border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(219,234,254,0.92))] shadow-[0_18px_40px_-20px_rgba(15,23,42,0.3)]">
              {student.profileImage ? (
                <img
                  src={student.profileImage}
                  alt={student.name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-slate-700">
                  {initials}
                </div>
              )}
            </div>

            <div className="relative z-[2] mt-2 text-center">
              <h3
                className="text-[14px] font-black uppercase leading-tight text-slate-950"
                style={{
                  fontFamily:
                    '"Franklin Gothic Medium", "Arial Narrow", Arial, sans-serif',
                  letterSpacing: "0.05em",
                }}
              >
                {student.name}
              </h3>
              <p className="mt-0.5 text-[7px] font-semibold leading-[1.05] text-slate-800">
                {courseLabel}
              </p>
            </div>

            <div className="relative z-[2] mt-1.5 grid grid-cols-1 gap-1">
              <div className="rounded-[6px] border border-sky-200/40 border-l-[2px] border-l-sky-500 bg-[linear-gradient(90deg,rgba(224,242,254,0.72),rgba(255,255,255,0.18))] px-[5px] py-[2px]">
                <p className="text-[5px] font-bold uppercase tracking-[0.12em] text-sky-700">
                  Student ID
                </p>
                <p className="mt-0.5 text-[7px] font-bold leading-[1.05] text-slate-900">
                  {studentCardId}
                </p>
              </div>

              <div className="rounded-[6px] border border-sky-200/40 border-l-[2px] border-l-sky-500 bg-[linear-gradient(90deg,rgba(224,242,254,0.72),rgba(255,255,255,0.18))] px-[5px] py-[2px]">
                <p className="text-[5px] font-bold uppercase tracking-[0.12em] text-sky-700">
                  Session
                </p>
                <p className="mt-0.5 text-[7px] font-bold leading-[1.05] text-slate-900">
                  {sessionLabel}
                </p>
              </div>

              <div className="rounded-[6px] border border-sky-200/40 border-l-[2px] border-l-sky-500 bg-[linear-gradient(90deg,rgba(224,242,254,0.72),rgba(255,255,255,0.18))] px-[5px] py-[2px]">
                <p className="text-[5px] font-bold uppercase tracking-[0.12em] text-sky-700">
                  Parent Contact No
                </p>
                <p className="mt-0.5 text-[7px] font-bold leading-[1.05] text-slate-900">
                  {parentContactLabel}
                </p>
              </div>

              <div className="rounded-[6px] border border-sky-200/40 border-l-[2px] border-l-sky-500 bg-[linear-gradient(90deg,rgba(224,242,254,0.72),rgba(255,255,255,0.18))] px-[5px] py-[2px]">
                <p className="text-[5px] font-bold uppercase tracking-[0.12em] text-sky-700">
                  Blood Group
                </p>
                <p className="mt-0.5 text-[7px] font-bold leading-[1.05] text-slate-900">
                  {bloodGroupLabel}
                </p>
              </div>
            </div>

            <div className="relative z-[2] mt-auto flex items-end justify-between gap-2 pt-1.5">
              <div className="w-[72px] rounded-[8px] border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(239,246,255,0.82))] px-[5px] py-[3px]">
                <img
                  src={signatureDataUrl || "/signature-vice-principal.jpeg"}
                  alt="Authority Signature"
                  className="h-[12px] w-full object-contain opacity-90"
                />
                <p className="mt-0.5 text-[5px] text-slate-700">Signature</p>
              </div>

              <div className="max-w-[100px] text-right">
                <p className="text-[5px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  Issuing Authority
                </p>
                <p className="mt-0.5 text-[8px] font-extrabold text-slate-900">
                  {CARD_AUTHORITY}
                </p>
                <p className="mt-0.5 text-[5px] leading-[1.05] text-slate-700">
                  {COLLEGE_NAME}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Back Side Preview
          </p>
          <div
            className="mx-auto relative flex flex-col overflow-hidden rounded-[14px] border border-cyan-100 bg-white p-[10px] text-slate-900 shadow-[0_22px_48px_-26px_rgba(15,23,42,0.45)]"
            style={{
              fontFamily: '"Trebuchet MS", "Arial Narrow", Arial, sans-serif',
              width: "5.4cm",
              height: "8.56cm",
            }}
          >
            <div className="absolute inset-x-0 top-0 h-[118px] bg-yellow-400" />
            <div className="absolute left-[-18px] right-[-18px] top-[70px] h-[42px] rotate-[-5deg] rounded-full bg-[linear-gradient(90deg,#164e63_0%,#0f766e_40%,#0ea5e9_100%)]" />
            <div className="absolute left-[-10px] right-[-34px] top-[82px] h-[34px] rotate-[-4deg] rounded-full bg-[linear-gradient(90deg,#38bdf8_0%,#22d3ee_48%,#67e8f9_100%)]" />
            <div className="absolute left-[20px] right-[-10px] top-[92px] h-[26px] rotate-[-3deg] rounded-full bg-white" />
            <div className="relative z-[2] h-[7px] rounded-full opacity-0" />
            <div className="relative z-[2] mt-[8px] flex flex-1 flex-col items-center justify-center gap-2">
              <div className="rounded-[18px] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(239,246,255,0.9))] p-[8px] shadow-[0_18px_36px_-24px_rgba(15,23,42,0.45)]">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR for ${student.name}`}
                    className="h-[126px] w-[126px] rounded-[10px] bg-white object-contain"
                  />
                ) : (
                  <div className="flex h-[126px] w-[126px] items-center justify-center rounded-[10px] border border-dashed border-slate-200 bg-slate-50 px-2 text-center text-[8px] text-slate-500">
                    {qrError || "Generating QR..."}
                  </div>
                )}
              </div>
              <p
                className="text-[7px] font-bold uppercase text-slate-700"
                style={{
                  fontFamily:
                    '"Franklin Gothic Medium", "Arial Narrow", Arial, sans-serif',
                  letterSpacing: "0.12em",
                }}
              >
                Scan for attendance
              </p>
            </div>
            <div className="relative z-[2] grid grid-cols-1 gap-1">
              <div className="rounded-[6px] border border-sky-200/40 border-l-[2px] border-l-sky-500 bg-[linear-gradient(90deg,rgba(224,242,254,0.72),rgba(255,255,255,0.18))] px-[5px] py-[2px]">
                <p className="text-[5px] font-bold uppercase tracking-[0.12em] text-sky-700">
                  College Phone No
                </p>
                <p className="mt-0.5 text-[7px] font-bold leading-[1.05] text-slate-900">
                  {cardBackFields.phone}
                </p>
              </div>
              <div className="rounded-[6px] border border-sky-200/40 border-l-[2px] border-l-sky-500 bg-[linear-gradient(90deg,rgba(224,242,254,0.72),rgba(255,255,255,0.18))] px-[5px] py-[2px]">
                <p className="text-[5px] font-bold uppercase tracking-[0.12em] text-sky-700">
                  Website
                </p>
                <p className="mt-0.5 text-[7px] font-bold leading-[1.05] text-slate-900">
                  {websiteLabel}
                </p>
              </div>
              <div className="rounded-[6px] border border-sky-200/40 border-l-[2px] border-l-sky-500 bg-[linear-gradient(90deg,rgba(224,242,254,0.72),rgba(255,255,255,0.18))] px-[5px] py-[2px]">
                <p className="text-[5px] font-bold uppercase tracking-[0.12em] text-sky-700">
                  Message
                </p>
                <p className="mt-0.5 text-[7px] font-bold leading-[1.05] text-slate-900">
                  {cardBackFields.message}
                </p>
              </div>
            </div>
            <div className="relative z-[2] mt-1 rounded-[10px] border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(239,246,255,0.86))] px-[6px] py-[4px] text-center">
              <p className="text-[5px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Student Residential Address
              </p>
              <p className="mt-0.5 text-[7px] font-semibold leading-[1.05] text-slate-900">
                {studentResidentialAddress}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-sky-100 bg-[linear-gradient(180deg,#f8fbff_0%,#eef8ff_40%,#e0f2fe_100%)] p-4 shadow-[0_20px_40px_-30px_rgba(14,116,144,0.35)]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
          Edit Back Side
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">
              College Phone No
            </label>
            <input
              type="text"
              value={cardBackFields.phone}
              onChange={(e) =>
                setCardBackFields((prev) => ({
                  ...prev,
                  phone: e.target.value,
                }))
              }
              className="w-full rounded-xl border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.84))] px-3 py-2.5 text-sm font-medium text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_24px_-18px_rgba(14,116,144,0.45)] outline-none placeholder:text-slate-400 focus:border-sky-200 focus:ring-2 focus:ring-sky-400/40"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">
              Website
            </label>
            <input
              type="text"
              value={cardBackFields.website}
              onChange={(e) =>
                setCardBackFields((prev) => ({
                  ...prev,
                  website: e.target.value,
                }))
              }
              className="w-full rounded-xl border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.84))] px-3 py-2.5 text-sm font-medium text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_24px_-18px_rgba(14,116,144,0.45)] outline-none placeholder:text-slate-400 focus:border-sky-200 focus:ring-2 focus:ring-sky-400/40"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">
              Message
            </label>
            <input
              type="text"
              value={cardBackFields.message}
              onChange={(e) =>
                setCardBackFields((prev) => ({
                  ...prev,
                  message: e.target.value,
                }))
              }
              className="w-full rounded-xl border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.84))] px-3 py-2.5 text-sm font-medium text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_24px_-18px_rgba(14,116,144,0.45)] outline-none placeholder:text-slate-400 focus:border-sky-200 focus:ring-2 focus:ring-sky-400/40"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">
              Student Residential Address
            </label>
            <textarea
              value={cardBackFields.address}
              onChange={(e) =>
                setCardBackFields((prev) => ({
                  ...prev,
                  address: e.target.value,
                }))
              }
              rows={2}
              className="w-full rounded-xl border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.84))] px-3 py-2.5 text-sm font-medium text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_24px_-18px_rgba(14,116,144,0.45)] outline-none placeholder:text-slate-400 focus:border-sky-200 focus:ring-2 focus:ring-sky-400/40"
              placeholder="Enter this student's residential address"
            />
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-600">
            College phone, website and message stay as default; only this
            student&apos;s residential address is saved.
          </p>
          <button
            type="button"
            onClick={handleSaveCardAddress}
            disabled={cardAddressSaving}
            className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cardAddressSaving ? "Saving..." : "Save Address"}
          </button>
        </div>
        {cardAddressMessage ? (
          <p
            className={`mt-2 text-sm font-medium ${
              cardAddressMessage.includes("saved")
                ? "text-emerald-700"
                : "text-red-600"
            }`}
          >
            {cardAddressMessage}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Print Note
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Use the print button above to open both sides in one print view. You
            can also save that window as PDF before printing.
          </p>
        </div>

        <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
            Canva Tip
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            If you want a more branded card, first print or save this card as a
            PDF, then recreate the same size in Canva and place the QR and
            student details into your final design.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [prefillStudentId, setPrefillStudentId] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudentView, setSelectedStudentView] = useState("details");
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    parentContactNo: "",
    bloodGroup: "",
    session: "",
    course: "",
    year: "",
    password: "",
    profileImage: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editImageLoading, setEditImageLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentSummary, setStudentSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [summaryMonthKey, setSummaryMonthKey] = useState(getCurrentMonthKey());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const filteredStudents = students.filter((student) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      student.name?.toLowerCase().includes(query) ||
      student.email?.toLowerCase().includes(query);
    const matchesCourse = !selectedCourse || student.course === selectedCourse;
    const matchesYear =
      !selectedYear || String(student.year || "") === selectedYear;

    return matchesSearch && matchesCourse && matchesYear;
  });

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this student?")) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        alert("Failed to delete student");
        return;
      }

      setStudents((prev) => prev.filter((s) => s._id !== id));
    } catch {
      alert("Server error");
    }
  }

  function handleStudentUpdated(updatedStudent) {
    setStudents((prev) =>
      prev.map((student) =>
        student._id === updatedStudent._id ? updatedStudent : student,
      ),
    );
    setSelectedStudent((prev) =>
      prev?._id === updatedStudent._id ? updatedStudent : prev,
    );
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextCourse = params.get("course") || "";
    const nextYear = params.get("year") || "";
    const nextStudentId = params.get("studentId") || "";

    if (nextCourse) {
      setSelectedCourse(nextCourse);
    }

    if (nextYear) {
      setSelectedYear(nextYear);
    }

    if (nextStudentId) {
      setPrefillStudentId(nextStudentId);
    }
  }, []);

  useEffect(() => {
    async function fetchStudents() {
      try {
        const res = await fetch("/api/admin/users?role=student");
        if (!res.ok) throw new Error();

        const data = await res.json();
        setStudents(data);
      } catch {
        setError("Unable to load students");
      } finally {
        setLoading(false);
      }
    }

    fetchStudents();
  }, []);

  useEffect(() => {
    if (!prefillStudentId || students.length === 0) return;

    const matchedStudent = students.find((student) => student._id === prefillStudentId);
    if (!matchedStudent) return;

    setSelectedStudent(matchedStudent);
    setSelectedStudentView("details");
  }, [prefillStudentId, students]);

  async function openStudentSummary(studentId) {
    try {
      setSelectedStudentId(studentId);
      setStudentSummary(null);
      setSummaryError("");
      setSummaryLoading(true);
      setSummaryMonthKey(getCurrentMonthKey());

      const res = await fetch(
        `/api/admin/attendance?view=summary&studentId=${studentId}`,
        {
          credentials: "include",
          cache: "no-store",
        },
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to load student attendance");
      }

      setStudentSummary(data);
    } catch (err) {
      setSummaryError(err.message || "Failed to load student attendance");
    } finally {
      setSummaryLoading(false);
    }
  }

  function openEditStudent(student) {
    setEditingStudent(student);
    setEditError("");
    setEditForm({
      name: student.name || "",
      email: student.email || "",
      phone: student.phone || "",
      parentContactNo: student.parentContactNo || "",
      bloodGroup: student.bloodGroup || "",
      session: student.session || "",
      course: student.course || "",
      year: student.year ? String(student.year) : "",
      password: "",
      profileImage: student.profileImage || "",
    });
  }

  async function handleEditImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setEditImageLoading(true);
      setEditError("");
      const profileImage = await resizeImageToAvatarDataUrl(file);
      setEditForm((prev) => ({ ...prev, profileImage }));
    } catch (uploadError) {
      setEditError(uploadError.message || "Failed to process image");
    } finally {
      setEditImageLoading(false);
      e.target.value = "";
    }
  }

  async function handleUpdateStudent() {
    if (!editingStudent?._id) return;

    try {
      setEditLoading(true);
      setEditError("");
      const photoChanged =
        editForm.profileImage !== (editingStudent.profileImage || "");
      const removingPhoto = photoChanged && !editForm.profileImage;

      const payload = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        parentContactNo: editForm.parentContactNo,
        bloodGroup: editForm.bloodGroup,
        session: editForm.session,
         course: editForm.course,
        year: editForm.year,
      };

      if (editForm.profileImage !== (editingStudent.profileImage || "")) {
        if (editForm.profileImage) {
          payload.profileImage = editForm.profileImage;
        } else {
          payload.removeProfileImage = true;
        }
      }

      if (editForm.password.trim()) {
        payload.password = editForm.password;
      }

      const res = await fetch(`/api/admin/users/${editingStudent._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to update student");
      }

      if (photoChanged) {
        const savedProfileImage = String(data?.user?.profileImage || "").trim();

        if (removingPhoto) {
          if (savedProfileImage) {
            throw new Error("Student photo was not removed. Please try again.");
          }
        } else if (!savedProfileImage) {
          throw new Error(
            "Student photo was not saved. Please try uploading it again.",
          );
        }
      }

      setStudents((prev) =>
        prev.map((student) =>
          student._id === editingStudent._id ? data.user : student,
        ),
      );
      setSelectedStudent((prev) =>
        prev && prev._id === editingStudent._id ? data.user : prev,
      );
      setEditingStudent(null);
      setEditForm({
        name: "",
        email: "",
        phone: "",
        parentContactNo: "",
        bloodGroup: "",
        session: "",
        course: "",
        year: "",
        password: "",
        profileImage: "",
      });
      alert(
        photoChanged && !removingPhoto
          ? "Student updated successfully and photo saved."
          : "Student updated successfully",
      );
    } catch (err) {
      setEditError(err.message || "Failed to update student");
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-sm text-gray-600">Manage registered students</p>
        </div>

        <Link
          href="/dashboard/admin/students/add"
          className="inline-flex items-center justify-center rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
        >
          + Add Student
        </Link>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by student name or email"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />

        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Courses</option>
          <option value="BPT">BPT</option>
          <option value="BOPTOM">BOPTOM</option>
          <option value="BMRIT">BMRIT</option>
          <option value="DOPTOM">DOPTOM</option>
          <option value="BOTT">BOTT</option>
        </select>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Years</option>
          <option value="1">Year 1</option>
          <option value="2">Year 2</option>
          <option value="3">Year 3</option>
          <option value="4">Year 4</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-gray-500">Loading students...</p>
        ) : error ? (
          <p className="p-6 text-red-600">{error}</p>
        ) : students.length === 0 ? (
          <p className="p-6 text-gray-500">No students found.</p>
        ) : filteredStudents.length === 0 ? (
          <p className="p-6 text-gray-500">No students match your search.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">
                    Registered On
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filteredStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <div className="flex items-center gap-3">
                        <ProfileAvatar
                          src={student.profileImage}
                          name={student.name}
                          sizeClass="h-11 w-11"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudent(student);
                            setSelectedStudentView("details");
                          }}
                          className="text-left text-blue-700 hover:text-blue-900 hover:underline"
                        >
                          {student.name}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{student.email}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(student._id)}
                        className="font-medium text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-3 py-3 md:items-center md:px-4">
          <div className="max-h-[96vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl md:max-h-[92vh]">
            <div className="flex flex-col gap-4 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-start sm:justify-between md:px-6 md:py-5">
              <div className="flex items-center gap-4">
                <ProfileAvatar
                  src={selectedStudent.profileImage}
                  name={selectedStudent.name}
                  sizeClass="h-16 w-16"
                  textClassName="text-xl"
                />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Student Details
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Complete profile for {selectedStudent.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setSelectedStudentView("details")}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    selectedStudentView === "details"
                      ? "bg-blue-600 text-white"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStudentView("qr")}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    selectedStudentView === "qr"
                      ? "bg-sky-600 text-white"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  ID Card
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {selectedStudentView === "details" ? (
              <div className="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-2 md:px-6 md:py-6">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Full Name
                  </p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {selectedStudent.name || "-"}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Email
                  </p>
                  <p className="mt-2 text-sm font-medium text-gray-900">
                    {selectedStudent.email || "-"}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Phone
                  </p>
                  <p className="mt-2 text-sm font-medium text-gray-900">
                    {selectedStudent.phone || "-"}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Parent Contact No
                  </p>
                  <p className="mt-2 text-sm font-medium text-gray-900">
                    {selectedStudent.parentContactNo || "-"}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Session
                  </p>
                  <p className="mt-2 text-sm font-medium text-gray-900">
                    {selectedStudent.session || "-"}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Blood Group
                  </p>
                  <p className="mt-2 text-sm font-medium text-gray-900">
                    {selectedStudent.bloodGroup || "-"}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Course Code
                  </p>
                  <p className="mt-2 text-sm font-medium text-gray-900">
                    {selectedStudent.course || "-"}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Course Name
                  </p>
                  <p className="mt-2 text-sm font-medium text-gray-900">
                    {COURSE_NAMES[selectedStudent.course] || "-"}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Year
                  </p>
                  <p className="mt-2 text-sm font-medium text-gray-900">
                    {selectedStudent.year
                      ? `Year ${selectedStudent.year}`
                      : "-"}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Registered On
                  </p>
                  <p className="mt-2 text-sm font-medium text-gray-900">
                    {selectedStudent.createdAt
                      ? new Date(selectedStudent.createdAt).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
              </div>
            ) : (
              <StudentQrPanel
                student={selectedStudent}
                onStudentUpdated={handleStudentUpdated}
              />
            )}

            <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:flex-wrap sm:justify-end md:px-6">
              <Link
                href={`/dashboard/admin/attendance/scan?course=${encodeURIComponent(
                  selectedStudent.course || "",
                )}&year=${encodeURIComponent(String(selectedStudent.year || ""))}`}
                className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100"
              >
                Open Admin QR Scanner
              </Link>
              <button
                type="button"
                onClick={() => openEditStudent(selectedStudent)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Edit Details
              </button>
              <button
                type="button"
                onClick={() => openStudentSummary(selectedStudent._id)}
                className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
              >
                View Attendance Record
              </button>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {editingStudent && (
        <div className="fixed inset-0 z-[55] flex items-start justify-center bg-black/50 px-3 py-3 md:items-center md:px-4 md:py-6">
          <div className="max-h-[96vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl md:max-h-[92vh]">
            <div className="flex flex-col gap-4 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-start sm:justify-between md:px-6 md:py-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Edit Student
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Update only the fields you want to change. Leaving password
                  blank keeps it unchanged.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingStudent(null);
                  setEditError("");
                }}
                className="self-end rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 sm:self-auto"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 px-4 py-4 md:grid-cols-2 md:px-6 md:py-6">
              <div className="md:col-span-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <ProfileAvatar
                    src={editForm.profileImage}
                    name={editForm.name}
                    sizeClass="h-20 w-20"
                    textClassName="text-xl"
                  />

                  <div className="flex-1">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Student Profile Picture
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageChange}
                      className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-full file:border-0 file:bg-blue-100 file:px-4 file:py-2 file:font-medium file:text-blue-700 hover:file:bg-blue-200"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Upload a student photo to show a circular profile icon in
                      the student panel.
                    </p>
                    {editForm.profileImage && (
                      <button
                        type="button"
                        onClick={() =>
                          setEditForm((prev) => ({ ...prev, profileImage: "" }))
                        }
                        className="mt-2 text-xs font-semibold text-red-600 hover:text-red-700"
                      >
                        Remove photo
                      </button>
                    )}
                    {editImageLoading && (
                      <p className="mt-2 text-xs font-medium text-blue-600">
                        Processing image...
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Parent Contact No
                </label>
                <input
                  type="text"
                  value={editForm.parentContactNo}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      parentContactNo: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Session
                </label>
                <input
                  type="text"
                  value={editForm.session}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      session: e.target.value,
                    }))
                  }
                  placeholder="e.g. 2026-2027"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Blood Group
                </label>
                <input
                  type="text"
                  value={editForm.bloodGroup}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      bloodGroup: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Course
                </label>
                <select
                  value={editForm.course}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, course: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Course</option>
                  <option value="BPT">BPT</option>
                  <option value="BOPTOM">BOPTOM</option>
                  <option value="BMRIT">BMRIT</option>
                  <option value="DOPTOM">DOPTOM</option>
                  <option value="BOTT">BOTT</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Year
                </label>
                <select
                  value={editForm.year}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, year: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Year</option>
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                  <option value="4">Year 4</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder="Leave blank to keep current password"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {editError && (
              <div className="px-6 pb-4 text-sm font-medium text-red-600">
                {editError}
              </div>
            )}

            <div className="flex justify-end border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setEditingStudent(null);
                  setEditError("");
                }}
                className="mr-3 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateStudent}
                disabled={editLoading || editImageLoading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {editLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedStudentId && (
        <AttendanceSummaryModal
          summary={studentSummary}
          loading={summaryLoading}
          error={summaryError}
          monthKey={summaryMonthKey}
          onMonthChange={setSummaryMonthKey}
          onClose={() => {
            setSelectedStudentId("");
            setStudentSummary(null);
            setSummaryError("");
          }}
        />
      )}
    </div>
  );
}
