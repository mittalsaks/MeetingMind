import type { LucideIcon } from "lucide-react"
import { Construction } from "lucide-react"
import { FadeIn } from "@/components/motion"
import { PageHeader } from "@/components/page-header"

export function ComingSoon({
  title,
  description,
  icon: Icon = Construction,
  features = [],
}: {
  title: string
  description: string
  icon?: LucideIcon
  features?: string[]
}) {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title={title} description={description} />
      <FadeIn className="glass-strong rounded-3xl border border-border p-10 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          <Icon className="size-7" />
        </div>
        <h2 className="mt-5 text-xl font-semibold">This module is on the roadmap</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {title} is part of the MeetingMind automation suite. Here&apos;s what it will include:
        </p>
        {features.length > 0 && (
          <ul className="mx-auto mt-6 grid max-w-lg gap-2 text-left sm:grid-cols-2">
            {features.map((f) => (
              <li
                key={f}
                className="flex items-center gap-2 rounded-lg border border-border bg-card/40 px-3 py-2 text-sm text-foreground/90"
              >
                <span className="size-1.5 rounded-full bg-primary" />
                {f}
              </li>
            ))}
          </ul>
        )}
      </FadeIn>
    </div>
  )
}
