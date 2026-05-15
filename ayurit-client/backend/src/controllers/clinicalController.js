import Joi from "joi";
import axios from "axios";
import { DataService } from "../services/dataService.js";
import { PlatformService } from "../services/platformService.js";
import { getSocket } from "../socket/index.js";
import { env } from "../config/env.js";
import { serializeEntity, serializeList } from "../utils/serialization.js";

const setChartSchema = Joi.object({
  patientId: Joi.string().required(),
  dailyMeals: Joi.object({
    morning: Joi.array().items(Joi.string()).default([]),
    afternoon: Joi.array().items(Joi.string()).default([]),
    evening: Joi.array().items(Joi.string()).default([])
  }).required(),
  notes: Joi.string().allow("").default(""),
  targetCalories: Joi.number().required()
});

const recipeSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        quantity: Joi.number().positive().required(),
        calories: Joi.number().required(),
        protein: Joi.number().required(),
        carbs: Joi.number().required(),
        fats: Joi.number().required(),
        doshaImpact: Joi.object({
          vata: Joi.number().default(0),
          pitta: Joi.number().default(0),
          kapha: Joi.number().default(0)
        }).default({ vata: 0, pitta: 0, kapha: 0 })
      })
    )
    .min(1)
    .required()
});

export const setDietChart = async (req, res, next) => {
  try {
    const { error, value } = setChartSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const chart = PlatformService.setDietChart(value.patientId, {
      dailyMeals: value.dailyMeals,
      notes: value.notes,
      targetCalories: value.targetCalories,
      updatedBy: req.user.sub
    });

    PlatformService.addAuditLog({
      action: "clinical.diet_chart_set",
      actor: req.user.sub,
      target: value.patientId
    });

    getSocket()?.to(`patient:${value.patientId}`).emit("dietchart:updated", chart);
    return res.json(serializeEntity(chart));
  } catch (err) {
    return next(err);
  }
};

export const getDietChart = async (req, res, next) => {
  try {
    const chart = PlatformService.getDietChart(req.params.patientId);
    return res.json(serializeEntity(chart || { patientId: req.params.patientId, dailyMeals: null, notes: "" }));
  } catch (err) {
    return next(err);
  }
};

export const analyzeRecipe = async (req, res, next) => {
  try {
    const { error, value } = recipeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const summary = value.items.reduce(
      (acc, item) => {
        acc.calories += item.calories * item.quantity;
        acc.protein += item.protein * item.quantity;
        acc.carbs += item.carbs * item.quantity;
        acc.fats += item.fats * item.quantity;
        acc.vata += item.doshaImpact.vata * item.quantity;
        acc.pitta += item.doshaImpact.pitta * item.quantity;
        acc.kapha += item.doshaImpact.kapha * item.quantity;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0, vata: 0, pitta: 0, kapha: 0 }
    );

    const doshaRanking = [
      { key: "vata", value: summary.vata },
      { key: "pitta", value: summary.pitta },
      { key: "kapha", value: summary.kapha }
    ].sort((a, b) => b.value - a.value);

    PlatformService.addAuditLog({
      action: "clinical.recipe_analyzed",
      actor: req.user.sub,
      target: `items:${value.items.length}`
    });

    let aiRecommendation = null;
    if (env.geminiApiKey) {
      try {
        const API_KEY = env.geminiApiKey;
        const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`;
        const aiPrompt = [
          "You are an Ayurveda nutrition assistant.",
          "Analyze this recipe summary and give a concise recommendation in under 50 words.",
          `Totals: ${JSON.stringify(summary)}`,
          `Dominant dosha impact: ${doshaRanking[0].key}`
        ].join("\n");

        const response = await axios.post(
          URL,
          { contents: [{ parts: [{ text: aiPrompt }] }] },
          { timeout: 15000, headers: { "Content-Type": "application/json" } }
        );

        aiRecommendation =
          response.data?.candidates?.[0]?.content?.parts?.map((part) => part.text).join("\n") || null;
      } catch {
        aiRecommendation = null;
      }
    }

    return res.json({
      totals: summary,
      dominantDoshaImpact: doshaRanking[0].key,
      recommendation: aiRecommendation ||
        (doshaRanking[0].key === "pitta"
          ? "Add cooling ingredients to reduce pitta load"
          : doshaRanking[0].key === "kapha"
            ? "Increase warming and light ingredients"
            : "Include grounding fats and warm textures")
    });
  } catch (err) {
    return next(err);
  }
};

export const getFoodCatalog = async (req, res, next) => {
  try {
    const foods = await DataService.listFoods();
    const customFoods = PlatformService.getClinicSettings().customFoodLibrary;
    return res.json({
      count: foods.length + customFoods.length,
      baseFoods: serializeList(foods),
      customFoods: serializeList(customFoods)
    });
  } catch (err) {
    return next(err);
  }
};
