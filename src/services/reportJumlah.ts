import { arrayBufferToBase64, normalizeBase64 } from '../utils/base64'
import { buildApiUrl, isApiOk, pickApiData } from '../utils/api'
import { getDatabaseBridge, getIpcRenderer, unwrapBridgeResponse } from '../utils/bridge'
import { extractCount } from '../utils/reporting'

export type ReportJumlahResult = {
  data?: unknown
  total?: number
  totalCount?: number
  count?: number
  message?: string
}

async function invokeReport(
  channel: 'report:jumlah-perusahaan' | 'report:jumlah-government',
  filter: unknown,
): Promise<ReportJumlahResult> {
  const bridge = getDatabaseBridge()
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

  const ipc = getIpcRenderer()
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
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportJumlahPerusahaanExportSave === 'function') {
      const resp = await bridge.reportJumlahPerusahaanExportSave(filter)
      if (resp?.success === false && !resp?.canceled) {
        throw new Error(resp?.message || 'Gagal menyimpan file')
      }
      return { data: resp, total: payload?.total }
    }

    const ipc = getIpcRenderer()
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
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportJumlahPerusahaanWord === 'function') {
      const resp = await bridge.reportJumlahPerusahaanWord(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal memuat preview Word')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpcRenderer()
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
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportJumlahPerusahaanPdf === 'function') {
      const resp = await bridge.reportJumlahPerusahaanPdf(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal memuat preview PDF')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpcRenderer()
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
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportJumlahPerusahaanPdf === 'function') {
      const resp = await bridge.reportJumlahPerusahaanPdf(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal mencetak report jumlah')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpcRenderer()
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
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportJumlahPerusahaanExcel === 'function') {
      const resp = await bridge.reportJumlahPerusahaanExcel(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal mencetak report jumlah (Excel)')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpcRenderer()
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
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportJumlahPerusahaanWord === 'function') {
      const resp = await bridge.reportJumlahPerusahaanWord(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal mencetak report jumlah (Word)')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpcRenderer()
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
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportJumlahGovernmentExportSave === 'function') {
      const resp = await bridge.reportJumlahGovernmentExportSave(filter)
      if (resp?.success === false && !resp?.canceled) {
        throw new Error(resp?.message || 'Gagal menyimpan file')
      }
      return { data: resp, total: payload?.total }
    }

    const ipc = getIpcRenderer()
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
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportJumlahGovernmentWord === 'function') {
      const resp = await bridge.reportJumlahGovernmentWord(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal memuat preview Word')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpcRenderer()
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
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportJumlahGovernmentPdf === 'function') {
      const resp = await bridge.reportJumlahGovernmentPdf(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal memuat preview PDF')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpcRenderer()
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
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportJumlahGovernmentPdf === 'function') {
      const resp = await bridge.reportJumlahGovernmentPdf(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal mencetak report jumlah')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpcRenderer()
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
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportJumlahGovernmentExcel === 'function') {
      const resp = await bridge.reportJumlahGovernmentExcel(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal mencetak report jumlah (Excel)')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpcRenderer()
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
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportJumlahGovernmentWord === 'function') {
      const resp = await bridge.reportJumlahGovernmentWord(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal mencetak report jumlah (Word)')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpcRenderer()
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

