import type { IssueType, Person, Priority } from "@/lib/data"
import { templateByType } from "@/lib/issue-templates"

/** Leader-gated voice enrollment status. */
export type VoiceStatus = "unenrolled" | "pending" | "verified" | "rejected"

export type VoiceEnrollment = {
  personId: string
  status: VoiceStatus
  /** Demo sample phrase the person reads aloud. */
  samplePhrase: string
  /** Optional mock audio file name for the demo shell. */
  audioLabel?: string
  enrolledAt?: string
  verifiedAt?: string
  verifiedBy?: string
  notes?: string
}

export type DiarizedLine = {
  id: string
  speakerId: string
  speakerName: string
  text: string
  startSec: number
  endSec: number
}

export type MeetingStatus = "draft" | "live" | "processing" | "ready" | "archived"

export type Meeting = {
  id: string
  title: string
  project: string
  status: MeetingStatus
  startedAt?: string
  endedAt?: string
  /** Raw pasted / uploaded transcript text. */
  transcriptRaw: string
  lines: DiarizedLine[]
  audioLabel?: string
}

export type ProposalKind = "commitment" | "idea" | "update" | "ask"

export type ProposalStatus =
  | "proposed"
  | "confirmed"
  | "rejected"
  | "assignee_confirmed"

/**
 * Agent-proposed items. Hard rule: no permanent task / score impact until
 * leader attestation on voice↔person OR assignee confirmation.
 */
export type AgentProposal = {
  id: string
  meetingId: string
  kind: ProposalKind
  title: string
  detail: string
  speakerId: string
  assigneeId: string
  issueType: IssueType
  priority: Priority
  status: ProposalStatus
  /** Linked board task once sealed into the workspace. */
  taskId?: string
  skillHints: string[]
  /** Scorecard signal category when confirmed. */
  scoreSignal: "ownership" | "completion" | "unblock" | "none"
  createdAt: string
}

export type SkillProposal = {
  id: string
  personId: string
  tag: string
  rationale: string
  status: "proposed" | "accepted" | "corrected" | "dismissed"
  correctedTag?: string
  meetingId?: string
}

export type ScoreWeights = {
  ownership: number
  completion: number
  unblock: number
}

export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  ownership: 3,
  completion: 5,
  unblock: 4,
}

export const ENROLLMENT_PHRASE =
  "Aksh verifies my voice for the product team. I commit to clear action items and honest updates in every meeting."

export const LEADER_PERSON_ID = "p1"

/** Seed enrollments — leader verified for most; a couple pending for demo. */
export function initialVoiceEnrollments(people: Person[]): VoiceEnrollment[] {
  return people.map((p, i) => {
    if (i === 0) {
      return {
        personId: p.id,
        status: "verified",
        samplePhrase: ENROLLMENT_PHRASE,
        audioLabel: "maya-enroll.wav",
        enrolledAt: "2026-10-28T10:00:00Z",
        verifiedAt: "2026-10-28T10:05:00Z",
        verifiedBy: LEADER_PERSON_ID,
        notes: "Self-attested as project leader.",
      }
    }
    if (i === people.length - 1) {
      return {
        personId: p.id,
        status: "pending",
        samplePhrase: ENROLLMENT_PHRASE,
        audioLabel: `${p.initials.toLowerCase()}-enroll.wav`,
        enrolledAt: "2026-10-30T16:20:00Z",
      }
    }
    if (i === people.length - 2) {
      return {
        personId: p.id,
        status: "unenrolled",
        samplePhrase: ENROLLMENT_PHRASE,
      }
    }
    return {
      personId: p.id,
      status: "verified",
      samplePhrase: ENROLLMENT_PHRASE,
      audioLabel: `${p.initials.toLowerCase()}-enroll.wav`,
      enrolledAt: "2026-10-28T11:00:00Z",
      verifiedAt: "2026-10-28T14:00:00Z",
      verifiedBy: LEADER_PERSON_ID,
    }
  })
}

export const DEMO_MEETING_TRANSCRIPT = `Maya Chen: Welcome everyone — Nova Launch stand-up. Let's keep it tight.
Jonas Reed: Design side — empty states are ready for review. Idea: we could reuse the soft blob for Pulse too.
Asha Patel: I'll wire the capacity gauge by Thursday. Blocking on the avatar stack spacing from Jonas.
Leo Park: I can unblock Asha — I'll land the filter hooks today and ping her.
Nina Vogel: QA will smoke-test inbox drafts once the draft-switch bug fix ships.
Sam Ortiz: Idea for later — a weekly voice digest emailed to the team.
Priya Nair: I'll own the release notes outline and post a draft in Inbox.
Kai Mendoza: Update — Atlas Ops dashboard queries are stable under load.
Riley Brooks: Can someone confirm whether we still need the paper-plane empty state?
Maya Chen: Action: Jonas confirms soft blob only; paper-plane parks. Riley, please close that ask after Jonas replies.
Evan Cole: I'll document the speaker enrollment flow for the sales demo.`

/** Mock diarization: map "Name: text" lines onto enrolled people. */
export function diarizeTranscript(
  raw: string,
  people: Person[]
): DiarizedLine[] {
  const byName = new Map(
    people.map((p) => [p.name.toLowerCase(), p] as const)
  )
  const lines = raw
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)

  let cursor = 0
  return lines.map((line, i) => {
    const match = line.match(/^([^:]+):\s*(.*)$/)
    const namePart = match?.[1]?.trim() ?? "Unknown"
    const text = match?.[2]?.trim() ?? line
    const person =
      byName.get(namePart.toLowerCase()) ??
      people.find((p) =>
        namePart.toLowerCase().includes(p.name.split(" ")[0].toLowerCase())
      )
    const startSec = cursor
    const endSec = cursor + Math.max(4, Math.min(18, text.length / 8))
    cursor = endSec + 1
    return {
      id: `line-${i + 1}`,
      speakerId: person?.id ?? "unknown",
      speakerName: person?.name ?? namePart,
      text,
      startSec,
      endSec,
    }
  })
}

type Extracted = {
  proposals: Omit<AgentProposal, "id" | "createdAt" | "status" | "meetingId">[]
  skills: Omit<SkillProposal, "id" | "status">[]
}

const COMMITMENT_RE =
  /\b(i'?ll|i will|action:|own|land|wire|ship|document|post a draft|smoke-test|close that ask)\b/i
const IDEA_RE = /\b(idea|could|we could|for later)\b/i
const ASK_RE = /\b(can someone|blocking on|confirm whether|ping)\b/i
const UPDATE_RE = /\b(update —|update:|are ready|are stable|ready for review)\b/i
const UNBLOCK_RE = /\b(unblock|blocking on|ping her)\b/i

function inferIssueType(text: string): IssueType {
  if (/\bbug\b|fix|smoke-test/i.test(text)) return "bug"
  if (/\bas a\b|user|empty state|gauge|story/i.test(text)) return "story"
  return "task"
}

function inferPriority(text: string): Priority {
  if (/\bthursday|today|blocking|unblock\b/i.test(text)) return "high"
  if (/\blater|idea\b/i.test(text)) return "low"
  return "medium"
}

function skillFromText(text: string, personId: string, meetingId: string) {
  const skills: Omit<SkillProposal, "id" | "status">[] = []
  if (/design|empty state|blob|figma/i.test(text)) {
    skills.push({
      personId,
      tag: "product-design",
      rationale: "Referenced design deliverables / empty states.",
      meetingId,
    })
  }
  if (/gauge|filter|wire|queries|dashboard|frontend/i.test(text)) {
    skills.push({
      personId,
      tag: "frontend",
      rationale: "Spoke to implementation or platform work.",
      meetingId,
    })
  }
  if (/qa|smoke-test|bug/i.test(text)) {
    skills.push({
      personId,
      tag: "quality",
      rationale: "Owned or referenced QA / verification.",
      meetingId,
    })
  }
  if (/release notes|document|enrollment|inbox/i.test(text)) {
    skills.push({
      personId,
      tag: "docs",
      rationale: "Offered documentation or written updates.",
      meetingId,
    })
  }
  if (/idea|digest|reuse/i.test(text)) {
    skills.push({
      personId,
      tag: "product-sense",
      rationale: "Surfaced a forward-looking product idea.",
      meetingId,
    })
  }
  return skills
}

/** Commitments / ideas / updates / asks agent — heuristic MVP. */
export function extractProposalsFromLines(
  meetingId: string,
  lines: DiarizedLine[],
  people: Person[]
): Extracted {
  const proposals: Extracted["proposals"] = []
  const skills: Extracted["skills"] = []
  const leaderId = people[0]?.id ?? LEADER_PERSON_ID

  for (const line of lines) {
    const text = line.text
    const speakerId =
      line.speakerId === "unknown" ? leaderId : line.speakerId

    skills.push(...skillFromText(text, speakerId, meetingId))

    if (IDEA_RE.test(text) && !COMMITMENT_RE.test(text)) {
      proposals.push({
        kind: "idea",
        title: truncate(`Idea: ${text}`, 72),
        detail: text,
        speakerId,
        assigneeId: speakerId,
        issueType: "task",
        priority: "low",
        skillHints: skillFromText(text, speakerId, meetingId).map((s) => s.tag),
        scoreSignal: "none",
      })
      continue
    }

    if (ASK_RE.test(text) && !COMMITMENT_RE.test(text)) {
      const mentioned =
        people.find((p) =>
          text.toLowerCase().includes(p.name.split(" ")[0].toLowerCase())
        )?.id ?? speakerId
      proposals.push({
        kind: "ask",
        title: truncate(`Ask: ${text}`, 72),
        detail: text,
        speakerId,
        assigneeId: mentioned,
        issueType: "task",
        priority: inferPriority(text),
        skillHints: [],
        scoreSignal: "none",
      })
      continue
    }

    if (UPDATE_RE.test(text) && !COMMITMENT_RE.test(text)) {
      proposals.push({
        kind: "update",
        title: truncate(`Update: ${text}`, 72),
        detail: text,
        speakerId,
        assigneeId: speakerId,
        issueType: "task",
        priority: "low",
        skillHints: skillFromText(text, speakerId, meetingId).map((s) => s.tag),
        scoreSignal: "none",
      })
      continue
    }

    if (COMMITMENT_RE.test(text) || /^action:/i.test(text)) {
      let assigneeId = speakerId
      // "Action: Jonas …" style — route to named person when present
      const named = people.find((p) => {
        const first = p.name.split(" ")[0].toLowerCase()
        return (
          text.toLowerCase().includes(first) &&
          p.id !== speakerId &&
          (/action:/i.test(text) || /please|confirms/i.test(text))
        )
      })
      if (named) assigneeId = named.id

      const unblocks = UNBLOCK_RE.test(text)
      proposals.push({
        kind: "commitment",
        title: truncate(text.replace(/^action:\s*/i, ""), 72),
        detail: `${text}\n\nSource line (${line.speakerName}).`,
        speakerId,
        assigneeId,
        issueType: inferIssueType(text),
        priority: inferPriority(text),
        skillHints: skillFromText(text, assigneeId, meetingId).map((s) => s.tag),
        scoreSignal: unblocks ? "unblock" : "ownership",
      })
    }
  }

  // Deduplicate skill tags per person
  const seenSkill = new Set<string>()
  const uniqueSkills = skills.filter((s) => {
    const key = `${s.personId}:${s.tag}`
    if (seenSkill.has(key)) return false
    seenSkill.add(key)
    return true
  })

  return { proposals, skills: uniqueSkills }
}

export function proposalToTaskDescription(proposal: AgentProposal): string {
  const tmpl = templateByType(proposal.issueType)
  if (proposal.issueType === "story") {
    return `## User story

**As a** teammate
**I want** ${proposal.title}
**So that** meeting commitments stay visible on my dashboard

## Acceptance criteria

- [ ] Confirmed by assignee or leader
- [ ] Reflected on personal dashboard
- [ ] Scorecard updated only after confirmation

## Notes

- From meeting ${proposal.meetingId}
- Speaker attributed: ${proposal.speakerId}
- ${proposal.detail}
`
  }
  if (proposal.issueType === "bug") {
    return `## Summary

${proposal.title}

## Environment

- App / build: meeting capture demo
- Browser / OS: n/a
- Account / role: assignee

## Steps to reproduce

1. Review meeting transcript attribution
2. Confirm commitment routing

## Expected

- Verified action item lands on board after confirmation

## Actual

- Proposed from voice agent pipeline

## Severity

- [ ] Blocker  ·  [x] Major  ·  [ ] Minor  ·  [ ] Trivial

## Source

${proposal.detail}
`
  }
  return `${tmpl.description.split("## Description")[0]}## Description

${proposal.detail}

## Checklist

- [ ] Confirm attribution (voice verified or assignee OK)
- [ ] Complete the work
- [ ] Mark done on board

## Definition of done

- [ ] Reviewed / verified
- [ ] Linked artifacts updated
`
}

export function computePersonScore(
  personId: string,
  proposals: AgentProposal[],
  weights: ScoreWeights = DEFAULT_SCORE_WEIGHTS
) {
  const confirmed = proposals.filter(
    (p) =>
      p.assigneeId === personId &&
      (p.status === "confirmed" || p.status === "assignee_confirmed") &&
      p.scoreSignal !== "none"
  )
  let ownership = 0
  let completion = 0
  let unblock = 0
  for (const p of confirmed) {
    if (p.scoreSignal === "ownership") ownership += 1
    if (p.scoreSignal === "completion") completion += 1
    if (p.scoreSignal === "unblock") unblock += 1
  }
  const total =
    ownership * weights.ownership +
    completion * weights.completion +
    unblock * weights.unblock
  return { ownership, completion, unblock, total, confirmedCount: confirmed.length }
}

function truncate(s: string, n: number) {
  const t = s.trim()
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`
}

export function formatClock(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}
