"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  format,
  isToday,
  isSameMonth,
  getDay,
} from "date-fns";
import ChoreChip from "./ChoreChip";
import AddChoreForm from "./AddChoreForm";
import type { ChoreInstance } from "@/lib/chores";

type View = "month" | "week";

const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Build the grid of days for the month view (Mon-anchored, 5 or 6 rows) */
function buildMonthGrid(anchor: Date): Date[] {
  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days: Date[] = [];
  let cur = gridStart;
  while (cur <= gridEnd) {
    days.push(cur);
    cur = addDays(cur, 1);
  }
  return days;
}

interface Props {
  filterMemberIds?: Set<number>;
  filterCategories?: Set<string>;
}

export default function WeekCalendar({ filterMemberIds, filterCategories }: Props) {
  const [view, setView] = useState<View>("month");
  const [anchorDate, setAnchorDate] = useState(() => startOfMonth(new Date()));
  const [instances, setInstances] = useState<ChoreInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [addChoreDate, setAddChoreDate] = useState<string | null>(null);

  const today = format(new Date(), "yyyy-MM-dd");

  // Compute visible days based on view
  const days =
    view === "week"
      ? Array.from({ length: 7 }, (_, i) => addDays(anchorDate, i))
      : buildMonthGrid(anchorDate);

  const fetchInstances = useCallback(async () => {
    setLoading(true);
    const from = format(days[0], "yyyy-MM-dd");
    const to = format(days[days.length - 1], "yyyy-MM-dd");
    try {
      const res = await fetch(`/api/instances?from=${from}&to=${to}`);
      setInstances(await res.json());
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorDate, view]);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  // Keep a ref so the SSE handler always calls the latest fetchInstances
  const fetchInstancesRef = useRef(fetchInstances);
  useEffect(() => { fetchInstancesRef.current = fetchInstances; }, [fetchInstances]);

  useEffect(() => {
    const es = new EventSource("/api/events");
    es.onmessage = () => fetchInstancesRef.current();
    return () => es.close();
  }, []);

  async function handleComplete(id: number) {
    setInstances((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, completed_at: new Date().toISOString() } : i
      )
    );
    await fetch("/api/instances", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchInstances();
  }

  function goToday() {
    setAnchorDate(
      view === "week"
        ? startOfWeek(new Date(), { weekStartsOn: 1 })
        : startOfMonth(new Date())
    );
  }

  function goPrev() {
    setAnchorDate((d) => (view === "week" ? subWeeks(d, 1) : subMonths(d, 1)));
  }

  function goNext() {
    setAnchorDate((d) => (view === "week" ? addWeeks(d, 1) : addMonths(d, 1)));
  }

  function switchView(v: View) {
    setView(v);
    // Snap anchor to appropriate start
    setAnchorDate(
      v === "week"
        ? startOfWeek(new Date(), { weekStartsOn: 1 })
        : startOfMonth(new Date())
    );
  }

  const headerLabel =
    view === "month"
      ? format(anchorDate, "MMMM yyyy")
      : `${format(days[0], "MMM d")} – ${format(days[6], "MMM d, yyyy")}`;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <button
          onClick={goPrev}
          className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-100 transition-colors"
        >
          ← Prev
        </button>
        <h2 className="text-base font-semibold text-gray-700 min-w-44 text-center">
          {headerLabel}
        </h2>
        <button
          onClick={goNext}
          className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-100 transition-colors"
        >
          Next →
        </button>
        <button
          onClick={goToday}
          className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Today
        </button>

        {/* View toggle pill */}
        <div className="ml-auto flex rounded-lg border border-gray-300 overflow-hidden text-sm">
          <button
            onClick={() => switchView("month")}
            className={`px-3 py-1.5 transition-colors ${
              view === "month"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => switchView("week")}
            className={`px-3 py-1.5 border-l border-gray-300 transition-colors ${
              view === "week"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            Weekly
          </button>
        </div>
      </div>

      {loading && <p className="text-sm text-gray-400 mb-2">Loading...</p>}

      {/* Day-of-week header row (month view only) */}
      {view === "month" && (
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_HEADERS.map((d) => (
            <div
              key={d}
              className="text-xs font-semibold text-gray-400 text-center py-1"
            >
              {d}
            </div>
          ))}
        </div>
      )}

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayKey = format(day, "yyyy-MM-dd");
          const dayInstances = instances.filter((i) => {
            if (i.due_date !== dayKey) return false;
            if (filterMemberIds && filterMemberIds.size > 0 && i.assigned_to != null && !filterMemberIds.has(i.assigned_to)) return false;
            if (filterCategories && filterCategories.size > 0 && i.chore_category && !filterCategories.has(i.chore_category)) return false;
            return true;
          });
          const isCurrentDay = isToday(day);
          const isCurrentMonth = view === "month" ? isSameMonth(day, anchorDate) : true;

          return (
            <div
              key={dayKey}
              onClick={view === "week" ? () => setAddChoreDate(dayKey) : undefined}
              className={`rounded-lg border flex flex-col ${
                view === "week" ? "min-h-32 p-2 cursor-pointer hover:border-blue-300" : "min-h-20 p-1.5"
              } ${
                isCurrentDay
                  ? "border-blue-400 bg-blue-50"
                  : isCurrentMonth
                  ? "border-gray-200 bg-white"
                  : "border-gray-100 bg-gray-50"
              }`}
            >
              {/* Day header */}
              <div className={`mb-1 ${view === "week" ? "mb-2" : ""}`}>
                {view === "week" && (
                  <div
                    className={`text-xs font-semibold ${
                      isCurrentDay ? "text-blue-700" : "text-gray-500"
                    }`}
                  >
                    {format(day, "EEE")}
                  </div>
                )}
                <div
                  className={`font-semibold leading-tight ${
                    view === "week" ? "text-lg" : "text-sm"
                  } ${
                    isCurrentDay
                      ? "text-blue-700"
                      : isCurrentMonth
                      ? "text-gray-800"
                      : "text-gray-300"
                  }`}
                >
                  {format(day, "d")}
                </div>
              </div>

              {/* Chore chips */}
              <div className="flex-1 overflow-y-auto">
                {view === "week" && dayInstances.length === 0 ? (
                  <div className="text-xs text-gray-300 italic">No chores</div>
                ) : (
                  dayInstances.map((inst) => (
                    <ChoreChip
                      key={inst.id}
                      instance={inst}
                      today={today}
                      onComplete={handleComplete}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {addChoreDate && (
        <AddChoreForm
          defaultDate={addChoreDate}
          onAdded={() => { setAddChoreDate(null); fetchInstances(); }}
          onClose={() => setAddChoreDate(null)}
        />
      )}

      {/* Legend */}
      <div className="flex gap-4 mt-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-blue-200 inline-block" /> Upcoming
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-200 inline-block" /> Completed
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-200 inline-block" /> Overdue
        </span>
      </div>
    </div>
  );
}
