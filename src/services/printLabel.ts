import { arrayBufferToBase64, normalizeBase64 } from '../utils/base64'
import { buildApiUrl, isApiOk, pickApiData } from '../utils/api'
import { getDatabaseBridge, getIpcRenderer, unwrapBridgeResponse } from '../utils/bridge'
import { extractCount } from '../utils/reporting'

export type PrintLabelResult = {
  data?: unknown
  total?: number
  totalCount?: number
  count?: number
  message?: string
}

async function invokeReport(channel: 'report:labelvisitor' | 'report:labelgover', filter: unknown): Promise<PrintLabelResult> {
  const bridge = getDatabaseBridge()
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

  const ipc = getIpcRenderer()
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
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportLabelVisitorExportSave === 'function') {
      const resp = await bridge.reportLabelVisitorExportSave(filter)
      if (resp?.success === false && !resp?.canceled) {
        throw new Error(resp?.message || 'Gagal menyimpan file')
      }
      return { data: resp, total: payload?.total }
    }

    const ipc = getIpcRenderer()
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
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportLabelVisitorWord === 'function') {
      const resp = await bridge.reportLabelVisitorWord(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal memuat preview Word')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpcRenderer()
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
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportLabelVisitorPdf === 'function') {
      const resp = await bridge.reportLabelVisitorPdf(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal memuat preview PDF')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpcRenderer()
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
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportLabelVisitorPdf === 'function') {
      const resp = await bridge.reportLabelVisitorPdf(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal mencetak label')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpcRenderer()
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
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportLabelVisitorExcel === 'function') {
      const resp = await bridge.reportLabelVisitorExcel(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal mencetak label (Excel)')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpcRenderer()
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
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportLabelVisitorWord === 'function') {
      const resp = await bridge.reportLabelVisitorWord(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal mencetak label (Word)')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpcRenderer()
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
  const payload: any = filter || {}

  if (payload?.action === 'export-save') {
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportLabelGoverExportSave === 'function') {
      const resp = await bridge.reportLabelGoverExportSave(filter)
      if (resp?.success === false && !resp?.canceled) {
        throw new Error(resp?.message || 'Gagal menyimpan file')
      }
      return { data: resp, total: payload?.total }
    }

    const ipc = getIpcRenderer()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:labelgover:export-save', filter)
      if (response?.success === false && !response?.canceled) {
        throw new Error(response?.message ?? 'Gagal menyimpan file')
      }
      return { data: response, total: payload?.total }
    }

    throw new Error('Bridge Electron untuk ekspor belum tersedia')
  }

  if (payload?.action === 'preview-word' || payload?.action === 'preview') {
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportLabelGoverWord === 'function') {
      const resp = await bridge.reportLabelGoverWord(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal memuat preview Word')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpcRenderer()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:labelgover:word', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal memuat preview Word')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const res = await fetch(buildApiUrl('/report/labelgover/export/word'), {
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
        filename: 'print-label-government.docx',
      },
      total: payload?.total,
    }
  }

  if (payload?.action === 'preview-pdf') {
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportLabelGoverPdf === 'function') {
      const resp = await bridge.reportLabelGoverPdf(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal memuat preview PDF')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpcRenderer()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:labelgover:pdf', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal memuat preview PDF')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const res = await fetch(buildApiUrl('/report/labelgover/print'), {
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
        filename: 'print-label-government.pdf',
      },
      total: payload?.total,
    }
  }

  if (payload?.action === 'export' || payload?.action === 'export-pdf') {
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportLabelGoverPdf === 'function') {
      const resp = await bridge.reportLabelGoverPdf(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal mencetak label')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpcRenderer()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:labelgover:pdf', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal mencetak label')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    throw new Error('Bridge Electron untuk cetak label tidak tersedia')
  }

  if (payload?.action === 'export-excel') {
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportLabelGoverExcel === 'function') {
      const resp = await bridge.reportLabelGoverExcel(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal mencetak label (Excel)')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpcRenderer()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:labelgover:excel', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal mencetak label (Excel)')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    throw new Error('Bridge Electron untuk cetak label (Excel) tidak tersedia')
  }

  if (payload?.action === 'export-word') {
    const bridge = getDatabaseBridge()
    if (bridge && typeof bridge.reportLabelGoverWord === 'function') {
      const resp = await bridge.reportLabelGoverWord(filter)
      if (resp?.success === false) throw new Error(resp?.message ?? 'Gagal mencetak label (Word)')
      const data = unwrapBridgeResponse(resp)
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    const ipc = getIpcRenderer()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:labelgover:word', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal mencetak label (Word)')
      const data = response?.data ?? response
      const base64 = normalizeBase64(data?.base64 ?? data?.buffer)
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    throw new Error('Bridge Electron untuk cetak label (Word) tidak tersedia')
  }

  return invokeReport('report:labelgover', filter)
}

export async function requestLabelOptions(): Promise<any> {
  const isOptionsPayload = (value: unknown) =>
    value &&
    typeof value === 'object' &&
    ('code2' in (value as any) ||
      'code3' in (value as any) ||
      'source' in (value as any) ||
      'forum' in (value as any) ||
      'exhthn' in (value as any) ||
      'updatedBy' in (value as any))

  try {
    const res = await fetch(buildApiUrl('/report/label/options'))
    const body = await res.json()
    if (isApiOk(body)) {
      const data = pickApiData(body) ?? (body as any)?.data ?? body
      if (isOptionsPayload(data)) {
        return data
      }
    }
  } catch {
    // fall back to bridge/ipc
  }

  const bridge = getDatabaseBridge()
  if (bridge && typeof bridge.reportLabelOptions === 'function') {
    const resp = await bridge.reportLabelOptions()
    const data = resp?.data ?? resp
    if (isOptionsPayload(data)) {
      return data
    }
  }

  const ipc = getIpcRenderer()
  if (ipc?.invoke) {
    const response = await ipc.invoke('report:labeloptions')
    if (response?.success === false) {
      throw new Error(response?.message ?? 'Gagal memuat opsi label')
    }
    const data = response?.data ?? response
    if (isOptionsPayload(data)) {
      return data
    }
  }

  throw new Error('Gagal memuat opsi label')
}

