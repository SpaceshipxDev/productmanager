import { execFileSync } from 'child_process'
import { join } from 'path'
const dbPath = join(process.cwd(), 'database.sqlite')

export function initDB() {
  const commands = [
    "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT, name TEXT, department TEXT);",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT;",
    "CREATE TABLE IF NOT EXISTS lines (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, date TEXT, idx INTEGER, content TEXT, last_modified INTEGER, UNIQUE(user_id, date, idx));",
  ]
  for (const cmd of commands) {
    execFileSync('sqlite3', [dbPath, cmd])
  }
}

function escape(value: string) {
  return value.replace(/'/g, "''")
}

function query(sql: string) {
  const out = execFileSync('sqlite3', ['-json', dbPath, sql], { encoding: 'utf8' }).trim()
  return out ? JSON.parse(out) : []
}

function run(sql: string) {
  execFileSync('sqlite3', [dbPath, sql])
}

export function getUser(username: string) {
  initDB()
  const rows = query(`SELECT id, username, password, name, department FROM users WHERE username = '${escape(username)}' LIMIT 1;`)
  return rows[0] as { id: number; username: string; password: string; name: string; department: string } | undefined
}

export function getUserById(id: number) {
  initDB()
  const rows = query(`SELECT id, username, name, department FROM users WHERE id = ${id} LIMIT 1;`)
  return rows[0] as { id: number; username: string; name: string; department: string } | undefined
}

export function createUser(username: string, password: string, name: string, department: string) {
  initDB()
  run(`INSERT INTO users (username, password, name, department) VALUES ('${escape(username)}','${escape(password)}','${escape(name)}','${escape(department)}');`)
}

export function getNote(userId: number, date: string) {
  initDB()
  const rows = query(
    `SELECT idx, content, last_modified FROM lines WHERE user_id = ${userId} AND date = '${escape(date)}' ORDER BY idx;`
  )
  if (rows.length) {
    const content = rows.map((r: any) => r.content as string).join('\n')
    const lastModified = Math.max(...rows.map((r: any) => Number(r.last_modified))) * 1000
    return { content, lastModified }
  }
  return undefined
}

export function upsertNote(userId: number, date: string, content: string) {
  initDB()
  const lines = content
    .split('\n')
    .map(l => l.trim())
    .filter(l => l !== '')

  const existing = query(
    `SELECT idx, content FROM lines WHERE user_id = ${userId} AND date = '${escape(date)}' ORDER BY idx;`
  ) as { idx: number; content: string }[]
  const map = new Map<number, string>()
  for (const row of existing) map.set(row.idx, row.content)

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx]
    const current = map.get(idx)
    if (current === undefined) {
      run(
        `INSERT INTO lines (user_id, date, idx, content, last_modified) VALUES (${userId}, '${escape(
          date
        )}', ${idx}, '${escape(line)}', strftime('%s','now'));`
      )
    } else if (current !== line) {
      run(
        `UPDATE lines SET content='${escape(line)}', last_modified=strftime('%s','now') WHERE user_id = ${userId} AND date = '${escape(
          date
        )}' AND idx = ${idx};`
      )
    }
  }
  run(`DELETE FROM lines WHERE user_id = ${userId} AND date = '${escape(date)}' AND idx >= ${lines.length};`)
}

export function getAllNotes() {
  initDB()
  const rows = query(
    `SELECT users.username as username, lines.date as date, lines.idx as idx, lines.content as content, lines.last_modified as last_modified FROM lines JOIN users ON lines.user_id = users.id ORDER BY lines.date DESC, lines.idx;`
  ) as { username: string; date: string; idx: number; content: string; last_modified: number }[]

  const map = new Map<
    string,
    { username: string; date: string; lines: string[]; lastModified: number[] }
  >()

  for (const row of rows) {
    const key = `${row.username}|${row.date}`
    if (!map.has(key)) {
      map.set(key, {
        username: row.username,
        date: row.date,
        lines: [],
        lastModified: [],
      })
    }
    const entry = map.get(key)!
    entry.lines[row.idx] = row.content
    entry.lastModified[row.idx] = row.last_modified
  }

  return Array.from(map.values()).map(v => ({
    username: v.username,
    date: v.date,
    content: v.lines.join('\n'),
    lastModified: new Date(Math.max(...v.lastModified) * 1000).toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }),
  }))
}
