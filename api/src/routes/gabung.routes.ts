import { Router } from "express"
import {
  listGabung,
  getGabung,
  createGabung,
  updateGabung,
  deleteGabung,
  listGabungBySegment,
  getTablePreview,
} from "../controllers/gabung.controller"

const r = Router()

r.get("/table/:name", getTablePreview)
r.get("/:segment(defence|aerospace|marine)", listGabungBySegment)
r.get("/", listGabung)
r.get("/:id", getGabung)
r.post("/", createGabung)
r.put("/:id", updateGabung)
r.delete("/:id", deleteGabung)

export default r
