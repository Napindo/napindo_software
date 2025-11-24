import sql from 'mssql'
import path from 'node:path'
import fs from 'node:fs'

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return
  const content = fs.readFileSync(filePath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const [key, ...rest] = trimmed.split('=')
    if (!key) continue
    if (typeof process.env[key] === 'undefined') {
      process.env[key] = rest.join('=').trim()
    }
  }
}

loadEnvFile(path.resolve(process.cwd(), '.env'))

function parseBool(value: string | undefined, fallback: boolean) {
  if (typeof value === 'undefined') return fallback
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

function buildConnectionConfig(): sql.config {
  const user = process.env.DB_USER || 'TRIAL'
  const password = process.env.DB_PASSWORD || 'napindo'
  const server = process.env.DB_SERVER || 'SERVER-TRIAL\\NAPINDOSQL'
  const database = process.env.DB_DATABASE || 'NAPINDO'
  const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined
  const encrypt = parseBool(process.env.DB_ENCRYPT, false)
  const trustServerCertificate = parseBool(process.env.DB_TRUST_CERT, true)

  if (!server || !database) {
    throw new Error('Konfigurasi DB tidak lengkap. Pastikan DB_SERVER dan DB_DATABASE terisi.')
  }

  const config: sql.config = {
    user,
    password,
    server,
    database,
    options: {
      encrypt,
      trustServerCertificate,
    },
  }

  if (port && Number.isFinite(port)) {
    config.port = port
  }

  return config
}

const connectionConfig: sql.config = buildConnectionConfig()

let pool: sql.ConnectionPool | null = null

async function ensurePool() {
  if (pool) return pool

  pool = await sql.connect(connectionConfig)
  return pool
}

export async function testConnection() {
  const currentPool = await ensurePool()
  const result = await currentPool.request().query('SELECT GETDATE() AS currentTime')

  return {
    success: true,
    serverTime: result.recordset?.[0]?.currentTime,
  }
}

export function getConnectionInfo() {
  const { password: _password, ...rest } = connectionConfig
  return rest
}

export async function fetchTopRows(tableName: string, top = 10) {
  const safeTableName = tableName.replace(/[^\w.]/g, '')

  if (!safeTableName) {
    throw new Error('Nama tabel tidak valid')
  }

  const currentPool = await ensurePool()
  const query = `SELECT TOP (${top}) * FROM ${safeTableName}`
  const result = await currentPool.request().query(query)

  return result.recordset ?? []
}

type LoginPayload = {
  username: string
  password: string
  division?: string | null
}

export async function loginUser(payload: LoginPayload) {
  const username = payload.username.trim()
  const password = payload.password
  const division = payload.division?.trim()

  if (!username || !password) {
    throw new Error('Username dan password wajib diisi')
  }

  const currentPool = await ensurePool()
  const request = currentPool.request()

  request.input('username', sql.VarChar(128), username)
  request.input('password', sql.VarChar(256), password)

  let whereClause = 'WHERE USERNAME = @username AND PASSWORD = @password'

  if (division) {
    request.input('division', sql.VarChar(128), division)
    whereClause += ' AND DIVISION = @division'
  }

  const query = `SELECT TOP (1) * FROM dbo.PENGGUNA ${whereClause}`

  const result = await request.query(query)
  const user = result.recordset?.[0]

  if (!user) {
    return null
  }

  const resolvedUsername = (user.USERNAME as string | undefined) ?? (user.username as string | undefined) ?? username
  const resolvedDivision =
    (user.DIVISION as string | undefined) ?? (user.division as string | undefined) ?? (division ?? null)
  const resolvedName = (user.NAMA as string | undefined) ?? (user.nama as string | undefined) ?? null

  return {
    username: resolvedUsername,
    division: resolvedDivision ?? null,
    name: resolvedName,
  }
}

export async function closePool() {
  if (!pool) return

  await pool.close()
  pool = null
}

export async function fetchUserHints() {
  const currentPool = await ensurePool()
  const result = await currentPool
    .request()
    .query('SELECT DISTINCT USERNAME, DIVISION FROM dbo.PENGGUNA ORDER BY USERNAME ASC')

  const usernames = new Set<string>()
  const divisions = new Set<string>()

  for (const row of result.recordset ?? []) {
    const username = (row.USERNAME as string | undefined) ?? (row.username as string | undefined)
    const division = (row.DIVISION as string | undefined) ?? (row.division as string | undefined)

    if (username) usernames.add(String(username))
    if (division) divisions.add(String(division))
  }

  return {
    usernames: Array.from(usernames),
    divisions: Array.from(divisions),
  }
}
