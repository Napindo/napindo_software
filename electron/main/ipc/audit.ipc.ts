import { ipcMain } from "electron"
import { fetchAuditLogs, createAuditLog } from "../../db/auditRepo.js"

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

  ipcMain.handle("db:createAuditLog", async (_event, payload) => {
    try {
      const data = await createAuditLog(payload)
      return { success: true, data }
    } catch (error) {
      return errorResponse(error)
    }
  })
}
