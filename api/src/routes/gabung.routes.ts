import { Router } from "express";
import {
  listGabung,
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
} from "../controllers/gabung.controller";

const router = Router();

router.get("/", listGabung);
router.get("/segment/:segment", listGabungBySegment);
router.get("/exhibitor-count", countExhibitorsByExpo);
router.get("/expo-chart", getExpoChartData);

router.get("/table-preview/:name", getTablePreview);
router.get("/company/:company", findGabungByCompany);
router.get("/:id", getGabung);

router.post("/", createGabung);
router.post("/import/excel", importGabungExcel);
router.put("/:id", updateGabung);
router.delete("/:id", deleteGabung);

export default router;
