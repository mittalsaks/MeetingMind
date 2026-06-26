// MeetingMind mock data — frontend only

export type UpdateState = "spoke" | "daily" | "missing" | "leave"

export type Student = {
  id: string
  name: string
  initials: string
  role: string
  team: string
  lastUpdate: string
  missingDays: number
  state: UpdateState
}

export const mentor = {
  name: "Sakshi",
  role: "Lead Mentor",
  initials: "SA",
  workspace: "Capstone 2026 · Cohort B",
}

export const students: Student[] = [
  { id: "s1", name: "Rahul Mehta", initials: "RM", role: "Backend", team: "Atlas", lastUpdate: "Today, 9:12 AM", missingDays: 0, state: "spoke" },
  { id: "s2", name: "Priya Nair", initials: "PN", role: "Frontend", team: "Atlas", lastUpdate: "2 days ago", missingDays: 2, state: "missing" },
  { id: "s3", name: "Ankit Sharma", initials: "AS", role: "ML", team: "Nova", lastUpdate: "Today, 8:40 AM", missingDays: 0, state: "daily" },
  { id: "s4", name: "Sneha Iyer", initials: "SI", role: "Design", team: "Nova", lastUpdate: "Yesterday", missingDays: 1, state: "daily" },
  { id: "s5", name: "Vikram Rao", initials: "VR", role: "Backend", team: "Atlas", lastUpdate: "4 days ago", missingDays: 4, state: "missing" },
  { id: "s6", name: "Meera Joshi", initials: "MJ", role: "Frontend", team: "Orbit", lastUpdate: "Today, 10:02 AM", missingDays: 0, state: "spoke" },
  { id: "s7", name: "Arjun Verma", initials: "AV", role: "DevOps", team: "Orbit", lastUpdate: "On approved leave", missingDays: 0, state: "leave" },
  { id: "s8", name: "Kavya Reddy", initials: "KR", role: "ML", team: "Nova", lastUpdate: "Yesterday", missingDays: 1, state: "daily" },
]

export const adminStats = [
  { key: "updated", label: "Students Updated Today", value: 5, total: 8, tone: "success", hint: "Gave a real update" },
  { key: "missing", label: "Missing Daily Update", value: 2, total: 8, tone: "danger", hint: "No update for 2+ days" },
  { key: "meeting", label: "Upcoming Meeting", value: "Thu · 6 PM", tone: "primary", hint: "Weekly sync — Cohort B" },
  { key: "pending", label: "Pending Commitments", value: 11, tone: "warning", hint: "Promised, in progress" },
  { key: "overdue", label: "Overdue Commitments", value: 3, tone: "danger", hint: "Past deadline" },
  { key: "leave", label: "Pending Leave Requests", value: 2, tone: "leave", hint: "Awaiting approval" },
]

export type Activity = {
  id: string
  who: string
  initials: string
  action: string
  detail: string
  time: string
  tone: UpdateState | "verify"
}

export const activityFeed: Activity[] = [
  { id: "a1", who: "Rahul", initials: "RM", action: "submitted backend update", detail: "Finished JWT auth + refresh tokens", time: "9m ago", tone: "spoke" },
  { id: "a2", who: "Priya", initials: "PN", action: "missed update today", detail: "No daily update logged", time: "1h ago", tone: "missing" },
  { id: "a3", who: "Ankit", initials: "AS", action: "completed task — waiting verification", detail: "Recommendation model v2", time: "2h ago", tone: "verify" },
  { id: "a4", who: "Sneha", initials: "SI", action: "submitted daily update", detail: "Wireframes for attendance view", time: "3h ago", tone: "daily" },
  { id: "a5", who: "Arjun", initials: "AV", action: "leave approved", detail: "Out Thu–Fri, family event", time: "5h ago", tone: "leave" },
  { id: "a6", who: "Meera", initials: "MJ", action: "gave update in meeting", detail: "Shipped onboarding flow", time: "Yesterday", tone: "spoke" },
]

export const aiInsights = [
  { id: "i1", title: "Irregular updates", body: "Vikram Rao has skipped 4 of the last 5 daily updates.", tone: "danger", tag: "Engagement" },
  { id: "i2", title: "Repeated missed deadlines", body: "Priya Nair missed 2 commitment deadlines this sprint.", tone: "warning", tag: "Delivery" },
  { id: "i3", title: "High workload", body: "Rahul Mehta holds 6 open commitments — risk of overload.", tone: "primary", tag: "Capacity" },
  { id: "i4", title: "On track", body: "Team Nova has a 92% commitment completion rate.", tone: "success", tag: "Momentum" },
]

export type Task = {
  id: string
  student: string
  initials: string
  commitment: string
  deadline: string
  source: string
  priority: "Low" | "Medium" | "High"
  status: "pending" | "verifying" | "verified"
  completed?: boolean
  verified?: boolean
}

export const tasks: Task[] = [
  { id: "t1", student: "Rahul Mehta", initials: "RM", commitment: "Build dashboard API endpoints", deadline: "Thu, Jun 19", source: "Weekly Sync · Jun 12", priority: "High", status: "pending" },
  { id: "t2", student: "Priya Nair", initials: "PN", commitment: "Integrate attendance charts", deadline: "Wed, Jun 18", source: "Weekly Sync · Jun 12", priority: "Medium", status: "pending" },
  { id: "t3", student: "Sneha Iyer", initials: "SI", commitment: "Finalize leave request flow design", deadline: "Tue, Jun 17", source: "Weekly Sync · Jun 5", priority: "Low", status: "pending" },
  { id: "t4", student: "Ankit Sharma", initials: "AS", commitment: "Train recommendation model v2", deadline: "Jun 16", source: "Weekly Sync · Jun 5", priority: "High", status: "verifying", completed: true },
  { id: "t5", student: "Meera Joshi", initials: "MJ", commitment: "Ship onboarding flow", deadline: "Jun 15", source: "Weekly Sync · Jun 5", priority: "Medium", status: "verifying", completed: true },
  { id: "t6", student: "Kavya Reddy", initials: "KR", commitment: "Data cleaning pipeline", deadline: "Jun 13", source: "Weekly Sync · May 29", priority: "Medium", status: "verified", completed: true, verified: true },
  { id: "t7", student: "Rahul Mehta", initials: "RM", commitment: "Set up CI/CD on Vercel", deadline: "Jun 11", source: "Weekly Sync · May 29", priority: "High", status: "verified", completed: true, verified: true },
]

export type Meeting = {
  id: string
  date: string
  present: number
  total: number
  commitments: number
  summary: string
}

export const meetingHistory: Meeting[] = [
  { id: "m1", date: "Thu, Jun 12 · 6:00 PM", present: 7, total: 8, commitments: 9, summary: "Auth + dashboard scope locked. Priya flagged blocker on charts." },
  { id: "m2", date: "Thu, Jun 5 · 6:00 PM", present: 8, total: 8, commitments: 11, summary: "Sprint planning. Nova team ahead, Orbit needs DevOps support." },
  { id: "m3", date: "Thu, May 29 · 6:00 PM", present: 6, total: 8, commitments: 8, summary: "Kickoff retro. Two members absent — no spoken update recorded." },
  { id: "m4", date: "Thu, May 22 · 6:00 PM", present: 8, total: 8, commitments: 10, summary: "Architecture review. Agreed on Postgres + Drizzle stack." },
]

export type TranscriptLine = {
  id: string
  speaker: string
  initials: string
  text: string
  extracted?: {
    completed: string
    next: string
    deadline: string
  }
}

export const liveTranscript: TranscriptLine[] = [
  {
    id: "l1",
    speaker: "Rahul",
    initials: "RM",
    text: "This week I completed the login page and wired up the JWT authentication. Next I'll build the dashboard layout and connect the stats cards.",
    extracted: { completed: "Login page + JWT auth", next: "Build dashboard layout", deadline: "Next Thursday" },
  },
  {
    id: "l2",
    speaker: "Priya",
    initials: "PN",
    text: "I finished the design tokens. Next week I want to integrate the attendance charts and fix the responsive sidebar.",
    extracted: { completed: "Design tokens", next: "Integrate attendance charts", deadline: "Next Wednesday" },
  },
  {
    id: "l3",
    speaker: "Ankit",
    initials: "AS",
    text: "Model v2 is trained and evaluated. I'll start on the data cleaning pipeline for the next batch.",
    extracted: { completed: "Recommendation model v2", next: "Data cleaning pipeline", deadline: "Next Monday" },
  },
]

// attendance: 4 weeks x students; state per day Mon-Fri
export const attendanceWeeks = ["Week of Jun 9", "Week of Jun 2", "Week of May 26", "Week of May 19"]
export const attendanceDays = ["Mon", "Tue", "Wed", "Thu", "Fri"]

function gen(states: UpdateState[]): UpdateState[][] {
  // 4 weeks of 5 days, deterministic-ish from provided seed list
  const out: UpdateState[][] = []
  let i = 0
  for (let w = 0; w < 4; w++) {
    const week: UpdateState[] = []
    for (let d = 0; d < 5; d++) {
      week.push(states[i % states.length])
      i++
    }
    out.push(week)
  }
  return out
}

export const attendanceMatrix: { student: Student; grid: UpdateState[][] }[] = [
  { student: students[0], grid: gen(["spoke", "daily", "daily", "spoke", "daily"]) },
  { student: students[1], grid: gen(["missing", "daily", "missing", "spoke", "missing"]) },
  { student: students[2], grid: gen(["daily", "spoke", "daily", "spoke", "daily"]) },
  { student: students[3], grid: gen(["daily", "daily", "missing", "spoke", "daily"]) },
  { student: students[4], grid: gen(["missing", "missing", "daily", "missing", "spoke"]) },
  { student: students[5], grid: gen(["spoke", "daily", "daily", "spoke", "daily"]) },
  { student: students[6], grid: gen(["leave", "leave", "daily", "spoke", "daily"]) },
  { student: students[7], grid: gen(["daily", "missing", "daily", "spoke", "daily"]) },
]

export type LeaveRequest = {
  id: string
  student: string
  initials: string
  team: string
  dates: string
  reason: string
  weekProgress: string
  nextPlan: string
  status: "pending" | "approved" | "rejected"
  submitted: string
}

export const leaveRequests: LeaveRequest[] = [
  {
    id: "lr1",
    student: "Arjun Verma",
    initials: "AV",
    team: "Orbit",
    dates: "Jun 19 – Jun 20",
    reason: "Family event out of town, will be unreachable.",
    weekProgress: "Set up CI/CD pipeline and fixed two production bugs.",
    nextPlan: "Configure staging environment and write deployment docs.",
    status: "pending",
    submitted: "2h ago",
  },
  {
    id: "lr2",
    student: "Kavya Reddy",
    initials: "KR",
    team: "Nova",
    dates: "Jun 23",
    reason: "Medical appointment in the morning.",
    weekProgress: "Completed data cleaning pipeline and unit tests.",
    nextPlan: "Begin feature engineering for model v3.",
    status: "pending",
    submitted: "Yesterday",
  },
  {
    id: "lr3",
    student: "Sneha Iyer",
    initials: "SI",
    team: "Nova",
    dates: "Jun 10",
    reason: "University exam.",
    weekProgress: "Delivered attendance view wireframes.",
    nextPlan: "Hi-fi mocks for leave request flow.",
    status: "approved",
    submitted: "5 days ago",
  },
]

// student dashboard data
export const studentSelf = {
  name: "Rahul Mehta",
  initials: "RM",
  team: "Atlas",
  role: "Backend Engineer",
}

export const studentStats = [
  { key: "today", label: "Today's Tasks", value: 3, tone: "primary", hint: "2 in progress" },
  { key: "pending", label: "Pending Commitments", value: 4, tone: "warning", hint: "From weekly syncs" },
  { key: "attendance", label: "Attendance", value: "On track", tone: "success", hint: "Gave update today" },
  { key: "meeting", label: "Upcoming Meeting", value: "Thu · 6 PM", tone: "primary", hint: "Weekly sync" },
  { key: "update", label: "Daily Update", value: "Done", tone: "success", hint: "Submitted 9:12 AM" },
]

export const studentTasks: Task[] = [
  { id: "st1", student: "You", initials: "RM", commitment: "Build dashboard API endpoints", deadline: "Thu, Jun 19", source: "Weekly Sync · Jun 12", priority: "High", status: "pending" },
  { id: "st2", student: "You", initials: "RM", commitment: "Set up CI/CD on Vercel", deadline: "Fri, Jun 20", source: "Weekly Sync · Jun 12", priority: "Medium", status: "pending" },
  { id: "st3", student: "You", initials: "RM", commitment: "Write API integration tests", deadline: "Mon, Jun 23", source: "Weekly Sync · Jun 12", priority: "Medium", status: "pending" },
  { id: "st4", student: "You", initials: "RM", commitment: "Refactor auth middleware", deadline: "Jun 16", source: "Weekly Sync · Jun 5", priority: "Low", status: "verifying", completed: true },
]

export const studentMeetingHistory = [
  { id: "smh1", date: "Thu, Jun 12", commitment: "Finished login page + JWT auth", status: "Verified" },
  { id: "smh2", date: "Thu, Jun 5", commitment: "Designed database schema", status: "Verified" },
  { id: "smh3", date: "Thu, May 29", commitment: "Set up project repo and CI", status: "Verified" },
]

export const toneClasses: Record<string, { text: string; bg: string; ring: string; dot: string }> = {
  primary: { text: "text-primary", bg: "bg-primary/12", ring: "ring-primary/25", dot: "bg-primary" },
  success: { text: "text-success", bg: "bg-success/12", ring: "ring-success/25", dot: "bg-success" },
  warning: { text: "text-warning", bg: "bg-warning/12", ring: "ring-warning/25", dot: "bg-warning" },
  danger: { text: "text-danger", bg: "bg-danger/12", ring: "ring-danger/25", dot: "bg-danger" },
  leave: { text: "text-leave", bg: "bg-leave/12", ring: "ring-leave/25", dot: "bg-leave" },
  verify: { text: "text-warning", bg: "bg-warning/12", ring: "ring-warning/25", dot: "bg-warning" },
  spoke: { text: "text-success", bg: "bg-success/12", ring: "ring-success/25", dot: "bg-success" },
  daily: { text: "text-warning", bg: "bg-warning/12", ring: "ring-warning/25", dot: "bg-warning" },
  missing: { text: "text-danger", bg: "bg-danger/12", ring: "ring-danger/25", dot: "bg-danger" },
}

export const stateMeta: Record<UpdateState, { label: string; tone: string }> = {
  spoke: { label: "Gave update in meeting", tone: "success" },
  daily: { label: "Submitted daily update", tone: "warning" },
  missing: { label: "No update submitted", tone: "danger" },
  leave: { label: "Leave approved", tone: "leave" },
}
