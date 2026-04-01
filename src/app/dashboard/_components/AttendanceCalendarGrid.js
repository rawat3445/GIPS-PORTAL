"use client";

export default function AttendanceCalendarGrid({
  weekDays,
  monthGrid,
  monthKey,
  getStatusClasses,
  getStatusLabel,
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between rounded-full border border-sky-100 bg-sky-50/80 px-3 py-2 text-[11px] font-medium text-sky-700 sm:hidden">
        <span>Swipe calendar bar left or right</span>
        <span className="font-semibold tracking-[0.18em]">{"<- ->"}</span>
      </div>

      <div className="calendar-scrollbar overflow-x-auto pb-2">
        <div className="min-w-[680px] sm:min-w-0">
          <div className="grid grid-cols-7 gap-2 sm:gap-2 md:gap-3">
            {weekDays.map((day) => (
              <div
                key={day}
                className="pb-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 md:text-xs"
              >
                {day}
              </div>
            ))}

            {monthGrid.map((item, index) =>
              item ? (
                <div
                  key={`${monthKey}-${item.day}-${index}`}
                  className={`flex min-h-[92px] flex-col rounded-xl border p-3 sm:min-h-[88px] sm:p-3 ${getStatusClasses(
                    item.status,
                  )}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-bold">{item.day}</span>
                    <span className="max-w-[4.9rem] break-words text-right text-[10px] font-semibold leading-3 sm:max-w-none sm:text-[10px] sm:uppercase sm:tracking-[0.18em]">
                      {getStatusLabel(item.status)}
                    </span>
                  </div>

                  {item.note ? (
                    <p className="mt-2 hidden text-[11px] leading-4 sm:block">
                      {item.note}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div
                  key={`${monthKey}-empty-${index}`}
                  className="min-h-[84px] rounded-xl border border-transparent sm:min-h-[88px]"
                />
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
