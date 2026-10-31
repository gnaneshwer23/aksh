"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { views, type ViewId } from "@/lib/data"
import { viewFromPathname } from "@/lib/views"
import { cn } from "@/lib/utils"

export function ViewTabs({
  value,
  onChange,
}: {
  value?: ViewId
  onChange?: (id: ViewId) => void
}) {
  const pathname = usePathname()
  const activeId = value ?? viewFromPathname(pathname)

  return (
    <div
      role="tablist"
      aria-label="aksh views"
      className="no-scrollbar flex gap-1 overflow-x-auto rounded-full bg-secondary/80 p-1"
    >
      {views.map((view) => {
        const active = view.id === activeId
        return (
          <Link
            key={view.id}
            href={`/${view.id}`}
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
                layoutId="aksh-view-pill"
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
