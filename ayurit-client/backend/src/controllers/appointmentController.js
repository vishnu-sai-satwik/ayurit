import Joi from "joi";
import { PlatformService } from "../services/platformService.js";
import { DataService } from "../services/dataService.js";
import { NotificationService } from "../services/notificationService.js";
import { getSocket } from "../socket/index.js";
import { serializeAppointment, serializeList } from "../utils/serialization.js";
import { getAvailableSlots, createBooking } from "../services/appointmentService.js";

const createSchema = Joi.object({
  patientId: Joi.string().required(),
  providerId: Joi.string().allow(null, "").default(null),
  doctorId: Joi.string().allow(null, "").optional(),
  dateTime: Joi.string().isoDate().required(),
  startAt: Joi.string().isoDate().optional(),
  endAt: Joi.string().isoDate().optional(),
  reason: Joi.string().allow("").default(""),
  notes: Joi.string().allow("").default(""),
  durationMinutes: Joi.number().default(30),
  meetingRoomId: Joi.string().allow("").default("")
});

const updateSchema = Joi.object({
  providerId: Joi.string().allow(null, "").optional(),
  doctorId: Joi.string().allow(null, "").optional(),
  dateTime: Joi.string().isoDate().optional(),
  startAt: Joi.string().isoDate().optional(),
  endAt: Joi.string().isoDate().optional(),
  status: Joi.string().valid("available", "requested", "booked", "in-progress", "completed", "cancelled").optional(),
  notes: Joi.string().allow("").optional(),
  meetingRoomId: Joi.string().allow("").optional()
});

const isOwnedAppointment = (appointment, user) => String(appointment?.patientId || "") === String(user?.sub || user?.id || "");

const isPatientAppointmentChangeAllowed = (currentStatus, nextStatus, patch) => {
  if (nextStatus === "cancelled") return true;
  const normalizedCurrentStatus = String(currentStatus || "requested").toLowerCase();
  if (!nextStatus && patch.dateTime && !["cancelled", "completed"].includes(normalizedCurrentStatus)) return true;
  if (nextStatus === currentStatus && patch.dateTime && !["cancelled", "completed"].includes(normalizedCurrentStatus)) return true;
  return false;
};

const patientEditableFields = new Set(["dateTime", "status"]);

const parseIso = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getDateKey = (value) => {
  const date = parseIso(value);
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const overlaps = (startA, endA, startB, endB) => {
  const a0 = parseIso(startA)?.getTime();
  const a1 = parseIso(endA)?.getTime();
  const b0 = parseIso(startB)?.getTime();
  const b1 = parseIso(endB)?.getTime();

  if ([a0, a1, b0, b1].some((item) => typeof item !== "number")) {
    return false;
  }

  return Math.max(a0, b0) < Math.min(a1, b1);
};

export const createAppointment = async (req, res, next) => {
  try {
    const { error, value } = createSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const patientId = req.user?.role === "patient"
      ? String(req.user.sub || req.user.id || "")
      : value.patientId;

    const appointment = await createBooking({
      ...value,
      patientId,
      doctorId: value.providerId || value.doctorId || null,
      requestedBy: req.user.sub,
      status: "requested"
    });

    PlatformService.addAuditLog({
      action: "appointment.created",
      actor: req.user.sub,
      target: appointment.id
    });

    getSocket()?.emit("appointment:created", appointment);
    await NotificationService.notifyAppointmentBooked({ appointment, actorId: req.user.sub }).catch(() => null);
    return res.status(201).json(serializeAppointment(appointment));
  } catch (err) {
    return next(err);
  }
};

export const updateAppointment = async (req, res, next) => {
  try {
    const { error, value } = updateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const existing = (await DataService.listAppointments({})).find((item) => String(item.id) === String(req.params.appointmentId));
    if (!existing) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (req.user?.role === "patient") {
      const disallowedFields = Object.keys(value).filter((key) => !patientEditableFields.has(key));
      if (disallowedFields.length) {
        return res.status(400).json({ message: "Patients can only reschedule or cancel using dateTime and status" });
      }

      if (!isOwnedAppointment(existing, req.user)) {
        return res.status(403).json({ message: "You can only modify your own appointments" });
      }

      if (!isPatientAppointmentChangeAllowed(existing.status, value.status, value)) {
        return res.status(400).json({ message: "Patients can only reschedule or cancel their own appointments" });
      }

      if (value.status && value.status !== existing.status && value.status !== "cancelled") {
        return res.status(400).json({ message: "Patients cannot confirm or complete appointments" });
      }
    }

    const patch = value.providerId ? { ...value, doctorId: value.providerId } : value;
    const appointment = await DataService.updateAppointment(req.params.appointmentId, patch);

    PlatformService.addAuditLog({
      action: "appointment.updated",
      actor: req.user.sub,
      target: appointment.id
    });

    getSocket()?.emit("appointment:updated", appointment);
    
    // Handle status-specific notifications
    if (value.status === "booked") {
      // Appointment booked - notify both patient and doctor
      await NotificationService.notifyAppointmentBooked({ appointment, actorId: req.user.sub }).catch(() => null);
    }
    if (value.status === "in-progress") {
      // Consultation starting - notify patient
      await NotificationService.notifyAppointmentDecision({ 
        appointment, 
        decision: "in-progress", 
        actorId: req.user.sub,
        message: "Your consultation is starting now"
      }).catch(() => null);
    }
    if (value.status === "completed") {
      await NotificationService.notifyAppointmentDecision({
        appointment,
        decision: "completed",
        actorId: req.user.sub,
        message: "Your appointment has been marked completed"
      }).catch(() => null);
    }
    if (value.status === "cancelled") {
      // Appointment cancelled - notify both
      await NotificationService.notifyAppointmentDecision({ 
        appointment, 
        decision: "cancelled", 
        actorId: req.user.sub,
        message: "Your appointment has been cancelled"
      }).catch(() => null);
    }
    
    return res.json(serializeAppointment(appointment));
  } catch (err) {
    return next(err);
  }
};

export const listAppointments = async (req, res, next) => {
  try {
    const patientId = req.user?.role === "patient" ? String(req.user.sub || req.user.id || "") : (req.query.patientId || "");
    const doctorId = req.user?.role === "doctor" ? String(req.user.sub || req.user.id || "") : (req.query.providerId || req.query.doctorId || "");
    const appointments = await DataService.listAppointments({
      patientId,
      doctorId,
      status: req.query.status
    });

    return res.json(serializeList(appointments));
  } catch (err) {
    return next(err);
  }
};

export const listSlots = async (req, res, next) => {
  try {
    const providerId = req.query.providerId || req.query.doctorId;
    const date = req.query.date; // expected YYYY-MM-DD
    if (!providerId || !date) return res.status(400).json({ message: 'providerId and date are required (YYYY-MM-DD)' });

    const slots = await getAvailableSlots(providerId, date, { durationMinutes: Number(req.query.duration) || 30 });
    return res.json({ providerId, date, slots });
  } catch (err) {
    return next(err);
  }
};

// ============================================
// DOCTOR-SPECIFIC ENDPOINTS
// ============================================

/**
 * Doctor creates available time slots
 * POST /api/appointments/slots
 */
export const createSlot = async (req, res, next) => {
  try {
    const doctorId = String(req.user?.sub || req.user?.id || "");
    const { date, startTime, endTime, durationMinutes = 30 } = req.body;

    // Validate input
    if (!date || !startTime || !endTime) {
      return res.status(400).json({ message: "date, startTime, and endTime are required" });
    }

    // Create ISO datetime strings using local date/time semantics.
    const startDate = parseIso(`${date}T${startTime}`);
    const endDate = parseIso(`${date}T${endTime}`);

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Invalid date or time format" });
    }

    const startDateTime = startDate.toISOString();
    const endDateTime = endDate.toISOString();

    if (new Date(startDateTime) >= new Date(endDateTime)) {
      return res.status(400).json({ message: "endTime must be after startTime" });
    }

    const existingSlots = await DataService.listAppointments({ doctorId, status: "available" });
    const hasConflict = existingSlots.some((slot) => {
      const slotStart = slot.startAt || slot.dateTime;
      const slotEnd = slot.endAt || new Date(new Date(slotStart).getTime() + durationMinutes * 60000).toISOString();
      return String(slotStart) === String(startDateTime) || overlaps(startDateTime, endDateTime, slotStart, slotEnd);
    });

    if (hasConflict) {
      return res.status(409).json({ message: "A slot already exists for this time range" });
    }

    // Create appointment with "available" status
    const slot = await DataService.createAppointment({
      doctorId,
      patientId: null,
      dateTime: startDateTime,
      startAt: startDateTime,
      endAt: endDateTime,
      status: "available",
      durationMinutes,
      notes: "Doctor-created available slot"
    });

    PlatformService.addAuditLog({
      action: "slot.created",
      actor: doctorId,
      target: slot.id
    });

    getSocket()?.emit("slot:created", slot);
    return res.status(201).json(serializeAppointment(slot));
  } catch (err) {
    return next(err);
  }
};

/**
 * Doctor gets their available slots
 * GET /api/appointments/doctor/slots
 */
export const getDoctorSlots = async (req, res, next) => {
  try {
    const doctorId = String(req.user?.sub || req.user?.id || "");
    const status = req.query.status || "available";
    const date = req.query.date || "";

    const slots = await DataService.listAppointments({
      doctorId,
      status
    });

    const filteredSlots = date
      ? slots.filter((slot) => getDateKey(slot.startAt || slot.dateTime) === String(date))
      : slots;

    return res.json(serializeList(filteredSlots));
  } catch (err) {
    return next(err);
  }
};

/**
 * Doctor gets their appointment queue (booked/in-progress appointments)
 * GET /api/appointments/doctor/queue
 */
export const getDoctorQueue = async (req, res, next) => {
  try {
    const doctorId = String(req.user?.sub || req.user?.id || "");

    const [appointments, patients] = await Promise.all([
      DataService.listAppointments({ doctorId }),
      DataService.listUsers({ role: "patient" })
    ]);

    const patientList = Array.isArray(patients) ? patients : patients?.items || [];
    const patientById = new Map(patientList.map((patient) => [String(patient.id || patient._id || ""), patient]));

    // Filter to show booked and in-progress appointments
    const queue = appointments
      .filter((apt) => ["booked", "in-progress"].includes(String(apt.status)))
      .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
      .map((apt) => {
        const patient = patientById.get(String(apt.patientId || ""));
        return {
          ...apt,
          patientName: patient?.name || apt.patientName || "",
          patientEmail: patient?.email || apt.patientEmail || ""
        };
      });

    return res.json(serializeList(queue));
  } catch (err) {
    return next(err);
  }
};

// ============================================
// PATIENT-SPECIFIC ENDPOINTS
// ============================================

/**
 * Patient gets available slots for a specific doctor and date
 * GET /api/appointments/available?doctorId=xxx&date=YYYY-MM-DD
 */
export const getAvailableSlotsForPatient = async (req, res, next) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({ message: "doctorId and date are required (YYYY-MM-DD)" });
    }

    const slots = await getAvailableSlots(doctorId, date, { durationMinutes: 30 });

    return res.json({
      doctorId,
      date,
      availableSlots: slots,
      count: slots.length
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Patient books an appointment
 * POST /api/appointments/book
 */
export const bookAppointment = async (req, res, next) => {
  try {
    const patientId = String(req.user?.sub || req.user?.id || "");
    const { doctorId, dateTime, reason, durationMinutes = 30 } = req.body;

    if (!doctorId || !dateTime) {
      return res.status(400).json({ message: "doctorId and dateTime are required" });
    }

    try {
      const appointment = await createBooking({
        doctorId,
        patientId,
        dateTime,
        startAt: dateTime,
        endAt: new Date(new Date(dateTime).getTime() + durationMinutes * 60000).toISOString(),
        status: "booked",
        reason: reason || "",
        durationMinutes,
        requestedBy: patientId
      });

      PlatformService.addAuditLog({
        action: "appointment.booked",
        actor: patientId,
        target: appointment.id
      });

      getSocket()?.emit("appointment:booked", appointment);
      await NotificationService.notifyAppointmentBooked({ appointment, actorId: patientId }).catch(() => null);

      return res.status(201).json(serializeAppointment(appointment));
    } catch (err) {
      // Double-booking protection: slot not available
      if (err.message.includes("not available")) {
        return res.status(409).json({ message: "Slot is no longer available. Please select another time." });
      }
      throw err;
    }
  } catch (err) {
    return next(err);
  }
};

/**
 * Patient gets their bookings
 * GET /api/appointments/patient/bookings
 */
export const getPatientBookings = async (req, res, next) => {
  try {
    const patientId = String(req.user?.sub || req.user?.id || "");

    const appointments = await DataService.listAppointments({
      patientId
    });

    return res.json(serializeList(appointments));
  } catch (err) {
    return next(err);
  }
};

// ============================================
// SHARED ENDPOINTS
// ============================================

/**
 * Get appointment by ID
 * GET /api/appointments/:appointmentId
 */
export const getAppointmentById = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;

    const appointments = await DataService.listAppointments({});
    const appointment = appointments.find(apt => String(apt.id) === String(appointmentId));

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Authorization: user can view their own appointment
    const userId = String(req.user?.sub || req.user?.id || "");
    if (req.user?.role !== "superadmin" && 
        String(appointment.patientId) !== userId && 
        String(appointment.doctorId) !== userId) {
      return res.status(403).json({ message: "Unauthorized to view this appointment" });
    }

    return res.json(serializeAppointment(appointment));
  } catch (err) {
    return next(err);
  }
};

/**
 * Update appointment status
 * PATCH /api/appointments/:appointmentId/status
 */
export const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "status is required" });
    }

    const validStatuses = ["available", "booked", "in-progress", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${validStatuses.join(", ")}` });
    }

    const appointment = await DataService.updateAppointment(appointmentId, { status });

    PlatformService.addAuditLog({
      action: "appointment.status.updated",
      actor: req.user.sub,
      target: appointmentId
    });

    getSocket()?.emit("appointment:statusUpdated", appointment);

    // Send notifications based on new status
    if (status === "in-progress") {
      await NotificationService.notifyAppointmentDecision({ 
        appointment, 
        decision: "in-progress", 
        actorId: req.user.sub,
        message: "Your consultation is starting now"
      }).catch(() => null);
    }
    if (status === "completed") {
      await NotificationService.notifyAppointmentDecision({
        appointment,
        decision: "completed",
        actorId: req.user.sub,
        message: "Your appointment has been marked completed"
      }).catch(() => null);
    }
    if (status === "cancelled") {
      await NotificationService.notifyAppointmentDecision({ 
        appointment, 
        decision: "cancelled", 
        actorId: req.user.sub,
        message: "Your appointment has been cancelled"
      }).catch(() => null);
    }

    return res.json(serializeAppointment(appointment));
  } catch (err) {
    return next(err);
  }
};

/**
 * Delete an appointment slot
 * DELETE /api/appointments/:appointmentId
 */
export const deleteAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const userId = String(req.user?.sub || req.user?.id || "");

    const appointments = await DataService.listAppointments({});
    const appointment = appointments.find((apt) => String(apt.id) === String(appointmentId));

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (req.user?.role !== "superadmin" && String(appointment.doctorId) !== userId) {
      return res.status(403).json({ message: "Only the owning doctor can delete this slot" });
    }

    if (!["available", "requested", "cancelled"].includes(String(appointment.status))) {
      return res.status(409).json({ message: "Booked appointments cannot be deleted; cancel or complete them instead" });
    }

    const deleted = await DataService.deleteAppointment(appointmentId);
    if (!deleted) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    PlatformService.addAuditLog({
      action: "appointment.deleted",
      actor: userId,
      target: appointmentId
    });

    getSocket()?.emit("appointment:deleted", { appointmentId, doctorId: appointment.doctorId, status: appointment.status });

    return res.json({ message: "Appointment deleted successfully", appointmentId });
  } catch (err) {
    return next(err);
  }
};
