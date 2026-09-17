"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DAY_ORDER,
  DAY_FULL,
  attendanceState,
  daysUntil,
  dueLabel,
  fmtDate,
  fmtFull,
  needToAttend,
  safeBunks,
  todayShort,
} from "@/lib/format";

/* ---------- types ---------- */
type Subject = { id: number; name: string; code: string; faculty: string; totalLectures: number; attendedLectures: number; color: string };
type Assignment = { id: number; title: string; subject: string; kind: string; dueDate: string; priority: string; status: string; notes: string };
type Exam = { id: number; subject: string; code: string; examDate: string; examTime: string; venue: string; units: string };
type Slot = { id: number; day: string; startTime: string; endTime: string; subject: string; faculty: string; room: string; kind: string };
type CEvent = { id: number; title: string; club: string; eventDate: string; eventTime: string; venue: string; description: string; registrationDeadline: string | null; registered: boolean; category: string };

type View = "today" | "assignments" | "attendance" | "exams" | "timetable" | "events";

const NAV: { id: View; label: string; note: string }[] = [
  { id: "today", label: "Today", note: "One glance" },
  { id: "assignments", label: "Deadlines", note: "Work due" },
  { id: "attendance", label: "Attendance", note: "Stay above 75%" },
  { id: "exams", label: "Exams", note: "Countdown" },
  { id: "timetable", label: "Timetable", note: "Week plan" },
  { id: "events", label: "Clubs", note: "Beyond class" },
];

/* ---------- tiny icons (stroke, no emoji) ---------- */
function I({ d, size = 17 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}
const P = {
  today: "M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  doc: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h6",
  ring: "M22 12a10 10 0 1 1-20 0 10 10 0 1 1 20 0zM12 6v6l4 2",
  exam: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  cal: "M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM9 14l2 2 4-4",
  spark: "M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  plus: "M12 5v14M5 12h14",
  check: "M20 6L9 17l-5-5",
  x: "M18 6L6 18M6 6l12 12",
  bell: "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  pin: "M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
};

/* ---------- small atoms ---------- */
function Caps({ children }: { children: React.ReactNode }) {
  return <p className="label-caps">{children}</p>;
}

function Pill({ tone, children }: { tone: "overdue" | "today" | "soon" | "later" | "done" | "warn" | "ok" | "mute"; children: React.ReactNode }) {
  const map: Record<string, string> = {
    overdue: "bg-[#B23A2A] text-white",
    today: "bg-[#1C3D2E] text-[#FFFDF7]",
    soon: "bg-[#F3D9A4] text-[#5C4309]",
    later: "bg-[#EDE7D3] text-[#57534A]",
    done: "bg-[#E7ECDF] text-[#2F7A4E]",
    warn: "bg-[#F7E5D7] text-[#8A3B12] border border-[#E8B98F]",
    ok: "bg-[#E7ECDF] text-[#245C3A]",
    mute: "bg-[#F1EDE0] text-[#8A857A]",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium leading-none ${map[tone]}`}>{children}</span>;
}

function Ring({ pct, color, size = 64 }: { pct: number; color: string; size?: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(Math.max(pct, 0), 100) / 100) * c;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <circle cx="32" cy="32" r={r} fill="none" stroke="#EDE7D3" strokeWidth="7" />
      <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 32 32)" />
      <text x="32" y="31" textAnchor="middle" fontSize="14" fontWeight="700" fill="#201D15" fontFamily="Inter">{Math.round(pct)}%</text>
      <text x="32" y="43" textAnchor="middle" fontSize="8" fill="#8A857A" fontFamily="IBM Plex Mono">ATTEND</text>
    </svg>
  );
}

function Modal({ onClose, title, sub, children }: { onClose: () => void; title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal>
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-[#18160F]/50 backdrop-blur-[2px]" />
      <div className="card-stitch relative w-full max-w-md p-7 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="label-caps">{sub}</p>
            <h3 className="font-display mt-1 text-[22px] leading-tight">{title}</h3>
          </div>
          <button onClick={onClose} className="rounded-full border border-[#E4DCC6] p-2 text-[#57534A] hover:bg-[#F3EFE4]"><I d={P.x} size={15} /></button>
        </div>
        <div className="thread-line my-4" />
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-[#E4DCC6] bg-white px-3.5 py-2.5 text-[14px] outline-none placeholder:text-[#B3AD9E] focus:border-[#1C3D2E] focus:ring-2 focus:ring-[#1C3D2E]/10";
const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-full bg-[#1C3D2E] px-5 py-2.5 text-[14px] font-semibold text-[#FFFDF7] hover:bg-[#142C21] transition";
const btnGhost = "inline-flex items-center justify-center gap-2 rounded-full border border-[#D8CFB6] bg-transparent px-5 py-2.5 text-[14px] font-semibold text-[#1C3D2E] hover:bg-[#EDE7D3] transition";

/* ================= MAIN ================= */
export default function Dashboard() {
  const [view, setView] = useState<View>("today");
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [events, setEvents] = useState<CEvent[]>([]);
  const [modal, setModal] = useState<null | "assignment" | "subject" | "exam" | "event" | "slot">(null);
  const [assignFilter, setAssignFilter] = useState<"all" | "pending" | "overdue" | "done">("all");
  const [dayTab, setDayTab] = useState<string>(todayShort() === "Sun" ? "Mon" : todayShort());

  const refresh = async () => {
    const r = await fetch("/api/overview", { cache: "no-store" });
    const j = await r.json();
    setSubjects(j.subjects ?? []);
    setAssignments(j.assignments ?? []);
    setExams(j.exams ?? []);
    setSlots(j.timetable ?? []);
    setEvents(j.events ?? []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const pending = useMemo(() => assignments.filter((a) => a.status !== "submitted"), [assignments]);
  const overdue = useMemo(() => pending.filter((a) => daysUntil(a.dueDate) < 0), [pending]);
  const dueTodayCount = useMemo(() => pending.filter((a) => daysUntil(a.dueDate) === 0).length, [pending]);
  const todaySlots = useMemo(() => {
    const d = todayShort();
    return slots.filter((s) => s.day === d).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [slots]);
  const todayEvents = useMemo(() => {
    const t = new Date().toISOString().slice(0, 10);
    return events.filter((e) => e.eventDate === t);
  }, [events]);
  const lowAttend = useMemo(
    () =>
      subjects
        .map((s) => ({ ...s, pct: s.totalLectures ? (s.attendedLectures / s.totalLectures) * 100 : 100 }))
        .filter((s) => s.pct < 75)
        .sort((a, b) => a.pct - b.pct),
    [subjects]
  );
  const nextExam = useMemo(() => {
    const up = exams.filter((e) => daysUntil(e.examDate) >= 0).sort((a, b) => +new Date(a.examDate) - +new Date(b.examDate));
    return up[0];
  }, [exams]);
  const overall = useMemo(() => {
    const t = subjects.reduce((x, s) => x + s.totalLectures, 0);
    const a = subjects.reduce((x, s) => x + s.attendedLectures, 0);
    return t ? (a / t) * 100 : 100;
  }, [subjects]);

  /* ----- actions ----- */
  async function toggleAssignment(a: Assignment) {
    const next = a.status === "submitted" ? "pending" : "submitted";
    setAssignments((p) => p.map((x) => (x.id === a.id ? { ...x, status: next } : x)));
    await fetch(`/api/assignments/${a.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
  }
  async function deleteAssignment(id: number) {
    setAssignments((p) => p.filter((x) => x.id !== id));
    await fetch(`/api/assignments/${id}`, { method: "DELETE" });
  }
  async function markAttend(id: number, status: "present" | "absent") {
    const r = await fetch("/api/attendance/mark", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subjectId: id, status }) });
    if (r.ok) {
      const u: Subject = await r.json();
      setSubjects((p) => p.map((x) => (x.id === id ? u : x)));
    }
  }
  async function toggleEvent(e: CEvent) {
    setEvents((p) => p.map((x) => (x.id === e.id ? { ...x, registered: !x.registered } : x)));
    await fetch(`/api/events/${e.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ registered: !e.registered }) });
  }
  async function deleteExam(id: number) {
    setExams((p) => p.filter((x) => x.id !== id));
    await fetch(`/api/exams/${id}`, { method: "DELETE" });
  }
  async function deleteSlot(id: number) {
    setSlots((p) => p.filter((x) => x.id !== id));
    await fetch(`/api/timetable/${id}`, { method: "DELETE" });
  }
  async function deleteEvent(id: number) {
    setEvents((p) => p.filter((x) => x.id !== id));
    await fetch(`/api/events/${id}`, { method: "DELETE" });
  }

  const filteredAssignments = useMemo(() => {
    let list = [...assignments].sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate));
    if (assignFilter === "pending") list = list.filter((a) => a.status !== "submitted");
    if (assignFilter === "done") list = list.filter((a) => a.status === "submitted");
    if (assignFilter === "overdue") list = list.filter((a) => a.status !== "submitted" && daysUntil(a.dueDate) < 0);
    return list;
  }, [assignments, assignFilter]);

  const todayName = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1240px] flex-col lg:flex-row">
        {/* ============ SIDEBAR ============ */}
        <aside className="lg:sticky lg:top-0 lg:h-screen lg:w-[290px] lg:shrink-0 lg:p-5">
          <div className="relative flex h-full flex-col overflow-hidden bg-[#142C21] text-[#F3EFE4] max-lg:rounded-b-[26px] lg:rounded-[22px]">
            <div className="pointer-events-none absolute inset-3 rounded-[16px] border border-dashed border-[#F3EFE4]/20" />
            {/* brand */}
            <div className="relative px-7 pb-5 pt-7">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#F3EFE4] text-[#142C21]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M4 20c4-1 5-4 6-7l7-7 1 1-7 7c-3 1-6 2-7 6z" />
                    <circle cx="18.5" cy="5.5" r="1.6" />
                    <path d="M4 20c2-4 6-6 10-7" strokeDasharray="2 2" />
                  </svg>
                </span>
                <div>
                  <p className="font-display text-[24px] font-semibold leading-none">SemStich</p>
                  <p className="mt-1 font-mono2 text-[10.5px] uppercase tracking-[0.18em] text-[#CBBFA3]">stitched for GCE Nagpur</p>
                </div>
              </div>
              <div className="mt-5 rounded-2xl bg-[#F3EFE4]/[.07] p-4">
                <p className="font-mono2 text-[10px] uppercase tracking-[0.16em] text-[#CBBFA3]">Govt. College of Engineering</p>
                <p className="mt-1 text-[14px] font-medium">B.Tech CSE · Sem IV · B-division</p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
                    <div className="h-full rounded-full bg-[#E8C86A]" style={{ width: `${Math.min(overall, 100)}%` }} />
                  </div>
                  <span className="font-mono2 text-[11px] text-[#E8C86A]">{Math.round(overall)}%</span>
                </div>
                <p className="mt-1 text-[12px] text-[#CBBFA3]">overall attendance</p>
              </div>
            </div>
            {/* nav */}
            <nav className="relative flex-1 space-y-1 overflow-y-auto px-4 max-lg:hidden">
              {NAV.map((n) => {
                const active = view === n.id;
                const count = n.id === "assignments" ? pending.length : n.id === "events" ? events.filter((e) => daysUntil(e.eventDate) >= 0).length : n.id === "exams" ? exams.length : null;
                return (
                  <button
                    key={n.id}
                    onClick={() => setView(n.id)}
                    className={`group flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition ${active ? "bg-[#F3EFE4] text-[#142C21]" : "text-[#D9D2BC] hover:bg-white/10 hover:text-white"}`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={active ? "text-[#142C21]" : "text-[#9AA88F]"}><I d={n.id === "today" ? P.today : n.id === "assignments" ? P.doc : n.id === "attendance" ? P.ring : n.id === "exams" ? P.exam : n.id === "timetable" ? P.cal : P.spark} /></span>
                      <span>
                        <span className="block text-[14.5px] font-semibold leading-tight">{n.label}</span>
                        <span className={`block text-[12px] ${active ? "text-[#5A6353]" : "text-[#8E967F]"}`}>{n.note}</span>
                      </span>
                    </span>
                    {count !== null && <span className={`rounded-full px-2 py-0.5 font-mono2 text-[11px] ${active ? "bg-[#142C21] text-[#F3EFE4]" : "bg-white/10"}`}>{count}</span>}
                  </button>
                );
              })}
            </nav>
            <div className="relative p-5 max-lg:hidden">
              <div className="rounded-2xl border border-dashed border-[#F3EFE4]/25 p-4">
                <p className="flex items-center gap-2 text-[13px] font-medium text-[#EFE8D2]"><I d={P.bell} size={15} /> Heads-up</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#B9B49E]">
                  {overdue.length > 0 ? `${overdue.length} overdue — clear the oldest first.` : lowAttend.length > 0 ? `${lowAttend[0].name} is at ${Math.round((lowAttend[0].attendedLectures / Math.max(lowAttend[0].totalLectures, 1)) * 100)}%. Go for the next class.` : "All quiet. Nothing overdue right now."}
                </p>
              </div>
              <p className="mt-4 px-1 font-mono2 text-[10px] uppercase tracking-[0.18em] text-[#7E826E]">SemStich · made for campus life</p>
            </div>
            {/* mobile nav */}
            <div className="relative flex gap-1 overflow-x-auto px-4 pb-4 no-scrollbar lg:hidden">
              {NAV.map((n) => (
                <button key={n.id} onClick={() => setView(n.id)} className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold ${view === n.id ? "bg-[#F3EFE4] text-[#142C21]" : "bg-white/10 text-[#D9D2BC]"}`}>{n.label}</button>
              ))}
            </div>
          </div>
        </aside>

        {/* ============ MAIN ============ */}
        <main className="paper-texture min-w-0 flex-1 px-4 pb-16 pt-6 sm:px-8 lg:px-10 lg:pt-8">
          {/* top strip */}
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="label-caps">Government College of Engineering · Nagpur</p>
              <h1 className="font-display mt-2 max-w-[560px] text-[clamp(28px,4vw,44px)] font-medium leading-[1.05]">
                {view === "today" && <>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}. Here&apos;s your day.</>}
                {view === "assignments" && <>Deadlines, without the panic.</>}
                {view === "attendance" && <>Attendance, honestly tracked.</>}
                {view === "exams" && <>Exams, counted down.</>}
                {view === "timetable" && <>Your week, stitched in.</>}
                {view === "events" && <>Campus, beyond the classroom.</>}
              </h1>
              <p className="mt-2 text-[14px] text-[#57534A]">{todayName} · {todaySlots.length} classes · {pending.length} open deadlines</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-2 rounded-full border border-[#D8CFB6] bg-[#FFFDF7] px-4 py-2 text-[13px] font-medium text-[#57534A] sm:inline-flex">
                <span className={`h-2 w-2 rounded-full ${overdue.length ? "bg-[#B23A2A] pulse-dot" : "bg-[#2F7A4E]"}`} />
                {overdue.length ? `${overdue.length} overdue` : "All caught up"}
              </span>
              <QuickAdd onPick={(k) => setModal(k)} />
            </div>
          </header>

          <div className="thread-line my-6" />

          {loading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="card-stitch h-40 animate-pulse" />)}
            </div>
          ) : (
            <>
              {view === "today" && (
                <TodayView
                  pending={pending} overdue={overdue} dueTodayCount={dueTodayCount}
                  todaySlots={todaySlots} todayEvents={todayEvents} lowAttend={lowAttend}
                  nextExam={nextExam} events={events} exams={exams}
                  onDone={toggleAssignment} go={setView}
                />
              )}
              {view === "assignments" && (
                <AssignmentsView list={filteredAssignments} filter={assignFilter} setFilter={setAssignFilter} onToggle={toggleAssignment} onDelete={deleteAssignment} onAdd={() => setModal("assignment")} />
              )}
              {view === "attendance" && (
                <AttendanceView subjects={subjects} onMark={markAttend} onAdd={() => setModal("subject")} />
              )}
              {view === "exams" && (
                <ExamsView exams={exams} onDelete={deleteExam} onAdd={() => setModal("exam")} />
              )}
              {view === "timetable" && (
                <TimetableView slots={slots} dayTab={dayTab} setDayTab={setDayTab} onDelete={deleteSlot} onAdd={() => setModal("slot")} />
              )}
              {view === "events" && (
                <EventsView events={events} onToggle={toggleEvent} onDelete={deleteEvent} onAdd={() => setModal("event")} />
              )}
            </>
          )}

          <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 text-[12.5px] text-[#8A857A]">
            <p>SemStich · stitched with care for GCE Nagpur students.</p>
            <p className="font-mono2 text-[11px] uppercase tracking-[0.14em]">CSE Sem IV · Winter 2026</p>
          </footer>
        </main>
      </div>

      {/* ---------- modals ---------- */}
      {modal === "assignment" && (
        <Modal onClose={() => setModal(null)} title="Add a deadline" sub="New entry">
          <AssignmentForm onDone={async () => { setModal(null); setLoading(true); await refresh(); }} />
        </Modal>
      )}
      {modal === "subject" && (
        <Modal onClose={() => setModal(null)} title="Add a subject" sub="Attendance">
          <SubjectForm onDone={async () => { setModal(null); setLoading(true); await refresh(); }} />
        </Modal>
      )}
      {modal === "exam" && (
        <Modal onClose={() => setModal(null)} title="Add an exam" sub="Countdown">
          <ExamForm onDone={async () => { setModal(null); setLoading(true); await refresh(); }} />
        </Modal>
      )}
      {modal === "event" && (
        <Modal onClose={() => setModal(null)} title="Add a club event" sub="Campus life">
          <EventForm onDone={async () => { setModal(null); setLoading(true); await refresh(); }} />
        </Modal>
      )}
      {modal === "slot" && (
        <Modal onClose={() => setModal(null)} title="Add a class" sub="Timetable">
          <SlotForm onDone={async () => { setModal(null); setLoading(true); await refresh(); }} />
        </Modal>
      )}
    </div>
  );
}

/* ================= QUICK ADD ================= */
function QuickAdd({ onPick }: { onPick: (k: "assignment" | "subject" | "exam" | "event" | "slot") => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className={btnPrimary}><I d={P.plus} size={15} /> Add</button>
      {open && (
        <>
          <button aria-label="close menu" className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-2xl border border-[#E4DCC6] bg-[#FFFDF7] p-1.5 shadow-xl">
            {([["assignment", "Deadline"], ["subject", "Subject"], ["exam", "Exam"], ["slot", "Class slot"], ["event", "Club event"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => { setOpen(false); onPick(k); }} className="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-[14px] font-medium hover:bg-[#F3EFE4]">{l}<span className="text-[#B3AD9E]">→</span></button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ================= TODAY ================= */
function TodayView({ pending, overdue, todaySlots, todayEvents, lowAttend, nextExam, events, exams, onDone, go }: {
  pending: Assignment[]; overdue: Assignment[]; dueTodayCount: number;
  todaySlots: Slot[]; todayEvents: CEvent[];
  lowAttend: (Subject & { pct: number })[]; nextExam: Exam | undefined;
  events: CEvent[]; exams: Exam[];
  onDone: (a: Assignment) => void; go: (v: View) => void;
}) {
  const attention = useMemo(() => {
    const list = [...pending].sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate)).slice(0, 4);
    return list;
  }, [pending]);
  const upcomingEvents = useMemo(() => events.filter((e) => daysUntil(e.eventDate) >= 0).slice(0, 3), [events]);

  return (
    <div className="space-y-5">
      {/* stat strip */}
      <div className="grid gap-4 sm:grid-cols-3">
        <button onClick={() => go("assignments")} className="card-stitch p-5 text-left transition hover:-translate-y-0.5">
          <Caps>Open deadlines</Caps>
          <p className="font-display mt-2 text-[38px] font-medium leading-none">{pending.length}</p>
          <p className="mt-2 text-[13px] text-[#57534A]">{overdue.length ? `${overdue.length} overdue — start there.` : "Nothing overdue. Nice."}</p>
        </button>
        <button onClick={() => go("timetable")} className="card-stitch p-5 text-left transition hover:-translate-y-0.5">
          <Caps>Classes today</Caps>
          <p className="font-display mt-2 text-[38px] font-medium leading-none">{todaySlots.length}</p>
          <p className="mt-2 text-[13px] text-[#57534A]">{todaySlots.length ? `${todaySlots[0].subject} at ${todaySlots[0].startTime} first.` : "No classes — a rare free day."}</p>
        </button>
        <button onClick={() => go("exams")} className="card-stitch relative overflow-hidden p-5 text-left transition hover:-translate-y-0.5">
          <Caps>Next exam</Caps>
          {nextExam ? (
            <>
              <p className="font-display mt-2 text-[38px] font-medium leading-none">{daysUntil(nextExam.examDate)}<span className="text-[18px] text-[#8A857A]"> days</span></p>
              <p className="mt-2 text-[13px] text-[#57534A]">{nextExam.subject} · {fmtDate(nextExam.examDate)}</p>
            </>
          ) : (
            <p className="font-display mt-2 text-[24px]">No exams lined up.</p>
          )}
        </button>
      </div>

      {/* warnings */}
      {(overdue.length > 0 || lowAttend.length > 0) && (
        <div className="rounded-[18px] border border-[#E4B48F] bg-[#FFF6EC] p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#B23A2A] text-white"><I d={P.bell} size={15} /></span>
            <p className="font-display text-[19px]">Needs your attention</p>
          </div>
          <div className="mt-3 space-y-2">
            {overdue.slice(0, 2).map((a) => (
              <p key={a.id} className="text-[14px] text-[#5A3A22]">· <b>{a.title}</b> went overdue {fmtDate(a.dueDate)}. Submit it before the next class.</p>
            ))}
            {lowAttend.slice(0, 2).map((s) => (
              <p key={s.id} className="text-[14px] text-[#5A3A22]">· <b>{s.name}</b> is at {Math.round(s.pct)}% — attend the next {needToAttend(s.totalLectures, s.attendedLectures) || 2} classes without fail.</p>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* left: attention + classes */}
        <div className="space-y-5">
          <section className="card-stitch p-6">
            <div className="flex items-center justify-between">
              <div><Caps>Up next</Caps><h2 className="font-display mt-1 text-[22px]">Closest deadlines</h2></div>
              <button onClick={() => go("assignments")} className="text-[13px] font-semibold text-[#1C3D2E] underline underline-offset-4">View all →</button>
            </div>
            <div className="mt-4 space-y-3">
              {attention.length === 0 && <p className="text-[14px] text-[#8A857A]">Nothing due. Enjoy the breather.</p>}
              {attention.map((a) => {
                const d = dueLabel(a.dueDate, a.status);
                return (
                  <div key={a.id} className="flex items-center gap-3 rounded-2xl border border-[#EDE7D3] bg-white p-3.5">
                    <button onClick={() => onDone(a)} aria-label="mark done" className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition ${a.status === "submitted" ? "border-[#2F7A4E] bg-[#2F7A4E] text-white" : "border-[#D8CFB6] text-transparent hover:border-[#1C3D2E]"}`}><I d={P.check} size={13} /></button>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-[14.5px] font-semibold ${a.status === "submitted" ? "line-through text-[#8A857A]" : ""}`}>{a.title}</p>
                      <p className="truncate text-[12.5px] text-[#8A857A]">{a.subject} · {a.kind} · {fmtDate(a.dueDate)}</p>
                    </div>
                    <Pill tone={d.tone}>{d.text}</Pill>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="card-stitch p-6">
            <div className="flex items-center justify-between">
              <div><Caps>Today · {DAY_FULL[todayShort()] ?? "Sunday"}</Caps><h2 className="font-display mt-1 text-[22px]">Classes today</h2></div>
              <button onClick={() => go("timetable")} className="text-[13px] font-semibold text-[#1C3D2E] underline underline-offset-4">Week →</button>
            </div>
            <div className="mt-4">
              {todaySlots.length === 0 ? (
                <div className="rounded-2xl bg-[#F6F2E7] p-5 text-center"><p className="font-display text-[18px]">Sunday. Rest, or catch up.</p><p className="mt-1 text-[13px] text-[#8A857A]">Library open 9–5 · No regular classes.</p></div>
              ) : (
                <ol className="relative space-y-0 border-l border-dashed border-[#C9BFA4] pl-0">
                  {todaySlots.map((s) => (
                    <li key={s.id} className="relative flex gap-4 pb-5 pl-6 last:pb-0">
                      <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[#1C3D2E] bg-[#F3EFE4]" />
                      <span className="w-[86px] shrink-0 font-mono2 text-[11.5px] leading-relaxed text-[#8A857A]">{s.startTime}<br />{s.endTime}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14.5px] font-semibold leading-snug">{s.subject}</p>
                        <p className="text-[12.5px] text-[#8A857A]">{s.faculty} · {s.room} · {s.kind}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>
        </div>

        {/* right rail */}
        <div className="space-y-5">
          <section className="overflow-hidden rounded-[18px] bg-[#1C3D2E] p-6 text-[#F3EFE4]">
            <Caps><span className="text-[#9AA88F]">Exam countdown</span></Caps>
            {nextExam ? (
              <>
                <p className="font-display mt-2 text-[26px] leading-tight">{nextExam.subject}</p>
                <p className="mt-1 font-mono2 text-[12px] text-[#CBBFA3]">{nextExam.code} · {fmtFull(nextExam.examDate)} · {nextExam.examTime}</p>
                <div className="mt-4 flex items-end gap-2">
                  <span className="font-display text-[64px] font-medium leading-none">{daysUntil(nextExam.examDate)}</span>
                  <span className="pb-2 text-[14px] text-[#CBBFA3]">days<br />to go</span>
                </div>
                <p className="mt-2 text-[13px] text-[#CBBFA3]">{nextExam.units}</p>
                <button onClick={() => go("exams")} className="mt-4 w-full rounded-full bg-[#F3EFE4] py-2.5 text-[14px] font-semibold text-[#142C21] hover:bg-white">See all {exams.length} exams</button>
              </>
            ) : <p className="mt-2">No exams scheduled.</p>}
          </section>

          <section className="card-stitch p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[20px]">Happening soon</h2>
              <button onClick={() => go("events")} className="text-[13px] font-semibold text-[#1C3D2E] underline underline-offset-4">Clubs →</button>
            </div>
            <div className="mt-4 space-y-3">
              {todayEvents.map((e) => (
                <div key={e.id} className="rounded-2xl bg-[#F7E5D7] p-4">
                  <Pill tone="today">Today · {e.eventTime}</Pill>
                  <p className="mt-2 text-[14.5px] font-semibold leading-snug">{e.title}</p>
                  <p className="text-[12.5px] text-[#8A5A40]">{e.club} · {e.venue}</p>
                </div>
              ))}
              {upcomingEvents.map((e) => (
                <div key={e.id} className="flex gap-3 rounded-2xl border border-[#EDE7D3] bg-white p-3.5">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#1C3D2E] text-center text-white">
                    <span><span className="block text-[16px] font-bold leading-none">{new Date(e.eventDate).getDate()}</span><span className="block text-[10px] uppercase">{new Date(e.eventDate).toLocaleDateString("en-IN", { month: "short" })}</span></span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold">{e.title}</p>
                    <p className="truncate text-[12.5px] text-[#8A857A]">{e.club} · {e.eventTime}</p>
                  </div>
                </div>
              ))}
              {upcomingEvents.length === 0 && todayEvents.length === 0 && <p className="text-[14px] text-[#8A857A]">No events this week.</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/* ================= ASSIGNMENTS ================= */
function AssignmentsView({ list, filter, setFilter, onToggle, onDelete, onAdd }: {
  list: Assignment[]; filter: string; setFilter: (f: "all" | "pending" | "overdue" | "done") => void;
  onToggle: (a: Assignment) => void; onDelete: (id: number) => void; onAdd: () => void;
}) {
  const tabs = [["all", "All"], ["pending", "Open"], ["overdue", "Overdue"], ["done", "Done"]] as const;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {tabs.map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className={`rounded-full px-4 py-2 text-[13.5px] font-semibold transition ${filter === k ? "bg-[#1C3D2E] text-white" : "border border-[#D8CFB6] bg-[#FFFDF7] text-[#57534A] hover:bg-[#EDE7D3]"}`}>{l}</button>
          ))}
        </div>
        <button onClick={onAdd} className={btnPrimary}><I d={P.plus} size={15} /> New deadline</button>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {list.map((a) => {
          const d = dueLabel(a.dueDate, a.status);
          return (
            <div key={a.id} className={`card-stitch p-5 ${a.status === "submitted" ? "opacity-70" : ""}`}>
              <div className="flex items-start gap-3">
                <button onClick={() => onToggle(a)} className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 ${a.status === "submitted" ? "border-[#2F7A4E] bg-[#2F7A4E] text-white" : "border-[#D8CFB6] text-transparent hover:border-[#1C3D2E]"}`}><I d={P.check} size={13} /></button>
                <div className="min-w-0 flex-1">
                  <p className={`text-[15.5px] font-semibold leading-snug ${a.status === "submitted" ? "line-through text-[#8A857A]" : ""}`}>{a.title}</p>
                  <p className="mt-0.5 text-[13px] text-[#8A857A]">{a.subject} · {a.kind === "practical" ? "Practical" : "Assignment"}</p>
                  {a.notes && <p className="mt-2 rounded-xl bg-[#F6F2E7] px-3 py-2 text-[13px] leading-relaxed text-[#57534A]">{a.notes}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Pill tone={d.tone}>{d.text}</Pill>
                    <span className="font-mono2 text-[11.5px] text-[#8A857A]">{fmtFull(a.dueDate)}</span>
                    <span className={`font-mono2 text-[11px] uppercase tracking-wider ${a.priority === "high" ? "text-[#B23A2A]" : a.priority === "medium" ? "text-[#8A5A00]" : "text-[#8A857A]"}`}>● {a.priority}</span>
                  </div>
                </div>
                <button onClick={() => onDelete(a.id)} className="rounded-full p-2 text-[#B3AD9E] hover:bg-[#F6E3D3] hover:text-[#B23A2A]"><I d={P.x} size={14} /></button>
              </div>
            </div>
          );
        })}
      </div>
      {list.length === 0 && (
        <div className="card-stitch mt-4 p-10 text-center">
          <p className="font-display text-[22px]">Nothing here.</p>
          <p className="mt-1 text-[14px] text-[#8A857A]">A clear list is a good list. Add the next deadline when it lands on the group chat.</p>
        </div>
      )}
    </div>
  );
}

/* ================= ATTENDANCE ================= */
function AttendanceView({ subjects, onMark, onAdd }: { subjects: Subject[]; onMark: (id: number, s: "present" | "absent") => void; onAdd: () => void }) {
  return (
    <div>
      <div className="rounded-[18px] border border-[#E4DCC6] bg-[#FFFDF7] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Caps>The 75% rule</Caps>
            <p className="font-display mt-1 text-[22px] leading-snug">GCE Nagpur requires 75% to sit for university exams. We warn you at 80% itself.</p>
          </div>
          <button onClick={onAdd} className={btnGhost}><I d={P.plus} size={15} /> Subject</button>
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {subjects.map((s) => {
          const pct = s.totalLectures ? (s.attendedLectures / s.totalLectures) * 100 : 100;
          const st = attendanceState(pct);
          const bunks = safeBunks(s.totalLectures, s.attendedLectures);
          const need = needToAttend(s.totalLectures, s.attendedLectures);
          return (
            <div key={s.id} className="card-stitch p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono2 text-[11px] uppercase tracking-[0.12em] text-[#8A857A]">{s.code}</p>
                  <p className="truncate text-[15.5px] font-semibold leading-snug">{s.name}</p>
                  <p className="truncate text-[12.5px] text-[#8A857A]">{s.faculty}</p>
                </div>
                <Ring pct={pct} color={s.color} />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#EDE7D3]">
                  <span className="block h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: st.tone }} />
                </span>
              </div>
              <p className="mt-2 text-[13px]"><b style={{ color: st.tone }}>{st.label}.</b> <span className="text-[#57534A]">{s.attendedLectures}/{s.totalLectures} present. {need > 0 ? `Attend next ${need} to recover.` : bunks > 0 ? `${bunks} safe skip${bunks > 1 ? "s" : ""} left.` : "No skips left."}</span></p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button onClick={() => onMark(s.id, "present")} className="rounded-full bg-[#1C3D2E] py-2 text-[13.5px] font-semibold text-white hover:bg-[#142C21]">Present +1</button>
                <button onClick={() => onMark(s.id, "absent")} className="rounded-full border border-[#D8CFB6] py-2 text-[13.5px] font-semibold text-[#57534A] hover:bg-[#F6E3D3] hover:text-[#8A3B12]">Absent +1</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================= EXAMS ================= */
function ExamsView({ exams, onDelete, onAdd }: { exams: Exam[]; onDelete: (id: number) => void; onAdd: () => void }) {
  const sorted = [...exams].sort((a, b) => +new Date(a.examDate) - +new Date(b.examDate));
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[14px] text-[#57534A]">Winter 2026 university exams · prepare unit-wise, not all at once.</p>
        <button onClick={onAdd} className={btnPrimary}><I d={P.plus} size={15} /> Exam</button>
      </div>
      <div className="mt-5 space-y-4">
        {sorted.map((e, i) => {
          const n = daysUntil(e.examDate);
          return (
            <div key={e.id} className="card-stitch flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
              <div className="flex shrink-0 items-center gap-4 sm:w-[190px]">
                <div className="grid h-[74px] w-[74px] shrink-0 place-items-center rounded-2xl bg-[#1C3D2E] text-white">
                  <span className="text-center"><span className="font-display block text-[28px] font-semibold leading-none">{n < 0 ? "–" : n}</span><span className="font-mono2 text-[10px] uppercase tracking-widest opacity-70">{n < 0 ? "done" : n === 1 ? "day left" : "days left"}</span></span>
                </div>
                <span className="font-mono2 text-[11px] text-[#8A857A] sm:hidden">{fmtDate(e.examDate)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mono2 text-[11px] uppercase tracking-[0.12em] text-[#8A857A]">{e.code} · Exam {i + 1} of {sorted.length}</p>
                <p className="font-display text-[21px] leading-tight">{e.subject}</p>
                <p className="mt-1 text-[13.5px] text-[#57534A]">{fmtFull(e.examDate)} · {e.examTime} · {e.venue}</p>
                {e.units && <p className="mt-2 inline-block rounded-full bg-[#F6F2E7] px-3 py-1 text-[12.5px] text-[#57534A]">{e.units}</p>}
              </div>
              <button onClick={() => onDelete(e.id)} className="self-start rounded-full p-2 text-[#B3AD9E] hover:bg-[#F6E3D3] hover:text-[#B23A2A]"><I d={P.x} size={14} /></button>
            </div>
          );
        })}
        {sorted.length === 0 && <div className="card-stitch p-10 text-center"><p className="font-display text-[22px]">No exams on the board.</p></div>}
      </div>
    </div>
  );
}

/* ================= TIMETABLE ================= */
function TimetableView({ slots, dayTab, setDayTab, onDelete, onAdd }: { slots: Slot[]; dayTab: string; setDayTab: (d: string) => void; onDelete: (id: number) => void; onAdd: () => void }) {
  const perDay = useMemo(() => {
    const m: Record<string, Slot[]> = {};
    for (const d of DAY_ORDER) m[d] = slots.filter((s) => s.day === d).sort((a, b) => a.startTime.localeCompare(b.startTime));
    return m;
  }, [slots]);
  const list = perDay[dayTab] ?? [];
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {DAY_ORDER.map((d) => (
            <button key={d} onClick={() => setDayTab(d)} className={`rounded-full px-4 py-2 text-[13.5px] font-semibold transition ${dayTab === d ? "bg-[#1C3D2E] text-white" : "border border-[#D8CFB6] bg-[#FFFDF7] text-[#57534A]"} ${d === todayShort() ? "ring-2 ring-[#C05A2A]/40 ring-offset-1" : ""}`}>{d}{d === todayShort() ? " ·" : ""}</button>
          ))}
        </div>
        <button onClick={onAdd} className={btnPrimary}><I d={P.plus} size={15} /> Class</button>
      </div>
      <div className="card-stitch mt-5 p-6">
        <Caps>{DAY_FULL[dayTab]} · {(perDay[dayTab] ?? []).length} sessions</Caps>
        <h2 className="font-display mt-1 text-[24px]">{dayTab === todayShort() ? "Today's lineup" : `${DAY_FULL[dayTab]}'s lineup`}</h2>
        <div className="mt-5 space-y-3">
          {list.map((s) => (
            <div key={s.id} className="flex items-center gap-4 rounded-2xl border border-[#EDE7D3] bg-white p-4">
              <span className="w-[92px] shrink-0 font-mono2 text-[12px] leading-relaxed text-[#57534A]">{s.startTime}<br /><span className="text-[#B3AD9E]">→ {s.endTime}</span></span>
              <span className={`h-11 w-1 shrink-0 rounded-full ${s.kind === "lab" ? "bg-[#C05A2A]" : s.kind === "tutorial" ? "bg-[#B98A1D]" : "bg-[#1C3D2E]"}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold">{s.subject}</p>
                <p className="truncate text-[12.5px] text-[#8A857A]">{s.faculty} · {s.room} · {s.kind}</p>
              </div>
              <button onClick={() => onDelete(s.id)} className="rounded-full p-2 text-[#B3AD9E] hover:bg-[#F6E3D3] hover:text-[#B23A2A]"><I d={P.x} size={14} /></button>
            </div>
          ))}
          {list.length === 0 && <p className="rounded-2xl bg-[#F6F2E7] p-6 text-center text-[14px] text-[#8A857A]">No classes scheduled. A good day for the library.</p>}
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {DAY_ORDER.filter((d) => d !== dayTab).slice(0, 3).map((d) => (
          <button key={d} onClick={() => setDayTab(d)} className="card-stitch p-4 text-left hover:-translate-y-0.5 transition">
            <Caps>{DAY_FULL[d]}</Caps>
            <p className="font-display mt-1 text-[18px]">{(perDay[d] ?? []).length} sessions</p>
            <p className="truncate text-[12.5px] text-[#8A857A]">{(perDay[d] ?? [])[0]?.subject ?? "—"}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ================= EVENTS ================= */
function EventsView({ events, onToggle, onDelete, onAdd }: { events: CEvent[]; onToggle: (e: CEvent) => void; onDelete: (id: number) => void; onAdd: () => void }) {
  const sorted = [...events].sort((a, b) => +new Date(a.eventDate) - +new Date(b.eventDate));
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[14px] text-[#57534A]">Fests, workshops, hackathons — register before the form closes.</p>
        <button onClick={onAdd} className={btnPrimary}><I d={P.plus} size={15} /> Event</button>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {sorted.map((e) => {
          const n = daysUntil(e.eventDate);
          const regN = e.registrationDeadline ? daysUntil(e.registrationDeadline) : null;
          return (
            <div key={e.id} className="card-stitch p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-[#E4DCC6] bg-[#F6F2E7] text-center">
                    <span><span className="block text-[19px] font-bold leading-none">{new Date(e.eventDate).getDate()}</span><span className="block font-mono2 text-[10px] uppercase text-[#8A857A]">{new Date(e.eventDate).toLocaleDateString("en-IN", { month: "short" })}</span></span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono2 text-[11px] uppercase tracking-[0.12em] text-[#8A857A]">{e.club}</p>
                    <p className="text-[15.5px] font-semibold leading-snug">{e.title}</p>
                  </div>
                </div>
                <button onClick={() => onDelete(e.id)} className="rounded-full p-1.5 text-[#B3AD9E] hover:bg-[#F6E3D3] hover:text-[#B23A2A]"><I d={P.x} size={13} /></button>
              </div>
              <p className="mt-3 line-clamp-2 text-[13.5px] leading-relaxed text-[#57534A]">{e.description}</p>
              <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-[#8A857A]"><I d={P.pin} size={13} /> {e.venue} · {e.eventTime}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {n < 0 ? <Pill tone="mute">Over</Pill> : n === 0 ? <Pill tone="today">Today</Pill> : <Pill tone="later">In {n} days</Pill>}
                {regN !== null && regN >= 0 && !e.registered && <Pill tone="warn">Register by {fmtDate(e.registrationDeadline!)} {regN === 0 ? "(today!)" : ""}</Pill>}
                {e.registered && <Pill tone="ok">✓ Registered</Pill>}
              </div>
              <button
                onClick={() => onToggle(e)}
                disabled={n < 0}
                className={`mt-4 w-full rounded-full py-2.5 text-[14px] font-semibold transition ${e.registered ? "border border-[#1C3D2E] text-[#1C3D2E] hover:bg-[#EDE7D3]" : "bg-[#C05A2A] text-white hover:bg-[#9E471F]"} disabled:opacity-40`}
              >
                {e.registered ? "Registered — tap to withdraw" : "Register me"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================= FORMS ================= */
function AssignmentForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ title: "", subject: "Data Structures & Algorithms", kind: "assignment", dueDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16), priority: "medium", notes: "" });
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="relative z-10 space-y-3"
      onSubmit={async (e) => {
        e.preventDefault(); setBusy(true);
        await fetch("/api/assignments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, dueDate: new Date(f.dueDate).toISOString() }) });
        onDone();
      }}
    >
      <input required placeholder="e.g. Practical 6 — deadlock detection" className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <input placeholder="Subject" className={inputCls} value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} />
        <select className={inputCls} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}><option value="assignment">Assignment</option><option value="practical">Practical</option></select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input type="datetime-local" required className={inputCls} value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} />
        <select className={inputCls} value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}><option value="low">Low priority</option><option value="medium">Medium priority</option><option value="high">High priority</option></select>
      </div>
      <textarea placeholder="Notes (optional) — where is it posted? what to carry?" rows={2} className={inputCls} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
      <button disabled={busy} className={`${btnPrimary} w-full`}>{busy ? "Saving…" : "Pin this deadline"}</button>
    </form>
  );
}

function SubjectForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ name: "", code: "", faculty: "", totalLectures: 10, attendedLectures: 8 });
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="relative z-10 space-y-3"
      onSubmit={async (e) => {
        e.preventDefault(); setBusy(true);
        await fetch("/api/subjects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
        onDone();
      }}
    >
      <input required placeholder="Subject name" className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <input placeholder="Code (e.g. CS406)" className={inputCls} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} />
        <input placeholder="Faculty" className={inputCls} value={f.faculty} onChange={(e) => setF({ ...f, faculty: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-[13px] text-[#57534A]">Total held<input type="number" min={0} className={`${inputCls} mt-1`} value={f.totalLectures} onChange={(e) => setF({ ...f, totalLectures: Number(e.target.value) })} /></label>
        <label className="text-[13px] text-[#57534A]">Attended<input type="number" min={0} className={`${inputCls} mt-1`} value={f.attendedLectures} onChange={(e) => setF({ ...f, attendedLectures: Number(e.target.value) })} /></label>
      </div>
      <button disabled={busy} className={`${btnPrimary} w-full`}>{busy ? "Saving…" : "Start tracking"}</button>
    </form>
  );
}

function ExamForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ subject: "", code: "", examDate: new Date(Date.now() + 86400000 * 20).toISOString().slice(0, 10), examTime: "10:00 AM – 1:00 PM", venue: "Block A", units: "" });
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="relative z-10 space-y-3"
      onSubmit={async (e) => {
        e.preventDefault(); setBusy(true);
        await fetch("/api/exams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
        onDone();
      }}
    >
      <input required placeholder="Subject" className={inputCls} value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <input placeholder="Code" className={inputCls} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} />
        <input type="date" required className={inputCls} value={f.examDate} onChange={(e) => setF({ ...f, examDate: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input placeholder="Time" className={inputCls} value={f.examTime} onChange={(e) => setF({ ...f, examTime: e.target.value })} />
        <input placeholder="Venue" className={inputCls} value={f.venue} onChange={(e) => setF({ ...f, venue: e.target.value })} />
      </div>
      <input placeholder="Units / syllabus hint" className={inputCls} value={f.units} onChange={(e) => setF({ ...f, units: e.target.value })} />
      <button disabled={busy} className={`${btnPrimary} w-full`}>{busy ? "Saving…" : "Add to countdown"}</button>
    </form>
  );
}

function EventForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ title: "", club: "", eventDate: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10), eventTime: "5:00 PM", venue: "", description: "", registrationDeadline: "" as string, category: "workshop" });
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="relative z-10 space-y-3"
      onSubmit={async (e) => {
        e.preventDefault(); setBusy(true);
        await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, registrationDeadline: f.registrationDeadline || null }) });
        onDone();
      }}
    >
      <input required placeholder="Event title" className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <input required placeholder="Club" className={inputCls} value={f.club} onChange={(e) => setF({ ...f, club: e.target.value })} />
        <input placeholder="Venue" className={inputCls} value={f.venue} onChange={(e) => setF({ ...f, venue: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input type="date" required className={inputCls} value={f.eventDate} onChange={(e) => setF({ ...f, eventDate: e.target.value })} />
        <input placeholder="Time" className={inputCls} value={f.eventTime} onChange={(e) => setF({ ...f, eventTime: e.target.value })} />
      </div>
      <textarea placeholder="What happens here?" rows={2} className={inputCls} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
      <input type="date" className={inputCls} value={f.registrationDeadline} onChange={(e) => setF({ ...f, registrationDeadline: e.target.value })} />
      <button disabled={busy} className={`${btnPrimary} w-full`}>{busy ? "Saving…" : "Pin this event"}</button>
    </form>
  );
}

function SlotForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ day: "Mon", startTime: "09:00", endTime: "10:00", subject: "", faculty: "", room: "", kind: "lecture" });
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="relative z-10 space-y-3"
      onSubmit={async (e) => {
        e.preventDefault(); setBusy(true);
        await fetch("/api/timetable", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
        onDone();
      }}
    >
      <div className="grid grid-cols-3 gap-3">
        <select className={inputCls} value={f.day} onChange={(e) => setF({ ...f, day: e.target.value })}>{DAY_ORDER.map((d) => <option key={d} value={d}>{d}</option>)}</select>
        <input type="time" className={inputCls} value={f.startTime} onChange={(e) => setF({ ...f, startTime: e.target.value })} />
        <input type="time" className={inputCls} value={f.endTime} onChange={(e) => setF({ ...f, endTime: e.target.value })} />
      </div>
      <input required placeholder="Subject" className={inputCls} value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} />
      <div className="grid grid-cols-3 gap-3">
        <input placeholder="Faculty" className={inputCls} value={f.faculty} onChange={(e) => setF({ ...f, faculty: e.target.value })} />
        <input placeholder="Room" className={inputCls} value={f.room} onChange={(e) => setF({ ...f, room: e.target.value })} />
        <select className={inputCls} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}><option value="lecture">Lecture</option><option value="lab">Lab</option><option value="tutorial">Tutorial</option></select>
      </div>
      <button disabled={busy} className={`${btnPrimary} w-full`}>{busy ? "Saving…" : "Add to week"}</button>
    </form>
  );
}
