import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { getAllNotes, initDB } from '@/lib/db'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || '' })

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value
  const session = verifySession(sessionToken)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { question } = await request.json()
  if (!question) return NextResponse.json({ error: 'Missing question' }, { status: 400 })

  initDB()
  const notes = getAllNotes()
  const noteText = notes
    .map(n => `${n.username} - ${n.date} (last modified ${new Date(n.lastModified).toISOString()}):\n${n.content}`)
    .join('\n\n')

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: `All notes from every user:\n${noteText}` },
        { role: 'user', parts: question }
      ]
    })
    return NextResponse.json({ text: res.text })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'LLM error' }, { status: 500 })
  }
}
