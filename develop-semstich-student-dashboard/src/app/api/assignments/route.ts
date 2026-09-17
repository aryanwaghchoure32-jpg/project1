import { db } from "@/db";
import { assignments } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();
  const rows = await db.select().from(assignments).orderBy(asc(assignments.dueDate));
  return Response.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const rows = await db
    .insert(assignments)
    .values({
      title: String(body.title ?? "").slice(0, 160),
      subject: String(body.subject ?? "General").slice(0, 120),
      kind: body.kind === "practical" ? "practical" : "assignment",
      dueDate: new Date(body.dueDate),
      priority: ["low", "medium", "high"].includes(body.priority) ? body.priority : "medium",
      status: "pending",
      notes: String(body.notes ?? "").slice(0, 500),
    })
    .returning();
  return Response.json(rows[0], { status: 201 });
}
