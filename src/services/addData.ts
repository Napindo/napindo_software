export type AddDataPayload = Record<string, string | boolean | null>

type DatabaseResponse<T = unknown> =
  | { success: true; rows?: T[]; data?: T[]; message?: string }
  | { success: false; message: string }

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

const invokeFindCompany = async (company: string) => {
  if (window.database?.findCompany) {
    return window.database.findCompany(company)
  }
  if (window.ipcRenderer?.invoke) {
    return window.ipcRenderer.invoke('db:findCompany', company) as Promise<DatabaseResponse<Record<string, unknown>>>
  }
  throw new Error('API findCompany tidak tersedia di renderer.')
}

export async function findCompanyRecords(company: string) {
  const query = company.trim()
  if (!query) {
    throw new Error('Company wajib diisi sebelum pencarian.')
  }

  const response = await invokeFindCompany(query)
  if (!response.success) {
    throw new Error(response.message || 'Gagal mencari company')
  }

  return response.rows ?? response.data ?? []
}
