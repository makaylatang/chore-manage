"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { TeamMember } from "@/lib/chores";

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

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[6].hex);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/team");
    setMembers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    const es = new EventSource("/api/events");
    es.onmessage = () => loadMembers();
    return () => es.close();
  }, [loadMembers]);

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), color: selectedColor }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to add member");
        return;
      }
      setNewName("");
      setSelectedColor(COLORS[6].hex);
      inputRef.current?.focus();
      loadMembers();
    } finally {
      setSaving(false);
    }
  }

  async function deleteMember(id: number, name: string) {
    if (!confirm(`Remove ${name} from the team? Their chores will become unassigned.`)) return;
    await fetch("/api/team", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadMembers();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Team Members</h1>

      <form onSubmit={addMember} className="flex flex-wrap gap-3 items-end mb-8">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
          <input
            ref={inputRef}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-48"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Color</label>
          <div className="flex gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                title={c.label}
                onClick={() => setSelectedColor(c.hex)}
                className="w-6 h-6 rounded-full transition-transform hover:scale-110 focus:outline-none"
                style={{
                  backgroundColor: c.hex,
                  outline: selectedColor === c.hex ? `2px solid ${c.hex}` : "none",
                  outlineOffset: "2px",
                }}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || !newName.trim()}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Adding..." : "Add Member"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : members.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No team members yet.</p>
          <p className="text-sm mt-1">Add someone above to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden max-w-md">
          <ul className="divide-y divide-gray-100">
            {members.map((m, idx) => (
              <li
                key={m.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-8 h-8 rounded-full text-white text-sm font-semibold flex items-center justify-center"
                    style={{ backgroundColor: m.color ?? "#6366f1" }}
                  >
                    {m.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-gray-800 font-medium">{m.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">#{idx + 1} in rotation</span>
                  <button
                    onClick={() => deleteMember(m.id, m.name)}
                    className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
