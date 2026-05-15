import Joi from "joi";

export const notificationTypes = [
  "appointment_booked",
  "appointment_approved",
  "appointment_rejected",
  "consultation_updated",
  "diet_approved",
  "diet_rejected",
  "followup_reminder",
  "prescription_added",
  "operational_alert"
];

export const notificationSchema = Joi.object({
  recipientId: Joi.string().allow("").default(""),
  recipientRole: Joi.string().allow("").default(""),
  type: Joi.string().valid(...notificationTypes).required(),
  title: Joi.string().trim().min(1).max(140).required(),
  message: Joi.string().trim().min(1).max(1000).required(),
  metadata: Joi.object().unknown(true).default({})
});

export const notificationIdSchema = Joi.object({
  id: Joi.string().min(1).required()
});