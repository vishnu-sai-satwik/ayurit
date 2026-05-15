import { Router } from "express";
import authRoutes from "./authRoutes.js";
import patientRoutes from "./patientRoutes.js";
import chartRoutes from "./chartRoutes.js";
import integrationRoutes from "./integrationRoutes.js";
import userRoutes from "./userRoutes.js";
import appointmentRoutes from "./appointmentRoutes.js";
import billingRoutes from "./billingRoutes.js";
import auditRoutes from "./auditRoutes.js";
import providerRoutes from "./providerRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import foodRoutes from "./foodRoutes.js";
import aiRoutes from "./aiRoutes.js";
import { env } from "../config/env.js";
import { getActiveProvider } from "../config/db.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    realtime: "socket.io",
    provider: getActiveProvider(),
    configuredProvider: env.dbProvider,
    cloud: env.cloudProvider
  });
});

router.use("/auth", authRoutes);
router.use("/patients", patientRoutes);
router.use("/charts", chartRoutes);
router.use("/integration", integrationRoutes);
router.use("/users", userRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/billing", billingRoutes);
router.use("/audits", auditRoutes);
router.use("/providers", providerRoutes);
router.use("/notifications", notificationRoutes);
router.use("/foods", foodRoutes);
router.use("/ai", aiRoutes);

export default router;
