"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, CheckCircle2, Sparkles, Sun, Sunrise } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { studentApi } from "@/lib/api/student"

export function DailyUpdateForm() {
  const [done, setDone] = useState("")
  const [next, setNext] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit() {
    setLoading(true)
    setError("")
    try {
      await studentApi.submitDailyUpdate({ yesterday: done, today: next, blockers: "" })
      window.dispatchEvent(new CustomEvent("attendance:updated"))
      setSubmitted(true)
    } catch (e: any) {
      setError(e.response?.data?.message || "Submit failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass relative overflow-hidden rounded-2xl border border-border p-5">
      <div className="absolute -right-12 -top-12 size-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Daily Work Update</h2>
          <p className="text-xs text-muted-foreground">A quick log keeps your attendance and commitments in sync</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/12 px-2.5 py-1 text-[11px] font-medium text-primary">
          <Sparkles className="size-3.5" /> AI summarized
        </span>
      </div>

      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center gap-3 rounded-xl border border-success/25 bg-success/8 py-10 text-center"
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 16 }}
              className="grid size-12 place-items-center rounded-full bg-success/15 text-success"
            >
              <CheckCircle2 className="size-6" />
            </motion.span>
            <div>
              <p className="text-sm font-semibold">Update submitted</p>
              <p className="text-xs text-muted-foreground">Your daily attendance is now marked yellow.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setSubmitted(false)}>
              Edit update
            </Button>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Sun className="size-3.5 text-warning" /> What did you complete today?
              </label>
              <Textarea
                value={done}
                onChange={(e) => setDone(e.target.value)}
                placeholder="e.g. Finished the login page and wired up JWT auth..."
                className="min-h-24 resize-none bg-card/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Sunrise className="size-3.5 text-primary" /> What will you work on tomorrow?
              </label>
              <Textarea
                value={next}
                onChange={(e) => setNext(e.target.value)}
                placeholder="e.g. Build the dashboard layout and connect stat cards..."
                className="min-h-24 resize-none bg-card/50"
              />
            </div>
            {error && <p className="text-xs text-danger">{error}</p>}
            <Button className="w-full gap-1.5" onClick={handleSubmit} disabled={!done.trim() || loading}>
              <Send className="size-4" /> Submit Update
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
