"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  columns,
  inboxThreads as seedInbox,
  initialTasks,
  people as seedPeople,
  timelineItems as seedTimeline,
  type ColumnId,
  type InboxThread,
  type IssueType,
  type Person,
  type Priority,
  type Task,
  type TimelineItem,
} from "@/lib/data"
import { templateByType } from "@/lib/issue-templates"
import {
  DEFAULT_SCORE_WEIGHTS,
  DEMO_MEETING_TRANSCRIPT,
  LEADER_PERSON_ID,
  computePersonScore,
  diarizeTranscript,
  extractProposalsFromLines,
  initialVoiceEnrollments,
  proposalToTaskDescription,
  type AgentProposal,
  type Meeting,
  type ProposalKind,
  type ProposalStatus,
  type ScoreWeights,
  type SkillProposal,
  type VoiceEnrollment,
  type VoiceStatus,
} from "@/lib/voice-agents"

export type Selection =
  | { kind: "task"; id: string }
  | { kind: "person"; id: string }
  | { kind: "timeline"; id: string }
  | { kind: "new-task" }
  | null

export type AddTaskInput = {
  title: string
  project: string
  priority: Priority
  assigneeId: string
  type: IssueType
  description: string
  points?: number
  tags?: string[]
}

export type TaskPatch = Partial<
  Pick<
    Task,
    | "description"
    | "column"
    | "title"
    | "priority"
    | "assigneeId"
    | "type"
    | "project"
    | "points"
    | "tags"
    | "archived"
  >
>

export type ProposalPatch = Partial<
  Pick<
    AgentProposal,
    "title" | "detail" | "assigneeId" | "issueType" | "priority" | "kind"
  >
>

export type PersonPatch = Partial<
  Pick<Person, "name" | "role" | "capacity" | "allocated" | "color">
>

export type TimelinePatch = Partial<
  Pick<TimelineItem, "title" | "ownerId" | "start" | "end" | "color" | "dependsOn">
>

export type InboxPatch = Partial<
  Pick<InboxThread, "draft" | "subject" | "unread">
>

type WorkspaceContextValue = {
  tasks: Task[]
  people: Person[]
  timelineItems: TimelineItem[]
  inboxThreads: InboxThread[]
  personById: (id: string) => Person | undefined
  project: string
  setProject: (project: string) => void
  query: string
  setQuery: (query: string) => void
  selection: Selection
  select: (selection: Selection) => void
  clearSelection: () => void
  moveTask: (taskId: string, column: ColumnId) => void
  promoteHighPriorityTodos: () => void
  addTask: (input: AddTaskInput) => string
  updateTask: (taskId: string, patch: TaskPatch) => void
  updateTaskColumn: (taskId: string, column: ColumnId) => void
  archiveTask: (taskId: string) => void
  /** Voice enrollment gate (leader verifies). */
  voiceEnrollments: VoiceEnrollment[]
  enrollVoice: (personId: string, audioLabel?: string) => void
  setVoiceStatus: (
    personId: string,
    status: Extract<VoiceStatus, "verified" | "rejected" | "pending">,
    notes?: string
  ) => void
  isVoiceVerified: (personId: string) => boolean
  /** Meetings + agent pipeline. */
  meetings: Meeting[]
  activeMeetingId: string | null
  startMeeting: (title?: string, projectName?: string) => string
  updateMeetingTranscript: (meetingId: string, transcriptRaw: string) => void
  attachMeetingAudio: (meetingId: string, audioLabel: string) => void
  finishMeeting: (meetingId: string) => void
  runMeetingAgents: (meetingId: string) => void
  loadDemoTranscript: (meetingId: string) => void
  proposals: AgentProposal[]
  skills: SkillProposal[]
  scoreWeights: ScoreWeights
  setScoreWeights: (weights: ScoreWeights) => void
  updateProposal: (proposalId: string, patch: ProposalPatch) => void
  reviewProposal: (
    proposalId: string,
    decision: Extract<
      ProposalStatus,
      "confirmed" | "rejected" | "assignee_confirmed"
    >
  ) => void
  markProposalCompleted: (proposalId: string) => void
  reviewSkill: (
    skillId: string,
    decision: "accepted" | "dismissed" | "corrected",
    correctedTag?: string
  ) => void
  updatePerson: (personId: string, patch: PersonPatch) => void
  addPerson: (input: {
    name: string
    role: string
    capacity?: number
  }) => string
  updateTimelineItem: (itemId: string, patch: TimelinePatch) => void
  updateInboxThread: (threadId: string, patch: InboxPatch) => void
  personDashboard: (personId: string) => {
    commitments: AgentProposal[]
    updates: AgentProposal[]
    asks: AgentProposal[]
    skills: SkillProposal[]
    score: ReturnType<typeof computePersonScore>
  }
  pendingReviewCount: number
  leaderPersonId: string
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

function uid(prefix: string) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase()
}

const PERSON_COLORS = [
  "#FF6B1A",
  "#0D9488",
  "#2563EB",
  "#DB2777",
  "#CA8A04",
  "#7C3AED",
  "#0891B2",
  "#EA580C",
  "#4F46E5",
  "#059669",
]

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [people, setPeople] = useState<Person[]>(seedPeople)
  const [timelineItems, setTimelineItems] =
    useState<TimelineItem[]>(seedTimeline)
  const [inboxThreads, setInboxThreads] = useState<InboxThread[]>(seedInbox)
  const [project, setProject] = useState("All")
  const [query, setQuery] = useState("")
  const [selection, setSelection] = useState<Selection>(null)
  const [voiceEnrollments, setVoiceEnrollments] = useState<VoiceEnrollment[]>(
    () => initialVoiceEnrollments(seedPeople)
  )
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null)
  const [proposals, setProposals] = useState<AgentProposal[]>([])
  const [skills, setSkills] = useState<SkillProposal[]>([])
  const [scoreWeights, setScoreWeights] =
    useState<ScoreWeights>(DEFAULT_SCORE_WEIGHTS)

  const personById = useCallback(
    (id: string) => people.find((p) => p.id === id),
    [people]
  )

  const select = useCallback((next: Selection) => setSelection(next), [])
  const clearSelection = useCallback(() => setSelection(null), [])

  const moveTask = useCallback((taskId: string, column: ColumnId) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, column } : t))
    )
  }, [])

  const promoteHighPriorityTodos = useCallback(() => {
    setTasks((prev) =>
      prev.map((t) =>
        t.priority === "high" && t.column === "todo" && !t.archived
          ? { ...t, column: "doing" }
          : t
      )
    )
  }, [])

  const updateTaskColumn = moveTask

  const updateTask = useCallback((taskId: string, patch: TaskPatch) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t))
    )
  }, [])

  const archiveTask = useCallback(
    (taskId: string) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, archived: true } : t))
      )
      setSelection((cur) =>
        cur?.kind === "task" && cur.id === taskId ? null : cur
      )
    },
    []
  )

  const addTask = useCallback((input: AddTaskInput) => {
    const id = uid("t")
    const tmpl = templateByType(input.type)
    const task: Task = {
      id,
      title: input.title.trim(),
      column: columns[0].id,
      project: input.project,
      priority: input.priority,
      points: input.points ?? tmpl.defaults?.points ?? 2,
      assigneeId: input.assigneeId,
      tags: input.tags ?? tmpl.defaults?.tags ?? ["new"],
      type: input.type,
      description: input.description,
    }
    setTasks((prev) => [task, ...prev])
    setSelection({ kind: "task", id })
    return id
  }, [])

  const updatePerson = useCallback((personId: string, patch: PersonPatch) => {
    setPeople((prev) =>
      prev.map((p) => {
        if (p.id !== personId) return p
        const next = { ...p, ...patch }
        if (patch.name !== undefined) {
          next.initials = initialsFromName(patch.name)
        }
        if (patch.capacity !== undefined) {
          next.capacity = Math.max(1, Math.round(patch.capacity))
        }
        if (patch.allocated !== undefined) {
          next.allocated = Math.max(0, Math.round(patch.allocated))
        }
        return next
      })
    )
  }, [])

  const addPerson = useCallback(
    (input: { name: string; role: string; capacity?: number }) => {
      const id = uid("p")
      const name = input.name.trim() || "New teammate"
      const person: Person = {
        id,
        name,
        role: input.role.trim() || "Teammate",
        initials: initialsFromName(name),
        color: PERSON_COLORS[people.length % PERSON_COLORS.length],
        capacity: input.capacity ?? 30,
        allocated: 0,
      }
      setPeople((prev) => [...prev, person])
      setVoiceEnrollments((prev) => [
        ...prev,
        {
          personId: id,
          status: "unenrolled",
          samplePhrase:
            "Aksh verifies my voice for the product team. I commit to clear action items and honest updates in every meeting.",
        },
      ])
      setSelection({ kind: "person", id })
      return id
    },
    [people.length]
  )

  const updateTimelineItem = useCallback(
    (itemId: string, patch: TimelinePatch) => {
      setTimelineItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item
          const next = { ...item, ...patch }
          if (patch.start !== undefined) {
            next.start = Math.max(0, Math.min(17, Math.round(patch.start)))
          }
          if (patch.end !== undefined) {
            next.end = Math.max(1, Math.min(18, Math.round(patch.end)))
          }
          if (next.end <= next.start) next.end = next.start + 1
          return next
        })
      )
    },
    []
  )

  const updateInboxThread = useCallback(
    (threadId: string, patch: InboxPatch) => {
      setInboxThreads((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, ...patch } : t))
      )
    },
    []
  )

  const isVoiceVerified = useCallback(
    (personId: string) =>
      voiceEnrollments.find((v) => v.personId === personId)?.status ===
      "verified",
    [voiceEnrollments]
  )

  const enrollVoice = useCallback((personId: string, audioLabel?: string) => {
    setVoiceEnrollments((prev) =>
      prev.map((v) =>
        v.personId === personId
          ? {
              ...v,
              status: "pending",
              audioLabel: audioLabel ?? `${personId}-enroll.wav`,
              enrolledAt: new Date().toISOString(),
            }
          : v
      )
    )
  }, [])

  const setVoiceStatus = useCallback(
    (
      personId: string,
      status: Extract<VoiceStatus, "verified" | "rejected" | "pending">,
      notes?: string
    ) => {
      setVoiceEnrollments((prev) =>
        prev.map((v) =>
          v.personId === personId
            ? {
                ...v,
                status,
                notes: notes ?? v.notes,
                verifiedAt:
                  status === "verified"
                    ? new Date().toISOString()
                    : v.verifiedAt,
                verifiedBy:
                  status === "verified" ? LEADER_PERSON_ID : v.verifiedBy,
              }
            : v
        )
      )
    },
    []
  )

  const startMeeting = useCallback(
    (title?: string, projectName?: string) => {
      const id = uid("mtg")
      const meeting: Meeting = {
        id,
        title: title?.trim() || "Stand-up capture",
        project: projectName || "Nova Launch",
        status: "live",
        startedAt: new Date().toISOString(),
        transcriptRaw: "",
        lines: [],
      }
      setMeetings((prev) => [meeting, ...prev])
      setActiveMeetingId(id)
      return id
    },
    []
  )

  const updateMeetingTranscript = useCallback(
    (meetingId: string, transcriptRaw: string) => {
      setMeetings((prev) =>
        prev.map((m) =>
          m.id === meetingId
            ? {
                ...m,
                transcriptRaw,
                lines: diarizeTranscript(transcriptRaw, people),
              }
            : m
        )
      )
    },
    [people]
  )

  const attachMeetingAudio = useCallback(
    (meetingId: string, audioLabel: string) => {
      setMeetings((prev) =>
        prev.map((m) => (m.id === meetingId ? { ...m, audioLabel } : m))
      )
    },
    []
  )

  const loadDemoTranscript = useCallback(
    (meetingId: string) => {
      setMeetings((prev) =>
        prev.map((m) =>
          m.id === meetingId
            ? {
                ...m,
                transcriptRaw: DEMO_MEETING_TRANSCRIPT,
                lines: diarizeTranscript(DEMO_MEETING_TRANSCRIPT, people),
                audioLabel: m.audioLabel ?? "nova-standup-demo.wav",
              }
            : m
        )
      )
    },
    [people]
  )

  const runMeetingAgents = useCallback(
    (meetingId: string) => {
      setMeetings((prev) => {
        const meeting = prev.find((m) => m.id === meetingId)
        if (!meeting) return prev
        const lines =
          meeting.lines.length > 0
            ? meeting.lines
            : diarizeTranscript(meeting.transcriptRaw, people)
        const extracted = extractProposalsFromLines(meetingId, lines, people)
        const now = new Date().toISOString()

        queueMicrotask(() => {
          setProposals((pPrev) => {
            const without = pPrev.filter((p) => p.meetingId !== meetingId)
            const next: AgentProposal[] = extracted.proposals.map((p) => ({
              ...p,
              id: uid("pr"),
              meetingId,
              status: "proposed" as const,
              createdAt: now,
            }))
            return [...next, ...without]
          })
          setSkills((sPrev) => {
            const without = sPrev.filter((s) => s.meetingId !== meetingId)
            const next: SkillProposal[] = extracted.skills.map((s) => ({
              ...s,
              id: uid("sk"),
              status: "proposed" as const,
            }))
            return [...next, ...without]
          })
        })

        return prev.map((m) =>
          m.id === meetingId
            ? { ...m, status: "ready", lines, endedAt: m.endedAt ?? now }
            : m
        )
      })
    },
    [people]
  )

  const finishMeeting = useCallback(
    (meetingId: string) => {
      setMeetings((prev) =>
        prev.map((m) =>
          m.id === meetingId
            ? {
                ...m,
                status: "processing",
                endedAt: new Date().toISOString(),
                lines:
                  m.lines.length > 0
                    ? m.lines
                    : diarizeTranscript(m.transcriptRaw, people),
              }
            : m
        )
      )
      setActiveMeetingId((cur) => (cur === meetingId ? null : cur))
      window.setTimeout(() => runMeetingAgents(meetingId), 600)
    },
    [people, runMeetingAgents]
  )

  const updateProposal = useCallback(
    (proposalId: string, patch: ProposalPatch) => {
      setProposals((prev) =>
        prev.map((p) => {
          if (p.id !== proposalId || p.status !== "proposed") return p
          const next = { ...p, ...patch }
          if (patch.issueType && patch.issueType !== p.issueType) {
            const tmpl = templateByType(patch.issueType)
            if (tmpl.defaults?.priority && !patch.priority) {
              next.priority = tmpl.defaults.priority
            }
          }
          return next
        })
      )
    },
    []
  )

  const reviewProposal = useCallback(
    (
      proposalId: string,
      decision: Extract<
        ProposalStatus,
        "confirmed" | "rejected" | "assignee_confirmed"
      >
    ) => {
      setProposals((prev) => {
        const target = prev.find((p) => p.id === proposalId)
        if (!target) return prev

        const speakerOk = isVoiceVerified(target.speakerId)
        const assigneeSelf = decision === "assignee_confirmed"
        const leaderSeal = decision === "confirmed" && speakerOk
        if (
          decision === "confirmed" &&
          !speakerOk &&
          target.kind === "commitment"
        ) {
          return prev
        }
        const canSeal =
          target.kind === "commitment" &&
          decision !== "rejected" &&
          (leaderSeal || assigneeSelf)

        let taskId = target.taskId
        if (canSeal && !taskId) {
          const id = uid("t")
          const tmpl = templateByType(target.issueType)
          const meetingProject =
            meetings.find((m) => m.id === target.meetingId)?.project ??
            "Nova Launch"
          const task: Task = {
            id,
            title: target.title,
            column: "todo",
            project: meetingProject,
            priority: target.priority,
            points: tmpl.defaults?.points ?? 2,
            assigneeId: target.assigneeId,
            tags: [
              ...(tmpl.defaults?.tags ?? ["task"]),
              "from-meeting",
              ...target.skillHints.slice(0, 2),
            ],
            type: target.issueType,
            description: proposalToTaskDescription({
              ...target,
              status: decision,
            }),
          }
          taskId = id
          queueMicrotask(() => {
            setTasks((tPrev) => [task, ...tPrev])
          })
        }

        return prev.map((p) =>
          p.id === proposalId
            ? {
                ...p,
                status: decision,
                taskId: decision === "rejected" ? p.taskId : taskId,
              }
            : p
        )
      })
    },
    [isVoiceVerified, meetings]
  )

  const markProposalCompleted = useCallback((proposalId: string) => {
    setProposals((prev) => {
      const target = prev.find((p) => p.id === proposalId)
      if (
        !target ||
        (target.status !== "confirmed" &&
          target.status !== "assignee_confirmed")
      ) {
        return prev
      }
      if (target.taskId) {
        const taskId = target.taskId
        queueMicrotask(() => {
          setTasks((tPrev) =>
            tPrev.map((t) =>
              t.id === taskId ? { ...t, column: "done" } : t
            )
          )
        })
      }
      return prev.map((p) =>
        p.id === proposalId
          ? { ...p, scoreSignal: "completion" as const }
          : p
      )
    })
  }, [])

  const reviewSkill = useCallback(
    (
      skillId: string,
      decision: "accepted" | "dismissed" | "corrected",
      correctedTag?: string
    ) => {
      setSkills((prev) =>
        prev.map((s) =>
          s.id === skillId
            ? {
                ...s,
                status: decision,
                correctedTag:
                  decision === "corrected"
                    ? correctedTag?.trim() || s.tag
                    : s.correctedTag,
                tag:
                  decision === "corrected" && correctedTag?.trim()
                    ? correctedTag.trim()
                    : s.tag,
              }
            : s
        )
      )
    },
    []
  )

  const personDashboard = useCallback(
    (personId: string) => {
      const mine = proposals.filter(
        (p) => p.assigneeId === personId || p.speakerId === personId
      )
      return {
        commitments: mine.filter((p) => p.kind === "commitment"),
        updates: mine.filter(
          (p) => p.kind === "update" && p.speakerId === personId
        ),
        asks: mine.filter(
          (p) => p.kind === "ask" && p.assigneeId === personId
        ),
        skills: skills.filter((s) => s.personId === personId),
        score: computePersonScore(personId, proposals, scoreWeights),
      }
    },
    [proposals, skills, scoreWeights]
  )

  const pendingReviewCount = useMemo(
    () =>
      proposals.filter((p) => p.status === "proposed").length +
      skills.filter((s) => s.status === "proposed").length +
      voiceEnrollments.filter((v) => v.status === "pending").length,
    [proposals, skills, voiceEnrollments]
  )

  const value = useMemo(
    () => ({
      tasks,
      people,
      timelineItems,
      inboxThreads,
      personById,
      project,
      setProject,
      query,
      setQuery,
      selection,
      select,
      clearSelection,
      moveTask,
      promoteHighPriorityTodos,
      addTask,
      updateTask,
      updateTaskColumn,
      archiveTask,
      voiceEnrollments,
      enrollVoice,
      setVoiceStatus,
      isVoiceVerified,
      meetings,
      activeMeetingId,
      startMeeting,
      updateMeetingTranscript,
      attachMeetingAudio,
      finishMeeting,
      runMeetingAgents,
      loadDemoTranscript,
      proposals,
      skills,
      scoreWeights,
      setScoreWeights,
      updateProposal,
      reviewProposal,
      markProposalCompleted,
      reviewSkill,
      updatePerson,
      addPerson,
      updateTimelineItem,
      updateInboxThread,
      personDashboard,
      pendingReviewCount,
      leaderPersonId: LEADER_PERSON_ID,
    }),
    [
      tasks,
      people,
      timelineItems,
      inboxThreads,
      personById,
      project,
      query,
      selection,
      select,
      clearSelection,
      moveTask,
      promoteHighPriorityTodos,
      addTask,
      updateTask,
      updateTaskColumn,
      archiveTask,
      voiceEnrollments,
      enrollVoice,
      setVoiceStatus,
      isVoiceVerified,
      meetings,
      activeMeetingId,
      startMeeting,
      updateMeetingTranscript,
      attachMeetingAudio,
      finishMeeting,
      runMeetingAgents,
      loadDemoTranscript,
      proposals,
      skills,
      scoreWeights,
      updateProposal,
      reviewProposal,
      markProposalCompleted,
      reviewSkill,
      updatePerson,
      addPerson,
      updateTimelineItem,
      updateInboxThread,
      personDashboard,
      pendingReviewCount,
    ]
  )

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) {
    throw new Error("useWorkspace must be used within WorkspaceProvider")
  }
  return ctx
}

/** Re-export for proposal kind edits in UI. */
export type { ProposalKind }
