/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

// Used in Renderer process, expose in `preload.ts`
type DatabaseResponse<T = unknown> =
  | { success: true; rows?: T[]; serverTime?: unknown; user?: T; hints?: T }
  | { success: false; message: string }

interface Window {
  ipcRenderer: import('electron').IpcRenderer
  database: {
    testConnection: () => Promise<DatabaseResponse>
    fetchTableData: <T = unknown>(tableName: string) => Promise<DatabaseResponse<T>>
    fetchExhibitors: <T = unknown>(
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
      limit?: number,
      person?: 'exhibitor' | 'visitor',
    ) => Promise<DatabaseResponse<T>>
    fetchExhibitorCountByExpo: () => Promise<
      DatabaseResponse<{ indoDefence?: number; indoWater?: number; indoLivestock?: number }>
    >
    fetchExpoChartData: () => Promise<
      DatabaseResponse<{
        indoDefence?: Record<number, number>
        indoWater?: Record<number, number>
        indoLivestock?: Record<number, number>
      }>
    >
    fetchAuditLogs: (limit?: number) => Promise<
      DatabaseResponse<
        {
          id: number
          username?: string | null
          action: string
          page?: string | null
          summary?: string | null
          data?: unknown
          createdAt: string
        }[]
      >
    >
    login: (
      payload: { username: string; password: string; division?: string | null },
    ) => Promise<DatabaseResponse<{ username: string; division?: string | null; name?: string | null }>>
    userHints: () => Promise<DatabaseResponse<{ usernames: string[]; divisions: string[] }>>
    createPengguna: (payload: {
      username: string
      password: string
      division?: string | null
      status?: string | null
    }) => Promise<DatabaseResponse<{ username: string; division?: string | null; status?: string | null }>>
    changePenggunaPassword: (payload: {
      username: string
      currentPassword: string
      newPassword: string
      division?: string | null
    }) => Promise<DatabaseResponse<{ username: string; division?: string | null; status?: string | null }>>
    logoutPengguna: (payload: { username: string }) => Promise<DatabaseResponse<{ username: string; status?: string | null }>>
    listPengguna: () => Promise<DatabaseResponse<{ username?: string; division?: string | null; status?: string | null }>>
    findCompany: <T = Record<string, unknown>>(company: string) => Promise<DatabaseResponse<T>>
    saveAddData: (payload: Record<string, unknown>) => Promise<DatabaseResponse>
    importGabungExcel: (payload: {
      fileBase64: string
      fileName?: string
      sheetName?: string
      headerRow?: number
      chunkSize?: number
      maxRows?: number
      dryRun?: boolean
      currentUser?: string
    }) => Promise<DatabaseResponse>
    updateAddData: (id: string | number, payload: Record<string, unknown>) => Promise<DatabaseResponse>
    deleteAddData: (ids: Array<string | number>) => Promise<DatabaseResponse>
  }
}
