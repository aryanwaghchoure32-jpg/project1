import { db } from "@/db";
import { exams } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(exams).where(eq(exams.id, Number(id)));
  return Response.json({ ok: true });
}
