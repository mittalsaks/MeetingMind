// Mock data for MeetingMind feature pages.
// New file — does not modify any existing data source.

export type MemberStatus = "on-track" | "at-risk" | "blocked"
export type UpdateStatus = "submitted" | "missing" | "late"

export type Team = {
  id: string
  name: string
  description: string
}

export type Member = {
  id: string
  name: string
  role: string
  teamId: string
  initials: string
  engagement: number // 0-100
  commitment: number // 0-100 completion %
  attendance: number // 0-100
  status: MemberStatus
}

export type Commitment = {
  id: string
  text: string
  done: boolean
}

export type DailyUpdate = {
  id: string
  memberId: string
  date: string
  status: UpdateStatus
  yesterday: string
  today: string
  blockers: string | null
  commitments: Commitment[]
}

export type Meeting = {
  id: string
  title: string
  teamId: string
  date: string
  durationMin: number
  attendees: number
  summary: string
  commitments: string[]
  transcript: { speaker: string; text: string }[]
}

export const teams: Team[] = [
  { id: "t1", name: "Platform", description: "Core infrastructure & APIs" },
  { id: "t2", name: "Growth", description: "Acquisition & activation" },
  { id: "t3", name: "Design", description: "Product & brand design" },
  { id: "t4", name: "Mobile", description: "iOS & Android apps" },
]

export const members: Member[] = [
  { id: "m1", name: "Ava Chen", role: "Frontend Engineer", teamId: "t1", initials: "AC", engagement: 92, commitment: 88, attendance: 96, status: "on-track" },
  { id: "m2", name: "Liam Patel", role: "Backend Engineer", teamId: "t1", initials: "LP", engagement: 64, commitment: 55, attendance: 78, status: "at-risk" },
  { id: "m3", name: "Noah Kim", role: "Platform Lead", teamId: "t1", initials: "NK", engagement: 98, commitment: 94, attendance: 99, status: "on-track" },
  { id: "m4", name: "Mia Rossi", role: "Growth Marketer", teamId: "t2", initials: "MR", engagement: 81, commitment: 72, attendance: 85, status: "on-track" },
  { id: "m5", name: "Ethan Wright", role: "Data Analyst", teamId: "t2", initials: "EW", engagement: 47, commitment: 38, attendance: 61, status: "blocked" },
  { id: "m6", name: "Sofia Garcia", role: "Product Designer", teamId: "t3", initials: "SG", engagement: 89, commitment: 90, attendance: 93, status: "on-track" },
  { id: "m7", name: "Lucas Müller", role: "Brand Designer", teamId: "t3", initials: "LM", engagement: 73, commitment: 66, attendance: 80, status: "at-risk" },
  { id: "m8", name: "Isabella Nowak", role: "iOS Engineer", teamId: "t4", initials: "IN", engagement: 85, commitment: 79, attendance: 90, status: "on-track" },
  { id: "m9", name: "Oliver Haas", role: "Android Engineer", teamId: "t4", initials: "OH", engagement: 58, commitment: 49, attendance: 70, status: "at-risk" },
]

export const dailyUpdates: DailyUpdate[] = [
  {
    id: "u1",
    memberId: "m1",
    date: "2026-06-14",
    status: "submitted",
    yesterday: "Shipped the new auth flow and fixed flaky onboarding tests.",
    today: "Pairing with Noah on the billing refactor and reviewing PRs.",
    blockers: null,
    commitments: [
      { id: "c1", text: "Land billing refactor PR", done: false },
      { id: "c2", text: "Update onboarding docs", done: true },
    ],
  },
  {
    id: "u2",
    memberId: "m3",
    date: "2026-06-14",
    status: "submitted",
    yesterday: "Finalized the API rate-limiting design doc.",
    today: "Kicking off implementation and syncing with Growth on quotas.",
    blockers: "Waiting on infra capacity approval.",
    commitments: [{ id: "c3", text: "Publish rate-limit RFC", done: true }],
  },
  {
    id: "u3",
    memberId: "m4",
    date: "2026-06-14",
    status: "late",
    yesterday: "Launched the referral A/B test to 10% of traffic.",
    today: "Analyzing early funnel metrics and drafting next experiment.",
    blockers: null,
    commitments: [{ id: "c4", text: "Share A/B readout", done: false }],
  },
  {
    id: "u4",
    memberId: "m6",
    date: "2026-06-14",
    status: "submitted",
    yesterday: "Completed the dashboard redesign exploration.",
    today: "Handing off specs to Platform and refining the design tokens.",
    blockers: null,
    commitments: [{ id: "c5", text: "Deliver dashboard specs", done: true }],
  },
  {
    id: "u5",
    memberId: "m8",
    date: "2026-06-14",
    status: "submitted",
    yesterday: "Resolved the iOS crash on cold start.",
    today: "Working on the offline cache layer.",
    blockers: "Blocked on a backend endpoint from Liam.",
    commitments: [{ id: "c6", text: "Ship offline cache", done: false }],
  },
]

// Members expected to post an update today but haven't.
export const missingUpdateMemberIds = ["m2", "m5", "m7", "m9"]

export const meetings: Meeting[] = [
  {
    id: "mt1",
    title: "Platform Weekly Sync",
    teamId: "t1",
    date: "2026-06-13",
    durationMin: 42,
    attendees: 6,
    summary:
      "Team aligned on the billing refactor timeline and agreed to prioritize rate-limiting before the enterprise launch. Noah flagged infra capacity as a risk.",
    commitments: ["Land billing refactor by Friday", "Publish rate-limit RFC", "Request infra capacity bump"],
    transcript: [
      { speaker: "Noah Kim", text: "Let's start with the billing refactor status." },
      { speaker: "Ava Chen", text: "PR is up, I expect to merge by Friday after review." },
      { speaker: "Liam Patel", text: "I'll have the backend endpoint ready for mobile by tomorrow." },
      { speaker: "Noah Kim", text: "Great. My only concern is infra capacity for rate limiting." },
    ],
  },
  {
    id: "mt2",
    title: "Growth Experiment Review",
    teamId: "t2",
    date: "2026-06-12",
    durationMin: 35,
    attendees: 4,
    summary:
      "Reviewed the referral A/B test. Early signal is positive on activation but inconclusive on retention. Decided to extend the test by one week.",
    commitments: ["Extend referral test 1 week", "Draft retention follow-up experiment"],
    transcript: [
      { speaker: "Mia Rossi", text: "Activation is up 8% in the variant group." },
      { speaker: "Ethan Wright", text: "Retention is noisy, I'd extend before calling it." },
      { speaker: "Mia Rossi", text: "Agreed, let's run another week." },
    ],
  },
  {
    id: "mt3",
    title: "Design Critique",
    teamId: "t3",
    date: "2026-06-11",
    durationMin: 50,
    attendees: 5,
    summary:
      "Critiqued the dashboard redesign. Consensus on the new information hierarchy. Brand explorations need another pass on color contrast.",
    commitments: ["Finalize dashboard specs", "Revisit brand color contrast"],
    transcript: [
      { speaker: "Sofia Garcia", text: "The new hierarchy tested well with users." },
      { speaker: "Lucas Müller", text: "I'll take another pass on the brand contrast." },
    ],
  },
  {
    id: "mt4",
    title: "Mobile Standup",
    teamId: "t4",
    date: "2026-06-10",
    durationMin: 18,
    attendees: 3,
    summary:
      "Quick sync on the offline cache and cold-start crash. Isabella unblocked the crash; offline cache pending a backend dependency.",
    commitments: ["Ship offline cache", "Coordinate backend endpoint with Platform"],
    transcript: [
      { speaker: "Isabella Nowak", text: "Cold-start crash is fixed and shipping today." },
      { speaker: "Oliver Haas", text: "Offline cache is blocked on the Platform endpoint." },
    ],
  },
]

// Analytics datasets
export const attendanceTrend = [
  { week: "W1", attendance: 82 },
  { week: "W2", attendance: 85 },
  { week: "W3", attendance: 79 },
  { week: "W4", attendance: 88 },
  { week: "W5", attendance: 91 },
  { week: "W6", attendance: 87 },
  { week: "W7", attendance: 93 },
  { week: "W8", attendance: 95 },
]

export const commitmentTrend = [
  { week: "W1", completed: 24, missed: 8 },
  { week: "W2", completed: 28, missed: 6 },
  { week: "W3", completed: 22, missed: 11 },
  { week: "W4", completed: 31, missed: 5 },
  { week: "W5", completed: 34, missed: 4 },
  { week: "W6", completed: 29, missed: 7 },
  { week: "W7", completed: 37, missed: 3 },
  { week: "W8", completed: 41, missed: 2 },
]

export const teamComparison = [
  { team: "Platform", engagement: 85, attendance: 91 },
  { team: "Growth", engagement: 64, attendance: 73 },
  { team: "Design", engagement: 81, attendance: 87 },
  { team: "Mobile", engagement: 72, attendance: 80 },
]

export const weeklyActivity = [
  { day: "Mon", updates: 32, meetings: 4 },
  { day: "Tue", updates: 38, meetings: 6 },
  { day: "Wed", updates: 41, meetings: 5 },
  { day: "Thu", updates: 36, meetings: 7 },
  { day: "Fri", updates: 44, meetings: 3 },
  { day: "Sat", updates: 12, meetings: 0 },
  { day: "Sun", updates: 8, meetings: 1 },
]

export type RiskInsight = {
  id: string
  subject: string
  level: "high" | "medium" | "low"
  detail: string
}

export const riskInsights: RiskInsight[] = [
  { id: "r1", subject: "Growth team", level: "high", detail: "Attendance dropped 18% over 2 weeks with 4 missed commitments." },
  { id: "r2", subject: "Ethan Wright", level: "high", detail: "Blocked for 3 consecutive days; engagement below 50%." },
  { id: "r3", subject: "Mobile team", level: "medium", detail: "Offline cache commitment slipping due to backend dependency." },
  { id: "r4", subject: "Lucas Müller", level: "low", detail: "Commitment completion trending down but still recoverable." },
]

export function getMember(id: string) {
  return members.find((m) => m.id === id)
}

export function getTeam(id: string) {
  return teams.find((t) => t.id === id)
}