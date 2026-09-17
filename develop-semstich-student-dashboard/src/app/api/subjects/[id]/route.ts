import { db } from "@/db";
import { attendanceLogs, subjects } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const patch: Partial<typeof subjects.$inferInsert> = {};
  if (body.name !== undefined) patch.name = String(body.name).slice(0, 120);
  if (body.code !== undefined) patch.code = String(body.code).slice(0, 20);
  if (body.faculty !== undefined) patch.faculty = String(body.faculty).slice(0, 120);
  if (body.totalLectures !== undefined) patch.totalLectures = Math.max(0, Number(body.totalLectures) || 0);
  if (body.attendedLectures !== undefined) patch.attendedLectures = Math.max(0, Number(body.attendedLectures) || 0);
  if (body.color !== undefined) patch.color = String(body.color).slice(0, 20);
  const rows = await db.update(subjects).set(patch).where(eq(subjects.id, Number(id))).returning();
  return Response.json(rows[0] ?? null);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(attendanceLogs).where(eq(attendanceLogs.subjectId, Number(id)));
  await db.delete(subjects).where(eq(subjects.id, Number(id)));
  return Response.json({ ok: true });
}
