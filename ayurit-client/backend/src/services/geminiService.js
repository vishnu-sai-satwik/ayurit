import axios from "axios";
import { env } from "../config/env.js";

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildPrompt = (payload) => [
  "You are an Ayurvedic diet planner.",
  "Return ONLY valid JSON with this structure:",
  '{"Monday":{"Breakfast":"","Lunch":"","Dinner":"","Snacks":""},"Tuesday":{...},"Wednesday":{...},"Thursday":{...},"Friday":{...},"Saturday":{...},"Sunday":{...},"recommendations":{"ayurvedic":[""],"mealTimings":[""],"foodsToAvoid":[""],"hydrationGuidance":"","lifestyleRecommendations":[""]}}',
  "Include breakfast, lunch, dinner, snacks for every day of the week.",
  "Each day should also be practical for meal timing guidance, hydration, and Ayurvedic notes.",
  "Make the plan practical, safe, and concise.",
  `Patient input: ${JSON.stringify(payload)}`
].join("\n");

const normalizeText = (value, fallback = "") => {
  if (typeof value === "string") {
    return value.replace(/\u00a0/g, " ").trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  return fallback;
};

const normalizeArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeText(item)).filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeDailySection = (section = {}) => ({
  Breakfast: normalizeText(section.Breakfast || section.breakfast || section.morning || section.Morning),
  Lunch: normalizeText(section.Lunch || section.lunch || section.afternoon || section.Afternoon),
  Dinner: normalizeText(section.Dinner || section.dinner || section.evening || section.Evening),
  Snacks: normalizeText(section.Snacks || section.snacks || section.snack || section.Snack)
});

const normalizeWeeklyPlan = (rawPlan = {}) => WEEK_DAYS.reduce((acc, day) => {
  acc[day] = normalizeDailySection(rawPlan[day] || rawPlan[day.toLowerCase()] || {});
  return acc;
}, {});

const normalizeRecommendations = (recommendations = {}) => ({
  ayurvedic: normalizeArray(recommendations.ayurvedic || recommendations.notes || recommendations.notesByDosha),
  mealTimings: normalizeArray(recommendations.mealTimings || recommendations.timings),
  foodsToAvoid: normalizeArray(recommendations.foodsToAvoid || recommendations.avoid || recommendations.avoidFoods),
  hydrationGuidance: normalizeText(recommendations.hydrationGuidance || recommendations.waterIntake || recommendations.hydration),
  lifestyleRecommendations: normalizeArray(recommendations.lifestyleRecommendations || recommendations.lifestyle || recommendations.routine)
});

const safeJsonParse = (text) => {
  if (!text) {
    throw new Error("Empty Gemini response");
  }

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : text).trim();

  const attemptParse = (source) => {
    const trimmed = source.trim();
    if (!trimmed) {
      throw new Error("Empty Gemini response");
    }

    return JSON.parse(trimmed.replace(/,\s*([}\]])/g, "$1"));
  };

  try {
    return attemptParse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start < 0 || end < 0 || end <= start) {
      throw new Error("Gemini response did not contain valid JSON");
    }

    return attemptParse(candidate.slice(start, end + 1));
  }
};

const isRetryableError = (error) => {
  const status = error?.response?.status || error?.status;
  return !status || status >= 500 || status === 408 || status === 429;
};

const extractResponseText = (responseData) => {
  const parts = responseData?.candidates?.[0]?.content?.parts || [];
  const text = parts.map((part) => part?.text || "").join("\n").trim();

  if (!text) {
    throw new Error("Gemini response was empty");
  }

  return text;
};

const extractJson = (text) => {
  const parsed = safeJsonParse(text);
  return {
    ...normalizeWeeklyPlan(parsed),
    recommendations: normalizeRecommendations(parsed.recommendations)
  };
};

export const generateDietPlanWithGemini = async (payload) => {
  if (!env.geminiApiKey) {
    throw new Error("Gemini API key is not configured");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.geminiApiKey}`;
  let lastError = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await axios.post(
        url,
        {
          contents: [{ parts: [{ text: buildPrompt(payload) }] }],
          generationConfig: {
            temperature: 0.4,
            responseMimeType: "application/json"
          }
        },
        {
          timeout: 20000,
          headers: { "Content-Type": "application/json" }
        }
      );

      const text = extractResponseText(response.data);
      return extractJson(text);
    } catch (error) {
      lastError = error;
      if (!isRetryableError(error) || attempt === 2) {
        break;
      }

      await wait(400 * (attempt + 1));
    }
  }

  const message = lastError?.response?.data?.error?.message || lastError?.message || "Gemini generation failed";
  throw new Error(message);
};

export const normalizeGeminiDietPayload = (payload = {}) => ({
  ...normalizeWeeklyPlan(payload),
  recommendations: normalizeRecommendations(payload.recommendations)
});