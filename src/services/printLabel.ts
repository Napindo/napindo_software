export type PrintLabelResult = {
  data?: unknown
  total?: number
  totalCount?: number
  count?: number
  message?: string
}

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

async function invokeReport(channel: 'report:labelvisitor' | 'report:labelgover', filter: unknown): Promise<PrintLabelResult> {
  const bridge = getBridge()
  if (bridge) {
    const fnName = channel === 'report:labelvisitor' ? 'reportLabelVisitor' : 'reportLabelGover'
    if (typeof bridge[fnName] === 'function') {
      const data = await bridge[fnName](filter)
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

  throw new Error('Bridge Electron untuk report label tidak tersedia')
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

  // Preview PDF (base64 only, no save dialog)
  if (payload?.action === 'preview-pdf') {
    const bridge = getBridge()
    if (bridge && typeof bridge.reportLabelVisitorPdf === 'function') {
      const resp = await bridge.reportLabelVisitorPdf(filter)
      const base64: string | undefined = resp?.base64 || resp?.buffer
      return { data: { base64, contentType: resp?.contentType, filename: resp?.filename }, total: payload?.total }
    }

    const ipc = getIpc()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:labelvisitor:pdf', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal memuat preview PDF')
      const data = response?.data ?? response
      const base64: string | undefined = data?.base64 || data?.buffer
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    throw new Error('Bridge Electron untuk preview PDF tidak tersedia')
  }

  // Export PDF
  if (payload?.action === 'export' || payload?.action === 'export-pdf') {
    const bridge = getBridge()
    if (bridge && typeof bridge.reportLabelVisitorPdf === 'function') {
      const resp = await bridge.reportLabelVisitorPdf(filter)
      const base64: string | undefined = resp?.base64 || resp?.buffer
      return { data: { base64, contentType: resp?.contentType, filename: resp?.filename }, total: payload?.total }
    }

    const ipc = getIpc()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:labelvisitor:pdf', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal mencetak label')
      const data = response?.data ?? response
      const base64: string | undefined = data?.base64 || data?.buffer
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    throw new Error('Bridge Electron untuk cetak label tidak tersedia')
  }

  // Export Excel
  if (payload?.action === 'export-excel') {
    const bridge = getBridge()
    if (bridge && typeof bridge.reportLabelVisitorExcel === 'function') {
      const resp = await bridge.reportLabelVisitorExcel(filter)
      const base64: string | undefined = resp?.base64 || resp?.buffer
      return { data: { base64, contentType: resp?.contentType, filename: resp?.filename }, total: payload?.total }
    }

    const ipc = getIpc()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:labelvisitor:excel', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal mencetak label (Excel)')
      const data = response?.data ?? response
      const base64: string | undefined = data?.base64 || data?.buffer
      return { data: { base64, contentType: data?.contentType, filename: data?.filename }, total: payload?.total }
    }

    throw new Error('Bridge Electron untuk cetak label (Excel) tidak tersedia')
  }

  // Export Word
  if (payload?.action === 'export-word') {
    const bridge = getBridge()
    if (bridge && typeof bridge.reportLabelVisitorWord === 'function') {
      const resp = await bridge.reportLabelVisitorWord(filter)
      const base64: string | undefined = resp?.base64 || resp?.buffer
      return { data: { base64, contentType: resp?.contentType, filename: resp?.filename }, total: payload?.total }
    }

    const ipc = getIpc()
    if (ipc?.invoke) {
      const response = await ipc.invoke('report:labelvisitor:word', filter)
      if (response?.success === false) throw new Error(response?.message ?? 'Gagal mencetak label (Word)')
      const data = response?.data ?? response
      const base64: string | undefined = data?.base64 || data?.buffer
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
