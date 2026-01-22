import fs from 'node:fs'
import path from 'node:path'

export type ExhibitorSegment =
  | 'defence'
  | 'aerospace'
  | 'marine'
  | 'water'
  | 'waste'
  | 'iismex'
  | 'renergy'
  | 'security'
  | 'firex'
  | 'livestock'
  | 'agrotech'
  | 'vet'
  | 'fisheries'
  | 'feed'
  | 'dairy'
  | 'horticulture'

export type PersonType = 'exhibitor' | 'visitor'

export type Gabung = {
  nourut: number
  company: string | null
  name: string | null
  city: string | null
  propince: string | null
  code: string | null
  lastupdate: string | null
}

export type ApiResponse<T = unknown> =
  | { ok?: boolean; success?: boolean; data?: T; rows?: T; items?: T; message?: string }

export type ApiResult<T = unknown> = {
  status: number
  body: ApiResponse<T>
}

export const isResponseOk = (body?: ApiResponse<any>) => body?.ok === true || body?.success === true

export const pickData = <T = unknown>(body?: ApiResponse<T>) => {
  if (!body) return undefined
  if (typeof body.data !== 'undefined') return body.data
  if (typeof (body as any).items !== 'undefined') return (body as any).items
  if (typeof (body as any).rows !== 'undefined') return (body as any).rows
  return undefined
}

export const uniqueClean = (values: Array<string | null | undefined>) =>
  Array.from(
    new Set(
      values
        .map((item) => (item == null ? '' : String(item).trim()))
        .filter(Boolean),
    ),
  )

export function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return
  const content = fs.readFileSync(filePath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const [key, ...rest] = trimmed.split('=')
    if (typeof process.env[key] === 'undefined') {
      process.env[key] = rest.join('=').trim()
    }
  }
}

const appRoot = process.env.APP_ROOT
if (appRoot) {
  loadEnvFile(path.resolve(appRoot, '.env'))
}
loadEnvFile(path.resolve(process.cwd(), '.env'))
loadEnvFile(path.resolve(process.cwd(), '..', '.env'))

export const API_BASE_URL =
  process.env.API_BASE_URL ||
  process.env.VITE_API_BASE_URL ||
  'http://192.168.1.171:8133'
export const API_PREFIX = process.env.API_PREFIX || process.env.VITE_API_PREFIX || '/api'

const ensureNoProxyForLocal = () => {
  const existing = process.env.NO_PROXY || process.env.no_proxy || ''
  const entries = existing
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  const required = ['localhost', '127.0.0.1']
  let changed = false
  required.forEach((host) => {
    if (!entries.includes(host)) {
      entries.push(host)
      changed = true
    }
  })
  if (changed) {
    const value = entries.join(',')
    process.env.NO_PROXY = value
    process.env.no_proxy = value
  }
}

type ApiFetchOptions = RequestInit & { timeoutMs?: number }

export async function apiFetch<T = unknown>(pathName: string, init: ApiFetchOptions = {}): Promise<ApiResult<T>> {
  const url = `${API_BASE_URL.replace(/\/$/, '')}${API_PREFIX}${pathName}`
  ensureNoProxyForLocal()

  const attempt = async (targetUrl: string): Promise<ApiResult<T>> => {
    const timeoutMs = typeof init.timeoutMs === 'number' ? init.timeoutMs : 0
    const controller = timeoutMs > 0 ? new AbortController() : null
    const timeoutId = controller
      ? setTimeout(() => {
          controller.abort()
        }, timeoutMs)
      : null

    try {
      const response = await fetch(targetUrl, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(init.headers || {}),
        },
        signal: controller?.signal,
      })
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      const contentType = response.headers.get('content-type') || ''
      let body: ApiResponse<T>

      if (contentType.includes('application/json')) {
        body = (await response.json()) as ApiResponse<T>
      } else {
        const text = await response.text()
        body = { success: false, ok: false, message: text }
      }

      return { status: response.status, body }
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }

  try {
    return await attempt(url)
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    const isTimeout = err instanceof Error && err.name === 'AbortError'

    if (isTimeout) {
      return {
        status: 408,
        body: {
          success: false,
          message: `Request timeout saat menghubungi API (${url}). Coba lagi atau cek koneksi API/DB.`,
        },
      }
    }

    if (url.includes('localhost')) {
      const fallbackUrl = url.replace('localhost', '127.0.0.1')
      try {
        return await attempt(fallbackUrl)
      } catch (fallbackError) {
        const fallbackDetail = fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
        return {
          status: 500,
          body: {
            success: false,
            message: `Tidak dapat terhubung ke API (${url}). ${detail}. Fallback ${fallbackUrl} gagal: ${fallbackDetail}`,
          },
        }
      }
    }

    if (url.includes('127.0.0.1')) {
      const fallbackUrl = url.replace('127.0.0.1', 'localhost')
      try {
        return await attempt(fallbackUrl)
      } catch (fallbackError) {
        const fallbackDetail = fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
        return {
          status: 500,
          body: {
            success: false,
            message: `Tidak dapat terhubung ke API (${url}). ${detail}. Fallback ${fallbackUrl} gagal: ${fallbackDetail}`,
          },
        }
      }
    }

    return {
      status: 500,
      body: { success: false, message: `Tidak dapat terhubung ke API (${url}). ${detail}` },
    }
  }
}

export async function testConnection() {
  const { body } = await apiFetch<{ serverTime?: string }>('/health')
  if (!isResponseOk(body)) {
    return { success: false, message: body.message }
  }
  const data = pickData(body) as { serverTime?: string } | undefined
  return { success: true, serverTime: data?.serverTime }
}
