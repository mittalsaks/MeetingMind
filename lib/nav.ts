import {
  LayoutDashboard,
  CalendarClock,
  ClipboardList,
  KanbanSquare,
  CalendarCheck2,
  Users,
  PlaneTakeoff,
  Archive,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  badge?: number
  built?: boolean
}

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, built: true },
  { label: "Weekly Meetings", href: "/meetings", icon: CalendarClock, built: true },
  { label: "Daily Updates", href: "/daily-updates", icon: ClipboardList },
  { label: "Tasks", href: "/tasks", icon: KanbanSquare, built: true },
  { label: "Attendance", href: "/attendance", icon: CalendarCheck2, built: true },
  { label: "Team Members", href: "/team", icon: Users, built: true },
  { label: "Students", href: "/students", icon: Users, built: true },
  { label: "Leave Requests", href: "/leave-requests", icon: PlaneTakeoff, built: true },
  { label: "Meeting Archive", href: "/archive", icon: Archive },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
]
