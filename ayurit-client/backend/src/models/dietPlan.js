import mongoose from "mongoose";

const dietPlanSchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true, index: true },
    patientName: { type: String, default: "" },
    patientEmail: { type: String, default: "" },
    generatedBy: { type: String, default: "gemini" },
    version: { type: Number, default: 1 },
    parentPlanId: { type: String, default: null },
    input: { type: mongoose.Schema.Types.Mixed, default: {} },
    generatedDiet: { type: mongoose.Schema.Types.Mixed, default: {} },
    recommendations: { type: mongoose.Schema.Types.Mixed, default: {} },
    foodsToAvoid: { type: [String], default: [] },
    hydrationGuidance: { type: String, default: "" },
    lifestyleRecommendations: { type: [String], default: [] },
    mealTimings: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, default: "active" }
  },
  { timestamps: true }
);

dietPlanSchema.index({ patientId: 1, createdAt: -1 });

export const DietPlanModel = mongoose.models.DietPlan || mongoose.model("DietPlan", dietPlanSchema);