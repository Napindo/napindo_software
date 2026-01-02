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

function getDatabaseBridge(): any {
  return (window as any).database ?? null
}

function getIpcRenderer(): any {
  return (window as any).ipcRenderer ?? null
}

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
