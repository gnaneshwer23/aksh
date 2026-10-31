"use client"

import Link from "next/link"
import { areas, pathForView, viewMeta } from "@/lib/views"
import type { ViewId } from "@/lib/data"
import { cn } from "@/lib/utils"

export function DashboardNav({
  activeView,
  unread = 0,
  pendingReviewCount = 0,
  onNavigate,
  className,
}: {
  activeView: ViewId
  unread?: number
  pendingReviewCount?: number
  onNavigate?: () => void
  className?: string
}) {
  const activeArea = viewMeta[activeView].area

  return (
    <nav
      className={cn("flex flex-col gap-4", className)}
      aria-label="Dashboard areas"
    >
      {areas.map((area) => (
        <DashboardAreaGroup
          key={area.id}
          label={area.label}
          viewIds={area.views}
          activeView={activeView}
          isActiveArea={area.id === activeArea}
          unread={unread}
          pendingReviewCount={pendingReviewCount}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  )
}

function DashboardAreaGroup({
  label,
  viewIds,
  activeView,
  isActiveArea,
  unread,
  pendingReviewCount,
  onNavigate,
}: {
  label: string
  viewIds: ViewId[]
  activeView: ViewId
  isActiveArea: boolean
  unread: number
  pendingReviewCount: number
  onNavigate?: () => void
}) {
  return (
    <div>
      <p
        className={cn(
          "mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-[0.14em]",
          isActiveArea
            ? "text-[var(--aksh-teal-ink)]"
            : "text-muted-foreground"
        )}
      >
        {label}
      </p>
      <ul className="flex flex-col gap-0.5">
        {viewIds.map((id) => {
          const meta = viewMeta[id]
          const active = activeView === id
          return (
            <li key={id}>
              <Link
                href={pathForView(id)}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--aksh-mist)] text-foreground"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                )}
              >
                <span>{meta.label}</span>
                {id === "inbox" && unread > 0 && (
                  <span className="rounded-full bg-[var(--aksh-coral)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--aksh-coral-ink)]">
                    {unread}
                  </span>
                )}
                {(id === "meetings" || id === "voices") &&
                  pendingReviewCount > 0 && (
                    <span className="rounded-full bg-[var(--aksh-teal)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {pendingReviewCount}
                    </span>
                  )}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
