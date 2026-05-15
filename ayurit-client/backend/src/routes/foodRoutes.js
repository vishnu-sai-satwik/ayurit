import { Router } from "express";
import { createFood, listFoods } from "../controllers/foodController.js";
import { authRequired } from "../middlewares/auth.js";
import { permit } from "../middlewares/rbac.js";

const router = Router();

router.get("/", authRequired, permit("superadmin", "doctor", "patient"), listFoods);
router.post("/", authRequired, permit("superadmin", "doctor"), createFood);

export default router;
