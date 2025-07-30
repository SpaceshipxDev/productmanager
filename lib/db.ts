import { execFileSync } from 'child_process'
import { join } from 'path'
const dbPath = join(process.cwd(), 'database.sqlite')

export function initDB() {
  const commands = [
    "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT);",
    "CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, date TEXT, content TEXT, last_modified INTEGER, UNIQUE(user_id, date));",
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
  const rows = query(`SELECT content, last_modified FROM notes WHERE user_id = ${userId} AND date = '${escape(date)}' LIMIT 1;`)
  if (rows[0]) {
    return { content: rows[0].content as string, lastModified: Number(rows[0].last_modified) * 1000 }
  }
  return undefined
}

export function upsertNote(userId: number, date: string, content: string) {
  initDB()
  run(`INSERT INTO notes (user_id, date, content, last_modified) VALUES (${userId}, '${escape(date)}', '${escape(content)}', strftime('%s','now')) ON CONFLICT(user_id, date) DO UPDATE SET content='${escape(content)}', last_modified=strftime('%s','now');`)
}
