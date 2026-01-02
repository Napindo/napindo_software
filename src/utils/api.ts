const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api'

export const buildApiUrl = (path: string) => `${API_BASE_URL.replace(/\/$/, '')}${API_PREFIX}${path}`

export const isApiOk = (body: any) => body?.ok === true || body?.success === true

export const pickApiData = (body: any) => body?.data ?? body?.items ?? body?.rows ?? body
