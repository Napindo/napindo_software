import { ipcMain } from 'electron'
import { fetchUserHints, loginUser } from '../../db/penggunaRepo.js'

const errorResponse = (error: unknown) => ({
  success: false,
  message: error instanceof Error ? error.message : String(error),
})

export function registerPenggunaIpcHandlers() {
  ipcMain.handle('db:login', async (_event, payload) => {
    try {
      const user = await loginUser(payload)

      if (!user) {
        return {
          success: false,
          message: 'Username, password, atau divisi tidak cocok.',
        }
      }

      return { success: true, user }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('db:userHints', async () => {
    try {
      const hints = await fetchUserHints()
      return { success: true, hints }
    } catch (error) {
      return errorResponse(error)
    }
  })
}
