import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import { requireAdmin } from "../../../lib/auth";
import ResultPointAssignment from "../../../models/ResultPointAssignment";
import StudentResult from "../../../models/StudentResult";
import User from "../../../models/User";

function safeString(value) {
  return String(value || "").trim();
}

function getBatchKey(course, year) {
  return `${safeString(course).toUpperCase()}|${Number(year) || 0}`;
}

function sortByCourseYear(a, b) {
  return (
    String(a.course || "").localeCompare(String(b.course || "")) ||
    Number(a.year || 0) - Number(b.year || 0)
  );
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    await connectDB();

    const [students, results, assignments] = await Promise.all([
      User.find({ role: "student" }).select("course year").lean(),
      StudentResult.find({})
        .select("resultName course year publishedAt createdAt students")
        .sort({ publishedAt: -1, createdAt: -1, resultName: 1 })
        .lean(),
      ResultPointAssignment.find({})
        .select("course year resultId resultName updatedAt")
        .lean(),
    ]);

    const batchMap = new Map();

    for (const student of students) {
      const course = safeString(student?.course).toUpperCase();
      const year = Number(student?.year || 0);
      if (!course || !year) continue;

      const key = getBatchKey(course, year);
      const current = batchMap.get(key) || {
        course,
        year,
        studentCount: 0,
        availableResults: [],
      };

      current.studentCount += 1;
      batchMap.set(key, current);
    }

    for (const result of results) {
      const course = safeString(result?.course).toUpperCase();
      const year = Number(result?.year || 0);
      if (!course || !year) continue;

      const key = getBatchKey(course, year);
      const current = batchMap.get(key) || {
        course,
        year,
        studentCount: 0,
        availableResults: [],
      };

      current.availableResults.push({
        _id: String(result._id),
        resultName: safeString(result?.resultName),
        publishedAt: result?.publishedAt || result?.createdAt || null,
        studentCount: Array.isArray(result?.students) ? result.students.length : 0,
      });
      batchMap.set(key, current);
    }

    const assignmentMap = new Map(
      assignments.map((item) => [getBatchKey(item.course, item.year), item]),
    );

    const batches = Array.from(batchMap.values())
      .map((batch) => {
        const assignment = assignmentMap.get(getBatchKey(batch.course, batch.year));
        const availableResults = Array.isArray(batch.availableResults)
          ? batch.availableResults
          : [];
        const hasAssignedResult = availableResults.some(
          (result) => String(result._id) === String(assignment?.resultId || ""),
        );

        return {
          ...batch,
          assignedResultId: hasAssignedResult ? String(assignment.resultId) : "",
          assignedResultName: hasAssignedResult ? safeString(assignment?.resultName) : "",
          assignedAt: hasAssignedResult ? assignment?.updatedAt || null : null,
          availableResults: availableResults.sort(
            (a, b) =>
              new Date(b.publishedAt || 0).getTime() -
                new Date(a.publishedAt || 0).getTime() ||
              String(a.resultName || "").localeCompare(String(b.resultName || "")),
          ),
        };
      })
      .sort(sortByCourseYear);

    const unassignedBatches = batches
      .filter((batch) => !batch.assignedResultId)
      .map((batch) => ({
        course: batch.course,
        year: batch.year,
        studentCount: batch.studentCount,
        availableResults: batch.availableResults.length,
      }));

    return NextResponse.json({
      totalBatches: batches.length,
      assignedBatchCount: batches.filter((batch) => Boolean(batch.assignedResultId))
        .length,
      unassignedBatchCount: unassignedBatches.length,
      batches,
      unassignedBatches,
    });
  } catch (error) {
    console.error("GET ADMIN RESULT POINTS ERROR:", error);
    return NextResponse.json(
      { message: "Unable to load result point assignments" },
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
    const course = safeString(body?.course).toUpperCase();
    const year = Number(body?.year || 0);
    const resultId = safeString(body?.resultId);

    if (!course || !year) {
      return NextResponse.json(
        { message: "Course and year are required." },
        { status: 400 },
      );
    }

    if (!resultId) {
      await ResultPointAssignment.findOneAndDelete({ course, year });

      return NextResponse.json({
        message: `Result points assignment cleared for ${course} Year ${year}.`,
      });
    }

    const resultDoc = await StudentResult.findById(resultId)
      .select("resultName course year")
      .lean();

    if (!resultDoc) {
      return NextResponse.json(
        { message: "Selected result was not found." },
        { status: 404 },
      );
    }

    if (
      safeString(resultDoc.course).toUpperCase() !== course ||
      Number(resultDoc.year || 0) !== year
    ) {
      return NextResponse.json(
        { message: "Selected result does not belong to this batch." },
        { status: 400 },
      );
    }

    await ResultPointAssignment.findOneAndUpdate(
      { course, year },
      {
        $set: {
          course,
          year,
          resultId: resultDoc._id,
          resultName: safeString(resultDoc.resultName),
          assignedBy: auth.decoded.id,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    return NextResponse.json({
      message: `${safeString(resultDoc.resultName)} will now be counted for ${course} Year ${year} student points.`,
    });
  } catch (error) {
    console.error("SAVE ADMIN RESULT POINTS ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Unable to save result point assignment" },
      { status: 500 },
    );
  }
}
