import Joi from "joi";
import { DataService } from "../services/dataService.js";
import { encryptText, decryptText } from "../services/encryptionService.js";
import { getSocket } from "../socket/index.js";

const createSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  role: Joi.string().valid("superadmin", "doctor", "patient").default("patient"),
  notes: Joi.string().allow("").default("")
});

export const createPatient = async (req, res, next) => {
  try {
    const { error, value } = createSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const patient = await DataService.createPatient({
      name: value.name,
      email: value.email,
      role: value.role,
      encryptedNotes: encryptText(value.notes)
    });

    getSocket()?.emit("patient:created", { id: patient._id || patient.id });

    return res.status(201).json({
      ...patient,
      notes: decryptText(patient.encryptedNotes || "")
    });
  } catch (err) {
    return next(err);
  }
};

export const listPatients = async (req, res, next) => {
  try {
    const patients = await DataService.listPatients();
    const payload = patients.map((patient) => ({
      ...patient,
      notes: decryptText(patient.encryptedNotes || "")
    }));
    return res.json(payload);
  } catch (err) {
    return next(err);
  }
};
