"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Check,
  Loader2,
  Mic,
  Play,
  Square,
  Upload,
  UserCheck,
  X,
} from "lucide-react"
import { projects, type IssueType, type Priority } from "@/lib/data"
import { issueTemplates, issueTypeLabel } from "@/lib/issue-templates"
import {
  formatClock,
  type AgentProposal,
  type ProposalKind,
} from "@/lib/voice-agents"
import { useWorkspace } from "@/components/workspace-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function MeetingsView() {
  const {
    people,
    personById,
    meetings,
    activeMeetingId,
    startMeeting,
    updateMeetingTranscript,
    attachMeetingAudio,
    finishMeeting,
    loadDemoTranscript,
    runMeetingAgents,
    proposals,
    updateProposal,
    reviewProposal,
    isVoiceVerified,
    select,
  } = useWorkspace()

  const [title, setTitle] = useState("Nova Launch stand-up")
  const [meetingProject, setMeetingProject] = useState<string>(projects[0])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected =
    meetings.find((m) => m.id === (selectedId ?? activeMeetingId)) ??
    meetings[0] ??
    null

  const selectedProposals = useMemo(
    () =>
      selected
        ? proposals.filter((p) => p.meetingId === selected.id)
        : [],
    [proposals, selected]
  )

  const proposed = selectedProposals.filter((p) => p.status === "proposed")
  const sealed = selectedProposals.filter((p) => p.status !== "proposed")

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.25fr]">
      <div className="space-y-6">
        <section className="rounded-3xl border border-border/70 bg-card/80 p-5 backdrop-blur-sm sm:p-6">
          <header className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--aksh-teal-ink)]">
              Capture
            </p>
            <h2 className="mt-1 font-heading text-xl font-semibold tracking-tight">
              Meeting session
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--aksh-ink-soft)]">
              Start a meeting, paste a transcript (or load the demo), optionally
              attach mock audio, then finish — agents diarize, extract
              commitments vs ideas, and queue review.
            </p>
          </header>

          <div className="grid gap-3">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Title</span>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-10 rounded-xl"
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Project</span>
              <select
                value={meetingProject}
                onChange={(e) => setMeetingProject(e.target.value)}
                className="h-10 rounded-xl border border-border bg-card px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {projects.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                className="rounded-full bg-[var(--aksh-coral)] text-[var(--aksh-coral-ink)] hover:bg-[var(--aksh-coral)]/90"
                disabled={!!activeMeetingId}
                onClick={() => {
                  const id = startMeeting(title, meetingProject)
                  setSelectedId(id)
                }}
              >
                <Play className="size-3.5" />
                Start meeting
              </Button>
              {activeMeetingId && (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => finishMeeting(activeMeetingId)}
                >
                  <Square className="size-3.5" />
                  Finish &amp; run agents
                </Button>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border/70 bg-card/80 p-5 backdrop-blur-sm sm:p-6">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Sessions
          </h2>
          <ul className="mt-3 space-y-2">
            {meetings.length === 0 && (
              <li className="text-sm text-muted-foreground">
                No meetings yet — start one or load the demo after starting.
              </li>
            )}
            {meetings.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(m.id)}
                  className={cn(
                    "w-full rounded-2xl border px-3 py-2.5 text-left transition-colors",
                    selected?.id === m.id
                      ? "border-[var(--aksh-coral)]/40 bg-[var(--aksh-mist)]"
                      : "border-border/70 bg-background/60 hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{m.title}</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {m.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {m.project}
                    {m.audioLabel ? ` · ${m.audioLabel}` : ""}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="space-y-6">
        {!selected ? (
          <section className="rounded-3xl border border-dashed border-border/80 bg-card/50 p-8 text-center">
            <Mic className="mx-auto size-8 text-[var(--aksh-teal)]" />
            <p className="mt-3 font-heading text-lg font-semibold">
              Start a meeting to capture
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Then load the demo transcript for the full agent loop.
            </p>
          </section>
        ) : (
          <>
            <section className="rounded-3xl border border-border/70 bg-card/80 p-5 backdrop-blur-sm sm:p-6">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-heading text-xl font-semibold tracking-tight">
                    {selected.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Status: {selected.status}
                    {selected.status === "processing" && (
                      <Loader2 className="ml-2 inline size-3.5 animate-spin" />
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => loadDemoTranscript(selected.id)}
                  >
                    Load demo transcript
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() =>
                      attachMeetingAudio(
                        selected.id,
                        "nova-standup-upload.wav"
                      )
                    }
                  >
                    <Upload className="size-3.5" />
                    Mock audio
                  </Button>
                  {selected.status === "ready" && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => runMeetingAgents(selected.id)}
                    >
                      Re-run agents
                    </Button>
                  )}
                  {selected.status === "live" && (
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-full bg-[var(--aksh-coral)] text-[var(--aksh-coral-ink)]"
                      onClick={() => finishMeeting(selected.id)}
                    >
                      Finish &amp; run agents
                    </Button>
                  )}
                </div>
              </div>

              <label className="grid gap-1.5 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Transcript
                </span>
                <textarea
                  value={selected.transcriptRaw}
                  onChange={(e) =>
                    updateMeetingTranscript(selected.id, e.target.value)
                  }
                  rows={10}
                  placeholder="Paste Name: line… or load demo"
                  className="min-h-[180px] resize-y rounded-2xl border border-border bg-background/80 px-3 py-2.5 font-mono text-[12.5px] leading-relaxed outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </label>

              {selected.lines.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Mock diarization
                  </p>
                  <ul className="max-h-56 space-y-2 overflow-y-auto pr-1">
                    {selected.lines.map((line) => {
                      const person = personById(line.speakerId)
                      const verified = isVoiceVerified(line.speakerId)
                      return (
                        <li
                          key={line.id}
                          className="flex gap-3 rounded-xl border border-border/50 bg-background/60 px-3 py-2"
                        >
                          <span
                            className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                            style={{
                              backgroundColor: person?.color ?? "#94a3b8",
                            }}
                          >
                            {person?.initials ?? "?"}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold">
                                {line.speakerName}
                              </span>
                              <span className="text-[10px] tabular-nums text-muted-foreground">
                                {formatClock(line.startSec)}–
                                {formatClock(line.endSec)}
                              </span>
                              {line.speakerId !== "unknown" && (
                                <span
                                  className={cn(
                                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                                    verified
                                      ? "bg-[var(--aksh-teal)]/15 text-[var(--aksh-teal-ink)]"
                                      : "bg-[var(--aksh-sun)]/25 text-[var(--aksh-coral-ink)]"
                                  )}
                                >
                                  {verified ? "voice ok" : "unverified"}
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-sm leading-5 text-foreground/90">
                              {line.text}
                            </p>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-border/70 bg-card/80 p-5 backdrop-blur-sm sm:p-6">
              <header className="mb-4">
                <h2 className="font-heading text-lg font-semibold tracking-tight">
                  Review queue
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Agents proposed {selectedProposals.length} items ·{" "}
                  {proposed.length} awaiting seal. Confirm as leader or
                  assignee before board + scorecard impact.
                </p>
              </header>

              <AnimatePresence mode="popLayout">
                {proposed.length === 0 && sealed.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Finish the meeting (or re-run agents) to populate
                    commitments, ideas, updates, and asks.
                  </p>
                )}
                <ul className="space-y-3">
                  {proposed.map((p, i) => (
                    <ProposalEditor
                      key={p.id}
                      proposal={p}
                      index={i}
                      people={people}
                      personById={personById}
                      isVoiceVerified={isVoiceVerified}
                      onPatch={updateProposal}
                      onReview={reviewProposal}
                      onSelectPerson={(id) =>
                        select({ kind: "person", id })
                      }
                    />
                  ))}
                </ul>
              </AnimatePresence>

              {sealed.length > 0 && (
                <div className="mt-5 border-t border-border/60 pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Sealed
                  </p>
                  <ul className="space-y-2">
                    {sealed.map((p) => (
                      <li
                        key={p.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2 text-sm"
                      >
                        <span className="font-medium">{p.title}</span>
                        <span className="text-xs capitalize text-muted-foreground">
                          {p.status.replace("_", " ")}
                          {p.taskId ? " · on board" : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </>
        )}

        <p className="px-1 text-xs text-muted-foreground">
          Team of {people.length} · verified voices gate attribution for
          scorecard; confirmations still required to land permanent tasks.
        </p>
      </div>
    </div>
  )
}

const KIND_OPTIONS: ProposalKind[] = ["commitment", "idea", "update", "ask"]

function ProposalEditor({
  proposal: p,
  index,
  people,
  personById,
  isVoiceVerified,
  onPatch,
  onReview,
  onSelectPerson,
}: {
  proposal: AgentProposal
  index: number
  people: { id: string; name: string }[]
  personById: (id: string) => { name: string } | undefined
  isVoiceVerified: (id: string) => boolean
  onPatch: (
    id: string,
    patch: Partial<{
      title: string
      assigneeId: string
      issueType: IssueType
      priority: Priority
      kind: ProposalKind
    }>
  ) => void
  onReview: (
    id: string,
    decision: "confirmed" | "rejected" | "assignee_confirmed"
  ) => void
  onSelectPerson: (id: string) => void
}) {
  const [title, setTitle] = useState(p.title)
  const speaker = personById(p.speakerId)

  useEffect(() => {
    setTitle(p.title)
  }, [p.id, p.title])

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: index * 0.03 }}
      className="rounded-2xl border border-border/70 bg-background/70 p-3.5"
    >
      <div className="flex flex-wrap gap-2">
        <select
          value={p.kind}
          onChange={(e) =>
            onPatch(p.id, { kind: e.target.value as ProposalKind })
          }
          className="h-7 rounded-full border border-border/70 bg-[var(--aksh-mist)] px-2 text-[11px] font-semibold capitalize text-[var(--aksh-teal-ink)] outline-none"
          aria-label="Proposal kind"
        >
          {KIND_OPTIONS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <select
          value={p.issueType}
          onChange={(e) =>
            onPatch(p.id, { issueType: e.target.value as IssueType })
          }
          className="h-7 rounded-full border border-border/70 bg-card px-2 text-[11px] font-semibold uppercase outline-none"
          aria-label="Issue type"
        >
          {issueTemplates.map((t) => (
            <option key={t.type} value={t.type}>
              {issueTypeLabel(t.type)}
            </option>
          ))}
        </select>
        <select
          value={p.priority}
          onChange={(e) =>
            onPatch(p.id, { priority: e.target.value as Priority })
          }
          className="h-7 rounded-full border border-border/70 bg-card px-2 text-[11px] font-semibold capitalize outline-none"
          aria-label="Priority"
        >
          {(["low", "medium", "high"] as Priority[]).map((pr) => (
            <option key={pr} value={pr}>
              {pr}
            </option>
          ))}
        </select>
      </div>

      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => {
          const next = title.trim()
          if (next && next !== p.title) onPatch(p.id, { title: next })
          else setTitle(p.title)
        }}
        className="mt-2 h-9 rounded-xl text-sm font-medium"
        aria-label="Proposal title"
      />

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Speaker {speaker?.name ?? "?"}</span>
        <span>→</span>
        <label className="inline-flex items-center gap-1.5">
          <span>assignee</span>
          <select
            value={p.assigneeId}
            onChange={(e) => onPatch(p.id, { assigneeId: e.target.value })}
            className="h-7 rounded-lg border border-border/70 bg-card px-2 text-xs font-semibold text-foreground outline-none"
          >
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="font-semibold text-foreground underline-offset-2 hover:underline"
          onClick={() => onSelectPerson(p.assigneeId)}
        >
          Open profile
        </button>
        {!isVoiceVerified(p.speakerId) && (
          <span className="text-[var(--aksh-coral)]">
            (speaker voice not verified — prefer assignee confirm)
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          className="rounded-full bg-[var(--aksh-teal)] text-white hover:bg-[var(--aksh-teal)]/90"
          onClick={() => onReview(p.id, "confirmed")}
        >
          <Check className="size-3.5" />
          Leader confirm
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-full"
          onClick={() => onReview(p.id, "assignee_confirmed")}
        >
          <UserCheck className="size-3.5" />
          Assignee confirm
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="rounded-full"
          onClick={() => onReview(p.id, "rejected")}
        >
          <X className="size-3.5" />
          Reject
        </Button>
      </div>
    </motion.li>
  )
}
