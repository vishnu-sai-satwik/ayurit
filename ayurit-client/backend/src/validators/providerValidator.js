import Joi from 'joi';

export const availabilitySchema = Joi.object({
  timezone: Joi.string().default('UTC'),
  workingDays: Joi.array().items(Joi.string().valid('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')).default(['Monday','Tuesday','Wednesday','Thursday','Friday']),
  startHour: Joi.number().min(0).max(23).default(9),
  endHour: Joi.number().min(1).max(24).default(17),
  slotMinutes: Joi.number().min(5).max(240).default(30),
  breaks: Joi.array().items(Joi.object({ start: Joi.string().isoDate().required(), end: Joi.string().isoDate().required() })).default([]),
  unavailableDates: Joi.array().items(Joi.string()).default([]),
  weeklySchedule: Joi.object().pattern(Joi.string(), Joi.object({ startHour: Joi.number().min(0).max(23), endHour: Joi.number().min(1).max(24), slotMinutes: Joi.number().min(5).max(240) })).default({})
});

export default availabilitySchema;
