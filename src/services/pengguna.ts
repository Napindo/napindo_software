import { getDatabaseBridge, getIpcRenderer } from '../utils/bridge'
import { requestJson } from '../api/client'
import { endpoints } from '../api/endpoints'

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

type ApiResponse<T> = {
  ok: boolean
  data: T
  message: string
}

export type DatabaseResponse<T = unknown> =
  | { success: true; data?: T; rows?: T[]; user?: T; message?: string }
  | { success: false; message: string }

const toPenggunaRows = (value: unknown): PenggunaRow[] => {
  if (Array.isArray(value)) return value as PenggunaRow[]
  const items = (value as { items?: unknown })?.items
  if (Array.isArray(items)) return items as PenggunaRow[]
  return []
}

async function invokeCreatePengguna(payload: CreatePenggunaPayload): Promise<DatabaseResponse> {
  const db = getDatabaseBridge()
  if (db && typeof db.createPengguna === 'function') {
    return db.createPengguna(payload) as Promise<DatabaseResponse>
  }

  const ipc = getIpcRenderer()
  if (ipc && typeof ipc.invoke === 'function') {
    return ipc.invoke('db:createPengguna', payload) as Promise<DatabaseResponse>
  }

  const response = await requestJson<ApiResponse<any>>(endpoints.pengguna.create, {
    method: 'POST',
    json: payload,
  })

  if (!response.ok) {
    return { success: false, message: response.message }
  }

  return { success: true, data: response.data, message: response.message }
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

  const response = await requestJson<ApiResponse<any>>(endpoints.pengguna.changePassword, {
    method: 'POST',
    json: payload,
  })

  if (!response.ok) {
    return { success: false, message: response.message }
  }

  return { success: true, data: response.data, message: response.message }
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

  const response = await requestJson<ApiResponse<any>>(endpoints.pengguna.logout, {
    method: 'POST',
    json: payload,
  })

  if (!response.ok) {
    return { success: false, message: response.message }
  }

  return { success: true, data: response.data, message: response.message }
}

export async function logoutPengguna(payload: LogoutPenggunaPayload): Promise<any> {
  const response = await invokeLogoutPengguna(payload)
  if (!response || response.success === false) {
    throw new Error(response?.message ?? 'Gagal logout user')
  }

  return response.data ?? response.user ?? response
}

async function invokeListPengguna(params?: { q?: string; page?: number; pageSize?: number }): Promise<DatabaseResponse> {
  const db = getDatabaseBridge()
  if (db && typeof db.listPengguna === 'function') {
    return db.listPengguna(params) as Promise<DatabaseResponse>
  }

  const ipc = getIpcRenderer()
  if (ipc && typeof ipc.invoke === 'function') {
    return ipc.invoke('db:listPengguna', params) as Promise<DatabaseResponse>
  }

  const search = new URLSearchParams();
  if (params?.q) search.set('q', params.q);
  if (params?.page) search.set('page', String(params.page));
  if (params?.pageSize) search.set('pageSize', String(params.pageSize));
  const query = search.toString();
  const path = query ? `${endpoints.pengguna.list}?${query}` : endpoints.pengguna.list;

  const response = await requestJson<ApiResponse<any>>(path, {
    method: 'GET',
  })

  if (!response.ok) {
    return { success: false, message: response.message }
  }

  const items = response.data?.items ?? response.data ?? [];
  return { success: true, data: items, rows: items, message: response.message }
}

export async function listPengguna(params?: { q?: string; page?: number; pageSize?: number }): Promise<PenggunaRow[]> {
  const response = await invokeListPengguna(params)
  if (!response || response.success === false) {
    throw new Error(response?.message ?? 'Gagal memuat daftar pengguna')
  }

  return toPenggunaRows(response.rows ?? response.data)
}
