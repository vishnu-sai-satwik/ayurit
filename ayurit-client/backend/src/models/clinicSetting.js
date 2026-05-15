import mongoose from "mongoose";

const clinicSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    clinicName: { type: String, default: "Ayurit Clinic" },
    branding: {
      primaryColor: { type: String, default: "#0D4A4A" },
      logoUrl: { type: String, default: "" }
    },
    contact: {
      phone: { type: String, default: "" },
      email: { type: String, default: "" }
    },
    ehrSync: {
      enabled: { type: Boolean, default: false },
      endpoint: { type: String, default: "" },
      vendor: { type: String, default: "" },
      syncFrequency: { type: String, default: "real-time" },
      conflictResolution: { type: String, default: "ayurit_overrides" },
      lastConnectionStatus: { type: String, default: "not_configured" },
      lastTestAt: { type: Date, default: null },
      lastSyncedAt: { type: Date, default: null }
    },
    preferences: {
      timezone: { type: String, default: "Asia/Kolkata" },
      language: { type: String, default: "en-IN" }
    }
  },
  { timestamps: true, collection: "clinic_settings" }
);

export const ClinicSettingModel = mongoose.models.ClinicSetting || mongoose.model("ClinicSetting", clinicSettingSchema);