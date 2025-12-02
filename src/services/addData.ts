export type AddDataPayload = Record<string, string | number | boolean | null | undefined>

export type DatabaseResponse<T = unknown> =
  | { success: true; data?: T; rows?: T[]; message?: string }
  | { success: false; message: string }

/**
 * Helper kecil untuk akses bridge Electron dengan aman.
 */
function getDatabaseBridge(): any {
  return (window as any).database ?? null
}

function getIpcRenderer(): any {
  return (window as any).ipcRenderer ?? null
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
