import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { TeamMember } from "@/lib/chores";
import { broadcast } from "@/lib/pubsub";

export function GET() {
  const db = getDb();
  const members = db
    .prepare<[], TeamMember>(
      "SELECT * FROM team_members ORDER BY rotation_order ASC, id ASC"
    )
    .all();
  return NextResponse.json(members);
}

export async function POST(req: NextRequest) {
  const { name, color = '#6366f1' } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const db = getDb();
  const maxOrder = (
    db
      .prepare<[], { max: number | null }>(
        "SELECT MAX(rotation_order) as max FROM team_members"
      )
      .get()?.max ?? -1
  );
  const result = db
    .prepare(
      "INSERT INTO team_members (name, rotation_order, color) VALUES (?, ?, ?)"
    )
    .run(name.trim(), maxOrder + 1, color);
  const member = db
    .prepare<[number], TeamMember>("SELECT * FROM team_members WHERE id = ?")
    .get(result.lastInsertRowid as number);
  broadcast("changed");
  return NextResponse.json(member, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  const db = getDb();
  // Reassign their instances to null (will show as unassigned)
  db.prepare("UPDATE chore_instances SET assigned_to = NULL WHERE assigned_to = ?").run(id);
  db.prepare("DELETE FROM team_members WHERE id = ?").run(id);
  broadcast("changed");
  return NextResponse.json({ ok: true });
}
