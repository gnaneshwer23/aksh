"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { people, personById } from "@/lib/data"
import { DEFAULT_SCORE_WEIGHTS } from "@/lib/voice-agents"
import { useWorkspace } from "@/components/workspace-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function ScorecardView() {
  const {
    proposals,
    skills,
    scoreWeights,
    setScoreWeights,
    personDashboard,
    reviewSkill,
    markProposalCompleted,
    select,
  } = useWorkspace()

  const [draftWeights, setDraftWeights] = useState(scoreWeights)
  const ranked = people
    .map((p) => ({
      person: p,
      score: personDashboard(p.id).score,
    }))
    .sort((a, b) => b.score.total - a.score.total)

  const maxTotal = Math.max(...ranked.map((r) => r.score.total), 1)
  const confirmed = proposals.filter(
    (p) => p.status === "confirmed" || p.status === "assignee_confirmed"
  )
  const proposedSkills = skills.filter((s) => s.status === "proposed")

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-3xl border border-border/70 bg-card/80 p-5 backdrop-blur-sm sm:p-6">
        <header className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--aksh-teal-ink)]">
            Confirmed only
          </p>
          <h2 className="mt-1 font-heading text-xl font-semibold tracking-tight">
            Contribution scorecard
          </h2>
          <p className="mt-2 max-w-[52ch] text-sm leading-6 text-[var(--aksh-ink-soft)]">
            Draft metrics from sealed items only — ownership, completions, and
            unblocks. Weights are visible and editable; nothing scores until
            leader or assignee confirmation.
          </p>
        </header>

        <div className="mb-5 flex flex-wrap gap-3 rounded-2xl border border-border/60 bg-background/70 p-3">
          {(
            [
              ["ownership", "Ownership"],
              ["completion", "Completion"],
              ["unblock", "Unblock"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="grid min-w-[100px] flex-1 gap-1 text-sm">
              <span className="text-xs font-semibold text-muted-foreground">
                {label} ×
              </span>
              <Input
                type="number"
                min={0}
                max={20}
                value={draftWeights[key]}
                onChange={(e) =>
                  setDraftWeights((w) => ({
                    ...w,
                    [key]: Number(e.target.value) || 0,
                  }))
                }
                className="h-9 rounded-xl"
              />
            </label>
          ))}
          <div className="flex items-end gap-2">
            <Button
              type="button"
              size="sm"
              className="rounded-full bg-[var(--aksh-coral)] text-[var(--aksh-coral-ink)]"
              onClick={() => setScoreWeights(draftWeights)}
            >
              Apply weights
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="rounded-full"
              onClick={() => {
                setDraftWeights(DEFAULT_SCORE_WEIGHTS)
                setScoreWeights(DEFAULT_SCORE_WEIGHTS)
              }}
            >
              Reset
            </Button>
          </div>
        </div>

        <ul className="space-y-3">
          {ranked.map(({ person, score }, i) => {
            const pct = Math.round((score.total / maxTotal) * 100)
            return (
              <motion.li
                key={person.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
              >
                <button
                  type="button"
                  onClick={() => select({ kind: "person", id: person.id })}
                  className="w-full rounded-2xl border border-border/70 bg-background/70 px-3 py-3 text-left transition-colors hover:bg-[var(--aksh-mist)]/70 sm:px-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 text-xs font-bold tabular-nums text-muted-foreground">
                        {i + 1}
                      </span>
                      <span
                        className="flex size-8 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: person.color }}
                      >
                        {person.initials}
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{person.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          O {score.ownership} · C {score.completion} · U{" "}
                          {score.unblock}
                          {score.confirmedCount === 0
                            ? " · no sealed signals yet"
                            : ""}
                        </p>
                      </div>
                    </div>
                    <p className="font-heading text-lg font-bold tabular-nums text-[var(--aksh-coral-ink)]">
                      {score.total}
                    </p>
                  </div>
                  <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-[var(--aksh-mist)]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{
                        delay: 0.1 + i * 0.04,
                        duration: 0.5,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: person.color }}
                    />
                  </div>
                </button>
              </motion.li>
            )
          })}
        </ul>
      </section>

      <div className="space-y-6">
        <section className="rounded-3xl border border-border/70 bg-card/80 p-5 backdrop-blur-sm sm:p-6">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Sealed commitments
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {confirmed.length} confirmed · mark complete to credit completion
            signal.
          </p>
          <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
            {confirmed.length === 0 && (
              <li className="text-sm text-muted-foreground">
                Confirm proposals in Meetings to populate this list.
              </li>
            )}
            {confirmed.map((p) => {
              const assignee = personById(p.assigneeId)
              return (
                <li
                  key={p.id}
                  className="rounded-xl border border-border/60 bg-background/60 px-3 py-2.5"
                >
                  <p className="text-sm font-medium">{p.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {assignee?.name} · {p.scoreSignal} · {p.status.replace("_", " ")}
                  </p>
                  {p.kind === "commitment" && p.scoreSignal !== "completion" && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mt-2 rounded-full"
                      onClick={() => markProposalCompleted(p.id)}
                    >
                      Mark complete (+completion)
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        </section>

        <section className="rounded-3xl border border-border/70 bg-card/80 p-5 backdrop-blur-sm sm:p-6">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Skills proposals
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pattern-tagged from meetings — accept, correct, or dismiss.
          </p>
          <ul className="mt-3 space-y-3">
            {proposedSkills.length === 0 && (
              <li className="text-sm text-muted-foreground">
                No open skill proposals. Run a meeting to generate tags.
              </li>
            )}
            {proposedSkills.map((s) => {
              const person = personById(s.personId)
              return (
                <SkillRow
                  key={s.id}
                  tag={s.tag}
                  rationale={s.rationale}
                  personName={person?.name ?? "?"}
                  personColor={person?.color}
                  onAccept={() => reviewSkill(s.id, "accepted")}
                  onDismiss={() => reviewSkill(s.id, "dismissed")}
                  onCorrect={(tag) => reviewSkill(s.id, "corrected", tag)}
                />
              )
            })}
          </ul>

          {skills.some((s) => s.status !== "proposed") && (
            <div className="mt-4 border-t border-border/60 pt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Settled skills
              </p>
              <ul className="flex flex-wrap gap-2">
                {skills
                  .filter((s) => s.status !== "proposed")
                  .map((s) => (
                    <li
                      key={s.id}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                        s.status === "dismissed"
                          ? "border-border/60 text-muted-foreground line-through"
                          : "border-[var(--aksh-teal)]/30 bg-[var(--aksh-teal)]/10 text-[var(--aksh-teal-ink)]"
                      )}
                    >
                      {personById(s.personId)?.initials}: {s.tag}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function SkillRow({
  tag,
  rationale,
  personName,
  personColor,
  onAccept,
  onDismiss,
  onCorrect,
}: {
  tag: string
  rationale: string
  personName: string
  personColor?: string
  onAccept: () => void
  onDismiss: () => void
  onCorrect: (tag: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(tag)

  return (
    <li className="rounded-2xl border border-border/70 bg-background/70 p-3">
      <div className="flex items-center gap-2">
        <span
          className="size-2.5 rounded-full"
          style={{ backgroundColor: personColor ?? "#94a3b8" }}
        />
        <span className="text-sm font-semibold">{personName}</span>
        {!editing ? (
          <span className="rounded-full bg-[var(--aksh-mist)] px-2 py-0.5 text-[11px] font-semibold text-[var(--aksh-teal-ink)]">
            {tag}
          </span>
        ) : (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-8 max-w-[140px] rounded-full"
          />
        )}
      </div>
      <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
        {rationale}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {!editing ? (
          <>
            <Button
              type="button"
              size="sm"
              className="rounded-full bg-[var(--aksh-teal)] text-white hover:bg-[var(--aksh-teal)]/90"
              onClick={onAccept}
            >
              Accept
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => setEditing(true)}
            >
              Correct
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="rounded-full"
              onClick={onDismiss}
            >
              Dismiss
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              size="sm"
              className="rounded-full bg-[var(--aksh-coral)] text-[var(--aksh-coral-ink)]"
              onClick={() => {
                onCorrect(value)
                setEditing(false)
              }}
            >
              Save tag
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="rounded-full"
              onClick={() => {
                setValue(tag)
                setEditing(false)
              }}
            >
              Cancel
            </Button>
          </>
        )}
      </div>
    </li>
  )
}
