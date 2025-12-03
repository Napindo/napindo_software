import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('database', {
  testConnection: () => ipcRenderer.invoke('db:testConnection'),

  fetchTableData: (tableName: string) => ipcRenderer.invoke('db:fetchTableData', tableName),

  fetchExhibitors: (
    segment: string,
    limit = 200,
    person: 'exhibitor' | 'visitor' = 'exhibitor',
  ) => ipcRenderer.invoke('db:fetchExhibitors', segment, limit, person),

  login: (payload: { username: string; password: string; division?: string | null }) =>
    ipcRenderer.invoke('db:login', payload),

  userHints: () => ipcRenderer.invoke('db:userHints'),

  findCompany: (company: string) => ipcRenderer.invoke('db:findCompany', company),

  saveAddData: (payload: any) => ipcRenderer.invoke('db:saveAddData', payload),

  updateAddData: (id: string | number, payload: any) =>
    ipcRenderer.invoke('db:updateAddData', id, payload),

  deleteAddData: (ids: Array<string | number>) => ipcRenderer.invoke('db:deleteAddData', ids),

  reportLabelVisitor: (filter: unknown) => ipcRenderer.invoke('report:labelvisitor', filter),
  reportLabelGover: (filter: unknown) => ipcRenderer.invoke('report:labelgover', filter),
})
