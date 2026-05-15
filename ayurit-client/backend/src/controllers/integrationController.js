import axios from "axios";
import crypto from "crypto";
import Joi from "joi";
import { env } from "../config/env.js";
import { ClinicSettingModel } from "../models/clinicSetting.js";
import { EhrIntegrationModel } from "../models/ehrIntegration.js";
import { decryptSecret, encryptSecret, maskSecret } from "../utils/crypto.js";
import { PlatformService } from "../services/platformService.js";

const schema = Joi.object({
  ehrEndpoint: Joi.string().uri().required(),
  payload: Joi.object().required()
});

const geminiSchema = Joi.object({
  prompt: Joi.string().min(2).required(),
  context: Joi.object().optional()
});

const ehrSchema = Joi.object({
  vendor: Joi.string().allow("").optional(),
  endpoint: Joi.string().uri().allow("").optional(),
  token: Joi.string().allow("").optional(),
  enabled: Joi.boolean().optional(),
  syncFrequency: Joi.string().allow("").optional(),
  conflictResolution: Joi.string().allow("").optional()
});

const ensureEhrIntegration = async () => {
  const existing = await EhrIntegrationModel.findOne({ key: "default" }).lean();
  if (existing) return existing;
  const created = await EhrIntegrationModel.create({ key: "default" });
  return created.toObject();
};

const mergeEhrSummary = async (patch) => {
  const clinicSettings = await PlatformService.getClinicSettings();
  const currentIntegration = await ensureEhrIntegration();

  const nextSummary = {
    ...(clinicSettings.ehrSync || {}),
    enabled: patch.enabled ?? currentIntegration.enabled ?? clinicSettings.ehrSync?.enabled ?? false,
    vendor: patch.vendor ?? currentIntegration.vendor ?? clinicSettings.ehrSync?.vendor ?? "",
    endpoint: patch.endpoint ?? currentIntegration.endpoint ?? clinicSettings.ehrSync?.endpoint ?? "",
    syncFrequency: patch.syncFrequency ?? currentIntegration.syncFrequency ?? clinicSettings.ehrSync?.syncFrequency ?? "real-time",
    conflictResolution: patch.conflictResolution ?? currentIntegration.conflictResolution ?? clinicSettings.ehrSync?.conflictResolution ?? "ayurit_overrides",
    lastConnectionStatus: patch.lastConnectionStatus ?? currentIntegration.connectionStatus ?? clinicSettings.ehrSync?.lastConnectionStatus ?? "not_configured",
    lastTestAt: patch.lastTestAt ?? currentIntegration.lastTestAt ?? clinicSettings.ehrSync?.lastTestAt ?? null,
    lastSyncedAt: patch.lastSyncedAt ?? currentIntegration.lastSyncedAt ?? clinicSettings.ehrSync?.lastSyncedAt ?? null,
    tokenLast4: patch.tokenLast4 ?? currentIntegration.tokenLast4 ?? clinicSettings.ehrSync?.tokenLast4 ?? ""
  };

  await PlatformService.updateClinicSettings({ ehrSync: nextSummary });
  return nextSummary;
};

export const getEhrStatus = async (req, res, next) => {
  try {
    const integration = await ensureEhrIntegration();
    const clinicSettings = await PlatformService.getClinicSettings();
    return res.json({
      ...integration,
      tokenMasked: integration.tokenLast4 ? `********${integration.tokenLast4}` : "",
      ehrSync: clinicSettings.ehrSync || {}
    });
  } catch (err) {
    return next(err);
  }
};

export const saveEhrSettings = async (req, res, next) => {
  try {
    const { error, value } = ehrSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const integration = await ensureEhrIntegration();
    const tokenEncrypted = value.token ? encryptSecret(value.token) : integration.tokenEncrypted || "";
    const tokenLast4 = value.token ? value.token.slice(-4) : integration.tokenLast4 || "";

    const updated = await EhrIntegrationModel.findOneAndUpdate(
      { key: "default" },
      {
        $set: {
          vendor: value.vendor ?? integration.vendor,
          endpoint: value.endpoint ?? integration.endpoint,
          tokenEncrypted,
          tokenLast4,
          enabled: value.enabled ?? integration.enabled,
          syncFrequency: value.syncFrequency ?? integration.syncFrequency,
          conflictResolution: value.conflictResolution ?? integration.conflictResolution,
          connectionStatus: integration.connectionStatus || "configured"
        }
      },
      { upsert: true, new: true, runValidators: true }
    ).lean();

    await mergeEhrSummary({
      ...value,
      tokenLast4,
      lastConnectionStatus: updated.connectionStatus
    });

    await PlatformService.addAuditLog({
      action: "admin.ehr_settings_saved",
      actor: req.user.sub,
      target: updated.vendor || "ehr"
    });

    return res.json({
      ...updated,
      tokenMasked: updated.tokenLast4 ? `********${updated.tokenLast4}` : ""
    });
  } catch (err) {
    return next(err);
  }
};

export const rotateEhrToken = async (req, res, next) => {
  try {
    const integration = await ensureEhrIntegration();
    const token = crypto.randomBytes(24).toString("hex");
    const updated = await EhrIntegrationModel.findOneAndUpdate(
      { key: "default" },
      {
        $set: {
          tokenEncrypted: encryptSecret(token),
          tokenLast4: token.slice(-4),
          connectionStatus: "rotated"
        }
      },
      { upsert: true, new: true, runValidators: true }
    ).lean();

    await mergeEhrSummary({ tokenLast4: updated.tokenLast4, lastConnectionStatus: updated.connectionStatus });
    await PlatformService.addAuditLog({
      action: "admin.ehr_token_rotated",
      actor: req.user.sub,
      target: updated.vendor || integration.vendor || "ehr"
    });

    return res.json({
      message: "EHR token rotated",
      token,
      tokenMasked: `********${token.slice(-4)}`
    });
  } catch (err) {
    return next(err);
  }
};

export const testEhrConnection = async (req, res, next) => {
  try {
    const integration = await ensureEhrIntegration();
    if (!integration.endpoint) {
      return res.status(400).json({ message: "EHR endpoint is not configured" });
    }

    const token = integration.tokenEncrypted ? decryptSecret(integration.tokenEncrypted) : "";
    const response = await axios.get(integration.endpoint, {
      timeout: 10000,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });

    const updated = await EhrIntegrationModel.findOneAndUpdate(
      { key: "default" },
      {
        $set: {
          connectionStatus: response.status >= 200 && response.status < 300 ? "connected" : "degraded",
          lastTestAt: new Date(),
          lastError: ""
        }
      },
      { upsert: true, new: true }
    ).lean();

    await mergeEhrSummary({ lastConnectionStatus: updated.connectionStatus, lastTestAt: updated.lastTestAt });
    await PlatformService.addAuditLog({
      action: "admin.ehr_connection_tested",
      actor: req.user.sub,
      target: integration.vendor || "ehr",
      status: "success"
    });

    return res.json({
      message: "EHR connection successful",
      status: updated.connectionStatus,
      lastTestAt: updated.lastTestAt
    });
  } catch (err) {
    await EhrIntegrationModel.findOneAndUpdate(
      { key: "default" },
      {
        $set: {
          connectionStatus: "failed",
          lastError: err.message,
          lastTestAt: new Date()
        }
      },
      { upsert: true, new: true }
    );
    await PlatformService.addAuditLog({
      action: "admin.ehr_connection_tested",
      actor: req.user.sub,
      target: "ehr",
      status: "failed",
      message: err.message
    });
    return next(err);
  }
};

export const syncEhrStatus = async (req, res, next) => {
  try {
    const integration = await ensureEhrIntegration();
    return res.json({
      status: integration.connectionStatus,
      lastTestAt: integration.lastTestAt,
      lastSyncedAt: integration.lastSyncedAt,
      vendor: integration.vendor,
      endpoint: integration.endpoint,
      tokenMasked: integration.tokenLast4 ? `********${integration.tokenLast4}` : ""
    });
  } catch (err) {
    return next(err);
  }
};

export const pushToEhr = async (req, res, next) => {
  try {
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const response = await axios.post(value.ehrEndpoint, value.payload, {
      timeout: 10000,
      headers: {
        "Content-Type": "application/json"
      }
    });

    return res.json({
      message: "Payload pushed to EHR/HIS endpoint",
      status: response.status,
      data: response.data
    });
  } catch (err) {
    return next(err);
  }
};

export const generateWithGemini = async (req, res, next) => {
  try {
    const { error, value } = geminiSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    if (!env.geminiApiKey) {
      return res.status(500).json({ message: "Gemini API key is not configured" });
    }

    const API_KEY = env.geminiApiKey;
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`;

    const prompt = value.context
      ? `${value.prompt}\n\nContext:\n${JSON.stringify(value.context)}`
      : value.prompt;

    const response = await axios.post(
      URL,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        timeout: 20000,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    const text =
      response.data?.candidates?.[0]?.content?.parts?.map((part) => part.text).join("\n") ||
      "";

    return res.json({ text, raw: response.data });
  } catch (err) {
    return next(err);
  }
};
