import sql from 'mssql'

const connectionConfig: sql.config = {
  user: 'TRIAL',
  password: 'napindo',
  server: 'SERVER-TRIAL\\NAPINDOSQL',
  database: 'NAPINDO',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
}

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
    whereClause += ' AND DIVISI = @division'
  }

  const query = `SELECT TOP (1) * FROM dbo.PENGGUNA ${whereClause}`

  const result = await request.query(query)
  const user = result.recordset?.[0]

  if (!user) {
    return null
  }

  const resolvedUsername = (user.USERNAME as string | undefined) ?? (user.username as string | undefined) ?? username
  const resolvedDivision =
    (user.DIVISI as string | undefined) ?? (user.divisi as string | undefined) ?? (division ?? null)
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
