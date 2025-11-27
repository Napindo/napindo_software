export type AddDataPayload = Record<string, string | boolean | null>

const invokeSave = async (payload: AddDataPayload) => {
  if (window.database?.saveAddData) {
    return window.database.saveAddData(payload)
  }
  if (window.ipcRenderer?.invoke) {
    return window.ipcRenderer.invoke('db:saveAddData', payload)
  }
  throw new Error('API saveAddData tidak tersedia di renderer.')
}

export async function saveAddData(payload: AddDataPayload) {
  const response = await invokeSave(payload)
  return response
}
