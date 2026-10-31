"use client"

import { motion } from "framer-motion"
import { views, type ViewId } from "@/lib/data"
import { cn } from "@/lib/utils"

export function ViewTabs({
  value,
  onChange,
}: {
  value: ViewId
  onChange: (id: ViewId) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="aksh views"
      className="no-scrollbar flex gap-1 overflow-x-auto rounded-full bg-secondary/80 p-1"
    >
      {views.map((view) => {
        const active = view.id === value
        return (
          <button
            key={view.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(view.id)}
            className={cn(
              "relative h-9 min-w-max flex-1 rounded-full px-3.5 text-[13px] font-semibold transition-colors",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {active && (
              <motion.span
                layoutId="aksh-view-pill"
                className="absolute inset-0 rounded-full bg-card shadow-[0_1px_2px_rgba(26,20,16,0.12)]"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative">{view.label}</span>
          </button>
        )
      })}
    </div>
  )
}
