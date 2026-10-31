"use client"

import { useEffect, useState, type ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Archive, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  useWorkspace,
  type AddTaskInput,
  type TaskPatch,
} from "@/components/workspace-context"
import {
  columns,
  projects,
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
  const {
    selection,
    clearSelection,
    tasks,
    addTask,
    updateTaskColumn,
    updateTask,
    archiveTask,
  } = useWorkspace()

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
                onPatch={(patch) => {
                  updateTask(selection.id, patch)
                }}
                onArchive={() => archiveTask(selection.id)}
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
  const { selection, tasks, personById, timelineItems } = useWorkspace()
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

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </span>
  )
}

function selectClassName() {
  return "h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
}

function TaskDetail({
  task,
  onMove,
  onPatch,
  onArchive,
}: {
  task?: Task
  onMove: (column: ColumnId) => void
  onPatch: (patch: TaskPatch) => void
  onArchive: () => void
}) {
  const { people } = useWorkspace()
  const [title, setTitle] = useState(task?.title ?? "")
  const [description, setDescription] = useState(task?.description ?? "")
  const [tagsText, setTagsText] = useState(task?.tags.join(", ") ?? "")
  const [descTouched, setDescTouched] = useState(false)

  useEffect(() => {
    setTitle(task?.title ?? "")
    setDescription(task?.description ?? "")
    setTagsText(task?.tags.join(", ") ?? "")
    setDescTouched(false)
  }, [task?.id, task?.title, task?.description, task?.tags])

  if (!task) {
    return <p className="text-sm text-muted-foreground">Task not found.</p>
  }
  const current = task

  function applyType(next: IssueType) {
    const tmpl = templateByType(next)
    const prevTmpl = templateByType(current.type)
    const patch: TaskPatch = { type: next }
    if (!descTouched || description.trim() === prevTmpl.description.trim()) {
      patch.description = tmpl.description
      setDescription(tmpl.description)
      setDescTouched(false)
    }
    if (tmpl.defaults?.priority) patch.priority = tmpl.defaults.priority
    if (tmpl.defaults?.points != null) patch.points = tmpl.defaults.points
    if (tmpl.defaults?.tags) {
      patch.tags = tmpl.defaults.tags
      setTagsText(tmpl.defaults.tags.join(", "))
    }
    onPatch(patch)
  }

  function commitTags() {
    const tags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    const same =
      tags.length === current.tags.length &&
      tags.every((t, i) => t === current.tags[i])
    if (!same) onPatch({ tags })
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
      <fieldset className="grid gap-2">
        <legend className="sr-only">Issue type</legend>
        <FieldLabel>Type</FieldLabel>
        <div className="grid grid-cols-3 gap-2">
          {issueTemplates.map((tmpl) => (
            <button
              key={tmpl.type}
              type="button"
              onClick={() => applyType(tmpl.type)}
              className={cn(
                "rounded-2xl border px-2 py-2.5 text-center transition-colors",
                task.type === tmpl.type
                  ? cn("border-transparent shadow-sm", tmpl.toneClass)
                  : "border-border/70 bg-card text-muted-foreground hover:bg-[var(--aksh-mist)] hover:text-foreground"
              )}
            >
              <span className="block text-xs font-semibold">
                {tmpl.shortLabel}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {templateByType(task.type).hint}
        </p>
      </fieldset>

      <label className="grid gap-1.5 text-sm">
        <FieldLabel>Summary</FieldLabel>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            const next = title.trim()
            if (next && next !== task.title) onPatch({ title: next })
            else setTitle(task.title)
          }}
          className="h-10 rounded-xl"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1.5 text-sm">
          <FieldLabel>Project</FieldLabel>
          <select
            value={task.project}
            onChange={(e) => onPatch({ project: e.target.value })}
            className={selectClassName()}
          >
            {projects.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm">
          <FieldLabel>Points</FieldLabel>
          <Input
            type="number"
            min={0}
            max={21}
            value={task.points}
            onChange={(e) => {
              const n = Number(e.target.value)
              if (!Number.isNaN(n)) onPatch({ points: Math.max(0, n) })
            }}
            className="h-10 rounded-xl"
          />
        </label>
      </div>

      <label className="grid gap-1.5 text-sm">
        <FieldLabel>Priority</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {(["low", "medium", "high"] as Priority[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPatch({ priority: p })}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                task.priority === p
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
        <FieldLabel>Assignee</FieldLabel>
        <select
          value={task.assigneeId}
          onChange={(e) => onPatch({ assigneeId: e.target.value })}
          className={selectClassName()}
        >
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1.5 text-sm">
        <FieldLabel>Labels</FieldLabel>
        <Input
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          onBlur={commitTags}
          placeholder="design, frontend"
          className="h-10 rounded-xl"
        />
      </label>

      <label className="grid gap-1.5 text-sm">
        <FieldLabel>Description</FieldLabel>
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value)
            setDescTouched(true)
          }}
          onBlur={() => {
            if (description !== task.description) {
              onPatch({ description })
            }
          }}
          rows={12}
          spellCheck={false}
          className="min-h-[200px] resize-y rounded-2xl border border-border bg-card px-3 py-2.5 font-mono text-[12.5px] leading-relaxed text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </label>

      <div className="space-y-2 border-t border-border/60 pt-4">
        <FieldLabel>Status</FieldLabel>
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

      <div className="mt-auto border-t border-border/60 pt-4">
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-full border-[var(--aksh-coral)]/40 text-[var(--aksh-coral-ink)] hover:bg-[var(--aksh-coral)]/10"
          onClick={onArchive}
        >
          <Archive className="size-3.5" />
          Archive work item
        </Button>
      </div>
    </div>
  )
}

function PersonDetail({ personId }: { personId: string }) {
  const {
    tasks,
    select,
    personDashboard,
    voiceEnrollments,
    reviewProposal,
    personById,
    updatePerson,
    people,
    addPerson,
  } = useWorkspace()
  const person = personById(personId)
  const [name, setName] = useState(person?.name ?? "")
  const [role, setRole] = useState(person?.role ?? "")
  const [capacity, setCapacity] = useState(person?.capacity ?? 30)
  const [allocated, setAllocated] = useState(person?.allocated ?? 0)

  useEffect(() => {
    setName(person?.name ?? "")
    setRole(person?.role ?? "")
    setCapacity(person?.capacity ?? 30)
    setAllocated(person?.allocated ?? 0)
  }, [person?.id, person?.name, person?.role, person?.capacity, person?.allocated])

  if (!person) {
    return <p className="text-sm text-muted-foreground">Person not found.</p>
  }
  const assigned = tasks.filter(
    (t) => t.assigneeId === person.id && !t.archived
  )
  const pct = Math.round((person.allocated / Math.max(person.capacity, 1)) * 100)
  const dash = personDashboard(person.id)
  const voice =
    voiceEnrollments.find((v) => v.personId === person.id)?.status ??
    "unenrolled"

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
      <div className="flex items-center gap-3">
        <span
          className="flex size-12 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: person.color }}
        >
          {person.initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs capitalize text-muted-foreground">
            Voice {voice} · score {dash.score.total}
          </p>
          <p className="text-sm tabular-nums text-foreground">
            {person.allocated}h / {person.capacity}h · {pct}%
          </p>
        </div>
      </div>

      <label className="grid gap-1.5 text-sm">
        <FieldLabel>Name</FieldLabel>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            const next = name.trim()
            if (next && next !== person.name) updatePerson(person.id, { name: next })
            else setName(person.name)
          }}
          className="h-10 rounded-xl"
        />
      </label>
      <label className="grid gap-1.5 text-sm">
        <FieldLabel>Role</FieldLabel>
        <Input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          onBlur={() => {
            const next = role.trim()
            if (next && next !== person.role) updatePerson(person.id, { role: next })
            else setRole(person.role)
          }}
          className="h-10 rounded-xl"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1.5 text-sm">
          <FieldLabel>Capacity (h)</FieldLabel>
          <Input
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            onBlur={() => {
              if (capacity !== person.capacity) {
                updatePerson(person.id, { capacity })
              }
            }}
            className="h-10 rounded-xl"
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <FieldLabel>Allocated (h)</FieldLabel>
          <Input
            type="number"
            min={0}
            value={allocated}
            onChange={(e) => setAllocated(Number(e.target.value))}
            onBlur={() => {
              if (allocated !== person.allocated) {
                updatePerson(person.id, { allocated })
              }
            }}
            className="h-10 rounded-xl"
          />
        </label>
      </div>

      <DashboardSlice
        title="Commitments from meetings"
        empty="No meeting commitments routed here yet."
        items={dash.commitments}
        onConfirm={(id) => reviewProposal(id, "assignee_confirmed")}
        onOpenTask={(taskId) => select({ kind: "task", id: taskId })}
      />
      <DashboardSlice
        title="Updates they stated"
        empty="No spoken updates captured."
        items={dash.updates}
      />
      <DashboardSlice
        title="Asks pointed at them"
        empty="No open asks."
        items={dash.asks}
        onConfirm={(id) => reviewProposal(id, "assignee_confirmed")}
      />

      {dash.skills.length > 0 && (
        <div>
          <FieldLabel>Skill tags</FieldLabel>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {dash.skills.map((s) => (
              <span
                key={s.id}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                  s.status === "proposed"
                    ? "border-[var(--aksh-sun)]/40 bg-[var(--aksh-sun)]/15"
                    : s.status === "dismissed"
                      ? "border-border text-muted-foreground line-through"
                      : "border-[var(--aksh-teal)]/30 bg-[var(--aksh-teal)]/10 text-[var(--aksh-teal-ink)]"
                )}
              >
                {s.tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <FieldLabel>Assigned tasks</FieldLabel>
        <ul className="mt-2 space-y-2">
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

      <div className="mt-auto border-t border-border/60 pt-4">
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-full"
          onClick={() =>
            addPerson({
              name: `Teammate ${people.length + 1}`,
              role: "Teammate",
              capacity: 30,
            })
          }
        >
          Add teammate
        </Button>
      </div>
    </div>
  )
}

function DashboardSlice({
  title,
  empty,
  items,
  onConfirm,
  onOpenTask,
}: {
  title: string
  empty: string
  items: {
    id: string
    title: string
    kind: string
    status: string
    taskId?: string
  }[]
  onConfirm?: (id: string) => void
  onOpenTask?: (taskId: string) => void
}) {
  return (
    <div>
      <FieldLabel>{title}</FieldLabel>
      <ul className="mt-2 space-y-2">
        {items.length === 0 && (
          <li className="text-sm text-muted-foreground">{empty}</li>
        )}
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-2xl border border-border/70 bg-card px-3 py-2.5 text-sm"
          >
            <p className="font-medium">{item.title}</p>
            <p className="mt-0.5 text-xs capitalize text-muted-foreground">
              {item.kind} · {item.status.replace("_", " ")}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {item.status === "proposed" && onConfirm && (
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full bg-[var(--aksh-teal)] text-white hover:bg-[var(--aksh-teal)]/90"
                  onClick={() => onConfirm(item.id)}
                >
                  Confirm as assignee
                </Button>
              )}
              {item.taskId && onOpenTask && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => onOpenTask(item.taskId!)}
                >
                  Open board task
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function TimelineDetail({ itemId }: { itemId: string }) {
  const { select, timelineItems, people, personById, updateTimelineItem } =
    useWorkspace()
  const item = timelineItems.find((t) => t.id === itemId)
  const [title, setTitle] = useState(item?.title ?? "")
  const [start, setStart] = useState(item?.start ?? 0)
  const [end, setEnd] = useState(item?.end ?? 1)

  useEffect(() => {
    setTitle(item?.title ?? "")
    setStart(item?.start ?? 0)
    setEnd(item?.end ?? 1)
  }, [item?.id, item?.title, item?.start, item?.end])

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
      <label className="grid gap-1.5 text-sm">
        <FieldLabel>Title</FieldLabel>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            const next = title.trim()
            if (next && next !== item.title) {
              updateTimelineItem(item.id, { title: next })
            } else setTitle(item.title)
          }}
          className="h-10 rounded-xl"
        />
      </label>
      <label className="grid gap-1.5 text-sm">
        <FieldLabel>Owner</FieldLabel>
        <select
          value={item.ownerId}
          onChange={(e) =>
            updateTimelineItem(item.id, { ownerId: e.target.value })
          }
          className={selectClassName()}
        >
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1.5 text-sm">
          <FieldLabel>Start day (0–17)</FieldLabel>
          <Input
            type="number"
            min={0}
            max={17}
            value={start}
            onChange={(e) => setStart(Number(e.target.value))}
            onBlur={() => {
              if (start !== item.start) {
                updateTimelineItem(item.id, { start })
              }
            }}
            className="h-10 rounded-xl"
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <FieldLabel>End day (1–18)</FieldLabel>
          <Input
            type="number"
            min={1}
            max={18}
            value={end}
            onChange={(e) => setEnd(Number(e.target.value))}
            onBlur={() => {
              if (end !== item.end) {
                updateTimelineItem(item.id, { end })
              }
            }}
            className="h-10 rounded-xl"
          />
        </label>
      </div>
      <p className="text-xs text-muted-foreground">
        Window: Day {item.start + 1} → Day {item.end}
        {dep ? ` · depends on ${dep.title}` : ""}
      </p>
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
  const { people } = useWorkspace()
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
          className={selectClassName()}
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
          className={selectClassName()}
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
