import Joi from "joi";

export const generateDietPlanSchema = Joi.object({
  patientId: Joi.string().optional(),
  age: Joi.number().integer().min(1).max(120).required(),
  gender: Joi.string().valid("male", "female", "other").optional(),
  height: Joi.number().positive().optional(),
  weight: Joi.number().positive().required(),
  symptoms: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional().default([]),
  healthCondition: Joi.string().allow("", null).optional().default(""),
  allergies: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional().default([]),
  dietPreference: Joi.string().allow("", null).optional().default(""),
  fitnessGoal: Joi.string().allow("", null).optional().default(""),
  patientName: Joi.string().allow("", null).optional().default(""),
  patientEmail: Joi.string().email().allow("", null).optional().default(""),
  goal: Joi.string().allow("", null).optional().default(""),
  dietaryPreference: Joi.string().allow("", null).optional().default(""),
  diseases: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional().default([])
}).unknown(true);

export const dietPlanIdSchema = Joi.object({
  patientId: Joi.string().required()
});

export const regenerateDietPlanSchema = Joi.object({
  planId: Joi.string().required()
});