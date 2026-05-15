import mongoose from "mongoose";

const inviteSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, index: true },
    role: { type: String, required: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    accepted: { type: Boolean, default: false, index: true },
    acceptedAt: { type: Date, default: null },
    createdBy: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true, collection: "invites" }
);

inviteSchema.index({ accepted: 1, expiresAt: 1 });
inviteSchema.index({ email: 1, createdAt: -1 });

export const InviteModel = mongoose.models.Invite || mongoose.model("Invite", inviteSchema);