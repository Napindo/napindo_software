import { Router } from "express"
import {
  reportLabelGover,
  reportLabelPerusahaan,
  getLabelOptions,
  exportLabelPerusahaanPdf,
  exportLabelPerusahaanExcel,
  exportLabelPerusahaanWord,
  exportLabelGoverPdf,
  exportLabelGoverExcel,
  exportLabelGoverWord,
  reportPerusahaan,
  reportGovernment,
  exportReportPerusahaanPdf,
  exportReportPerusahaanWord,
  exportReportPerusahaanExcel,
  exportReportGovernmentPdf,
  exportReportGovernmentWord,
  exportReportGovernmentExcel,
  reportJumlahPerusahaan,
  reportJumlahGovernment,
  exportReportJumlahPerusahaanPdf,
  exportReportJumlahPerusahaanWord,
  exportReportJumlahPerusahaanExcel,
  exportReportJumlahGovernmentPdf,
  exportReportJumlahGovernmentWord,
  exportReportJumlahGovernmentExcel,
} from "../controllers/report.controller"

const router = Router()

router.post("/labelvisitor", reportLabelPerusahaan)
router.post("/labelvisitor/print", exportLabelPerusahaanPdf)
router.post("/labelvisitor/export/excel", exportLabelPerusahaanExcel)
router.post("/labelvisitor/export/word", exportLabelPerusahaanWord)
router.post("/labelgover", reportLabelGover)
router.post("/labelgover/print", exportLabelGoverPdf)
router.post("/labelgover/export/excel", exportLabelGoverExcel)
router.post("/labelgover/export/word", exportLabelGoverWord)
router.post("/perusahaan", reportPerusahaan)
router.post("/perusahaan/print", exportReportPerusahaanPdf)
router.post("/perusahaan/export/excel", exportReportPerusahaanExcel)
router.post("/perusahaan/export/word", exportReportPerusahaanWord)
router.post("/government", reportGovernment)
router.post("/government/print", exportReportGovernmentPdf)
router.post("/government/export/excel", exportReportGovernmentExcel)
router.post("/government/export/word", exportReportGovernmentWord)
router.post("/jumlah/perusahaan", reportJumlahPerusahaan)
router.post("/jumlah/perusahaan/print", exportReportJumlahPerusahaanPdf)
router.post("/jumlah/perusahaan/export/excel", exportReportJumlahPerusahaanExcel)
router.post("/jumlah/perusahaan/export/word", exportReportJumlahPerusahaanWord)
router.post("/jumlah/government", reportJumlahGovernment)
router.post("/jumlah/government/print", exportReportJumlahGovernmentPdf)
router.post("/jumlah/government/export/excel", exportReportJumlahGovernmentExcel)
router.post("/jumlah/government/export/word", exportReportJumlahGovernmentWord)
router.get("/label/options", getLabelOptions)

export default router
