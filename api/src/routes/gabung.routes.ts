import { Router } from "express"
import {
  listGabung,
  getGabung,
  createGabung,
  updateGabung,
  deleteGabung,
} from "../controllers/gabung.controller"

const r = Router()

r.get("/", listGabung)
r.get("/:id", getGabung)
r.post("/", createGabung)
r.put("/:id", updateGabung)
r.delete("/:id", deleteGabung)

export default r
