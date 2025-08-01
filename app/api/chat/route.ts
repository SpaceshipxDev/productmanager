import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { GoogleGenAI } from '@google/genai'
import sqlite3 from 'sqlite3'
import { initDB } from '@/lib/db'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || '' })

async function getLines() {
  const db = new sqlite3.Database(process.env.DB_PATH || './database.sqlite')
  return new Promise<{ username: string; content: string; last_modified: string }[]>((resolve, reject) => {
    db.all(
      `SELECT users.username as username, lines.date as date, lines.idx as idx, lines.content as content, lines.last_modified as last_modified FROM lines JOIN users ON lines.user_id = users.id ORDER BY lines.date DESC, lines.idx;`,
      (err, rows) => {
        db.close()
        if (err) return reject(err)
        resolve(
          rows.map((r: any) => ({
            username: r.username,
            content: r.content,
            last_modified: new Date(r.last_modified * 1000).toLocaleString('en-US', {
              timeZone: 'Asia/Shanghai',
            }),
          }))
        )
      }
    )
  })
}

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

    initDB()
    const rows = await getLines()
    const linesText = rows
      .map(r => `Order ${r.content}. Last edited ${r.last_modified} by employee ${r.username}`)
      .join('\n')
    const shanghaiTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' })
    const message = `I'm the factory owner. You are my manager responsible for telling me the production /employee status of jobs in the factory. The current time in Shanghai is ${shanghaiTime}. Here is my live database: ${linesText}. My question: ${question}.`

    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      history: formattedHistory,
    })

    const res = await chat.sendMessage({
      message,
    })
    console.log(res.text) 

    return NextResponse.json({ text: res.text })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'LLM error' }, { status: 500 })
  }
}
