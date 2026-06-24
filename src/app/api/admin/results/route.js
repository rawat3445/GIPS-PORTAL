import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import { requireAdmin } from "../../../lib/auth";
import StudentResult from "../../../models/StudentResult";
import User from "../../../models/User";

function safeString(value) {
  return String(value || "").trim();
}

function normalizeArrayInput(value) {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function normalizeNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeResultStatus(value, fallback = "pass") {
  const status = safeString(value).toLowerCase();
  if (["pass", "fail", "pending", "pwg", "bp", "absent"].includes(status)) {
    return status;
  }
  return fallback;
}

function normalizeComponentStatus(value, fallback = "present") {
  const status = safeString(value).toLowerCase();
  if (["present", "absent", "pending"].includes(status)) {
    return status;
  }
  return fallback;
}

function getComponentResultStatus({
  hasComponent,
  attendanceStatus,
  explicitStatus,
  marks,
  maxMarks,
}) {
  if (!hasComponent) return "pending";

  const normalizedExplicit = safeString(explicitStatus);
  if (normalizedExplicit) {
    return normalizeResultStatus(normalizedExplicit, "pending");
  }

  if (attendanceStatus === "absent") return "absent";

  if (!Number(maxMarks || 0)) return "pending";
  return Number(marks || 0) / Number(maxMarks || 0) >= 0.4 ? "pass" : "fail";
}

function normalizeSaveMode(value) {
  return safeString(value).toLowerCase() === "merge" ? "merge" : "replace";
}

function normalizeSubjects(subjects) {
  const seen = new Set();

  return normalizeArrayInput(subjects)
    .map((subject) => {
      const hasTheory = Boolean(subject?.hasTheory ?? true);
      const hasPractical = Boolean(subject?.hasPractical ?? true);
      const theoryMax = hasTheory
        ? Math.max(0, normalizeNumber(subject?.theoryMax, 70))
        : 0;
      const practicalMax = hasPractical
        ? Math.max(0, normalizeNumber(subject?.practicalMax, 30))
        : 0;

      return {
        subjectCode: safeString(subject?.subjectCode).toUpperCase(),
        subjectName: safeString(subject?.subjectName),
        hasTheory,
        hasPractical,
        theoryMax,
        practicalMax,
      };
    })
    .filter((subject) => {
      if (!subject.subjectCode) return false;
      if (!subject.hasTheory && !subject.hasPractical) return false;
      const key = subject.subjectCode.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function buildStudentSubjects(row, subjects) {
  return subjects.map((subject) => {
    const current = normalizeArrayInput(row?.subjects).find(
      (item) =>
        safeString(item?.subjectCode).toUpperCase() === subject.subjectCode,
    );
    const theoryStatus = subject.hasTheory
      ? normalizeComponentStatus(current?.theoryStatus, "present")
      : "pending";
    const practicalStatus = subject.hasPractical
      ? normalizeComponentStatus(current?.practicalStatus, "present")
      : "pending";
    const theoryMarks = subject.hasTheory
      ? theoryStatus === "absent"
        ? 0
        : Math.max(0, normalizeNumber(current?.theoryMarks, 0))
      : 0;
    const practicalMarks = subject.hasPractical
      ? practicalStatus === "absent"
        ? 0
        : Math.max(0, normalizeNumber(current?.practicalMarks, 0))
      : 0;
    const theoryResultStatus = getComponentResultStatus({
      hasComponent: subject.hasTheory,
      attendanceStatus: theoryStatus,
      explicitStatus: current?.theoryResultStatus,
      marks: theoryMarks,
      maxMarks: subject.theoryMax,
    });
    const practicalResultStatus = getComponentResultStatus({
      hasComponent: subject.hasPractical,
      attendanceStatus: practicalStatus,
      explicitStatus: current?.practicalResultStatus,
      marks: practicalMarks,
      maxMarks: subject.practicalMax,
    });
    const totalMarks = theoryMarks + practicalMarks;
    const totalMax = Number(subject.theoryMax || 0) + Number(subject.practicalMax || 0);
    const explicitSubjectStatus = safeString(current?.subjectStatus);
    const subjectStatus = explicitSubjectStatus
      ? normalizeResultStatus(explicitSubjectStatus, "pending")
      : theoryResultStatus === "bp" || practicalResultStatus === "bp"
        ? "bp"
      : theoryResultStatus === "fail" || practicalResultStatus === "fail"
        ? "fail"
      : theoryStatus === "absent" || practicalStatus === "absent"
        ? "absent"
      : totalMax
        ? totalMarks / totalMax >= 0.4
          ? "pass"
          : "fail"
        : "pending";

    return {
      subjectCode: subject.subjectCode,
      subjectName: subject.subjectName,
      hasTheory: subject.hasTheory,
      hasPractical: subject.hasPractical,
      theoryStatus,
      practicalStatus,
      theoryResultStatus,
      practicalResultStatus,
      subjectStatus,
      theoryMarks,
      practicalMarks,
      theoryMax: subject.theoryMax,
      practicalMax: subject.practicalMax,
      totalMarks,
    };
  });
}

function normalizeStudentRows(rows, subjects) {
  return normalizeArrayInput(rows).map((row) => {
    return buildStudentRow(row, subjects);
  });
}

function buildStudentRow(row, subjects) {
  const normalizedSubjects = buildStudentSubjects(row, subjects);
  const totalMarks = normalizedSubjects.reduce(
    (sum, subject) => sum + Number(subject.totalMarks || 0),
    0,
  );
  const maxMarks = normalizedSubjects.reduce(
    (sum, subject) =>
      sum + Number(subject.theoryMax || 0) + Number(subject.practicalMax || 0),
    0,
  );
  const percentage = maxMarks
    ? Number(((totalMarks / maxMarks) * 100).toFixed(2))
    : 0;
  const explicitStatus = safeString(row?.resultStatus);
  const resultStatus = explicitStatus
    ? normalizeResultStatus(explicitStatus)
    : percentage >= 40
      ? "pass"
      : "fail";

  return {
    studentId: row.studentId,
    studentName: safeString(row.studentName),
    subjects: normalizedSubjects,
    totalMarks,
    maxMarks,
    percentage,
    resultStatus,
    remarks: safeString(row.remarks),
  };
}

function mergeSubjectDefinitions(existingSubjects, incomingSubjects) {
  const merged = new Map();

  for (const subject of Array.isArray(existingSubjects) ? existingSubjects : []) {
    const code = safeString(subject?.subjectCode).toUpperCase();
    if (!code) continue;
    merged.set(code, {
      subjectCode: code,
      subjectName: safeString(subject?.subjectName),
      hasTheory: Boolean(subject?.hasTheory ?? Number(subject?.theoryMax || 0) > 0),
      hasPractical: Boolean(
        subject?.hasPractical ?? Number(subject?.practicalMax || 0) > 0,
      ),
      theoryMax: Math.max(0, normalizeNumber(subject?.theoryMax, 0)),
      practicalMax: Math.max(0, normalizeNumber(subject?.practicalMax, 0)),
    });
  }

  for (const subject of Array.isArray(incomingSubjects) ? incomingSubjects : []) {
    const code = safeString(subject?.subjectCode).toUpperCase();
    if (!code) continue;
    merged.set(code, {
      subjectCode: code,
      subjectName: safeString(subject?.subjectName),
      hasTheory: Boolean(subject?.hasTheory ?? Number(subject?.theoryMax || 0) > 0),
      hasPractical: Boolean(
        subject?.hasPractical ?? Number(subject?.practicalMax || 0) > 0,
      ),
      theoryMax: Math.max(0, normalizeNumber(subject?.theoryMax, 0)),
      practicalMax: Math.max(0, normalizeNumber(subject?.practicalMax, 0)),
    });
  }

  return Array.from(merged.values());
}

function mergeStudentRows(existingStudents, incomingStudents, subjects) {
  const rows = new Map();

  for (const student of Array.isArray(existingStudents) ? existingStudents : []) {
    const key = String(student?.studentId || "");
    if (!key) continue;
    rows.set(key, {
      studentId: key,
      studentName: safeString(student?.studentName),
      resultStatus: safeString(student?.resultStatus) || "pass",
      remarks: safeString(student?.remarks),
      subjects: normalizeArrayInput(student?.subjects),
    });
  }

  for (const student of Array.isArray(incomingStudents) ? incomingStudents : []) {
    const key = String(student?.studentId || "");
    if (!key) continue;
    const previous = rows.get(key);
    const mergedSubjects = new Map();

    for (const subject of normalizeArrayInput(previous?.subjects)) {
      const code = safeString(subject?.subjectCode).toUpperCase();
      if (!code) continue;
      mergedSubjects.set(code, subject);
    }

    for (const subject of normalizeArrayInput(student?.subjects)) {
      const code = safeString(subject?.subjectCode).toUpperCase();
      if (!code) continue;
      mergedSubjects.set(code, subject);
    }

    rows.set(key, {
      studentId: key,
      studentName: safeString(student?.studentName || previous?.studentName),
      resultStatus:
        safeString(student?.resultStatus) ||
        safeString(previous?.resultStatus) ||
        "pass",
      remarks: safeString(student?.remarks || previous?.remarks),
      subjects: Array.from(mergedSubjects.values()),
    });
  }

  return Array.from(rows.values()).map((student) => buildStudentRow(student, subjects));
}

function getGrandTotalMax(subjects) {
  return subjects.reduce(
    (sum, subject) =>
      sum + Number(subject.theoryMax || 0) + Number(subject.practicalMax || 0),
    0,
  );
}

export async function GET(request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const course = safeString(searchParams.get("course")).toUpperCase();
    const year = Number(searchParams.get("year") || 0);
    const resultName = safeString(searchParams.get("resultName"));

    if (course && year && resultName) {
      const [resultDoc, students] = await Promise.all([
        StudentResult.findOne({ course, year, resultName }).lean(),
        User.find({ role: "student", course, year })
          .select("name course year")
          .sort({ name: 1 })
          .lean(),
      ]);

      const subjectDefinitions = Array.isArray(resultDoc?.subjects)
        ? resultDoc.subjects
        : [];

      const studentMap = new Map(
        students.map((student) => [String(student._id), student]),
      );

      const studentRows = resultDoc
        ? (Array.isArray(resultDoc.students) ? resultDoc.students : []).map((entry) => {
            const linkedStudent = studentMap.get(String(entry.studentId));

            return {
              studentId: String(entry.studentId),
              studentName:
                safeString(entry.studentName) ||
                linkedStudent?.name ||
                "Student",
              resultStatus: entry?.resultStatus || "pass",
              remarks: entry?.remarks || "",
              subjects: buildStudentSubjects(entry || {}, subjectDefinitions),
            };
          })
        : students.map((student) => ({
            studentId: String(student._id),
            studentName: student.name || "Student",
            resultStatus: "pass",
            remarks: "",
            subjects: buildStudentSubjects({}, subjectDefinitions),
          }));

      return NextResponse.json({
        exists: Boolean(resultDoc),
        resultName,
        course,
        year,
        subjects: subjectDefinitions,
        grandTotalMax: getGrandTotalMax(subjectDefinitions),
        students: studentRows,
        availableStudents: students.map((student) => ({
          studentId: String(student._id),
          studentName: student.name || "Student",
        })),
      });
    }

    const results = await StudentResult.find({})
      .select("resultName course year subjects publishedAt createdAt students")
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean();

    return NextResponse.json(
      results.map((result) => ({
        _id: String(result._id),
        resultName: result.resultName,
        course: result.course,
        year: result.year,
        subjects: result.subjects || [],
        grandTotalMax: getGrandTotalMax(result.subjects || []),
        publishedAt: result.publishedAt,
        studentCount: Array.isArray(result.students) ? result.students.length : 0,
      })),
    );
  } catch (error) {
    console.error("GET ADMIN RESULTS ERROR:", error);
    return NextResponse.json(
      { message: "Unable to load results" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    await connectDB();

    const body = await request.json().catch(() => ({}));
    const resultId = safeString(body?.resultId);
    const resultName = safeString(body?.resultName);
    const course = safeString(body?.course).toUpperCase();
    const year = Number(body?.year || 0);
    const saveMode = normalizeSaveMode(body?.saveMode);
    const subjects = normalizeSubjects(body?.subjects);
    const students = normalizeStudentRows(body?.students, subjects);

    if (!resultName) {
      return NextResponse.json(
        { message: "Result name is required." },
        { status: 400 },
      );
    }

    if (!course || !year) {
      return NextResponse.json(
        { message: "Course and year are required." },
        { status: 400 },
      );
    }

    if (!subjects.length) {
      return NextResponse.json(
        { message: "At least one subject definition is required." },
        { status: 400 },
      );
    }

    if (!students.length) {
      return NextResponse.json(
        { message: "No students found to save result rows." },
        { status: 400 },
      );
    }

    let saved;

    if (saveMode === "merge") {
      const existing = await StudentResult.findOne({ resultName, course, year }).lean();
      const mergedSubjects = mergeSubjectDefinitions(existing?.subjects || [], subjects);
      const mergedStudents = mergeStudentRows(
        existing?.students || [],
        students,
        mergedSubjects,
      );

      saved = await StudentResult.findOneAndUpdate(
        { resultName, course, year },
        {
          $set: {
            resultName,
            course,
            year,
            subjects: mergedSubjects,
            students: mergedStudents,
            createdBy: auth.decoded.id,
            publishedAt: new Date(),
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      ).lean();
    } else if (resultId) {
      saved = await StudentResult.findByIdAndUpdate(
        resultId,
        {
          $set: {
            resultName,
            course,
            year,
            subjects,
            students,
            createdBy: auth.decoded.id,
            publishedAt: new Date(),
          },
        },
        {
          new: true,
          runValidators: true,
        },
      ).lean();

      if (!saved) {
        return NextResponse.json(
          { message: "Saved result not found for editing." },
          { status: 404 },
        );
      }
    } else {
      saved = await StudentResult.findOneAndUpdate(
        { resultName, course, year },
        {
          $set: {
            resultName,
            course,
            year,
            subjects,
            students,
            createdBy: auth.decoded.id,
            publishedAt: new Date(),
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      ).lean();
    }

    return NextResponse.json({
      message:
        saveMode === "merge"
          ? "Result merged and published for students."
          : "Result saved and published for students.",
      result: {
        _id: String(saved._id),
        resultName: saved.resultName,
        course: saved.course,
        year: saved.year,
        subjects: saved.subjects,
        grandTotalMax: getGrandTotalMax(saved.subjects || []),
        publishedAt: saved.publishedAt,
      },
    });
  } catch (error) {
    console.error("SAVE ADMIN RESULTS ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Unable to save result" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = safeString(searchParams.get("id"));

    if (!id) {
      return NextResponse.json(
        { message: "Result id is required." },
        { status: 400 },
      );
    }

    const deleted = await StudentResult.findByIdAndDelete(id).lean();

    if (!deleted) {
      return NextResponse.json(
        { message: "Saved result not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Saved result deleted successfully." });
  } catch (error) {
    console.error("DELETE ADMIN RESULTS ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Unable to delete result" },
      { status: 500 },
    );
  }
}
