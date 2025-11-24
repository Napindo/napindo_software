import { Router } from "express"
import {
  listPengguna,
  getPengguna,
  createPengguna,
  updatePengguna,
  deletePengguna,
} from "../controllers/pengguna.controller"

const r = Router()

r.get("/", listPengguna)
r.get("/:username", getPengguna)
r.post("/", createPengguna)
r.put("/:username", updatePengguna)
r.delete("/:username", deletePengguna)

export default r
