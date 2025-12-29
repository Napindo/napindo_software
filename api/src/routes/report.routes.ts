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
router.get("/label/options", getLabelOptions)

export default router
