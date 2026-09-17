import { db } from "@/db";
import { assignments } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const patch: Partial<typeof assignments.$inferInsert> = {};
  if (body.title !== undefined) patch.title = String(body.title).slice(0, 160);
  if (body.subject !== undefined) patch.subject = String(body.subject).slice(0, 120);
  if (body.kind !== undefined) patch.kind = body.kind === "practical" ? "practical" : "assignment";
  if (body.dueDate !== undefined) patch.dueDate = new Date(body.dueDate);
  if (body.priority !== undefined && ["low", "medium", "high"].includes(body.priority)) patch.priority = body.priority;
  if (body.status !== undefined && ["pending", "submitted"].includes(body.status)) patch.status = body.status;
  if (body.notes !== undefined) patch.notes = String(body.notes).slice(0, 500);
  const rows = await db.update(assignments).set(patch).where(eq(assignments.id, Number(id))).returning();
  return Response.json(rows[0] ?? null);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(assignments).where(eq(assignments.id, Number(id)));
  return Response.json({ ok: true });
}
