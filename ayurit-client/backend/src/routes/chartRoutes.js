import { Router } from "express";
import { createChartEntry, listChartEntries, updateChartEntry } from "../controllers/chartController.js";
import { authRequired } from "../middlewares/auth.js";
import { permit } from "../middlewares/rbac.js";

const router = Router();

router.get("/", authRequired, permit("superadmin", "doctor", "patient"), listChartEntries);
router.post("/", authRequired, permit("superadmin", "doctor", "patient"), createChartEntry);
router.put("/:chartId", authRequired, permit("superadmin", "doctor", "patient"), updateChartEntry);

export default router;
