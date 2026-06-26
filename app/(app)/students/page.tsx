"use client"
import { AdminOnly } from "@/components/auth/admin-only"
import { useEffect, useState } from "react"
import { Loader2, Mail, Plus, UserMinus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { workspaceApi } from "@/lib/api/workspace"

type Student = {
  _id: string
  name: string
  email: string
  isActive: boolean
  inviteAccepted: boolean
  createdAt: string
}

function StudentsContent() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteForm, setShowInviteForm] = useState(false)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState("")
  const [inviteSuccess, setInviteSuccess] = useState("")

  const loadStudents = async () => {
    setLoading(true)
    try {
      const { data } = await workspaceApi.getStudents()
      setStudents(data.students)
    } catch (err) {
      console.error("Failed to load students", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [])

  const handleInvite = async () => {
    setInviteError("")
    setInviteSuccess("")
    setInviting(true)
    try {
      await workspaceApi.inviteStudent(name, email)
      setInviteSuccess(`Invite sent to ${email}`)
      setName("")
      setEmail("")
      await loadStudents()
      setTimeout(() => {
        setShowInviteForm(false)
        setInviteSuccess("")
      }, 1500)
    } catch (err: any) {
      setInviteError(err.response?.data?.message || "Failed to send invite")
    } finally {
      setInviting(false)
    }
  }

  const handleDeactivate = async (id: string) => {
    try {
      await workspaceApi.deactivateStudent(id)
      await loadStudents()
    } catch (err) {
      console.error("Failed to deactivate student", err)
    }
  }

  return (
    <div className="px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Students</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {students.length} {students.length === 1 ? "student" : "students"} in this workspace
          </p>
        </div>
        <Button onClick={() => setShowInviteForm(true)} className="gap-2">
          <Plus className="size-4" />
          Invite Student
        </Button>
      </div>

      {showInviteForm && (
        <div className="glass-strong mb-6 rounded-2xl border border-border p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Invite a new student</h2>
            <button
              onClick={() => setShowInviteForm(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="Student name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 flex-1 bg-card/50"
            />
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 flex-1 bg-card/50"
            />
            <Button onClick={handleInvite} disabled={inviting || !name.trim() || !email.trim()} className="h-10 shrink-0">
              {inviting ? <Loader2 className="size-4 animate-spin" /> : "Send Invite"}
            </Button>
          </div>
          {inviteError ? <p className="mt-3 text-sm text-danger">{inviteError}</p> : null}
          {inviteSuccess ? <p className="mt-3 text-sm text-primary">{inviteSuccess}</p> : null}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : students.length === 0 ? (
        <div className="glass-strong rounded-2xl border border-border p-10 text-center text-muted-foreground">
          No students yet. Invite your first student to get started.
        </div>
      ) : (
        <div className="glass-strong overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Invited</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s._id} className="border-b border-border/50 last:border-0">
                  <td className="px-5 py-3 font-medium">{s.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{s.email}</td>
                  <td className="px-5 py-3">
                    {!s.isActive ? (
                      <span className="rounded-full bg-danger/10 px-2.5 py-1 text-[11px] font-medium text-danger">
                        Deactivated
                      </span>
                    ) : s.inviteAccepted ? (
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-[11px] font-medium text-orange-400">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {s.isActive && (
                      <button
                        onClick={() => handleDeactivate(s._id)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] text-muted-foreground hover:bg-danger/10 hover:text-danger"
                        title="Deactivate student"
                      >
                        <UserMinus className="size-3.5" />
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
export default function StudentsPage() {
  return <AdminOnly><StudentsContent /></AdminOnly>
}