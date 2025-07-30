import { randomBytes, pbkdf2Sync, createHmac } from 'crypto'

const SECRET = process.env.SESSION_SECRET || 'local-secret'

export function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  const hash = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return `${salt}$${hash}`
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split('$')
  const hashed = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return hashed === hash
}

export function createSession(userId: number) {
  const payload = { userId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }
  return sign(payload)
}

function sign(data: object) {
  const json = JSON.stringify(data)
  const encoded = Buffer.from(json).toString('base64url')
  const signature = createHmac('sha256', SECRET).update(encoded).digest('base64url')
  return `${encoded}.${signature}`
}

export function verifySession(token?: string) {
  if (!token) return null
  const [encoded, sig] = token.split('.')
  if (!encoded || !sig) return null
  const check = createHmac('sha256', SECRET).update(encoded).digest('base64url')
  if (check !== sig) return null
  const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString()) as { userId: number; exp: number }
  if (payload.exp < Date.now()) return null
  return payload
}
