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
  Download,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  badge?: number
  built?: boolean
  roles?: ("admin" | "student")[]
}

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, built: true, roles: ["admin", "student"] },
  { label: "Weekly Meetings", href: "/meetings", icon: CalendarClock, built: true, roles: ["admin"] },
  { label: "Daily Updates", href: "/daily-updates", icon: ClipboardList, roles: ["admin", "student"] },
  { label: "Tasks", href: "/tasks", icon: KanbanSquare, built: true, roles: ["admin", "student"] },
  { label: "Attendance", href: "/attendance", icon: CalendarCheck2, built: true, roles: ["admin", "student"] },
  { label: "Team Members", href: "/team", icon: Users, built: true, roles: ["admin"] },
  { label: "Students", href: "/students", icon: Users, built: true, roles: ["admin"] },
  { label: "Leave Requests", href: "/leave-requests", icon: PlaneTakeoff, built: true, roles: ["admin", "student"] },
  { label: "Meeting Archive", href: "/archive", icon: Archive, roles: ["admin"] },
  { label: "Analytics", href: "/analytics", icon: BarChart3, roles: ["admin"] },
  { label: "Install Extension", href: "/install-extension", icon: Download, roles: ["admin"] },
  { label: "Settings", href: "/settings", icon: Settings, roles: ["admin"] },
]