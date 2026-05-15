import Joi from "joi";
import bcrypt from "bcryptjs";
import { DataService } from "../services/dataService.js";
import { PlatformService } from "../services/platformService.js";
import { env } from "../config/env.js";

const forgotSchema = Joi.object({
  email: Joi.string().email().required()
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
  purpose: Joi.string().valid("password_reset", "2fa").required()
});

const resetSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
  newPassword: Joi.string().min(8).required()
});

const twoFactorSchema = Joi.object({
  email: Joi.string().email().required()
});

const twoFactorVerifySchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required()
});

const inviteAcceptSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(8).required()
});

export const forgotPassword = async (req, res, next) => {
  try {
    const { error, value } = forgotSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const user = await DataService.findUserByEmail(value.email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = PlatformService.createOtp(value.email, "password_reset", 10);
    PlatformService.addAuditLog({
      action: "auth.forgot_password",
      actor: value.email,
      target: value.email
    });

    return res.json({
      message: "Password reset OTP generated",
      otp: env.nodeEnv === "production" ? undefined : otp.otp
    });
  } catch (err) {
    return next(err);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { error, value } = verifyOtpSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    PlatformService.verifyOtp(value.email, value.otp, value.purpose);
    PlatformService.addAuditLog({
      action: "auth.otp_verified",
      actor: value.email,
      target: value.purpose
    });

    return res.json({ message: "OTP verified" });
  } catch (err) {
    return next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { error, value } = resetSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const user = await DataService.findUserByEmail(value.email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    PlatformService.verifyOtp(value.email, value.otp, "password_reset");
    await DataService.updateUser(String(user._id || user.id), {
      passwordHash: await bcrypt.hash(value.newPassword, 12)
    });
    PlatformService.addAuditLog({
      action: "auth.password_reset",
      actor: value.email,
      target: value.email
    });

    return res.json({ message: "Password has been reset" });
  } catch (err) {
    return next(err);
  }
};

export const enableTwoFactor = async (req, res, next) => {
  try {
    const { error, value } = twoFactorSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const user = await DataService.findUserByEmail(value.email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = PlatformService.createOtp(value.email, "2fa", 10);
    PlatformService.addAuditLog({
      action: "auth.2fa_enable_requested",
      actor: value.email,
      target: value.email
    });

    return res.json({
      message: "2FA OTP generated",
      otp: env.nodeEnv === "production" ? undefined : otp.otp
    });
  } catch (err) {
    return next(err);
  }
};

export const verifyTwoFactor = async (req, res, next) => {
  try {
    const { error, value } = twoFactorVerifySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    PlatformService.verifyOtp(value.email, value.otp, "2fa");
    const user = await DataService.findUserByEmail(value.email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await DataService.updateUser(String(user._id || user.id), {
      twoFactorEnabled: true
    });
    PlatformService.addAuditLog({
      action: "auth.2fa_enabled",
      actor: value.email,
      target: value.email
    });

    return res.json({ message: "2FA enabled" });
  } catch (err) {
    return next(err);
  }
};

export const acceptInvite = async (req, res, next) => {
  try {
    const { error, value } = inviteAcceptSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const user = PlatformService.acceptInvite(value.token, value.password);
    PlatformService.addAuditLog({
      action: "auth.invite_accepted",
      actor: user.email,
      target: user.role
    });

    return res.json({
      message: "Invite accepted successfully",
      user
    });
  } catch (err) {
    return next(err);
  }
};
