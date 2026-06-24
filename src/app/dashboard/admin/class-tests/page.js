"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  Pencil,
  Plus,
  Save,
  Search,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";

const COURSE_OPTIONS = ["BPT", "BOPTOM", "BMRIT", "DOPTOM", "BOTT"];

function Input(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 ${props.className || ""}`}
    />
  );
}

function Select(props) {
  return (
    <select
      {...props}
      className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 ${props.className || ""}`}
    />
  );
}

function Textarea(props) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 ${props.className || ""}`}
    />
  );
}

function getStatusShell(status) {
  if (status === "pass") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "fail") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (status === "absent") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default function AdminClassTestsPage() {
  const [testId, setTestId] = useState("");
  const [classTestName, setClassTestName] = useState("");
  const [course, setCourse] = useState("BPT");
  const [year, setYear] = useState("1");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [totalMarks, setTotalMarks] = useState("25");
  const [passingMarks, setPassingMarks] = useState("10");
  const [extraCriteria, setExtraCriteria] = useState("");
  const [testDate, setTestDate] = useState("");
  const [students, setStudents] = useState([]);
  const [savedTests, setSavedTests] = useState([]);
  const [loadingBatch, setLoadingBatch] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("success");

  useEffect(() => {
    refreshSavedTests();
  }, []);

  function setTopMessage(text, tone = "success") {
    setMessage(text);
    setMessageTone(tone);
  }

  async function refreshSavedTests() {
    try {
      const res = await fetch("/api/admin/class-tests", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json().catch(() => []);
      if (!res.ok) return;
      setSavedTests(Array.isArray(data) ? data : []);
    } catch {}
  }

  async function loadBatchStudents(payloadOverride = null) {
    const payload = payloadOverride || {
      classTestName,
      course,
      year,
      subjectCode,
      subjectName,
    };

    if (!String(payload.classTestName || "").trim()) {
      setTopMessage("Please write a class test name first.", "error");
      return;
    }

    if (!String(payload.subjectCode || "").trim() && !String(payload.subjectName || "").trim()) {
      setTopMessage("Fill either subject code or subject name first.", "error");
      return;
    }

    try {
      setLoadingBatch(true);
      setTopMessage("");

      const params = new URLSearchParams({
        classTestName: String(payload.classTestName || "").trim(),
        course: String(payload.course || "").trim(),
        year: String(payload.year || "").trim(),
        subjectCode: String(payload.subjectCode || "").trim(),
        subjectName: String(payload.subjectName || "").trim(),
      });
      const res = await fetch(`/api/admin/class-tests?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Unable to load batch students");
      }

      setTestId(String(data?.classTest?._id || ""));
      if (data?.classTest) {
        setTotalMarks(String(data.classTest.totalMarks || ""));
        setPassingMarks(String(data.classTest.passingMarks || ""));
        setExtraCriteria(String(data.classTest.extraCriteria || ""));
        setTestDate(String(data.classTest.testDate || ""));
      }
      setStudents(Array.isArray(data?.students) ? data.students : []);
      setTopMessage(
        data?.exists
          ? "Saved class test loaded. You can edit and publish it again."
          : "Batch students loaded. Enter marks and publish the class test.",
      );
    } catch (error) {
      setTopMessage(error.message || "Unable to load batch students", "error");
    } finally {
      setLoadingBatch(false);
    }
  }

  async function openSavedTest(test) {
    setClassTestName(String(test.classTestName || ""));
    setCourse(String(test.course || "BPT"));
    setYear(String(test.year || "1"));
    setSubjectCode(String(test.subjectCode || ""));
    setSubjectName(String(test.subjectName || ""));
    setTotalMarks(String(test.totalMarks || ""));
    setPassingMarks(String(test.passingMarks || ""));
    setExtraCriteria(String(test.extraCriteria || ""));
    setTestDate(
      test.testDate ? new Date(test.testDate).toISOString().slice(0, 10) : "",
    );
    await loadBatchStudents({
      classTestName: test.classTestName,
      course: test.course,
      year: test.year,
      subjectCode: test.subjectCode || "",
      subjectName: test.subjectName || "",
    });
  }

  async function deleteSavedTest(id) {
    try {
      setDeletingId(id);
      setTopMessage("");

      const res = await fetch(
        `/api/admin/class-tests?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Unable to delete class test");
      }

      if (String(testId) === String(id)) {
        setTestId("");
        setStudents([]);
      }

      await refreshSavedTests();
      setTopMessage(data?.message || "Class test deleted successfully.");
    } catch (error) {
      setTopMessage(error.message || "Unable to delete class test", "error");
    } finally {
      setDeletingId("");
    }
  }

  function updateStudent(index, field, value) {
    setStudents((current) =>
      current.map((student, studentIndex) =>
        studentIndex === index ? { ...student, [field]: value } : student,
      ),
    );
  }

  async function saveClassTest() {
    try {
      setSaving(true);
      setTopMessage("");

      const res = await fetch("/api/admin/class-tests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          testId,
          classTestName,
          course,
          year,
          subjectCode,
          subjectName,
          totalMarks,
          passingMarks,
          extraCriteria,
          testDate,
          students,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Unable to save class test");
      }

      setTestId(String(data?.classTest?._id || ""));
      await refreshSavedTests();
      setTopMessage(data?.message || "Class test saved successfully.");
    } catch (error) {
      setTopMessage(error.message || "Unable to save class test", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fef3c7_0%,#fff7ed_28%,#f8fafc_62%,#f8fafc_100%)] px-4 py-6 md:px-6">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <section className="rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,247,237,0.95),rgba(254,243,199,0.84))] p-5 shadow-[0_28px_70px_-40px_rgba(15,23,42,0.35)] md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700 shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Class Tests
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                Publish course-wise class tests for students
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">
                Create one class test for a selected course and year, set total
                marks and pass marks, optionally fill subject code or subject
                name, then publish marks so the same batch can see the test on
                the student dashboard.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:w-[520px]">
              <div className="rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Saved Tests
                </p>
                <p className="mt-3 text-3xl font-bold text-amber-700">
                  {savedTests.length}
                </p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Loaded Students
                </p>
                <p className="mt-3 text-3xl font-bold text-blue-700">
                  {students.length}
                </p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Subject Rule
                </p>
                <p className="mt-3 text-sm font-semibold text-slate-950">
                  Code or name is enough
                </p>
              </div>
            </div>
          </div>
        </section>

        {message ? (
          <div
            className={`rounded-[24px] px-4 py-4 text-sm font-medium shadow-sm ${
              messageTone === "error"
                ? "border border-red-200 bg-red-50 text-red-700"
                : "border border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {message}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.98fr)_minmax(360px,0.72fr)]">
          <section className="rounded-[30px] border border-white/80 bg-white/94 p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.35)] md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
                  Class Test Form
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  Build and publish one class test
                </h2>
              </div>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <BookOpen className="h-5 w-5" />
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Class Test Name
                </p>
                <Input
                  value={classTestName}
                  onChange={(e) => setClassTestName(e.target.value)}
                  placeholder="Example: Unit Test 1, Class Test 2, Mid Module Test"
                  className="mt-2"
                />
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Course
                </p>
                <Select
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="mt-2"
                >
                  {COURSE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Year
                </p>
                <Select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="mt-2"
                >
                  {["1", "2", "3", "4"].map((option) => (
                    <option key={option} value={option}>
                      Year {option}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Subject Code
                </p>
                <Input
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
                  placeholder="Optional if subject name is filled"
                  className="mt-2"
                />
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Subject Name
                </p>
                <Input
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="Optional if subject code is filled"
                  className="mt-2"
                />
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Total Marks
                </p>
                <Input
                  type="number"
                  min="1"
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Passing Marks
                </p>
                <Input
                  type="number"
                  min="0"
                  value={passingMarks}
                  onChange={(e) => setPassingMarks(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div className="md:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Test Date
                </p>
                <Input
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div className="md:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Extra Criteria
                </p>
                <Textarea
                  rows={3}
                  value={extraCriteria}
                  onChange={(e) => setExtraCriteria(e.target.value)}
                  className="mt-2"
                  placeholder="Optional notes like passing rule, viva included, internal policy, grace rule, or anything students should know."
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => loadBatchStudents()}
                disabled={loadingBatch}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-70"
              >
                <Search className="h-4 w-4" />
                {loadingBatch ? "Loading..." : "Load Students"}
              </button>
              <button
                type="button"
                onClick={saveClassTest}
                disabled={saving || !students.length}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-70"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Publish Class Test"}
              </button>
            </div>

            <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-amber-700" />
                <p className="text-sm font-semibold text-slate-900">
                  Student marks entry
                </p>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Once students are loaded, enter the number for each student,
                choose pass, fail, absent, or pending, and add an optional
                remark when needed.
              </p>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,251,235,0.92),rgba(255,255,255,0.96))] p-5 shadow-[0_24px_60px_-42px_rgba(217,119,6,0.22)] md:p-6">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <CalendarDays className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
                    Saved Tests
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-slate-950">
                    Open or delete published class tests
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {savedTests.length ? (
                  savedTests.map((test) => (
                    <div
                      key={test._id}
                      className="rounded-[22px] border border-white/80 bg-white/88 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">
                            {test.classTestName}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {test.course} • Year {test.year} •{" "}
                            {test.subjectCode || test.subjectName || "Subject"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Total {test.totalMarks} • Pass {test.passingMarks} •{" "}
                            {test.studentCount} students
                          </p>
                        </div>
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                          Saved
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openSavedTest(test)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Open
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSavedTest(test._id)}
                          disabled={deletingId === test._id}
                          className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-600 hover:bg-red-50 disabled:opacity-70"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {deletingId === test._id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    No class tests have been published yet.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(239,246,255,0.92),rgba(255,255,255,0.96))] p-5 shadow-[0_24px_60px_-42px_rgba(37,99,235,0.18)] md:p-6">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                  <Plus className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                    Quick Rule
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-slate-950">
                    Subject code or subject name
                  </h2>
                </div>
              </div>
              <p className="mt-5 text-sm leading-7 text-slate-600">
                You do not need to fill both. If either subject code or subject
                name is entered, the class test can be published normally.
              </p>
            </section>
          </aside>
        </div>

        <section className="rounded-[30px] border border-white/80 bg-white/94 p-5 shadow-[0_24px_55px_-40px_rgba(15,23,42,0.35)] md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
                Student Rows
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                Fill marks and status for the selected batch
              </h2>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              {students.length} students loaded
            </div>
          </div>

          {!students.length ? (
            <div className="mt-5 rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500">
              Load a batch first, then the student rows will appear here.
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-[980px] w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">
                      Student
                    </th>
                    <th className="border border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">
                      Marks
                    </th>
                    <th className="border border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">
                      Status
                    </th>
                    <th className="border border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => (
                    <tr key={student.studentId} className="bg-white">
                      <td className="border border-slate-200 px-4 py-4">
                        <p className="font-semibold text-slate-950">
                          {student.studentName}
                        </p>
                      </td>
                      <td className="border border-slate-200 px-4 py-4">
                        <Input
                          type="number"
                          min="0"
                          max={totalMarks || undefined}
                          value={student.marksObtained}
                          onChange={(e) =>
                            updateStudent(index, "marksObtained", e.target.value)
                          }
                          placeholder="Enter marks"
                        />
                      </td>
                      <td className="border border-slate-200 px-4 py-4">
                        <div className="space-y-2">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getStatusShell(
                              student.status,
                            )}`}
                          >
                            {String(student.status || "pending").toUpperCase()}
                          </span>
                          <Select
                            value={student.status || "pending"}
                            onChange={(e) =>
                              updateStudent(index, "status", e.target.value)
                            }
                          >
                            <option value="pass">PASS</option>
                            <option value="fail">FAIL</option>
                            <option value="absent">ABSENT</option>
                            <option value="pending">PENDING</option>
                          </Select>
                        </div>
                      </td>
                      <td className="border border-slate-200 px-4 py-4">
                        <Textarea
                          rows={2}
                          value={student.remarks || ""}
                          onChange={(e) =>
                            updateStudent(index, "remarks", e.target.value)
                          }
                          placeholder="Optional remark"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
