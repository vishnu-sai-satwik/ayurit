import { Router } from "express";
import { patientProgressReport } from "../controllers/reportController.js";
import { authRequired } from "../middlewares/auth.js";
import { permit } from "../middlewares/rbac.js";

const router = Router();

router.get(
  "/patients/:patientId/progress",
  authRequired,
  permit("superadmin", "doctor", "patient"),
  patientProgressReport
);

export default router;
