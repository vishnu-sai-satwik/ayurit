import { Router } from "express";
import { createPatient, listPatients } from "../controllers/patientController.js";
import { authRequired } from "../middlewares/auth.js";
import { permit } from "../middlewares/rbac.js";

const router = Router();

router.get("/", authRequired, permit("superadmin", "doctor"), listPatients);
router.post("/", authRequired, permit("superadmin"), createPatient);

export default router;
