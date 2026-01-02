import { Router } from "express";
import { listAuditLogs } from "../controllers/audit.controller";

const router = Router();

router.get("/logs", listAuditLogs);

export default router;
