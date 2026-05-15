import Joi from "joi";
import { DataService } from "../services/dataService.js";
import { serializePrescription, serializeList } from "../utils/serialization.js";

const itemSchema = Joi.object({
  name: Joi.string().required(),
  dose: Joi.string().allow("").default(""),
  frequency: Joi.string().allow("").default("")
});

const createSchema = Joi.object({
  patientId: Joi.string().required(),
  doctorId: Joi.string().required(),
  medicines: Joi.array().items(itemSchema).min(1).required(),
  notes: Joi.string().allow("").default("")
});

export const createPrescription = async (req, res, next) => {
  try {
    const { error, value } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const created = await DataService.createPrescription({
      ...value,
      issuedBy: req.user.sub || req.user.id || "",
      issuedAt: new Date().toISOString()
    });

    return res.status(201).json(serializePrescription(created));
  } catch (err) {
    return next(err);
  }
};

export const listPrescriptions = async (req, res, next) => {
  try {
    const patientId = req.query.patientId || req.params.patientId;
    const prescriptions = await DataService.listPrescriptions(patientId);
    return res.json(serializeList(prescriptions));
  } catch (err) {
    return next(err);
  }
};
