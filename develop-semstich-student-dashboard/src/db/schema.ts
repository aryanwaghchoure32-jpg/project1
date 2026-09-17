import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  date,
  boolean,
} from "drizzle-orm/pg-core";

export const subjects = pgTable("semstich_subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  faculty: text("faculty").notNull(),
  totalLectures: integer("total_lectures").notNull().default(0),
  attendedLectures: integer("attended_lectures").notNull().default(0),
  color: text("color").notNull().default("#1D4032"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const attendanceLogs = pgTable("semstich_attendance_logs", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  logDate: date("log_date").notNull(),
  status: text("status").notNull(), // 'present' | 'absent'
  createdAt: timestamp("created_at").defaultNow(),
});

export const assignments = pgTable("semstich_assignments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  kind: text("kind").notNull().default("assignment"), // assignment | practical
  dueDate: timestamp("due_date").notNull(),
  priority: text("priority").notNull().default("medium"), // low | medium | high
  status: text("status").notNull().default("pending"), // pending | submitted
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const exams = pgTable("semstich_exams", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  code: text("code").notNull(),
  examDate: date("exam_date").notNull(),
  examTime: text("exam_time").notNull(),
  venue: text("venue").notNull(),
  units: text("units").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const timetableEntries = pgTable("semstich_timetable", {
  id: serial("id").primaryKey(),
  day: text("day").notNull(), // Mon | Tue | Wed | Thu | Fri | Sat
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  subject: text("subject").notNull(),
  faculty: text("faculty").notNull(),
  room: text("room").notNull(),
  kind: text("kind").notNull().default("lecture"), // lecture | lab | tutorial
});

export const clubEvents = pgTable("semstich_club_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  club: text("club").notNull(),
  eventDate: date("event_date").notNull(),
  eventTime: text("event_time").notNull(),
  venue: text("venue").notNull(),
  description: text("description").default(""),
  registrationDeadline: date("registration_deadline"),
  registered: boolean("registered").notNull().default(false),
  category: text("category").notNull().default("workshop"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Subject = typeof subjects.$inferSelect;
export type Assignment = typeof assignments.$inferSelect;
export type Exam = typeof exams.$inferSelect;
export type TimetableEntry = typeof timetableEntries.$inferSelect;
export type ClubEvent = typeof clubEvents.$inferSelect;
