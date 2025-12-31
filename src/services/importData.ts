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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api'
const buildApiUrl = (path: string) => `${API_BASE_URL.replace(/\/$/, '')}${API_PREFIX}${path}`

const getBridge = () => (window as any).database ?? null
const getIpc = () => (window as any).ipcRenderer ?? null

const pickApiData = (body: any) => body?.data ?? body?.items ?? body?.rows ?? body
const isApiOk = (body: any) => body?.ok === true || body?.success === true

export function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary)
}

export async function importGabungExcel(payload: ImportPayload): Promise<ImportResult> {
  const bridge = getBridge()
  if (bridge && typeof bridge.importGabungExcel === 'function') {
    const response = await bridge.importGabungExcel(payload)
    if (response?.success === false) {
      throw new Error(response?.message ?? 'Gagal mengimpor Excel')
    }
    return (response?.data ?? response) as ImportResult
  }

  const ipc = getIpc()
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
