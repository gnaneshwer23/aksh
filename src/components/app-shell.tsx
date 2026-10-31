"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { Bell, Menu, Plus, Search, X } from "lucide-react"
import { Brand } from "@/components/brand"
import { CopilotOrb } from "@/components/copilot-orb"
import { ViewTabs } from "@/components/view-tabs"
import { BoardView } from "@/components/views/board-view"
import { TimelineView } from "@/components/views/timeline-view"
import { TeamView } from "@/components/views/team-view"
import { InboxView } from "@/components/views/inbox-view"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useWorkspace } from "@/components/workspace-context"
import {
  copilotSteps,
  inboxThreads,
  projects,
  views,
  type ViewId,
} from "@/lib/data"
import { viewFromPathname } from "@/lib/views"
import { cn } from "@/lib/utils"

export function AppShell() {
  const pathname = usePathname()
  const router = useRouter()
  const view = viewFromPathname(pathname)
  const {
    tasks,
    project,
    setProject,
    query,
    setQuery,
    moveTask,
    promoteHighPriorityTodos,
    select,
  } = useWorkspace()

  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [copilotActive, setCopilotActive] = useState(false)
  const [copilotLine, setCopilotLine] = useState(0)

  const unread = useMemo(
    () => inboxThreads.filter((t) => t.unread).length,
    []
  )

  useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname])

  function goToView(id: ViewId) {
    router.push(`/${id}`)
  }

  function runCopilot() {
    setCopilotActive(true)
    setCopilotLine(0)
    copilotSteps.forEach((_, i) => {
      window.setTimeout(() => setCopilotLine(i), i * 700)
    })
    window.setTimeout(() => {
      promoteHighPriorityTodos()
      goToView("board")
      setCopilotActive(false)
    }, copilotSteps.length * 700 + 400)
  }

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 aksh-atmosphere"
        aria-hidden
      />

      <header className="sticky top-0 z-40 border-b border-border/50 bg-[color-mix(in_oklab,var(--background)_78%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-3 px-4 sm:h-16 sm:px-6">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open navigation"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="size-5" />
          </Button>

          <Link href="/board" className="min-w-0">
            <Brand size="lg" className="sm:gap-3" />
          </Link>
          <span className="hidden truncate text-sm font-medium text-muted-foreground md:inline">
            playful work for small teams
          </span>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  if (view !== "board") goToView("board")
                }}
                onFocus={() => {
                  if (view !== "board") goToView("board")
                }}
                placeholder="Search tasks…"
                className="h-8 w-48 rounded-full border-border/60 bg-card/70 pl-8 text-sm lg:w-56"
                aria-label="Search tasks"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full md:hidden"
              aria-label="Search tasks"
              aria-expanded={mobileSearchOpen}
              onClick={() => {
                setMobileSearchOpen((v) => !v)
                if (view !== "board") goToView("board")
              }}
            >
              <Search className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="relative rounded-full"
              aria-label="Notifications"
              onClick={() => goToView("inbox")}
            >
              <Bell className="size-4" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-[var(--aksh-coral)]" />
              )}
            </Button>
            <Button
              type="button"
              size="icon"
              className="rounded-full bg-[var(--aksh-coral)] text-[var(--aksh-coral-ink)] hover:bg-[var(--aksh-coral)]/90 sm:hidden"
              aria-label="New task"
              onClick={() => select({ kind: "new-task" })}
            >
              <Plus className="size-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              className="hidden rounded-full bg-[var(--aksh-coral)] text-[var(--aksh-coral-ink)] hover:bg-[var(--aksh-coral)]/90 sm:inline-flex"
              onClick={() => select({ kind: "new-task" })}
            >
              <Plus className="size-3.5" />
              New task
            </Button>
          </div>
        </div>
        <AnimatePresence>
          {mobileSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border/40 px-4 py-3 md:hidden"
            >
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tasks…"
                  className="h-9 rounded-full border-border/60 bg-card/70 pl-8 text-sm"
                  aria-label="Search tasks"
                  autoFocus
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="mx-auto flex w-full max-w-[1280px] flex-1 gap-0 px-0 sm:px-6 lg:gap-6 lg:py-6">
        <aside className="hidden w-56 shrink-0 flex-col gap-6 lg:flex">
          <nav className="flex flex-col gap-1 rounded-3xl border border-border/60 bg-card/70 p-2 backdrop-blur-sm">
            {views.map((item) => (
              <Link
                key={item.id}
                href={`/${item.id}`}
                className={cn(
                  "rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  view === item.id
                    ? "bg-[var(--aksh-mist)] text-foreground"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  {item.label}
                  {item.id === "inbox" && unread > 0 && (
                    <span className="rounded-full bg-[var(--aksh-coral)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--aksh-coral-ink)]">
                      {unread}
                    </span>
                  )}
                </span>
              </Link>
            ))}
          </nav>

          <div className="rounded-3xl border border-border/60 bg-card/70 p-3 backdrop-blur-sm">
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Project
            </p>
            <div className="flex flex-col gap-1">
              {["All", ...projects].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setProject(p)
                    if (view !== "board") goToView("board")
                  }}
                  className={cn(
                    "rounded-xl px-2.5 py-2 text-left text-sm transition-colors",
                    project === p
                      ? "bg-[var(--aksh-mist)] font-semibold text-foreground"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto rounded-3xl border border-[var(--aksh-coral)]/20 bg-gradient-to-br from-card to-[var(--aksh-mist)] p-4">
            <div className="mb-3 flex items-center gap-3">
              <CopilotOrb active={copilotActive} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--aksh-coral-ink)]">
                  Copilot
                </p>
                <p className="text-sm text-[var(--aksh-ink-soft)]">
                  {copilotActive
                    ? copilotSteps[copilotLine]
                    : "Balance the sprint in one tap."}
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              className="w-full rounded-full bg-[var(--aksh-coral)] text-[var(--aksh-coral-ink)] hover:bg-[var(--aksh-coral)]/90"
              onClick={runCopilot}
              disabled={copilotActive}
            >
              {copilotActive ? "Running…" : "Replay plan"}
            </Button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-4 sm:px-0 sm:py-0">
          <div className="mb-5 space-y-4 sm:mb-6">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--aksh-teal-ink)]">
                Workspace
              </p>
              <h1 className="mt-1 font-heading text-3xl font-bold tracking-[-0.04em] text-foreground sm:text-4xl">
                <span className="text-[var(--aksh-coral)]">aksh</span>
                <span className="text-foreground/80"> · </span>
                {views.find((n) => n.id === view)?.label}
              </h1>
              <p className="mt-2 max-w-[40ch] text-sm leading-6 text-[var(--aksh-ink-soft)] sm:text-[15px]">
                Board, roadmap, team capacity, and inbox — a light sprint
                surface with scripted copilot chrome.
              </p>
            </div>
            <ViewTabs />
          </div>

          <div className="mb-4 flex gap-2 overflow-x-auto lg:hidden">
            {["All", ...projects].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setProject(p)
                  if (view !== "board") goToView("board")
                }}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  project === p
                    ? "bg-[var(--aksh-coral)] text-[var(--aksh-coral-ink)]"
                    : "bg-card/80 text-muted-foreground ring-1 ring-border/70"
                )}
              >
                {p}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {view === "board" && (
                <BoardView
                  project={project}
                  tasks={tasks}
                  query={query}
                  onMove={moveTask}
                />
              )}
              {view === "timeline" && <TimelineView />}
              {view === "team" && <TeamView />}
              {view === "inbox" && <InboxView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-foreground/25 backdrop-blur-[2px]"
              aria-label="Close navigation"
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="absolute inset-y-0 left-0 flex w-[280px] flex-col gap-4 border-r border-border bg-background p-4 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <Brand size="md" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileNavOpen(false)}
                  aria-label="Close"
                >
                  <X className="size-5" />
                </Button>
              </div>
              <nav className="flex flex-col gap-1">
                {views.map((item) => (
                  <Link
                    key={item.id}
                    href={`/${item.id}`}
                    onClick={() => setMobileNavOpen(false)}
                    className={cn(
                      "rounded-2xl px-3 py-2.5 text-left text-sm font-medium",
                      view === item.id
                        ? "bg-[var(--aksh-mist)]"
                        : "text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  setMobileNavOpen(false)
                  select({ kind: "new-task" })
                }}
              >
                New task
              </Button>
              <Button
                type="button"
                className="mt-auto rounded-full bg-[var(--aksh-coral)] text-[var(--aksh-coral-ink)]"
                onClick={() => {
                  setMobileNavOpen(false)
                  runCopilot()
                }}
              >
                Replay copilot plan
              </Button>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
