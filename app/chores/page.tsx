"use client";

import { useEffect, useState, useCallback } from "react";
import AddChoreForm from "@/components/AddChoreForm";
import type { Chore } from "@/lib/chores";

const RECURRENCE_LABELS: Record<string, string> = {
  none: "One-time",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ChoresPage() {
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(true);

  const loadChores = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/chores");
    setChores(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadChores();
  }, [loadChores]);

  useEffect(() => {
    const es = new EventSource("/api/events");
    es.onmessage = () => loadChores();
    return () => es.close();
  }, [loadChores]);

  async function deleteChore(id: number) {
    if (!confirm("Delete this chore and all its instances?")) return;
    await fetch("/api/chores", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadChores();
  }

  function recurrenceLabel(chore: Chore) {
    const base = RECURRENCE_LABELS[chore.recurrence] ?? chore.recurrence;
    if (chore.recurrence === "weekly" && chore.recurrence_day != null) {
      return `${base} (${DAY_NAMES[chore.recurrence_day]})`;
    }
    if (chore.recurrence === "monthly" && chore.recurrence_day != null) {
      return `${base} (day ${chore.recurrence_day})`;
    }
    return base;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Chores</h1>
        <AddChoreForm onAdded={loadChores} />
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : chores.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No chores yet.</p>
          <p className="text-sm mt-1">Add one to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Description</th>
                <th className="text-left px-4 py-3">Recurrence</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {chores.map((chore) => (
                <tr key={chore.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {chore.title}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {chore.category ? (
                      <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs">
                        {chore.category}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {chore.description || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs">
                      {recurrenceLabel(chore)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteChore(chore.id)}
                      className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
