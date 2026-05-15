import Joi from "joi";
import { DataService } from "../services/dataService.js";
import { getSocket } from "../socket/index.js";

const createSchema = Joi.object({
  patientId: Joi.string().required(),
  metric: Joi.string().required(),
  value: Joi.number().required()
});

const updateSchema = Joi.object({
  metric: Joi.string().optional(),
  value: Joi.number().optional()
}).or("metric", "value");

const getActorId = (req) => String(req.user?.sub || req.user?.id || "");

export const createChartEntry = async (req, res, next) => {
  try {
    const { error, value } = createSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const actorId = getActorId(req);
    const patientId = req.user?.role === "patient" ? actorId : String(value.patientId);

    if (req.user?.role === "patient" && String(value.patientId) !== actorId) {
      return res.status(403).json({ message: "You can only create chart entries for your own profile" });
    }

    const chart = await DataService.createChart({
      ...value,
      patientId
    });
    const room = `patient:${patientId}`;
    getSocket()?.to(room).emit("chart:updated", chart);
    getSocket()?.emit("chart:created", chart);

    return res.status(201).json(chart);
  } catch (err) {
    return next(err);
  }
};

export const listChartEntries = async (req, res, next) => {
  try {
    const actorId = getActorId(req);
    const requestedPatientId = req.query.patientId ? String(req.query.patientId) : "";

    if (req.user?.role === "patient" && requestedPatientId && requestedPatientId !== actorId) {
      return res.status(403).json({ message: "You can only view your own chart entries" });
    }

    const patientId = req.user?.role === "patient" ? actorId : requestedPatientId;
    const charts = await DataService.listCharts(patientId);
    return res.json(charts);
  } catch (err) {
    return next(err);
  }
};

export const updateChartEntry = async (req, res, next) => {
  try {
    const { error, value } = updateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const existing = await DataService.getChartById(req.params.chartId);
    if (!existing) {
      return res.status(404).json({ message: "Chart entry not found" });
    }

    const actorId = getActorId(req);
    if (req.user?.role === "patient" && String(existing.patientId) !== actorId) {
      return res.status(403).json({ message: "You can only update your own chart entries" });
    }

    const updated = await DataService.updateChart(req.params.chartId, value);
    if (!updated) {
      return res.status(404).json({ message: "Chart entry not found" });
    }

    const room = `patient:${updated.patientId}`;
    getSocket()?.to(room).emit("chart:updated", updated);

    return res.json(updated);
  } catch (err) {
    return next(err);
  }
};
