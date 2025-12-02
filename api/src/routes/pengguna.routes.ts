import { Router } from "express";
import {
  listPengguna,
  getPenggunaByUsername,
  createPengguna,
  updatePengguna,
  deletePengguna,
  loginPengguna,
} from "../controllers/pengguna.controller";

const router = Router();

router.get("/", listPengguna);
router.get("/:username", getPenggunaByUsername);
router.post("/", createPengguna);
router.put("/:username", updatePengguna);
router.delete("/:username", deletePengguna);

// login endpoint
router.post("/login", loginPengguna);

export default router;
