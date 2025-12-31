import { Router } from "express";
import {
  listGabung,
  listGabungBySegment,
  getGabung,
  getTablePreview,
  findGabungByCompany,
  createGabung,
  updateGabung,
  deleteGabung,
  importGabungExcel,
} from "../controllers/gabung.controller";

const router = Router();

router.get("/", listGabung);
router.get("/segment/:segment", listGabungBySegment);

router.get("/table-preview/:name", getTablePreview);
router.get("/company/:company", findGabungByCompany);
router.get("/:id", getGabung);

router.post("/", createGabung);
router.post("/import/excel", importGabungExcel);
router.put("/:id", updateGabung);
router.delete("/:id", deleteGabung);

export default router;
