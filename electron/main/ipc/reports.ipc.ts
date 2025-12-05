import { ipcMain } from 'electron'
import { dialog } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import {
  reportBusinessVisitor,
  renderLabelVisitorPdf,
  renderLabelVisitorExcel,
  renderLabelVisitorWord,
} from '../../db/gabungRepo.js'

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

  ipcMain.handle('report:labelvisitor:pdf', async (_event, filter) => {
    try {
      const data = await renderLabelVisitorPdf(filter)
      return { success: true, data }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('report:labelvisitor:excel', async (_event, filter) => {
    try {
      const data = await renderLabelVisitorExcel(filter)
      return { success: true, data }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('report:labelvisitor:word', async (_event, filter) => {
    try {
      const data = await renderLabelVisitorWord(filter)
      return { success: true, data }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('report:labelvisitor:export-save', async (_event, filter) => {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Simpan Label Perusahaan',
        defaultPath: 'print-label-perusahaan.pdf',
        filters: [
          { name: 'PDF', extensions: ['pdf'] },
          { name: 'Excel', extensions: ['xlsx'] },
          { name: 'Word', extensions: ['docx'] },
        ],
        properties: ['createDirectory', 'showOverwriteConfirmation'],
      })

      if (canceled || !filePath) return { success: false, canceled: true }

      const ext = path.extname(filePath).toLowerCase()
      let payload
      if (ext === '.xlsx') {
        payload = await renderLabelVisitorExcel(filter)
      } else if (ext === '.docx') {
        payload = await renderLabelVisitorWord(filter)
      } else {
        payload = await renderLabelVisitorPdf(filter)
      }

      await fs.writeFile(filePath, payload.buffer)
      return { success: true, path: filePath, filename: path.basename(filePath), contentType: payload.contentType }
    } catch (error) {
      return errorResponse(error)
    }
  })
}
