import { ipcMain } from 'electron'
import { dialog } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import {
  deleteAddData,
  fetchExhibitorsBySegment,
  fetchExhibitorCountByExpo,
  fetchExpoChartData,
  fetchTopRows,
  listGabungRecords,
  fetchSourceOptions,
  fetchCode1Options,
  findCompanyByName,
  saveAddData,
  importGabungExcel,
  updateAddData,
  reportLabelGover,
  reportLabelVisitor,
  reportLabelOptions,
  reportPerusahaan,
  reportGovernment,
  reportJumlahPerusahaan,
  reportJumlahGovernment,
  renderPersonalDatabasePdf,
  renderSearchF3Excel,
} from '../../db/gabungRepo.js'
import { testConnection } from '../../db/index.js'

const errorResponse = (error: unknown) => ({
  success: false,
  message: error instanceof Error ? error.message : String(error),
})

export function registerGabungIpcHandlers() {
  ipcMain.handle('db:testConnection', async () => {
    try {
      const result = await testConnection()
      return { ...result }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('db:fetchTableData', async (_event, tableName: string) => {
    try {
      const rows = await fetchTopRows(tableName)
      return { success: true, rows }
    } catch (error) {
      return errorResponse(error)
    }
  })

ipcMain.handle('db:fetchExhibitors', async (_event, segment, limit = 0, person = 'exhibitor') => {
    try {
      const rows = await fetchExhibitorsBySegment(segment, limit, person)
      return { success: true, rows }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('db:fetchExhibitorCountByExpo', async () => {
    try {
      const data = await fetchExhibitorCountByExpo()
      return { success: true, data }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('db:fetchExpoChartData', async () => {
    try {
      const data = await fetchExpoChartData()
      return { success: true, data }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('db:findCompany', async (_event, company: string) => {
    try {
      const rows = await findCompanyByName(company)
      return { success: true, rows }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('db:listGabung', async (_event, params) => {
    try {
      const data = await listGabungRecords(params)
      return { success: true, data }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('db:listSourceOptions', async () => {
    try {
      const data = await fetchSourceOptions()
      return { success: true, data }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('db:listCode1Options', async () => {
    try {
      const data = await fetchCode1Options()
      return { success: true, data }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('db:saveAddData', async (_event, payload) => {
    try {
      const result = await saveAddData(payload)
      return { success: true, data: result }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('db:importGabungExcel', async (_event, payload) => {
    try {
      const result = await importGabungExcel(payload)
      return { success: true, data: result }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('db:updateAddData', async (_event, id, payload) => {
    try {
      const result = await updateAddData(id, payload)
      return { success: true, data: result }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('db:deleteAddData', async (_event, ids: Array<string | number>) => {
    try {
      const result = await deleteAddData(ids)
      return { success: true, data: result }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('report:labelvisitor', async (_event, filter) => {
    try {
      const data = await reportLabelVisitor(filter)
      return { success: true, data }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('report:labelgover', async (_event, filter) => {
    try {
      const data = await reportLabelGover(filter)
      return { success: true, data }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('report:perusahaan', async (_event, filter) => {
    try {
      const data = await reportPerusahaan(filter)
      return { success: true, data }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('report:government', async (_event, filter) => {
    try {
      const data = await reportGovernment(filter)
      return { success: true, data }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('report:jumlah-perusahaan', async (_event, filter) => {
    try {
      const data = await reportJumlahPerusahaan(filter)
      return { success: true, data }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('report:jumlah-government', async (_event, filter) => {
    try {
      const data = await reportJumlahGovernment(filter)
      return { success: true, data }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('report:labeloptions', async () => {
    try {
      const data = await reportLabelOptions()
      return { success: true, data }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('db:personalDatabasePdf', async (_event, payload) => {
    try {
      const data = await renderPersonalDatabasePdf(payload)
      return { success: true, data }
    } catch (error) {
      return errorResponse(error)
    }
  })

  ipcMain.handle('db:search-f3:export-save', async (_event, payload) => {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Simpan Search Data (F3)',
        defaultPath: 'search-data-f3-export.xlsx',
        filters: [
          { name: 'Microsoft Excel Workbook (*.xlsx)', extensions: ['xlsx'] },
          { name: 'Microsoft Excel 97-2003 (*.xls)', extensions: ['xls'] },
        ],
        properties: ['createDirectory', 'showOverwriteConfirmation'],
      })

      if (canceled || !filePath) return { success: false, canceled: true }

      const ext = path.extname(filePath).toLowerCase()
      const excelPayload = await renderSearchF3Excel(payload || {})
      const contentType =
        ext === '.xls' ? 'application/vnd.ms-excel' : excelPayload.contentType

      await fs.writeFile(filePath, excelPayload.buffer)
      return { success: true, path: filePath, filename: path.basename(filePath), contentType }
    } catch (error) {
      return errorResponse(error)
    }
  })
}
