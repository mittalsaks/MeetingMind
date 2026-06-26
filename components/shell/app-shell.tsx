"use client"

import { useState, useEffect } from "react"
import { Sidebar, SidebarContent } from "./sidebar"
import { Topbar } from "./topbar"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useAuthStore } from "@/lib/store/authStore"

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    useAuthStore.getState().hydrate()
  }, [])

  return (
    <div className="flex min-h-dvh">
      <Sidebar />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 border-border bg-sidebar p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}