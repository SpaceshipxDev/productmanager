import { NextRequest, NextResponse } from 'next/server'
import { getUser, initDB } from '@/lib/db'
import { verifyPassword, createSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const { username, password } = await request.json()
  if (!username || !password) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
  }
  initDB()
  const user = getUser(username)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (!verifyPassword(password, user.password)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }
  const token = createSession(user.id)
  const res = NextResponse.json({ success: true })
  res.cookies.set('session', token, { httpOnly: true, sameSite: 'strict', path: '/' })
  return res
}
