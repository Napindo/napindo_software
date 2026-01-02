import { getDatabaseBridge, getIpcRenderer } from '../utils/bridge'

export type CreatePenggunaPayload = {
  username: string
  password: string
  division?: string | null
  status?: string | null
}

export type ChangePenggunaPasswordPayload = {
  username: string
  currentPassword: string
  newPassword: string
  division?: string | null
}

export type LogoutPenggunaPayload = {
  username: string
}

export type PenggunaRow = {
  username?: string
  division?: string | null
  status?: string | null
}

export type DatabaseResponse<T = unknown> =
  | { success: true; data?: T; user?: T; message?: string }
  | { success: false; message: string }

async function invokeCreatePengguna(payload: CreatePenggunaPayload): Promise<DatabaseResponse> {
  const db = getDatabaseBridge()
  if (db && typeof db.createPengguna === 'function') {
    return db.createPengguna(payload) as Promise<DatabaseResponse>
  }

  const ipc = getIpcRenderer()
  if (ipc && typeof ipc.invoke === 'function') {
    return ipc.invoke('db:createPengguna', payload) as Promise<DatabaseResponse>
  }

  throw new Error('Bridge Electron untuk createPengguna tidak tersedia')
}

export async function createPengguna(payload: CreatePenggunaPayload): Promise<any> {
  const response = await invokeCreatePengguna(payload)
  if (!response || response.success === false) {
    throw new Error(response?.message ?? 'Gagal menambahkan user')
  }

  return response.data ?? response.user ?? response
}

async function invokeChangePassword(payload: ChangePenggunaPasswordPayload): Promise<DatabaseResponse> {
  const db = getDatabaseBridge()
  if (db && typeof db.changePenggunaPassword === 'function') {
    return db.changePenggunaPassword(payload) as Promise<DatabaseResponse>
  }

  const ipc = getIpcRenderer()
  if (ipc && typeof ipc.invoke === 'function') {
    return ipc.invoke('db:changePenggunaPassword', payload) as Promise<DatabaseResponse>
  }

  throw new Error('Bridge Electron untuk changePenggunaPassword tidak tersedia')
}

export async function changePenggunaPassword(payload: ChangePenggunaPasswordPayload): Promise<any> {
  const response = await invokeChangePassword(payload)
  if (!response || response.success === false) {
    throw new Error(response?.message ?? 'Gagal memperbarui password')
  }

  return response.data ?? response.user ?? response
}

async function invokeLogoutPengguna(payload: LogoutPenggunaPayload): Promise<DatabaseResponse> {
  const db = getDatabaseBridge()
  if (db && typeof db.logoutPengguna === 'function') {
    return db.logoutPengguna(payload) as Promise<DatabaseResponse>
  }

  const ipc = getIpcRenderer()
  if (ipc && typeof ipc.invoke === 'function') {
    return ipc.invoke('db:logoutPengguna', payload) as Promise<DatabaseResponse>
  }

  throw new Error('Bridge Electron untuk logoutPengguna tidak tersedia')
}

export async function logoutPengguna(payload: LogoutPenggunaPayload): Promise<any> {
  const response = await invokeLogoutPengguna(payload)
  if (!response || response.success === false) {
    throw new Error(response?.message ?? 'Gagal logout user')
  }

  return response.data ?? response.user ?? response
}

async function invokeListPengguna(): Promise<DatabaseResponse> {
  const db = getDatabaseBridge()
  if (db && typeof db.listPengguna === 'function') {
    return db.listPengguna() as Promise<DatabaseResponse>
  }

  const ipc = getIpcRenderer()
  if (ipc && typeof ipc.invoke === 'function') {
    return ipc.invoke('db:listPengguna') as Promise<DatabaseResponse>
  }

  throw new Error('Bridge Electron untuk listPengguna tidak tersedia')
}

export async function listPengguna(): Promise<PenggunaRow[]> {
  const response = await invokeListPengguna()
  if (!response || response.success === false) {
    throw new Error(response?.message ?? 'Gagal memuat daftar pengguna')
  }

  return (response.rows ?? response.data ?? []) as PenggunaRow[]
}
