import { Router } from "express";
import { getCurrentUser, issueToken, logout, registerUser } from "../controllers/authController.js";
import { authRequired } from "../middlewares/auth.js";
import {
	acceptInvite,
	enableTwoFactor,
	forgotPassword,
	resetPassword,
	verifyOtp,
	verifyTwoFactor
} from "../controllers/securityController.js";

const router = Router();

router.post("/register", registerUser);
router.post("/token", issueToken);
router.get("/me", authRequired, getCurrentUser);
router.post("/logout", authRequired, logout);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);
router.post("/2fa/enable", enableTwoFactor);
router.post("/2fa/verify", verifyTwoFactor);
router.post("/invites/accept", acceptInvite);

export default router;