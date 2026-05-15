import { DataService } from "./dataService.js";
import { getSocket } from "../socket/index.js";
import { notificationSchema } from "../validators/notification.js";

const getTargetRooms = (notification) => {
  const rooms = [];
  if (notification.recipientId) {
    rooms.push(`user:${notification.recipientId}`);
    rooms.push(`patient:${notification.recipientId}`);
    rooms.push(`doctor:${notification.recipientId}`);
  }
  if (notification.recipientRole) {
    rooms.push(`role:${notification.recipientRole}`);
  }
  return [...new Set(rooms)];
};

const emitNotification = (notification) => {
  const socket = getSocket();
  if (!socket) return notification;

  socket.emit("notification:created", notification);
  for (const room of getTargetRooms(notification)) {
    socket.to(room).emit("notification:created", notification);
  }

  return notification;
};

export const NotificationService = {
  async createNotification(payload) {
    const { error, value } = notificationSchema.validate(payload);
    if (error) {
      throw new Error(error.message);
    }

    const created = await DataService.createNotification(value);
    return emitNotification(created);
  },

  async notifyAppointmentBooked({ appointment, actorId }) {
    const messages = [];
    if (appointment.patientId) {
      messages.push(this.createNotification({
        recipientId: String(appointment.patientId),
        type: "appointment_booked",
        title: "Appointment booked",
        message: `Your appointment for ${new Date(appointment.dateTime).toLocaleString()} has been booked.`,
        metadata: { appointmentId: appointment.id, providerId: appointment.providerId, status: appointment.status },
        createdBy: String(actorId || "")
      }));
    }

    if (appointment.providerId) {
      messages.push(this.createNotification({
        recipientId: String(appointment.providerId),
        type: "appointment_booked",
        title: "New appointment request",
        message: `A new appointment request was created for ${new Date(appointment.dateTime).toLocaleString()}.`,
        metadata: { appointmentId: appointment.id, patientId: appointment.patientId, status: appointment.status },
        createdBy: String(actorId || "")
      }));
    }

    return Promise.all(messages);
  },

  async notifyAppointmentDecision({ appointment, decision, actorId }) {
    if (!appointment?.patientId) return null;
    const type = decision === "confirmed" ? "appointment_approved" : "appointment_rejected";
    const title = decision === "confirmed" ? "Appointment approved" : "Appointment rejected";
    const message = decision === "confirmed"
      ? `Your appointment for ${new Date(appointment.dateTime).toLocaleString()} was approved.`
      : `Your appointment for ${new Date(appointment.dateTime).toLocaleString()} was rejected.`;

    return this.createNotification({
      recipientId: String(appointment.patientId),
      type,
      title,
      message,
      metadata: { appointmentId: appointment.id, providerId: appointment.providerId, status: decision },
      createdBy: String(actorId || "")
    });
  },

  async notifyConsultationUpdated({ consultation, actorId }) {
    const targets = [];
    if (consultation?.patientId) {
      targets.push(this.createNotification({
        recipientId: String(consultation.patientId),
        type: "consultation_updated",
        title: "Consultation updated",
        message: "Your consultation has been updated by the care team.",
        metadata: { consultationId: consultation.id, status: consultation.status },
        createdBy: String(actorId || "")
      }));
    }
    if (consultation?.doctorId) {
      targets.push(this.createNotification({
        recipientId: String(consultation.doctorId),
        type: "consultation_updated",
        title: "Consultation updated",
        message: "A consultation you are assigned to was updated.",
        metadata: { consultationId: consultation.id, status: consultation.status },
        createdBy: String(actorId || "")
      }));
    }
    return Promise.all(targets);
  },

  async notifyPrescriptionAdded({ consultation, prescription, actorId }) {
    const targets = [];
    if (consultation?.patientId) {
      targets.push(this.createNotification({
        recipientId: String(consultation.patientId),
        type: "prescription_added",
        title: "Prescription added",
        message: "A new prescription has been added to your consultation.",
        metadata: { consultationId: consultation.id, prescriptionId: prescription?.id || null },
        createdBy: String(actorId || "")
      }));
    }
    if (consultation?.doctorId) {
      targets.push(this.createNotification({
        recipientId: String(consultation.doctorId),
        type: "prescription_added",
        title: "Prescription added",
        message: "A prescription was recorded for one of your consultations.",
        metadata: { consultationId: consultation.id, prescriptionId: prescription?.id || null },
        createdBy: String(actorId || "")
      }));
    }
    return Promise.all(targets);
  },

  async notifyFollowupReminder({ consultation, followup, actorId }) {
    const targets = [];
    if (consultation?.patientId) {
      targets.push(this.createNotification({
        recipientId: String(consultation.patientId),
        type: "followup_reminder",
        title: "Follow-up reminder",
        message: followup?.instructions || "Your follow-up instructions are ready.",
        metadata: { consultationId: consultation.id, dueDate: followup?.dueDate || null },
        createdBy: String(actorId || "")
      }));
    }
    if (consultation?.doctorId) {
      targets.push(this.createNotification({
        recipientId: String(consultation.doctorId),
        type: "followup_reminder",
        title: "Follow-up reminder",
        message: followup?.instructions || "Follow-up instructions were recorded.",
        metadata: { consultationId: consultation.id, dueDate: followup?.dueDate || null },
        createdBy: String(actorId || "")
      }));
    }
    return Promise.all(targets);
  },

  async notifyDietDecision({ plan, decision, actorId }) {
    const type = decision === "approved" ? "diet_approved" : "diet_rejected";
    const title = decision === "approved" ? "Diet approved" : "Diet rejected";
    const message = decision === "approved"
      ? "Your AI diet plan was approved."
      : "Your AI diet plan was rejected and needs attention.";
    const targets = [];
    if (plan?.patientId) {
      targets.push(this.createNotification({
        recipientId: String(plan.patientId),
        type,
        title,
        message,
        metadata: { planId: plan.id, version: plan.version || 1, status: decision },
        createdBy: String(actorId || "")
      }));
    }
    if (actorId) {
      targets.push(this.createNotification({
        recipientId: String(actorId),
        type,
        title,
        message: decision === "approved" ? "You approved an AI diet plan." : "You rejected an AI diet plan.",
        metadata: { planId: plan.id, version: plan.version || 1, status: decision },
        createdBy: String(actorId || "")
      }));
    }

    return Promise.all(targets);
  },

  async notifyOperationalAlert({ recipientRole, title, message, metadata = {}, actorId }) {
    return this.createNotification({
      recipientRole: recipientRole || "superadmin",
      type: "operational_alert",
      title,
      message,
      metadata,
      createdBy: String(actorId || "")
    });
  }
};