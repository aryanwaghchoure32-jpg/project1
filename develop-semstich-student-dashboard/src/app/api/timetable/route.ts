import { db } from "@/db";
import { timetableEntries } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();
  const rows = await db.select().from(timetableEntries);
  return Response.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const rows = await db
    .insert(timetableEntries)
    .values({
      day: String(body.day ?? "Mon").slice(0, 10),
      startTime: String(body.startTime ?? "09:00").slice(0, 10),
      endTime: String(body.endTime ?? "10:00").slice(0, 10),
      subject: String(body.subject ?? "Free").slice(0, 160),
      faculty: String(body.faculty ?? "").slice(0, 120),
      room: String(body.room ?? "").slice(0, 60),
      kind: ["lecture", "lab", "tutorial"].includes(body.kind) ? body.kind : "lecture",
    })
    .returning();
  return Response.json(rows[0], { status: 201 });
}
