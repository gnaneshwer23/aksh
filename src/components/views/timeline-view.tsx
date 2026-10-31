"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useWorkspace } from "@/components/workspace-context"
import { cn } from "@/lib/utils"

const TOTAL_DAYS = 18

export function TimelineView() {
  const { select, selection, timelineItems, personById } = useWorkspace()
  const [showDeps, setShowDeps] = useState(true)
  const [tilt, setTilt] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={showDeps ? "default" : "outline"}
          className="rounded-full"
          onClick={() => setShowDeps((v) => !v)}
        >
          Dependencies {showDeps ? "on" : "off"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tilt ? "default" : "outline"}
          className="rounded-full"
          onClick={() => setTilt((v) => !v)}
        >
          Perspective {tilt ? "on" : "off"}
        </Button>
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-3xl border border-border/70 bg-card/80 p-4 backdrop-blur-sm transition-transform duration-500 sm:p-5",
          tilt && "[transform:perspective(900px)_rotateX(8deg)] origin-top"
        )}
      >
        <div className="mb-3 grid grid-cols-[minmax(100px,160px)_1fr] gap-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Track
          </div>
          <div className="relative h-6">
            <div className="absolute inset-0 flex">
              {Array.from({ length: TOTAL_DAYS }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 border-l border-border/40 text-center text-[10px] text-muted-foreground first:border-l-0"
                >
                  {i % 3 === 0 ? `D${i + 1}` : ""}
                </div>
              ))}
            </div>
          </div>
        </div>

        <ul className="space-y-3">
          {timelineItems.map((item, i) => {
            const owner = personById(item.ownerId)
            const left = (item.start / TOTAL_DAYS) * 100
            const width = ((item.end - item.start) / TOTAL_DAYS) * 100
            const dep = showDeps
              ? timelineItems.find((t) => t.id === item.dependsOn)
              : undefined
            const active =
              selection?.kind === "timeline" && selection.id === item.id

            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => select({ kind: "timeline", id: item.id })}
                  className={cn(
                    "grid w-full grid-cols-[minmax(100px,160px)_1fr] items-center gap-3 rounded-2xl px-1 py-1 text-left transition-colors",
                    active ? "bg-[var(--aksh-mist)]" : "hover:bg-muted/50"
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium tracking-tight">
                      {item.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {owner?.name}
                    </p>
                  </div>
                  <div className="relative h-10 rounded-xl bg-[var(--aksh-mist)]/50">
                    {dep && (
                      <div
                        className="pointer-events-none absolute top-1/2 h-px -translate-y-1/2 border-t border-dashed border-[var(--aksh-coral)]/50"
                        style={{
                          left: `${(dep.end / TOTAL_DAYS) * 100}%`,
                          width: `${left - (dep.end / TOTAL_DAYS) * 100}%`,
                        }}
                      />
                    )}
                    <motion.div
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      transition={{
                        delay: 0.06 + i * 0.05,
                        duration: 0.45,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="absolute top-1.5 bottom-1.5 rounded-lg px-2.5 shadow-sm"
                      style={{
                        left: `${left}%`,
                        width: `${Math.max(width, 4)}%`,
                        backgroundColor: item.color,
                        transformOrigin: "left center",
                      }}
                    >
                      <span className="flex h-full items-center truncate text-[11px] font-semibold text-white">
                        {item.title}
                      </span>
                    </motion.div>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
