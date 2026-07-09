"use client"

import { useState, type ReactNode } from "react"
import { PageHeader } from "@/components/features/page-header"
import { PageTransition } from "@/components/features/motion"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Settings,
  Building2,
  Bell,
  Clock,
  Video,
  Shield,
  Plug,
  Check,
} from "lucide-react"
import { members, getTeam } from "@/lib/mock-data"

function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-6 backdrop-blur-xl">
      <div className="mb-5">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  )
}

function ToggleRow({
  title,
  description,
  defaultChecked,
}: {
  title: string
  description: string
  defaultChecked?: boolean
}) {
  const [checked, setChecked] = useState(!!defaultChecked)
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={setChecked} />
    </div>
  )
}

const tabs = [
  { value: "workspace", label: "Workspace", icon: Building2 },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "reminders", label: "Reminders", icon: Clock },
  { value: "meetings", label: "Meetings", icon: Video },
  { value: "roles", label: "Roles", icon: Shield },
  { value: "integrations", label: "Integrations", icon: Plug },
]

const initialIntegrations = [
  { name: "Slack", description: "Post updates and reminders to channels", connected: true },
  { name: "Google Calendar", description: "Sync meetings and availability", connected: true },
  { name: "Zoom", description: "Auto-record and transcribe calls", connected: false },
  { name: "Notion", description: "Export summaries to your workspace", connected: false },
]

export default function SettingsPage() {
  // ── Workspace tab state ──
  const [wsName, setWsName] = useState("Acme Inc.")
  const [wsUrl, setWsUrl] = useState("acme.meetingmind.app")
  const [timezone, setTimezone] = useState("America / New York")
  const [weekStart, setWeekStart] = useState("Monday")
  const [saved, setSaved] = useState(false)

  // ── Roles tab state ──
  const [memberRoles, setMemberRoles] = useState<Record<string, string>>(
    Object.fromEntries(
      members.map((m) => [m.id, m.id === "m3" || m.id === "m6" ? "Mentor" : "Student"])
    )
  )

  // ── Integrations tab state ──
  const [integrations, setIntegrations] = useState(initialIntegrations)

  function handleSaveWorkspace() {
    // TODO: wire to backend PUT /api/workspace when endpoint is ready
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function toggleIntegration(name: string) {
    setIntegrations((prev) =>
      prev.map((i) => (i.name === name ? { ...i, connected: !i.connected } : i))
    )
  }

  return (
      <PageTransition className="space-y-6">
        <PageHeader
          icon={Settings}
          title="Settings"
          description="Manage your workspace, notifications, reminders, and integrations."
        />

        <Tabs defaultValue="workspace" className="flex flex-col gap-6">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-card/50 p-1 backdrop-blur-xl">
            {tabs.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="gap-1.5">
                <t.icon className="size-4" />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Workspace */}
          <TabsContent value="workspace">
            <SectionCard
              title="Workspace details"
              description="Basic information about your organization."
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ws-name">Workspace name</Label>
                  <Input
                    id="ws-name"
                    value={wsName}
                    onChange={(e) => setWsName(e.target.value)}
                    className="bg-background/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ws-url">Workspace URL</Label>
                  <Input
                    id="ws-url"
                    value={wsUrl}
                    onChange={(e) => setWsUrl(e.target.value)}
                    className="bg-background/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select value={timezone} onValueChange={(val) => val && setTimezone(val)}>
                    <SelectTrigger className="w-full bg-background/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America / New York">America / New York</SelectItem>
                      <SelectItem value="America / Los Angeles">America / Los Angeles</SelectItem>
                      <SelectItem value="Europe / London">Europe / London</SelectItem>
                      <SelectItem value="Asia / Singapore">Asia / Singapore</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Week starts on</Label>
                 <Select value={weekStart} onValueChange={(val) => val && setWeekStart(val)}>
                    <SelectTrigger className="w-full bg-background/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monday">Monday</SelectItem>
                      <SelectItem value="Sunday">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator className="my-5" />
              <div className="flex items-center justify-end gap-3">
                {saved && (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                    <Check className="size-3.5" /> Saved
                  </span>
                )}
                <Button size="sm" onClick={handleSaveWorkspace}>
                  Save changes
                </Button>
              </div>
            </SectionCard>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <SectionCard
              title="Notification preferences"
              description="Choose how and when MeetingMind reaches you."
            >
              <div className="divide-y divide-border">
                <ToggleRow title="Daily digest" description="A morning summary of team updates and blockers." defaultChecked />
                <ToggleRow title="Missing update alerts" description="Notify mentors when a member skips their update." defaultChecked />
                <ToggleRow title="Commitment reminders" description="Ping members about commitments due today." defaultChecked />
                <ToggleRow title="Weekly analytics report" description="Engagement and attendance trends every Monday." />
                <ToggleRow title="Mention notifications" description="Email me when I'm mentioned in a summary." defaultChecked />
              </div>
            </SectionCard>
          </TabsContent>

          {/* Reminders */}
          <TabsContent value="reminders">
            <SectionCard
              title="Reminder schedule"
              description="Control when async standup reminders are sent."
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Reminder time</Label>
                  <Select defaultValue="9:00 AM">
                    <SelectTrigger className="w-full bg-background/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8:00 AM">8:00 AM</SelectItem>
                      <SelectItem value="9:00 AM">9:00 AM</SelectItem>
                      <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select defaultValue="Every weekday">
                    <SelectTrigger className="w-full bg-background/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Every weekday">Every weekday</SelectItem>
                      <SelectItem value="Every day">Every day</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator className="my-5" />
              <div className="divide-y divide-border">
                <ToggleRow title="Escalate after 2 hours" description="Notify the mentor if an update is still missing." defaultChecked />
                <ToggleRow title="Quiet weekends" description="Pause reminders on Saturday and Sunday." defaultChecked />
              </div>
            </SectionCard>
          </TabsContent>

          {/* Meetings */}
          <TabsContent value="meetings">
            <SectionCard
              title="Meeting preferences"
              description="Defaults applied to new recorded meetings."
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Default summary length</Label>
                  <Select defaultValue="Standard">
                    <SelectTrigger className="w-full bg-background/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Concise">Concise</SelectItem>
                      <SelectItem value="Standard">Standard</SelectItem>
                      <SelectItem value="Detailed">Detailed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Transcript language</Label>
                  <Select defaultValue="English">
                    <SelectTrigger className="w-full bg-background/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Spanish">Spanish</SelectItem>
                      <SelectItem value="German">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator className="my-5" />
              <div className="divide-y divide-border">
                <ToggleRow title="Auto-extract commitments" description="Detect action items and assign owners automatically." defaultChecked />
                <ToggleRow title="Record meetings by default" description="Start recording when a call begins." defaultChecked />
                <ToggleRow title="Share summary with attendees" description="Email the AI summary after each meeting." />
              </div>
            </SectionCard>
          </TabsContent>

          {/* Roles */}
          <TabsContent value="roles">
            <SectionCard
              title="Role management"
              description="Assign mentor or student access for each member."
            >
              <div className="space-y-2">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-col gap-3 rounded-lg border border-border bg-background/40 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-secondary text-xs font-medium">
                          {m.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{m.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {m.role} · {getTeam(m.teamId)?.name}
                        </p>
                      </div>
                    </div>
                    <Select
                      value={memberRoles[m.id]}
                      onValueChange={(val) =>
                      val && setMemberRoles((prev) => ({ ...prev, [m.id]: val }))
                    }
                    >
                      <SelectTrigger size="sm" className="w-32 bg-card/60">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mentor">Mentor</SelectItem>
                        <SelectItem value="Student">Student</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </SectionCard>
          </TabsContent>

          {/* Integrations */}
          <TabsContent value="integrations">
            <SectionCard
              title="Integrations"
              description="Connect MeetingMind to the tools your team already uses."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {integrations.map((i) => (
                  <div
                    key={i.name}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background/40 p-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{i.name}</p>
                        {i.connected ? (
                          <Badge variant="secondary" className="gap-1">
                            <Check className="size-3" />
                            Connected
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {i.description}
                      </p>
                    </div>
                    <Button
                      variant={i.connected ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggleIntegration(i.name)}
                    >
                      {i.connected ? "Manage" : "Connect"}
                    </Button>
                  </div>
                ))}
              </div>
            </SectionCard>
          </TabsContent>
        </Tabs>
      </PageTransition>
  )
}