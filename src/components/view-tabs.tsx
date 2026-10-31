"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import type { ViewId } from "@/lib/data"
import {
  areaFromPathname,
  viewFromPathname,
  viewsInArea,
} from "@/lib/views"
import { cn } from "@/lib/utils"

export function ViewTabs({
  value,
  onChange,
}: {
  value?: ViewId
  onChange?: (id: ViewId) => void
}) {
  const pathname = usePathname()
  const area = areaFromPathname(pathname)
  const activeId = value ?? viewFromPathname(pathname)
  const siblings = viewsInArea(area.id)

  if (siblings.length < 2) return null

  return (
    <div
      role="tablist"
      aria-label={`${area.label} views`}
      className="no-scrollbar flex w-full max-w-md gap-1 overflow-x-auto rounded-full bg-secondary/80 p-1"
    >
      {siblings.map((view) => {
        const active = view.id === activeId
        return (
          <Link
            key={view.id}
            href={view.path}
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(view.id)}
            className={cn(
              "relative h-9 min-w-max flex-1 rounded-full px-3.5 text-center text-[13px] font-semibold transition-colors",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {active && (
              <motion.span
                layoutId={`aksh-area-pill-${area.id}`}
                className="absolute inset-0 rounded-full bg-card shadow-[0_1px_2px_rgba(26,20,16,0.12)]"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative inline-flex h-full items-center justify-center">
              {view.label}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
