const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api'

export const buildApiUrl = (path: string) => `${API_BASE_URL.replace(/\/$/, '')}${API_PREFIX}${path}`

export const isApiOk = (body: any) => body?.ok === true || body?.success === true

export const pickApiData = (body: any) => body?.data ?? body?.items ?? body?.rows ?? body

export const extractErrorMessage = (value: unknown, fallback = 'Terjadi kesalahan'): string => {
  if (value == null) return fallback

  if (value instanceof Error) {
    return extractErrorMessage(value.message, fallback)
  }

  if (typeof value === 'object') {
    const payload = value as { message?: unknown; error?: unknown }
    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message.trim()
    }
    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error.trim()
    }
    return fallback
  }

  const text = String(value).trim()
  if (!text) return fallback

  try {
    const parsed = JSON.parse(text)
    if (parsed && typeof parsed === 'object') {
      const message = (parsed as { message?: unknown; error?: unknown }).message
      if (typeof message === 'string' && message.trim()) return message.trim()

      const error = (parsed as { error?: unknown }).error
      if (typeof error === 'string' && error.trim()) return error.trim()
    }
  } catch {
    // plain text response
  }

  return text
}
