import Attendance from "../models/Attendance";
import {
  addDays,
  ATTENDANCE_START_DATE,
  getHolidayMapForContext,
  isSunday,
  isWinterVacation,
  toISODate,
} from "./attendanceEvents";

export async function buildStudentAttendancePerformance(
  student,
  { endDate } = {}
) {
  const todayISO = endDate || toISODate(new Date());
  const course = String(student?.course || "").toUpperCase();
  const year = Number(student?.year);
  const studentId = student?._id;

  if (!course || !year || !studentId) {
    return {
      attendancePercentage: 0,
      workingDays: 0,
      markedDays: 0,
      presentDays: 0,
      absentDays: 0,
    };
  }

  const holidayMap = await getHolidayMapForContext({
    fromDate: ATTENDANCE_START_DATE,
    toDate: todayISO,
    course,
    year,
    studentId,
  });

  const docs = await Attendance.find({
    course,
    year,
    date: { $gte: ATTENDANCE_START_DATE, $lte: todayISO },
    "records.studentId": studentId,
  })
    .select({ date: 1, records: 1 })
    .lean();

  const recordMap = new Map();

  docs.forEach((doc) => {
    const record = doc.records.find(
      (item) => String(item.studentId) === String(studentId)
    );

    if (record) {
      recordMap.set(doc.date, record.status);
    }
  });

  let cursor = ATTENDANCE_START_DATE;
  let workingDays = 0;
  let markedDays = 0;
  let presentDays = 0;
  let absentDays = 0;

  while (cursor <= todayISO) {
    if (
      !isWinterVacation(cursor) &&
      !isSunday(cursor) &&
      !holidayMap.has(cursor)
    ) {
      workingDays += 1;

      const status = recordMap.get(cursor);

      if (status === "present") {
        markedDays += 1;
        presentDays += 1;
      } else if (status === "absent") {
        markedDays += 1;
        absentDays += 1;
      }
    }

    cursor = addDays(cursor, 1);
  }

  return {
    attendancePercentage:
      workingDays === 0
        ? 0
        : Number(((presentDays / workingDays) * 100).toFixed(1)),
    workingDays,
    markedDays,
    presentDays,
    absentDays,
  };
}

export async function buildStudentAttendancePerformanceList(
  students,
  { endDate } = {}
) {
  const todayISO = endDate || toISODate(new Date());

  return Promise.all(
    (Array.isArray(students) ? students : []).map(async (student) => ({
      ...student,
      ...(await buildStudentAttendancePerformance(student, {
        endDate: todayISO,
      })),
    }))
  );
}
