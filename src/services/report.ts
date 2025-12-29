export type ReportResult = {
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

async function invokeReport(channel: 'report:perusahaan' | 'report:government', filter: unknown): Promise<ReportResult> {
  const bridge = getBridge()
  if (bridge) {
    const fnName = channel === 'report:perusahaan' ? 'reportPerusahaan' : 'reportGovernment'
    if (typeof bridge[fnName] === 'function') {
      const response = await bridge[fnName](filter)
      if (response?.success === false) {
        throw new Error(response?.message ?? 'Gagal memuat report')
      }
      const data = unwrapBridgeResponse(response)
      return { data, total: extractCount(data) }
    }
  }

  const ipc = getIpc()
  if (ipc?.invoke) {
    const response = await ipc.invoke(channel, filter)
    if (response?.success === false) {
      throw new Error(response?.message ?? 'Gagal memuat report')
    }
    const data = response?.data ?? response
    return { data, total: extractCount(data) }
  }

  const path = channel === 'report:perusahaan' ? '/report/perusahaan' : '/report/government'
  const res = await fetch(buildApiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filter ?? {}),
  })
  const body = await res.json()
  if (!isApiOk(body)) {
    throw new Error(body?.message ?? 'Gagal memuat report')
  }
  const data = pickApiData(body)
  return { data, total: extractCount(data) }
}

export async function requestReportPerusahaan(filter: unknown): Promise<ReportResult> {
  const payload: any = filter || {}

  if (payload?.action === 'export-save') {
    const bridge = getBridge()
    if (bridge && typeof bridge.reportPerusahaanExportSave === 'function') {
      const resp = await bridge.reportPerusahaanExportSave(filter)
      if (resp?.success === false && !resp?.canceled) {
        throw new Error(resp?.message || 'Gagal menyimpan file')
      }
      return { data: resp, total: payload?.total }
    }

    const ipc = getIpc()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:perusahaan:export-save', filter)
      if (response?.success === false && !response?.canceled) {
        throw new Error(response?.message ?? 'Gagal menyimpan file')
      }
      return { data: response, total: payload?.total }
    }

    throw new Error('Bridge Electron untuk ekspor belum tersedia')
  }

  if (payload?.action === 'preview-word' || payload?.action === 'preview') {
    const bridge = getBridge()
    if (bridge && typeof bridge.reportPerusahaanWord === 'function') {
      const resp = await bridge.reportPerusahaanWord(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal memuat preview Word')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpc()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:perusahaan:word', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal memuat preview Word')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const res = await fetch(buildApiUrl('/report/perusahaan/export/word'), {
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
        filename: 'report-perusahaan.docx',
      },
      total: payload?.total,
    }
  }

  if (payload?.action === 'preview-pdf') {
    const bridge = getBridge()
    if (bridge && typeof bridge.reportPerusahaanPdf === 'function') {
      const resp = await bridge.reportPerusahaanPdf(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal memuat preview PDF')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpc()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:perusahaan:pdf', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal memuat preview PDF')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const res = await fetch(buildApiUrl('/report/perusahaan/print'), {
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
        filename: 'report-perusahaan.pdf',
      },
      total: payload?.total,
    }
  }

  if (payload?.action === 'export' || payload?.action === 'export-pdf') {
    const bridge = getBridge()
    if (bridge && typeof bridge.reportPerusahaanPdf === 'function') {
      const resp = await bridge.reportPerusahaanPdf(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal mencetak report')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpc()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:perusahaan:pdf', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal mencetak report')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    throw new Error('Bridge Electron untuk cetak report tidak tersedia')
  }

  if (payload?.action === 'export-excel') {
    const bridge = getBridge()
    if (bridge && typeof bridge.reportPerusahaanExcel === 'function') {
      const resp = await bridge.reportPerusahaanExcel(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal mencetak report (Excel)')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpc()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:perusahaan:excel', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal mencetak report (Excel)')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    throw new Error('Bridge Electron untuk cetak report (Excel) tidak tersedia')
  }

  if (payload?.action === 'export-word') {
    const bridge = getBridge()
    if (bridge && typeof bridge.reportPerusahaanWord === 'function') {
      const resp = await bridge.reportPerusahaanWord(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal mencetak report (Word)')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpc()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:perusahaan:word', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal mencetak report (Word)')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    throw new Error('Bridge Electron untuk cetak report (Word) tidak tersedia')
  }

  return invokeReport('report:perusahaan', filter)
}

export async function requestReportGovernment(filter: unknown): Promise<ReportResult> {
  const payload: any = filter || {}

  if (payload?.action === 'export-save') {
    const bridge = getBridge()
    if (bridge && typeof bridge.reportGovernmentExportSave === 'function') {
      const resp = await bridge.reportGovernmentExportSave(filter)
      if (resp?.success === false && !resp?.canceled) {
        throw new Error(resp?.message || 'Gagal menyimpan file')
      }
      return { data: resp, total: payload?.total }
    }

    const ipc = getIpc()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:government:export-save', filter)
      if (response?.success === false && !response?.canceled) {
        throw new Error(response?.message ?? 'Gagal menyimpan file')
      }
      return { data: response, total: payload?.total }
    }

    throw new Error('Bridge Electron untuk ekspor belum tersedia')
  }

  if (payload?.action === 'preview-word' || payload?.action === 'preview') {
    const bridge = getBridge()
    if (bridge && typeof bridge.reportGovernmentWord === 'function') {
      const resp = await bridge.reportGovernmentWord(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal memuat preview Word')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpc()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:government:word', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal memuat preview Word')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const res = await fetch(buildApiUrl('/report/government/export/word'), {
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
        filename: 'report-government.docx',
      },
      total: payload?.total,
    }
  }

  if (payload?.action === 'preview-pdf') {
    const bridge = getBridge()
    if (bridge && typeof bridge.reportGovernmentPdf === 'function') {
      const resp = await bridge.reportGovernmentPdf(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal memuat preview PDF')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpc()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:government:pdf', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal memuat preview PDF')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const res = await fetch(buildApiUrl('/report/government/print'), {
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
        filename: 'report-government.pdf',
      },
      total: payload?.total,
    }
  }

  if (payload?.action === 'export' || payload?.action === 'export-pdf') {
    const bridge = getBridge()
    if (bridge && typeof bridge.reportGovernmentPdf === 'function') {
      const resp = await bridge.reportGovernmentPdf(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal mencetak report')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpc()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:government:pdf', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal mencetak report')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    throw new Error('Bridge Electron untuk cetak report tidak tersedia')
  }

  if (payload?.action === 'export-excel') {
    const bridge = getBridge()
    if (bridge && typeof bridge.reportGovernmentExcel === 'function') {
      const resp = await bridge.reportGovernmentExcel(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal mencetak report (Excel)')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpc()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:government:excel', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal mencetak report (Excel)')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    throw new Error('Bridge Electron untuk cetak report (Excel) tidak tersedia')
  }

  if (payload?.action === 'export-word') {
    const bridge = getBridge()
    if (bridge && typeof bridge.reportGovernmentWord === 'function') {
      const resp = await bridge.reportGovernmentWord(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal mencetak report (Word)')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpc()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:government:word', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal mencetak report (Word)')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    throw new Error('Bridge Electron untuk cetak report (Word) tidak tersedia')
  }

  return invokeReport('report:government', filter)
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary)
}
