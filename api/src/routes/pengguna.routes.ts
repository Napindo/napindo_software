import { Router } from "express"
import {
  listPengguna,
  getPengguna,
  createPengguna,
  updatePengguna,
  deletePengguna,
  loginPengguna,
  userHints,
} from "../controllers/pengguna.controller"

const r = Router()

r.get("/hints", userHints)
r.post("/login", loginPengguna)
r.get("/", listPengguna)
r.post("/", createPengguna)
r.get("/:username", getPengguna)
r.put("/:username", updatePengguna)
r.delete("/:username", deletePengguna)

export default r
