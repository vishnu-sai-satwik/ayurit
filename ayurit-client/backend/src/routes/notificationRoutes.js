import { Router } from "express";
import { authRequired } from "../middlewares/auth.js";
import { permit } from "../middlewares/rbac.js";
import { deleteNotification, listNotifications, markAllNotificationsRead, markNotificationRead } from "../controllers/notificationController.js";

const router = Router();

router.get("/", authRequired, permit("superadmin", "doctor", "patient"), listNotifications);
router.put("/read-all", authRequired, permit("superadmin", "doctor", "patient"), markAllNotificationsRead);
router.put("/:id/read", authRequired, permit("superadmin", "doctor", "patient"), markNotificationRead);
router.delete("/:id", authRequired, permit("superadmin", "doctor", "patient"), deleteNotification);

export default router;