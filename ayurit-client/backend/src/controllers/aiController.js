import Joi from "joi";
import PDFDocument from "pdfkit";
import { generateDietPlanSchema, regenerateDietPlanSchema } from "../validators/dietPlan.js";
import { generateDietPlanWithGemini, normalizeGeminiDietPayload } from "../services/geminiService.js";
import { DietPlanService } from "../services/dietPlanService.js";
import { NotificationService } from "../services/notificationService.js";
import { getSocket } from "../socket/index.js";

const toArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
};

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const emptyDailyMeals = () => ({ Breakfast: "", Lunch: "", Dinner: "", Snacks: "" });

const normalizeMealTimings = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean).map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) return value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
  if (value && typeof value === "object") return Object.entries(value).map(([key, item]) => `${key}: ${item}`).filter(Boolean);
  return [];
};

const getMealTimings = (recommendations = {}) => normalizeMealTimings(recommendations.mealTimings || recommendations.timings);

const getWaterIntake = (plan = {}) => plan.hydrationGuidance || plan.recommendations?.hydrationGuidance || "Sip warm water regularly through the day.";

const normalizeHistoryPlan = (plan) => ({
  ...plan,
  generatedDiet: normalizeGeminiDietPayload(plan.generatedDiet || {}),
  recommendations: {
    ...plan.recommendations,
    ayurvedic: toArray(plan.recommendations?.ayurvedic),
    foodsToAvoid: toArray(plan.recommendations?.foodsToAvoid),
    lifestyleRecommendations: toArray(plan.recommendations?.lifestyleRecommendations),
    mealTimings: plan.recommendations?.mealTimings || []
  },
  foodsToAvoid: toArray(plan.foodsToAvoid),
  lifestyleRecommendations: toArray(plan.lifestyleRecommendations),
  mealTimings: getMealTimings(plan.recommendations || plan)
});

const normalizeRequest = (req, value) => {
  const diseases = toArray(value.diseases);
  const symptoms = toArray(value.symptoms);
  const allergies = toArray(value.allergies);
  const goal = String(value.goal || value.fitnessGoal || "").trim();
  const dietaryPreference = String(value.dietaryPreference || value.dietPreference || "").trim();

  return {
    patientId: String(value.patientId || req.user?.sub || "").trim(),
    patientName: String(value.patientName || req.user?.name || "").trim(),
    patientEmail: String(value.patientEmail || req.user?.email || "").trim(),
    age: value.age,
    gender: value.gender || req.user?.gender || "",
    height: value.height,
    weight: value.weight,
    symptoms: symptoms.length ? symptoms : diseases,
    healthCondition: String(value.healthCondition || diseases.join(", ") || "").trim(),
    allergies,
    dietPreference: dietaryPreference,
    fitnessGoal: goal,
    prakriti: String(value.prakriti || value.dosha || "").trim(),
    raw: value
  };
};

const normalizeDailyPlan = (rawPlan) => ({
  Monday: rawPlan.Monday || rawPlan.monday || emptyDailyMeals(),
  Tuesday: rawPlan.Tuesday || rawPlan.tuesday || emptyDailyMeals(),
  Wednesday: rawPlan.Wednesday || rawPlan.wednesday || emptyDailyMeals(),
  Thursday: rawPlan.Thursday || rawPlan.thursday || emptyDailyMeals(),
  Friday: rawPlan.Friday || rawPlan.friday || emptyDailyMeals(),
  Saturday: rawPlan.Saturday || rawPlan.saturday || emptyDailyMeals(),
  Sunday: rawPlan.Sunday || rawPlan.sunday || emptyDailyMeals()
});

const fallbackDietPlan = (input) => {
  const meals = {
    Monday: { Breakfast: "Warm oats with cardamom", Lunch: "Rice, dal, cucumber", Dinner: "Soup with steamed vegetables", Snacks: "Fruit and herbal tea" },
    Tuesday: { Breakfast: "Poha with curry leaves", Lunch: "Millet roti with sabzi", Dinner: "Khichdi with ghee", Snacks: "Roasted seeds" },
    Wednesday: { Breakfast: "Idli with coconut chutney", Lunch: "Brown rice and lentils", Dinner: "Light vegetable stew", Snacks: "Buttermilk" },
    Thursday: { Breakfast: "Upma with vegetables", Lunch: "Chapati, dal, greens", Dinner: "Vegetable soup", Snacks: "Dates and nuts" },
    Friday: { Breakfast: "Moong dal chilla", Lunch: "Quinoa bowl with veggies", Dinner: "Khichdi", Snacks: "Steamed fruit" },
    Saturday: { Breakfast: "Dalia porridge", Lunch: "Rice, sambar, salad", Dinner: "Lauki soup", Snacks: "Coconut water" },
    Sunday: { Breakfast: "Pancake-style millet cheela", Lunch: "Balanced thali", Dinner: "Soup and sabzi", Snacks: "Fresh fruit" }
  };

  return {
    ...normalizeDailyPlan(meals),
    recommendations: {
      ayurvedic: ["Keep meals warm, freshly cooked, and easy to digest."],
      mealTimings: ["Breakfast 7-9 AM", "Lunch 12-1 PM", "Dinner 6-7:30 PM"],
      foodsToAvoid: toArray(input.allergies),
      hydrationGuidance: "Sip warm water through the day and avoid ice-cold drinks.",
      lifestyleRecommendations: ["Sleep early", "Walk after meals", "Avoid overeating"]
    }
  };
};

const buildDietPdf = async (res, plan) => {
  const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });
  const finished = new Promise((resolve, reject) => {
    res.on("close", resolve);
    doc.on("error", reject);
    doc.on("end", resolve);
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="diet-plan-${plan.id || "export"}.pdf"`);

  doc.pipe(res);

  const margin = 40;
  const pageWidth = doc.page.width - margin * 2;
  const columnWidths = [90, (pageWidth - 90) / 4, (pageWidth - 90) / 4, (pageWidth - 90) / 4, (pageWidth - 90) / 4];
  const headerHeight = 26;
  const padding = 8;

  const ensureSpace = (neededHeight = 60) => {
    if (doc.y + neededHeight > doc.page.height - margin) {
      doc.addPage();
    }
  };

  const drawCell = (x, y, width, height, text, options = {}) => {
    const { fill = "#ffffff", stroke = "#d9e2dc", color = "#111111", fontSize = 9, align = "left" } = options;
    doc.save();
    doc.rect(x, y, width, height).fillAndStroke(fill, stroke);
    doc.fillColor(color).fontSize(fontSize).text(text || "", x + padding, y + padding, {
      width: width - padding * 2,
      align,
      lineBreak: true
    });
    doc.restore();
  };

  const writeHeader = () => {
    doc.fontSize(22).fillColor("#0d4a4a").text("AyurIT AI Diet Plan", { align: "center" });
    doc.moveDown(0.35);
    doc.fontSize(11).fillColor("#4b5d55").text(`Patient: ${plan.patientName || "Patient"}`, { align: "center" });
    doc.text(`Plan ID: ${plan.id || "-"}   Version: ${plan.version || 1}   Status: ${plan.status || "active"}`, { align: "center" });
    doc.moveDown(1.1);
  };

  const writeWeeklyTable = () => {
    ensureSpace(200);
    const startX = margin;
    let y = doc.y;
    const headers = ["Day", "Breakfast", "Lunch", "Dinner", "Snacks"];

    let x = startX;
    headers.forEach((header, index) => {
      drawCell(x, y, columnWidths[index], headerHeight, header, { fill: "#0d4a4a", stroke: "#0d4a4a", color: "#ffffff", fontSize: 10, align: "center" });
      x += columnWidths[index];
    });

    y += headerHeight;
    WEEK_DAYS.forEach((day) => {
      const meals = plan.generatedDiet?.[day] || emptyDailyMeals();
      const rowValues = [day, meals.Breakfast || "-", meals.Lunch || "-", meals.Dinner || "-", meals.Snacks || "-"];
      const rowHeight = Math.max(
        28,
        ...rowValues.map((text, index) => doc.heightOfString(String(text), { width: columnWidths[index] - padding * 2 }) + padding * 2)
      );

      ensureSpace(rowHeight + 8);
      x = startX;
      rowValues.forEach((text, index) => {
        drawCell(x, y, columnWidths[index], rowHeight, text, {
          fill: index === 0 ? "#eef7f4" : "#ffffff",
          stroke: "#d9e2dc",
          color: "#10231e",
          fontSize: 9,
          align: index === 0 ? "center" : "left"
        });
        x += columnWidths[index];
      });

      y += rowHeight;
    });

    doc.y = y + 18;
  };

  const writeSection = (title, items, emptyText) => {
    ensureSpace(70);
    doc.fontSize(13).fillColor("#0d4a4a").text(title, { underline: true });
    doc.moveDown(0.3);

    if (!items || !items.length) {
      doc.fontSize(10).fillColor("#52615d").text(emptyText || "No data available.");
      doc.moveDown(0.4);
      return;
    }

    items.forEach((item) => {
      ensureSpace(24);
      doc.fontSize(10).fillColor("#1f2f2a").text(`• ${item}`);
    });
    doc.moveDown(0.5);
  };

  const writeParagraph = (title, value, emptyText) => {
    ensureSpace(60);
    doc.fontSize(13).fillColor("#0d4a4a").text(title, { underline: true });
    doc.moveDown(0.2);
    doc.fontSize(10).fillColor("#1f2f2a").text(value || emptyText || "No data available.", { lineGap: 2 });
    doc.moveDown(0.5);
  };

  writeHeader();
  writeWeeklyTable();
  writeParagraph("Water Intake", getWaterIntake(plan), "Sip warm water regularly through the day.");
  writeSection("Meal Timings", getMealTimings(plan.recommendations), "Breakfast 7-9 AM, Lunch 12-1 PM, Dinner 6-7:30 PM");
  writeSection("Ayurvedic Notes", toArray(plan.recommendations?.ayurvedic), "Keep meals warm, fresh, and easy to digest.");
  writeSection("Foods to Avoid", toArray(plan.foodsToAvoid), "No specific foods recorded.");
  writeSection("Lifestyle Recommendations", toArray(plan.lifestyleRecommendations), "Sleep early, walk after meals, and keep meals regular.");

  doc.end();
  await finished;
};

export const generateDiet = async (req, res, next) => {
  try {
    const { error, value } = generateDietPlanSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ message: error.message, details: error.details.map((item) => item.message) });
    }

    const normalizedInput = normalizeRequest(req, value);
    if (!normalizedInput.patientId) {
      return res.status(400).json({ message: "Unable to identify patient for diet generation" });
    }

    let generated;
    try {
      generated = await generateDietPlanWithGemini(normalizedInput);
    } catch {
      generated = fallbackDietPlan(normalizedInput);
    }

    const generatedDiet = normalizeDailyPlan(generated);
    const recommendations = {
      ...fallbackDietPlan(normalizedInput).recommendations,
      ...normalizeGeminiDietPayload({ recommendations: generated.recommendations || {} }).recommendations
    };

    const dietPlan = await DietPlanService.createDietPlan({
      patientId: normalizedInput.patientId,
      patientName: normalizedInput.patientName,
      patientEmail: normalizedInput.patientEmail,
      input: { ...normalizedInput, raw: undefined },
      generatedDiet,
      recommendations,
      foodsToAvoid: toArray(recommendations.foodsToAvoid),
      hydrationGuidance: String(recommendations.hydrationGuidance || ""),
      lifestyleRecommendations: toArray(recommendations.lifestyleRecommendations),
      mealTimings: normalizeMealTimings(recommendations.mealTimings),
      generatedBy: "gemini",
      status: "active"
    });

    getSocket()?.to('role:doctor').emit('diet:created', dietPlan);
    getSocket()?.to(`patient:${dietPlan.patientId}`).emit('diet:created', dietPlan);

    return res.status(201).json({
      message: "Diet plan generated successfully",
      dietPlan
    });
  } catch (err) {
    return next(err);
  }
};

export const listDietPlans = async (req, res, next) => {
  try {
    const patientId = req.query.patientId || (req.user?.role === "patient" ? req.user?.sub : "");
    const plans = await DietPlanService.listDietPlans(patientId);
    return res.json(plans);
  } catch (err) {
    return next(err);
  }
};

export const getDietPlanPdf = async (req, res, next) => {
  try {
    const plan = await DietPlanService.findDietPlanById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: "Diet plan not found" });
    }

    if (req.user?.role === "patient" && String(plan.patientId) !== String(req.user.sub)) {
      return res.status(403).json({ message: "You can only download your own diet plans" });
    }

    await buildDietPdf(res, normalizeHistoryPlan(plan));
    return undefined;
  } catch (err) {
    return next(err);
  }
};

export const regenerateDiet = async (req, res, next) => {
  try {
    const { error, value } = regenerateDietPlanSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const existing = await DietPlanService.findDietPlanById(value.planId);
    if (!existing) {
      return res.status(404).json({ message: "Diet plan not found" });
    }

    const nextInput = existing.input || { patientId: existing.patientId };
    const generated = await generateDietPlanWithGemini(nextInput).catch(() => fallbackDietPlan(nextInput));
    const normalizedGenerated = normalizeGeminiDietPayload(generated);

    const nextPlan = await DietPlanService.createDietPlan({
      patientId: existing.patientId,
      patientName: existing.patientName || "",
      patientEmail: existing.patientEmail || "",
      input: nextInput,
      generatedDiet: normalizeDailyPlan(normalizedGenerated),
      recommendations: {
        ...fallbackDietPlan(nextInput).recommendations,
        ...normalizedGenerated.recommendations
      },
      foodsToAvoid: toArray(normalizedGenerated.recommendations?.foodsToAvoid),
      hydrationGuidance: String(normalizedGenerated.recommendations?.hydrationGuidance || ""),
      lifestyleRecommendations: toArray(normalizedGenerated.recommendations?.lifestyleRecommendations),
      mealTimings: normalizeMealTimings(normalizedGenerated.recommendations?.mealTimings),
      generatedBy: "gemini",
      parentPlanId: existing.id,
      version: Number(existing.version || 1) + 1,
      status: "active"
    });

    getSocket()?.to('role:doctor').emit('diet:created', nextPlan);
    getSocket()?.to(`patient:${nextPlan.patientId}`).emit('diet:created', nextPlan);

    return res.status(201).json({ message: "Diet plan regenerated successfully", dietPlan: nextPlan });
  } catch (err) {
    return next(err);
  }
};

export const approveDiet = async (req, res, next) => {
  try {
    const planId = req.params.id;
    const plan = await DietPlanService.findDietPlanById(planId);
    if (!plan) return res.status(404).json({ message: 'Diet plan not found' });
    const updated = await DietPlanService.updateDietPlan(planId, { status: 'approved', reviewedBy: req.user?.sub || req.user?.id, reviewedAt: new Date().toISOString() });
    await NotificationService.notifyDietDecision({ plan: updated, decision: 'approved', actorId: req.user?.sub || req.user?.id }).catch(() => null);
    getSocket()?.to(`patient:${updated.patientId}`).emit("diet:updated", updated);
    getSocket()?.to('role:doctor').emit('diet:updated', updated);
    return res.json({ message: 'Diet plan approved', dietPlan: updated });
  } catch (err) {
    return next(err);
  }
};

export const rejectDiet = async (req, res, next) => {
  try {
    const planId = req.params.id;
    const { reason } = req.body || {};
    const plan = await DietPlanService.findDietPlanById(planId);
    if (!plan) return res.status(404).json({ message: 'Diet plan not found' });
    const updated = await DietPlanService.updateDietPlan(planId, { status: 'rejected', reviewedBy: req.user?.sub || req.user?.id, reviewedAt: new Date().toISOString(), reviewNote: reason || '' });
    await NotificationService.notifyDietDecision({ plan: updated, decision: 'rejected', actorId: req.user?.sub || req.user?.id }).catch(() => null);
    getSocket()?.to(`patient:${updated.patientId}`).emit("diet:updated", updated);
    getSocket()?.to('role:doctor').emit('diet:updated', updated);
    return res.json({ message: 'Diet plan rejected', dietPlan: updated });
  } catch (err) {
    return next(err);
  }
};