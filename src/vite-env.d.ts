/// <reference types="vite/client" />

type RendererDatabaseResponse<T = unknown> =
  | { success: true; rows?: T[]; serverTime?: unknown; user?: T }
  | { success: false; message: string }

interface Window {
  database: {
    testConnection: () => Promise<RendererDatabaseResponse>
    fetchTableData: <T = unknown>(tableName: string) => Promise<RendererDatabaseResponse<T>>
    login: (
      payload: { username: string; password: string; division?: string | null },
    ) => Promise<RendererDatabaseResponse<{ username: string; division?: string | null; name?: string | null }>>
  }
}
