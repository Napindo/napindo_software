import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('database', {
  testConnection: () => ipcRenderer.invoke('db:testConnection'),

  fetchTableData: (tableName: string) => ipcRenderer.invoke('db:fetchTableData', tableName),

  fetchExhibitors: (
    segment: string,
    limit = 200,
    person: 'exhibitor' | 'visitor' = 'exhibitor',
  ) => ipcRenderer.invoke('db:fetchExhibitors', segment, limit, person),
  fetchExhibitorCountByExpo: () => ipcRenderer.invoke('db:fetchExhibitorCountByExpo'),
  fetchExpoChartData: () => ipcRenderer.invoke('db:fetchExpoChartData'),
  fetchAuditLogs: (limit = 200) => ipcRenderer.invoke('db:fetchAuditLogs', limit),
  createAuditLog: (payload: {
    username?: string | null
    action: string
    page?: string | null
    summary?: string | null
    data?: unknown
  }) => ipcRenderer.invoke('db:createAuditLog', payload),

  login: (payload: { username: string; password: string; division?: string | null }) =>
    ipcRenderer.invoke('db:login', payload),

  userHints: () => ipcRenderer.invoke('db:userHints'),

  createPengguna: (payload: { username: string; password: string; division?: string | null; status?: string | null }) =>
    ipcRenderer.invoke('db:createPengguna', payload),

  changePenggunaPassword: (payload: {
    username: string
    currentPassword: string
    newPassword: string
    division?: string | null
  }) => ipcRenderer.invoke('db:changePenggunaPassword', payload),

  logoutPengguna: (payload: { username: string }) => ipcRenderer.invoke('db:logoutPengguna', payload),

  listPengguna: () => ipcRenderer.invoke('db:listPengguna'),

  findCompany: (company: string) => ipcRenderer.invoke('db:findCompany', company),
  listGabung: (params?: { page?: number; pageSize?: number; q?: string }) =>
    ipcRenderer.invoke('db:listGabung', params),

  saveAddData: (payload: any) => ipcRenderer.invoke('db:saveAddData', payload),

  importGabungExcel: (payload: any) => ipcRenderer.invoke('db:importGabungExcel', payload),

  updateAddData: (id: string | number, payload: any) =>
    ipcRenderer.invoke('db:updateAddData', id, payload),

  deleteAddData: (ids: Array<string | number>) => ipcRenderer.invoke('db:deleteAddData', ids),
  exportPersonalDatabasePdf: (payload: Record<string, unknown>) =>
    ipcRenderer.invoke('db:personalDatabasePdf', payload),

  reportLabelVisitor: (filter: unknown) => ipcRenderer.invoke('report:labelvisitor', filter),
  reportLabelGover: (filter: unknown) => ipcRenderer.invoke('report:labelgover', filter),
  reportLabelOptions: () => ipcRenderer.invoke('report:labeloptions'),
  reportLabelVisitorPdf: (filter: unknown) => ipcRenderer.invoke('report:labelvisitor:pdf', filter),
  reportLabelVisitorExcel: (filter: unknown) => ipcRenderer.invoke('report:labelvisitor:excel', filter),
  reportLabelVisitorWord: (filter: unknown) => ipcRenderer.invoke('report:labelvisitor:word', filter),
  reportLabelVisitorExportSave: (filter: unknown) => ipcRenderer.invoke('report:labelvisitor:export-save', filter),
  reportLabelGoverPdf: (filter: unknown) => ipcRenderer.invoke('report:labelgover:pdf', filter),
  reportLabelGoverExcel: (filter: unknown) => ipcRenderer.invoke('report:labelgover:excel', filter),
  reportLabelGoverWord: (filter: unknown) => ipcRenderer.invoke('report:labelgover:word', filter),
  reportLabelGoverExportSave: (filter: unknown) => ipcRenderer.invoke('report:labelgover:export-save', filter),
  reportPerusahaan: (filter: unknown) => ipcRenderer.invoke('report:perusahaan', filter),
  reportGovernment: (filter: unknown) => ipcRenderer.invoke('report:government', filter),
  reportPerusahaanPdf: (filter: unknown) => ipcRenderer.invoke('report:perusahaan:pdf', filter),
  reportPerusahaanExcel: (filter: unknown) => ipcRenderer.invoke('report:perusahaan:excel', filter),
  reportPerusahaanWord: (filter: unknown) => ipcRenderer.invoke('report:perusahaan:word', filter),
  reportPerusahaanExportSave: (filter: unknown) => ipcRenderer.invoke('report:perusahaan:export-save', filter),
  reportGovernmentPdf: (filter: unknown) => ipcRenderer.invoke('report:government:pdf', filter),
  reportGovernmentExcel: (filter: unknown) => ipcRenderer.invoke('report:government:excel', filter),
  reportGovernmentWord: (filter: unknown) => ipcRenderer.invoke('report:government:word', filter),
  reportGovernmentExportSave: (filter: unknown) => ipcRenderer.invoke('report:government:export-save', filter),
  reportJumlahPerusahaan: (filter: unknown) => ipcRenderer.invoke('report:jumlah-perusahaan', filter),
  reportJumlahGovernment: (filter: unknown) => ipcRenderer.invoke('report:jumlah-government', filter),
  reportJumlahPerusahaanPdf: (filter: unknown) => ipcRenderer.invoke('report:jumlah-perusahaan:pdf', filter),
  reportJumlahPerusahaanExcel: (filter: unknown) => ipcRenderer.invoke('report:jumlah-perusahaan:excel', filter),
  reportJumlahPerusahaanWord: (filter: unknown) => ipcRenderer.invoke('report:jumlah-perusahaan:word', filter),
  reportJumlahPerusahaanExportSave: (filter: unknown) => ipcRenderer.invoke('report:jumlah-perusahaan:export-save', filter),
  reportJumlahGovernmentPdf: (filter: unknown) => ipcRenderer.invoke('report:jumlah-government:pdf', filter),
  reportJumlahGovernmentExcel: (filter: unknown) => ipcRenderer.invoke('report:jumlah-government:excel', filter),
  reportJumlahGovernmentWord: (filter: unknown) => ipcRenderer.invoke('report:jumlah-government:word', filter),
  reportJumlahGovernmentExportSave: (filter: unknown) => ipcRenderer.invoke('report:jumlah-government:export-save', filter),
  getAppInfo: () => ipcRenderer.invoke('app:getInfo'),
})
