"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { inboxThreads } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function InboxView() {
  const [selectedId, setSelectedId] = useState(inboxThreads[0]?.id)
  const [read, setRead] = useState<Record<string, boolean>>({})
  const [showSummary, setShowSummary] = useState(true)
  const [sent, setSent] = useState<Record<string, boolean>>({})

  const selected =
    inboxThreads.find((t) => t.id === selectedId) ?? inboxThreads[0]

  return (
    <div className="grid min-h-[420px] overflow-hidden rounded-3xl border border-border/70 bg-card/80 backdrop-blur-sm lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <ul className="divide-y divide-border/50 border-b border-border/50 lg:border-r lg:border-b-0">
        {inboxThreads.map((thread, i) => {
          const isUnread = thread.unread && !read[thread.id]
          const active = thread.id === selected?.id
          return (
            <motion.li
              key={thread.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
            >
              <button
                type="button"
                onClick={() => {
                  setSelectedId(thread.id)
                  setRead((prev) => ({ ...prev, [thread.id]: true }))
                }}
                className={cn(
                  "flex w-full flex-col gap-1 px-4 py-3.5 text-left transition-colors",
                  active ? "bg-[var(--aksh-mist)]" : "hover:bg-muted/60"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-semibold tracking-tight">
                    {isUnread && (
                      <span className="size-2 rounded-full bg-[var(--aksh-coral)]" />
                    )}
                    <span
                      className="flex size-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: thread.color }}
                    >
                      {thread.initials}
                    </span>
                    {thread.from}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {thread.time}
                  </span>
                </div>
                <p className="truncate text-sm text-foreground">
                  {thread.subject}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {thread.preview}
                </p>
              </button>
            </motion.li>
          )
        })}
      </ul>

      <AnimatePresence mode="wait">
        {selected && (
          <motion.article
            key={selected.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-4 p-5 sm:p-6"
          >
            <header>
              <h2 className="font-heading text-xl font-semibold tracking-tight">
                {selected.subject}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                From {selected.from} · {selected.time}
              </p>
            </header>

            <p className="text-[15px] leading-relaxed text-foreground/90">
              {selected.body}
            </p>

            <div className="rounded-2xl border border-[var(--aksh-teal)]/20 bg-[var(--aksh-mist)]/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">aksh summary</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSummary((v) => !v)}
                >
                  {showSummary ? "Hide" : "Reveal"}
                </Button>
              </div>
              <AnimatePresence initial={false}>
                {showSummary && (
                  <motion.p
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden text-sm leading-relaxed text-[var(--aksh-ink-soft)]"
                  >
                    <span className="mt-2 block">{selected.summary}</span>
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Draft reply
              </p>
              <p className="text-sm leading-relaxed text-foreground/90">
                {selected.draft}
              </p>
            </div>

            <div className="mt-auto flex flex-wrap gap-2 pt-2">
              <Button
                type="button"
                className="rounded-full bg-[var(--aksh-coral)] text-[var(--aksh-coral-ink)] hover:bg-[var(--aksh-coral)]/90"
                onClick={() => {
                  setRead((prev) => ({ ...prev, [selected.id]: true }))
                  setSent((prev) => ({ ...prev, [selected.id]: true }))
                }}
              >
                {sent[selected.id] ? "Sent locally" : "Send draft"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() =>
                  setRead((prev) => ({ ...prev, [selected.id]: true }))
                }
              >
                Mark read
              </Button>
            </div>
          </motion.article>
        )}
      </AnimatePresence>
    </div>
  )
}
