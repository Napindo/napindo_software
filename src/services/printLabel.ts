export type PrintLabelResult = {
  data?: unknown
  total?: number
  totalCount?: number
  count?: number
  message?: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api'
const buildApiUrl = (path: string) => `${API_BASE_URL.replace(/\/$/, '')}${API_PREFIX}${path}`

const getBridge = () => (window as any).database ?? null
const getIpc = () => (window as any).ipcRenderer ?? null

const extractCount = (payload: any): number => {
  if (!payload) return 0
  if (typeof payload === 'number') return payload
  if (typeof payload.total === 'number') return payload.total
  if (typeof payload.totalCount === 'number') return payload.totalCount
  if (typeof payload.count === 'number') return payload.count
  if (Array.isArray(payload)) return payload.length
  return 0
}

const pickApiData = (body: any) => body?.data ?? body?.items ?? body?.rows ?? body
const isApiOk = (body: any) => body?.ok === true || body?.success === true
const unwrapBridgeResponse = (payload: any) => (payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload)
const toBase64 = (bytes: Uint8Array) => {
  let binary = ''
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary)
}

const normalizeBase64 = (value: unknown): string | undefined => {
  if (!value) return undefined
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed ? trimmed : undefined
  }
  const bufferLike = value as any
  if (bufferLike?.type === 'Buffer' && Array.isArray(bufferLike.data)) {
    return toBase64(new Uint8Array(bufferLike.data))
  }
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) {
    return value.toString('base64')
  }
  if (value instanceof ArrayBuffer) return arrayBufferToBase64(value)
  if (ArrayBuffer.isView(value) && value.buffer) return arrayBufferToBase64(value.buffer)
  return undefined
}

async function invokeReport(channel: 'report:labelvisitor' | 'report:labelgover', filter: unknown): Promise<PrintLabelResult> {
  const bridge = getBridge()
  if (bridge) {
    const fnName = channel === 'report:labelvisitor' ? 'reportLabelVisitor' : 'reportLabelGover'
    if (typeof bridge[fnName] === 'function') {
      const response = await bridge[fnName](filter)
      if (response?.success === false) {
        throw new Error(response?.message ?? 'Gagal memuat laporan')
      }
      const data = unwrapBridgeResponse(response)
      return { data, total: extractCount(data) }
    }
  }

  const ipc = getIpc()
  if (ipc?.invoke) {
    const response = await ipc.invoke(channel, filter)
    if (response?.success === false) {
      throw new Error(response?.message ?? 'Gagal memuat laporan')
    }
    const data = response?.data ?? response
    return { data, total: extractCount(data) }
  }

  const path = channel === 'report:labelvisitor' ? '/report/labelvisitor' : '/report/labelgover'
  const res = await fetch(buildApiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filter ?? {}),
  })
  const body = await res.json()
  if (!isApiOk(body)) {
    throw new Error(body?.message ?? 'Gagal memuat laporan')
  }
  const data = pickApiData(body)
  return { data, total: extractCount(data) }
}

export async function requestLabelPerusahaan(filter: unknown): Promise<PrintLabelResult> {
  const payload: any = filter || {}

  // Export via save dialog (let user choose PDF/Excel/Word by extension)
  if (payload?.action === 'export-save') {
    const bridge = getBridge()
    if (bridge && typeof bridge.reportLabelVisitorExportSave === 'function') {
      const resp = await bridge.reportLabelVisitorExportSave(filter)
      if (resp?.success === false && !resp?.canceled) {
        throw new Error(resp?.message || 'Gagal menyimpan file')
      }
      return { data: resp, total: payload?.total }
    }

    const ipc = getIpc()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:labelvisitor:export-save', filter)
      if (response?.success === false && !response?.canceled) {
        throw new Error(response?.message ?? 'Gagal menyimpan file')
      }
      return { data: response, total: payload?.total }
    }

    throw new Error('Bridge Electron untuk ekspor belum tersedia')
  }

  // Preview Word (base64 docx, no save dialog)
  if (payload?.action === 'preview-word' || payload?.action === 'preview') {
    const bridge = getBridge()
    if (bridge && typeof bridge.reportLabelVisitorWord === 'function') {
      const resp = await bridge.reportLabelVisitorWord(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal memuat preview Word')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpc()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:labelvisitor:word', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal memuat preview Word')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const res = await fetch(buildApiUrl('/report/labelvisitor/export/word'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filter ?? {}),
    })
    if (!res.ok) {
      const message = await res.text()
      throw new Error(message || 'Gagal memuat preview Word')
    }
    const buffer = await res.arrayBuffer()
    const base64 = arrayBufferToBase64(buffer)
    return {
      data: {
        base64,
        contentType:
          res.headers.get('content-type') ||
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        filename: 'print-label-perusahaan.docx',
      },
      total: payload?.total,
    }
  }

  // Preview PDF (base64 only, no save dialog) – dipakai sebagai fallback pratinjau yang bisa dirender browser.
  if (payload?.action === 'preview-pdf') {
    const bridge = getBridge()
    if (bridge && typeof bridge.reportLabelVisitorPdf === 'function') {
      const resp = await bridge.reportLabelVisitorPdf(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal memuat preview PDF')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpc()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:labelvisitor:pdf', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal memuat preview PDF')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const res = await fetch(buildApiUrl('/report/labelvisitor/print'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filter ?? {}),
    })
    if (!res.ok) {
      const message = await res.text()
      throw new Error(message || 'Gagal memuat preview PDF')
    }
    const buffer = await res.arrayBuffer()
    const base64 = arrayBufferToBase64(buffer)
    return {
      data: {
        base64,
        contentType: res.headers.get('content-type') || 'application/pdf',
        filename: 'print-label-perusahaan.pdf',
      },
      total: payload?.total,
    }

    throw new Error('Bridge Electron untuk preview PDF tidak tersedia')
  }

  // Export PDF
  if (payload?.action === 'export' || payload?.action === 'export-pdf') {
    const bridge = getBridge()
    if (bridge && typeof bridge.reportLabelVisitorPdf === 'function') {
      const resp = await bridge.reportLabelVisitorPdf(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal mencetak label')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpc()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:labelvisitor:pdf', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal mencetak label')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    throw new Error('Bridge Electron untuk cetak label tidak tersedia')
  }

  // Export Excel
  if (payload?.action === 'export-excel') {
    const bridge = getBridge()
    if (bridge && typeof bridge.reportLabelVisitorExcel === 'function') {
      const resp = await bridge.reportLabelVisitorExcel(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal mencetak label (Excel)')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpc()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:labelvisitor:excel', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal mencetak label (Excel)')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    throw new Error('Bridge Electron untuk cetak label (Excel) tidak tersedia')
  }

  // Export Word
  if (payload?.action === 'export-word') {
    const bridge = getBridge()
    if (bridge && typeof bridge.reportLabelVisitorWord === 'function') {
      const resp = await bridge.reportLabelVisitorWord(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal mencetak label (Word)')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpc()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:labelvisitor:word', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal mencetak label (Word)')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    throw new Error('Bridge Electron untuk cetak label (Word) tidak tersedia')
  }

  return invokeReport('report:labelvisitor', filter)
}

export async function requestLabelGovernment(filter: unknown): Promise<PrintLabelResult> {
  return invokeReport('report:labelgover', filter)
}

export async function requestLabelOptions(): Promise<any> {
  const bridge = getBridge()
  if (bridge && typeof bridge.reportLabelOptions === 'function') {
    const resp = await bridge.reportLabelOptions()
    return resp?.data ?? resp
  }

  const ipc = getIpc()
  if (ipc?.invoke) {
    const response = await ipc.invoke('report:labeloptions')
    if (response?.success === false) {
      throw new Error(response?.message ?? 'Gagal memuat opsi label')
    }
    return response?.data ?? response
  }

  throw new Error('Bridge Electron untuk opsi label tidak tersedia')
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary)
}
