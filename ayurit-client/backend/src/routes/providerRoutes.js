import { Router } from "express";
import { getAvailability, setAvailability } from "../controllers/providerController.js";
import { authRequired } from "../middlewares/auth.js";
import { permit } from "../middlewares/rbac.js";

const router = Router();

router.get("/:providerId/availability", authRequired, permit("superadmin", "doctor"), getAvailability);
router.put("/:providerId/availability", authRequired, permit("superadmin", "doctor"), setAvailability);

export default router;
