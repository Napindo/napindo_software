import { ipcMain } from 'electron'
import { reportBusinessVisitor } from '../../db/gabungRepo.js'

const errorResponse = (error: unknown) => ({
  success: false,
  message: error instanceof Error ? error.message : String(error),
})

export function registerReportsIpcHandlers() {
  ipcMain.handle('report:businessvisitor', async (_event, filter) => {
    try {
      const data = await reportBusinessVisitor(filter)
      return { success: true, data }
    } catch (error) {
      return errorResponse(error)
    }
  })
}
