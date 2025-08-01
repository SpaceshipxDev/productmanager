import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ success: true })
  res.cookies.set('session', '', { httpOnly: true, maxAge: 0, path: '/', sameSite: 'strict' })
  return res
}
