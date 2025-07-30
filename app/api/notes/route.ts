import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { getNote, upsertNote, initDB } from '@/lib/db'

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value
  const session = verifySession(sessionToken)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const date = request.nextUrl.searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'Missing date' }, { status: 400 })
  initDB()
  const note = getNote(session.userId, date)
  return NextResponse.json({ note })
}

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value
  const session = verifySession(sessionToken)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { date, content } = await request.json()
  if (!date) return NextResponse.json({ error: 'Missing date' }, { status: 400 })
  initDB()
  upsertNote(session.userId, date, content || '')
  return NextResponse.json({ success: true })
}
