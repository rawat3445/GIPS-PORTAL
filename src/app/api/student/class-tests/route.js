import { NextResponse } from "next/server";
import { requireStudent } from "../../../lib/auth";
import {
  buildClassTestsCategory,
  getClassTestSubjectLabel,
} from "../../../lib/classTests";
import connectDB from "../../../lib/db";
import StudentClassTest from "../../../models/StudentClassTest";
import User from "../../../models/User";

export async function GET() {
  const auth = await requireStudent();
  if (!auth.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    await connectDB();

    const student = await User.findById(auth.decoded.id).select(
      "name course year role",
    );

    if (!student || String(student.role || "").toLowerCase() !== "student") {
      return NextResponse.json({ message: "Student not found" }, { status: 404 });
    }

    const tests = await StudentClassTest.find({
      course: String(student.course || "").toUpperCase(),
      year: Number(student.year || 0),
      "students.studentId": student._id,
    })
      .sort({ testDate: -1, publishedAt: -1, createdAt: -1 })
      .lean();

    const summary = buildClassTestsCategory(tests, student._id);

    const studentTests = tests
      .map((test) => {
        const row = Array.isArray(test.students)
          ? test.students.find(
              (entry) => String(entry.studentId) === String(student._id),
            )
          : null;

        if (!row) return null;

        return {
          _id: String(test._id),
          classTestName: test.classTestName,
          subjectCode: test.subjectCode || "",
          subjectName: test.subjectName || "",
          subjectLabel: getClassTestSubjectLabel(test),
          totalMarks: Number(test.totalMarks || 0),
          passingMarks: Number(test.passingMarks || 0),
          marksObtained: Number(row.marksObtained || 0),
          status: row.status || "pending",
          remarks: row.remarks || "",
          extraCriteria: test.extraCriteria || "",
          testDate: test.testDate || null,
          publishedAt: test.publishedAt || test.createdAt || null,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      student: {
        name: student.name,
        course: student.course,
        year: student.year,
      },
      summary,
      tests: studentTests,
    });
  } catch (error) {
    console.error("GET STUDENT CLASS TESTS ERROR:", error);
    return NextResponse.json(
      { message: "Unable to load student class tests" },
      { status: 500 },
    );
  }
}
