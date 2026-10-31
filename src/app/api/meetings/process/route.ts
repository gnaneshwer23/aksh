import { NextResponse } from "next/server"
import { people } from "@/lib/data"
import {
  diarizeTranscript,
  extractProposalsFromLines,
} from "@/lib/voice-agents"

/**
 * Optional server-side agent pipeline for meeting transcripts.
 * The in-app Meetings view also runs the same heuristics client-side
 * so the demo works without a network round-trip.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      meetingId?: string
      transcript?: string
    }
    const meetingId = body.meetingId?.trim() || "api-meeting"
    const transcript = body.transcript?.trim()
    if (!transcript) {
      return NextResponse.json(
        { error: "transcript is required" },
        { status: 400 }
      )
    }

    const lines = diarizeTranscript(transcript, people)
    const extracted = extractProposalsFromLines(meetingId, lines, people)

    return NextResponse.json({
      meetingId,
      lines,
      proposals: extracted.proposals,
      skills: extracted.skills,
      note: "Agents propose only — confirm before board or scorecard impact.",
    })
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
}
