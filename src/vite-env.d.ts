/// <reference types="vite/client" />

type RendererDatabaseResponse<T = unknown> =
  | { success: true; rows?: T[]; serverTime?: unknown }
  | { success: false; message: string }

interface Window {
  database: {
    testConnection: () => Promise<RendererDatabaseResponse>
    fetchTableData: <T = unknown>(tableName: string) => Promise<RendererDatabaseResponse<T>>
  }
}