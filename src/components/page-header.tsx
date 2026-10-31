"use client"

import Link from "next/link"
import type { AreaMeta, ViewMeta } from "@/lib/views"
import { pathForView } from "@/lib/views"
import { cn } from "@/lib/utils"

export function PageHeader({
  area,
  view,
  children,
  className,
}: {
  area: AreaMeta
  view: ViewMeta
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("mb-5 space-y-4 sm:mb-6", className)}>
      <div className="max-w-2xl">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--aksh-teal-ink)]"
        >
          <Link
            href={pathForView(area.defaultView)}
            className="transition-colors hover:text-foreground"
          >
            {area.label}
          </Link>
          <span className="text-muted-foreground/70" aria-hidden>
            /
          </span>
          <span className="text-foreground/80">{view.label}</span>
        </nav>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-[-0.04em] text-foreground sm:text-4xl">
          {view.title}
        </h1>
        <p className="mt-2 max-w-[52ch] text-sm leading-6 text-[var(--aksh-ink-soft)] sm:text-[15px]">
          {view.description}
        </p>
      </div>
      {children}
    </div>
  )
}
