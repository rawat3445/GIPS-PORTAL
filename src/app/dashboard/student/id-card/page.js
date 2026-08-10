import QRCode from "qrcode";
import { redirect } from "next/navigation";
import connectDB from "../../../lib/db";
import { requireStudent } from "../../../lib/auth";
import { createStudentQrToken } from "../../../lib/qrAttendance";
import User from "../../../models/User";

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

export default async function StudentIdCardPage() {
  const auth = await requireStudent();

  if (!auth.ok) {
    redirect("/login");
  }

  await connectDB();

  const student = await User.findOne({ _id: auth.decoded.id, role: "student" })
    .select(
      "_id name email phone course year parentContactNo bloodGroup session profileImage studentCardAddress createdAt",
    )
    .lean();

  if (!student) {
    redirect("/dashboard/student");
  }

  const courseLabel =
    COURSE_NAMES[student.course] || student.course || "Student";
  const studentCardId = getStudentCardId(student);
  const qrDataUrl = await QRCode.toDataURL(createStudentQrToken(student), {
    width: 820,
    margin: 2,
    errorCorrectionLevel: "M",
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });
  const initials = String(student.name || "S").charAt(0).toUpperCase();
  const sessionLabel = student.session || "-";
  const bloodGroupLabel = student.bloodGroup || "-";
  const parentContactLabel = student.parentContactNo || "-";
  const studentResidentialAddress =
    student.studentCardAddress || "Student residential address not saved";
  const websiteLabel = COLLEGE_WEBSITE;
  const signatureDataUrl = "/signature-vice-principal.jpeg";

  return (
    <div className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-3xl border border-white/70 bg-white/85 p-5 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
            Student ID Card
          </p>
          <h1 className="mt-2 text-2xl font-black text-slate-950 md:text-3xl">
            View your ID card
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This is a read-only preview. If any detail is wrong, please contact
            the admin office.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Front Side
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
              <div className="relative z-[2] rounded-[12px] border border-white/100 bg-yellow-400 p-1.5">
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

              <div className="relative z-[2] mx-auto mt-4 h-[16px] w-[16px] items-center justify-center rounded-full border-[4px] border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(219,234,254,0.92))] shadow-[0_18px_40px_-20px_rgba(15,23,42,0.3)]">
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
                    src={signatureDataUrl}
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
          </section>

          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Back Side
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
                  <img
                    src={qrDataUrl}
                    alt={`QR for ${student.name}`}
                    className="h-[126px] w-[126px] rounded-[10px] bg-white object-contain"
                  />
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
                    {COLLEGE_PHONE}
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
                    {CARD_FOUND_MESSAGE}
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
          </section>
        </div>
      </div>
    </div>
  );
}
