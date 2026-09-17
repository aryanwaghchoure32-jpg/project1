import { db } from "@/db";
import {
  assignments,
  attendanceLogs,
  clubEvents,
  exams,
  subjects,
  timetableEntries,
} from "@/db/schema";
import { count } from "drizzle-orm";

function isoDatePlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function tsPlus(days: number, h = 17, m = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(h, m, 0, 0);
  return d;
}

export async function ensureSeeded() {
  const [{ value }] = await db.select({ value: count() }).from(subjects);
  if (value > 0) return { seeded: false };

  const seededSubjects = await db
    .insert(subjects)
    .values([
      { name: "Data Structures & Algorithms", code: "CS401", faculty: "Prof. S. Deshmukh", totalLectures: 28, attendedLectures: 22, color: "#1D4032" },
      { name: "Operating Systems", code: "CS402", faculty: "Prof. R. Patil", totalLectures: 26, attendedLectures: 18, color: "#8A5A00" },
      { name: "Database Management Systems", code: "CS403", faculty: "Prof. N. Kulkarni", totalLectures: 24, attendedLectures: 21, color: "#2F5D8A" },
      { name: "Computer Networks", code: "CS404", faculty: "Dr. A. Bhave", totalLectures: 20, attendedLectures: 13, color: "#B23A2A" },
      { name: "Engineering Mathematics IV", code: "MA401", faculty: "Prof. K. Joshi", totalLectures: 30, attendedLectures: 27, color: "#5B4A8A" },
      { name: "Microprocessors Lab", code: "CS405", faculty: "Prof. P. Wankhede", totalLectures: 14, attendedLectures: 13, color: "#3A7D5C" },
    ])
    .returning();

  const todayStr = isoDatePlus(0);
  // a couple of recent logs for texture
  const first = seededSubjects[0];
  if (first) {
    await db.insert(attendanceLogs).values([
      { subjectId: first.id, logDate: isoDatePlus(-1), status: "present" },
      { subjectId: first.id, logDate: todayStr, status: "present" },
    ]);
  }

  await db.insert(assignments).values([
    {
      title: "Subnetting worksheet + viva prep",
      subject: "Computer Networks",
      kind: "assignment",
      dueDate: tsPlus(-1, 23, 59),
      priority: "high",
      status: "pending",
      notes: "Sheet shared on class group PDF. 10 subnets + viva questions.",
    },
    {
      title: "Practical 5 — Banker's algorithm in C",
      subject: "Operating Systems",
      kind: "practical",
      dueDate: tsPlus(1, 14, 0),
      priority: "high",
      status: "pending",
      notes: "Show output to lab in-charge. Carry observation book.",
    },
    {
      title: "AVL tree implementation + analysis",
      subject: "Data Structures & Algorithms",
      kind: "assignment",
      dueDate: tsPlus(2, 23, 59),
      priority: "high",
      status: "pending",
      notes: "Push code to classroom repo. Include time-complexity note.",
    },
    {
      title: "ER diagram — hostel mess module",
      subject: "Database Management Systems",
      kind: "practical",
      dueDate: tsPlus(4, 17, 0),
      priority: "medium",
      status: "pending",
      notes: "Mini-project part 1. Use draw.io, export PDF.",
    },
    {
      title: "Tutorial sheet 7 — Laplace transforms",
      subject: "Engineering Mathematics IV",
      kind: "assignment",
      dueDate: tsPlus(6, 10, 0),
      priority: "medium",
      status: "pending",
      notes: "",
    },
    {
      title: "8085 interfacing report — stepper motor",
      subject: "Microprocessors Lab",
      kind: "practical",
      dueDate: tsPlus(8, 12, 0),
      priority: "low",
      status: "pending",
      notes: "File + graph sheets.",
    },
    {
      title: "DBMS Lab 4 — SQL joins record",
      subject: "Database Management Systems",
      kind: "practical",
      dueDate: tsPlus(-4, 12, 0),
      priority: "medium",
      status: "submitted",
      notes: "Submitted in lab.",
    },
  ]);

  await db.insert(exams).values([
    { subject: "Data Structures & Algorithms", code: "CS401", examDate: isoDatePlus(19), examTime: "10:00 AM – 1:00 PM", venue: "Block A · Room 204", units: "Units 1–3 · Trees, Graphs, Hashing" },
    { subject: "Operating Systems", code: "CS402", examDate: isoDatePlus(21), examTime: "10:00 AM – 1:00 PM", venue: "Block A · Room 204", units: "Units 1–3 · Scheduling, Deadlocks" },
    { subject: "Database Management Systems", code: "CS403", examDate: isoDatePlus(24), examTime: "2:00 PM – 5:00 PM", venue: "Block B · Room 112", units: "Units 1–4 · SQL, Normalisation" },
    { subject: "Computer Networks", code: "CS404", examDate: isoDatePlus(26), examTime: "10:00 AM – 1:00 PM", venue: "Block A · Room 205", units: "Units 1–3 · IP, TCP/UDP" },
    { subject: "Engineering Mathematics IV", code: "MA401", examDate: isoDatePlus(28), examTime: "10:00 AM – 1:00 PM", venue: "Main Hall · Seat plan on notice board", units: "Full syllabus · Laplace + PDE" },
  ]);

  await db.insert(timetableEntries).values([
    { day: "Mon", startTime: "09:00", endTime: "10:00", subject: "Data Structures & Algorithms", faculty: "S. Deshmukh", room: "A-204", kind: "lecture" },
    { day: "Mon", startTime: "10:00", endTime: "11:00", subject: "Operating Systems", faculty: "R. Patil", room: "A-204", kind: "lecture" },
    { day: "Mon", startTime: "11:15", endTime: "13:15", subject: "DBMS Lab (B1) / MP Lab (B2)", faculty: "N. Kulkarni", room: "Lab 3", kind: "lab" },
    { day: "Mon", startTime: "14:00", endTime: "15:00", subject: "Engineering Mathematics IV", faculty: "K. Joshi", room: "A-204", kind: "lecture" },
    { day: "Tue", startTime: "09:00", endTime: "10:00", subject: "Computer Networks", faculty: "A. Bhave", room: "A-205", kind: "lecture" },
    { day: "Tue", startTime: "10:00", endTime: "11:00", subject: "Database Management Systems", faculty: "N. Kulkarni", room: "A-204", kind: "lecture" },
    { day: "Tue", startTime: "11:15", endTime: "12:15", subject: "Operating Systems", faculty: "R. Patil", room: "A-204", kind: "lecture" },
    { day: "Tue", startTime: "13:00", endTime: "15:00", subject: "Microprocessors Lab", faculty: "P. Wankhede", room: "Lab 1", kind: "lab" },
    { day: "Wed", startTime: "09:00", endTime: "10:00", subject: "Engineering Mathematics IV", faculty: "K. Joshi", room: "A-204", kind: "lecture" },
    { day: "Wed", startTime: "10:00", endTime: "11:00", subject: "Data Structures & Algorithms", faculty: "S. Deshmukh", room: "A-204", kind: "lecture" },
    { day: "Wed", startTime: "11:15", endTime: "12:15", subject: "Computer Networks", faculty: "A. Bhave", room: "A-205", kind: "tutorial" },
    { day: "Thu", startTime: "09:00", endTime: "11:00", subject: "OS Lab (B1) / DSA Lab (B2)", faculty: "R. Patil", room: "Lab 2", kind: "lab" },
    { day: "Thu", startTime: "11:15", endTime: "12:15", subject: "Database Management Systems", faculty: "N. Kulkarni", room: "A-204", kind: "lecture" },
    { day: "Thu", startTime: "13:00", endTime: "14:00", subject: "Operating Systems", faculty: "R. Patil", room: "A-204", kind: "lecture" },
    { day: "Fri", startTime: "09:00", endTime: "10:00", subject: "Data Structures & Algorithms", faculty: "S. Deshmukh", room: "A-204", kind: "lecture" },
    { day: "Fri", startTime: "10:00", endTime: "11:00", subject: "Engineering Mathematics IV", faculty: "K. Joshi", room: "A-204", kind: "lecture" },
    { day: "Fri", startTime: "11:15", endTime: "12:15", subject: "Computer Networks", faculty: "A. Bhave", room: "A-205", kind: "lecture" },
    { day: "Fri", startTime: "13:00", endTime: "14:00", subject: "Mentor hour / Library", faculty: "Dept.", room: "A-204", kind: "tutorial" },
    { day: "Sat", startTime: "09:00", endTime: "11:00", subject: "Remedial + Club hour", faculty: "Dept.", room: "Seminar Hall", kind: "tutorial" },
    { day: "Sat", startTime: "11:15", endTime: "12:15", subject: "Aptitude / Placement prep", faculty: "T&P Cell", room: "Seminar Hall", kind: "lecture" },
  ]);

  await db.insert(clubEvents).values([
    {
      title: "Cultural auditions — dance & music",
      club: "Nirmiti · Cultural Club",
      eventDate: isoDatePlus(1),
      eventTime: "5:00 PM",
      venue: "Open Air Theatre",
      description: "Solo + group auditions for the inter-collegiate fest. 2-min performance.",
      registrationDeadline: isoDatePlus(0),
      registered: false,
      category: "culture",
    },
    {
      title: "Startup Yatra — alumni founder talk",
      club: "E-Cell GCE Nagpur",
      eventDate: isoDatePlus(2),
      eventTime: "4:00 PM",
      venue: "Seminar Hall B",
      description: "Two alumni founders on building from a tier-2 campus. Open Q&A.",
      registrationDeadline: isoDatePlus(1),
      registered: true,
      category: "talk",
    },
    {
      title: "Line-follower bot workshop",
      club: "Robotics Club",
      eventDate: isoDatePlus(3),
      eventTime: "10:00 AM",
      venue: "Innovation Lab",
      description: "Hands-on Arduino + IR sensors. Kits provided, teams of three.",
      registrationDeadline: isoDatePlus(2),
      registered: false,
      category: "workshop",
    },
    {
      title: "HackNight — 12-hour build sprint",
      club: "CodeCell · GDSC",
      eventDate: isoDatePlus(10),
      eventTime: "8:00 PM onwards",
      venue: "CSE Block Labs",
      description: "Overnight hackathon. Food + stay arranged. Theme revealed on spot.",
      registrationDeadline: isoDatePlus(7),
      registered: false,
      category: "hackathon",
    },
    {
      title: "Monsoon photo walk — Futala lake",
      club: "Pixel Photography Club",
      eventDate: isoDatePlus(4),
      eventTime: "6:30 AM",
      venue: "Futala Lake gate",
      description: "Easy morning walk. Phone cameras welcome.",
      registrationDeadline: isoDatePlus(3),
      registered: false,
      category: "outing",
    },
    {
      title: "Placement prep — resume roast",
      club: "T&P Cell",
      eventDate: isoDatePlus(5),
      eventTime: "3:00 PM",
      venue: "Placement Hall",
      description: "Seniors review resumes 1:1. Carry two printed copies.",
      registrationDeadline: isoDatePlus(4),
      registered: true,
      category: "career",
    },
  ]);

  return { seeded: true };
}
