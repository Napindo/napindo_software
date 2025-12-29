import { ipcMain } from 'electron'
import { dialog } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import {
  reportBusinessVisitor,
  renderLabelVisitorPdf,
  renderLabelVisitorExcel,
  renderLabelVisitorWord,
  renderLabelGoverPdf,
  renderLabelGoverExcel,
  renderLabelGoverWord,
  renderReportPerusahaanPdf,
  renderReportPerusahaanExcel,
  renderReportPerusahaanWord,
  renderReportGovernmentPdf,
  renderReportGovernmentExcel,
  renderReportGovernmentWord,
  renderReportJumlahPerusahaanPdf,
  renderReportJumlahPerusahaanExcel,
  renderReportJumlahPerusahaanWord,
  renderReportJumlahGovernmentPdf,
  renderReportJumlahGovernmentExcel,
  renderReportJumlahGovernmentWord,
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

  ipcMain.handle('report:labelgover:pdf', async (_event, filter) => {
    try {
      const data = await renderLabelGoverPdf(filter)
      return { success: true, data }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('report:labelgover:excel', async (_event, filter) => {
    try {
      const data = await renderLabelGoverExcel(filter)
      return { success: true, data }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('report:labelgover:word', async (_event, filter) => {
    try {
      const data = await renderLabelGoverWord(filter)
      return { success: true, data }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('report:perusahaan:pdf', async (_event, filter) => {
    try {
      const data = await renderReportPerusahaanPdf(filter)
      return { success: true, data }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('report:perusahaan:excel', async (_event, filter) => {
    try {
      const data = await renderReportPerusahaanExcel(filter)
      return { success: true, data }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('report:perusahaan:word', async (_event, filter) => {
    try {
      const data = await renderReportPerusahaanWord(filter)
      return { success: true, data }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('report:government:pdf', async (_event, filter) => {
    try {
      const data = await renderReportGovernmentPdf(filter)
      return { success: true, data }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('report:government:excel', async (_event, filter) => {
    try {
      const data = await renderReportGovernmentExcel(filter)
      return { success: true, data }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('report:government:word', async (_event, filter) => {
    try {
      const data = await renderReportGovernmentWord(filter)
      return { success: true, data }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('report:jumlah-perusahaan:pdf', async (_event, filter) => {
    try {
      const data = await renderReportJumlahPerusahaanPdf(filter)
      return { success: true, data }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('report:jumlah-perusahaan:excel', async (_event, filter) => {
    try {
      const data = await renderReportJumlahPerusahaanExcel(filter)
      return { success: true, data }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('report:jumlah-perusahaan:word', async (_event, filter) => {
    try {
      const data = await renderReportJumlahPerusahaanWord(filter)
      return { success: true, data }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('report:jumlah-government:pdf', async (_event, filter) => {
    try {
      const data = await renderReportJumlahGovernmentPdf(filter)
      return { success: true, data }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('report:jumlah-government:excel', async (_event, filter) => {
    try {
      const data = await renderReportJumlahGovernmentExcel(filter)
      return { success: true, data }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('report:jumlah-government:word', async (_event, filter) => {
    try {
      const data = await renderReportJumlahGovernmentWord(filter)
      return { success: true, data }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('report:labelvisitor:export-save', async (_event, filter) => {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Simpan Label Perusahaan',
        defaultPath: 'print-label-perusahaan.docx',
        filters: [
          { name: 'Microsoft Word (*.docx)', extensions: ['docx'] },
          { name: 'Microsoft Word 97-2003 (*.doc)', extensions: ['doc'] },
          { name: 'Microsoft Excel (*.xlsx)', extensions: ['xlsx'] },
          { name: 'Microsoft Excel 97-2003 (*.xls)', extensions: ['xls'] },
          { name: 'PDF', extensions: ['pdf'] },
        ],
        properties: ['createDirectory', 'showOverwriteConfirmation'],
      })

      if (canceled || !filePath) return { success: false, canceled: true }

      const ext = path.extname(filePath).toLowerCase()
      let payload
      if (ext === '.xlsx' || ext === '.xls') {
        payload = await renderLabelVisitorExcel(filter)
      } else if (ext === '.docx' || ext === '.doc') {
        payload = await renderLabelVisitorWord(filter)
      } else {
        payload = await renderLabelVisitorPdf(filter)
      }

      const contentType =
        ext === '.doc'
          ? 'application/msword'
          : ext === '.xls'
            ? 'application/vnd.ms-excel'
            : payload.contentType

      await fs.writeFile(filePath, payload.buffer)
      return { success: true, path: filePath, filename: path.basename(filePath), contentType }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('report:labelgover:export-save', async (_event, filter) => {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Simpan Label Government',
        defaultPath: 'print-label-government.docx',
        filters: [
          { name: 'Microsoft Word (*.docx)', extensions: ['docx'] },
          { name: 'Microsoft Word 97-2003 (*.doc)', extensions: ['doc'] },
          { name: 'Microsoft Excel (*.xlsx)', extensions: ['xlsx'] },
          { name: 'Microsoft Excel 97-2003 (*.xls)', extensions: ['xls'] },
          { name: 'PDF', extensions: ['pdf'] },
        ],
        properties: ['createDirectory', 'showOverwriteConfirmation'],
      })

      if (canceled || !filePath) return { success: false, canceled: true }

      const ext = path.extname(filePath).toLowerCase()
      let payload
      if (ext === '.xlsx' || ext === '.xls') {
        payload = await renderLabelGoverExcel(filter)
      } else if (ext === '.docx' || ext === '.doc') {
        payload = await renderLabelGoverWord(filter)
      } else {
        payload = await renderLabelGoverPdf(filter)
      }

      const contentType =
        ext === '.doc'
          ? 'application/msword'
          : ext === '.xls'
            ? 'application/vnd.ms-excel'
            : payload.contentType

      await fs.writeFile(filePath, payload.buffer)
      return { success: true, path: filePath, filename: path.basename(filePath), contentType }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('report:perusahaan:export-save', async (_event, filter) => {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Simpan Report Perusahaan',
        defaultPath: 'report-perusahaan.docx',
        filters: [
          { name: 'Microsoft Word (*.docx)', extensions: ['docx'] },
          { name: 'Microsoft Word 97-2003 (*.doc)', extensions: ['doc'] },
          { name: 'Microsoft Excel (*.xlsx)', extensions: ['xlsx'] },
          { name: 'Microsoft Excel 97-2003 (*.xls)', extensions: ['xls'] },
          { name: 'PDF', extensions: ['pdf'] },
        ],
        properties: ['createDirectory', 'showOverwriteConfirmation'],
      })

      if (canceled || !filePath) return { success: false, canceled: true }

      const ext = path.extname(filePath).toLowerCase()
      let payload
      if (ext === '.xlsx' || ext === '.xls') {
        payload = await renderReportPerusahaanExcel(filter)
      } else if (ext === '.docx' || ext === '.doc') {
        payload = await renderReportPerusahaanWord(filter)
      } else {
        payload = await renderReportPerusahaanPdf(filter)
      }

      const contentType =
        ext === '.doc'
          ? 'application/msword'
          : ext === '.xls'
            ? 'application/vnd.ms-excel'
            : payload.contentType

      await fs.writeFile(filePath, payload.buffer)
      return { success: true, path: filePath, filename: path.basename(filePath), contentType }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('report:government:export-save', async (_event, filter) => {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Simpan Report Government',
        defaultPath: 'report-government.docx',
        filters: [
          { name: 'Microsoft Word (*.docx)', extensions: ['docx'] },
          { name: 'Microsoft Word 97-2003 (*.doc)', extensions: ['doc'] },
          { name: 'Microsoft Excel (*.xlsx)', extensions: ['xlsx'] },
          { name: 'Microsoft Excel 97-2003 (*.xls)', extensions: ['xls'] },
          { name: 'PDF', extensions: ['pdf'] },
        ],
        properties: ['createDirectory', 'showOverwriteConfirmation'],
      })

      if (canceled || !filePath) return { success: false, canceled: true }

      const ext = path.extname(filePath).toLowerCase()
      let payload
      if (ext === '.xlsx' || ext === '.xls') {
        payload = await renderReportGovernmentExcel(filter)
      } else if (ext === '.docx' || ext === '.doc') {
        payload = await renderReportGovernmentWord(filter)
      } else {
        payload = await renderReportGovernmentPdf(filter)
      }

      const contentType =
        ext === '.doc'
          ? 'application/msword'
          : ext === '.xls'
            ? 'application/vnd.ms-excel'
            : payload.contentType

      await fs.writeFile(filePath, payload.buffer)
      return { success: true, path: filePath, filename: path.basename(filePath), contentType }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('report:jumlah-perusahaan:export-save', async (_event, filter) => {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Simpan Report Jumlah Perusahaan',
        defaultPath: 'report-jumlah-perusahaan.docx',
        filters: [
          { name: 'Microsoft Word (*.docx)', extensions: ['docx'] },
          { name: 'Microsoft Word 97-2003 (*.doc)', extensions: ['doc'] },
          { name: 'Microsoft Excel (*.xlsx)', extensions: ['xlsx'] },
          { name: 'Microsoft Excel 97-2003 (*.xls)', extensions: ['xls'] },
          { name: 'PDF', extensions: ['pdf'] },
        ],
        properties: ['createDirectory', 'showOverwriteConfirmation'],
      })

      if (canceled || !filePath) return { success: false, canceled: true }

      const ext = path.extname(filePath).toLowerCase()
      let payload
      if (ext === '.xlsx' || ext === '.xls') {
        payload = await renderReportJumlahPerusahaanExcel(filter)
      } else if (ext === '.docx' || ext === '.doc') {
        payload = await renderReportJumlahPerusahaanWord(filter)
      } else {
        payload = await renderReportJumlahPerusahaanPdf(filter)
      }

      const contentType =
        ext === '.doc'
          ? 'application/msword'
          : ext === '.xls'
            ? 'application/vnd.ms-excel'
            : payload.contentType

      await fs.writeFile(filePath, payload.buffer)
      return { success: true, path: filePath, filename: path.basename(filePath), contentType }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('report:jumlah-government:export-save', async (_event, filter) => {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Simpan Report Jumlah Government',
        defaultPath: 'report-jumlah-government.docx',
        filters: [
          { name: 'Microsoft Word (*.docx)', extensions: ['docx'] },
          { name: 'Microsoft Word 97-2003 (*.doc)', extensions: ['doc'] },
          { name: 'Microsoft Excel (*.xlsx)', extensions: ['xlsx'] },
          { name: 'Microsoft Excel 97-2003 (*.xls)', extensions: ['xls'] },
          { name: 'PDF', extensions: ['pdf'] },
        ],
        properties: ['createDirectory', 'showOverwriteConfirmation'],
      })

      if (canceled || !filePath) return { success: false, canceled: true }

      const ext = path.extname(filePath).toLowerCase()
      let payload
      if (ext === '.xlsx' || ext === '.xls') {
        payload = await renderReportJumlahGovernmentExcel(filter)
      } else if (ext === '.docx' || ext === '.doc') {
        payload = await renderReportJumlahGovernmentWord(filter)
      } else {
        payload = await renderReportJumlahGovernmentPdf(filter)
      }

      const contentType =
        ext === '.doc'
          ? 'application/msword'
          : ext === '.xls'
            ? 'application/vnd.ms-excel'
            : payload.contentType

      await fs.writeFile(filePath, payload.buffer)
      return { success: true, path: filePath, filename: path.basename(filePath), contentType }
    } catch (error) {
      return errorResponse(error)
    }
  })
}
