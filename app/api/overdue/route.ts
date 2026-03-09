import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export function GET() {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const row = db
    .prepare<[string], { count: number }>(
      "SELECT COUNT(*) as count FROM chore_instances WHERE due_date < ? AND completed_at IS NULL"
    )
    .get(today)!;
  return NextResponse.json({ count: row.count });
}
