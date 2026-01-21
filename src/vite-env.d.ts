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
    fetchExhibitorCountByExpo: () => Promise<
      RendererDatabaseResponse<{ indoDefence?: number; indoWater?: number; indoLivestock?: number }>
    >
    fetchExpoChartData: () => Promise<
      RendererDatabaseResponse<{
        indoDefence?: Record<number, number>
        indoWater?: Record<number, number>
        indoLivestock?: Record<number, number>
      }>
    >
    fetchAuditLogs: (limit?: number) => Promise<
      RendererDatabaseResponse<
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
    createAuditLog: (payload: {
      username?: string | null
      action: string
      page?: string | null
      summary?: string | null
      data?: unknown
    }) => Promise<RendererDatabaseResponse>
    login: (
      payload: { username: string; password: string; division?: string | null },
    ) => Promise<RendererDatabaseResponse<{ username: string; division?: string | null; name?: string | null }>>
    userHints: () => Promise<RendererDatabaseResponse<{ usernames: string[]; divisions: string[] }>>
    createPengguna: (payload: {
      username: string
      password: string
      division?: string | null
      status?: string | null
    }) => Promise<RendererDatabaseResponse<{ username: string; division?: string | null; status?: string | null }>>
    changePenggunaPassword: (payload: {
      username: string
      currentPassword: string
      newPassword: string
      division?: string | null
    }) => Promise<RendererDatabaseResponse<{ username: string; division?: string | null; status?: string | null }>>
    logoutPengguna: (payload: { username: string }) => Promise<RendererDatabaseResponse<{ username: string; status?: string | null }>>
    listPengguna: () => Promise<RendererDatabaseResponse<{ username?: string; division?: string | null; status?: string | null }>>
    listGabung: (params?: { page?: number; pageSize?: number; q?: string }) => Promise<RendererDatabaseResponse>
    listSourceOptions: () => Promise<RendererDatabaseResponse<string[]>>
    saveAddData: (payload: Record<string, unknown>) => Promise<RendererDatabaseResponse>
    importGabungExcel: (payload: {
      fileBase64: string
      fileName?: string
      sheetName?: string
      headerRow?: number
      chunkSize?: number
      maxRows?: number
      dryRun?: boolean
      currentUser?: string
    }) => Promise<RendererDatabaseResponse>
    updateAddData: (id: string | number, payload: Record<string, unknown>) => Promise<RendererDatabaseResponse>
    deleteAddData: (ids: Array<string | number>) => Promise<RendererDatabaseResponse>
    findCompany: <T = Record<string, unknown>>(company: string) => Promise<RendererDatabaseResponse<T>>
    exportPersonalDatabasePdf: (
      payload: Record<string, unknown>,
    ) => Promise<RendererDatabaseResponse<{ base64?: string; contentType?: string; filename?: string }>>
  }
}
