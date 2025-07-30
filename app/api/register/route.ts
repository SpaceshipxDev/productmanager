import { NextRequest, NextResponse } from 'next/server'
import { getUser, createUser, initDB } from '@/lib/db'
import { hashPassword, createSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const { username, password } = await request.json()
  if (!username || !password) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
  }
  initDB()
  if (getUser(username)) {
    return NextResponse.json({ error: 'User exists' }, { status: 400 })
  }
  const hashed = hashPassword(password)
  createUser(username, hashed)
  const user = getUser(username)
  const token = createSession(user!.id)
  const res = NextResponse.json({ success: true })
  res.cookies.set('session', token, { httpOnly: true, sameSite: 'strict', path: '/' })
  return res
}
