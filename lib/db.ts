import { execFileSync } from 'child_process'
import { join } from 'path'
const dbPath = join(process.cwd(), 'database.sqlite')

export function initDB() {
  const commands = [
    "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT);",
    // legacy table kept for compatibility but no longer used
    "CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, date TEXT, content TEXT, last_modified INTEGER, UNIQUE(user_id, date));",
    // new table storing each line of a note separately
    "CREATE TABLE IF NOT EXISTS note_lines (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, date TEXT, line_index INTEGER, content TEXT, last_modified INTEGER, UNIQUE(user_id, date, line_index));",
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
  const rows = query(`SELECT id, username, password FROM users WHERE username = '${escape(username)}' LIMIT 1;`)
  return rows[0] as { id: number; username: string; password: string } | undefined
}

export function createUser(username: string, password: string) {
  initDB()
  run(`INSERT INTO users (username, password) VALUES ('${escape(username)}','${escape(password)}');`)
}

export function getNote(userId: number, date: string) {
  initDB()
  const rows = query(
    `SELECT line_index, content, last_modified FROM note_lines WHERE user_id = ${userId} AND date = '${escape(date)}' ORDER BY line_index ASC;`
  ) as { line_index: number; content: string; last_modified: number }[]

  if (rows.length) {
    const content = rows.map(r => r.content).join('\n')
    const lastModified = Math.max(...rows.map(r => Number(r.last_modified))) * 1000
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

  lines.forEach((line, idx) => {
    run(
      `INSERT INTO note_lines (user_id, date, line_index, content, last_modified) VALUES (${userId}, '${escape(
        date
      )}', ${idx}, '${escape(line)}', strftime('%s','now')) ON CONFLICT(user_id, date, line_index) DO UPDATE SET content='${escape(
        line
      )}', last_modified=strftime('%s','now');`
    )
  })

  // remove lines that no longer exist
  run(`DELETE FROM note_lines WHERE user_id = ${userId} AND date = '${escape(date)}' AND line_index >= ${lines.length};`)
}

export function getAllNotes() {
  initDB()
  const rows = query(
    `SELECT users.username as username, note_lines.date as date, note_lines.line_index as line_index, note_lines.content as content FROM note_lines JOIN users ON note_lines.user_id = users.id ORDER BY note_lines.date DESC, note_lines.line_index ASC;`
  ) as { username: string; date: string; line_index: number; content: string }[]

  const grouped: Record<string, { username: string; date: string; content: string }> = {}
  for (const r of rows) {
    const key = `${r.username}-${r.date}`
    if (!grouped[key]) {
      grouped[key] = { username: r.username, date: r.date, content: r.content }
    } else {
      grouped[key].content += `\n${r.content}`
    }
  }
  return Object.values(grouped)
}
