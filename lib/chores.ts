import { getDb } from "./db";
import {
  addDays,
  addWeeks,
  addMonths,
  setDate,
  startOfWeek,
  format,
  parseISO,
} from "date-fns";

export type Recurrence = "none" | "daily" | "weekly" | "monthly";

export interface Chore {
  id: number;
  title: string;
  description: string;
  category: string;
  recurrence: Recurrence;
  recurrence_day: number | null;
  created_at: string;
}

export interface ChoreInstance {
  id: number;
  chore_id: number;
  assigned_to: number | null;
  due_date: string;
  completed_at: string | null;
  created_at: string;
  // joined fields
  chore_title?: string;
  chore_category?: string;
  category_color?: string | null;
  chore_recurrence?: Recurrence;
  member_name?: string | null;
  member_color?: string | null;
}

export interface Category {
  id: number;
  name: string;
  color: string;
}

export interface TeamMember {
  id: number;
  name: string;
  rotation_order: number;
  color: string;
  created_at: string;
}

/** Pick the next member in rotation after the last assignee for this chore */
export function getNextAssignee(choreId: number): number | null {
  const db = getDb();
  const members = db
    .prepare<[], TeamMember>(
      "SELECT * FROM team_members ORDER BY rotation_order ASC, id ASC"
    )
    .all();

  if (members.length === 0) return null;

  const last = db
    .prepare<[number], { assigned_to: number | null }>(
      "SELECT assigned_to FROM chore_instances WHERE chore_id = ? AND assigned_to IS NOT NULL ORDER BY due_date DESC, id DESC LIMIT 1"
    )
    .get(choreId);

  if (!last?.assigned_to) return members[0].id;

  const idx = members.findIndex((m) => m.id === last.assigned_to);
  const nextIdx = (idx + 1) % members.length;
  return members[nextIdx].id;
}

/** Compute the next due date for a recurring chore after a given date */
export function nextDueDate(
  recurrence: Recurrence,
  recurrenceDay: number | null,
  afterDate: Date
): Date | null {
  switch (recurrence) {
    case "daily":
      return addDays(afterDate, 1);
    case "weekly": {
      return addWeeks(afterDate, 1);
    }
    case "monthly": {
      const day = recurrenceDay ?? 1;
      const next = addMonths(afterDate, 1);
      return setDate(next, Math.min(day, 28));
    }
    default:
      return null;
  }
}

/** Generate initial instances when a chore is created (seeds 5 weeks ahead) */
export function seedInstances(chore: Chore, initialDueDate?: string) {
  const db = getDb();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (chore.recurrence === "none") {
    // Single instance due on the specified date, or today as fallback
    const assignee = getNextAssignee(chore.id);
    db.prepare(
      "INSERT INTO chore_instances (chore_id, assigned_to, due_date) VALUES (?, ?, ?)"
    ).run(chore.id, assignee, initialDueDate ?? format(today, "yyyy-MM-dd"));
    return;
  }

  // Find first due date
  let dueDate = getFirstDueDate(chore, today);
  const cutoff = addWeeks(today, 5);

  while (dueDate <= cutoff) {
    const assignee = getNextAssignee(chore.id);
    db.prepare(
      "INSERT INTO chore_instances (chore_id, assigned_to, due_date) VALUES (?, ?, ?)"
    ).run(chore.id, assignee, format(dueDate, "yyyy-MM-dd"));

    const next = nextDueDate(chore.recurrence, chore.recurrence_day, dueDate);
    if (!next) break;
    dueDate = next;
  }
}

function getFirstDueDate(chore: Chore, from: Date): Date {
  switch (chore.recurrence) {
    case "daily":
      return from;
    case "weekly": {
      const day = chore.recurrence_day ?? 1; // 0=Sun
      const weekStart = startOfWeek(from, { weekStartsOn: 0 });
      const candidate = addDays(weekStart, day);
      return candidate >= from ? candidate : addDays(candidate, 7);
    }
    case "monthly": {
      const day = chore.recurrence_day ?? 1;
      const candidate = setDate(from, Math.min(day, 28));
      return candidate >= from ? candidate : setDate(addMonths(from, 1), Math.min(day, 28));
    }
    default:
      return from;
  }
}

/** Mark an instance complete and schedule the next one */
export function completeInstance(instanceId: number): ChoreInstance | null {
  const db = getDb();
  const now = new Date().toISOString();

  const instance = db
    .prepare<[number], ChoreInstance>(
      "SELECT ci.*, c.recurrence as chore_recurrence, c.recurrence_day FROM chore_instances ci JOIN chores c ON c.id = ci.chore_id WHERE ci.id = ?"
    )
    .get(instanceId);

  if (!instance) return null;

  db.prepare("UPDATE chore_instances SET completed_at = ? WHERE id = ?").run(
    now,
    instanceId
  );

  const recurrence = (instance as any).chore_recurrence as Recurrence;
  const recurrenceDay = (instance as any).recurrence_day as number | null;

  if (recurrence !== "none") {
    const due = parseISO(instance.due_date);
    const nextDue = nextDueDate(recurrence, recurrenceDay, due);
    if (nextDue) {
      const nextDueStr = format(nextDue, "yyyy-MM-dd");
      const existing = db
        .prepare<[number, string], { id: number }>(
          "SELECT id FROM chore_instances WHERE chore_id = ? AND due_date = ?"
        )
        .get(instance.chore_id, nextDueStr);
      if (!existing) {
        const assignee = getNextAssignee(instance.chore_id);
        db.prepare(
          "INSERT INTO chore_instances (chore_id, assigned_to, due_date) VALUES (?, ?, ?)"
        ).run(instance.chore_id, assignee, nextDueStr);
      }
    }
  }

  return db
    .prepare<[number], ChoreInstance>(
      "SELECT ci.*, c.title as chore_title, c.category as chore_category, cat.color as category_color, c.recurrence as chore_recurrence, m.name as member_name, m.color as member_color FROM chore_instances ci JOIN chores c ON c.id = ci.chore_id LEFT JOIN categories cat ON cat.name = c.category LEFT JOIN team_members m ON m.id = ci.assigned_to WHERE ci.id = ?"
    )
    .get(instanceId)!;
}
