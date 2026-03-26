"use client";

import { BarChart3, Target, TrendingUp } from "lucide-react";

function getMonthShortLabel(monthKey) {
  const [year, month] = String(monthKey || "").split("-").map(Number);

  if (!year || !month) return monthKey || "-";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(new Date(year, month - 1, 1));
}

function getBarTone(percentage, isSelected) {
  if (isSelected) {
    return "from-blue-600 via-sky-500 to-cyan-400 shadow-[0_12px_22px_-12px_rgba(37,99,235,0.85)]";
  }

  if (percentage >= 75) {
    return "from-emerald-500 via-green-500 to-lime-400 shadow-[0_12px_22px_-12px_rgba(34,197,94,0.8)]";
  }

  if (percentage >= 60) {
    return "from-amber-500 via-orange-400 to-yellow-300 shadow-[0_12px_22px_-12px_rgba(245,158,11,0.8)]";
  }

  return "from-rose-500 via-red-500 to-orange-300 shadow-[0_12px_22px_-12px_rgba(239,68,68,0.8)]";
}

export default function AttendancePerformanceChart({
  months = [],
  selectedMonthKey = "",
  title = "Attendance Performance",
  subtitle = "Track attendance percentage month by month.",
}) {
  const chartMonths = Array.isArray(months)
    ? months.filter((month) => (month?.workingDays || 0) > 0 || (month?.markedDays || 0) > 0)
    : [];

  if (!chartMonths.length) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
          <BarChart3 className="h-4 w-4" />
          Performance Graph
        </div>
        <h3 className="mt-3 text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm leading-7 text-gray-500">
          {subtitle}
        </p>
        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-gray-600">
          The graph will appear once attendance is marked for at least one working month.
        </div>
      </div>
    );
  }

  const bestMonth = chartMonths.reduce((best, month) =>
    (month?.percentage || 0) > (best?.percentage || 0) ? month : best
  );

  const averagePercentage = Number(
    (
      chartMonths.reduce((total, month) => total + Number(month?.percentage || 0), 0) /
      chartMonths.length
    ).toFixed(1)
  );

  const selectedMonth =
    chartMonths.find((month) => month?.monthKey === selectedMonthKey) || chartMonths[chartMonths.length - 1];
  const selectedMonthIndex = chartMonths.findIndex(
    (month) => month?.monthKey === selectedMonth?.monthKey
  );
  const previousMonth =
    selectedMonthIndex > 0 ? chartMonths[selectedMonthIndex - 1] : null;
  const selectedDelta = previousMonth
    ? Number(
        (
          Number(selectedMonth?.percentage || 0) -
          Number(previousMonth?.percentage || 0)
        ).toFixed(1)
      )
    : null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            <BarChart3 className="h-4 w-4" />
            Performance Graph
          </div>
          <h3 className="mt-3 text-lg font-semibold text-gray-900">{title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-gray-500">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
              <Target className="h-3.5 w-3.5" />
              Best Month
            </div>
            <p className="mt-2 text-lg font-bold text-slate-900">
              {bestMonth?.percentage || 0}%
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {bestMonth?.label || "-"}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
              <TrendingUp className="h-3.5 w-3.5" />
              Average
            </div>
            <p className="mt-2 text-lg font-bold text-emerald-800">
              {averagePercentage}%
            </p>
            <p className="mt-1 text-xs text-emerald-700">
              Across {chartMonths.length} month{chartMonths.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
              <BarChart3 className="h-3.5 w-3.5" />
              Selected
            </div>
            <p className="mt-2 text-lg font-bold text-blue-800">
              {selectedMonth?.percentage || 0}%
            </p>
            <p className="mt-1 text-xs text-blue-700">
              {selectedMonth?.label || "-"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <div className="flex min-w-[620px] items-end gap-3 pb-2">
          {chartMonths.map((month) => {
            const isSelected = month?.monthKey === selectedMonth?.monthKey;
            const percentage = Number(month?.percentage || 0);
            const barHeight = Math.max(16, Math.round((percentage / 100) * 192));

            return (
              <div
                key={month?.monthKey}
                className={`flex min-w-[84px] flex-1 flex-col items-center gap-3 rounded-2xl border px-2 py-3 transition ${
                  isSelected
                    ? "border-blue-200 bg-blue-50/70"
                    : "border-transparent bg-slate-50/70"
                }`}
              >
                <div className="text-xs font-semibold text-slate-600">
                  {percentage}%
                </div>
                <div className="flex h-52 w-full items-end rounded-2xl bg-[linear-gradient(180deg,#eff6ff_0%,#f8fafc_46%,#eef2ff_100%)] px-2 py-3">
                  <div
                    className={`w-full rounded-xl bg-gradient-to-t ${getBarTone(
                      percentage,
                      isSelected
                    )}`}
                    style={{ height: `${barHeight}px` }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-900">
                    {getMonthShortLabel(month?.monthKey)}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500">
                    {month?.present || 0}/{month?.workingDays || 0} present
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Current focus: <span className="font-semibold text-gray-900">{selectedMonth?.label || "-"}</span> with{" "}
          <span className="font-semibold text-gray-900">
            {selectedMonth?.present || 0}
          </span>{" "}
          present day{selectedMonth?.present === 1 ? "" : "s"} out of{" "}
          <span className="font-semibold text-gray-900">
            {selectedMonth?.workingDays || 0}
          </span>
          .
        </p>
        <p
          className={`font-semibold ${
            selectedDelta === null
              ? "text-slate-600"
              : selectedDelta >= 0
              ? "text-emerald-700"
              : "text-red-700"
          }`}
        >
          {selectedDelta === null
            ? "No previous month to compare yet"
            : `${selectedDelta > 0 ? "+" : ""}${selectedDelta}% vs previous month`}
        </p>
      </div>
    </div>
  );
}
