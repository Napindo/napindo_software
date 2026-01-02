import { ipcMain } from "electron"
import { fetchAuditLogs } from "../../db/auditRepo.js"

const errorResponse = (error: unknown) => ({
  success: false,
  message: error instanceof Error ? error.message : String(error),
})

export function registerAuditIpcHandlers() {
  ipcMain.handle("db:fetchAuditLogs", async (_event, limit = 200) => {
    try {
      const rows = await fetchAuditLogs(Number(limit) || 200)
      return { success: true, rows }
    } catch (error) {
      return errorResponse(error)
    }
  })
}
