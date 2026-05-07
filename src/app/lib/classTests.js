export const CLASS_TEST_CATEGORY_MAX_POINTS = 25;
export const CLASS_TEST_AVERAGE_MAX_POINTS = 15;
export const CLASS_TEST_CONSISTENCY_MAX_POINTS = 5;
export const CLASS_TEST_IMPROVEMENT_MAX_POINTS = 5;

export function safeClassTestText(value) {
  return String(value || "").trim();
}

export function normalizeClassTestNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

export function normalizeClassTestStudentStatus(value, fallback = "pending") {
  const status = safeClassTestText(value).toLowerCase();
  if (["pass", "fail", "absent", "pending"].includes(status)) {
    return status;
  }
  return fallback;
}

export function resolveClassTestStudentStatus({
  explicitStatus,
  marksObtained,
  totalMarks,
  passingMarks,
}) {
  const normalizedExplicit = safeClassTestText(explicitStatus).toLowerCase();
  if (normalizedExplicit) {
    return normalizeClassTestStudentStatus(normalizedExplicit, "pending");
  }

  const marks = Math.max(0, normalizeClassTestNumber(marksObtained, 0));
  const maxMarks = Math.max(0, normalizeClassTestNumber(totalMarks, 0));
  const passLine = Math.max(0, normalizeClassTestNumber(passingMarks, 0));

  if (!maxMarks) {
    return "pending";
  }

  return marks >= passLine ? "pass" : "fail";
}

export function getClassTestPercentage(marksObtained, totalMarks) {
  const marks = Math.max(0, normalizeClassTestNumber(marksObtained, 0));
  const maxMarks = Math.max(0, normalizeClassTestNumber(totalMarks, 0));

  if (!maxMarks) {
    return 0;
  }

  return Number(((marks / maxMarks) * 100).toFixed(2));
}

export function getClassTestSubjectLabel(test = {}) {
  return (
    safeClassTestText(test.subjectCode) ||
    safeClassTestText(test.subjectName) ||
    "Subject not set"
  );
}

export function getClassTestImprovementTrendPoints(percentages = []) {
  const validPercentages = (Array.isArray(percentages) ? percentages : [])
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (!validPercentages.length) {
    return 0;
  }

  if (validPercentages.length < 3) {
    return 0;
  }

  const first = validPercentages[0];
  const latest = validPercentages[validPercentages.length - 1];
  const delta = latest - first;

  if (delta >= 20 && latest >= 70) return 5;
  if (delta >= 15 && latest >= 65) return 4;
  if (delta >= 10 && latest >= 60) return 3;
  if (delta >= 5 && latest >= 50) return 2;
  if (delta > 0 && latest >= 45) return 1;
  return 0;
}

export function getClassTestImprovementLabel(percentages = []) {
  const validPercentages = (Array.isArray(percentages) ? percentages : [])
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (!validPercentages.length) {
    return "No evaluated tests yet";
  }

  if (validPercentages.length < 3) {
    return "At least three evaluated tests are needed before improvement points start counting";
  }

  const first = validPercentages[0];
  const latest = validPercentages[validPercentages.length - 1];
  const delta = Number((latest - first).toFixed(1));

  if (delta > 0) {
    return `Improved by ${delta}% from the first counted test`;
  }

  if (delta < 0) {
    return `Down by ${Math.abs(delta)}% from the first counted test`;
  }

  return "Performance trend is currently steady";
}

function getClassTestAveragePerformancePoints(averagePercentage) {
  const value = Number(averagePercentage || 0);

  if (value >= 90) return 15;
  if (value >= 85) return 13;
  if (value >= 80) return 11;
  if (value >= 75) return 9;
  if (value >= 70) return 7;
  if (value >= 60) return 5;
  if (value >= 50) return 3;
  if (value >= 40) return 1;
  return 0;
}

function getClassTestConsistencyPoints({
  totalTests,
  evaluatedTests,
  passedTests,
  absentTests,
}) {
  const published = Math.max(0, Number(totalTests || 0));
  const evaluated = Math.max(0, Number(evaluatedTests || 0));
  const passed = Math.max(0, Number(passedTests || 0));
  const absences = Math.max(0, Number(absentTests || 0));

  if (!published || !evaluated) {
    return 0;
  }

  const completionRate = evaluated / published;
  const passRate = passed / evaluated;

  if (published >= 5 && completionRate >= 0.9 && passRate >= 0.8 && absences === 0) {
    return 5;
  }

  if (published >= 4 && completionRate >= 0.85 && passRate >= 0.75 && absences <= 1) {
    return 4;
  }

  if (published >= 3 && completionRate >= 0.75 && passRate >= 0.67) {
    return 3;
  }

  if (published >= 2 && completionRate >= 0.65 && passRate >= 0.5) {
    return 2;
  }

  if (published >= 1 && completionRate >= 0.5 && passRate > 0) {
    return 1;
  }

  return 0;
}

export function buildClassTestsCategory(records = [], studentId = null) {
  const recentTests = (Array.isArray(records) ? records : [])
    .map((record) => {
      const studentEntry = Array.isArray(record?.students)
        ? record.students.find(
            (entry) =>
              !studentId || String(entry?.studentId) === String(studentId),
          )
        : null;

      if (!studentEntry) {
        return null;
      }

      const totalMarks = Math.max(
        0,
        normalizeClassTestNumber(record?.totalMarks, studentEntry?.totalMarks || 0),
      );
      const passingMarks = Math.max(
        0,
        normalizeClassTestNumber(
          record?.passingMarks,
          totalMarks ? Number((totalMarks * 0.4).toFixed(2)) : 0,
        ),
      );
      const marksObtained = Math.max(
        0,
        normalizeClassTestNumber(studentEntry?.marksObtained, 0),
      );
      const status = resolveClassTestStudentStatus({
        explicitStatus: studentEntry?.status,
        marksObtained,
        totalMarks,
        passingMarks,
      });
      const percentage = getClassTestPercentage(marksObtained, totalMarks);

      return {
        _id: String(record?._id || ""),
        classTestName: safeClassTestText(record?.classTestName) || "Class Test",
        subjectCode: safeClassTestText(record?.subjectCode).toUpperCase(),
        subjectName: safeClassTestText(record?.subjectName),
        subjectLabel: getClassTestSubjectLabel(record),
        totalMarks,
        passingMarks,
        marksObtained,
        status,
        percentage,
        remarks: safeClassTestText(studentEntry?.remarks),
        extraCriteria: safeClassTestText(record?.extraCriteria),
        testDate: record?.testDate || null,
        publishedAt: record?.publishedAt || record?.createdAt || null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const aTime = new Date(a.testDate || a.publishedAt || 0).getTime();
      const bTime = new Date(b.testDate || b.publishedAt || 0).getTime();
      return bTime - aTime;
    });

  const evaluatedTests = recentTests.filter((test) =>
    ["pass", "fail"].includes(test.status),
  );
  const passedTests = recentTests.filter((test) => test.status === "pass");
  const failedTests = recentTests.filter((test) => test.status === "fail");
  const absentTests = recentTests.filter((test) => test.status === "absent");
  const pendingTests = recentTests.filter((test) => test.status === "pending");
  const averagePercentage = evaluatedTests.length
    ? Number(
        (
          evaluatedTests.reduce((sum, test) => sum + Number(test.percentage || 0), 0) /
          evaluatedTests.length
        ).toFixed(2),
      )
    : 0;
  const averagePerformancePoints = getClassTestAveragePerformancePoints(
    averagePercentage,
  );
  const consistencyPoints = getClassTestConsistencyPoints({
    totalTests: recentTests.length,
    evaluatedTests: evaluatedTests.length,
    passedTests: passedTests.length,
    absentTests: absentTests.length,
  });
  const evaluatedPercentages = [...evaluatedTests]
    .sort((a, b) => {
      const aTime = new Date(a.testDate || a.publishedAt || 0).getTime();
      const bTime = new Date(b.testDate || b.publishedAt || 0).getTime();
      return aTime - bTime;
    })
    .map((test) => test.percentage);
  const improvementTrendPoints = getClassTestImprovementTrendPoints(
    evaluatedPercentages,
  );
  const latestTest = recentTests[0] || null;
  const totalPoints = Math.min(
    CLASS_TEST_CATEGORY_MAX_POINTS,
    averagePerformancePoints + consistencyPoints + improvementTrendPoints,
  );

  return {
    hasPublishedTests: recentTests.length > 0,
    totalPoints,
    earnedPoints: totalPoints,
    maxPoints: CLASS_TEST_CATEGORY_MAX_POINTS,
    averagePerformancePoints,
    averagePerformanceMax: CLASS_TEST_AVERAGE_MAX_POINTS,
    consistencyPoints,
    consistencyMax: CLASS_TEST_CONSISTENCY_MAX_POINTS,
    improvementTrendPoints,
    improvementTrendMax: CLASS_TEST_IMPROVEMENT_MAX_POINTS,
    totalTests: recentTests.length,
    evaluatedTests: evaluatedTests.length,
    passedTests: passedTests.length,
    failedTests: failedTests.length,
    absentTests: absentTests.length,
    pendingTests: pendingTests.length,
    averagePercentage,
    improvementLabel: getClassTestImprovementLabel(evaluatedPercentages),
    latestTestName: latestTest?.classTestName || "",
    latestSubjectLabel: latestTest?.subjectLabel || "",
    latestPercentage: Number(latestTest?.percentage || 0),
    latestStatus: latestTest?.status || "pending",
    latestPublishedAt: latestTest?.publishedAt || null,
    latestTestDate: latestTest?.testDate || null,
    latestRemarks: latestTest?.remarks || "",
    latestExtraCriteria: latestTest?.extraCriteria || "",
    recentTests: recentTests.slice(0, 6),
  };
}
