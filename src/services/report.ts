import { arrayBufferToBase64, normalizeBase64 } from '../utils/base64'
import { buildApiUrl, isApiOk, pickApiData } from '../utils/api'
import { getDatabaseBridge, getIpcRenderer, unwrapBridgeResponse } from '../utils/bridge'
import { extractCount } from '../utils/reporting'


const fetchBinaryAsBase64 = async (
  path: string,
  filter: unknown,
  filename: string,
  fallbackType: string,
) => {
  const res = await fetch(buildApiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filter ?? {}),
  })
  if (!res.ok) {
    const message = await res.text()
    throw new Error(message || 'Gagal mengunduh file')
  }
  const buffer = await res.arrayBuffer()
  const base64 = arrayBufferToBase64(buffer)
  return {
    base64,
    contentType: res.headers.get('content-type') || fallbackType,
    filename,
  }
}

export type ReportResult = {
  data?: unknown
  total?: number
  totalCount?: number
  count?: number
  message?: string
}

async function invokeReport(channel: 'report:perusahaan' | 'report:government', filter: unknown): Promise<ReportResult> {
  const bridge = getDatabaseBridge()
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

  const ipc = getIpcRenderer()
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
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportPerusahaanExportSave === 'function') {
      const resp = await bridge.reportPerusahaanExportSave(filter)
      if (resp?.success === false && !resp?.canceled) {
        throw new Error(resp?.message || 'Gagal menyimpan file')
      }
      return { data: resp, total: payload?.total }
    }

    const ipc = getIpcRenderer()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:perusahaan:export-save', filter)
      if (response?.success === false && !response?.canceled) {
        throw new Error(response?.message ?? 'Gagal menyimpan file')
      }
      return { data: response, total: payload?.total }
    }

    const data = await fetchBinaryAsBase64(
      '/report/perusahaan/export/word',
      filter,
      'report-perusahaan.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    )
    return { data, total: payload?.total }
  }

  if (payload?.action === 'preview-word' || payload?.action === 'preview') {
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportPerusahaanWord === 'function') {
      const resp = await bridge.reportPerusahaanWord(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal memuat preview Word')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpcRenderer()
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
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportPerusahaanPdf === 'function') {
      const resp = await bridge.reportPerusahaanPdf(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal memuat preview PDF')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpcRenderer()
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
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportPerusahaanPdf === 'function') {
      const resp = await bridge.reportPerusahaanPdf(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal mencetak report')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpcRenderer()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:perusahaan:pdf', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal mencetak report')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const data = await fetchBinaryAsBase64(
      '/report/perusahaan/print',
      filter,
      'report-perusahaan.pdf',
      'application/pdf',
    )
    return { data, total: payload?.total }
  }

  if (payload?.action === 'export-excel') {
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportPerusahaanExcel === 'function') {
      const resp = await bridge.reportPerusahaanExcel(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal mencetak report (Excel)')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpcRenderer()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:perusahaan:excel', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal mencetak report (Excel)')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const data = await fetchBinaryAsBase64(
      '/report/perusahaan/export/excel',
      filter,
      'report-perusahaan.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    return { data, total: payload?.total }
  }

  if (payload?.action === 'export-word') {
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportPerusahaanWord === 'function') {
      const resp = await bridge.reportPerusahaanWord(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal mencetak report (Word)')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpcRenderer()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:perusahaan:word', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal mencetak report (Word)')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const data = await fetchBinaryAsBase64(
      '/report/perusahaan/export/word',
      filter,
      'report-perusahaan.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    )
    return { data, total: payload?.total }
  }

  return invokeReport('report:perusahaan', filter)
}

export async function requestReportGovernment(filter: unknown): Promise<ReportResult> {
  const payload: any = filter || {}

  if (payload?.action === 'export-save') {
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportGovernmentExportSave === 'function') {
      const resp = await bridge.reportGovernmentExportSave(filter)
      if (resp?.success === false && !resp?.canceled) {
        throw new Error(resp?.message || 'Gagal menyimpan file')
      }
      return { data: resp, total: payload?.total }
    }

    const ipc = getIpcRenderer()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:government:export-save', filter)
      if (response?.success === false && !response?.canceled) {
        throw new Error(response?.message ?? 'Gagal menyimpan file')
      }
      return { data: response, total: payload?.total }
    }

    const data = await fetchBinaryAsBase64(
      '/report/government/export/word',
      filter,
      'report-government.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    )
    return { data, total: payload?.total }
  }

  if (payload?.action === 'preview-word' || payload?.action === 'preview') {
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportGovernmentWord === 'function') {
      const resp = await bridge.reportGovernmentWord(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal memuat preview Word')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpcRenderer()
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
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportGovernmentPdf === 'function') {
      const resp = await bridge.reportGovernmentPdf(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal memuat preview PDF')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpcRenderer()
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
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportGovernmentPdf === 'function') {
      const resp = await bridge.reportGovernmentPdf(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal mencetak report')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpcRenderer()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:government:pdf', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal mencetak report')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const data = await fetchBinaryAsBase64(
      '/report/government/print',
      filter,
      'report-government.pdf',
      'application/pdf',
    )
    return { data, total: payload?.total }
  }

  if (payload?.action === 'export-excel') {
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportGovernmentExcel === 'function') {
      const resp = await bridge.reportGovernmentExcel(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal mencetak report (Excel)')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpcRenderer()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:government:excel', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal mencetak report (Excel)')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const data = await fetchBinaryAsBase64(
      '/report/government/export/excel',
      filter,
      'report-government.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    return { data, total: payload?.total }
  }

  if (payload?.action === 'export-word') {
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportGovernmentWord === 'function') {
      const resp = await bridge.reportGovernmentWord(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal mencetak report (Word)')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpcRenderer()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:government:word', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal mencetak report (Word)')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const data = await fetchBinaryAsBase64(
      '/report/government/export/word',
      filter,
      'report-government.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    )
    return { data, total: payload?.total }
  }

  return invokeReport('report:government', filter)
}

