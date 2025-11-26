import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...
})

contextBridge.exposeInMainWorld('database', {
  testConnection: () => ipcRenderer.invoke('db:testConnection'),
  fetchTableData: (tableName: string) => ipcRenderer.invoke('db:fetchTableData', tableName),
  fetchExhibitors: (
    segment:
      | 'defence'
      | 'aerospace'
      | 'marine'
      | 'water'
      | 'waste'
      | 'iismex'
      | 'renergy'
      | 'security'
      | 'firex'
      | 'livestock'
      | 'agrotech'
      | 'vet'
      | 'fisheries'
      | 'feed'
      | 'dairy'
      | 'horticulture',
    limit = 200,
  ) => ipcRenderer.invoke('db:fetchExhibitors', segment, limit),
  login: (payload: { username: string; password: string; division?: string | null }) =>
    ipcRenderer.invoke('db:login', payload),
  userHints: () => ipcRenderer.invoke('db:userHints'),
})
