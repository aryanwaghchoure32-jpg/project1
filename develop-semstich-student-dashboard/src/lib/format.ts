export function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function daysUntil(target: Date | string): number {
  const t = startOfDay(new Date(target)).getTime();
  const n = startOfDay(new Date()).getTime();
  return Math.round((t - n) / 86400000);
}

export function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function fmtFull(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
}

export function fmtTime(d: Date | string): string {
  return new Date(d).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export function dueLabel(due: Date | string, status: string): { text: string; tone: "overdue" | "today" | "soon" | "later" | "done" } {
  if (status === "submitted") return { text: "Submitted", tone: "done" };
  const n = daysUntil(due);
  if (n < 0) return { text: `${Math.abs(n)}d overdue`, tone: "overdue" };
  if (n === 0) return { text: "Due today", tone: "today" };
  if (n === 1) return { text: "Due tomorrow", tone: "soon" };
  if (n <= 3) return { text: `In ${n} days`, tone: "soon" };
  return { text: `In ${n} days`, tone: "later" };
}

export function attendanceState(pct: number): { label: string; tone: string; hint: string } {
  if (pct >= 85) return { label: "Comfortable", tone: "#2F7A4E", hint: "You have room to breathe." };
  if (pct >= 75) return { label: "On the edge", tone: "#8A5A00", hint: "Don't skip the next few." };
  return { label: "Below 75% — act now", tone: "#B23A2A", hint: "Attend every class this week." };
}

export function safeBunks(total: number, attended: number): number {
  // bunks you can still take while staying >= 75%
  if (total === 0) return 0;
  let bunks = 0;
  while (total + bunks + 1 > 0 && ((attended / (total + bunks + 1)) * 100 >= 75)) bunks++;
  return bunks;
}

export function needToAttend(total: number, attended: number): number {
  // classes to attend consecutively to reach 75%
  let t = total;
  let a = attended;
  let n = 0;
  while (t > 0 && (a / t) * 100 < 75 && n < 60) {
    t++;
    a++;
    n++;
  }
  return (attended / Math.max(total, 1)) * 100 < 75 ? n : 0;
}

export const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DAY_FULL: Record<string, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

export function todayShort(): string {
  const map = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return map[new Date().getDay()];
}
