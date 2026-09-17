import { db } from "@/db";
import { assignments, clubEvents, exams, subjects, timetableEntries } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();
  const [s, a, e, t, ev] = await Promise.all([
    db.select().from(subjects).orderBy(asc(subjects.name)),
    db.select().from(assignments).orderBy(asc(assignments.dueDate)),
    db.select().from(exams).orderBy(asc(exams.examDate)),
    db.select().from(timetableEntries),
    db.select().from(clubEvents).orderBy(asc(clubEvents.eventDate)),
  ]);
  return Response.json({ subjects: s, assignments: a, exams: e, timetable: t, events: ev });
}
