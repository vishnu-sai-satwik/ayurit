import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Joi from "joi";
import { env } from "../config/env.js";
import { getActiveProvider } from "../config/db.js";
import { DataService } from "../services/dataService.js";
import { PlatformService } from "../services/platformService.js";
import { normalizeRole, ROLE_LIST } from "../constants/roles.js";
import { serializeUser } from "../utils/serialization.js";

// ─── Login ────────────────────────────────────────────────────────────────────

const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  role:     Joi.string().required(),
  password: Joi.string().required(),
  otp:      Joi.string().length(6).optional()
});

const sanitizeUser = (user) => {
  if (!user) return null;
  const { passwordHash, password, ...safe } = serializeUser(user);
  return safe;
};

export const issueToken = async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const role = normalizeRole(value.role);
    if (!ROLE_LIST.includes(role)) return res.status(400).json({ message: "Invalid role" });

    let user = await DataService.findUserByEmail(value.email);
    let platformUser = null;

    if (!user) {
      // Fallback to in-memory PlatformService users for development mode
      platformUser = PlatformService.findUserByEmail(value.email);
      if (platformUser) {
        user = {
          id: platformUser.id,
          _id: platformUser.id,
          name: platformUser.name,
          email: platformUser.email,
          role: platformUser.role,
          // platformUser stores plaintext password in development seed
          passwordHash: platformUser.password ? undefined : "",
          twoFactorEnabled: platformUser.twoFactorEnabled || false,
          profile: platformUser.profile || {}
        };
      }
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    let validPassword = false;
    if (platformUser && platformUser.password) {
      validPassword = platformUser.password === value.password;
    } else {
      validPassword = await bcrypt.compare(value.password, user.passwordHash || "");
    }
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const normalizedUserRole = normalizeRole(user.role) || user.role;
    if (normalizedUserRole !== role) {
      const roleNames = {
        superadmin: "Super Admin",
        admin: "Super Admin",
        doctor: "Ayurvedic Practitioner",
        patient: "Patient"
      };
      const actualRoleName = roleNames[normalizedUserRole] || user.role;
      const message = `This account belongs to ${actualRoleName} role. Please login using the ${actualRoleName} option.`;
      return res.status(403).json({ message });
    }

    if (user.twoFactorEnabled) {
      if (!value.otp) return res.status(428).json({ message: "OTP required for 2FA-enabled account" });
      PlatformService.verifyOtp(value.email, value.otp, "2fa");
    }

    const token = jwt.sign(
      {
        sub: String(user._id || user.id),
        email: user.email,
        role: normalizedUserRole,
        name: user.name
      },
      env.jwtSecret,
      { expiresIn: "8h" }
    );

    await DataService.updateUser(String(user._id || user.id), {
      lastLoginAt: new Date(),
      lastActiveAt: new Date()
    });

    await PlatformService.addAuditLog({ action: "auth.login", actor: value.email, target: normalizedUserRole });

    return res.json({ token, role: normalizedUserRole, user: sanitizeUser(user) });
  } catch (err) {
    return next(err);
  }
};

// ─── Register — role-specific schemas ────────────────────────────────────────

const baseFields = {
  firstName: Joi.string().min(2).max(50).required(),
  lastName:  Joi.string().min(1).max(50).required(),
  email:     Joi.string().email().required(),
  password:  Joi.string().min(8).required(),
  role:      Joi.string().required(),
};

const registerSchemas = {
  admin: Joi.object({
    ...baseFields,
    clinicName:  Joi.string().min(2).max(100).required(),
    clinicPhone: Joi.string().max(20).optional().allow(""),
    clinicCity:  Joi.string().max(60).optional().allow(""),
  }),
  practitioner: Joi.object({
    ...baseFields,
    inviteCode:     Joi.string().min(4).required(),
    specialization: Joi.string().max(80).optional().allow(""),
    licenseNumber:  Joi.string().max(40).optional().allow(""),
    yearsExp:       Joi.number().integer().min(0).max(60).optional(),
  }),
  patient: Joi.object({
    ...baseFields,
    age:          Joi.number().integer().min(1).max(120).required(),
    gender:       Joi.string().valid("male", "female", "other").required(),
    phone:        Joi.string().max(20).optional().allow(""),
    prakriti:     Joi.string().valid("vata","pitta","kapha","vata_pitta","pitta_kapha","vata_kapha","tridosha","unknown").optional(),
    chronicConds: Joi.string().max(300).optional().allow(""),
    allergies:    Joi.string().max(200).optional().allow(""),
    bloodGroup:   Joi.string().valid("A+","A-","B+","B-","AB+","AB-","O+","O-","unknown").optional(),
  }),
};

function buildProfile(rawRole, v) {
  if (rawRole === "admin")        return { clinicName: v.clinicName, clinicPhone: v.clinicPhone || "", clinicCity: v.clinicCity || "" };
  if (rawRole === "practitioner") return { specialization: v.specialization || "", licenseNumber: v.licenseNumber || "", yearsExp: v.yearsExp ?? null };
  if (rawRole === "patient")      return { age: v.age, gender: v.gender, phone: v.phone || "", prakriti: v.prakriti || "unknown", chronicConds: v.chronicConds || "", allergies: v.allergies || "", bloodGroup: v.bloodGroup || "unknown" };
  return {};
}

export const registerUser = async (req, res, next) => {
  try {
    const activeProviderAtStart = getActiveProvider();
    const safeBody = {
      ...req.body,
      password: req.body?.password ? "[REDACTED]" : undefined
    };

    console.log("[auth.register] Incoming request", {
      configuredProvider: env.dbProvider,
      activeProvider: activeProviderAtStart,
      payload: safeBody
    });

    if (env.dbProvider === "mongodb" && activeProviderAtStart !== "mongodb") {
      console.error("[auth.register] MongoDB is configured but inactive; registration blocked", {
        configuredProvider: env.dbProvider,
        activeProvider: activeProviderAtStart
      });
      return res.status(503).json({
        message: "Registration is temporarily unavailable because MongoDB is not active."
      });
    }

    const rawRole = String(req.body.role || "").toLowerCase();
    const schema  = registerSchemas[rawRole] || Joi.object(baseFields);

    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      console.warn("[auth.register] Validation failed", {
        email: req.body?.email,
        role: rawRole,
        details: error.details.map((d) => d.message)
      });
      return res.status(400).json({
        message: "Validation failed",
        details: error.details.map((d) => d.message),
      });
    }

    console.log("[auth.register] Validation passed", {
      email: value.email?.toLowerCase(),
      role: rawRole
    });

    const normalizedRole = normalizeRole(rawRole);
    if (!ROLE_LIST.includes(normalizedRole)) {
      console.warn("[auth.register] Invalid role after normalization", {
        requestedRole: rawRole,
        normalizedRole
      });
      return res.status(400).json({ message: "Invalid role" });
    }

    if (await DataService.findUserByEmail(value.email)) {
      console.warn("[auth.register] Duplicate email blocked", {
        email: value.email?.toLowerCase()
      });
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(value.password, 12);

    console.log("[auth.register] Creating user", {
      email: value.email?.toLowerCase(),
      role: normalizedRole,
      provider: getActiveProvider()
    });

    const user = await DataService.createUser({
      name:     `${value.firstName} ${value.lastName}`,
      email:    value.email.toLowerCase(),
      role:     normalizedRole,
      passwordHash,
      profile:  buildProfile(rawRole, value),
    });

    console.log("[auth.register] User saved", {
      id: user?.id,
      email: user?.email,
      role: user?.role,
      provider: getActiveProvider()
    });

    // For patients, also create a patient document in the patients collection
    if (normalizedRole === "patient") {
      console.log("[auth.register] Creating patient document", {
        email: user?.email,
        name: user?.name
      });
      try {
        await DataService.createPatient({
          name: user?.name,
          email: user?.email,
          role: "patient",
          encryptedNotes: ""
        });
        console.log("[auth.register] Patient document created successfully", {
          email: user?.email
        });
      } catch (patientError) {
        console.error("[auth.register] Failed to create patient document", {
          email: user?.email,
          message: patientError?.message
        });
      }
    }

    await PlatformService.addAuditLog({ action: "auth.register", actor: value.email, target: normalizedRole });

    return res.status(201).json({
      message: "Account created successfully",
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("[auth.register] Registration failed", {
      message: err.message,
      stack: err.stack,
      provider: getActiveProvider()
    });
    return next(err);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    const email = req.user?.email;
    let user = null;

    if (userId) {
      user = await DataService.findUserById(userId);
    }

    if (!user && email) {
      user = await DataService.findUserByEmail(email);
    }

    // Fallback to in-memory PlatformService dev users
    if (!user && email) {
      const platformUser = PlatformService.findUserByEmail(email);
      if (platformUser) {
        user = platformUser;
      }
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    return next(err);
  }
};

export const logout = async (req, res) => {
  return res.json({ message: "Logged out" });
};