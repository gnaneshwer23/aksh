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
  type ColumnId,
  type IssueType,
  type Priority,
  type Task,
} from "@/lib/data"
import { templateByType } from "@/lib/issue-templates"

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
  addTask: (input: AddTaskInput) => void
  updateTask: (taskId: string, patch: Partial<Pick<Task, "description" | "column" | "title" | "priority" | "assigneeId" | "type">>) => void
  updateTaskColumn: (taskId: string, column: ColumnId) => void
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [project, setProject] = useState("All")
  const [query, setQuery] = useState("")
  const [selection, setSelection] = useState<Selection>(null)

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
    const id = `t${Date.now()}`
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
  }, [])

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
