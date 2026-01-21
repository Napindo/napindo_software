import { buildApiUrl, isApiOk, pickApiData } from "../utils/api"
import { getDatabaseBridge, getIpcRenderer } from "../utils/bridge"

export type AddDataPayload = Record<string, string | number | boolean | null | undefined>

export type DatabaseResponse<T = unknown> =
  | { success: true; data?: T; rows?: T[]; message?: string }
  | { success: false; message: string }

export type GabungListResult = {
  items: Record<string, unknown>[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}

/**
 * Panggil operasi saveAddData lewat window.database atau fallback ke ipcRenderer.invoke.
 */
async function invokeSaveAddData(payload: AddDataPayload): Promise<DatabaseResponse> {
  const db = getDatabaseBridge()
  if (db && typeof db.saveAddData === "function") {
    return db.saveAddData(payload) as Promise<DatabaseResponse>
  }

  const ipc = getIpcRenderer()
  if (ipc && typeof ipc.invoke === "function") {
    return ipc.invoke("db:saveAddData", payload) as Promise<DatabaseResponse>
  }

  throw new Error("Bridge Electron untuk saveAddData tidak tersedia")
}

/**
 * Panggil operasi updateAddData lewat window.database atau fallback ke ipcRenderer.invoke.
 */
async function invokeUpdateAddData(id: string | number, payload: AddDataPayload): Promise<DatabaseResponse> {
  const db = getDatabaseBridge()
  if (db && typeof db.updateAddData === "function") {
    return db.updateAddData(id, payload) as Promise<DatabaseResponse>
  }

  const ipc = getIpcRenderer()
  if (ipc && typeof ipc.invoke === "function") {
    return ipc.invoke("db:updateAddData", id, payload) as Promise<DatabaseResponse>
  }

  throw new Error("Bridge Electron untuk updateAddData tidak tersedia")
}

/**
 * Hapus data berdasarkan NOURUT (bisa lebih dari satu).
 */
async function invokeDeleteAddData(ids: Array<string | number>): Promise<DatabaseResponse> {
  const db = getDatabaseBridge()
  if (db && typeof db.deleteAddData === "function") {
    return db.deleteAddData(ids) as Promise<DatabaseResponse>
  }

  const ipc = getIpcRenderer()
  if (ipc && typeof ipc.invoke === "function") {
    return ipc.invoke("db:deleteAddData", ids) as Promise<DatabaseResponse>
  }

  throw new Error("Bridge Electron untuk deleteAddData tidak tersedia")
}

/**
 * Panggil operasi findCompany lewat window.database atau fallback ke ipcRenderer.invoke.
 */
async function invokeFindCompany(company: string): Promise<DatabaseResponse> {
  const trimmed = company.trim()
  const db = getDatabaseBridge()

  if (db && typeof db.findCompany === "function") {
    return db.findCompany(trimmed) as Promise<DatabaseResponse>
  }

  const ipc = getIpcRenderer()
  if (ipc && typeof ipc.invoke === "function") {
    return ipc.invoke("db:findCompany", trimmed) as Promise<DatabaseResponse>
  }

  throw new Error("Bridge Electron untuk findCompany tidak tersedia")
}


/**
 * Cari record perusahaan berdasarkan nama (COMPANY) di tabel GABUNG.
 * Mengembalikan array baris mentah dari database (sesuai yang dikirim API).
 */
export async function findCompanyRecords(company: string): Promise<any[]> {
  if (!company.trim()) return []

  const response = await invokeFindCompany(company)

  if (!response || response.success === false) {
    throw new Error(response?.message ?? "Gagal mengambil data perusahaan")
  }

  // Beberapa endpoint bisa pakai `rows` atau `data`
  return (response.rows ?? response.data ?? []) as any[]
}

export async function listGabungRecords(params?: {
  page?: number
  pageSize?: number
  q?: string
}): Promise<GabungListResult> {
  const db = getDatabaseBridge()
  if (db && typeof db.listGabung === "function") {
    const response = await db.listGabung(params)
    if (!response || response.success === false) {
      throw new Error(response?.message ?? "Gagal memuat data gabung")
    }
    const data: any = response.data ?? response
    const items = (data.items ?? data.rows ?? data ?? []) as Record<string, unknown>[]
    const pagination = data.pagination ?? {
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 200,
      total: items.length,
    }
    return { items, pagination }
  }

  const ipc = getIpcRenderer()
  if (ipc?.invoke) {
    const response = await ipc.invoke("db:listGabung", params)
    if (!response || response.success === false) {
      throw new Error(response?.message ?? "Gagal memuat data gabung")
    }
    const data: any = response.data ?? response
    const items = (data.items ?? data.rows ?? data ?? []) as Record<string, unknown>[]
    const pagination = data.pagination ?? {
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 200,
      total: items.length,
    }
    return { items, pagination }
  }

  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 200
  const search = params?.q?.trim()
  const searchParams = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  if (search) {
    searchParams.set("q", search)
  }

  const res = await fetch(buildApiUrl(`/gabung?${searchParams.toString()}`))
  const rawText = await res.text()
  let body: any = null
  if (rawText) {
    try {
      body = JSON.parse(rawText)
    } catch {
      body = null
    }
  }
  if (!res.ok || !isApiOk(body)) {
    const message =
      body?.message ??
      (rawText?.trim()
        ? `Gagal memuat data gabung: ${rawText.slice(0, 120)}`
        : "Gagal memuat data gabung")
    throw new Error(message)
  }
  const data: any = pickApiData(body) ?? {}
  const items = (data.items ?? data.rows ?? data ?? []) as Record<string, unknown>[]
  const pagination = data.pagination ?? body.pagination ?? {
    page,
    pageSize,
    total: items.length,
  }
  return { items, pagination }
}

export async function listSourceOptions(): Promise<string[]> {
  const db = getDatabaseBridge()
  if (db && typeof db.listSourceOptions === "function") {
    const response = await db.listSourceOptions()
    if (!response || response.success === false) {
      throw new Error(response?.message ?? "Gagal memuat source options")
    }
    const data: any = response.data ?? response
    return (data.options ?? data.rows ?? data ?? []) as string[]
  }

  const ipc = getIpcRenderer()
  if (ipc?.invoke) {
    const response = await ipc.invoke("db:listSourceOptions")
    if (!response || response.success === false) {
      throw new Error(response?.message ?? "Gagal memuat source options")
    }
    const data: any = response.data ?? response
    return (data.options ?? data.rows ?? data ?? []) as string[]
  }

  const res = await fetch(buildApiUrl("/gabung/source-options"))
  const rawText = await res.text()
  let body: any = null
  if (rawText) {
    try {
      body = JSON.parse(rawText)
    } catch {
      body = null
    }
  }
  if (!res.ok || !isApiOk(body)) {
    const message =
      body?.message ??
      (rawText?.trim()
        ? `Gagal memuat source options: ${rawText.slice(0, 120)}`
        : "Gagal memuat source options")
    throw new Error(message)
  }
  const data: any = pickApiData(body) ?? {}
  return (data.options ?? data.rows ?? data ?? []) as string[]
}

/**
 * Simpan data baru ke tabel GABUNG.
 * Payload adalah bentuk key–value yang sudah dibangun di layer UI.
 */
export async function saveAddData(payload: AddDataPayload): Promise<any> {
  const response = await invokeSaveAddData(payload)

  if (!response || response.success === false) {
    throw new Error(response?.message ?? "Gagal menyimpan data")
  }

  // API biasanya mengembalikan 1 objek tunggal sebagai `data`
  return response.data ?? response
}

/**
 * Update data yang sudah ada di tabel GABUNG.
 */
export async function updateAddData(id: string | number, payload: AddDataPayload): Promise<any> {
  const response = await invokeUpdateAddData(id, payload)

  if (!response || response.success === false) {
    throw new Error(response?.message ?? "Gagal memperbarui data")
  }

  return response.data ?? response
}

export async function deleteAddData(ids: Array<string | number>): Promise<any> {
  const response = await invokeDeleteAddData(ids)

  if (!response || response.success === false) {
    throw new Error(response?.message ?? "Gagal menghapus data")
  }

  return response.data ?? response
}


function parseFilename(contentDisposition: string | null, fallback: string) {
  if (!contentDisposition) return fallback
  const match = /filename="?([^"]+)"?/i.exec(contentDisposition)
  if (!match) return fallback
  return match[1] || fallback
}

export async function exportPersonalDatabasePdf(payload: Record<string, unknown>) {
  const db = getDatabaseBridge()
  if (db && typeof db.exportPersonalDatabasePdf === "function") {
    const response = await db.exportPersonalDatabasePdf(payload)
    if (!response || response.success === false) {
      throw new Error(response?.message ?? "Gagal mengunduh PDF")
    }
    const data = response.data ?? response
    const base64 = data?.base64 as string | undefined
    if (!base64) throw new Error("PDF tidak tersedia")
    const contentType = (data?.contentType as string) || "application/pdf"
    const filename = (data?.filename as string) || "database-personal.pdf"
    return { blob: base64ToBlob(base64, contentType), filename }
  }

  const ipc = getIpcRenderer()
  if (ipc && typeof ipc.invoke === "function") {
    const response = await ipc.invoke("db:personalDatabasePdf", payload)
    if (!response || response.success === false) {
      throw new Error(response?.message ?? "Gagal mengunduh PDF")
    }
    const data = response.data ?? response
    const base64 = data?.base64 as string | undefined
    if (!base64) throw new Error("PDF tidak tersedia")
    const contentType = (data?.contentType as string) || "application/pdf"
    const filename = (data?.filename as string) || "database-personal.pdf"
    return { blob: base64ToBlob(base64, contentType), filename }
  }

  const res = await fetch(buildApiUrl("/gabung/personal-pdf"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload ?? {}),
  })

  if (!res.ok) {
    const message = await res.text()
    throw new Error(message || "Gagal mengunduh PDF")
  }

  const blob = await res.blob()
  const filename = parseFilename(res.headers.get("content-disposition"), "database-personal.pdf")
  return { blob, filename }
}

function base64ToBlob(base64: string, contentType: string) {
  const binary = atob(base64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: contentType })
}
