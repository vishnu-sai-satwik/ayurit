import { DietPlanModel } from "../models/dietPlan.js";
import { getActiveProvider, getPgPool } from "../config/db.js";
import { serializeDietPlan, serializeList } from "../utils/serialization.js";

const memory = {
  dietPlans: [],
  ids: { dietPlan: 1 }
};

export const DietPlanService = {
  async createDietPlan(payload) {
    const provider = getActiveProvider();

    if (provider === "mongodb") {
      return serializeDietPlan(await DietPlanModel.create(payload));
    }

    if (provider === "memory") {
      const plan = {
        id: String(memory.ids.dietPlan++),
        ...payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      memory.dietPlans.unshift(plan);
      return plan;
    }

    const pool = getPgPool();
    const result = await pool.query(
      `INSERT INTO diet_plans(patient_id, patient_name, patient_email, generated_by, version, parent_plan_id, input_json, generated_diet_json, recommendations_json, foods_to_avoid_json, hydration_guidance, lifestyle_recommendations_json, meal_timings_json, status)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        payload.patientId,
        payload.patientName || "",
        payload.patientEmail || "",
        payload.generatedBy || "gemini",
        payload.version || 1,
        payload.parentPlanId || null,
        JSON.stringify(payload.input || {}),
        JSON.stringify(payload.generatedDiet || {}),
        JSON.stringify(payload.recommendations || {}),
        JSON.stringify(payload.foodsToAvoid || []),
        payload.hydrationGuidance || "",
        JSON.stringify(payload.lifestyleRecommendations || []),
        JSON.stringify(payload.mealTimings || {}),
        payload.status || "active"
      ]
    );
    return serializeDietPlan(result.rows[0]);
  },

  async listDietPlans(patientId) {
    const provider = getActiveProvider();

    if (provider === "mongodb") {
      const query = patientId ? { patientId: String(patientId) } : {};
      return serializeList(await DietPlanModel.find(query).sort({ createdAt: -1 }).lean());
    }

    if (provider === "memory") {
      const data = patientId
        ? memory.dietPlans.filter((item) => String(item.patientId) === String(patientId))
        : memory.dietPlans;
      return [...data];
    }

    const pool = getPgPool();
    const result = patientId
      ? await pool.query("SELECT * FROM diet_plans WHERE patient_id = $1 ORDER BY created_at DESC", [patientId])
      : await pool.query("SELECT * FROM diet_plans ORDER BY created_at DESC");
    return result.rows.map((row) => serializeDietPlan(row));
  },

  async findDietPlanById(planId) {
    const provider = getActiveProvider();
    const id = String(planId || "");

    if (provider === "mongodb") {
      return serializeDietPlan(await DietPlanModel.findById(id).lean());
    }

    if (provider === "memory") {
      return memory.dietPlans.find((item) => item.id === id) || null;
    }

    const pool = getPgPool();
    const result = await pool.query("SELECT * FROM diet_plans WHERE id::text = $1 LIMIT 1", [id]);
    return result.rows[0] ? serializeDietPlan(result.rows[0]) : null;
  },

  async updateDietPlan(planId, patch) {
    const provider = getActiveProvider();
    const id = String(planId || "");
    if (provider === "mongodb") {
      const updated = await DietPlanModel.findByIdAndUpdate(id, patch, { new: true, runValidators: true }).lean();
      return serializeDietPlan(updated);
    }

    if (provider === "memory") {
      const idx = memory.dietPlans.findIndex((d) => String(d.id) === id);
      if (idx === -1) throw new Error('Diet plan not found');
      memory.dietPlans[idx] = { ...memory.dietPlans[idx], ...patch, updatedAt: new Date().toISOString() };
      return memory.dietPlans[idx];
    }

    const pool = getPgPool();
    const keys = Object.keys(patch || {});
    if (!keys.length) return await this.findDietPlanById(id);
    const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const values = keys.map((k) => (typeof patch[k] === 'object' ? JSON.stringify(patch[k]) : patch[k]));
    values.push(id);
    const result = await pool.query(`UPDATE diet_plans SET ${sets}, updated_at = NOW() WHERE id::text = $${values.length} RETURNING *`, values);
    return result.rows[0] ? serializeDietPlan(result.rows[0]) : null;
  }
};