import { getDatabaseBridge, getIpcRenderer } from '../utils/bridge'

export type AuditLogRow = {
  id: number
  username?: string | null
  action: string
  page?: string | null
  summary?: string | null
  data?: unknown
  createdAt: string
}

type DatabaseResponse<T = unknown> =
  | { success: true; rows?: T[]; data?: T; message?: string }
  | { success: false; message: string }

async function invokeFetchAuditLogs(limit = 200): Promise<DatabaseResponse> {
  const db = getDatabaseBridge()
  if (db && typeof db.fetchAuditLogs === 'function') {
    return db.fetchAuditLogs(limit) as Promise<DatabaseResponse>
  }

  const ipc = getIpcRenderer()
  if (ipc && typeof ipc.invoke === 'function') {
    return ipc.invoke('db:fetchAuditLogs', limit) as Promise<DatabaseResponse>
  }

  throw new Error('Bridge Electron untuk fetchAuditLogs tidak tersedia')
}

export async function fetchAuditLogs(limit = 200): Promise<AuditLogRow[]> {
  const response = await invokeFetchAuditLogs(limit)
  if (!response || response.success === false) {
    throw new Error(response?.message ?? 'Gagal memuat audit log')
  }

  return (response.rows ?? response.data ?? []) as AuditLogRow[]
}

export async function createAuditLog(payload: {
  username?: string | null
  action: string
  page?: string | null
  summary?: string | null
  data?: unknown
}) {
  const db = getDatabaseBridge()
  if (db && typeof db.createAuditLog === 'function') {
    const response = await db.createAuditLog(payload)
    if (!response || response.success === false) {
      throw new Error(response?.message ?? 'Gagal menyimpan audit log')
    }
    return response.data ?? response
  }

  const ipc = getIpcRenderer()
  if (ipc && typeof ipc.invoke === 'function') {
    const response = await ipc.invoke('db:createAuditLog', payload)
    if (!response || response.success === false) {
      throw new Error(response?.message ?? 'Gagal menyimpan audit log')
    }
    return response.data ?? response
  }

  throw new Error('Bridge Electron untuk createAuditLog tidak tersedia')
}
