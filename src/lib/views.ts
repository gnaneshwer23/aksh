import { views, type ViewId } from "@/lib/data"

const viewIds = new Set(views.map((v) => v.id))

export function isViewId(value: string): value is ViewId {
  return viewIds.has(value as ViewId)
}

export function viewFromPathname(pathname: string): ViewId {
  const segment = pathname.split("/").filter(Boolean)[0]
  if (segment && isViewId(segment)) return segment
  return "board"
}
