import Joi from "joi";
import { DataService } from "../services/dataService.js";
import { serializeList, serializeEntity } from "../utils/serialization.js";

const readSchema = Joi.object({
  id: Joi.string().min(1).required()
});

export const listNotifications = async (req, res, next) => {
  try {
    const notifications = await DataService.listNotifications({
      recipientId: req.user?.sub || req.user?.id || "",
      recipientRole: req.user?.role || "",
      unreadOnly: req.query.unreadOnly === "true"
    });

    return res.json(serializeList(notifications));
  } catch (err) {
    return next(err);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const { error } = readSchema.validate({ id: req.params.id });
    if (error) return res.status(400).json({ message: error.message });

    const updated = await DataService.markNotificationRead(req.params.id, req.user?.sub || req.user?.id || "", req.user?.role || "");
    if (!updated) return res.status(404).json({ message: "Notification not found" });
    return res.json(serializeEntity(updated));
  } catch (err) {
    return next(err);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    const updated = await DataService.markAllNotificationsRead(req.user?.sub || req.user?.id || "", req.user?.role || "");
    return res.json({ updatedCount: updated });
  } catch (err) {
    return next(err);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const deleted = await DataService.deleteNotification(req.params.id, req.user?.sub || req.user?.id || "", req.user?.role || "");
    if (!deleted) return res.status(404).json({ message: "Notification not found" });
    return res.json({ message: "Notification deleted" });
  } catch (err) {
    return next(err);
  }
};