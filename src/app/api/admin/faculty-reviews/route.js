import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import { requireAdmin } from "../../../lib/auth";
import FacultyReview from "../../../models/FacultyReview";

function roundToOne(value) {
  return Number(Number(value || 0).toFixed(1));
}

function mapReview(doc) {
  return {
    _id: String(doc._id),
    studentId: String(doc.studentId || ""),
    studentName: doc.studentName || "Student",
    studentEmail: doc.studentEmail || "",
    course: doc.course || "",
    year: Number(doc.year || 0) || null,
    facultyId: String(doc.facultyId || ""),
    facultyName: doc.facultyName || "Faculty",
    facultyEmail: doc.facultyEmail || "",
    facultyAssignedCourse: doc.facultyAssignedCourse || "",
    overallRating:
      doc.overallRating === null || doc.overallRating === undefined
        ? null
        : Number(doc.overallRating || 0),
    comment: doc.comment || "",
    responses: Array.isArray(doc.responses) ? doc.responses : [],
    createdAt: doc.createdAt || null,
  };
}

export async function GET(request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = Math.max(
      1,
      Math.min(200, Number(searchParams.get("limit")) || 60),
    );

    const [reviewDocs, summaryDocs, totals] = await Promise.all([
      FacultyReview.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      FacultyReview.aggregate([
        {
          $group: {
            _id: {
              facultyId: "$facultyId",
              facultyName: "$facultyName",
              facultyAssignedCourse: "$facultyAssignedCourse",
            },
            reviewCount: { $sum: 1 },
            ratedReviewCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$overallRating", null] },
                      { $gte: ["$overallRating", 1] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            averageRating: { $avg: "$overallRating" },
            latestReviewAt: { $max: "$createdAt" },
          },
        },
        { $sort: { averageRating: -1, reviewCount: -1, latestReviewAt: -1 } },
      ]),
      FacultyReview.aggregate([
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            ratedReviews: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$overallRating", null] },
                      { $gte: ["$overallRating", 1] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            averageOverallRating: { $avg: "$overallRating" },
          },
        },
      ]),
    ]);

    const totalSummary = totals[0] || {
      totalReviews: 0,
      averageOverallRating: 0,
    };

    return NextResponse.json({
      totalReviews: Number(totalSummary.totalReviews || 0),
      ratedReviews: Number(totalSummary.ratedReviews || 0),
      averageOverallRating: roundToOne(totalSummary.averageOverallRating || 0),
      reviews: reviewDocs.map(mapReview),
      facultySummary: summaryDocs.map((item) => ({
        facultyId: String(item?._id?.facultyId || ""),
        facultyName: item?._id?.facultyName || "Faculty",
        facultyAssignedCourse: item?._id?.facultyAssignedCourse || "",
        reviewCount: Number(item?.reviewCount || 0),
        ratedReviewCount: Number(item?.ratedReviewCount || 0),
        averageRating: roundToOne(item?.averageRating || 0),
        latestReviewAt: item?.latestReviewAt || null,
      })),
    });
  } catch (error) {
    console.error("ADMIN FACULTY REVIEWS ERROR:", error);
    return NextResponse.json(
      { message: "Unable to load faculty reviews right now." },
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
    const id = String(searchParams.get("id") || "").trim();

    if (!id) {
      return NextResponse.json(
        { message: "Review id is required." },
        { status: 400 },
      );
    }

    const deletedReview = await FacultyReview.findByIdAndDelete(id).lean();

    if (!deletedReview) {
      return NextResponse.json(
        { message: "Review not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Review deleted successfully.",
    });
  } catch (error) {
    console.error("ADMIN FACULTY REVIEW DELETE ERROR:", error);
    return NextResponse.json(
      { message: "Unable to delete the review right now." },
      { status: 500 },
    );
  }
}
