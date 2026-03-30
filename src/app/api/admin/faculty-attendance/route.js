import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import User from "../../../models/User";
import FacultyAttendance from "../../../models/FacultyAttendance";
import { requireAdmin } from "../../../lib/auth";
import {
  findApplicableHoliday,
  isSunday,
  isWinterVacation,
} from "../../../lib/attendanceEvents";

function getTodayISO() {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

function normalizeFacultyType(value) {
  return String(value || "").trim() === "nonTeaching"
    ? "nonTeaching"
    : "teaching";
}

function formatFacultyMember(member, recordMap) {
  const facultyType = normalizeFacultyType(member.facultyType);

  return {
    _id: String(member._id),
    name: member.name,
    email: member.email || "",
    phone: member.phone || "",
    facultyType,
    assignedCourse:
      facultyType === "teaching" ? member.assignedCourse || "" : "",
    designation:
      facultyType === "nonTeaching" ? member.designation || "" : "",
    status: recordMap.get(String(member._id)) || "not_marked",
  };
}

async function getFacultyHolidayInfo(date) {
  if (!date) return null;

  if (isWinterVacation(date)) {
    return {
      status: "holiday",
      title: "Winter vacation",
      kind: "vacation",
    };
  }

  if (isSunday(date)) {
    return {
      status: "holiday",
      title: "Sunday holiday",
      kind: "sunday",
    };
  }

  const holiday = await findApplicableHoliday({ date });
  if (!holiday) return null;

  return {
    status: "holiday",
    title: holiday.title || "College holiday",
    kind: holiday.eventType || "holiday",
  };
}

export async function GET(req) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const date = String(searchParams.get("date") || "").trim() || getTodayISO();
    const holidayInfo = await getFacultyHolidayInfo(date);

    const [facultyMembers, attendanceDoc] = await Promise.all([
      User.find({ role: "faculty" })
        .select("name email phone assignedCourse designation facultyType")
        .sort({ facultyType: 1, name: 1 })
        .lean(),
      FacultyAttendance.findOne({ date }).lean(),
    ]);

    const recordMap = new Map();
    (attendanceDoc?.records || []).forEach((record) => {
      recordMap.set(String(record.facultyId), record.status);
    });

    const members = facultyMembers.map((member) =>
      formatFacultyMember(member, recordMap),
    );

    return NextResponse.json({
      date,
      holiday: holidayInfo,
      members,
      summary: {
        total: members.length,
        teaching: members.filter((member) => member.facultyType === "teaching")
          .length,
        nonTeaching: members.filter(
          (member) => member.facultyType === "nonTeaching",
        ).length,
        present: members.filter((member) => member.status === "present").length,
        absent: members.filter((member) => member.status === "absent").length,
        leave: members.filter((member) => member.status === "leave").length,
        holiday: members.filter((member) => member.status === "holiday").length,
      },
    });
  } catch (error) {
    console.error("FACULTY ATTENDANCE GET ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    await connectDB();

    const body = await req.json();
    const date = String(body?.date || "").trim() || getTodayISO();
    const incomingRecords = Array.isArray(body?.records) ? body.records : [];
    const holidayInfo = await getFacultyHolidayInfo(date);

    const facultyIds = [
      ...new Set(
        incomingRecords
          .map((record) => String(record?.facultyId || "").trim())
          .filter(Boolean),
      ),
    ];

    const facultyUsers = await User.find({
      _id: { $in: facultyIds },
      role: "faculty",
    })
      .select("_id")
      .lean();

    const validFacultyIds = new Set(
      facultyUsers.map((faculty) => String(faculty._id)),
    );

    const records = incomingRecords
      .map((record) => ({
        facultyId: String(record?.facultyId || "").trim(),
        status: String(record?.status || "").trim().toLowerCase(),
      }))
      .filter(
        (record) =>
          validFacultyIds.has(record.facultyId) &&
          ["present", "absent", "leave", "holiday"].includes(record.status),
      )
      .map((record) => ({
        facultyId: record.facultyId,
        status: record.status,
      }));

    await FacultyAttendance.findOneAndUpdate(
      { date },
      {
        $set: {
          date,
          markedBy: auth.decoded.id,
          records,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      },
    );

    return NextResponse.json(
      { message: "Faculty attendance saved successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("FACULTY ATTENDANCE POST ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: 500 },
    );
  }
}
