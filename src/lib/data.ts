export type ViewId = "board" | "timeline" | "team" | "inbox"

export type ColumnId = "todo" | "doing" | "review" | "done"

export type Priority = "low" | "medium" | "high"

/** Work item kind — story / bug / task (Jira-style). Defaults to task when omitted. */
export type IssueType = "story" | "bug" | "task"

export type Person = {
  id: string
  name: string
  role: string
  initials: string
  color: string
  capacity: number
  allocated: number
}

export type Task = {
  id: string
  title: string
  column: ColumnId
  project: string
  priority: Priority
  points: number
  assigneeId: string
  tags: string[]
  /** Issue type; treat missing as `"task"` for older mock rows. */
  type: IssueType
  /** Markdown / structured text body (template-filled on create). */
  description: string
}

export type TimelineItem = {
  id: string
  title: string
  ownerId: string
  start: number
  end: number
  color: string
  dependsOn?: string
}

export type InboxThread = {
  id: string
  from: string
  initials: string
  color: string
  subject: string
  preview: string
  time: string
  unread: boolean
  body: string
  summary: string
  draft: string
}

export const views: { id: ViewId; label: string }[] = [
  { id: "board", label: "Board" },
  { id: "timeline", label: "Timeline" },
  { id: "team", label: "Team" },
  { id: "inbox", label: "Inbox" },
]

export const columns: { id: ColumnId; label: string }[] = [
  { id: "todo", label: "To do" },
  { id: "doing", label: "In progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
]

export const projects = ["Nova Launch", "Pulse Mobile", "Atlas Ops"] as const

export const people: Person[] = [
  {
    id: "p1",
    name: "Maya Chen",
    role: "Product",
    initials: "MC",
    color: "#FF6B1A",
    capacity: 32,
    allocated: 28,
  },
  {
    id: "p2",
    name: "Jonas Reed",
    role: "Design",
    initials: "JR",
    color: "#0D9488",
    capacity: 30,
    allocated: 22,
  },
  {
    id: "p3",
    name: "Asha Patel",
    role: "Engineering",
    initials: "AP",
    color: "#2563EB",
    capacity: 36,
    allocated: 34,
  },
  {
    id: "p4",
    name: "Leo Park",
    role: "Engineering",
    initials: "LP",
    color: "#DB2777",
    capacity: 34,
    allocated: 18,
  },
  {
    id: "p5",
    name: "Nina Vogel",
    role: "QA",
    initials: "NV",
    color: "#CA8A04",
    capacity: 28,
    allocated: 20,
  },
]

export const initialTasks: Task[] = [
  {
    id: "t1",
    title: "Sketch onboarding empty states",
    column: "todo",
    project: "Nova Launch",
    priority: "medium",
    points: 3,
    assigneeId: "p2",
    tags: ["design"],
    type: "story",
    description: `## User story

**As a** new teammate
**I want** a calm empty board that explains the next step
**So that** I know how to create my first task without hunting

## Acceptance criteria

- [ ] Empty state shows brand mark + one CTA
- [ ] Illustration matches soft blob style
- [ ] Copy under 2 lines on mobile

## Notes

- Pair with Jonas on Figma options
`,
  },
  {
    id: "t2",
    title: "Wire sprint capacity gauge",
    column: "todo",
    project: "Nova Launch",
    priority: "high",
    points: 5,
    assigneeId: "p3",
    tags: ["frontend"],
    type: "story",
    description: `## User story

**As a** sprint lead
**I want** capacity bars tied to assigned points
**So that** I can see overload before stand-up

## Acceptance criteria

- [ ] Gauge reflects allocated / capacity per person
- [ ] Over 95% uses coral accent
- [ ] Updates when tasks move columns

## Notes

- Reuse Team view data shape
`,
  },
  {
    id: "t3",
    title: "Draft release notes outline",
    column: "todo",
    project: "Pulse Mobile",
    priority: "low",
    points: 2,
    assigneeId: "p1",
    tags: ["docs"],
    type: "task",
    description: `## Description

Outline release notes for Pulse Mobile beta: highlights, fixes, known issues.

## Checklist

- [ ] Collect shipped stories from board
- [ ] Draft highlights section
- [ ] List known issues from QA

## Definition of done

- [ ] Reviewed by Maya
- [ ] Linked in Inbox thread
`,
  },
  {
    id: "t4",
    title: "Animate board tab indicator",
    column: "doing",
    project: "Nova Launch",
    priority: "high",
    points: 5,
    assigneeId: "p3",
    tags: ["motion"],
    type: "task",
    description: `## Description

Spring the active tab indicator under Board / Timeline / Team / Inbox.

## Checklist

- [ ] Match coral brand motion curve
- [ ] Respect reduced-motion
- [ ] No layout shift on route change

## Definition of done

- [ ] Reviewed on desktop + mobile
- [ ] Linked artifacts updated
`,
  },
  {
    id: "t5",
    title: "Polish avatar stack spacing",
    column: "doing",
    project: "Pulse Mobile",
    priority: "medium",
    points: 2,
    assigneeId: "p2",
    tags: ["design"],
    type: "task",
    description: `## Description

Tighten avatar overlap on cards so stacks read clearly at 5 people.

## Checklist

- [ ] 2px overlap adjustment
- [ ] Focus ring still visible
- [ ] Snapshot for design QA

## Definition of done

- [ ] Reviewed / verified
- [ ] Linked artifacts updated
`,
  },
  {
    id: "t6",
    title: "Hook filters to local state",
    column: "review",
    project: "Nova Launch",
    priority: "medium",
    points: 3,
    assigneeId: "p4",
    tags: ["frontend"],
    type: "task",
    description: `## Description

Project + search filters already live in WorkspaceProvider — verify edge cases and empty states.

## Checklist

- [ ] All / project filter
- [ ] Substring on title, tags, assignee
- [ ] Empty column copy when filtered

## Definition of done

- [ ] Reviewed / verified
- [ ] Linked artifacts updated
`,
  },
  {
    id: "t7",
    title: "Smoke-test inbox drafts",
    column: "review",
    project: "Atlas Ops",
    priority: "high",
    points: 3,
    assigneeId: "p5",
    tags: ["qa"],
    type: "bug",
    description: `## Summary

Draft reply sometimes keeps stale subject after switching threads.

## Environment

- App / build: local demo
- Browser / OS: Safari 18 / macOS
- Account / role: QA

## Steps to reproduce

1. Open Inbox, select unread Maya thread
2. Reveal draft, edit text
3. Switch to Jonas thread without sending

## Expected

- Draft field shows Jonas draft copy

## Actual

- Previous Maya draft text remains until blur

## Severity

- [ ] Blocker  ·  [x] Major  ·  [ ] Minor  ·  [ ] Trivial
`,
  },
  {
    id: "t8",
    title: "Ship brand mark for aksh",
    column: "done",
    project: "Nova Launch",
    priority: "medium",
    points: 2,
    assigneeId: "p2",
    tags: ["brand"],
    type: "task",
    description: `## Description

Final SVG mark in shell header and empty states.

## Checklist

- [x] Export mark
- [x] Wire Brand component
- [x] Check contrast on mist background

## Definition of done

- [x] Reviewed / verified
- [x] Linked artifacts updated
`,
  },
  {
    id: "t9",
    title: "Seed fictional team data",
    column: "done",
    project: "Atlas Ops",
    priority: "low",
    points: 1,
    assigneeId: "p4",
    tags: ["data"],
    type: "task",
    description: `## Description

Populate people[], capacity, and initial board cards for the demo.

## Checklist

- [x] Five teammates
- [x] Nine tasks across columns
- [x] Inbox threads with drafts

## Definition of done

- [x] Reviewed / verified
- [x] Linked artifacts updated
`,
  },
]

export const timelineItems: TimelineItem[] = [
  {
    id: "tl1",
    title: "Discovery",
    ownerId: "p1",
    start: 0,
    end: 4,
    color: "#FF6B1A",
  },
  {
    id: "tl2",
    title: "UI kit",
    ownerId: "p2",
    start: 2,
    end: 8,
    color: "#0D9488",
    dependsOn: "tl1",
  },
  {
    id: "tl3",
    title: "Board MVP",
    ownerId: "p3",
    start: 5,
    end: 12,
    color: "#2563EB",
    dependsOn: "tl2",
  },
  {
    id: "tl4",
    title: "Timeline view",
    ownerId: "p4",
    start: 8,
    end: 14,
    color: "#DB2777",
    dependsOn: "tl2",
  },
  {
    id: "tl5",
    title: "QA pass",
    ownerId: "p5",
    start: 12,
    end: 16,
    color: "#CA8A04",
    dependsOn: "tl3",
  },
  {
    id: "tl6",
    title: "Launch week",
    ownerId: "p1",
    start: 15,
    end: 18,
    color: "#FF8A45",
    dependsOn: "tl5",
  },
]

export const inboxThreads: InboxThread[] = [
  {
    id: "m1",
    from: "Maya Chen",
    initials: "MC",
    color: "#FF6B1A",
    subject: "Sprint goals for Nova",
    preview: "Can we lock scope before Thursday stand-up?",
    time: "9:14a",
    unread: true,
    body: "Hey team — I'd like to lock Nova Launch scope before Thursday. Priority is board motion, capacity gauge, and the scripted copilot demo. Everything else can slip a week.",
    summary: "Maya wants Nova scope locked by Thursday: board motion, capacity gauge, copilot demo.",
    draft: "Sounds good — I'll keep board motion and the gauge in this sprint and park the rest.",
  },
  {
    id: "m2",
    from: "Jonas Reed",
    initials: "JR",
    color: "#0D9488",
    subject: "Empty-state illustrations",
    preview: "Uploaded two options in Figma — which vibe?",
    time: "Yesterday",
    unread: true,
    body: "Dropped soft blob and paper-plane empty states in the Nova file. Soft blob feels more playful; paper-plane is cleaner for enterprise demos.",
    summary: "Jonas shared two empty-state styles: soft blob (playful) vs paper-plane (cleaner).",
    draft: "Let's go with soft blob for the demo — it matches the aksh tone better.",
  },
  {
    id: "m3",
    from: "Asha Patel",
    initials: "AP",
    color: "#2563EB",
    subject: "Perf note on timeline",
    preview: "Perspective tilt is fine under 60 items.",
    time: "Mon",
    unread: false,
    body: "Quick note: the roadmap perspective tilt stays smooth under ~60 bars. Above that we should flatten by default and offer tilt as an opt-in.",
    summary: "Asha recommends keeping timeline tilt optional above ~60 bars.",
    draft: "Noted — I'll default tilt off when the sample set grows.",
  },
  {
    id: "m4",
    from: "Nina Vogel",
    initials: "NV",
    color: "#CA8A04",
    subject: "Inbox reply flow",
    preview: "Draft + send works locally; no mailer hooked.",
    time: "Sun",
    unread: false,
    body: "Verified mark-as-read, summary reveal, and draft send all stay local. No email service is connected — as intended for the demo.",
    summary: "Nina confirmed inbox interactions are local-only; no mail service.",
    draft: "Perfect — thanks for the pass. Leaving it local for the template.",
  },
]

export const copilotSteps = [
  "Estimating open tasks…",
  "Balancing sprint capacity…",
  "Moving high-priority work forward…",
  "Capacity looks healthy — plan ready.",
] as const

export function personById(id: string) {
  return people.find((p) => p.id === id)
}
