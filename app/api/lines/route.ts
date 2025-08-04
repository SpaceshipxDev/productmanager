import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { initDB, getLineEntries } from '@/lib/db'

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value
  const session = verifySession(sessionToken)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  initDB()
  const lines = getLineEntries()
  return NextResponse.json({ lines })
}
