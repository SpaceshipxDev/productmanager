import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { initDB, getLineEntries } from '@/lib/db'
import { formatDistanceToNow } from 'date-fns'
import { GoogleGenAI } from '@google/genai'

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value
  const session = verifySession(sessionToken)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  initDB()
  const lines = getLineEntries()
  const text = lines
    .map(l => `${l.content} (edited by ${l.name} in ${l.department}, ${formatDistanceToNow(l.lastModified * 1000, { addSuffix: true })})`)
    .join('\n')

  const ai = new GoogleGenAI({})
  const prompt = `From the following notes, extract tasks grouped into kanban columns. Return JSON for kanbanTasks.\n\n${text}`

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: 'Convert the notes into a kanbanTasks JSON object.'
    }
  })

  let tasks: Record<string, any[]> = {}
  try {
    tasks = JSON.parse(response.text)
  } catch (e) {
    tasks = {}
  }
  return NextResponse.json({ tasks })
}
