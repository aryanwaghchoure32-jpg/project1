import { db } from "@/db";
import { subjects } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";
const PALETTE = ["#1D4032", "#8A5A00", "#2F5D8A", "#B23A2A", "#5B4A8A", "#3A7D5C"];

export async function GET() {
  await ensureSeeded();
  const rows = await db.select().from(subjects).orderBy(asc(subjects.name));
  return Response.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const rows = await db
    .insert(subjects)
    .values({
      name: String(body.name ?? "New subject").slice(0, 120),
      code: String(body.code ?? "").slice(0, 20),
      faculty: String(body.faculty ?? "").slice(0, 120),
      totalLectures: Number(body.totalLectures ?? 0) || 0,
      attendedLectures: Number(body.attendedLectures ?? 0) || 0,
      color: String(body.color ?? PALETTE[Math.floor(Math.random() * PALETTE.length)]),
    })
    .returning();
  return Response.json(rows[0], { status: 201 });
}
