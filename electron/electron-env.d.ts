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
    ) => Promise<DatabaseResponse<T>>
    login: (
      payload: { username: string; password: string; division?: string | null },
    ) => Promise<DatabaseResponse<{ username: string; division?: string | null; name?: string | null }>>
    userHints: () => Promise<DatabaseResponse<{ usernames: string[]; divisions: string[] }>>
  }
}
