import { Router } from "express";
import { authRequired } from "../middlewares/auth.js";
import { permit } from "../middlewares/rbac.js";
import { generateDiet, getDietPlanPdf, listDietPlans, regenerateDiet, approveDiet, rejectDiet } from "../controllers/aiController.js";

const router = Router();

router.post(
  "/generate-diet",
  authRequired,
  permit("superadmin", "doctor", "patient"),
  generateDiet
);

router.get(
  "/diet-plans",
  authRequired,
  permit("superadmin", "doctor", "patient"),
  listDietPlans
);

router.get(
  "/diet-plans/:id/pdf",
  authRequired,
  permit("superadmin", "doctor", "patient"),
  getDietPlanPdf
);

router.post(
  "/diet-plans/regenerate",
  authRequired,
  permit("superadmin", "doctor", "patient"),
  regenerateDiet
);

router.put(
  "/diet-plans/:id/approve",
  authRequired,
  permit("superadmin", "doctor"),
  approveDiet
);

router.put(
  "/diet-plans/:id/reject",
  authRequired,
  permit("superadmin", "doctor"),
  rejectDiet
);

export default router;