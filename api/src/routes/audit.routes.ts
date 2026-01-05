import { Router } from "express";
import { listAuditLogs, createAuditLog } from "../controllers/audit.controller";

const router = Router();

router.get("/logs", listAuditLogs);
router.post("/logs", createAuditLog);

export default router;
