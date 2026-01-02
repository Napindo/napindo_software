import { buildApiUrl } from "../utils/api"
import { getDatabaseBridge, getIpcRenderer } from "../utils/bridge"

export type AddDataPayload = Record<string, string | number | boolean | null | undefined>

export type DatabaseResponse<T = unknown> =
  | { success: true; data?: T; rows?: T[]; message?: string }
  | { success: false; message: string }

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
