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
