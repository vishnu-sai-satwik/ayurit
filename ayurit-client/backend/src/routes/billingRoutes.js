import { Router } from "express";
import { addPayment, getBilling, updateBilling } from "../controllers/billingController.js";
import { authRequired } from "../middlewares/auth.js";
import { permit } from "../middlewares/rbac.js";

const router = Router();

router.get("/", authRequired, permit("superadmin"), getBilling);
router.put("/", authRequired, permit("superadmin"), updateBilling);
router.post("/payments", authRequired, permit("superadmin"), addPayment);

export default router;
