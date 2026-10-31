import { views, type ViewId } from "@/lib/data"

export type AreaId = "work" | "people" | "voice" | "insights"

export type ViewMeta = {
  id: ViewId
  label: string
  area: AreaId
  path: string
  title: string
  description: string
}

export type AreaMeta = {
  id: AreaId
  label: string
  description: string
  /** Default landing view for the area. */
  defaultView: ViewId
  views: ViewId[]
}

export const areas: AreaMeta[] = [
  {
    id: "work",
    label: "Work",
    description: "Board, schedule, and triage for the sprint.",
    defaultView: "board",
    views: ["board", "timeline", "inbox"],
  },
  {
    id: "people",
    label: "People",
    description: "Capacity and personal commitment slices.",
    defaultView: "team",
    views: ["team"],
  },
  {
    id: "voice",
    label: "Voice",
    description: "Leader-verified enrollment and meeting agents.",
    defaultView: "voices",
    views: ["voices", "meetings"],
  },
  {
    id: "insights",
    label: "Insights",
    description: "Sealed contribution scorecard for the product team.",
    defaultView: "scorecard",
    views: ["scorecard"],
  },
]

/** Canonical paths — nested under dashboard areas. */
export const viewMeta: Record<ViewId, ViewMeta> = {
  board: {
    id: "board",
    label: "Board",
    area: "work",
    path: "/work/board",
    title: "Board",
    description:
      "Stories, bugs, and tasks across columns — drag work through the sprint.",
  },
  timeline: {
    id: "timeline",
    label: "Timeline",
    area: "work",
    path: "/work/timeline",
    title: "Timeline",
    description: "Dependencies and sequencing across the delivery window.",
  },
  inbox: {
    id: "inbox",
    label: "Inbox",
    area: "work",
    path: "/work/inbox",
    title: "Inbox",
    description: "Triage threads and drafts without leaving the workspace.",
  },
  team: {
    id: "team",
    label: "Team",
    area: "people",
    path: "/people",
    title: "Team",
    description:
      "Workload, personal dashboards, and meeting commitments by person.",
  },
  voices: {
    id: "voices",
    label: "Voices",
    area: "voice",
    path: "/voice",
    title: "Voices",
    description:
      "Leader-gated enrollment — only verified voices can score commitments.",
  },
  meetings: {
    id: "meetings",
    label: "Meetings",
    area: "voice",
    path: "/voice/meetings",
    title: "Meetings",
    description:
      "Capture audio or transcript, run agents, then confirm the queue.",
  },
  scorecard: {
    id: "scorecard",
    label: "Scorecard",
    area: "insights",
    path: "/insights",
    title: "Scorecard",
    description:
      "Contribution from sealed commitments only — weights stay visible.",
  },
}

const viewIds = new Set(views.map((v) => v.id))

export function isViewId(value: string): value is ViewId {
  return viewIds.has(value as ViewId)
}

export function pathForView(id: ViewId): string {
  return viewMeta[id].path
}

export function areaById(id: AreaId): AreaMeta {
  return areas.find((a) => a.id === id) ?? areas[0]
}

export function areaForView(id: ViewId): AreaMeta {
  return areaById(viewMeta[id].area)
}

export function viewsInArea(areaId: AreaId): ViewMeta[] {
  const area = areaById(areaId)
  return area.views.map((id) => viewMeta[id])
}

/** Resolve active view from nested or legacy flat paths. */
export function viewFromPathname(pathname: string): ViewId {
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length === 0) return "board"

  const [first, second] = segments

  if (first === "work") {
    if (second && isViewId(second) && viewMeta[second].area === "work") {
      return second
    }
    return "board"
  }
  if (first === "people") return "team"
  if (first === "voice") {
    if (second === "meetings") return "meetings"
    if (second === "voices" || !second) return "voices"
    return "voices"
  }
  if (first === "insights") return "scorecard"

  // Legacy flat URLs (redirects also cover these).
  if (isViewId(first)) return first

  return "board"
}

export function areaFromPathname(pathname: string): AreaMeta {
  return areaForView(viewFromPathname(pathname))
}
