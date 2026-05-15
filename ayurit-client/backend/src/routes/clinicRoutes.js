import { Router } from "express";
import {
  addCustomFood,
  getClinicSettings,
  updateClinicSettings
} from "../controllers/clinicController.js";
import { authRequired } from "../middlewares/auth.js";
import { permit } from "../middlewares/rbac.js";

const router = Router();

router.get(
  "/settings",
  authRequired,
  permit("superadmin", "doctor"),
  getClinicSettings
);
router.put("/settings", authRequired, permit("superadmin"), updateClinicSettings);
router.post("/custom-foods", authRequired, permit("superadmin"), addCustomFood);

export default router;
