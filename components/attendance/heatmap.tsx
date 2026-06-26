"use client"

import { motion } from "framer-motion"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type UpdateState = "spoke" | "daily" | "missing" | "leave"

interface AttendanceRecord {
  userId: string
  date: string
  status: "present" | "absent" | "leave_approved"
  verbalUpdateGiven: boolean
  joinedMeeting: boolean
}

interface Student {
  _id: string
  name: string
}

interface Props {
  records: AttendanceRecord[]
  students: Student[]
}

const cellColor: Record<UpdateState, string> = {
  spoke: "bg-success/80 hover:bg-success",
  daily: "bg-warning/70 hover:bg-warning",
  missing: "bg-danger/25 hover:bg-danger/50",
  leave: "bg-leave/70 hover:bg-leave",
}

const stateLabel: Record<UpdateState, string> = {
  spoke: "Spoke in meeting",
  daily: "Daily update",
  missing: "Missing",
  leave: "On leave",
}

const legend: { state: UpdateState; label: string }[] = [
  { state: "spoke", label: "Spoke in meeting" },
  { state: "daily", label: "Daily update" },
  { state: "missing", label: "Missing" },
  { state: "leave", label: "On leave" },
]

function getInitials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
}

// Pichle 4 hafton ke weekdays (Mon-Fri) generate karo
function getLastNWeeksDays(weeks: number) {
  const days: Date[] = []
  const today = new Date()
  for (let w = weeks - 1; w >= 0; w--) {
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay() + 1 - w * 7) // is week ka Monday
    for (let d = 0; d < 5; d++) {
      const day = new Date(weekStart)
      day.setDate(weekStart.getDate() + d)
      days.push(day)
    }
  }
  return days
}

function deriveState(record: AttendanceRecord | undefined): UpdateState {
  if (!record) return "missing"
  if (record.status === "leave_approved") return "leave"
  if (record.status === "present" && record.verbalUpdateGiven) return "spoke"
  if (record.status === "present" && !record.verbalUpdateGiven) return "daily"
  return "missing"
}

export function AttendanceHeatmap({ records, students }: Props) {
  const WEEKS = 4
  const allDays = getLastNWeeksDays(WEEKS)

  // weeks of 5 days each
  const weekChunks: Date[][] = []
  for (let i = 0; i < WEEKS; i++) {
    weekChunks.push(allDays.slice(i * 5, i * 5 + 5))
  }

  function recordFor(userId: string, date: Date) {
    const dateStr = date.toISOString().slice(0, 10)
    return records.find(
      (r) => r.userId === userId && r.date.slice(0, 10) === dateStr
    )
  }

  if (students.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No students in workspace yet.
      </p>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {legend.map((l) => (
          <div key={l.state} className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-[4px] ${cellColor[l.state].split(" ")[0]}`} />
            <span className="text-xs text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[640px] space-y-1">
          <div className="flex items-center gap-1 pl-[200px]">
            {weekChunks.map((week, wi) => (
              <div key={wi} className="flex flex-1 items-center justify-center gap-1">
                {week.map((d) => (
                  <span
                    key={d.toISOString()}
                    className="w-7 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70"
                  >
                    {d.toLocaleDateString("en-US", { weekday: "short" })[0]}
                  </span>
                ))}
              </div>
            ))}
          </div>

          <TooltipProvider delayDuration={80}>
            {students.map((student, ri) => (
              <motion.div
                key={student._id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: ri * 0.04 }}
                className="flex items-center gap-1 rounded-lg py-1 hover:bg-card-2/60"
              >
                <div className="flex w-[200px] shrink-0 items-center gap-2.5 pl-1">
                  <Avatar className="h-7 w-7 text-[11px]">
                    <AvatarFallback className="bg-card-2 text-foreground/80">
                      {getInitials(student.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium leading-tight">
                      {student.name}
                    </p>
                  </div>
                </div>

                {weekChunks.map((week, wi) => (
                  <div key={wi} className="flex flex-1 items-center justify-center gap-1">
                    {week.map((day, di) => {
                      const rec = recordFor(student._id, day)
                      const state = deriveState(rec)
                      return (
                        <Tooltip key={di}>
                          <TooltipTrigger
                            render={
                              <button
                                className={`h-7 w-7 rounded-[5px] transition-colors ${cellColor[state]}`}
                                aria-label={`${student.name} — ${stateLabel[state]}`}
                              />
                            }
                          />
                          <TooltipContent className="text-xs">
                            <p className="font-medium">{student.name}</p>
                            <p className="text-muted-foreground">
                              {day.toLocaleDateString("en-US", { weekday: "short" })} · {stateLabel[state]}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </div>
                ))}
              </motion.div>
            ))}
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}