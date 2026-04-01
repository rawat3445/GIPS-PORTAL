"use client";

import { useId } from "react";
import { Activity, BarChart3, Target, TrendingUp } from "lucide-react";

function getMonthShortLabel(monthKey) {
  const [year, month] = String(monthKey || "").split("-").map(Number);

  if (!year || !month) return monthKey || "-";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(new Date(year, month - 1, 1));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getLinePath(points) {
  if (!points.length) return "";

  return points
    .map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
    )
    .join(" ");
}

function getAreaPath(points, floorY) {
  if (!points.length) return "";

  return `${getLinePath(points)} L ${points[points.length - 1].x.toFixed(2)} ${floorY.toFixed(
    2
  )} L ${points[0].x.toFixed(2)} ${floorY.toFixed(2)} Z`;
}

function getMomentumMeta(delta) {
  if (delta === null) {
    return {
      label: "New Trend",
      value: "No previous month yet",
      tone: "border-white/[0.12] bg-white/[0.06] text-slate-200",
      note: "We need one more marked month to compare the move.",
    };
  }

  if (delta >= 0) {
    return {
      label: "Uptrend",
      value: `+${delta}%`,
      tone: "border-emerald-400/25 bg-emerald-500/[0.12] text-emerald-100",
      note: "Attendance is climbing compared with the previous month.",
    };
  }

  return {
    label: "Pullback",
    value: `${delta}%`,
    tone: "border-rose-400/25 bg-rose-500/[0.12] text-rose-100",
    note: "There is a dip compared with the previous month.",
  };
}

function StatCard({ icon: Icon, label, value, note, accent }) {
  return (
    <div
      className={`rounded-[24px] border px-4 py-4 shadow-[0_22px_44px_-34px_rgba(15,23,42,0.85)] backdrop-blur ${accent}`}
    >
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-3 text-2xl font-semibold text-white sm:text-[1.75rem]">{value}</p>
      <p className="mt-2 text-xs leading-6 text-white/60">{note}</p>
    </div>
  );
}

export default function AttendancePerformanceChart({
  months = [],
  selectedMonthKey = "",
  title = "Attendance Performance",
  subtitle = "Track attendance percentage month by month.",
}) {
  const chartId = useId().replace(/:/g, "");
  const chartMonths = Array.isArray(months)
    ? months.filter((month) => (month?.workingDays || 0) > 0 || (month?.markedDays || 0) > 0)
    : [];

  if (!chartMonths.length) {
    return (
      <div className="overflow-hidden rounded-[30px] border border-emerald-400/[0.15] bg-[#050b08] p-5 text-emerald-50 shadow-[0_30px_90px_-42px_rgba(16,185,129,0.42)] md:p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
          <BarChart3 className="h-4 w-4" />
          Attendance Trend Graph
        </div>
        <h3 className="mt-3 text-xl font-semibold text-white">{title}</h3>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-emerald-50/70">{subtitle}</p>
        <div className="mt-5 rounded-[24px] border border-dashed border-emerald-400/20 bg-white/[0.03] px-4 py-6 text-sm text-emerald-50/70">
          The graph will appear once attendance is marked for at least one working month.
        </div>
      </div>
    );
  }

  const bestMonth = chartMonths.reduce((best, month) =>
    Number(month?.percentage || 0) > Number(best?.percentage || 0) ? month : best
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
  const previousMonth = selectedMonthIndex > 0 ? chartMonths[selectedMonthIndex - 1] : null;
  const selectedDelta = previousMonth
    ? Number(
        (
          Number(selectedMonth?.percentage || 0) -
          Number(previousMonth?.percentage || 0)
        ).toFixed(1)
      )
    : null;
  const momentum = getMomentumMeta(selectedDelta);

  const svgHeight = 320;
  const minChartWidth = Math.max(760, chartMonths.length * 110);
  const padding = { top: 26, right: 28, bottom: 68, left: 48 };
  const innerWidth = minChartWidth - padding.left - padding.right;
  const innerHeight = svgHeight - padding.top - padding.bottom;
  const floorY = svgHeight - padding.bottom;
  const divisionCount = Math.max(1, chartMonths.length - 1);

  const points = chartMonths.map((month, index) => {
    const percentage = clamp(Number(month?.percentage || 0), 0, 100);
    const x =
      chartMonths.length === 1
        ? padding.left + innerWidth / 2
        : padding.left + (innerWidth * index) / divisionCount;
    const y = padding.top + innerHeight - (percentage / 100) * innerHeight;

    return {
      ...month,
      shortLabel: getMonthShortLabel(month?.monthKey),
      percentage,
      x,
      y,
    };
  });

  const linePath = getLinePath(points);
  const areaPath = getAreaPath(points, floorY);
  const selectedPoint =
    points.find((point) => point?.monthKey === selectedMonth?.monthKey) || points[points.length - 1];
  const selectedBandWidth = Math.min(108, Math.max(72, minChartWidth / Math.max(points.length, 6.5)));
  const selectedBandX = clamp(
    selectedPoint.x - selectedBandWidth / 2,
    padding.left,
    minChartWidth - padding.right - selectedBandWidth
  );

  return (
    <div className="overflow-hidden rounded-[30px] border border-emerald-400/[0.18] bg-[#050b08] text-emerald-50 shadow-[0_34px_110px_-42px_rgba(16,185,129,0.38)]">
      <div className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.12),transparent_28%),radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_38%)]" />
        <div className="absolute -left-24 top-10 h-56 w-56 rounded-full bg-emerald-500/[0.12] blur-3xl" />
        <div className="absolute -right-20 top-0 h-64 w-64 rounded-full bg-cyan-400/[0.08] blur-3xl" />

        <div className="relative p-5 md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/[0.10] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300">
                <BarChart3 className="h-4 w-4" />
                Attendance Trend Graph
              </div>
              <h3 className="mt-3 text-xl font-semibold text-white md:text-[1.6rem]">{title}</h3>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-emerald-50/[0.68]">{subtitle}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={Target}
                label="Best Month"
                value={`${bestMonth?.percentage || 0}%`}
                note={bestMonth?.label || "-"}
                accent="border-emerald-400/[0.18] bg-white/[0.035]"
              />
              <StatCard
                icon={TrendingUp}
                label="Average"
                value={`${averagePercentage}%`}
                note={`Across ${chartMonths.length} month${chartMonths.length === 1 ? "" : "s"}`}
                accent="border-cyan-400/[0.18] bg-cyan-400/[0.05]"
              />
              <StatCard
                icon={Activity}
                label="Selected"
                value={`${selectedMonth?.percentage || 0}%`}
                note={selectedMonth?.label || "-"}
                accent="border-lime-400/[0.18] bg-lime-400/[0.05]"
              />
              <StatCard
                icon={BarChart3}
                label={momentum.label}
                value={momentum.value}
                note={momentum.note}
                accent={momentum.tone}
              />
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border border-white/[0.08] bg-black/[0.45] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-4">
            <div className="overflow-x-auto pb-2">
              <div style={{ minWidth: `${minChartWidth}px` }}>
                <svg
                  viewBox={`0 0 ${minChartWidth} ${svgHeight}`}
                  className="h-[320px] w-full"
                  role="img"
                  aria-label="Attendance percentage trend graph"
                >
                  <defs>
                    <linearGradient id={`grid-${chartId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.16)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
                    </linearGradient>
                    <linearGradient id={`line-${chartId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="48%" stopColor="#4ade80" />
                      <stop offset="100%" stopColor="#86efac" />
                    </linearGradient>
                    <linearGradient id={`area-${chartId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(74,222,128,0.3)" />
                      <stop offset="65%" stopColor="rgba(16,185,129,0.08)" />
                      <stop offset="100%" stopColor="rgba(5,11,8,0)" />
                    </linearGradient>
                    <filter id={`glow-${chartId}`} x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="6" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  <rect
                    x={0}
                    y={0}
                    width={minChartWidth}
                    height={svgHeight}
                    rx={26}
                    fill="rgba(5,11,8,0.72)"
                  />
                  <rect
                    x={selectedBandX}
                    y={padding.top - 6}
                    width={selectedBandWidth}
                    height={innerHeight + 16}
                    rx={20}
                    fill="rgba(74,222,128,0.08)"
                    stroke="rgba(74,222,128,0.14)"
                  />

                  {[0, 25, 50, 75, 100].map((mark) => {
                    const y = padding.top + innerHeight - (mark / 100) * innerHeight;

                    return (
                      <g key={mark}>
                        <line
                          x1={padding.left}
                          y1={y}
                          x2={minChartWidth - padding.right}
                          y2={y}
                          stroke={`url(#grid-${chartId})`}
                          strokeDasharray="4 8"
                        />
                        <text
                          x={12}
                          y={y + 4}
                          fill="rgba(226,232,240,0.55)"
                          fontSize="11"
                          fontWeight="600"
                        >
                          {mark}%
                        </text>
                      </g>
                    );
                  })}

                  {points.map((point) => (
                    <g key={`${point.monthKey}-stem`}>
                      <line
                        x1={point.x}
                        y1={point.y}
                        x2={point.x}
                        y2={floorY}
                        stroke="rgba(74,222,128,0.22)"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </g>
                  ))}

                  <path d={areaPath} fill={`url(#area-${chartId})`} />
                  <path
                    d={linePath}
                    fill="none"
                    stroke={`url(#line-${chartId})`}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter={`url(#glow-${chartId})`}
                  />

                  {points.map((point) => {
                    const isSelected = point.monthKey === selectedPoint.monthKey;

                    return (
                      <g key={point.monthKey}>
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r={isSelected ? 11 : 8}
                          fill="rgba(74,222,128,0.18)"
                        />
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r={isSelected ? 5.5 : 4}
                          fill={isSelected ? "#bbf7d0" : "#86efac"}
                          stroke={isSelected ? "#dcfce7" : "#bbf7d0"}
                          strokeWidth="2"
                        />
                        <text
                          x={point.x}
                          y={floorY + 26}
                          textAnchor="middle"
                          fill={isSelected ? "#dcfce7" : "rgba(226,232,240,0.65)"}
                          fontSize="12"
                          fontWeight={isSelected ? "700" : "600"}
                        >
                          {point.shortLabel}
                        </text>
                        <text
                          x={point.x}
                          y={floorY + 44}
                          textAnchor="middle"
                          fill={isSelected ? "#86efac" : "rgba(134,239,172,0.48)"}
                          fontSize="11"
                          fontWeight="600"
                        >
                          {point.percentage}%
                        </text>
                      </g>
                    );
                  })}

                  <g>
                    <rect
                      x={clamp(selectedPoint.x - 54, padding.left + 4, minChartWidth - padding.right - 108)}
                      y={clamp(selectedPoint.y - 58, padding.top + 6, floorY - 60)}
                      width="108"
                      height="38"
                      rx="14"
                      fill="rgba(2,6,23,0.92)"
                      stroke="rgba(74,222,128,0.35)"
                    />
                    <text
                      x={selectedPoint.x}
                      y={clamp(selectedPoint.y - 34, padding.top + 30, floorY - 36)}
                      textAnchor="middle"
                      fill="#dcfce7"
                      fontSize="14"
                      fontWeight="700"
                    >
                      {selectedPoint.percentage}% pulse
                    </text>
                  </g>
                </svg>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <div className="rounded-[24px] border border-emerald-400/[0.16] bg-emerald-500/[0.07] px-4 py-4">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                  <Activity className="h-4 w-4" />
                  Current Focus
                </div>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <p className="text-3xl font-semibold text-white">{selectedMonth?.percentage || 0}%</p>
                  <p className="pb-1 text-sm text-emerald-100/80">{selectedMonth?.label || "-"}</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-emerald-50/[0.74]">
                  {selectedMonth?.present || 0} present day
                  {selectedMonth?.present === 1 ? "" : "s"} out of{" "}
                  {selectedMonth?.workingDays || 0} working days in this month.
                </p>
              </div>

              <div className={`rounded-[24px] border px-4 py-4 ${momentum.tone}`}>
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em]">
                  <TrendingUp className="h-4 w-4" />
                  Monthly Comparison
                </div>
                <p className="mt-3 text-2xl font-semibold">{momentum.value}</p>
                <p className="mt-2 text-sm leading-6 text-current/80">
                  {selectedDelta === null
                    ? "A comparison card will light up once one more month is marked."
                    : `${selectedMonth?.label || "This month"} is ${
                        selectedDelta >= 0 ? "higher" : "lower"
                      } than ${previousMonth?.label || "the previous month"}.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
