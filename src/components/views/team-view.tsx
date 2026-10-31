"use client"

import { motion } from "framer-motion"
import { people } from "@/lib/data"
import { useWorkspace } from "@/components/workspace-context"
import { cn } from "@/lib/utils"

const burndown = [
  { day: "Mon", remaining: 42 },
  { day: "Tue", remaining: 38 },
  { day: "Wed", remaining: 31 },
  { day: "Thu", remaining: 27 },
  { day: "Fri", remaining: 18 },
  { day: "Sat", remaining: 14 },
  { day: "Sun", remaining: 9 },
]

export function TeamView() {
  const { select, selection } = useWorkspace()
  const maxCap = Math.max(...people.map((m) => m.capacity), 1)
  const maxRemain = Math.max(...burndown.map((b) => b.remaining), 1)

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-3xl border border-border/70 bg-card/80 p-5 backdrop-blur-sm sm:p-6">
        <header className="mb-5">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Weekly workload
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Hours booked versus capacity for this sample week.
          </p>
        </header>
        <ul className="space-y-4">
          {people.map((m, i) => {
            const pct = Math.round((m.allocated / m.capacity) * 100)
            const active =
              selection?.kind === "person" && selection.id === m.id
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => select({ kind: "person", id: m.id })}
                  className={cn(
                    "grid w-full gap-2 rounded-2xl px-2 py-2 text-left transition-colors",
                    active ? "bg-[var(--aksh-mist)]" : "hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex size-8 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: m.color }}
                      >
                        {m.initials}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.role}</p>
                      </div>
                    </div>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {m.allocated}h / {m.capacity}h · {pct}%
                    </p>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-[var(--aksh-mist)]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(m.allocated / maxCap) * 100}%` }}
                      transition={{
                        delay: 0.1 + i * 0.06,
                        duration: 0.55,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="h-full rounded-full"
                      style={{
                        backgroundColor:
                          pct > 95 ? "var(--aksh-coral)" : m.color,
                      }}
                    />
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <div className="grid gap-6">
        <section className="rounded-3xl border border-border/70 bg-card/80 p-5 backdrop-blur-sm sm:p-6">
          <header className="mb-4">
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              Team orbit
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Who is close to capacity this week.
            </p>
          </header>
          <div className="relative mx-auto aspect-square max-w-[260px]">
            <div className="absolute inset-6 rounded-full border border-dashed border-[var(--aksh-teal)]/30" />
            <div className="absolute inset-14 rounded-full border border-dashed border-[var(--aksh-coral)]/25" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-heading text-sm font-semibold text-[var(--aksh-ink-soft)]">
                aksh
              </span>
            </div>
            {people.map((m, i) => {
              const angle = (i / people.length) * Math.PI * 2 - Math.PI / 2
              const radius = 38 + (m.allocated / m.capacity) * 28
              const x = 50 + Math.cos(angle) * radius * 0.72
              const y = 50 + Math.sin(angle) * radius * 0.72
              const active =
                selection?.kind === "person" && selection.id === m.id
              return (
                <motion.button
                  key={m.id}
                  type="button"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: active ? 1.12 : 1, opacity: 1 }}
                  transition={{
                    delay: 0.15 + i * 0.07,
                    type: "spring",
                    stiffness: 260,
                    damping: 18,
                  }}
                  className={cn(
                    "absolute flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-md outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring",
                    active && "ring-2 ring-[var(--aksh-coral)]"
                  )}
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    backgroundColor: m.color,
                  }}
                  title={m.name}
                  aria-label={`Open ${m.name}`}
                  onClick={() => select({ kind: "person", id: m.id })}
                >
                  {m.initials}
                </motion.button>
              )
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-border/70 bg-card/80 p-5 backdrop-blur-sm sm:p-6">
          <header className="mb-4">
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              Burndown
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Remaining story points across the week.
            </p>
          </header>
          <div className="flex h-36 items-end gap-2">
            {burndown.map((b, i) => (
              <div key={b.day} className="flex flex-1 flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(b.remaining / maxRemain) * 100}%` }}
                  transition={{
                    delay: 0.12 + i * 0.05,
                    duration: 0.45,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="w-full rounded-t-lg bg-gradient-to-t from-[var(--aksh-teal)] to-[var(--aksh-sky)]"
                />
                <span className="text-[10px] font-medium text-muted-foreground">
                  {b.day}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
