import { db } from "@/db";
import { clubEvents } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();
  const rows = await db.select().from(clubEvents).orderBy(asc(clubEvents.eventDate));
  return Response.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const rows = await db
    .insert(clubEvents)
    .values({
      title: String(body.title ?? "New event").slice(0, 160),
      club: String(body.club ?? "Club").slice(0, 120),
      eventDate: String(body.eventDate).slice(0, 10),
      eventTime: String(body.eventTime ?? "5:00 PM").slice(0, 60),
      venue: String(body.venue ?? "").slice(0, 160),
      description: String(body.description ?? "").slice(0, 500),
      registrationDeadline: body.registrationDeadline ? String(body.registrationDeadline).slice(0, 10) : null,
      registered: false,
      category: String(body.category ?? "workshop").slice(0, 40),
    })
    .returning();
  return Response.json(rows[0], { status: 201 });
}
