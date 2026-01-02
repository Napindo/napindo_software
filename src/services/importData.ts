import { buildApiUrl, isApiOk, pickApiData } from '../utils/api'
import { getDatabaseBridge, getIpcRenderer } from '../utils/bridge'

export type ImportPayload = {
  fileBase64: string
  fileName?: string
  sheetName?: string
  headerRow?: number
  chunkSize?: number
  maxRows?: number
  dryRun?: boolean
  currentUser?: string
}

export type ImportResult = {
  totalRows: number
  inserted: number
  skipped: number
  mappedHeaders?: string[]
  unknownHeaders?: string[]
  dryRun?: boolean
}

export async function importGabungExcel(payload: ImportPayload): Promise<ImportResult> {
  const bridge = getDatabaseBridge()
  if (bridge && typeof bridge.importGabungExcel === 'function') {
    const response = await bridge.importGabungExcel(payload)
    if (response?.success === false) {
      throw new Error(response?.message ?? 'Gagal mengimpor Excel')
    }
    return (response?.data ?? response) as ImportResult
  }

  const ipc = getIpcRenderer()
  if (ipc?.invoke) {
    const response = await ipc.invoke('db:importGabungExcel', payload)
    if (response?.success === false) {
      throw new Error(response?.message ?? 'Gagal mengimpor Excel')
    }
    return (response?.data ?? response) as ImportResult
  }

  const res = await fetch(buildApiUrl('/gabung/import/excel'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await res.json()
  if (!isApiOk(body)) {
    throw new Error(body?.message ?? 'Gagal mengimpor Excel')
  }
  return pickApiData(body) as ImportResult
}
