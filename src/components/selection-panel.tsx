"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  useWorkspace,
  type AddTaskInput,
} from "@/components/workspace-context"
import {
  columns,
  people,
  personById,
  projects,
  timelineItems,
  type ColumnId,
  type IssueType,
  type Priority,
  type Task,
} from "@/lib/data"
import {
  issueTemplates,
  issueTypeLabel,
  issueTypeTone,
  templateByType,
} from "@/lib/issue-templates"
import { cn } from "@/lib/utils"

export function SelectionPanel() {
  const { selection, clearSelection, tasks, addTask, updateTaskColumn, updateTask } =
    useWorkspace()

  return (
    <AnimatePresence>
      {selection && (
        <motion.div
          className="fixed inset-0 z-50 flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-foreground/25 backdrop-blur-[2px]"
            aria-label="Close panel"
            onClick={clearSelection}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ type: "spring", stiffness: 340, damping: 36 }}
            className="relative flex h-full w-full max-w-md flex-col gap-4 border-l border-border bg-background p-5 shadow-xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <PanelTitle />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close"
                onClick={clearSelection}
              >
                <X className="size-5" />
              </Button>
            </div>

            {selection.kind === "task" && (
              <TaskDetail
                task={tasks.find((t) => t.id === selection.id)}
                onMove={(column) => {
                  updateTaskColumn(selection.id, column)
                }}
                onDescriptionChange={(description) => {
                  updateTask(selection.id, { description })
                }}
              />
            )}
            {selection.kind === "person" && (
              <PersonDetail personId={selection.id} />
            )}
            {selection.kind === "timeline" && (
              <TimelineDetail itemId={selection.id} />
            )}
            {selection.kind === "new-task" && (
              <NewTaskForm
                onCreate={(input) => {
                  addTask(input)
                }}
              />
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function PanelTitle() {
  const { selection, tasks } = useWorkspace()
  if (!selection) return null
  if (selection.kind === "new-task") {
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--aksh-teal-ink)]">
          Create
        </p>
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          New work item
        </h2>
      </div>
    )
  }
  if (selection.kind === "task") {
    const task = tasks.find((t) => t.id === selection.id)
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--aksh-teal-ink)]">
          {task ? issueTypeLabel(task.type) : "Task"}
        </p>
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          {task?.title ?? "Task"}
        </h2>
      </div>
    )
  }
  if (selection.kind === "person") {
    const person = personById(selection.id)
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--aksh-teal-ink)]">
          Teammate
        </p>
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          {person?.name ?? "Person"}
        </h2>
      </div>
    )
  }
  const item = timelineItems.find((t) => t.id === selection.id)
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--aksh-teal-ink)]">
        Timeline
      </p>
      <h2 className="font-heading text-xl font-semibold tracking-tight">
        {item?.title ?? "Track"}
      </h2>
    </div>
  )
}

function IssueTypeBadge({ type }: { type: IssueType }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        issueTypeTone(type)
      )}
    >
      {issueTypeLabel(type)}
    </span>
  )
}

function TaskDetail({
  task,
  onMove,
  onDescriptionChange,
}: {
  task?: Task
  onMove: (column: ColumnId) => void
  onDescriptionChange: (description: string) => void
}) {
  const [draft, setDraft] = useState(task?.description ?? "")

  useEffect(() => {
    setDraft(task?.description ?? "")
  }, [task?.id, task?.description])

  if (!task) {
    return <p className="text-sm text-muted-foreground">Task not found.</p>
  }
  const person = personById(task.assigneeId)
  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
      <div className="flex flex-wrap items-center gap-2">
        <IssueTypeBadge type={task.type} />
      </div>
      <dl className="grid gap-3 text-sm">
        <Row label="Project" value={task.project} />
        <Row label="Priority" value={task.priority} />
        <Row label="Points" value={`${task.points}`} />
        <Row label="Assignee" value={person?.name ?? "—"} />
        <Row
          label="Status"
          value={columns.find((c) => c.id === task.column)?.label ?? task.column}
        />
        <Row label="Tags" value={task.tags.join(", ") || "—"} />
      </dl>
      <label className="grid gap-1.5 text-sm">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Description
        </span>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (draft !== task.description) onDescriptionChange(draft)
          }}
          rows={12}
          spellCheck={false}
          className="min-h-[200px] resize-y rounded-2xl border border-border bg-card px-3 py-2.5 font-mono text-[12.5px] leading-relaxed text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </label>
      <div className="mt-auto space-y-2 border-t border-border/60 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Move to
        </p>
        <div className="flex flex-wrap gap-2">
          {columns.map((col) => (
            <Button
              key={col.id}
              type="button"
              size="sm"
              variant={task.column === col.id ? "default" : "outline"}
              className="rounded-full"
              onClick={() => onMove(col.id)}
            >
              {col.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

function PersonDetail({ personId }: { personId: string }) {
  const { tasks, select } = useWorkspace()
  const person = personById(personId)
  if (!person) {
    return <p className="text-sm text-muted-foreground">Person not found.</p>
  }
  const assigned = tasks.filter((t) => t.assigneeId === person.id)
  const pct = Math.round((person.allocated / person.capacity) * 100)
  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
      <div className="flex items-center gap-3">
        <span
          className="flex size-12 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: person.color }}
        >
          {person.initials}
        </span>
        <div>
          <p className="text-sm text-muted-foreground">{person.role}</p>
          <p className="text-sm tabular-nums text-foreground">
            {person.allocated}h / {person.capacity}h · {pct}%
          </p>
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Assigned tasks
        </p>
        <ul className="space-y-2">
          {assigned.map((task) => (
            <li key={task.id}>
              <button
                type="button"
                onClick={() => select({ kind: "task", id: task.id })}
                className="w-full rounded-2xl border border-border/70 bg-card px-3 py-2.5 text-left text-sm transition-colors hover:bg-[var(--aksh-mist)]"
              >
                <span className="flex items-center gap-2">
                  <IssueTypeBadge type={task.type} />
                  <span className="font-medium">{task.title}</span>
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {task.project} · {task.column}
                </span>
              </button>
            </li>
          ))}
          {assigned.length === 0 && (
            <li className="text-sm text-muted-foreground">No open tasks.</li>
          )}
        </ul>
      </div>
    </div>
  )
}

function TimelineDetail({ itemId }: { itemId: string }) {
  const { select } = useWorkspace()
  const item = timelineItems.find((t) => t.id === itemId)
  if (!item) {
    return <p className="text-sm text-muted-foreground">Track not found.</p>
  }
  const owner = personById(item.ownerId)
  const dep = item.dependsOn
    ? timelineItems.find((t) => t.id === item.dependsOn)
    : undefined
  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
      <div
        className="h-2 rounded-full"
        style={{ backgroundColor: item.color }}
      />
      <dl className="grid gap-3 text-sm">
        <Row label="Owner" value={owner?.name ?? "—"} />
        <Row label="Window" value={`Day ${item.start + 1} → Day ${item.end}`} />
        <Row label="Depends on" value={dep?.title ?? "None"} />
      </dl>
      {owner && (
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          onClick={() => select({ kind: "person", id: owner.id })}
        >
          View {owner.name.split(" ")[0]}
        </Button>
      )}
      {dep && (
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          onClick={() => select({ kind: "timeline", id: dep.id })}
        >
          Open dependency: {dep.title}
        </Button>
      )}
    </div>
  )
}

function NewTaskForm({ onCreate }: { onCreate: (input: AddTaskInput) => void }) {
  const defaultType: IssueType = "task"
  const [issueType, setIssueType] = useState<IssueType>(defaultType)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState(
    () => templateByType(defaultType).description
  )
  const [project, setProject] = useState<string>(projects[0])
  const [priority, setPriority] = useState<Priority>(
    () => templateByType(defaultType).defaults?.priority ?? "medium"
  )
  const [assigneeId, setAssigneeId] = useState(people[0]?.id ?? "p1")
  /** Track whether the user edited description after the last type switch. */
  const [descTouched, setDescTouched] = useState(false)

  function applyType(next: IssueType) {
    const tmpl = templateByType(next)
    const prevTmpl = templateByType(issueType)
    setIssueType(next)
    if (!descTouched || description.trim() === prevTmpl.description.trim()) {
      setDescription(tmpl.description)
      setDescTouched(false)
    }
    if (tmpl.defaults?.priority) setPriority(tmpl.defaults.priority)
  }

  return (
    <form
      className="flex flex-1 flex-col gap-4 overflow-y-auto"
      onSubmit={(e) => {
        e.preventDefault()
        if (!title.trim()) return
        onCreate({
          title,
          project,
          priority,
          assigneeId,
          type: issueType,
          description,
        })
      }}
    >
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">Issue type</legend>
        <div className="grid grid-cols-3 gap-2">
          {issueTemplates.map((tmpl) => (
            <button
              key={tmpl.type}
              type="button"
              onClick={() => applyType(tmpl.type)}
              className={cn(
                "rounded-2xl border px-2 py-2.5 text-center transition-colors",
                issueType === tmpl.type
                  ? cn("border-transparent shadow-sm", tmpl.toneClass)
                  : "border-border/70 bg-card text-muted-foreground hover:bg-[var(--aksh-mist)] hover:text-foreground"
              )}
            >
              <span className="block text-xs font-semibold">{tmpl.shortLabel}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {templateByType(issueType).hint}
        </p>
      </fieldset>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Title</span>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs doing?"
          className="h-10 rounded-xl"
          autoFocus
        />
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Description</span>
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value)
            setDescTouched(true)
          }}
          rows={10}
          spellCheck={false}
          className="min-h-[160px] resize-y rounded-2xl border border-border bg-card px-3 py-2.5 font-mono text-[12.5px] leading-relaxed outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Project</span>
        <select
          value={project}
          onChange={(e) => setProject(e.target.value)}
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {projects.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Priority</span>
        <div className="flex flex-wrap gap-2">
          {(["low", "medium", "high"] as Priority[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                priority === p
                  ? "bg-[var(--aksh-coral)] text-[var(--aksh-coral-ink)]"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Assignee</span>
        <select
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <Button
        type="submit"
        className="mt-auto shrink-0 rounded-full bg-[var(--aksh-coral)] text-[var(--aksh-coral-ink)] hover:bg-[var(--aksh-coral)]/90"
        disabled={!title.trim()}
      >
        Add to board
      </Button>
    </form>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/40 pb-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium capitalize">{value}</dd>
    </div>
  )
}
