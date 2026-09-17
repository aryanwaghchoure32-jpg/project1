import { db } from "@/db";
import { attendanceLogs, subjects } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json();
  const subjectId = Number(body.subjectId);
  const status = body.status === "absent" ? "absent" : "present";
  const logDate = body.date ? String(body.date).slice(0, 10) : new Date().toISOString().slice(0, 10);
  if (!subjectId) return Response.json({ error: "subjectId required" }, { status: 400 });

  const [sub] = await db.select().from(subjects).where(eq(subjects.id, subjectId));
  if (!sub) return Response.json({ error: "not found" }, { status: 404 });

  await db.insert(attendanceLogs).values({ subjectId, logDate, status });
  const total = (sub.totalLectures ?? 0) + 1;
  const attended = (sub.attendedLectures ?? 0) + (status === "present" ? 1 : 0);
  const [updated] = await db
    .update(subjects)
    .set({ totalLectures: total, attendedLectures: attended })
    .where(eq(subjects.id, subjectId))
    .returning();
  return Response.json(updated);
}
