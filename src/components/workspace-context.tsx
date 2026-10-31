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
  initialTasks,
  people,
  type ColumnId,
  type IssueType,
  type Priority,
  type Task,
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
}

type WorkspaceContextValue = {
  tasks: Task[]
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
  updateTask: (
    taskId: string,
    patch: Partial<
      Pick<
        Task,
        "description" | "column" | "title" | "priority" | "assigneeId" | "type"
      >
    >
  ) => void
  updateTaskColumn: (taskId: string, column: ColumnId) => void
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

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [project, setProject] = useState("All")
  const [query, setQuery] = useState("")
  const [selection, setSelection] = useState<Selection>(null)
  const [voiceEnrollments, setVoiceEnrollments] = useState<VoiceEnrollment[]>(
    () => initialVoiceEnrollments(people)
  )
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null)
  const [proposals, setProposals] = useState<AgentProposal[]>([])
  const [skills, setSkills] = useState<SkillProposal[]>([])
  const [scoreWeights, setScoreWeights] =
    useState<ScoreWeights>(DEFAULT_SCORE_WEIGHTS)

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
        t.priority === "high" && t.column === "todo"
          ? { ...t, column: "doing" }
          : t
      )
    )
  }, [])

  const updateTaskColumn = moveTask

  const updateTask = useCallback(
    (
      taskId: string,
      patch: Partial<
        Pick<
          Task,
          "description" | "column" | "title" | "priority" | "assigneeId" | "type"
        >
      >
    ) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t))
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
      points: tmpl.defaults?.points ?? 2,
      assigneeId: input.assigneeId,
      tags: tmpl.defaults?.tags ?? ["new"],
      type: input.type,
      description: input.description,
    }
    setTasks((prev) => [task, ...prev])
    setSelection({ kind: "task", id })
    return id
  }, [])

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
    []
  )

  const attachMeetingAudio = useCallback(
    (meetingId: string, audioLabel: string) => {
      setMeetings((prev) =>
        prev.map((m) => (m.id === meetingId ? { ...m, audioLabel } : m))
      )
    },
    []
  )

  const loadDemoTranscript = useCallback((meetingId: string) => {
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
  }, [])

  const runMeetingAgents = useCallback((meetingId: string) => {
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
            status: "proposed",
            createdAt: now,
          }))
          return [...next, ...without]
        })
        setSkills((sPrev) => {
          const without = sPrev.filter((s) => s.meetingId !== meetingId)
          const next: SkillProposal[] = extracted.skills.map((s) => ({
            ...s,
            id: uid("sk"),
            status: "proposed",
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
  }, [])

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
      // Simulate short agent processing, then extract
      window.setTimeout(() => runMeetingAgents(meetingId), 600)
    },
    [runMeetingAgents]
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

        // Hard rule: permanent task / score only with verified voice↔person
        // (leader may seal) OR assignee confirmation alone.
        const speakerOk = isVoiceVerified(target.speakerId)
        const assigneeSelf = decision === "assignee_confirmed"
        const leaderSeal = decision === "confirmed" && speakerOk
        if (
          decision === "confirmed" &&
          !speakerOk &&
          target.kind === "commitment"
        ) {
          // Leader cannot seal commitments until voice is attested.
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
      reviewProposal,
      markProposalCompleted,
      reviewSkill,
      personDashboard,
      pendingReviewCount,
      leaderPersonId: LEADER_PERSON_ID,
    }),
    [
      tasks,
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
      reviewProposal,
      markProposalCompleted,
      reviewSkill,
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
