import Joi from "joi";
import { DataService } from "../services/dataService.js";
import availabilitySchema from "../validators/providerValidator.js";

export const getAvailability = async (req, res, next) => {
  try {
    const providerId = req.params.providerId;
    const avail = await DataService.getProviderAvailability(providerId);
    return res.json({ providerId, availability: avail || null });
  } catch (err) {
    return next(err);
  }
};

export const setAvailability = async (req, res, next) => {
  try {
    const providerId = req.params.providerId;
    const { error, value } = availabilitySchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const updated = await DataService.setProviderAvailability(providerId, value);
    return res.json({ providerId, availability: value });
  } catch (err) {
    return next(err);
  }
};
