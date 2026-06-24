"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BookOpen, Pencil, Plus, Printer, Save, Search, Sparkles, Target, Trash2 } from "lucide-react";

const COURSE_OPTIONS = ["BPT", "BOPTOM", "BMRIT", "DOPTOM", "BOTT"];

function getStatusBadgeClasses(status) {
  if (status === "pass") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "fail") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (status === "bp") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (status === "absent") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (status === "pwg") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getAttendanceBadgeClasses(status) {
  if (status === "present") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "absent") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

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

function createSubjectDefinition() {
  return {
    id:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `subject-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    subjectCode: "",
    subjectName: "",
    hasTheory: true,
    hasPractical: true,
    theoryMax: 70,
    practicalMax: 30,
  };
}

function sumSubjectTotal(subject) {
  return Number(subject?.theoryMarks || 0) + Number(subject?.practicalMarks || 0);
}

function sumStudentTotal(student) {
  return (Array.isArray(student?.subjects) ? student.subjects : []).reduce(
    (sum, subject) => sum + sumSubjectTotal(subject),
    0,
  );
}

function getStudentSubjectCodesByStatus(student, status) {
  return (Array.isArray(student?.subjects) ? student.subjects : [])
    .filter((subject) => String(subject?.subjectStatus || "").toLowerCase() === status)
    .map((subject) => subject.subjectCode)
    .filter(Boolean);
}

function getStudentComponentIssues(student) {
  return (Array.isArray(student?.subjects) ? student.subjects : []).flatMap((subject) => {
    const issues = [];
    const code = subject?.subjectCode;
    if (!code) return issues;

    if (subject?.hasTheory) {
      const theoryResult = String(subject?.theoryResultStatus || "").toLowerCase();
      if (["bp", "fail", "absent"].includes(theoryResult)) {
        issues.push({
          key: `${code}-theory-${theoryResult}`,
          label: `${code} Theory ${theoryResult.toUpperCase()}`,
          status: theoryResult,
        });
      }
    }

    if (subject?.hasPractical) {
      const practicalResult = String(subject?.practicalResultStatus || "").toLowerCase();
      if (["bp", "fail", "absent"].includes(practicalResult)) {
        issues.push({
          key: `${code}-practical-${practicalResult}`,
          label: `${code} Practical ${practicalResult.toUpperCase()}`,
          status: practicalResult,
        });
      }
    }

    return issues;
  });
}

function getBatchKey(course, year) {
  return `${String(course || "").toUpperCase()}|${String(year || "")}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getPrintAttendanceLabel(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "absent") return "AB";
  if (normalized === "pending") return "PN";
  return "PR";
}

function getPrintResultLabel(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "pass") return "P";
  if (normalized === "fail") return "F";
  if (normalized === "bp") return "BP";
  if (normalized === "absent") return "AB";
  if (normalized === "pwg") return "PWG";
  return "PN";
}

const PRINT_SCALE_OPTIONS = {
  compact: {
    label: "Compact Fit",
    pageMargin: "8mm",
    titleSize: "18px",
    metaSize: "11px",
    tableFontSize: "7px",
    cellPadding: "2px 2px",
    lineHeight: "1.05",
    noWidth: "24px",
    ddWidth: "70px",
    studentWidth: "86px",
    legendSize: "9px",
  },
  balanced: {
    label: "Balanced Fill",
    pageMargin: "7mm",
    titleSize: "19px",
    metaSize: "11px",
    tableFontSize: "7.6px",
    cellPadding: "2px 3px",
    lineHeight: "1.1",
    noWidth: "24px",
    ddWidth: "72px",
    studentWidth: "96px",
    legendSize: "9.5px",
  },
  wide: {
    label: "Full Page Fill",
    pageMargin: "6mm",
    titleSize: "20px",
    metaSize: "12px",
    tableFontSize: "8.2px",
    cellPadding: "3px 3px",
    lineHeight: "1.1",
    noWidth: "24px",
    ddWidth: "74px",
    studentWidth: "108px",
    legendSize: "10px",
  },
};

const PRINT_HEIGHT_OPTIONS = {
  compact: {
    label: "Compact Height",
    bodyRowHeight: "auto",
    bodyPadding: null,
  },
  balanced: {
    label: "Balanced Height",
    bodyRowHeight: "32px",
    bodyPadding: "4px 3px",
  },
  full: {
    label: "Full Height Fill",
    bodyRowHeight: "46px",
    bodyPadding: "7px 3px",
  },
};

export default function AdminResultsPage() {
  const [editingResultId, setEditingResultId] = useState("");
  const [resultName, setResultName] = useState("");
  const [course, setCourse] = useState("BPT");
  const [year, setYear] = useState("1");
  const [subjectDefinitions, setSubjectDefinitions] = useState([
    createSubjectDefinition(),
  ]);
  const [students, setStudents] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudentIdToAdd, setSelectedStudentIdToAdd] = useState("");
  const [existingResults, setExistingResults] = useState([]);
  const [batchAssignments, setBatchAssignments] = useState([]);
  const [assignmentDrafts, setAssignmentDrafts] = useState({});
  const [loadingBatchAssignments, setLoadingBatchAssignments] = useState(false);
  const [savingBatchKey, setSavingBatchKey] = useState("");
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMode, setSaveMode] = useState("replace");
  const [printOrientation, setPrintOrientation] = useState("landscape");
  const [printScale, setPrintScale] = useState("balanced");
  const [printHeightFill, setPrintHeightFill] = useState("balanced");
  const [deletingResultId, setDeletingResultId] = useState("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("success");

  const normalizedSubjects = useMemo(
    () =>
      subjectDefinitions
        .map((subject) => ({
          subjectCode: String(subject.subjectCode || "").trim().toUpperCase(),
          subjectName: String(subject.subjectName || "").trim(),
          hasTheory: Boolean(subject.hasTheory ?? true),
          hasPractical: Boolean(subject.hasPractical ?? true),
          theoryMax: subject.hasTheory ?? true
            ? Math.max(0, Number(subject.theoryMax || 0))
            : 0,
          practicalMax: subject.hasPractical ?? true
            ? Math.max(0, Number(subject.practicalMax || 0))
            : 0,
        }))
        .filter((subject) => subject.subjectCode && (subject.hasTheory || subject.hasPractical)),
    [subjectDefinitions],
  );

  const grandTotalMax = useMemo(
    () =>
      normalizedSubjects.reduce(
        (sum, subject) =>
          sum + Number(subject.theoryMax || 0) + Number(subject.practicalMax || 0),
        0,
      ),
    [normalizedSubjects],
  );
  const unassignedBatches = useMemo(
    () => batchAssignments.filter((batch) => !batch.assignedResultId),
    [batchAssignments],
  );

  useEffect(() => {
    refreshExistingResults();
    refreshPointAssignments();
  }, []);

  useEffect(() => {
    if (!students.length) return;
    if (!normalizedSubjects.length) return;

    setStudents((current) => syncStudentsWithSubjects(normalizedSubjects, current));
  }, [normalizedSubjects]);

  useEffect(() => {
    setEditingResultId("");
    setSubjectDefinitions([createSubjectDefinition()]);
    setStudents([]);
    setAvailableStudents([]);
    setSelectedStudentIdToAdd("");
    setTopMessage("");
  }, [course, year]);

  function setTopMessage(text, tone = "success") {
    setMessage(text);
    setMessageTone(tone);
  }

  async function refreshExistingResults() {
    try {
      const res = await fetch("/api/admin/results", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json().catch(() => []);
      if (!res.ok) return;
      setExistingResults(Array.isArray(data) ? data : []);
    } catch {}
  }

  async function refreshPointAssignments() {
    try {
      setLoadingBatchAssignments(true);
      const res = await fetch("/api/admin/result-points", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;

      const batches = Array.isArray(data?.batches) ? data.batches : [];
      setBatchAssignments(batches);
      setAssignmentDrafts(
        batches.reduce((acc, batch) => {
          acc[getBatchKey(batch.course, batch.year)] = batch.assignedResultId || "";
          return acc;
        }, {}),
      );
    } catch {
    } finally {
      setLoadingBatchAssignments(false);
    }
  }

  function syncStudentsWithSubjects(subjects, sourceStudents) {
    return (Array.isArray(sourceStudents) ? sourceStudents : []).map((student) => ({
      ...student,
      subjects: subjects.map((definition) => {
        const existing = (Array.isArray(student.subjects) ? student.subjects : []).find(
          (subject) => subject.subjectCode === definition.subjectCode,
        );

        return {
          subjectCode: definition.subjectCode,
          subjectName: definition.subjectName,
          hasTheory: definition.hasTheory,
          hasPractical: definition.hasPractical,
          theoryMax: definition.theoryMax,
          practicalMax: definition.practicalMax,
          theoryStatus: existing?.theoryStatus || "present",
          practicalStatus: existing?.practicalStatus || "present",
          theoryResultStatus: existing?.theoryResultStatus || "pending",
          practicalResultStatus: existing?.practicalResultStatus || "pending",
          subjectStatus: existing?.subjectStatus || "pending",
          theoryMarks: definition.hasTheory ? Number(existing?.theoryMarks || 0) : 0,
          practicalMarks: definition.hasPractical
            ? Number(existing?.practicalMarks || 0)
            : 0,
        };
      }),
    }));
  }

  function updateSubjectDefinition(index, field, value) {
    setSubjectDefinitions((current) => {
      const next = [...current];
      const updated = { ...next[index], [field]: value };

      if (field === "hasTheory" && !value) {
        updated.theoryMax = 0;
      }

      if (field === "hasPractical" && !value) {
        updated.practicalMax = 0;
      }

      if (field === "hasTheory" && value && Number(updated.theoryMax) <= 0) {
        updated.theoryMax = 70;
      }

      if (field === "hasPractical" && value && Number(updated.practicalMax) <= 0) {
        updated.practicalMax = 30;
      }

      next[index] = updated;
      return next;
    });
  }

  function addSubjectDefinition() {
    setSubjectDefinitions((current) => [...current, createSubjectDefinition()]);
  }

  function removeSubjectDefinition(index) {
    setSubjectDefinitions((current) => current.filter((_, i) => i !== index));
  }

  async function loadStudentsAndExistingResult() {
    if (!resultName.trim()) {
      setTopMessage("Please write a result name first.", "error");
      return;
    }

    try {
      setLoadingStudents(true);
      setTopMessage("");

      const params = new URLSearchParams({
        course,
        year,
        resultName: resultName.trim(),
      });
      const res = await fetch(`/api/admin/results?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Unable to load students");
      }

      if (Array.isArray(data.subjects) && data.subjects.length) {
        setSubjectDefinitions(
          data.subjects.map((subject) => ({
            id: createSubjectDefinition().id,
            subjectCode: subject.subjectCode || "",
            subjectName: subject.subjectName || "",
            hasTheory: Boolean(subject.hasTheory ?? Number(subject.theoryMax || 0) > 0),
            hasPractical: Boolean(
              subject.hasPractical ?? Number(subject.practicalMax || 0) > 0,
            ),
            theoryMax: Number(subject.theoryMax ?? 70),
            practicalMax: Number(subject.practicalMax ?? 30),
          })),
        );
      }

      const activeSubjects =
        Array.isArray(data.subjects) && data.subjects.length
          ? data.subjects
          : normalizedSubjects;

      if (!activeSubjects.length) {
        setStudents([]);
        setAvailableStudents(Array.isArray(data.availableStudents) ? data.availableStudents : []);
        setSelectedStudentIdToAdd("");
        setTopMessage(
          "No saved subjects were found for this course and year. Please add at least one subject first.",
          "error",
        );
        return;
      }

      const incomingStudents = Array.isArray(data.students) ? data.students : [];
      setAvailableStudents(Array.isArray(data.availableStudents) ? data.availableStudents : []);
      setSelectedStudentIdToAdd("");
      setStudents(syncStudentsWithSubjects(activeSubjects, incomingStudents));
      setTopMessage(
        data.exists
          ? "Existing batch result loaded. You can update it and save again."
          : "Students loaded. Enter theory and practical marks, then save.",
      );
    } catch (error) {
      setTopMessage(error.message || "Unable to load students", "error");
    } finally {
      setLoadingStudents(false);
    }
  }

  async function openSavedResult(result) {
    try {
      setLoadingStudents(true);
      setTopMessage("");
      setCourse(String(result.course || "BPT"));
      setYear(String(result.year || "1"));
      setResultName(String(result.resultName || ""));

      const params = new URLSearchParams({
        course: String(result.course || ""),
        year: String(result.year || ""),
        resultName: String(result.resultName || ""),
      });
      const res = await fetch(`/api/admin/results?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Unable to open saved result");
      }

      setSubjectDefinitions(
        (Array.isArray(data.subjects) ? data.subjects : []).length
          ? data.subjects.map((subject) => ({
              id: createSubjectDefinition().id,
              subjectCode: subject.subjectCode || "",
              subjectName: subject.subjectName || "",
              hasTheory: Boolean(subject.hasTheory ?? Number(subject.theoryMax || 0) > 0),
              hasPractical: Boolean(
                subject.hasPractical ?? Number(subject.practicalMax || 0) > 0,
              ),
              theoryMax: Number(subject.theoryMax ?? 70),
              practicalMax: Number(subject.practicalMax ?? 30),
            }))
          : [createSubjectDefinition()],
      );
      setEditingResultId(String(result._id || ""));
      setStudents(Array.isArray(data.students) ? data.students : []);
      setAvailableStudents(Array.isArray(data.availableStudents) ? data.availableStudents : []);
      setSelectedStudentIdToAdd("");
      setTopMessage("Saved result opened. You can now edit and save it again.");
    } catch (error) {
      setTopMessage(error.message || "Unable to open saved result", "error");
    } finally {
      setLoadingStudents(false);
    }
  }

  async function deleteSavedResult(result) {
    try {
      setDeletingResultId(result._id);
      setTopMessage("");

      const res = await fetch(`/api/admin/results?id=${encodeURIComponent(result._id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Unable to delete saved result");
      }

      if (
        String(editingResultId) === String(result._id || "") ||
        (String(resultName).trim() === String(result.resultName || "").trim() &&
          String(course) === String(result.course || "") &&
          String(year) === String(result.year || ""))
      ) {
        setEditingResultId("");
        setResultName("");
        setSubjectDefinitions([createSubjectDefinition()]);
        setStudents([]);
      }

      await Promise.all([refreshExistingResults(), refreshPointAssignments()]);
      setTopMessage(data?.message || "Saved result deleted successfully.");
    } catch (error) {
      setTopMessage(error.message || "Unable to delete saved result", "error");
    } finally {
      setDeletingResultId("");
    }
  }

  function updateBatchAssignmentDraft(course, year, value) {
    const batchKey = getBatchKey(course, year);
    setAssignmentDrafts((current) => ({
      ...current,
      [batchKey]: value,
    }));
  }

  async function saveBatchAssignment(batch) {
    const batchKey = getBatchKey(batch.course, batch.year);

    try {
      setSavingBatchKey(batchKey);
      setTopMessage("");

      const res = await fetch("/api/admin/result-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          course: batch.course,
          year: batch.year,
          resultId: assignmentDrafts[batchKey] || "",
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Unable to save points assignment");
      }

      await refreshPointAssignments();
      setTopMessage(
        data?.message || `Updated result points assignment for ${batch.course} Year ${batch.year}.`,
      );
    } catch (error) {
      setTopMessage(error.message || "Unable to save points assignment", "error");
    } finally {
      setSavingBatchKey("");
    }
  }

  function updateStudentSubject(studentIndex, subjectIndex, field, value) {
    setStudents((current) => {
      const next = [...current];
      const student = { ...next[studentIndex] };
      const subjects = [...(student.subjects || [])];
      const updated = {
        ...subjects[subjectIndex],
        [field]: value,
      };
      if (field === "theoryStatus" && value === "absent") {
        updated.theoryMarks = 0;
      }
      if (field === "practicalStatus" && value === "absent") {
        updated.practicalMarks = 0;
      }
      subjects[subjectIndex] = updated;
      student.subjects = subjects;
      next[studentIndex] = student;
      return next;
    });
  }

  function updateStudentField(studentIndex, field, value) {
    setStudents((current) => {
      const next = [...current];
      next[studentIndex] = { ...next[studentIndex], [field]: value };
      return next;
    });
  }

  function removeStudentRow(studentIndex) {
    setStudents((current) => current.filter((_, index) => index !== studentIndex));
  }

  function addStudentBackToResult() {
    if (!selectedStudentIdToAdd) {
      setTopMessage("Please select a student to add.", "error");
      return;
    }

    const studentToAdd = availableStudents.find(
      (student) => String(student.studentId) === String(selectedStudentIdToAdd),
    );

    if (!studentToAdd) {
      setTopMessage("Selected student was not found.", "error");
      return;
    }

    const alreadyExists = students.some(
      (student) => String(student.studentId) === String(studentToAdd.studentId),
    );

    if (alreadyExists) {
      setTopMessage("That student is already in the result list.", "error");
      return;
    }

    setStudents((current) =>
      syncStudentsWithSubjects(normalizedSubjects, [
        ...current,
        {
          studentId: studentToAdd.studentId,
          studentName: studentToAdd.studentName,
          resultStatus: "pass",
          remarks: "",
          subjects: [],
        },
      ]),
    );
    setSelectedStudentIdToAdd("");
    setTopMessage("Student added back to the result list.");
  }

  async function saveResults() {
    if (!resultName.trim()) {
      setTopMessage("Result name is required.", "error");
      return;
    }

    if (!normalizedSubjects.length) {
      setTopMessage("Please add subject definitions before saving.", "error");
      return;
    }

    if (!students.length) {
      setTopMessage("Load students first before saving.", "error");
      return;
    }

    try {
      setSaving(true);
      setTopMessage("");

      const payload = {
        resultId: editingResultId || undefined,
        resultName: resultName.trim(),
        course,
        year: Number(year),
        saveMode,
        subjects: normalizedSubjects,
        students: students.map((student) => ({
          studentId: student.studentId,
          studentName: student.studentName,
          resultStatus: student.resultStatus || "pass",
          remarks: student.remarks || "",
          subjects: (student.subjects || []).map((subject) => ({
            subjectCode: subject.subjectCode,
            theoryStatus: subject.theoryStatus || "present",
            practicalStatus: subject.practicalStatus || "present",
            theoryResultStatus: subject.theoryResultStatus || "pending",
            practicalResultStatus: subject.practicalResultStatus || "pending",
            subjectStatus: subject.subjectStatus || "pending",
            theoryMarks: Number(subject.theoryMarks || 0),
            practicalMarks: Number(subject.practicalMarks || 0),
          })),
        })),
      };

      const res = await fetch("/api/admin/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Unable to save result");
      }

      setTopMessage(data?.message || "Result saved and published.");

      await Promise.all([refreshExistingResults(), refreshPointAssignments()]);
    } catch (error) {
      setTopMessage(error.message || "Unable to save result", "error");
    } finally {
      setSaving(false);
    }
  }

  function handlePrintPreview() {
    if (!students.length) return;
    const printConfig =
      PRINT_SCALE_OPTIONS[printScale] || PRINT_SCALE_OPTIONS.balanced;
    const printHeightConfig =
      PRINT_HEIGHT_OPTIONS[printHeightFill] || PRINT_HEIGHT_OPTIONS.balanced;
    const title = resultName
      ? `${resultName} - ${course} Year ${year}`
      : `${course} Year ${year} Result Sheet`;

    const tableHeaderTop = `
      <tr>
        <th rowspan="2">No.</th>
        <th rowspan="2">DD</th>
        <th rowspan="2">Student</th>
        ${normalizedSubjects
          .map((subject) => {
            const colspan =
              (subject.hasTheory ? 1 : 0) +
              (subject.hasTheory ? 1 : 0) +
              (subject.hasPractical ? 1 : 0) +
              (subject.hasPractical ? 1 : 0) +
              1;

            return `<th colspan="${colspan}">${escapeHtml(subject.subjectCode)}</th>`;
          })
          .join("")}
        <th rowspan="2">GT</th>
        <th rowspan="2">%</th>
        <th rowspan="2">Res</th>
      </tr>
    `;

    const tableHeaderBottom = `
      <tr>
        ${normalizedSubjects
          .flatMap((subject) => {
            const columns = [];

            if (subject.hasTheory) {
              columns.push("<th>Th Att</th>");
              columns.push(
                `<th>Th ${escapeHtml(subject.theoryMax)}</th>`,
              );
            }

            if (subject.hasPractical) {
              columns.push("<th>Pr Att</th>");
              columns.push(
                `<th>Pr ${escapeHtml(subject.practicalMax)}</th>`,
              );
            }

            columns.push("<th>Res</th>");
            return columns;
          })
          .join("")}
      </tr>
    `;

    const tableBody = students
      .map((student, index) => {
        const subjectCells = (student.subjects || [])
          .flatMap((subject) => {
            const cells = [];

            if (subject.hasTheory) {
              cells.push(
                `<td>${escapeHtml(getPrintAttendanceLabel(subject.theoryStatus))}</td>`,
              );
              cells.push(
                `<td>${escapeHtml(
                  subject.theoryStatus === "absent"
                    ? "AB"
                    : String(subject.theoryMarks || 0),
                )}</td>`,
              );
            }

            if (subject.hasPractical) {
              cells.push(
                `<td>${escapeHtml(getPrintAttendanceLabel(subject.practicalStatus))}</td>`,
              );
              cells.push(
                `<td>${escapeHtml(
                  subject.practicalStatus === "absent"
                    ? "AB"
                    : String(subject.practicalMarks || 0),
                )}</td>`,
              );
            }

            cells.push(
              `<td>${escapeHtml(getPrintResultLabel(subject.subjectStatus))}</td>`,
            );

            return cells;
          })
          .join("");

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(student.studentName || "Student")}</td>
            ${subjectCells}
            <td>${escapeHtml(String(sumStudentTotal(student)))}</td>
            <td>${escapeHtml(
              grandTotalMax
                ? `${((sumStudentTotal(student) / grandTotalMax) * 100).toFixed(2)}%`
                : "0.00%",
            )}</td>
            <td>${escapeHtml(getPrintResultLabel(student.resultStatus))}</td>
          </tr>
        `;
      })
      .join("");

    const printHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(title)}</title>
          <style>
            @page {
              size: ${printOrientation};
              margin: ${printConfig.pageMargin};
            }

            * {
              box-sizing: border-box;
            }

            html, body {
              margin: 0;
              padding: 0;
              background: #fff;
              color: #000;
              font-family: Arial, Helvetica, sans-serif;
            }

            body {
              padding: 0;
            }

            .sheet {
              width: 100%;
            }

            .title {
              text-align: center;
              font-size: ${printConfig.titleSize};
              font-weight: 700;
              margin: 0 0 6px;
            }

            .meta {
              text-align: center;
              font-size: ${printConfig.metaSize};
              margin: 0 0 10px;
            }

            .legend {
              margin: 0 0 10px;
              text-align: center;
              font-size: ${printConfig.legendSize};
              line-height: 1.25;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
              font-size: ${printConfig.tableFontSize};
            }

            th, td {
              border: 1px solid #000;
              padding: ${printConfig.cellPadding};
              text-align: center;
              vertical-align: middle;
              line-height: ${printConfig.lineHeight};
              word-break: normal;
              overflow-wrap: normal;
              font-variant-numeric: tabular-nums;
              white-space: nowrap;
            }

            th {
              font-weight: 700;
            }

            th:nth-child(1), td:nth-child(1) {
              width: ${printConfig.noWidth};
            }

            th:nth-child(2), td:nth-child(2) {
              width: ${printConfig.ddWidth};
            }

            th:nth-child(3), td:nth-child(3) {
              width: ${printConfig.studentWidth};
              text-align: left;
            }

            tbody tr {
              height: ${printHeightConfig.bodyRowHeight};
            }

            tbody td {
              ${printHeightConfig.bodyPadding ? `padding: ${printHeightConfig.bodyPadding};` : ""}
            }
          </style>
        </head>
        <body>
          <div class="sheet">
            <h1 class="title">${escapeHtml(title)}</h1>
            <p class="meta">Students: ${students.length} | Subjects: ${normalizedSubjects.length} | Grand Total: ${grandTotalMax}</p>
            <div class="legend">
              <strong>Abbreviations:</strong>
              No. = Serial Number | GT = Grand Total | Res = Result | Th = Theory | Pr = Practical | Att = Attendance | PR = Present | AB = Absent | PN = Pending | P = Pass | F = Fail
            </div>
            <table>
              <thead>
                ${tableHeaderTop}
                ${tableHeaderBottom}
              </thead>
              <tbody>
                ${tableBody}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;

    const existingFrame = document.getElementById("result-print-frame");
    if (existingFrame) {
      existingFrame.remove();
    }

    const iframe = document.createElement("iframe");
    iframe.id = "result-print-frame";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    const frameDoc =
      iframe.contentDocument || iframe.contentWindow?.document || null;

    if (!frameDoc || !iframe.contentWindow) {
      iframe.remove();
      setTopMessage("Unable to prepare print preview.", "error");
      return;
    }

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => iframe.remove(), 1000);
      }, 250);
    };

    frameDoc.open();
    frameDoc.write(printHtml);
    frameDoc.close();
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff7ed_0%,#fffbeb_30%,#f8fafc_100%)] p-4 md:p-6">
      <div className="mx-auto max-w-[1800px] space-y-6">
        <section className="result-print-hide rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,247,237,0.94),rgba(254,243,199,0.8))] p-5 shadow-[0_28px_70px_-40px_rgba(15,23,42,0.35)] md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700 shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Batch Result Sheet
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                Post batch-style results with theory and practical columns
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">
                This result workflow now supports subject code, theory marks, practical marks, grand total, and final result status so it can match the sheet style from your sample batch result image.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:w-[520px]">
              <div className="rounded-[24px] border border-slate-200 bg-white/88 p-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Saved Result Sets</p>
                <p className="mt-3 text-3xl font-bold text-amber-700">{existingResults.length}</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white/88 p-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Subject Columns</p>
                <p className="mt-3 text-3xl font-bold text-slate-950">{normalizedSubjects.length}</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white/88 p-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Students In List</p>
                <p className="mt-3 text-3xl font-bold text-blue-700">{students.length}</p>
              </div>
            </div>
          </div>

          {message ? (
            <div className={`mt-5 rounded-2xl px-4 py-3 text-sm ${messageTone === "error" ? "border border-red-200 bg-red-50 text-red-700" : "border border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
              {message}
            </div>
          ) : null}
        </section>

        <div className="result-print-hide grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[28px] border border-white/80 bg-white/92 p-5 shadow-[0_24px_55px_-40px_rgba(15,23,42,0.35)] md:p-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-amber-700" />
              <h2 className="text-lg font-semibold text-slate-950">Result Setup</h2>
            </div>

            <div className="mt-5 space-y-4">
              <Input
                value={resultName}
                onChange={(e) => setResultName(e.target.value)}
                placeholder="Result name, for example Mid Term Result or Annual Exam Result"
              />

              {editingResultId ? (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  You are editing a saved result. Change the title here if you want to rename it, then save.
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <Select value={course} onChange={(e) => setCourse(e.target.value)}>
                  {COURSE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </Select>

                <Select value={year} onChange={(e) => setYear(e.target.value)}>
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                  <option value="4">Year 4</option>
                </Select>
              </div>

              <Select value={saveMode} onChange={(e) => setSaveMode(e.target.value)}>
                <option value="replace">Replace current saved result</option>
                <option value="merge">Merge subjects into same exam title</option>
              </Select>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={loadStudentsAndExistingResult}
                  disabled={loadingStudents}
                  className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-60"
                >
                  <Search className="h-4 w-4" />
                  {loadingStudents ? "Loading..." : "Load Students"}
                </button>
                <button
                  type="button"
                  onClick={saveResults}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Result"}
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/80 bg-white/92 p-5 shadow-[0_24px_55px_-40px_rgba(15,23,42,0.35)] md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Subject Definitions</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Add the batch subjects exactly like your sheet, for example `BPT-101`, with separate theory and practical maxima.
                </p>
              </div>
              <button
                type="button"
                onClick={addSubjectDefinition}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" />
                Add Subject
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {subjectDefinitions.map((subject, index) => (
                <div key={subject.id} className="grid gap-3 rounded-[22px] border border-slate-200 bg-slate-50/80 p-4 md:grid-cols-[1fr_1.1fr_0.85fr_0.85fr_0.85fr_0.85fr_auto]">
                  <Input
                    value={subject.subjectCode}
                    onChange={(e) => updateSubjectDefinition(index, "subjectCode", e.target.value)}
                    placeholder="Subject code"
                  />
                  <Input
                    value={subject.subjectName}
                    onChange={(e) => updateSubjectDefinition(index, "subjectName", e.target.value)}
                    placeholder="Subject name (optional)"
                  />
                  <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={subject.hasTheory}
                      onChange={(e) =>
                        updateSubjectDefinition(index, "hasTheory", e.target.checked)
                      }
                    />
                    Theory
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={subject.theoryMax}
                    onChange={(e) => updateSubjectDefinition(index, "theoryMax", e.target.value)}
                    placeholder="Theory max"
                    disabled={!subject.hasTheory}
                  />
                  <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={subject.hasPractical}
                      onChange={(e) =>
                        updateSubjectDefinition(index, "hasPractical", e.target.checked)
                      }
                    />
                    Practical
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={subject.practicalMax}
                    onChange={(e) => updateSubjectDefinition(index, "practicalMax", e.target.value)}
                    placeholder="Practical max"
                    disabled={!subject.hasPractical}
                  />
                  <button
                    type="button"
                    onClick={() => removeSubjectDefinition(index)}
                    className="inline-flex items-center justify-center rounded-2xl border border-red-200 bg-white px-4 py-3 text-red-600 transition hover:border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="result-print-hide rounded-[28px] border border-white/80 bg-white/94 p-5 shadow-[0_24px_55px_-40px_rgba(15,23,42,0.35)] md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-700" />
                <h2 className="text-lg font-semibold text-slate-950">Student Points Result Control</h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Choose which saved result should be counted for student points in each course-year batch. Right now batches are identified from the registered student data already in the portal.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[340px]">
              <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Assigned Batches</p>
                <p className="mt-2 text-3xl font-bold text-emerald-700">
                  {batchAssignments.length - unassignedBatches.length}
                </p>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Pending Batches</p>
                <p className="mt-2 text-3xl font-bold text-amber-700">
                  {unassignedBatches.length}
                </p>
              </div>
            </div>
          </div>

          {unassignedBatches.length ? (
            <div className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50/90 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    These batches do not have any result selected for student points yet
                  </p>
                  <p className="mt-2 text-sm leading-6 text-amber-800">
                    {unassignedBatches
                      .map((batch) => `${batch.course} Year ${batch.year}`)
                      .join(", ")}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {loadingBatchAssignments ? (
            <div className="mt-5 rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500">
              Loading batch assignments...
            </div>
          ) : !batchAssignments.length ? (
            <div className="mt-5 rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500">
              No registered student batches were found yet.
            </div>
          ) : (
            <div className="mt-5 grid gap-3">
              {batchAssignments.map((batch) => {
                const batchKey = getBatchKey(batch.course, batch.year);
                const selectedResultId = assignmentDrafts[batchKey] ?? batch.assignedResultId ?? "";

                return (
                  <div
                    key={batchKey}
                    className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div>
                        <p className="text-base font-semibold text-slate-950">
                          {batch.course} Year {batch.year}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {batch.studentCount || 0} registered students • {Array.isArray(batch.availableResults) ? batch.availableResults.length : 0} saved results available
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {batch.assignedResultName
                            ? `Currently counted: ${batch.assignedResultName}`
                            : "No result is currently counted for points in this batch."}
                        </p>
                      </div>

                      <div className="flex w-full flex-col gap-3 xl:max-w-xl xl:flex-row">
                        <Select
                          value={selectedResultId}
                          onChange={(e) =>
                            updateBatchAssignmentDraft(batch.course, batch.year, e.target.value)
                          }
                          disabled={!batch.availableResults?.length}
                        >
                          <option value="">Do not count any result yet</option>
                          {(Array.isArray(batch.availableResults) ? batch.availableResults : []).map((result) => (
                            <option key={result._id} value={result._id}>
                              {result.resultName} ({result.studentCount || 0} students)
                            </option>
                          ))}
                        </Select>

                        <button
                          type="button"
                          onClick={() => saveBatchAssignment(batch)}
                          disabled={savingBatchKey === batchKey}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
                        >
                          <Save className="h-4 w-4" />
                          {savingBatchKey === batchKey ? "Saving..." : "Save Selection"}
                        </button>
                      </div>
                    </div>

                    {!batch.availableResults?.length ? (
                      <p className="mt-3 text-sm text-amber-700">
                        No saved result exists yet for this batch, so student result points cannot start here.
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-[28px] border border-white/80 bg-white/94 p-5 shadow-[0_24px_55px_-40px_rgba(15,23,42,0.35)] md:p-6">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-amber-700" />
            <h2 className="text-lg font-semibold text-slate-950">Saved Results</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Open any previously submitted result to edit it again, or delete it if you no longer need it.
          </p>

          {!existingResults.length ? (
            <div className="mt-5 rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500">
              No saved results found yet.
            </div>
          ) : (
            <div className="mt-5 grid gap-3">
              {existingResults.map((result) => (
                <div
                  key={result._id}
                  className="flex flex-col gap-4 rounded-[22px] border border-slate-200 bg-slate-50/80 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-base font-semibold text-slate-950">{result.resultName}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {result.course} | Year {result.year} | {result.studentCount || 0} students | {Array.isArray(result.subjects) ? result.subjects.length : 0} subjects
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => openSavedResult(result)}
                      disabled={loadingStudents}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
                    >
                      <Pencil className="h-4 w-4" />
                      Open / Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSavedResult(result)}
                      disabled={deletingResultId === result._id}
                      className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingResultId === result._id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[28px] border border-white/80 bg-white/94 p-5 shadow-[0_24px_55px_-40px_rgba(15,23,42,0.35)] md:p-6">
          <h2 className="text-lg font-semibold text-slate-950">Student Marks Entry</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Fill theory and practical marks for each student. Grand total is calculated automatically from the subject rows.
          </p>

          {availableStudents.length ? (
            <div className="mt-5 flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-slate-50/80 p-4 md:flex-row md:items-end">
              <div className="flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Add Student Back
                </p>
                <Select
                  value={selectedStudentIdToAdd}
                  onChange={(e) => setSelectedStudentIdToAdd(e.target.value)}
                  className="mt-2"
                >
                  <option value="">Select a course student</option>
                  {availableStudents
                    .filter(
                      (student) =>
                        !students.some(
                          (item) => String(item.studentId) === String(student.studentId),
                        ),
                    )
                    .map((student) => (
                      <option key={student.studentId} value={student.studentId}>
                        {student.studentName}
                      </option>
                    ))}
                </Select>
              </div>
              <button
                type="button"
                onClick={addStudentBackToResult}
                className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50"
              >
                Add Student
              </button>
            </div>
          ) : null}

          {!students.length ? (
            <div className="mt-5 rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500">
              Load students first to start entering marks.
            </div>
          ) : (
            <div className="result-print-scroll mt-5 overflow-x-auto">
              <table className="min-w-[1600px] w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">S.No.</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Student Name</th>
                    {normalizedSubjects.map((subject) => (
                      <th key={subject.subjectCode} className="px-4 py-3 text-center font-semibold text-slate-600">
                        <div className="space-y-1">
                          <p>{subject.subjectCode}</p>
                          <p className="text-[11px] font-medium text-slate-400">
                            {subject.hasTheory ? `Theory ${subject.theoryMax}` : ""}
                            {subject.hasTheory && subject.hasPractical ? " / " : ""}
                            {subject.hasPractical ? `Practical ${subject.practicalMax}` : ""}
                          </p>
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Grand Total</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Percentage</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Result</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Remarks</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, studentIndex) => (
                    <tr key={student.studentId} className="border-b border-slate-100 align-top">
                      <td className="px-4 py-4 font-medium text-slate-700">{studentIndex + 1}</td>
                      <td className="px-4 py-4 font-semibold text-slate-950">{student.studentName}</td>
                      {(student.subjects || []).map((subject, subjectIndex) => (
                        <td key={`${student.studentId}-${subject.subjectCode}`} className="px-4 py-4">
                          <div className="space-y-2">
                            {subject.hasTheory ? (
                              <div className="space-y-1">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                                  Theory Marks
                                </p>
                                <div className="flex justify-center md:justify-start">
                                  <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getAttendanceBadgeClasses(subject.theoryStatus)}`}>
                                    Theory {String(subject.theoryStatus || "present").toUpperCase()}
                                  </span>
                                </div>
                                <Select
                                  value={subject.theoryStatus || "present"}
                                  onChange={(e) =>
                                    updateStudentSubject(studentIndex, subjectIndex, "theoryStatus", e.target.value)
                                  }
                                >
                                  <option value="present">PRESENT</option>
                                  <option value="absent">ABSENT</option>
                                  <option value="pending">PENDING</option>
                                </Select>
                                <Input
                                  type="number"
                                  min="0"
                                  max={subject.theoryMax}
                                  value={subject.theoryMarks}
                                  disabled={subject.theoryStatus === "absent"}
                                  onChange={(e) =>
                                    updateStudentSubject(studentIndex, subjectIndex, "theoryMarks", e.target.value)
                                  }
                                  placeholder="Theory marks"
                                />
                                <Select
                                  value={subject.theoryResultStatus || "pending"}
                                  onChange={(e) =>
                                    updateStudentSubject(studentIndex, subjectIndex, "theoryResultStatus", e.target.value)
                                  }
                                >
                                  <option value="pass">THEORY PASS</option>
                                  <option value="fail">THEORY FAIL</option>
                                  <option value="absent">THEORY ABSENT</option>
                                  <option value="bp">THEORY BP</option>
                                  <option value="pending">THEORY PENDING</option>
                                </Select>
                              </div>
                            ) : null}
                            {subject.hasPractical ? (
                              <div className="space-y-1">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                                  Practical Marks
                                </p>
                                <div className="flex justify-center md:justify-start">
                                  <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getAttendanceBadgeClasses(subject.practicalStatus)}`}>
                                    Practical {String(subject.practicalStatus || "present").toUpperCase()}
                                  </span>
                                </div>
                                <Select
                                  value={subject.practicalStatus || "present"}
                                  onChange={(e) =>
                                    updateStudentSubject(studentIndex, subjectIndex, "practicalStatus", e.target.value)
                                  }
                                >
                                  <option value="present">PRESENT</option>
                                  <option value="absent">ABSENT</option>
                                  <option value="pending">PENDING</option>
                                </Select>
                                <Input
                                  type="number"
                                  min="0"
                                  max={subject.practicalMax}
                                  value={subject.practicalMarks}
                                  disabled={subject.practicalStatus === "absent"}
                                  onChange={(e) =>
                                    updateStudentSubject(studentIndex, subjectIndex, "practicalMarks", e.target.value)
                                  }
                                  placeholder="Practical marks"
                                />
                                <Select
                                  value={subject.practicalResultStatus || "pending"}
                                  onChange={(e) =>
                                    updateStudentSubject(studentIndex, subjectIndex, "practicalResultStatus", e.target.value)
                                  }
                                >
                                  <option value="pass">PRACTICAL PASS</option>
                                  <option value="fail">PRACTICAL FAIL</option>
                                  <option value="absent">PRACTICAL ABSENT</option>
                                  <option value="bp">PRACTICAL BP</option>
                                  <option value="pending">PRACTICAL PENDING</option>
                                </Select>
                              </div>
                            ) : null}
                            <div className="space-y-1">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                                Subject Result
                              </p>
                              <div className="flex justify-center md:justify-start">
                                <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getStatusBadgeClasses(subject.subjectStatus)}`}>
                                  {String(subject.subjectStatus || "pending").toUpperCase()}
                                </span>
                              </div>
                              <Select
                                value={subject.subjectStatus || "pending"}
                                onChange={(e) =>
                                  updateStudentSubject(studentIndex, subjectIndex, "subjectStatus", e.target.value)
                                }
                              >
                                <option value="pass">PASS</option>
                                <option value="fail">FAILED</option>
                                <option value="bp">BP</option>
                                <option value="absent">ABSENT</option>
                                <option value="pwg">PWG</option>
                                <option value="pending">PENDING</option>
                              </Select>
                            </div>
                            {!subject.hasTheory && !subject.hasPractical ? (
                              <p className="text-sm text-slate-400">No marks columns enabled.</p>
                            ) : null}
                          </div>
                        </td>
                      ))}
                      <td className="px-4 py-4 font-bold text-blue-700">
                        {sumStudentTotal(student)}/{grandTotalMax}
                      </td>
                      <td className="px-4 py-4 font-semibold text-violet-700">
                        {grandTotalMax
                          ? `${((sumStudentTotal(student) / grandTotalMax) * 100).toFixed(2)}%`
                          : "0.00%"}
                      </td>
                      <td className="px-4 py-4">
                        {(() => {
                          const issues = getStudentComponentIssues(student);

                          return issues.length ? (
                            <div className="mb-2 flex flex-wrap gap-2">
                              {issues.map((issue) => (
                                <span
                                  key={issue.key}
                                  className={`rounded-2xl border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getStatusBadgeClasses(issue.status)}`}
                                >
                                  {issue.label}
                                </span>
                              ))}
                            </div>
                          ) : null;
                        })()}
                        <div className="mb-2">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getStatusBadgeClasses(student.resultStatus)}`}>
                            {String(student.resultStatus || "pass").toUpperCase()}
                          </span>
                        </div>
                        <Select
                          value={student.resultStatus || "pass"}
                          onChange={(e) => updateStudentField(studentIndex, "resultStatus", e.target.value)}
                        >
                          <option value="pass">PASS</option>
                          <option value="fail">FAILED</option>
                          <option value="bp">BP</option>
                          <option value="pwg">PWG</option>
                          <option value="pending">PENDING</option>
                        </Select>
                      </td>
                      <td className="px-4 py-4">
                        <Textarea
                          rows={2}
                          value={student.remarks || ""}
                          onChange={(e) => updateStudentField(studentIndex, "remarks", e.target.value)}
                          placeholder="Optional remarks"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => removeStudentRow(studentIndex)}
                          className="inline-flex items-center justify-center rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {students.length ? (
          <section className="result-print-area rounded-[28px] border border-white/80 bg-white/94 p-5 shadow-[0_24px_55px_-40px_rgba(15,23,42,0.35)] md:p-6">
            <div className="result-print-hide flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Batch Result Sheet Preview</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  This preview now shows theory and practical attendance, component-wise result, subject result, grand total, and final overall result in one sheet.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Select
                  value={printOrientation}
                  onChange={(e) => setPrintOrientation(e.target.value)}
                  className="sm:w-[170px]"
                >
                  <option value="landscape">Landscape Print</option>
                  <option value="portrait">Portrait Print</option>
                </Select>
                <Select
                  value={printScale}
                  onChange={(e) => setPrintScale(e.target.value)}
                  className="sm:w-[170px]"
                >
                  {Object.entries(PRINT_SCALE_OPTIONS).map(([value, option]) => (
                    <option key={value} value={value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <Select
                  value={printHeightFill}
                  onChange={(e) => setPrintHeightFill(e.target.value)}
                  className="sm:w-[170px]"
                >
                  {Object.entries(PRINT_HEIGHT_OPTIONS).map(([value, option]) => (
                    <option key={value} value={value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <button
                  type="button"
                  onClick={handlePrintPreview}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  <Printer className="h-4 w-4" />
                Print Result Sheet
              </button>
            </div>
          </div>

            <div className="result-print-hide mt-3 rounded-[18px] border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs leading-6 text-slate-600">
              <strong>Print abbreviations:</strong> `No.` serial number, `GT` grand total, `Res` result, `Th` theory, `Pr` practical, `Att` attendance, `PR` present, `AB` absent, `PN` pending, `P` pass, `F` fail.
            </div>

            <div className="hidden print:block print:mb-3">
              <h2 className="text-center text-lg font-bold text-black">
                {resultName ? `${resultName} - ${course} Year ${year}` : `${course} Year ${year} Result Sheet`}
              </h2>
              <p className="mt-1 text-center text-xs text-black">
                Students: {students.length} | Subjects: {normalizedSubjects.length} | Grand Total: {grandTotalMax}
              </p>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="result-print-table min-w-[2200px] w-full border border-slate-300 text-sm">
                <thead>
                  <tr className="border-b border-slate-300 bg-slate-50">
                    <th rowSpan={2} className="border-r border-slate-300 px-3 py-3 text-left font-semibold text-slate-700">S.No.</th>
                    <th rowSpan={2} className="border-r border-slate-300 px-3 py-3 text-left font-semibold text-slate-700">Name of Student</th>
                    {normalizedSubjects.map((subject) => (
                      <th
                        key={subject.subjectCode}
                        colSpan={
                          (subject.hasTheory ? 1 : 0) +
                          (subject.hasTheory ? 1 : 0) +
                          (subject.hasPractical ? 1 : 0) +
                          (subject.hasPractical ? 1 : 0) +
                          1
                        }
                        className="border-r border-slate-300 px-3 py-3 text-center font-semibold text-slate-700"
                      >
                        {subject.subjectCode}
                      </th>
                    ))}
                    <th rowSpan={2} className="border-r border-slate-300 px-3 py-3 text-center font-semibold text-slate-700">Grand Total</th>
                    <th rowSpan={2} className="border-r border-slate-300 px-3 py-3 text-center font-semibold text-slate-700">Percentage</th>
                    <th rowSpan={2} className="px-3 py-3 text-center font-semibold text-slate-700">Result</th>
                  </tr>
                  <tr className="border-b border-slate-300 bg-slate-50">
                    {normalizedSubjects.flatMap((subject) => {
                      const columns = [];

                      if (subject.hasTheory) {
                        columns.push(
                          <th
                            key={`${subject.subjectCode}-theory-status`}
                            className="border-r border-slate-300 px-3 py-2 text-center font-medium text-slate-600"
                          >
                            Theory Attendance
                          </th>,
                        );
                        columns.push(
                          <th
                            key={`${subject.subjectCode}-theory`}
                            className="border-r border-slate-300 px-3 py-2 text-center font-medium text-slate-600"
                          >
                            Theory Marks ({subject.theoryMax})
                          </th>,
                        );
                      }

                      if (subject.hasPractical) {
                        columns.push(
                          <th
                            key={`${subject.subjectCode}-practical-status`}
                            className="border-r border-slate-300 px-3 py-2 text-center font-medium text-slate-600"
                          >
                            Practical Attendance
                          </th>,
                        );
                        columns.push(
                          <th
                            key={`${subject.subjectCode}-practical`}
                            className="border-r border-slate-300 px-3 py-2 text-center font-medium text-slate-600"
                          >
                            Practical Marks ({subject.practicalMax})
                          </th>,
                        );
                      }

                      columns.push(
                        <th
                          key={`${subject.subjectCode}-status`}
                          className="border-r border-slate-300 px-3 py-2 text-center font-medium text-slate-600"
                        >
                          Result
                        </th>,
                      );

                      return columns;
                    })}
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => (
                    <tr key={`preview-${student.studentId}`} className="border-b border-slate-200">
                      <td className="border-r border-slate-200 px-3 py-3 text-slate-700">{index + 1}</td>
                      <td className="border-r border-slate-200 px-3 py-3 font-medium text-slate-900">{student.studentName}</td>
                      {(student.subjects || []).flatMap((subject) => {
                        const columns = [];

                        if (subject.hasTheory) {
                          columns.push(
                            <td
                              key={`${student.studentId}-${subject.subjectCode}-theory-status`}
                              className="border-r border-slate-200 px-3 py-3 text-center"
                            >
                              <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getAttendanceBadgeClasses(subject.theoryStatus)}`}>
                                {String(subject.theoryStatus || "present").toUpperCase()}
                              </span>
                            </td>,
                          );
                          columns.push(
                            <td
                              key={`${student.studentId}-${subject.subjectCode}-t`}
                              className="border-r border-slate-200 px-3 py-3 text-center text-slate-700"
                            >
                              {subject.theoryStatus === "absent" ? "ABSENT" : subject.theoryMarks || 0}
                            </td>,
                          );
                        }

                        if (subject.hasPractical) {
                          columns.push(
                            <td
                              key={`${student.studentId}-${subject.subjectCode}-practical-status`}
                              className="border-r border-slate-200 px-3 py-3 text-center"
                            >
                              <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getAttendanceBadgeClasses(subject.practicalStatus)}`}>
                                {String(subject.practicalStatus || "present").toUpperCase()}
                              </span>
                            </td>,
                          );
                          columns.push(
                            <td
                              key={`${student.studentId}-${subject.subjectCode}-p`}
                              className="border-r border-slate-200 px-3 py-3 text-center text-slate-700"
                            >
                              {subject.practicalStatus === "absent" ? "ABSENT" : subject.practicalMarks || 0}
                            </td>,
                          );
                        }

                        columns.push(
                          <td
                            key={`${student.studentId}-${subject.subjectCode}-status`}
                            className="border-r border-slate-200 px-3 py-3 text-center"
                          >
                            <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getStatusBadgeClasses(subject.subjectStatus)}`}>
                              {String(subject.subjectStatus || "pending").toUpperCase()}
                            </span>
                          </td>,
                        );

                        return columns;
                      })}
                      <td className="border-r border-slate-200 px-3 py-3 text-center font-semibold text-slate-900">
                        {sumStudentTotal(student)}
                      </td>
                      <td className="border-r border-slate-200 px-3 py-3 text-center font-semibold text-violet-700">
                        {grandTotalMax
                          ? `${((sumStudentTotal(student) / grandTotalMax) * 100).toFixed(2)}%`
                          : "0.00%"}
                      </td>
                      <td className="px-3 py-3 text-center font-semibold text-slate-900">
                        <div className="flex flex-col items-center gap-2">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getStatusBadgeClasses(student.resultStatus)}`}>
                            {String(student.resultStatus || "pass").toUpperCase()}
                          </span>
                          {(() => {
                            const issues = getStudentComponentIssues(student);
                            return issues.length ? (
                              <div className="flex flex-wrap justify-center gap-2">
                                {issues.map((issue) => (
                                  <span
                                    key={`preview-${student.studentId}-${issue.key}`}
                                    className={`rounded-2xl border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getStatusBadgeClasses(issue.status)}`}
                                  >
                                    {issue.label}
                                  </span>
                                ))}
                              </div>
                            ) : null;
                          })()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
