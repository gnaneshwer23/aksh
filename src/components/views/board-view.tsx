"use client"

import { motion } from "framer-motion"
import { columns, type ColumnId, type Task } from "@/lib/data"
import { issueTypeLabel, issueTypeTone } from "@/lib/issue-templates"
import { Badge } from "@/components/ui/badge"
import { useWorkspace } from "@/components/workspace-context"
import { cn } from "@/lib/utils"

const priorityTone: Record<string, string> = {
  high: "bg-[var(--aksh-coral)]/15 text-[var(--aksh-coral-ink)]",
  medium: "bg-[var(--aksh-teal)]/15 text-[var(--aksh-teal-ink)]",
  low: "bg-[var(--aksh-sky)]/20 text-[var(--aksh-sky-ink)]",
}

export function BoardView({
  project,
  tasks,
  query = "",
  onMove,
}: {
  project: string
  tasks: Task[]
  query?: string
  onMove?: (taskId: string, column: ColumnId) => void
}) {
  const { select, selection, personById } = useWorkspace()
  const q = query.trim().toLowerCase()
  const visible = tasks.filter((t) => {
    if (t.archived) return false
    const projectOk = project === "All" || t.project === project
    if (!projectOk) return false
    if (!q) return true
    return (
      t.title.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q)) ||
      t.project.toLowerCase().includes(q) ||
      t.type.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      personById(t.assigneeId)?.name.toLowerCase().includes(q)
    )
  })

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((col, colIndex) => {
        const cards = visible.filter((t) => t.column === col.id)
        return (
          <section
            key={col.id}
            className="flex w-[260px] shrink-0 flex-col gap-3 sm:w-[280px]"
          >
            <header className="flex items-center justify-between px-1">
              <h2 className="font-heading text-[15px] font-semibold tracking-tight text-foreground">
                {col.label}
              </h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {cards.length}
              </span>
            </header>
            <ul className="flex min-h-[120px] flex-col gap-2.5">
              {cards.map((task, i) => {
                const person = personById(task.assigneeId)
                const active =
                  selection?.kind === "task" && selection.id === task.id
                return (
                  <motion.li
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: colIndex * 0.05 + i * 0.04,
                      duration: 0.35,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    whileHover={{ y: -2 }}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => select({ kind: "task", id: task.id })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          select({ kind: "task", id: task.id })
                        }
                      }}
                      className={cn(
                        "group w-full cursor-pointer rounded-2xl border border-border/70 bg-card/90 p-3.5 text-left shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-sm transition-colors",
                        active
                          ? "border-[var(--aksh-coral)]/50 bg-[var(--aksh-mist)]"
                          : "hover:border-border"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[14px] font-medium leading-snug tracking-tight text-foreground">
                          {task.title}
                        </p>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            priorityTone[task.priority]
                          )}
                        >
                          {task.priority}
                        </span>
                      </div>
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            "rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            issueTypeTone(task.type)
                          )}
                          title={issueTypeLabel(task.type)}
                        >
                          {issueTypeLabel(task.type)}
                        </span>
                        {task.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="rounded-full bg-[var(--aksh-mist)] text-[11px] font-medium text-[var(--aksh-ink-soft)]"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="flex size-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                            style={{ backgroundColor: person?.color }}
                          >
                            {person?.initials}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {person?.name.split(" ")[0]}
                          </span>
                        </div>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {task.points} pts
                        </span>
                      </div>
                      {onMove && col.id !== "done" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onMove(task.id, nextColumn(col.id))
                          }}
                          className="mt-3 w-full rounded-xl bg-muted/80 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-[var(--aksh-mist)] hover:text-foreground"
                        >
                          Move forward →
                        </button>
                      )}
                    </div>
                  </motion.li>
                )
              })}
              {cards.length === 0 && (
                <li className="rounded-2xl border border-dashed border-border/80 px-3 py-8 text-center text-sm text-muted-foreground">
                  {q ? `No matches in ${col.label}` : `Nothing in ${col.label}`}
                </li>
              )}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

function nextColumn(id: ColumnId): ColumnId {
  const order: ColumnId[] = ["todo", "doing", "review", "done"]
  const idx = order.indexOf(id)
  return order[Math.min(idx + 1, order.length - 1)]
}
