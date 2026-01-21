import { Router } from "express";
import {
  listGabung,
  listSourceOptions,
  listCode1Options,
  listGabungBySegment,
  getGabung,
  getTablePreview,
  findGabungByCompany,
  countExhibitorsByExpo,
  getExpoChartData,
  createGabung,
  updateGabung,
  deleteGabung,
  importGabungExcel,
  exportPersonalDatabasePdf,
} from "../controllers/gabung.controller";

const router = Router();

router.get("/", listGabung);
router.get("/source-options", listSourceOptions);
router.get("/code1-options", listCode1Options);
router.get("/segment/:segment", listGabungBySegment);
router.get("/exhibitor-count", countExhibitorsByExpo);
router.get("/expo-chart", getExpoChartData);

router.get("/table-preview/:name", getTablePreview);
router.get("/company/:company", findGabungByCompany);
router.get("/:id", getGabung);

router.post("/", createGabung);
router.post("/import/excel", importGabungExcel);
router.post("/personal-pdf", exportPersonalDatabasePdf);
router.put("/:id", updateGabung);
router.delete("/:id", deleteGabung);

export default router;
