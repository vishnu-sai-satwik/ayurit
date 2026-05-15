import mongoose from "mongoose";

const adherenceSchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true, index: true },
    dietPlanId: { type: String, required: false, index: true },
    date: { type: String, required: true },
    completedMeals: { type: mongoose.Schema.Types.Mixed, default: {} },
    adherencePercent: { type: Number, default: 0 },
    notes: { type: String, default: "" }
  },
  { timestamps: true }
);

adherenceSchema.index({ patientId: 1, date: 1 });

export const AdherenceModel = mongoose.models.Adherence || mongoose.model("Adherence", adherenceSchema);
