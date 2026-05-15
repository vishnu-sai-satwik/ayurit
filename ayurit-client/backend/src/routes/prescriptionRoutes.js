import { Router } from "express";
import { createPrescription, listPrescriptions } from "../controllers/prescriptionController.js";
import { authRequired } from "../middlewares/auth.js";
import { permit } from "../middlewares/rbac.js";

const router = Router();

router.get(
  "/",
  authRequired,
  permit("superadmin", "doctor", "patient"),
  listPrescriptions
);

router.post(
  "/",
  authRequired,
  permit("superadmin", "doctor"),
  createPrescription
);

export default router;
