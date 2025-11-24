import fs from 'node:fs'
import path from 'node:path'

type ExhibitorSegment = 'defence' | 'aerospace' | 'marine'

type ApiResponse<T = unknown> =
  | { success: true; data?: T; message?: string }
  | { success: false; message: string }

type ApiResult<T = unknown> = {
  status: number
  body: ApiResponse<T>
}

type LoginPayload = {
  username: string
  password: string
  division?: string | null
}

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

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001'
const API_PREFIX = process.env.API_PREFIX || '/api'

async function apiFetch<T = unknown>(pathName: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  const url = `${API_BASE_URL.replace(/\/$/, '')}${API_PREFIX}${pathName}`
  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    })

    const body = (await response.json()) as ApiResponse<T>
    return { status: response.status, body }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Tidak dapat terhubung ke API'
    return { status: 500, body: { success: false, message } }
  }
}

export async function testConnection() {
  const { body, status } = await apiFetch<{ serverTime?: string }>('/health')

  if (!body.success) {
    return { success: false as const, message: body.message || `Healthcheck gagal dengan status ${status}` }
  }

  return {
    success: true as const,
    serverTime: body.data?.serverTime ?? body.data,
  }
}

export function getConnectionInfo() {
  return {
    apiUrl: `${API_BASE_URL}${API_PREFIX}`,
  }
}

export async function fetchTopRows(tableName: string, top = 10) {
  const safeName = tableName.replace(/[^\w.]/g, '')
  if (!safeName) {
    throw new Error('Nama tabel tidak valid')
  }
  const { body } = await apiFetch<Record<string, unknown>[]>(`/gabung/table/${encodeURIComponent(safeName)}?limit=${top}`)

  if (!body.success) {
    throw new Error(body.message || 'Gagal mengambil data tabel')
  }

  return body.data ?? []
}

export async function fetchExhibitorsBySegment(segment: ExhibitorSegment, limit = 200) {
  const { body } = await apiFetch<Record<string, unknown>[]>(`/gabung/${segment}?limit=${limit}`)

  if (!body.success) {
    throw new Error(body.message || 'Gagal memuat data exhibitor')
  }

  return body.data ?? []
}

export async function loginUser(payload: LoginPayload) {
  const username = payload.username.trim()
  const password = payload.password
  const division = payload.division?.trim()

  if (!username || !password) {
    throw new Error('Username dan password wajib diisi')
  }

  const { body, status } = await apiFetch<{ username: string; division?: string | null; name?: string | null }>(
    '/pengguna/login',
    {
      method: 'POST',
      body: JSON.stringify({ username, password, division }),
    },
  )

  if (!body.success) {
    if (status === 401) {
      return null
    }

    throw new Error(body.message || 'Gagal memproses login')
  }

  return body.data ?? null
}

export async function closePool() {
  // Tidak ada pool yang perlu ditutup pada koneksi HTTP ke API
}

export async function fetchUserHints() {
  const { body } = await apiFetch<{ usernames: string[]; divisions: string[] }>('/pengguna/hints')

  if (!body.success) {
    throw new Error(body.message || 'Gagal memuat data pengguna')
  }

  return body.data ?? { usernames: [], divisions: [] }
}
