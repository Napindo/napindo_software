import { buildApiUrl, extractErrorMessage, isApiOk, pickApiData } from '../utils/api'
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
      throw new Error(extractErrorMessage(response?.message, 'Gagal mengimpor Excel'))
    }
    return (response?.data ?? response) as ImportResult
  }

  const ipc = getIpcRenderer()
  if (ipc?.invoke) {
    const response = await ipc.invoke('db:importGabungExcel', payload)
    if (response?.success === false) {
      throw new Error(extractErrorMessage(response?.message, 'Gagal mengimpor Excel'))
    }
    return (response?.data ?? response) as ImportResult
  }

  const res = await fetch(buildApiUrl('/gabung/import/excel'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const rawText = await res.text()
  let body: any = null
  if (rawText) {
    try {
      body = JSON.parse(rawText)
    } catch {
      body = null
    }
  }
  if (!isApiOk(body)) {
    throw new Error(extractErrorMessage(body?.message ?? rawText, 'Gagal mengimpor Excel'))
  }
  return pickApiData(body) as ImportResult
}

export async function exportImportTemplate(
  templateUrl: string,
): Promise<{ saved?: boolean; canceled?: boolean; filename?: string }> {
  const bridge = getDatabaseBridge()
  if (bridge && typeof bridge.exportImportTemplateSave === 'function') {
    const response = await bridge.exportImportTemplateSave()
    if (response?.success === false && !response?.canceled) {
      throw new Error(extractErrorMessage(response?.message, 'Gagal menyimpan template Excel'))
    }
    return {
      saved: Boolean(response?.success),
      canceled: Boolean(response?.canceled),
      filename: (response?.data as any)?.filename ?? (response as any)?.filename,
    }
  }

  const ipc = getIpcRenderer()
  if (ipc?.invoke) {
    const response = await ipc.invoke('db:import-template:export-save')
    if (response?.success === false && !response?.canceled) {
      throw new Error(extractErrorMessage(response?.message, 'Gagal menyimpan template Excel'))
    }
    return {
      saved: Boolean(response?.success),
      canceled: Boolean(response?.canceled),
      filename: response?.data?.filename ?? response?.filename,
    }
  }

  const anchor = document.createElement('a')
  anchor.href = templateUrl
  anchor.download = 'TEMPLATE SQL 1.xlsm'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()

  return { saved: true, filename: anchor.download }
}

export async function exportBusinessList(
  businessListUrl: string,
): Promise<{ saved?: boolean; canceled?: boolean; filename?: string }> {
  const bridge = getDatabaseBridge()
  if (bridge && typeof bridge.exportBusinessListSave === 'function') {
    const response = await bridge.exportBusinessListSave()
    if (response?.success === false && !response?.canceled) {
      throw new Error(extractErrorMessage(response?.message, 'Gagal menyimpan List Business'))
    }
    return {
      saved: Boolean(response?.success),
      canceled: Boolean(response?.canceled),
      filename: (response?.data as any)?.filename ?? (response as any)?.filename,
    }
  }

  const ipc = getIpcRenderer()
  if (ipc?.invoke) {
    const response = await ipc.invoke('db:business-list:export-save')
    if (response?.success === false && !response?.canceled) {
      throw new Error(extractErrorMessage(response?.message, 'Gagal menyimpan List Business'))
    }
    return {
      saved: Boolean(response?.success),
      canceled: Boolean(response?.canceled),
      filename: response?.data?.filename ?? response?.filename,
    }
  }

  const anchor = document.createElement('a')
  anchor.href = businessListUrl
  anchor.download = 'LIST_BUSINESS_ALL_SERIES.docx'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()

  return { saved: true, filename: anchor.download }
}
