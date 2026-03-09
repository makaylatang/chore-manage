import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { Category } from "@/lib/chores";
import { broadcast } from "@/lib/pubsub";

export function GET() {
  const db = getDb();
  const cats = db
    .prepare<[], Category>("SELECT * FROM categories ORDER BY name ASC")
    .all();
  return NextResponse.json(cats);
}

export async function PATCH(req: NextRequest) {
  const { name, color } = await req.json();
  if (!name || !color) {
    return NextResponse.json({ error: "name and color required" }, { status: 400 });
  }
  const db = getDb();
  db.prepare("UPDATE categories SET color = ? WHERE name = ?").run(color, name);
  const cat = db
    .prepare<[string], Category>("SELECT * FROM categories WHERE name = ?")
    .get(name);
  broadcast("changed");
  return NextResponse.json(cat);
}
