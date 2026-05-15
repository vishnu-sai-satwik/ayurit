import { Router } from "express";
import { generateWithGemini, pushToEhr, rotateEhrToken, saveEhrSettings, syncEhrStatus, testEhrConnection } from "../controllers/integrationController.js";
import { authRequired } from "../middlewares/auth.js";
import { permit } from "../middlewares/rbac.js";
import { env } from "../config/env.js";

const router = Router();

const integrationApiKeyGuard = (req, res, next) => {
  const key = req.headers["x-integration-api-key"];
  if (!env.integrationApiKey || key !== env.integrationApiKey) {
    return res.status(401).json({ message: "Invalid integration API key" });
  }
  return next();
};

router.post(
  "/gemini/generate",
  authRequired,
  permit("superadmin", "doctor"),
  generateWithGemini
);

router.post(
  "/ehr/push",
  authRequired,
  permit("superadmin", "doctor"),
  integrationApiKeyGuard,
  pushToEhr
);

router.get("/ehr/status", authRequired, permit("superadmin"), syncEhrStatus);
router.put("/ehr/settings", authRequired, permit("superadmin"), saveEhrSettings);
router.post("/ehr/rotate-token", authRequired, permit("superadmin"), rotateEhrToken);
router.post("/ehr/test-connection", authRequired, permit("superadmin"), testEhrConnection);

export default router;
