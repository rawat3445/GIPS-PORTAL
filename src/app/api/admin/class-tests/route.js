import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/auth";
import connectDB from "../../../lib/db";
import {
  normalizeClassTestNumber,
  normalizeClassTestStudentStatus,
  resolveClassTestStudentStatus,
  safeClassTestText,
} from "../../../lib/classTests";
import StudentClassTest from "../../../models/StudentClassTest";
import User from "../../../models/User";

function normalizeStudentRows(rows, { totalMarks, passingMarks }) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => {
      const studentId = String(row?.studentId || "");
      if (!studentId) return null;

      const marksObtained = Math.max(
        0,
        normalizeClassTestNumber(row?.marksObtained, 0),
      );
      const status = resolveClassTestStudentStatus({
        explicitStatus: row?.status,
        marksObtained,
        totalMarks,
        passingMarks,
      });

      return {
        studentId,
        studentName: safeClassTestText(row?.studentName),
        enrollmentNo: safeClassTestText(row?.enrollmentNo),
        marksObtained: Math.min(marksObtained, Math.max(0, totalMarks)),
        status: normalizeClassTestStudentStatus(status, "pending"),
        remarks: safeClassTestText(row?.remarks),
      };
    })
    .filter(Boolean);
}

function buildStudentRowsForBatch(students, testDoc, { totalMarks, passingMarks }) {
  const savedRows = new Map(
    (Array.isArray(testDoc?.students) ? testDoc.students : []).map((row) => [
      String(row.studentId),
      row,
    ]),
  );

  return (Array.isArray(students) ? students : []).map((student) => {
    const savedRow = savedRows.get(String(student._id));
    const marksObtained = Math.max(
      0,
      normalizeClassTestNumber(savedRow?.marksObtained, 0),
    );
    const status = resolveClassTestStudentStatus({
      explicitStatus: savedRow?.status,
      marksObtained,
      totalMarks,
      passingMarks,
    });

    return {
      studentId: String(student._id),
      studentName: student.name || "Student",
      enrollmentNo: student.enrollmentNo || "",
      marksObtained,
      status,
      remarks: safeClassTestText(savedRow?.remarks),
    };
  });
}

export async function GET(request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const course = safeClassTestText(searchParams.get("course")).toUpperCase();
    const year = Number(searchParams.get("year") || 0);
    const classTestName = safeClassTestText(searchParams.get("classTestName"));
    const subjectCode = safeClassTestText(searchParams.get("subjectCode")).toUpperCase();
    const subjectName = safeClassTestText(searchParams.get("subjectName"));

    if (course && year && classTestName) {
      const [testDoc, students] = await Promise.all([
        StudentClassTest.findOne({
          classTestName,
          course,
          year,
          subjectCode,
          subjectName,
        }).lean(),
        User.find({ role: "student", course, year })
          .select("name enrollmentNo")
          .sort({ name: 1 })
          .lean(),
      ]);

      const totalMarks = Math.max(
        0,
        normalizeClassTestNumber(testDoc?.totalMarks, 0),
      );
      const passingMarks = Math.max(
        0,
        normalizeClassTestNumber(testDoc?.passingMarks, totalMarks ? totalMarks * 0.4 : 0),
      );

      return NextResponse.json({
        exists: Boolean(testDoc),
        classTest: testDoc
          ? {
              _id: String(testDoc._id),
              classTestName: testDoc.classTestName,
              course: testDoc.course,
              year: testDoc.year,
              subjectCode: testDoc.subjectCode || "",
              subjectName: testDoc.subjectName || "",
              totalMarks,
              passingMarks,
              extraCriteria: testDoc.extraCriteria || "",
              testDate: testDoc.testDate
                ? new Date(testDoc.testDate).toISOString().slice(0, 10)
                : "",
            }
          : null,
        students: buildStudentRowsForBatch(students, testDoc, {
          totalMarks,
          passingMarks,
        }),
      });
    }

    const tests = await StudentClassTest.find({})
      .select(
        "classTestName course year subjectCode subjectName totalMarks passingMarks extraCriteria testDate publishedAt students",
      )
      .sort({ testDate: -1, publishedAt: -1, createdAt: -1 })
      .lean();

    return NextResponse.json(
      tests.map((test) => ({
        _id: String(test._id),
        classTestName: test.classTestName,
        course: test.course,
        year: test.year,
        subjectCode: test.subjectCode || "",
        subjectName: test.subjectName || "",
        totalMarks: Number(test.totalMarks || 0),
        passingMarks: Number(test.passingMarks || 0),
        extraCriteria: test.extraCriteria || "",
        testDate: test.testDate || null,
        publishedAt: test.publishedAt || test.createdAt || null,
        studentCount: Array.isArray(test.students) ? test.students.length : 0,
      })),
    );
  } catch (error) {
    console.error("GET ADMIN CLASS TESTS ERROR:", error);
    return NextResponse.json(
      { message: "Unable to load class tests" },
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
    const testId = safeClassTestText(body?.testId);
    const classTestName = safeClassTestText(body?.classTestName);
    const course = safeClassTestText(body?.course).toUpperCase();
    const year = Number(body?.year || 0);
    const subjectCode = safeClassTestText(body?.subjectCode).toUpperCase();
    const subjectName = safeClassTestText(body?.subjectName);
    const totalMarks = Math.max(
      0,
      normalizeClassTestNumber(body?.totalMarks, 0),
    );
    const passingMarks = Math.max(
      0,
      normalizeClassTestNumber(body?.passingMarks, totalMarks ? totalMarks * 0.4 : 0),
    );
    const extraCriteria = safeClassTestText(body?.extraCriteria);
    const rawTestDate = safeClassTestText(body?.testDate);

    if (!classTestName) {
      return NextResponse.json(
        { message: "Class test name is required." },
        { status: 400 },
      );
    }

    if (!course || !year) {
      return NextResponse.json(
        { message: "Course and year are required." },
        { status: 400 },
      );
    }

    if (!subjectCode && !subjectName) {
      return NextResponse.json(
        { message: "Fill at least subject code or subject name." },
        { status: 400 },
      );
    }

    if (totalMarks <= 0) {
      return NextResponse.json(
        { message: "Total marks must be greater than zero." },
        { status: 400 },
      );
    }

    if (passingMarks > totalMarks) {
      return NextResponse.json(
        { message: "Passing marks cannot be greater than total marks." },
        { status: 400 },
      );
    }

    const students = normalizeStudentRows(body?.students, {
      totalMarks,
      passingMarks,
    });

    if (!students.length) {
      return NextResponse.json(
        { message: "No student rows found to publish this class test." },
        { status: 400 },
      );
    }

    const payload = {
      classTestName,
      course,
      year,
      subjectCode,
      subjectName,
      totalMarks,
      passingMarks,
      extraCriteria,
      testDate: rawTestDate ? new Date(`${rawTestDate}T00:00:00`) : null,
      students,
      createdBy: auth.decoded.id,
      publishedAt: new Date(),
    };

    const saved = testId
      ? await StudentClassTest.findByIdAndUpdate(
          testId,
          { $set: payload },
          { new: true, runValidators: true },
        ).lean()
      : await StudentClassTest.findOneAndUpdate(
          {
            classTestName,
            course,
            year,
            subjectCode,
            subjectName,
          },
          { $set: payload },
          {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
            runValidators: true,
          },
        ).lean();

    if (!saved) {
      return NextResponse.json(
        { message: "Unable to save class test." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Class test saved and published for students.",
      classTest: {
        _id: String(saved._id),
        classTestName: saved.classTestName,
        course: saved.course,
        year: saved.year,
        subjectCode: saved.subjectCode || "",
        subjectName: saved.subjectName || "",
        totalMarks: Number(saved.totalMarks || 0),
        passingMarks: Number(saved.passingMarks || 0),
        extraCriteria: saved.extraCriteria || "",
        testDate: saved.testDate || null,
        publishedAt: saved.publishedAt || saved.createdAt || null,
      },
    });
  } catch (error) {
    console.error("SAVE ADMIN CLASS TESTS ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Unable to save class test" },
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
    const id = safeClassTestText(searchParams.get("id"));

    if (!id) {
      return NextResponse.json(
        { message: "Class test id is required." },
        { status: 400 },
      );
    }

    const deleted = await StudentClassTest.findByIdAndDelete(id).lean();

    if (!deleted) {
      return NextResponse.json(
        { message: "Saved class test not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Saved class test deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE ADMIN CLASS TESTS ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Unable to delete class test" },
      { status: 500 },
    );
  }
}
