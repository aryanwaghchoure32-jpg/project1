import { db } from "@/db";
import { clubEvents } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const patch: Partial<typeof clubEvents.$inferInsert> = {};
  if (body.registered !== undefined) patch.registered = Boolean(body.registered);
  if (body.title !== undefined) patch.title = String(body.title).slice(0, 160);
  if (body.description !== undefined) patch.description = String(body.description).slice(0, 500);
  const rows = await db.update(clubEvents).set(patch).where(eq(clubEvents.id, Number(id))).returning();
  return Response.json(rows[0] ?? null);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(clubEvents).where(eq(clubEvents.id, Number(id)));
  return Response.json({ ok: true });
}
