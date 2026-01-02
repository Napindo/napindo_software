import { Router } from "express";
import {
  listPengguna,
  getPenggunaByUsername,
  createPengguna,
  updatePengguna,
  deletePengguna,
  loginPengguna,
} from "../controllers/pengguna.controller";
import { rateLimit } from "../middleware/rateLimit";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: "Terlalu banyak percobaan login. Coba lagi beberapa menit.",
  keyGenerator: (req) => `${req.ip || "unknown"}:${String(req.body?.username || "").toLowerCase()}`,
});

const passwordLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 6,
  message: "Terlalu banyak percobaan ganti password. Coba lagi nanti.",
  keyGenerator: (req) => `${req.ip || "unknown"}:${String(req.params.username || "").toLowerCase()}`,
  skip: (req) => {
    const raw = req.body?.password;
    return raw === undefined || raw === null || String(raw).trim() === "";
  },
});

router.get("/", listPengguna);
router.get("/:username", getPenggunaByUsername);
router.post("/", createPengguna);
router.put("/:username", passwordLimiter, updatePengguna);
router.delete("/:username", deletePengguna);

// login endpoint
router.post("/login", loginLimiter, loginPengguna);

export default router;
