import { Router } from "express"
import { reportLabelGover, reportLabelPerusahaan, getLabelOptions } from "../controllers/report.controller"

const router = Router()

router.post("/labelvisitor", reportLabelPerusahaan)
router.post("/labelgover", reportLabelGover)
router.get("/label/options", getLabelOptions)

export default router
