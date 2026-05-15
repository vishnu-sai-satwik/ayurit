import Joi from "joi";
import bcrypt from "bcryptjs";
import { DataService } from "../services/dataService.js";
import { PlatformService } from "../services/platformService.js";
import { normalizeRole } from "../constants/roles.js";

const sanitizeUser = (user) => {
  if (!user) return null;
  const { passwordHash, password, ...safe } = user;
  return safe;
};

const createUserSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  role: Joi.string().required(),
  password: Joi.string().min(8).optional()
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).optional(),
  role: Joi.string().optional(),
  password: Joi.string().min(8).optional()
});

const inviteSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().required(),
  ttlMinutes: Joi.number().min(1).max(1440).default(1440)
});

export const listUsers = async (req, res, next) => {
  try {
    const { page, limit, search, role, status } = req.query;
    const result = await DataService.listUsers({ page, limit, search, role, status });

    if (Array.isArray(result)) {
      return res.json(result.map(sanitizeUser));
    }

    return res.json({
      ...result,
      items: result.items.map(sanitizeUser)
    });
  } catch (err) {
    return next(err);
  }
};

export const listPractitioners = async (req, res, next) => {
  try {
    const users = await DataService.listUsers();
    const practitioners = users
      .filter((user) => user.role === "doctor")
      .map(sanitizeUser);
    return res.json(practitioners);
  } catch (err) {
    return next(err);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { error, value } = createUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const user = await DataService.createUser({
      name: value.name,
      email: value.email.toLowerCase(),
      role: normalizeRole(value.role),
      passwordHash: await bcrypt.hash(value.password || "changeme123", 12),
      profile: {}
    });

    await PlatformService.addAuditLog({
      action: "admin.user_created",
      actor: req.user.sub,
      target: user.email
    });

    return res.status(201).json(sanitizeUser(user));
  } catch (err) {
    return next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { error, value } = updateUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const user = await DataService.updateUser(req.params.userId, {
      ...value,
      role: value.role ? normalizeRole(value.role) : undefined,
      passwordHash: value.password ? await bcrypt.hash(value.password, 12) : undefined
    });

    await PlatformService.addAuditLog({
      action: "admin.user_updated",
      actor: req.user.sub,
      target: user.email
    });

    return res.json(sanitizeUser(user));
  } catch (err) {
    return next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const user = await DataService.deleteUser(req.params.userId);
    await PlatformService.addAuditLog({
      action: "admin.user_deleted",
      actor: req.user.sub,
      target: user.email
    });

    return res.json({ message: "User deleted", user: sanitizeUser(user) });
  } catch (err) {
    return next(err);
  }
};

export const createInvite = async (req, res, next) => {
  try {
    const { error, value } = inviteSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const invite = await PlatformService.createInvite({
      email: value.email,
      role: normalizeRole(value.role),
      ttlMinutes: value.ttlMinutes
    });

    await PlatformService.addAuditLog({
      action: "admin.invite_created",
      actor: req.user.sub,
      target: value.email
    });

    return res.status(201).json(invite);
  } catch (err) {
    return next(err);
  }
};

export const listInvites = async (req, res, next) => {
  try {
    const invites = await PlatformService.listInvites({ status: req.query.status });
    return res.json(invites);
  } catch (err) {
    return next(err);
  }
};
