"use client";

import { useState } from "react";
import type { Recurrence } from "@/lib/chores";

interface Props {
  onAdded: () => void;
  defaultDate?: string;
  onClose?: () => void;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const COLORS = [
  { hex: "#ef4444", label: "Red" },
  { hex: "#f97316", label: "Orange" },
  { hex: "#eab308", label: "Yellow" },
  { hex: "#22c55e", label: "Green" },
  { hex: "#14b8a6", label: "Teal" },
  { hex: "#3b82f6", label: "Blue" },
  { hex: "#6366f1", label: "Indigo" },
  { hex: "#a855f7", label: "Purple" },
  { hex: "#ec4899", label: "Pink" },
  { hex: "#64748b", label: "Slate" },
];

export default function AddChoreForm({ onAdded, defaultDate, onClose }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [categoryColor, setCategoryColor] = useState(COLORS[7].hex); // purple default
  const [recurrence, setRecurrence] = useState<Recurrence>("none");
  const [recurrenceDay, setRecurrenceDay] = useState(1);
  const [dueDate, setDueDate] = useState(defaultDate ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/chores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          category_color: category.trim() ? categoryColor : undefined,
          recurrence,
          recurrence_day:
            recurrence === "weekly" || recurrence === "monthly"
              ? recurrenceDay
              : null,
          due_date: recurrence === "none" && dueDate ? dueDate : undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to add chore");
        return;
      }
      setTitle("");
      setDescription("");
      setCategory("");
      setCategoryColor(COLORS[7].hex);
      setRecurrence("none");
      setRecurrenceDay(1);
      setDueDate(defaultDate ?? "");
      setOpen(false);
      onClose?.();
      onAdded();
    } finally {
      setSaving(false);
    }
  }

  // When controlled externally (onClose provided), always show the form
  if (!onClose && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
      >
        + Add Chore
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4"
      >
        <h2 className="text-lg font-semibold">Add New Chore</h2>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Clean kitchen"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Optional details..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <input
            list="category-suggestions"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Kitchen"
          />
          <datalist id="category-suggestions">
            <option value="Kitchen" />
            <option value="Bathroom" />
            <option value="Common Areas" />
            <option value="Office" />
            <option value="Other" />
          </datalist>

          {/* Color picker — shown when a category name is entered */}
          {category.trim() && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-500">Color:</span>
              <div className="flex gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.label}
                    onClick={() => setCategoryColor(c.hex)}
                    className="w-5 h-5 rounded-full transition-transform hover:scale-110 focus:outline-none"
                    style={{
                      backgroundColor: c.hex,
                      outline: categoryColor === c.hex ? `2px solid ${c.hex}` : "none",
                      outlineOffset: "2px",
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recurrence
          </label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value as Recurrence)}
          >
            <option value="none">One-time</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {recurrence === "none" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due date
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        )}

        {recurrence === "weekly" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Day of week
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={recurrenceDay}
              onChange={(e) => setRecurrenceDay(Number(e.target.value))}
            >
              {DAY_NAMES.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        )}

        {recurrence === "monthly" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Day of month (1–28)
            </label>
            <input
              type="number"
              min={1}
              max={28}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={recurrenceDay}
              onChange={(e) =>
                setRecurrenceDay(
                  Math.max(1, Math.min(28, Number(e.target.value)))
                )
              }
            />
          </div>
        )}

        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={() => { setOpen(false); onClose?.(); }}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Add Chore"}
          </button>
        </div>
      </form>
    </div>
  );
}
