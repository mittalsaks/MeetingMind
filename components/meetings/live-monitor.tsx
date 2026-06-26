"use client"

import { Radio, Info, Globe } from "lucide-react"

export function LiveMonitor() {
  return (
    <div className="glass overflow-hidden rounded-2xl border border-border">
      <div className="flex items-center justify-between border-b border-border p-5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-muted/40 text-muted-foreground ring-1 ring-border">
            <Radio className="size-4.5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Live Meeting Monitoring</h2>
            <p className="text-xs text-muted-foreground">Transcript streaming from Google Meet extension</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
          <Globe className="size-6" />
        </span>
        <p className="text-sm font-medium">Not available yet</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Live transcript capture needs the MeetingMind Chrome Extension, which isn&apos;t built yet.
          Once installed, this panel will show real-time transcript + AI-extracted commitments during your Google Meet calls.
        </p>
      </div>

      <div className="flex items-start gap-2.5 border-t border-border bg-warning/8 px-5 py-3">
        <Info className="mt-0.5 size-4 shrink-0 text-warning" />
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Attendance rule:</span> a student is marked present only when they
          give a spoken update. Simply joining the Google Meet does <span className="font-medium text-warning">not</span> count.
        </p>
      </div>
    </div>
  )
}