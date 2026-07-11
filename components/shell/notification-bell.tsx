"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import api from "@/lib/api/axios"

type NotificationItem = {
  _id: string
  type: string
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: string
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function NotificationBell() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get("/notifications")
      setNotifications(res.data.notifications || [])
      setUnreadCount(res.data.unreadCount || 0)
    } catch (err) {
      console.error("Failed to fetch notifications", err)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 15000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) fetchNotifications()
  }

  const handleMarkAllRead = async () => {
    try {
      await api.put("/notifications/read-all")
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error("Failed to mark all read", err)
    }
  }

  const handleItemClick = (item: NotificationItem) => {
    if (!item.read) {
      api.put(`/notifications/${item._id}/read`).catch(() => {})
    }
    if (item.link) {
      window.location.href = item.link
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-danger text-[9px] font-semibold text-white ring-2 ring-background">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] font-medium text-primary hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[360px]">
          {notifications.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            notifications.map((item) => (
              <DropdownMenuItem
                key={item._id}
                onClick={() => handleItemClick(item)}
                className={`flex flex-col items-start gap-0.5 whitespace-normal py-2.5 ${
                  !item.read ? "bg-primary/5" : ""
                }`}
              >
                <div className="flex w-full items-center gap-1.5">
                  {!item.read && <span className="size-1.5 rounded-full bg-primary" />}
                  <p className="text-xs font-semibold">{item.title}</p>
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">{item.message}</p>
                <p className="text-[10px] text-muted-foreground/70">{timeAgo(item.createdAt)}</p>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
              </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}



