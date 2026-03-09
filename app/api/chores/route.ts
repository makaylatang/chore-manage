import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { seedInstances, type Chore, type Recurrence } from "@/lib/chores";
import { broadcast } from "@/lib/pubsub";

export function GET() {
  const db = getDb();
  const chores = db
    .prepare<[], Chore>("SELECT * FROM chores ORDER BY created_at DESC")
    .all();
  return NextResponse.json(chores);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, description = "", category = "", category_color = "#a855f7", recurrence = "none", recurrence_day, due_date } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const db = getDb();
  const result = db
    .prepare(
      "INSERT INTO chores (title, description, category, recurrence, recurrence_day) VALUES (?, ?, ?, ?, ?)"
    )
    .run(title.trim(), description.trim(), category.trim(), recurrence, recurrence_day ?? null);

  const chore = db
    .prepare<[number], Chore>("SELECT * FROM chores WHERE id = ?")
    .get(result.lastInsertRowid as number)!;

  // Upsert category with chosen color (INSERT OR IGNORE preserves existing color)
  if (category.trim()) {
    db.prepare(
      "INSERT OR IGNORE INTO categories (name, color) VALUES (?, ?)"
    ).run(category.trim(), category_color);
  }

  seedInstances(chore, due_date);
  broadcast("changed");

  return NextResponse.json(chore, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  const db = getDb();
  db.prepare("DELETE FROM chores WHERE id = ?").run(id);
  broadcast("changed");
  return NextResponse.json({ ok: true });
}
