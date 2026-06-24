import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import { requireStudent } from "../../../lib/auth";
import StudentResult from "../../../models/StudentResult";
import User from "../../../models/User";

function getGrandTotalMax(subjects) {
  return (Array.isArray(subjects) ? subjects : []).reduce(
    (sum, subject) =>
      sum + Number(subject.theoryMax || 0) + Number(subject.practicalMax || 0),
    0,
  );
}

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

    const results = await StudentResult.find({
      course: String(student.course || "").toUpperCase(),
      year: Number(student.year || 0),
      "students.studentId": student._id,
    })
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean();

    const data = results
      .map((result) => {
        const myResult = (result.students || []).find(
          (entry) => String(entry.studentId) === String(student._id),
        );

        if (!myResult) return null;

        return {
          _id: String(result._id),
          resultName: result.resultName,
          course: result.course,
          year: result.year,
          publishedAt: result.publishedAt,
          remarks: myResult.remarks || "",
          totalMarks: Number(myResult.totalMarks || 0),
          maxMarks: Number(myResult.maxMarks || 0),
          grandTotalMax: getGrandTotalMax(result.subjects || []),
          percentage: Number(myResult.percentage || 0),
          resultStatus: myResult.resultStatus || "pending",
          subjects: (myResult.subjects || []).map((subject) => ({
            subjectCode: subject.subjectCode,
            subjectName: subject.subjectName,
            hasTheory: Boolean(subject.hasTheory ?? Number(subject.theoryMax || 0) > 0),
            hasPractical: Boolean(
              subject.hasPractical ?? Number(subject.practicalMax || 0) > 0,
            ),
            theoryStatus: subject.theoryStatus || "present",
            practicalStatus: subject.practicalStatus || "present",
            theoryResultStatus: subject.theoryResultStatus || "pending",
            practicalResultStatus: subject.practicalResultStatus || "pending",
            subjectStatus: subject.subjectStatus || "pending",
            theoryMarks: Number(subject.theoryMarks || 0),
            practicalMarks: Number(subject.practicalMarks || 0),
            theoryMax: Number(subject.theoryMax || 0),
            practicalMax: Number(subject.practicalMax || 0),
            totalMarks: Number(subject.totalMarks || 0),
          })),
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      student: {
        name: student.name,
        course: student.course,
        year: student.year,
      },
      results: data,
    });
  } catch (error) {
    console.error("GET STUDENT RESULTS ERROR:", error);
    return NextResponse.json(
      { message: "Unable to load student results" },
      { status: 500 },
    );
  }
}
