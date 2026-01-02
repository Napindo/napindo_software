export const getDatabaseBridge = () => (window as any).database ?? null

export const getIpcRenderer = () => (window as any).ipcRenderer ?? null

export const unwrapBridgeResponse = (payload: any) =>
  payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload
