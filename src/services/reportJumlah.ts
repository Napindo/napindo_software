export type ReportJumlahResult = {
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

async function invokeReport(
  channel: 'report:jumlah-perusahaan' | 'report:jumlah-government',
  filter: unknown,
): Promise<ReportJumlahResult> {
  const bridge = getBridge()
  if (bridge) {
    const fnName = channel === 'report:jumlah-perusahaan' ? 'reportJumlahPerusahaan' : 'reportJumlahGovernment'
    if (typeof bridge[fnName] === 'function') {
      const response = await bridge[fnName](filter)
      if (response?.success === false) {
        throw new Error(response?.message ?? 'Gagal memuat report jumlah')
      }
      const data = unwrapBridgeResponse(response)
      return { data, total: extractCount(data) }
    }
  }

  const ipc = getIpc()
  if (ipc?.invoke) {
    const response = await ipc.invoke(channel, filter)
    if (response?.success === false) {
      throw new Error(response?.message ?? 'Gagal memuat report jumlah')
    }
    const data = response?.data ?? response
    return { data, total: extractCount(data) }
  }

  const path = channel === 'report:jumlah-perusahaan' ? '/report/jumlah/perusahaan' : '/report/jumlah/government'
  const res = await fetch(buildApiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filter ?? {}),
  })
  const body = await res.json()
  if (!isApiOk(body)) {
    throw new Error(body?.message ?? 'Gagal memuat report jumlah')
  }
  const data = pickApiData(body)
  return { data, total: extractCount(data) }
}

export async function requestReportJumlahPerusahaan(filter: unknown): Promise<ReportJumlahResult> {
  const payload: any = filter || {}

  if (payload?.action === 'export-save') {
    const bridge = getBridge()
    if (bridge && typeof bridge.reportJumlahPerusahaanExportSave === 'function') {
      const resp = await bridge.reportJumlahPerusahaanExportSave(filter)
      if (resp?.success === false && !resp?.canceled) {
        throw new Error(resp?.message || 'Gagal menyimpan file')
      }
      return { data: resp, total: payload?.total }
    }

    const ipc = getIpc()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:jumlah-perusahaan:export-save', filter)
      if (response?.success === false && !response?.canceled) {
        throw new Error(response?.message ?? 'Gagal menyimpan file')
      }
      return { data: response, total: payload?.total }
    }

    throw new Error('Bridge Electron untuk ekspor belum tersedia')
  }

  if (payload?.action === 'preview-word' || payload?.action === 'preview') {
    const bridge = getBridge()
    if (bridge && typeof bridge.reportJumlahPerusahaanWord === 'function') {
      const resp = await bridge.reportJumlahPerusahaanWord(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal memuat preview Word')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpc()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:jumlah-perusahaan:word', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal memuat preview Word')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const res = await fetch(buildApiUrl('/report/jumlah/perusahaan/export/word'), {
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
        filename: 'report-jumlah-perusahaan.docx',
      },
      total: payload?.total,
    }
  }

  if (payload?.action === 'preview-pdf') {
    const bridge = getBridge()
    if (bridge && typeof bridge.reportJumlahPerusahaanPdf === 'function') {
      const resp = await bridge.reportJumlahPerusahaanPdf(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal memuat preview PDF')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpc()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:jumlah-perusahaan:pdf', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal memuat preview PDF')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const res = await fetch(buildApiUrl('/report/jumlah/perusahaan/print'), {
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
        filename: 'report-jumlah-perusahaan.pdf',
      },
      total: payload?.total,
    }
  }

  if (payload?.action === 'export' || payload?.action === 'export-pdf') {
    const bridge = getBridge()
    if (bridge && typeof bridge.reportJumlahPerusahaanPdf === 'function') {
      const resp = await bridge.reportJumlahPerusahaanPdf(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal mencetak report jumlah')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpc()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:jumlah-perusahaan:pdf', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal mencetak report jumlah')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    throw new Error('Bridge Electron untuk cetak report jumlah tidak tersedia')
  }

  if (payload?.action === 'export-excel') {
    const bridge = getBridge()
    if (bridge && typeof bridge.reportJumlahPerusahaanExcel === 'function') {
      const resp = await bridge.reportJumlahPerusahaanExcel(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal mencetak report jumlah (Excel)')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpc()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:jumlah-perusahaan:excel', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal mencetak report jumlah (Excel)')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    throw new Error('Bridge Electron untuk cetak report jumlah (Excel) tidak tersedia')
  }

  if (payload?.action === 'export-word') {
    const bridge = getBridge()
    if (bridge && typeof bridge.reportJumlahPerusahaanWord === 'function') {
      const resp = await bridge.reportJumlahPerusahaanWord(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal mencetak report jumlah (Word)')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpc()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:jumlah-perusahaan:word', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal mencetak report jumlah (Word)')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    throw new Error('Bridge Electron untuk cetak report jumlah (Word) tidak tersedia')
  }

  return invokeReport('report:jumlah-perusahaan', filter)
}

export async function requestReportJumlahGovernment(filter: unknown): Promise<ReportJumlahResult> {
  const payload: any = filter || {}

  if (payload?.action === 'export-save') {
    const bridge = getBridge()
    if (bridge && typeof bridge.reportJumlahGovernmentExportSave === 'function') {
      const resp = await bridge.reportJumlahGovernmentExportSave(filter)
      if (resp?.success === false && !resp?.canceled) {
        throw new Error(resp?.message || 'Gagal menyimpan file')
      }
      return { data: resp, total: payload?.total }
    }

    const ipc = getIpc()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:jumlah-government:export-save', filter)
      if (response?.success === false && !response?.canceled) {
        throw new Error(response?.message ?? 'Gagal menyimpan file')
      }
      return { data: response, total: payload?.total }
    }

    throw new Error('Bridge Electron untuk ekspor belum tersedia')
  }

  if (payload?.action === 'preview-word' || payload?.action === 'preview') {
    const bridge = getBridge()
    if (bridge && typeof bridge.reportJumlahGovernmentWord === 'function') {
      const resp = await bridge.reportJumlahGovernmentWord(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal memuat preview Word')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpc()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:jumlah-government:word', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal memuat preview Word')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const res = await fetch(buildApiUrl('/report/jumlah/government/export/word'), {
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
        filename: 'report-jumlah-government.docx',
      },
      total: payload?.total,
    }
  }

  if (payload?.action === 'preview-pdf') {
    const bridge = getBridge()
    if (bridge && typeof bridge.reportJumlahGovernmentPdf === 'function') {
      const resp = await bridge.reportJumlahGovernmentPdf(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal memuat preview PDF')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpc()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:jumlah-government:pdf', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal memuat preview PDF')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const res = await fetch(buildApiUrl('/report/jumlah/government/print'), {
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
        filename: 'report-jumlah-government.pdf',
      },
      total: payload?.total,
    }
  }

  if (payload?.action === 'export' || payload?.action === 'export-pdf') {
    const bridge = getBridge()
    if (bridge && typeof bridge.reportJumlahGovernmentPdf === 'function') {
      const resp = await bridge.reportJumlahGovernmentPdf(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal mencetak report jumlah')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpc()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:jumlah-government:pdf', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal mencetak report jumlah')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    throw new Error('Bridge Electron untuk cetak report jumlah tidak tersedia')
  }

  if (payload?.action === 'export-excel') {
    const bridge = getBridge()
    if (bridge && typeof bridge.reportJumlahGovernmentExcel === 'function') {
      const resp = await bridge.reportJumlahGovernmentExcel(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal mencetak report jumlah (Excel)')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpc()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:jumlah-government:excel', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal mencetak report jumlah (Excel)')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    throw new Error('Bridge Electron untuk cetak report jumlah (Excel) tidak tersedia')
  }

  if (payload?.action === 'export-word') {
    const bridge = getBridge()
    if (bridge && typeof bridge.reportJumlahGovernmentWord === 'function') {
      const resp = await bridge.reportJumlahGovernmentWord(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal mencetak report jumlah (Word)')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpc()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:jumlah-government:word', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal mencetak report jumlah (Word)')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    throw new Error('Bridge Electron untuk cetak report jumlah (Word) tidak tersedia')
  }

  return invokeReport('report:jumlah-government', filter)
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary)
}
