import Joi from "joi";
import { PlatformService } from "../services/platformService.js";

const updateSettingsSchema = Joi.object({
  clinicName: Joi.string().optional(),
  branding: Joi.object({
    primaryColor: Joi.string().optional(),
    logoUrl: Joi.string().allow("").optional()
  }).optional(),
  contact: Joi.object({
    phone: Joi.string().allow("").optional(),
    email: Joi.string().email().allow("").optional()
  }).optional(),
  ehrSync: Joi.object({
    enabled: Joi.boolean().optional(),
    endpoint: Joi.string().allow("").optional(),
    vendor: Joi.string().allow("").optional()
  }).optional()
});

const customFoodSchema = Joi.object({
  name: Joi.string().required(),
  rasa: Joi.string().allow("").optional(),
  virya: Joi.string().allow("").optional(),
  vipaka: Joi.string().allow("").optional(),
  calories: Joi.number().required(),
  protein: Joi.number().required(),
  carbs: Joi.number().required(),
  fats: Joi.number().required()
});

export const getClinicSettings = async (req, res, next) => {
  try {
    return res.json(await PlatformService.getClinicSettings());
  } catch (err) {
    return next(err);
  }
};

export const updateClinicSettings = async (req, res, next) => {
  try {
    const { error, value } = updateSettingsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const settings = await PlatformService.updateClinicSettings(value);
    await PlatformService.addAuditLog({
      action: "clinic.settings_updated",
      actor: req.user.sub,
      target: "clinic_settings"
    });

    return res.json(settings);
  } catch (err) {
    return next(err);
  }
};

export const addCustomFood = async (req, res, next) => {
  try {
    const { error, value } = customFoodSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const food = PlatformService.addCustomFood(value);
    await PlatformService.addAuditLog({
      action: "clinic.custom_food_added",
      actor: req.user.sub,
      target: food.name
    });

    return res.status(201).json(food);
  } catch (err) {
    return next(err);
  }
};
