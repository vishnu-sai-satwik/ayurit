import { Router } from "express";
import {
  createAppointment,
  listAppointments,
  updateAppointment,
  listSlots,
  createSlot,
  getDoctorSlots,
  getDoctorQueue,
  getAvailableSlotsForPatient,
  bookAppointment,
  getPatientBookings,
  getAppointmentById,
  updateAppointmentStatus,
  deleteAppointment
} from "../controllers/appointmentController.js";
import { authRequired } from "../middlewares/auth.js";
import { permit } from "../middlewares/rbac.js";

const router = Router();

router.post(
  "/doctor/slots",
  authRequired,
  permit("superadmin", "doctor"),
  createSlot
);

router.get(
  "/doctor/slots",
  authRequired,
  permit("superadmin", "doctor"),
  getDoctorSlots
);

router.get(
  "/doctor/queue",
  authRequired,
  permit("superadmin", "doctor"),
  getDoctorQueue
);

router.get(
  "/patient/available",
  authRequired,
  permit("superadmin", "patient"),
  getAvailableSlotsForPatient
);

router.post(
  "/patient/book",
  authRequired,
  permit("superadmin", "patient"),
  bookAppointment
);

router.get(
  "/patient/bookings",
  authRequired,
  permit("superadmin", "patient"),
  getPatientBookings
);

router.patch(
  "/:appointmentId/status",
  authRequired,
  permit("superadmin", "doctor"),
  updateAppointmentStatus
);

router.delete(
  "/:appointmentId",
  authRequired,
  permit("superadmin", "doctor"),
  deleteAppointment
);

router.get(
  "/slots",
  authRequired,
  permit("superadmin", "doctor", "patient"),
  listSlots
);

router.get(
  "/",
  authRequired,
  permit("superadmin", "doctor", "patient"),
  listAppointments
);

router.get(
  "/:appointmentId",
  authRequired,
  permit("superadmin", "doctor", "patient"),
  getAppointmentById
);

router.post(
  "/",
  authRequired,
  permit("superadmin", "doctor", "patient"),
  createAppointment
);

router.put(
  "/:appointmentId",
  authRequired,
  permit("superadmin", "doctor", "patient"),
  updateAppointment
);

export default router;
