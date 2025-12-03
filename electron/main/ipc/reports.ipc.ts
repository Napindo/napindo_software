import { ipcMain } from 'electron'

// Placeholder handlers; hook real report endpoints when ready.
export function registerReportsIpcHandlers() {
  ipcMain.handle('report:businessvisitor', async () => ({
    success: false,
    message: 'Not implemented yet.',
  }))
}
