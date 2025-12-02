/// <reference types="vite/client" />

type RendererDatabaseResponse<T = unknown> =
  | { success: true; rows?: T[]; serverTime?: unknown; user?: T; hints?: T }
  | { success: false; message: string }

interface Window {
  database: {
    testConnection: () => Promise<RendererDatabaseResponse>
    fetchTableData: <T = unknown>(tableName: string) => Promise<RendererDatabaseResponse<T>>
    fetchExhibitors: <T = unknown>(
      segment: string,
      limit?: number,
      person?: "exhibitor" | "visitor",
    ) => Promise<RendererDatabaseResponse<T>>
    login: (
      payload: { username: string; password: string; division?: string | null },
    ) => Promise<RendererDatabaseResponse<{ username: string; division?: string | null; name?: string | null }>>
    userHints: () => Promise<RendererDatabaseResponse<{ usernames: string[]; divisions: string[] }>>
    saveAddData: (payload: Record<string, unknown>) => Promise<RendererDatabaseResponse>
    updateAddData: (id: string | number, payload: Record<string, unknown>) => Promise<RendererDatabaseResponse>
    deleteAddData: (ids: Array<string | number>) => Promise<RendererDatabaseResponse>
    findCompany: <T = Record<string, unknown>>(company: string) => Promise<RendererDatabaseResponse<T>>
  }
}
