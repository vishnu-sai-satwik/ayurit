import { Router } from "express";
import { listAuditLogs } from "../controllers/auditController.js";
import { authRequired } from "../middlewares/auth.js";
import { permit } from "../middlewares/rbac.js";

const router = Router();

router.get("/", authRequired, permit("superadmin"), listAuditLogs);

export default router;
