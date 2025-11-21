import sql from 'mssql'

const connectionConfig: sql.config = {
  user: 'TRIAL',
  password: 'napindo',
  server: 'SERVER-TRIAL\\NAPINDOSQL',
  database: 'NAPINDO',
  options: {
    encrypt: true,
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

export async function closePool() {
  if (!pool) return

  await pool.close()
  pool = null
}
