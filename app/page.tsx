"use client";

import { useEffect, useState, useCallback } from "react";
import WeekCalendar from "@/components/WeekCalendar";
import Sidebar from "@/components/Sidebar";
import type { TeamMember, Category } from "@/lib/chores";

export default function HomePage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Set<number>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  const loadSidebarData = useCallback(async () => {
    const [membersRes, catsRes] = await Promise.all([
      fetch("/api/team"),
      fetch("/api/categories"),
    ]);
    const membersData: TeamMember[] = await membersRes.json();
    const catsData: Category[] = await catsRes.json();

    setMembers(membersData);
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      membersData.forEach((m) => next.add(m.id));
      return next;
    });

    setCategories(catsData);
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      catsData.forEach((c) => next.add(c.name));
      return next;
    });
  }, []);

  useEffect(() => {
    loadSidebarData();
  }, [loadSidebarData]);

  useEffect(() => {
    const es = new EventSource("/api/events");
    es.onmessage = () => loadSidebarData();
    return () => es.close();
  }, [loadSidebarData]);

  function toggleMember(id: number) {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleCategory(name: string) {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  async function handleCategoryColorChange(name: string, color: string) {
    // Optimistic update
    setCategories((prev) =>
      prev.map((c) => (c.name === name ? { ...c, color } : c))
    );
    await fetch("/api/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Chore Calendar</h1>
      <div className="flex gap-6 items-start">
        <Sidebar
          members={members}
          selectedMembers={selectedMembers}
          onToggleMember={toggleMember}
          categories={categories}
          selectedCategories={selectedCategories}
          onToggleCategory={toggleCategory}
          onCategoryColorChange={handleCategoryColorChange}
        />
        <div className="flex-1 min-w-0">
          <WeekCalendar
            filterMemberIds={selectedMembers}
            filterCategories={selectedCategories}
          />
        </div>
      </div>
    </div>
  );
}
