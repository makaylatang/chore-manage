"use client";

import { useState } from "react";
import type { TeamMember, Category } from "@/lib/chores";

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#6366f1", "#a855f7", "#ec4899", "#64748b",
];

interface Props {
  members: TeamMember[];
  selectedMembers: Set<number>;
  onToggleMember: (id: number) => void;
  categories: Category[];
  selectedCategories: Set<string>;
  onToggleCategory: (name: string) => void;
  onCategoryColorChange: (name: string, color: string) => void;
}

function ColorPopover({
  current,
  onSelect,
  onClose,
}: {
  current: string;
  onSelect: (c: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="absolute left-5 top-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex gap-1.5 flex-wrap w-36"
      onMouseLeave={onClose}
    >
      {COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => { onSelect(c); onClose(); }}
          className="w-5 h-5 rounded-full hover:scale-110 transition-transform focus:outline-none"
          style={{
            backgroundColor: c,
            outline: current === c ? `2px solid ${c}` : "none",
            outlineOffset: "2px",
          }}
        />
      ))}
    </div>
  );
}

export default function Sidebar({
  members,
  selectedMembers,
  onToggleMember,
  categories,
  selectedCategories,
  onToggleCategory,
  onCategoryColorChange,
}: Props) {
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  const allMembersSelected = members.every((m) => selectedMembers.has(m.id));
  const allCatsSelected =
    categories.length === 0 ||
    categories.every((c) => selectedCategories.has(c.name));

  function toggleAllMembers() {
    if (allMembersSelected) {
      members.forEach((m) => selectedMembers.has(m.id) && onToggleMember(m.id));
    } else {
      members.forEach((m) => !selectedMembers.has(m.id) && onToggleMember(m.id));
    }
  }

  function toggleAllCategories() {
    if (allCatsSelected) {
      categories.forEach((c) => selectedCategories.has(c.name) && onToggleCategory(c.name));
    } else {
      categories.forEach((c) => !selectedCategories.has(c.name) && onToggleCategory(c.name));
    }
  }

  return (
    <aside className="w-52 flex-shrink-0 space-y-6">
      {/* Team Members */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Team Members
          </span>
          <button
            onClick={toggleAllMembers}
            className="text-[10px] text-blue-500 hover:underline"
          >
            {allMembersSelected ? "None" : "All"}
          </button>
        </div>
        {members.length === 0 ? (
          <p className="text-xs text-gray-300 italic">No members yet</p>
        ) : (
          <ul className="space-y-1">
            {members.map((m) => {
              const checked = selectedMembers.has(m.id);
              return (
                <li key={m.id}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleMember(m.id)}
                      className="sr-only"
                    />
                    <span
                      className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors"
                      style={
                        checked
                          ? { backgroundColor: m.color, borderColor: "transparent" }
                          : { borderColor: "#d1d5db", backgroundColor: "white" }
                      }
                    >
                      {checked && (
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                          <path d="M1.5 5l2.5 2.5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </span>
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
                    <span className={`text-sm truncate max-w-[110px] ${checked ? "text-gray-800" : "text-gray-400"}`}>
                      {m.name}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Categories */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Categories
          </span>
          {categories.length > 0 && (
            <button
              onClick={toggleAllCategories}
              className="text-[10px] text-blue-500 hover:underline"
            >
              {allCatsSelected ? "None" : "All"}
            </button>
          )}
        </div>
        {categories.length === 0 ? (
          <p className="text-xs text-gray-300 italic">No categories yet</p>
        ) : (
          <ul className="space-y-1">
            {categories.map((cat) => {
              const checked = selectedCategories.has(cat.name);
              return (
                <li key={cat.name} className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleCategory(cat.name)}
                      className="sr-only"
                    />
                    <span
                      className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors"
                      style={
                        checked
                          ? { backgroundColor: cat.color, borderColor: "transparent" }
                          : { borderColor: "#d1d5db", backgroundColor: "white" }
                      }
                    >
                      {checked && (
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                          <path d="M1.5 5l2.5 2.5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </span>
                    <span className={`text-sm truncate max-w-[90px] ${checked ? "text-gray-800" : "text-gray-400"}`}>
                      {cat.name}
                    </span>
                  </label>

                  {/* Colored dot — click to edit color */}
                  <div className="relative flex-shrink-0">
                    <button
                      type="button"
                      title="Change color"
                      onClick={() => setOpenPopover(openPopover === cat.name ? null : cat.name)}
                      className="w-3 h-3 rounded-full hover:scale-125 transition-transform focus:outline-none"
                      style={{ backgroundColor: cat.color }}
                    />
                    {openPopover === cat.name && (
                      <ColorPopover
                        current={cat.color}
                        onSelect={(c) => onCategoryColorChange(cat.name, c)}
                        onClose={() => setOpenPopover(null)}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
