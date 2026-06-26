import { FadeIn } from "@/components/motion"

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children?: React.ReactNode
}) {
  return (
    <FadeIn className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-pretty text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="max-w-2xl text-pretty text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </FadeIn>
  )
}
