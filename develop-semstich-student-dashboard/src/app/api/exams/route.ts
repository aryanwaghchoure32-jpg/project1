import { db } from "@/db";
import { exams } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();
  const rows = await db.select().from(exams).orderBy(asc(exams.examDate));
  return Response.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const rows = await db
    .insert(exams)
    .values({
      subject: String(body.subject ?? "New exam").slice(0, 120),
      code: String(body.code ?? "").slice(0, 20),
      examDate: String(body.examDate).slice(0, 10),
      examTime: String(body.examTime ?? "10:00 AM").slice(0, 60),
      venue: String(body.venue ?? "").slice(0, 160),
      units: String(body.units ?? "").slice(0, 300),
    })
    .returning();
  return Response.json(rows[0], { status: 201 });
}
