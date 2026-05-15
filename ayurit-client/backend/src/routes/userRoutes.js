import { Router } from "express";
import {
  createInvite,
  createUser,
  deleteUser,
  listPractitioners,
  listInvites,
  listUsers,
  updateUser
} from "../controllers/userController.js";
import { authRequired } from "../middlewares/auth.js";
import { permit } from "../middlewares/rbac.js";

const router = Router();

router.get("/", authRequired, permit("superadmin"), listUsers);
router.get("/practitioners", authRequired, permit("superadmin", "doctor"), listPractitioners);
router.post("/", authRequired, permit("superadmin"), createUser);
router.put("/:userId", authRequired, permit("superadmin"), updateUser);
router.delete("/:userId", authRequired, permit("superadmin"), deleteUser);

router.get("/invites", authRequired, permit("superadmin"), listInvites);
router.post("/invites", authRequired, permit("superadmin"), createInvite);

export default router;
