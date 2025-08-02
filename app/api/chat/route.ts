import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || '' })

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value
  const session = verifySession(sessionToken)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { question, history } = await request.json()
  if (!question) return NextResponse.json({ error: 'Missing question' }, { status: 400 })

  try {
    const formattedHistory = Array.isArray(history)
      ? history.map((m: { role: 'user' | 'model'; text: string }) => ({
          role: m.role,
          parts: [{ text: m.text }],
        }))
      : []

    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      history: formattedHistory,
    })

    const res = await chat.sendMessage({
      message: question,
    })
    console.log(res.text) 

    return NextResponse.json({ text: res.text })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'LLM error' }, { status: 500 })
  }
}
