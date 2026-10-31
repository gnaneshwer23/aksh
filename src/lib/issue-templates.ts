import type { IssueType, Priority } from "@/lib/data"

export type IssueTemplate = {
  type: IssueType
  label: string
  shortLabel: string
  description: string
  /** Hint shown under the type picker */
  hint: string
  /** Soft accent classes for badges / board indicators */
  toneClass: string
  /** Optional defaults applied when selecting this type on create */
  defaults?: {
    priority?: Priority
    points?: number
    tags?: string[]
  }
}

export const issueTemplates: IssueTemplate[] = [
  {
    type: "story",
    label: "User Story",
    shortLabel: "Story",
    hint: "Outcome for a user, with acceptance criteria",
    toneClass:
      "bg-[var(--aksh-teal)]/15 text-[var(--aksh-teal-ink)] border-[var(--aksh-teal)]/25",
    defaults: {
      priority: "medium",
      points: 3,
      tags: ["story"],
    },
    description: `## User story

**As a** [persona]
**I want** [capability]
**So that** [outcome]

## Acceptance criteria

- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

## Notes

- 
`,
  },
  {
    type: "bug",
    label: "Bug Report",
    shortLabel: "Bug",
    hint: "Repro steps, expected vs actual, environment",
    toneClass:
      "bg-[var(--aksh-coral)]/15 text-[var(--aksh-coral-ink)] border-[var(--aksh-coral)]/25",
    defaults: {
      priority: "high",
      points: 2,
      tags: ["bug"],
    },
    description: `## Summary

[One-line impact]

## Environment

- App / build:
- Browser / OS:
- Account / role:

## Steps to reproduce

1. 
2. 
3. 

## Expected

- 

## Actual

- 

## Severity

- [ ] Blocker  ·  [ ] Major  ·  [ ] Minor  ·  [ ] Trivial
`,
  },
  {
    type: "task",
    label: "Task",
    shortLabel: "Task",
    hint: "Checklist-friendly work with a clear done state",
    toneClass:
      "bg-[var(--aksh-sky)]/20 text-[var(--aksh-sky-ink)] border-[var(--aksh-sky)]/30",
    defaults: {
      priority: "medium",
      points: 2,
      tags: ["task"],
    },
    description: `## Description

[What needs to be done]

## Checklist

- [ ] 
- [ ] 
- [ ] 

## Definition of done

- [ ] Reviewed / verified
- [ ] Linked artifacts updated
`,
  },
]

export function templateByType(type: IssueType): IssueTemplate {
  return (
    issueTemplates.find((t) => t.type === type) ??
    issueTemplates.find((t) => t.type === "task")!
  )
}

export function issueTypeLabel(type: IssueType): string {
  return templateByType(type).shortLabel
}

export function issueTypeTone(type: IssueType): string {
  return templateByType(type).toneClass
}
