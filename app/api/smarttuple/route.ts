import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import {
  initDB,
  getAllNotes,
  getSmartTuples,
  saveSmartTuples,
} from '@/lib/db'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || '' })

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value
  const session = verifySession(sessionToken)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  initDB()

  console.log("function is being run")

  console.log("\n Background process called")
  const notes = getAllNotes()
  const noteText = notes
    .map(n => `${n.username} - ${n.date} (last modified ${new Date(n.lastModified).toISOString()}):\n${n.content}`)
    .join('\n\n')

  const prompt =
    `Summarize the status updates for each work order ID from the following log entries. ` +
    `Entries may contain typos in the IDs (for example missing characters or swapped letters). ` +
    `Group together IDs that appear to refer to the same order. ` +
    `Return ONLY valid JSON mapping each ID to a concise summary.\n\n${noteText}`

  console.log(prompt) 
  
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    })
    const text = res.text ?? ''
    console.log("\n res:, ", text)

    const cleaned = text.replace(/^```json\n/, '').replace(/```$/, '')
    const parsed = JSON.parse(cleaned)
    const items = Object.entries(parsed).map(([id, summary]) => ({ id, summary: String(summary) }))
    saveSmartTuples(items)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'LLM error' }, { status: 500 })
  }

  const tuples = getSmartTuples()
  return NextResponse.json({ tuples })
}
