"use client"

import { motion } from "framer-motion"
import { Check, Mic, ShieldAlert, X } from "lucide-react"
import { ENROLLMENT_PHRASE } from "@/lib/voice-agents"
import { useWorkspace } from "@/components/workspace-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const statusTone: Record<string, string> = {
  verified:
    "bg-[var(--aksh-teal)]/15 text-[var(--aksh-teal-ink)] border-[var(--aksh-teal)]/30",
  pending:
    "bg-[var(--aksh-sun)]/20 text-[var(--aksh-coral-ink)] border-[var(--aksh-sun)]/40",
  rejected:
    "bg-[var(--aksh-coral)]/15 text-[var(--aksh-coral-ink)] border-[var(--aksh-coral)]/30",
  unenrolled: "bg-muted text-muted-foreground border-border/70",
}

export function VoicesView() {
  const {
    people,
    personById,
    voiceEnrollments,
    enrollVoice,
    setVoiceStatus,
    select,
    leaderPersonId,
  } = useWorkspace()

  const pending = voiceEnrollments.filter((v) => v.status === "pending")
  const verified = voiceEnrollments.filter((v) => v.status === "verified")

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-3xl border border-border/70 bg-card/80 p-5 backdrop-blur-sm sm:p-6">
        <header className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--aksh-teal-ink)]">
            Leader gate
          </p>
          <h2 className="mt-1 font-heading text-xl font-semibold tracking-tight">
            Voice enrollment
          </h2>
          <p className="mt-2 max-w-[52ch] text-sm leading-6 text-[var(--aksh-ink-soft)]">
            Each teammate reads the sample paragraph.{" "}
            {personById(leaderPersonId)?.name.split(" ")[0] ?? "Leader"} marks
            Verified or Rejected before agents may attribute speech to that
            person for scoring.
          </p>
        </header>

        <div className="mb-5 rounded-2xl border border-dashed border-[var(--aksh-teal)]/35 bg-[var(--aksh-mist)]/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--aksh-teal-ink)]">
            Sample paragraph
          </p>
          <p className="mt-2 text-sm leading-6 text-foreground/90">
            “{ENROLLMENT_PHRASE}”
          </p>
        </div>

        <ul className="space-y-3">
          {people.map((person, i) => {
            const enrollment = voiceEnrollments.find(
              (v) => v.personId === person.id
            )
            const status = enrollment?.status ?? "unenrolled"
            return (
              <motion.li
                key={person.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * i }}
                className="rounded-2xl border border-border/70 bg-background/70 p-3.5 sm:p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <button
                    type="button"
                    className="flex min-w-0 items-center gap-3 text-left"
                    onClick={() => select({ kind: "person", id: person.id })}
                  >
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: person.color }}
                    >
                      {person.initials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {person.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {person.role}
                        {enrollment?.audioLabel
                          ? ` · ${enrollment.audioLabel}`
                          : ""}
                      </p>
                    </div>
                  </button>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize",
                      statusTone[status]
                    )}
                  >
                    {status}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {(status === "unenrolled" || status === "rejected") && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() =>
                        enrollVoice(
                          person.id,
                          `${person.initials.toLowerCase()}-enroll.wav`
                        )
                      }
                    >
                      <Mic className="size-3.5" />
                      Record sample
                    </Button>
                  )}
                  {status === "pending" && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-full bg-[var(--aksh-teal)] text-white hover:bg-[var(--aksh-teal)]/90"
                        onClick={() =>
                          setVoiceStatus(person.id, "verified", "Leader OK")
                        }
                      >
                        <Check className="size-3.5" />
                        Verify
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() =>
                          setVoiceStatus(
                            person.id,
                            "rejected",
                            "Needs clearer sample"
                          )
                        }
                      >
                        <X className="size-3.5" />
                        Reject
                      </Button>
                    </>
                  )}
                  {status === "verified" && person.id !== leaderPersonId && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="rounded-full text-muted-foreground"
                      onClick={() => setVoiceStatus(person.id, "pending")}
                    >
                      Re-review
                    </Button>
                  )}
                </div>
              </motion.li>
            )
          })}
        </ul>
      </section>

      <div className="grid gap-6 self-start">
        <section className="rounded-3xl border border-border/70 bg-card/80 p-5 backdrop-blur-sm sm:p-6">
          <header className="mb-3 flex items-center gap-2">
            <ShieldAlert className="size-4 text-[var(--aksh-coral)]" />
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              Attestation rule
            </h2>
          </header>
          <p className="text-sm leading-6 text-[var(--aksh-ink-soft)]">
            No automatic score or permanent board task without leader
            attestation on voice↔person <em>or</em> assignee confirmation of
            the action item. Agents propose; people seal.
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-[var(--aksh-mist)]/80 px-3 py-3">
              <dt className="text-xs text-muted-foreground">Verified</dt>
              <dd className="mt-1 font-heading text-2xl font-bold tabular-nums text-[var(--aksh-teal-ink)]">
                {verified.length}
              </dd>
            </div>
            <div className="rounded-2xl bg-[var(--aksh-coral)]/10 px-3 py-3">
              <dt className="text-xs text-muted-foreground">Awaiting leader</dt>
              <dd className="mt-1 font-heading text-2xl font-bold tabular-nums text-[var(--aksh-coral-ink)]">
                {pending.length}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-3xl border border-[var(--aksh-coral)]/20 bg-gradient-to-br from-card to-[var(--aksh-mist)] p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Demo tip
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--aksh-ink-soft)]">
            Record Evan (unenrolled) and verify Riley (pending), then run a
            meeting — attribution and scorecard sealing respect this gate.
          </p>
        </section>
      </div>
    </div>
  )
}
