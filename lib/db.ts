import { execFileSync } from 'child_process'
import { join } from 'path'
import fs from 'fs'

const dbPath = join(process.cwd(), 'database.sqlite')

export function initDB() {
  if (!fs.existsSync(dbPath)) {
    execFileSync('sqlite3', [dbPath, 'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT);'])
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
