import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { completeInstance, type ChoreInstance } from "@/lib/chores";
import { broadcast } from "@/lib/pubsub";

export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const db = getDb();

  let instances: ChoreInstance[];
  if (from && to) {
    instances = db
      .prepare<[string, string], ChoreInstance>(
        `SELECT ci.*, c.title as chore_title, c.category as chore_category, cat.color as category_color, c.recurrence as chore_recurrence, m.name as member_name, m.color as member_color
         FROM chore_instances ci
         JOIN chores c ON c.id = ci.chore_id
         LEFT JOIN categories cat ON cat.name = c.category
         LEFT JOIN team_members m ON m.id = ci.assigned_to
         WHERE ci.due_date >= ? AND ci.due_date <= ?
         ORDER BY ci.due_date ASC`
      )
      .all(from, to);
  } else {
    instances = db
      .prepare<[], ChoreInstance>(
        `SELECT ci.*, c.title as chore_title, c.category as chore_category, cat.color as category_color, c.recurrence as chore_recurrence, m.name as member_name, m.color as member_color
         FROM chore_instances ci
         JOIN chores c ON c.id = ci.chore_id
         LEFT JOIN categories cat ON cat.name = c.category
         LEFT JOIN team_members m ON m.id = ci.assigned_to
         ORDER BY ci.due_date ASC`
      )
      .all();
  }

  return NextResponse.json(instances);
}

export async function PATCH(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const instance = completeInstance(id);
  if (!instance) {
    return NextResponse.json({ error: "Instance not found" }, { status: 404 });
  }

  broadcast("changed");
  return NextResponse.json(instance);
}

// GET overdue count
export async function HEAD() {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const row = db
    .prepare<[string], { count: number }>(
      "SELECT COUNT(*) as count FROM chore_instances WHERE due_date < ? AND completed_at IS NULL"
    )
    .get(today)!;
  return new NextResponse(null, {
    headers: { "X-Overdue-Count": String(row.count) },
  });
}
