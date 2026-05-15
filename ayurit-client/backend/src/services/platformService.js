import crypto from "crypto";
import bcrypt from "bcryptjs";
import { ROLE_LIST, ROLES, normalizeRole } from "../constants/roles.js";
import { getActiveProvider } from "../config/db.js";
import { AuditLogModel } from "../models/auditLog.js";
import { ClinicSettingModel } from "../models/clinicSetting.js";
import { InviteModel } from "../models/invite.js";
import { serializeEntity, serializeList } from "../utils/serialization.js";

const nowIso = () => new Date().toISOString();

const state = {
  users: [
    {
      id: "u-1",
      name: "System Super Admin",
      email: "admin@ayurit.com",
      role: ROLES.SUPERADMIN,
      password: "admin123",
      twoFactorEnabled: false,
      createdAt: nowIso(),
      isDevelopment: true
    },
    {
      id: "u-2",
      name: "Development Test Doctor",
      email: "doctor@ayurit.com",
      role: ROLES.DOCTOR,
      password: "doctor123",
      twoFactorEnabled: false,
      createdAt: nowIso(),
      isDevelopment: true
    },

  ],
  invites: [],
  otps: [],
  appointments: [],
  dietCharts: {},
  clinicSettings: {
    clinicName: "Ayurit Clinic",
    branding: {
      primaryColor: "#0D4A4A",
      logoUrl: ""
    },
    contact: {
      phone: "",
      email: ""
    },
    ehrSync: {
      enabled: false,
      endpoint: "",
      vendor: ""
    },
    customFoodLibrary: []
  },
  billing: {
    plan: "free_trial",
    status: "active",
    nextRenewalDate: null,
    payments: []
  },
  auditLogs: []
};

const id = (prefix) => `${prefix}-${crypto.randomUUID()}`;

const purgeExpiredOtps = () => {
  const now = Date.now();
  state.otps = state.otps.filter((item) => item.expiresAt > now);
};

const DEFAULT_SETTINGS_KEY = "default";

const defaultClinicSettings = () => ({
  key: DEFAULT_SETTINGS_KEY,
  clinicName: "Ayurit Clinic",
  branding: {
    primaryColor: "#0D4A4A",
    logoUrl: ""
  },
  contact: {
    phone: "",
    email: ""
  },
  ehrSync: {
    enabled: false,
    endpoint: "",
    vendor: "",
    syncFrequency: "real-time",
    conflictResolution: "ayurit_overrides",
    lastConnectionStatus: "not_configured",
    lastTestAt: null,
    lastSyncedAt: null
  },
  preferences: {
    timezone: "Asia/Kolkata",
    language: "en-IN"
  }
});

const toPlain = (value) => serializeEntity(value);

export const PlatformService = {
  async addAuditLog(entry) {
    const log = {
      action: entry.action,
      actor: entry.actor || "system",
      target: entry.target || "",
      status: entry.status || "success",
      message: entry.message || "",
      metadata: entry.metadata || {}
    };

    const provider = getActiveProvider();
    if (provider === "mongodb") {
      const created = await AuditLogModel.create(log);
      return toPlain(created);
    }

    const memoryLog = {
      id: id("audit"),
      ...log,
      createdAt: nowIso()
    };
    state.auditLogs.unshift(memoryLog);
    return memoryLog;
  },

  async listAuditLogs(limit = 200, filters = {}) {
    const provider = getActiveProvider();
    if (provider === "mongodb") {
      const query = {};
      if (filters.user) {
        query.$or = [{ actor: new RegExp(filters.user, "i") }, { target: new RegExp(filters.user, "i") }];
      }
      if (filters.action) query.action = new RegExp(filters.action, "i");
      if (filters.status) query.status = filters.status;
      if (filters.from || filters.to) {
        query.createdAt = {};
        if (filters.from) query.createdAt.$gte = new Date(filters.from);
        if (filters.to) query.createdAt.$lte = new Date(filters.to);
      }

      const page = Math.max(1, Number(filters.page || 1));
      const pageLimit = Math.max(1, Math.min(200, Number(limit || filters.limit || 200)));
      const [items, total] = await Promise.all([
        AuditLogModel.find(query).sort({ createdAt: -1 }).skip((page - 1) * pageLimit).limit(pageLimit).lean(),
        AuditLogModel.countDocuments(query)
      ]);

      return {
        items: serializeList(items),
        total,
        page,
        limit: pageLimit
      };
    }

    const items = state.auditLogs
      .filter((log) => {
        if (filters.user) {
          const term = String(filters.user).toLowerCase();
          const actorMatch = String(log.actor || "").toLowerCase().includes(term);
          const targetMatch = String(log.target || "").toLowerCase().includes(term);
          if (!actorMatch && !targetMatch) return false;
        }
        if (filters.action && !String(log.action || "").toLowerCase().includes(String(filters.action).toLowerCase())) return false;
        if (filters.status && String(log.status || "") !== String(filters.status)) return false;
        if (filters.from && new Date(log.createdAt) < new Date(filters.from)) return false;
        if (filters.to && new Date(log.createdAt) > new Date(filters.to)) return false;
        return true;
      })
      .slice(0, limit);

    return { items, total: items.length, page: 1, limit };
  },

  listUsers() {
    return state.users.map(({ password, ...rest }) => rest);
  },

  findUserByEmail(email) {
    return state.users.find((item) => item.email.toLowerCase() === String(email).toLowerCase());
  },

  createUser(payload) {
    const role = normalizeRole(payload.role);
    if (!ROLE_LIST.includes(role)) {
      throw new Error("Invalid role");
    }
    if (this.findUserByEmail(payload.email)) {
      throw new Error("User email already exists");
    }

    const user = {
      id: id("user"),
      name: payload.name,
      email: payload.email,
      role,
      password: payload.password || "changeme123",
      twoFactorEnabled: false,
      profile: payload.profile || {},
      createdAt: nowIso()
    };
    state.users.unshift(user);
    return { ...user, password: undefined };
  },

  updateUser(idOrEmail, payload) {
    const user = state.users.find(
      (item) => item.id === idOrEmail || item.email.toLowerCase() === String(idOrEmail).toLowerCase()
    );
    if (!user) {
      throw new Error("User not found");
    }

    if (payload.name) user.name = payload.name;
    if (payload.role) {
      const role = normalizeRole(payload.role);
      if (!ROLE_LIST.includes(role)) {
        throw new Error("Invalid role");
      }
      user.role = role;
    }
    if (payload.password) user.password = payload.password;

    return { ...user, password: undefined };
  },

  deleteUser(userId) {
    const index = state.users.findIndex((item) => item.id === userId);
    if (index < 0) {
      throw new Error("User not found");
    }
    const [removed] = state.users.splice(index, 1);
    return { ...removed, password: undefined };
  },

  async createInvite(payload) {
    const invite = {
      id: id("invite"),
      email: payload.email,
      role: normalizeRole(payload.role),
      token: crypto.randomBytes(20).toString("hex"),
      expiresAt: Date.now() + payload.ttlMinutes * 60 * 1000,
      accepted: false,
      createdAt: nowIso(),
      createdBy: payload.createdBy || ""
    };
    if (!ROLE_LIST.includes(invite.role)) {
      throw new Error("Invalid invite role");
    }
    const provider = getActiveProvider();
    if (provider === "mongodb") {
      const created = await InviteModel.create({
        email: invite.email,
        role: invite.role,
        token: invite.token,
        expiresAt: new Date(invite.expiresAt),
        accepted: false,
        createdBy: invite.createdBy
      });
      return toPlain(created);
    }

    state.invites.unshift(invite);
    return invite;
  },

  async acceptInvite(token, password) {
    const provider = getActiveProvider();
    if (provider === "mongodb") {
      const invite = await InviteModel.findOne({ token, accepted: false }).lean();
      if (!invite || new Date(invite.expiresAt).getTime() < Date.now()) {
        throw new Error("Invite token is invalid or expired");
      }

      const existing = await this.findUserByEmail(invite.email);
      const passwordHash = await bcrypt.hash(password, 12);
      if (existing) {
        await this.updateUser(existing._id || existing.id, { passwordHash });
        await InviteModel.findByIdAndUpdate(invite._id, { accepted: true, acceptedAt: new Date() });
        return existing;
      }

      const created = await this.createUser({
        name: invite.email.split("@")[0],
        email: invite.email,
        role: invite.role,
        passwordHash
      });
      await InviteModel.findByIdAndUpdate(invite._id, { accepted: true, acceptedAt: new Date() });
      return created;
    }

    const invite = state.invites.find((item) => item.token === token && !item.accepted);
    if (!invite || invite.expiresAt < Date.now()) {
      throw new Error("Invite token is invalid or expired");
    }

    const existing = this.findUserByEmail(invite.email);
    if (existing) {
      existing.password = password;
      existing.role = invite.role;
      invite.accepted = true;
      return { ...existing, password: undefined };
    }

    const created = this.createUser({
      name: invite.email.split("@")[0],
      email: invite.email,
      role: invite.role,
      password
    });
    invite.accepted = true;
    return created;
  },

  async listInvites(filters = {}) {
    const provider = getActiveProvider();
    if (provider === "mongodb") {
      const query = {};
      if (filters.status === "accepted") query.accepted = true;
      if (filters.status === "pending") query.accepted = false;
      const items = await InviteModel.find(query).sort({ createdAt: -1 }).lean();
      return serializeList(items).map((item) => ({
        ...item,
        isExpired: new Date(item.expiresAt).getTime() < Date.now()
      }));
    }

    return state.invites.map((item) => ({
      ...item,
      isExpired: item.expiresAt < Date.now()
    }));
  },

  findInviteByCode(code) {
    const invite = state.invites.find(
      (item) => item.token === code && !item.accepted
    );
    if (!invite || invite.expiresAt < Date.now()) return null;
    return invite;
  },

  createOtp(email, purpose, ttlMinutes = 10) {
    purgeExpiredOtps();
    state.otps = state.otps.filter((item) => !(item.email === email && item.purpose === purpose));

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const record = {
      id: id("otp"),
      email,
      purpose,
      otp,
      expiresAt: Date.now() + ttlMinutes * 60 * 1000,
      verified: false
    };
    state.otps.unshift(record);
    return record;
  },

  verifyOtp(email, otp, purpose) {
    purgeExpiredOtps();
    const record = state.otps.find(
      (item) => item.email === email && item.purpose === purpose && item.otp === otp
    );
    if (!record) {
      throw new Error("Invalid or expired OTP");
    }
    record.verified = true;
    return true;
  },

  resetPassword(email, otp, newPassword) {
    const user = this.findUserByEmail(email);
    if (!user) {
      throw new Error("User not found");
    }
    this.verifyOtp(email, otp, "password_reset");
    user.password = newPassword;
    return true;
  },

  setTwoFactor(email, enabled) {
    const user = this.findUserByEmail(email);
    if (!user) {
      throw new Error("User not found");
    }
    user.twoFactorEnabled = enabled;
    return true;
  },

  createAppointment(payload) {
    const appointment = {
      id: id("apt"),
      patientId: payload.patientId,
      requestedBy: payload.requestedBy,
      providerId: payload.providerId || null,
      status: payload.status || "requested",
      dateTime: payload.dateTime,
      reason: payload.reason || "",
      notes: payload.notes || "",
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    state.appointments.unshift(appointment);
    return appointment;
  },

  updateAppointment(appointmentId, payload) {
    const appointment = state.appointments.find((item) => item.id === appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }

    if (payload.status) appointment.status = payload.status;
    if (payload.providerId !== undefined) appointment.providerId = payload.providerId;
    if (payload.notes !== undefined) appointment.notes = payload.notes;
    if (payload.dateTime) appointment.dateTime = payload.dateTime;
    appointment.updatedAt = nowIso();
    return appointment;
  },

  listAppointments(filter = {}) {
    return state.appointments.filter((item) => {
      if (filter.patientId && item.patientId !== filter.patientId) return false;
      if (filter.providerId && item.providerId !== filter.providerId) return false;
      if (filter.status && item.status !== filter.status) return false;
      return true;
    });
  },

  setDietChart(patientId, chartPayload) {
    state.dietCharts[patientId] = {
      patientId,
      updatedAt: nowIso(),
      ...chartPayload
    };
    return state.dietCharts[patientId];
  },

  getDietChart(patientId) {
    return state.dietCharts[patientId] || null;
  },

  async getClinicSettings() {
    const provider = getActiveProvider();
    if (provider === "mongodb") {
      const settings = await ClinicSettingModel.findOne({ key: DEFAULT_SETTINGS_KEY }).lean();
      if (!settings) {
        const created = await ClinicSettingModel.create(defaultClinicSettings());
        return toPlain(created);
      }
      return toPlain(settings);
    }

    return state.clinicSettings;
  },

  async updateClinicSettings(payload) {
    const nextSettings = {
      ...defaultClinicSettings(),
      ...state.clinicSettings,
      ...payload,
      branding: {
        ...state.clinicSettings.branding,
        ...(payload.branding || {})
      },
      contact: {
        ...state.clinicSettings.contact,
        ...(payload.contact || {})
      },
      ehrSync: {
        ...state.clinicSettings.ehrSync,
        ...(payload.ehrSync || {})
      }
    };

    const provider = getActiveProvider();
    if (provider === "mongodb") {
      const settings = await ClinicSettingModel.findOneAndUpdate(
        { key: DEFAULT_SETTINGS_KEY },
        { $set: nextSettings },
        { upsert: true, new: true, runValidators: true }
      ).lean();
      return toPlain(settings);
    }

    state.clinicSettings = nextSettings;
    return state.clinicSettings;
  },

  addCustomFood(payload) {
    const food = {
      id: id("cfood"),
      name: payload.name,
      rasa: payload.rasa || "",
      virya: payload.virya || "",
      vipaka: payload.vipaka || "",
      calories: Number(payload.calories || 0),
      protein: Number(payload.protein || 0),
      carbs: Number(payload.carbs || 0),
      fats: Number(payload.fats || 0)
    };
    state.clinicSettings.customFoodLibrary.unshift(food);
    return food;
  },

  getBilling() {
    return state.billing;
  },

  updateBilling(payload) {
    state.billing = {
      ...state.billing,
      ...payload
    };
    return state.billing;
  },

  addPayment(payload) {
    const payment = {
      id: id("pay"),
      amount: Number(payload.amount),
      currency: payload.currency || "INR",
      method: payload.method || "card",
      status: payload.status || "paid",
      paidAt: nowIso()
    };
    state.billing.payments.unshift(payment);
    return payment;
  }
};