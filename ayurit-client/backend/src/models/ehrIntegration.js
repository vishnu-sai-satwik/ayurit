import mongoose from "mongoose";

const ehrIntegrationSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    vendor: { type: String, default: "" },
    endpoint: { type: String, default: "" },
    tokenEncrypted: { type: String, default: "" },
    tokenLast4: { type: String, default: "" },
    syncFrequency: { type: String, default: "real-time" },
    conflictResolution: { type: String, default: "ayurit_overrides" },
    connectionStatus: { type: String, default: "not_configured" },
    lastTestAt: { type: Date, default: null },
    lastSyncedAt: { type: Date, default: null },
    lastError: { type: String, default: "" },
    enabled: { type: Boolean, default: false }
  },
  { timestamps: true, collection: "ehr_integrations" }
);

ehrIntegrationSchema.index({ connectionStatus: 1, updatedAt: -1 });

export const EhrIntegrationModel = mongoose.models.EhrIntegration || mongoose.model("EhrIntegration", ehrIntegrationSchema);