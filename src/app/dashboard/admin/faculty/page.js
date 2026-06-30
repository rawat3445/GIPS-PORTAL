"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import ProfileAvatar from "../../../components/ProfileAvatar";
import { resizeImageToAvatarDataUrl } from "../../../lib/avatarUpload";

const COURSE_OPTIONS = [
  { value: "BPT", label: "Bachelor of Physiotherapy (BPT)" },
  { value: "BOPTOM", label: "Bachelor of Optometry (BOPTOM)" },
  { value: "BMRIT", label: "Medical Radiology & Imaging (BMRIT)" },
  { value: "DOPTOM", label: "Diploma in Optometry (DOPTOM)" },
  { value: "BOTT", label: "Operation Theater Technology (BOTT)" },
];

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

function getFacultyTypeValue(value) {
  return value === "nonTeaching" ? "nonTeaching" : "teaching";
}

function createEmptyForm(facultyType = "teaching") {
  return {
    name: "",
    email: "",
    password: "",
    facultyType,
    assignedCourse: "BPT",
    designation: "",
    phone: "",
    profileImage: "",
  };
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
  return (
    String(value || "faculty-id-card")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "faculty-id-card"
  );
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

  return readBlobAsDataUrl(await response.blob());
}

function getFacultyCardSerial(member) {
  const objectIdText = String(member?._id || "").trim();
  if (objectIdText) {
    const numericValue = parseInt(objectIdText.slice(-6), 16);
    if (!Number.isNaN(numericValue)) {
      return String(numericValue % 1000).padStart(3, "0");
    }
  }

  return "001";
}

function getFacultyCardId(member) {
  const facultyType = getFacultyTypeValue(member?.facultyType);
  const typeCode =
    facultyType === "nonTeaching"
      ? "NTF"
      : String(member?.assignedCourse || "FAC").trim().toUpperCase();
  const createdYear = member?.createdAt
    ? new Date(member.createdAt).getFullYear()
    : new Date().getFullYear();

  return `GIPS-${typeCode}-${createdYear}-${getFacultyCardSerial(member)}`;
}

function getFacultyCardSubtitle(member) {
  const facultyType = getFacultyTypeValue(member?.facultyType);
  if (facultyType === "nonTeaching") {
    return member?.designation || "Non-Teaching Faculty";
  }

  return COURSE_NAMES[member?.assignedCourse] || member?.assignedCourse || "Teaching Faculty";
}

function buildFacultyQrPayload(member) {
  return JSON.stringify({
    type: "faculty-card",
    id: String(member?._id || ""),
    name: String(member?.name || ""),
    facultyType: getFacultyTypeValue(member?.facultyType),
    assignedCourse: String(member?.assignedCourse || ""),
    designation: String(member?.designation || ""),
    email: String(member?.email || ""),
    phone: String(member?.phone || ""),
  });
}

function buildIdCardMarkup({
  personName,
  subtitle,
  idLabel,
  detailOneLabel,
  detailOneValue,
  detailTwoLabel,
  detailTwoValue,
  detailThreeLabel,
  detailThreeValue,
  phoneLabel,
  websiteHost,
  messageLabel,
  addressLabel,
  addressValue,
  qrDataUrl,
  logoUrl,
  signatureUrl,
  profileImageUrl,
}) {
  const safeName = escapeHtml(personName || "-");
  const initials = escapeHtml(String(personName || "F").charAt(0).toUpperCase());
  const photoMarkup = profileImageUrl
    ? `<img src="${profileImageUrl}" alt="${safeName}" class="photo-image" />`
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

          <div class="name">${safeName}</div>
          <div class="subline">${escapeHtml(subtitle)}</div>

          <div class="meta">
            <div class="row">
              <div class="row-label">Faculty ID</div>
              <div class="row-value">${escapeHtml(idLabel)}</div>
            </div>
            <div class="row">
              <div class="row-label">${escapeHtml(detailOneLabel)}</div>
              <div class="row-value">${escapeHtml(detailOneValue)}</div>
            </div>
            <div class="row">
              <div class="row-label">${escapeHtml(detailTwoLabel)}</div>
              <div class="row-value">${escapeHtml(detailTwoValue)}</div>
            </div>
            <div class="row">
              <div class="row-label">${escapeHtml(detailThreeLabel)}</div>
              <div class="row-value">${escapeHtml(detailThreeValue)}</div>
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
            <div class="back-note">Scan for faculty profile</div>
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
            <div class="address-label">${escapeHtml(addressLabel)}</div>
            <div class="address-value">${escapeHtml(addressValue)}</div>
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
            background:
              radial-gradient(circle at top left, rgba(255,255,255,0.75), transparent 30%),
              radial-gradient(circle at bottom right, rgba(109,208,203,0.28), transparent 34%),
              linear-gradient(180deg, #e8fbfb 0%, #c9f2f0 40%, #96ddd8 72%, #6bcac5 100%);
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
            inset: 0;
            background:
              radial-gradient(circle at top left, rgba(255,255,255,0.5), transparent 24%),
              linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 58%);
          }
          .hero-back {
            inset: 0;
            background:
              radial-gradient(circle at top right, rgba(255,255,255,0.46), transparent 24%),
              linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 58%);
          }
          .wave-layer {
            position: absolute;
            left: -26px;
            right: -26px;
            border-radius: 999px;
            transform: rotate(-5deg);
            z-index: 1;
          }
          .wave-one {
            top: 120px;
            height: 72px;
            background: linear-gradient(90deg, rgba(220,250,248,0.56) 0%, rgba(165,235,231,0.48) 100%);
          }
          .wave-two {
            top: 250px;
            left: -18px;
            right: -38px;
            height: 84px;
            background: linear-gradient(90deg, rgba(188,239,238,0.34) 0%, rgba(117,208,204,0.4) 100%);
            transform: rotate(-4deg);
          }
          .wave-three {
            top: 420px;
            left: 24px;
            right: -24px;
            height: 94px;
            background: rgba(241, 252, 251, 0.26);
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
            border: 1px solid rgba(255, 255, 255, 0.75);
            background: rgba(236, 252, 251, 0.42);
            backdrop-filter: blur(2px);
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
            color: #0f172a;
          }
          .college strong {
            display: block;
            font-size: 8px;
            line-height: 1.05;
            font-weight: 700;
            color: #020617;
          }
          .college span {
            display: block;
            margin-top: 2px;
          }
          .photo-wrap {
            margin: 16px auto 0;
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
        ${
          includeToolbar
            ? `
          <div class="toolbar">
            <button type="button" onclick="window.print()">Print</button>
            <button type="button" class="secondary" onclick="window.close()">Close</button>
          </div>
        `
            : ""
        }
        ${content}
      </body>
    </html>
  `;
}

function FacultyIdCardPanel({ member, onFacultyUpdated }) {
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
    address: member.facultyCardAddress || "",
  });

  const subtitle = getFacultyCardSubtitle(member);
  const facultyCardId = getFacultyCardId(member);
  const facultyType = getFacultyTypeValue(member.facultyType);
  const detailOneLabel = facultyType === "nonTeaching" ? "Faculty Type" : "Assigned Course";
  const detailOneValue =
    facultyType === "nonTeaching"
      ? "Non-Teaching"
      : COURSE_NAMES[member.assignedCourse] || member.assignedCourse || "-";
  const detailTwoLabel = facultyType === "nonTeaching" ? "Designation" : "Faculty Type";
  const detailTwoValue =
    facultyType === "nonTeaching" ? member.designation || "-" : "Teaching";
  const detailThreeLabel = "Phone";
  const detailThreeValue = member.phone || "-";
  const addressLabel = "Faculty Address";
  const addressValue = cardBackFields.address || "Faculty address not saved";

  function getCardMarkupAssets(overrides = {}) {
    const baseOrigin = window.location.origin;

    return {
      logoUrl: overrides.logoUrl || `${baseOrigin}/collage_logo.png`,
      signatureUrl:
        overrides.signatureUrl ||
        signatureDataUrl ||
        `${baseOrigin}/signature-vice-principal.jpeg`,
      profileImageUrl: overrides.profileImageUrl || member.profileImage || "",
      phoneLabel: cardBackFields.phone || COLLEGE_PHONE,
      websiteHost: cardBackFields.website || COLLEGE_WEBSITE,
      messageLabel: cardBackFields.message || CARD_FOUND_MESSAGE,
    };
  }

  function buildMarkup(overrides = {}) {
    return buildIdCardMarkup({
      personName: member.name || "-",
      subtitle,
      idLabel: facultyCardId,
      detailOneLabel,
      detailOneValue,
      detailTwoLabel,
      detailTwoValue,
      detailThreeLabel,
      detailThreeValue,
      addressLabel,
      addressValue,
      qrDataUrl,
      ...getCardMarkupAssets(overrides),
    });
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

    printWindow.document.write(
      buildIdCardDocument(buildMarkup(), `${member.name || "Faculty"} ID Card`, {
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
      const profileImageUrl = member.profileImage
        ? await loadImageAsDataUrl(member.profileImage).catch(() => "")
        : "";

      const markup = buildMarkup({
        logoUrl,
        signatureUrl,
        profileImageUrl,
      });
      const exportWidth = ID_CARD_WIDTH_PX * 2 + ID_CARD_GAP_PX + 40;
      const exportHeight = ID_CARD_HEIGHT_PX + 40;
      const xhtmlDocument = buildIdCardDocument(
        markup,
        `${member.name || "Faculty"} ID Card`,
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
            link.download = `${sanitizeFileName(member.name)}-faculty-id-card.png`;
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
        const dataUrl = await QRCode.toDataURL(buildFacultyQrPayload(member), {
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
          setQrError(error.message || "Unable to generate faculty QR");
        }
      }
    }

    generateQr();

    return () => {
      active = false;
    };
  }, [member]);

  useEffect(() => {
    let active = true;
    const image = new Image();

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
          throw new Error("Unable to process signature image");
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
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
    setCardBackFields({
      phone: COLLEGE_PHONE,
      website: COLLEGE_WEBSITE,
      message: CARD_FOUND_MESSAGE,
      address: member.facultyCardAddress || "",
    });
    setCardAddressMessage("");
  }, [member._id, member.facultyCardAddress]);

  async function handleSaveCardAddress() {
    if (!member?._id) return;

    try {
      setCardAddressSaving(true);
      setCardAddressMessage("");

      const res = await fetch(`/api/admin/users/${member._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facultyCardAddress: cardBackFields.address,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Unable to save address");
      }

      if (data?.user) {
        onFacultyUpdated?.(data.user);
      }
      setCardAddressMessage("Faculty address saved.");
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
            Faculty ID Card
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Preview both sides, print or download the card, and edit the saved
            back-side address.
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
            className="mx-auto relative flex flex-col overflow-hidden rounded-[14px] border border-sky-100 bg-[linear-gradient(180deg,#e8fbfb_0%,#c9f2f0_40%,#96ddd8_72%,#6bcac5_100%)] p-[10px] text-slate-900 shadow-[0_22px_48px_-26px_rgba(15,23,42,0.45)]"
            style={{
              fontFamily: '"Trebuchet MS", "Arial Narrow", Arial, sans-serif',
              width: "5.4cm",
              height: "8.56cm",
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.68),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(109,208,203,0.28),transparent_34%)]" />
            <div className="absolute left-[-26px] right-[-26px] top-[120px] h-[72px] rotate-[-5deg] rounded-full bg-[linear-gradient(90deg,rgba(220,250,248,0.56)_0%,rgba(165,235,231,0.48)_100%)]" />
            <div className="absolute left-[-18px] right-[-38px] top-[250px] h-[84px] rotate-[-4deg] rounded-full bg-[linear-gradient(90deg,rgba(188,239,238,0.34)_0%,rgba(117,208,204,0.4)_100%)]" />
            <div className="absolute left-[24px] right-[-24px] top-[420px] h-[94px] rotate-[-3deg] rounded-full bg-white/25" />
            <div className="relative z-[2] h-[7px] rounded-full opacity-1" />
            <div className="relative z-[2] rounded-[12px] border border-white/75 bg-white/35 p-1.5 backdrop-blur-[2px]">
              <div className="flex items-start gap-2">
                <img
                  src="/collage_logo.png"
                  alt="GIPS Logo"
                  className="h-7 w-7 flex-shrink-0 object-contain"
                />
                <div className="min-w-0">
                  <p className="text-[8px] font-bold leading-tight text-slate-950">
                    {COLLEGE_NAME}
                  </p>
                  <p className="mt-0.5 text-[5.5px] leading-[1.1] text-slate-800">
                    {COLLEGE_AFFILIATION}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative z-[2] mx-auto mt-4 h-[66px] w-[66px] rounded-full border-[4px] border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(219,234,254,0.92))] shadow-[0_18px_40px_-20px_rgba(15,23,42,0.3)]">
              {member.profileImage ? (
                <img
                  src={member.profileImage}
                  alt={member.name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-slate-700">
                  {String(member.name || "F").charAt(0).toUpperCase()}
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
                {member.name}
              </h3>
              <p className="mt-0.5 text-[7px] font-semibold leading-[1.05] text-slate-800">
                {subtitle}
              </p>
            </div>

            <div className="relative z-[2] mt-1.5 grid grid-cols-1 gap-1">
              {[
                ["Faculty ID", facultyCardId],
                [detailOneLabel, detailOneValue],
                [detailTwoLabel, detailTwoValue],
                [detailThreeLabel, detailThreeValue],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-[6px] border border-sky-200/40 border-l-[2px] border-l-sky-500 bg-[linear-gradient(90deg,rgba(224,242,254,0.72),rgba(255,255,255,0.18))] px-[5px] py-[2px]"
                >
                  <p className="text-[5px] font-bold uppercase tracking-[0.12em] text-sky-700">
                    {label}
                  </p>
                  <p className="mt-0.5 text-[7px] font-bold leading-[1.05] text-slate-900">
                    {value || "-"}
                  </p>
                </div>
              ))}
            </div>

            <div className="relative z-[2] mt-1 flex items-end justify-between">
              <div className="w-[72px] rounded-[8px]">
                <img
                  src={signatureDataUrl || "/signature-vice-principal.jpeg"}
                  alt="Authority Signature"
                  className="h-[20px] ml-1 object-contain"
                />
                <p className="mt-0.5 text-[4px] text-slate-600">Signature</p>
              </div>
              <div className="text-right">
                <p className="text-[4px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  Issuing Authority
                </p>
                <p className="mt-0.5 text-[6px] font-extrabold text-slate-950">
                  {CARD_AUTHORITY}
                </p>
                <p className="mt-0.5 max-w-[82px] text-[4px] leading-[1.2] text-slate-600">
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
            className="mx-auto relative flex flex-col overflow-hidden rounded-[14px] border border-cyan-100 bg-[linear-gradient(180deg,#e8fbfb_0%,#c9f2f0_40%,#96ddd8_72%,#6bcac5_100%)] p-[10px] text-slate-900 shadow-[0_22px_48px_-26px_rgba(15,23,42,0.45)]"
            style={{
              fontFamily: '"Trebuchet MS", "Arial Narrow", Arial, sans-serif',
              width: "5.4cm",
              height: "8.56cm",
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.58),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(109,208,203,0.22),transparent_32%)]" />
            <div className="absolute left-[-26px] right-[-26px] top-[120px] h-[72px] rotate-[-5deg] rounded-full bg-[linear-gradient(90deg,rgba(220,250,248,0.56)_0%,rgba(165,235,231,0.48)_100%)]" />
            <div className="absolute left-[-18px] right-[-38px] top-[250px] h-[84px] rotate-[-4deg] rounded-full bg-[linear-gradient(90deg,rgba(188,239,238,0.34)_0%,rgba(117,208,204,0.4)_100%)]" />
            <div className="absolute left-[24px] right-[-24px] top-[420px] h-[94px] rotate-[-3deg] rounded-full bg-white/25" />
            <div className="relative z-[2] h-[7px] rounded-full opacity-0" />
            <div className="relative z-[2] mt-[8px] flex flex-1 flex-col items-center justify-center gap-2">
              <div className="rounded-[18px] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(239,246,255,0.9))] p-[8px] shadow-[0_18px_36px_-24px_rgba(15,23,42,0.45)]">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR for ${member.name}`}
                    className="h-[126px] w-[126px] rounded-[10px] bg-white object-contain"
                  />
                ) : (
                  <div className="flex h-[126px] w-[126px] items-center justify-center rounded-[10px] border border-dashed border-slate-200 bg-slate-50 px-2 text-center text-[8px] text-slate-500">
                    {qrError || "Generating QR..."}
                  </div>
                )}
              </div>
              <p className="text-[7px] font-bold uppercase text-slate-700">
                Scan for faculty profile
              </p>
            </div>

            <div className="relative z-[2] mt-1 grid grid-cols-1 gap-1">
              {[
                ["College Phone No", cardBackFields.phone],
                ["Website", cardBackFields.website],
                ["Message", cardBackFields.message],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-[6px] border border-sky-200/40 border-l-[2px] border-l-sky-500 bg-[linear-gradient(90deg,rgba(224,242,254,0.72),rgba(255,255,255,0.18))] px-[5px] py-[2px]"
                >
                  <p className="text-[5px] font-bold uppercase tracking-[0.12em] text-sky-700">
                    {label}
                  </p>
                  <p className="mt-0.5 text-[7px] font-bold leading-[1.05] text-slate-900">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="relative z-[2] mt-1 rounded-[10px] border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(239,246,255,0.86))] px-[6px] py-[4px] text-center">
              <p className="text-[5px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Faculty Address
              </p>
              <p className="mt-0.5 text-[7px] font-semibold leading-[1.05] text-slate-900">
                {addressValue}
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
              Faculty Address
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
              placeholder="Enter this faculty member's address"
            />
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-600">
            College phone, website and message stay as default; only this
            faculty member&apos;s address is saved.
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
          <p className="mt-3 text-sm font-medium text-slate-600">
            {cardAddressMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function FacultyPageContent() {
  const searchParams = useSearchParams();
  const currentType = getFacultyTypeValue(searchParams.get("type"));

  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [selectedFacultyView, setSelectedFacultyView] = useState("details");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editImageLoading, setEditImageLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [form, setForm] = useState(createEmptyForm(currentType));

  const pageTitle =
    currentType === "nonTeaching" ? "Non-Teaching Faculty" : "Teaching Faculty";
  const addHref = `/dashboard/admin/faculty/add?type=${currentType}`;

  useEffect(() => {
    const success = new URLSearchParams(window.location.search).get("success");
    if (success) {
      alert(success);
    }
  }, []);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      facultyType: currentType,
      assignedCourse:
        currentType === "teaching" ? prev.assignedCourse || "BPT" : "",
      designation: currentType === "nonTeaching" ? prev.designation : "",
    }));
  }, [currentType]);

  useEffect(() => {
    async function fetchFaculty() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          role: "faculty",
          facultyType: currentType,
        });

        const res = await fetch(`/api/admin/users?${params.toString()}`, {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || `Failed (HTTP ${res.status})`);
        }

        setFaculty(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Unable to load faculty");
        setFaculty([]);
      } finally {
        setLoading(false);
      }
    }

    fetchFaculty();
  }, [currentType]);

  const summaryText = useMemo(() => {
    if (currentType === "nonTeaching") {
      return "Manage office, lab, support, and other non-teaching staff from one place.";
    }

    return "Manage course-assigned teaching faculty and keep course ownership clear.";
  }, [currentType]);

  function handleFacultyUpdated(updatedMember) {
    const nextType = getFacultyTypeValue(updatedMember?.facultyType);

    setFaculty((prev) =>
      prev
        .map((member) =>
          member._id === updatedMember._id ? updatedMember : member,
        )
        .filter(
          (member) => getFacultyTypeValue(member.facultyType) === currentType,
        ),
    );
    setSelectedFaculty((prev) =>
      prev && prev._id === updatedMember._id ? updatedMember : prev,
    );
    setEditingFaculty((prev) =>
      prev && prev._id === updatedMember._id ? updatedMember : prev,
    );

    if (nextType !== currentType) {
      setSelectedFaculty(null);
      setEditingFaculty(null);
    }
  }

  function openFacultyCard(member) {
    setSelectedFaculty(member);
    setSelectedFacultyView("details");
  }

  function openEditModal(member) {
    const facultyType = getFacultyTypeValue(member.facultyType);
    setEditingFaculty(member);
    setEditError("");
    setForm({
      name: member.name || "",
      email: member.email || "",
      password: "",
      facultyType,
      assignedCourse: member.assignedCourse || "BPT",
      designation: member.designation || "",
      phone: member.phone || "",
      profileImage: member.profileImage || "",
    });
  }

  function closeEditModal() {
    setEditingFaculty(null);
    setEditError("");
    setForm(createEmptyForm(currentType));
  }

  async function handleEditImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setEditImageLoading(true);
      setEditError("");
      const profileImage = await resizeImageToAvatarDataUrl(file);
      setForm((prev) => ({ ...prev, profileImage }));
    } catch (uploadError) {
      setEditError(uploadError.message || "Failed to process image");
    } finally {
      setEditImageLoading(false);
      e.target.value = "";
    }
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    if (!editingFaculty?._id) return;

    try {
      setSavingEdit(true);
      setEditError("");

      const payload = {
        name: form.name,
        email: form.email,
        facultyType: form.facultyType,
        phone: form.phone,
      };

      if (form.facultyType === "teaching") {
        payload.assignedCourse = form.assignedCourse;
      } else {
        payload.designation = form.designation;
      }

      if (form.profileImage !== (editingFaculty.profileImage || "")) {
        if (form.profileImage) {
          payload.profileImage = form.profileImage;
        } else {
          payload.removeProfileImage = true;
        }
      }

      if (form.password.trim()) {
        payload.password = form.password;
      }

      const res = await fetch(`/api/admin/users/${editingFaculty._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || `Update failed (HTTP ${res.status})`);
      }

      handleFacultyUpdated(data.user);
      closeEditModal();
      alert(data.message || "Faculty updated successfully");
    } catch (err) {
      setEditError(err.message || "Failed to update faculty");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this faculty member?")) return;

    const res = await fetch(`/api/admin/users/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.message || `Delete failed (HTTP ${res.status})`);
      return;
    }

    setFaculty((prev) => prev.filter((member) => member._id !== id));
    setSelectedFaculty((prev) => (prev && prev._id === id ? null : prev));
    setEditingFaculty((prev) => (prev && prev._id === id ? null : prev));
    alert(data.message || "Deleted");
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {pageTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{summaryText}</p>
          <p className="mt-2 text-sm text-slate-500">
            <span className="font-medium text-slate-900">{faculty.length}</span>{" "}
            member{faculty.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/admin/faculty?type=teaching"
            className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition ${
              currentType === "teaching"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
            }`}
          >
            Teaching
          </Link>
          <Link
            href="/dashboard/admin/faculty?type=nonTeaching"
            className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition ${
              currentType === "nonTeaching"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
            }`}
          >
            Non-Teaching
          </Link>
          <Link
            href={addHref}
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
          >
            <span className="mr-2 text-lg leading-none">+</span>
            Add {currentType === "nonTeaching" ? "Non-Teaching" : "Teaching"}
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400" />

        {loading ? (
          <div className="flex items-center justify-center px-6 py-10 text-sm text-slate-500">
            <div className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
            Loading faculty list...
          </div>
        ) : error ? (
          <div className="px-6 py-6 text-sm text-red-600">{error}</div>
        ) : faculty.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            <p className="mb-2 font-medium text-slate-600">
              No {currentType === "nonTeaching" ? "non-teaching" : "teaching"} faculty found.
            </p>
            <p className="mb-4">
              Start by adding your first{" "}
              {currentType === "nonTeaching"
                ? "non-teaching staff member"
                : "teaching faculty member"}
              .
            </p>
            <Link
              href={addHref}
              className="inline-flex items-center justify-center rounded-md bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200 transition hover:bg-indigo-100"
            >
              + Add {currentType === "nonTeaching" ? "Non-Teaching" : "Teaching"}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Name
                  </th>
                  {currentType === "nonTeaching" ? (
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Designation
                    </th>
                  ) : (
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Assigned Course
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {faculty.map((member) => (
                  <tr key={member._id} className="transition hover:bg-slate-50/80">
                    <td className="px-6 py-4 font-medium text-slate-800">
                      <div className="flex items-center gap-3">
                        <ProfileAvatar
                          src={member.profileImage}
                          name={member.name}
                          sizeClass="h-11 w-11"
                        />
                        <button
                          type="button"
                          onClick={() => openFacultyCard(member)}
                          className="text-left text-indigo-700 hover:text-indigo-900 hover:underline"
                        >
                          {member.name}
                        </button>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                      {currentType === "nonTeaching"
                        ? member.designation || "-"
                        : member.assignedCourse || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                      {member.email}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                      {member.phone || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <button
                        onClick={() => openFacultyCard(member)}
                        className="mr-2 inline-flex items-center rounded-md px-2.5 py-1.5 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-200 transition hover:bg-sky-50"
                      >
                        ID Card
                      </button>
                      <button
                        onClick={() => openEditModal(member)}
                        className="mr-2 inline-flex items-center rounded-md px-2.5 py-1.5 text-xs font-medium text-indigo-600 ring-1 ring-inset ring-indigo-200 transition hover:bg-indigo-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(member._id)}
                        className="inline-flex items-center rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 ring-1 ring-inset ring-red-200 transition hover:bg-red-50"
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

      {selectedFaculty ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-3 py-3 md:items-center md:px-4">
          <div className="max-h-[96vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl md:max-h-[92vh]">
            <div className="flex flex-col gap-4 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-start sm:justify-between md:px-6 md:py-5">
              <div className="flex items-center gap-4">
                <ProfileAvatar
                  src={selectedFaculty.profileImage}
                  name={selectedFaculty.name}
                  sizeClass="h-16 w-16"
                  textClassName="text-xl"
                />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Faculty Details
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Complete profile for {selectedFaculty.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setSelectedFacultyView("details")}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    selectedFacultyView === "details"
                      ? "bg-blue-600 text-white"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFacultyView("card")}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    selectedFacultyView === "card"
                      ? "bg-sky-600 text-white"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  ID Card
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFaculty(null)}
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

            {selectedFacultyView === "details" ? (
              <div className="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-2 md:px-6 md:py-6">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Full Name
                  </p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {selectedFaculty.name || "-"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Email
                  </p>
                  <p className="mt-2 text-sm font-medium text-gray-900">
                    {selectedFaculty.email || "-"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Phone
                  </p>
                  <p className="mt-2 text-sm font-medium text-gray-900">
                    {selectedFaculty.phone || "-"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Faculty Type
                  </p>
                  <p className="mt-2 text-sm font-medium text-gray-900">
                    {getFacultyTypeValue(selectedFaculty.facultyType) === "nonTeaching"
                      ? "Non-Teaching"
                      : "Teaching"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Assigned Course
                  </p>
                  <p className="mt-2 text-sm font-medium text-gray-900">
                    {selectedFaculty.assignedCourse || "-"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Designation
                  </p>
                  <p className="mt-2 text-sm font-medium text-gray-900">
                    {selectedFaculty.designation || "-"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Faculty Address
                  </p>
                  <p className="mt-2 text-sm font-medium text-gray-900">
                    {selectedFaculty.facultyCardAddress || "-"}
                  </p>
                </div>
              </div>
            ) : (
              <FacultyIdCardPanel
                member={selectedFaculty}
                onFacultyUpdated={handleFacultyUpdated}
              />
            )}

            <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:flex-wrap sm:justify-end md:px-6">
              <button
                type="button"
                onClick={() => openEditModal(selectedFaculty)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Edit Details
              </button>
              <button
                type="button"
                onClick={() => setSelectedFaculty(null)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editingFaculty ? (
        <div className="fixed inset-0 z-[55] flex items-start justify-center bg-black/50 px-3 py-3 md:items-center md:px-4 md:py-6">
          <div className="max-h-[96vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl md:max-h-[92vh]">
            <div className="flex flex-col gap-4 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-start sm:justify-between md:px-6 md:py-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Edit Faculty</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Update the faculty profile, photo, and account details here.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
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

            <form onSubmit={handleEditSubmit} className="space-y-5 px-4 py-4 md:px-6 md:py-6">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <ProfileAvatar
                    src={form.profileImage}
                    name={form.name}
                    sizeClass="h-20 w-20"
                    textClassName="text-xl"
                  />

                  <div className="flex-1">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Faculty Profile Picture
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageChange}
                      className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-full file:border-0 file:bg-blue-100 file:px-4 file:py-2 file:font-medium file:text-blue-700 hover:file:bg-blue-200"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Upload a faculty photo to show the same image on the ID card
                      and faculty list.
                    </p>
                    {form.profileImage ? (
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({ ...prev, profileImage: "" }))
                        }
                        className="mt-2 text-xs font-semibold text-red-600 hover:text-red-700"
                      >
                        Remove photo
                      </button>
                    ) : null}
                    {editImageLoading ? (
                      <p className="mt-2 text-xs font-medium text-blue-600">
                        Processing image...
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Faculty type
                </label>
                <select
                  value={form.facultyType}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      facultyType: getFacultyTypeValue(e.target.value),
                      assignedCourse:
                        e.target.value === "teaching"
                          ? prev.assignedCourse || "BPT"
                          : "",
                      designation:
                        e.target.value === "nonTeaching" ? prev.designation : "",
                    }))
                  }
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="teaching">Teaching</option>
                  <option value="nonTeaching">Non-Teaching</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    Full name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                {form.facultyType === "teaching" ? (
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      Assigned course
                    </label>
                    <select
                      value={form.assignedCourse}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          assignedCourse: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    >
                      {COURSE_OPTIONS.map((course) => (
                        <option key={course.value} value={course.value}>
                          {course.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      Designation
                    </label>
                    <input
                      type="text"
                      required={form.facultyType === "nonTeaching"}
                      value={form.designation}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          designation: e.target.value,
                        }))
                      }
                      placeholder="e.g. Office Superintendent"
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  New password
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="Leave blank to keep current password"
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {editError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {editError}
                </p>
              ) : null}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="inline-flex items-center rounded-md px-3 py-2 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function FacultyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400" />
            <div className="flex items-center justify-center px-6 py-10 text-sm text-slate-500">
              Loading faculty panel...
            </div>
          </div>
        </div>
      }
    >
      <FacultyPageContent />
    </Suspense>
  );
}
