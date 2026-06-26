"use client"

import { useState } from "react"
import { Filter, Plus } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Kanban } from "@/components/tasks/kanban"
import { AddTaskModal } from "@/components/tasks/add-task-modal"

export default function TasksPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Tasks & Commitments"
        subtitle="Every card is a commitment extracted from a weekly meeting. Move work from pending to verified."
      >
        <Button variant="outline" className="gap-1.5">
          <Filter className="size-4" /> Filter
        </Button>
        <Button className="gap-1.5" onClick={() => setModalOpen(true)}>
          <Plus className="size-4" /> Add Task
        </Button>
      </PageHeader>
      <Kanban key={refreshKey} />
      <AddTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  )
}