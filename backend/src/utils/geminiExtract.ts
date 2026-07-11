import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
// ── Retry helper ──
async function callGeminiWithRetry(
  model: any,
  input: any,
  retries = 4,
  delayMs = 2000
): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      return await model.generateContent(input)
    } catch (err: any) {
      if (err.status === 503 && i < retries - 1) {
        console.log(`⏳ Gemini busy, retry ${i + 1}/${retries} in ${delayMs}ms...`)
        await new Promise(res => setTimeout(res, delayMs))
        delayMs *= 2
      } else {
        throw err
      }
    }
  }
}
export interface ExtractedCommitment {
  studentName: string
  completedWork: string
  nextCommitment: string
}

/**
 * Sends a raw meeting transcript + the list of known student names in the
 * workspace to Gemini, and asks it to extract, per student who spoke:
 * - what they said they completed
 * - what they committed to doing next
 *
 * Returns an empty array if no student updates are found in the transcript.
 */
export async function extractCommitmentsFromTranscript(
  transcript: string,
  knownStudentNames: string[]
): Promise<ExtractedCommitment[]> {
  if (!transcript || !transcript.trim()) {
    return []
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

  const prompt = `You are analyzing a meeting transcript from a mentor-student progress sync meeting.

Known students in this workspace: ${knownStudentNames.join(', ')}

Transcript:
"""
${transcript}
"""

For each student who spoke in the transcript, extract:
- studentName: the EXACT name from the known students list above
- completedWork: a short summary (max 15 words) of what they said they completed this week
- nextCommitment: a short summary (max 15 words) of what they said they will work on next

STRICT RULES:
- studentName must be an EXACT, confident match to a name on the known students list.
- Do NOT guess, infer, or pick the "closest" name if the speaker is unclear, unnamed, or labeled "Unknown".
- If the transcript shows the speaker as "Unknown" or has no name attribution, and there is no explicit name mentioned anywhere in that segment's own text, SKIP that segment entirely — do not assign it to any student.
- Never default to any name just because it appears first in the list, or because it's the only name you recognize contextually — only use explicit textual evidence from the transcript itself.
- Ignore greetings, small talk, or anyone not on the known students list.
- If a student spoke but gave no clear completed work or next commitment, skip them.

Respond with ONLY a raw JSON array, no markdown formatting, no code fences, no explanation. Example:
[{"studentName": "Sakshi Mittal", "completedWork": "Finished login page and JWT auth", "nextCommitment": "Build dashboard API integration"}]

If no valid, confidently-attributed student updates are found, respond with exactly: []`

  const result = await callGeminiWithRetry(model, prompt)
  const rawText = result.response.text().trim()

  // Gemini sometimes wraps output in ```json ... ``` despite instructions — strip it defensively
  const cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim()

  try {
    const parsed = JSON.parse(cleaned)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch (err) {
    console.error('🔴 Failed to parse Gemini response:', rawText)
    throw new Error('AI returned an unexpected format. Please try again.')
  }
}
// ─── ADD THIS to the bottom of backend/src/utils/geminiExtract.ts ───

export interface ExtractedCommitmentFromAudio extends ExtractedCommitment {
  // same shape as ExtractedCommitment — no extra fields needed
}

/**
 * Sends a base64-encoded audio chunk to Gemini and extracts per-student:
 * - who spoke (matched to knownStudentNames)
 * - what they completed
 * - what they committed to next
 *
 * Supported audio mimeTypes: audio/wav, audio/mp3, audio/aiff, audio/aac, audio/ogg, audio/flac
 * Returns empty array if no student updates found.
 */
export async function extractCommitmentsFromAudio(
  audioBase64: string,
  mimeType: string,
  knownStudentNames: string[]
): Promise<ExtractedCommitment[]> {
  if (!audioBase64) return []

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

  const prompt = `You are analyzing a live meeting audio recording from a mentor-student progress sync meeting.

Known students in this workspace: ${knownStudentNames.join(', ')}

Listen to the audio and for each student who spoke, extract:
- studentName: match to the closest known student name from the list above (exact match preferred)
- completedWork: a short summary (max 15 words) of what they said they completed this week
- nextCommitment: a short summary (max 15 words) of what they said they will work on next

Rules:
- Only include students who are clearly present in the known students list above.
- Ignore greetings, small talk, or anyone not on the known students list.
- If a student spoke but gave no clear completed work or next commitment, skip them.
- If the audio is silent, inaudible, or contains no clear speech, respond with exactly: []
- Do NOT infer or guess — only extract what was clearly and explicitly spoken.
Respond with ONLY a raw JSON array, no markdown, no code fences, no explanation. Example:
[{"studentName": "Rahul Sharma", "completedWork": "Finished login page and JWT auth", "nextCommitment": "Build dashboard API integration"}]

If no valid student updates found, respond with exactly: []`

  const result = await callGeminiWithRetry(model, [
  { text: prompt },
  { inlineData: { mimeType, data: audioBase64 } },
])

  const rawText = result.response.text().trim()
  const cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim()

  try {
    const parsed = JSON.parse(cleaned)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch (err) {
    console.error('🔴 Failed to parse Gemini audio response:', rawText)
    throw new Error('AI returned an unexpected format for audio chunk.')
  }
}