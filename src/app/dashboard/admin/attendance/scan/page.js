"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  QrCode,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";

function getTodayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(now.getDate()).padStart(2, "0")}`;
}

function safeClearScanner(scanner) {
  try {
    const clearResult = scanner?.clear?.();
    if (clearResult && typeof clearResult.then === "function") {
      clearResult.catch(() => {});
    }
  } catch {
    // Ignore cleanup errors from partially started scanners.
  }
}

function getCameraSupportError() {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "Phone camera needs a secure connection. Use HTTPS or the upload fallback on mobile.";
  }

  if (
    typeof navigator !== "undefined" &&
    (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)
  ) {
    return "This browser is not exposing camera access for this page. Use HTTPS and a supported browser like Chrome.";
  }

  return "";
}

export default function AdminScanAttendancePage() {
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [scannerEnabled, setScannerEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [manualValue, setManualValue] = useState("");
  const [photoScanning, setPhotoScanning] = useState(false);
  const [lastAcceptedStudentId, setLastAcceptedStudentId] = useState("");
  const scannerRef = useRef(null);
  const lastScanTextRef = useRef("");
  const lastScanAtRef = useRef(0);
  const initialDateRef = useRef(selectedDate);

  const activeSession = useMemo(
    () =>
      sessions.find((entry) => String(entry?._id || "") === activeSessionId) ||
      sessions[0] ||
      null,
    [activeSessionId, sessions],
  );

  async function fetchSessionsForDate(date) {
    const res = await fetch(
      `/api/admin/attendance/session?date=${encodeURIComponent(
        date,
      )}&status=open`,
      {
        credentials: "include",
        cache: "no-store",
      },
    );

    const data = await res.json().catch(() => []);
    if (!res.ok) {
      throw new Error(data?.message || "Failed to load admin QR sessions");
    }

    return Array.isArray(data) ? data : [];
  }

  async function refreshSessionById(sessionId) {
    const res = await fetch(
      `/api/admin/attendance/session?sessionId=${encodeURIComponent(sessionId)}`,
      {
        credentials: "include",
        cache: "no-store",
      },
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || "Failed to refresh admin QR session");
    }

    setSessions((prev) => {
      const existingIndex = prev.findIndex(
        (entry) => String(entry?._id || "") === String(data?._id || ""),
      );

      if (existingIndex === -1) {
        return [data, ...prev];
      }

      const next = [...prev];
      next[existingIndex] = data;
      return next;
    });
    return data;
  }

  async function refreshSessionsForDate(date, preferredSessionId = "") {
    const nextSessions = await fetchSessionsForDate(date);
    setSessions(nextSessions);
    if (preferredSessionId) {
      setActiveSessionId(preferredSessionId);
    } else if (
      activeSessionId &&
      nextSessions.some((entry) => String(entry?._id || "") === activeSessionId)
    ) {
      setActiveSessionId(activeSessionId);
    } else {
      setActiveSessionId(String(nextSessions[0]?._id || ""));
    }
    return nextSessions;
  }

  const submitScan = useCallback(
    async (qrText, scanSource) => {
      if (!selectedDate) {
        throw new Error("Choose an attendance date before scanning");
      }

      setActionLoading(true);
      setError("");
      setMessage("");

      try {
        const res = await fetch("/api/admin/attendance/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            date: selectedDate,
            qrText,
            scanSource,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || "Failed to scan student QR");
        }

        setMessage(data.message || "Student scanned successfully");
        setLastAcceptedStudentId(String(data?.student?._id || ""));
        setManualValue("");
        if (data?.session?._id) {
          await refreshSessionsForDate(selectedDate, String(data.session._id));
        } else if (activeSession?._id) {
          await refreshSessionById(activeSession._id);
        } else {
          await refreshSessionsForDate(selectedDate);
        }
      } catch (scanError) {
        setError(scanError.message || "Failed to scan student QR");
        throw scanError;
      } finally {
        setActionLoading(false);
      }
    },
    [activeSession?._id, selectedDate],
  );

  useEffect(() => {
    async function bootstrap() {
      try {
        setLoading(true);
        const openSessions = await fetchSessionsForDate(initialDateRef.current);
        setSessions(openSessions);
        setActiveSessionId(String(openSessions[0]?._id || ""));
      } catch (bootstrapError) {
        setError(bootstrapError.message || "Unable to load admin scanner");
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  useEffect(() => {
    async function loadSessionsForDate() {
      try {
        await refreshSessionsForDate(selectedDate);
      } catch (sessionError) {
        setSessions([]);
        setActiveSessionId("");
        setError(sessionError.message || "Unable to load session list");
      }
    }

    loadSessionsForDate();
  }, [selectedDate]);

  useEffect(() => {
    if (!scannerEnabled || !selectedDate) {
      return undefined;
    }

    let cancelled = false;
    let scannerStateEnum = null;

    async function startScanner() {
      try {
        const supportError = getCameraSupportError();
        if (supportError) {
          throw new Error(supportError);
        }

        const { Html5Qrcode, Html5QrcodeScannerState } = await import(
          "html5-qrcode"
        );
        scannerStateEnum = Html5QrcodeScannerState;
        const scanner = new Html5Qrcode("admin-qr-attendance-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 8,
            qrbox: { width: 240, height: 240 },
            aspectRatio: 1.2,
          },
          async (decodedText) => {
            const now = Date.now();
            if (
              decodedText === lastScanTextRef.current &&
              now - lastScanAtRef.current < 2500
            ) {
              return;
            }

            lastScanTextRef.current = decodedText;
            lastScanAtRef.current = now;

            try {
              await submitScan(decodedText, "camera");
            } catch {
              // handled in submitScan
            }
          },
          () => {},
        );

        if (cancelled && scannerRef.current === scanner) {
          const state = scanner.getState?.();
          if (
            state === Html5QrcodeScannerState.SCANNING ||
            state === Html5QrcodeScannerState.PAUSED
          ) {
            await scanner.stop().catch(() => {});
          }
          safeClearScanner(scanner);
          scannerRef.current = null;
        }
      } catch (scannerError) {
        if (!cancelled) {
          setError(scannerError.message || "Unable to start camera scanner");
          setScannerEnabled(false);
        }
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      const activeScanner = scannerRef.current;
      if (activeScanner) {
        Promise.resolve()
          .then(async () => {
            const state = activeScanner.getState?.();
            if (
              scannerStateEnum &&
              (state === scannerStateEnum.SCANNING ||
                state === scannerStateEnum.PAUSED)
            ) {
              await activeScanner.stop();
            }
          })
          .catch(() => {})
          .finally(() => {
            safeClearScanner(activeScanner);
            if (scannerRef.current === activeScanner) {
              scannerRef.current = null;
            }
          });
      }
    };
  }, [scannerEnabled, selectedDate, submitScan]);

  async function finalizeSession(sessionId = activeSession?._id) {
    if (!sessionId) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setMessage("");

      const res = await fetch("/api/admin/attendance/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sessionId,
          action: "finalize",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to finalize admin QR attendance");
      }

      setSessions(Array.isArray(data?.sessions) ? data.sessions : []);
      setActiveSessionId(String(data?.sessions?.[0]?._id || ""));
      setScannerEnabled(false);
      setMessage(data.message || "Admin QR attendance submitted for approval");
    } catch (finalizeError) {
      setError(finalizeError.message || "Failed to finalize admin QR attendance");
    } finally {
      setActionLoading(false);
    }
  }

  async function cancelSession(sessionId = activeSession?._id) {
    if (!sessionId) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setMessage("");

      const res = await fetch("/api/admin/attendance/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sessionId,
          action: "cancel",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to cancel admin QR session");
      }

      setSessions(Array.isArray(data?.sessions) ? data.sessions : []);
      setActiveSessionId(String(data?.sessions?.[0]?._id || ""));
      setScannerEnabled(false);
      setMessage(data.message || "Admin QR session cancelled");
    } catch (cancelError) {
      setError(cancelError.message || "Failed to cancel admin QR session");
    } finally {
      setActionLoading(false);
    }
  }

  async function finalizeAllSessions() {
    try {
      setActionLoading(true);
      setError("");
      setMessage("");

      const res = await fetch("/api/admin/attendance/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          date: selectedDate,
          action: "finalize_all",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to finalize admin QR attendance");
      }

      setSessions([]);
      setActiveSessionId("");
      setScannerEnabled(false);
      setMessage(data.message || "All admin QR sessions finalized");
    } catch (finalizeError) {
      setError(finalizeError.message || "Failed to finalize admin QR attendance");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleQrPhotoChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      setPhotoScanning(true);
      setError("");
      setMessage("");

      const { Html5Qrcode } = await import("html5-qrcode");
      const fileScanner = new Html5Qrcode("admin-qr-attendance-reader");

      try {
        const decodedText = await fileScanner.scanFile(file, false);
        await submitScan(decodedText, "manual");
      } finally {
        safeClearScanner(fileScanner);
      }
    } catch (photoError) {
      setError(
        photoError.message ||
          "Could not read a QR code from the selected photo",
      );
    } finally {
      setPhotoScanning(false);
    }
  }

  const openSessionCount = sessions.length;
  const allScans = [...sessions]
    .flatMap((sessionEntry) =>
      (Array.isArray(sessionEntry?.scans) ? sessionEntry.scans : []).map((scan) => ({
        ...scan,
        sessionCourse: sessionEntry.course,
        sessionYear: sessionEntry.year,
        sessionId: sessionEntry._id,
        sessionCode: sessionEntry.sessionCode,
      })),
    )
    .sort(
      (a, b) =>
        new Date(b.scannedAt || 0).getTime() - new Date(a.scannedAt || 0).getTime(),
    );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#eff6ff_0%,#f8fafc_42%,#fff7ed_100%)] px-4 py-6 md:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
              Admin QR Attendance
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
              Scan student QR cards for any batch from the admin panel
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">
              Use this when the admin office needs to mark a full batch. This
              flow is separate from faculty sessions and finalizes directly into
              approved attendance.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-6">
            <div className="rounded-[30px] border border-white/80 bg-white/92 p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.28)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                    Session Setup
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-slate-950">
                    Scan by date, auto-detect batch
                  </h2>
                </div>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <QrCode className="h-5 w-5" />
                </span>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Attendance Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => refreshSessionsForDate(selectedDate)}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Refresh Date Sessions
                </button>

                {openSessionCount > 0 ? (
                  <button
                    type="button"
                    onClick={finalizeAllSessions}
                    disabled={actionLoading}
                    className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-50"
                  >
                    Submit All Scanned ID Cards
                  </button>
                ) : null}
              </div>

              <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Auto Mode
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Select only the attendance date, then scan ID cards from any
                  course or year. The system creates the correct batch session
                  automatically for each student.
                </p>
                <p className="mt-3 text-sm font-semibold text-sky-700">
                  Open sessions on {selectedDate}: {openSessionCount}
                </p>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/80 bg-white/92 p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.28)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                    Scanner Controls
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-slate-950">
                    Camera and hardware scanner
                  </h2>
                </div>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Camera className="h-5 w-5" />
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setScannerEnabled((current) => !current)}
                  disabled={!selectedDate}
                  className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {scannerEnabled ? "Stop Camera Scanner" : "Start Camera Scanner"}
                </button>

                <button
                  type="button"
                  onClick={() => finalizeSession(activeSession?._id)}
                  disabled={
                    !activeSession?._id || activeSession?.status !== "open" || actionLoading
                  }
                  className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-50"
                >
                  Finalize Active Session
                </button>

                <button
                  type="button"
                  onClick={() => cancelSession(activeSession?._id)}
                  disabled={
                    !activeSession?._id || activeSession?.status !== "open" || actionLoading
                  }
                  className="rounded-2xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50 disabled:opacity-50"
                >
                  Cancel Active Session
                </button>
              </div>

              <div className="mt-4 rounded-[24px] border border-sky-100 bg-sky-50/80 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                  Phone Fallback
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  If live camera does not start on your phone, capture or upload
                  a QR photo here.
                </p>

                <label className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700">
                  {photoScanning ? "Reading QR Photo..." : "Capture / Upload QR Photo"}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleQrPhotoChange}
                    disabled={!selectedDate || photoScanning}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="mt-5 rounded-[26px] border border-slate-200 bg-slate-50 p-4">
                <div
                  id="admin-qr-attendance-reader"
                  className="min-h-[280px] overflow-hidden rounded-2xl bg-white"
                />
              </div>

              <div className="mt-5 rounded-[26px] border border-orange-100 bg-orange-50/85 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">
                  Hardware Scanner Input
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Scan the student QR here with a USB scanner and press Enter.
                </p>
                <input
                  type="text"
                  value={manualValue}
                  onChange={(e) => setManualValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && manualValue.trim()) {
                      e.preventDefault();
                      submitScan(manualValue.trim(), "hardware").catch(() => {});
                    }
                  }}
                  placeholder="Scan QR here and press Enter"
                  className="mt-4 w-full rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>

            {message ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {message}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            <div className="rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(239,246,255,0.96),rgba(236,253,245,0.94))] p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.28)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                    Scan Feed
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-slate-950">
                    Accepted students
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Mixed-batch scan feed for {selectedDate}. Each card is routed
                    to the correct course and year automatically.
                  </p>
                </div>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <ShieldCheck className="h-5 w-5" />
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {loading ? (
                  <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">
                    Loading scanner workspace...
                  </div>
                ) : allScans.length === 0 ? (
                  <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">
                    No student has been scanned in this session yet.
                  </div>
                ) : (
                  allScans.map((entry) => {
                    const isLatest =
                      String(entry.student?._id || "") === lastAcceptedStudentId;

                    return (
                      <div
                        key={entry._id}
                        className={`rounded-[24px] border px-4 py-4 shadow-sm ${
                          isLatest
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-950">
                              {entry.student?.name || "Student"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {entry.student?.course || "-"} | Year{" "}
                              {entry.student?.year || "-"}
                            </p>
                            <p className="mt-2 text-xs font-medium text-slate-500">
                              Source: {String(entry.scanSource || "camera").toUpperCase()}
                            </p>
                            <p className="mt-1 text-xs font-medium text-sky-700">
                              Batch: {entry.sessionCourse || "-"} | Year {entry.sessionYear || "-"}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Present
                            </span>
                            <p className="mt-2 text-xs text-slate-500">
                              {entry.scannedAt
                                ? new Date(entry.scannedAt).toLocaleTimeString()
                                : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="rounded-[30px] border border-white/80 bg-white/92 p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.28)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">
                    Open Sessions
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-slate-950">
                    Batch sessions for {selectedDate}
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {loading ? (
                  <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">
                    Loading sessions...
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">
                    No open batch sessions yet. Start scanning and they will open automatically.
                  </div>
                ) : (
                  sessions.map((entry) => {
                    const isActive =
                      String(entry?._id || "") === String(activeSession?._id || "");
                    const entryScans = Array.isArray(entry?.scans) ? entry.scans.length : 0;

                    return (
                      <div
                        key={entry._id}
                        className={`rounded-[24px] border px-4 py-4 shadow-sm ${
                          isActive
                            ? "border-sky-200 bg-sky-50"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-950">
                              {entry.course} Year {entry.year}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Session code: {entry.sessionCode} | Scans: {entryScans}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setActiveSessionId(String(entry._id))}
                              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              {isActive ? "Active" : "Make Active"}
                            </button>
                            <button
                              type="button"
                              onClick={() => finalizeSession(entry._id)}
                              disabled={actionLoading}
                              className="rounded-2xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                            >
                              Finalize
                            </button>
                            <button
                              type="button"
                              onClick={() => cancelSession(entry._id)}
                              disabled={actionLoading}
                              className="rounded-2xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
