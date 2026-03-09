"use client";

import type { ChoreInstance } from "@/lib/chores";

interface Props {
  instance: ChoreInstance;
  today: string;
  onComplete: (id: number) => void;
}

export default function ChoreChip({ instance, today, onComplete }: Props) {
  const isCompleted = !!instance.completed_at;
  const isOverdue = !isCompleted && instance.due_date < today;

  let chipClass =
    "text-xs px-2 py-1.5 rounded-md mb-1 cursor-pointer select-none transition-opacity hover:opacity-80 border ";

  if (isCompleted) {
    chipClass += "bg-green-50 border-green-200 text-green-700";
  } else if (isOverdue) {
    chipClass += "bg-red-50 border-red-200 text-red-700";
  } else {
    chipClass += "bg-blue-50 border-blue-200 text-blue-700";
  }

  const memberColor = instance.member_color ?? "#6366f1";
  const catColor = instance.category_color ?? "#a855f7";

  return (
    <div
      className={chipClass}
      title={
        isCompleted
          ? "Completed"
          : isOverdue
          ? "Overdue — click to complete"
          : "Click to complete"
      }
      onClick={() => !isCompleted && onComplete(instance.id)}
    >
      <div className={`font-medium truncate max-w-[120px] ${isCompleted ? "line-through" : ""}`}>
        {instance.chore_title}
      </div>
      {instance.chore_category && (
        <div className="mt-0.5">
          <span
            className="inline-block text-[9px] font-medium px-1.5 py-0.5 rounded-full text-white truncate max-w-[115px]"
            style={{ backgroundColor: catColor }}
          >
            {instance.chore_category}
          </span>
        </div>
      )}
      {instance.member_name && (
        <div className="flex items-center gap-1 mt-0.5">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: memberColor }}
          />
          <span className="text-[10px] opacity-70 truncate max-w-[110px]">
            {instance.member_name}
          </span>
        </div>
      )}
    </div>
  );
}
