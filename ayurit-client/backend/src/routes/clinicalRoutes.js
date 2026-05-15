import { Router } from "express";
import {
  analyzeRecipe,
  getDietChart,
  getFoodCatalog,
  setDietChart
} from "../controllers/clinicalController.js";
import { authRequired } from "../middlewares/auth.js";
import { permit } from "../middlewares/rbac.js";

const router = Router();

router.get(
  "/food-catalog",
  authRequired,
  permit("superadmin", "doctor"),
  getFoodCatalog
);
router.get(
  "/diet-charts/:patientId",
  authRequired,
  permit("superadmin", "doctor", "patient"),
  getDietChart
);
router.post(
  "/diet-charts",
  authRequired,
  permit("superadmin", "doctor"),
  setDietChart
);
router.post(
  "/recipe-analyzer",
  authRequired,
  permit("superadmin", "doctor"),
  analyzeRecipe
);

export default router;
