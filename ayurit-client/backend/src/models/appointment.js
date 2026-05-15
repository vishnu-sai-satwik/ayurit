import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    // Core appointment data
    patientId: { type: String, default: null, index: true },
    doctorId: { type: String, required: true, index: true },
    
    // DateTime fields - can use either ISO string or Date
    dateTime: { type: Date, required: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    
    // Status flow: available -> booked -> in-progress -> completed OR cancelled
    status: { 
      type: String, 
      enum: ["available", "requested", "booked", "in-progress", "completed", "cancelled"],
      default: "available",
      index: true
    },
    
    // Appointment details
    reason: { type: String, default: "" },
    notes: { type: String, default: "" },
    
    // Video consultation
    meetingRoomId: { type: String, default: "" },  // Jitsi room ID
    
    // Additional metadata
    durationMinutes: { type: Number, default: 30 },
    requestedBy: { type: String, default: "" },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

// Indexes for efficient queries
appointmentSchema.index({ doctorId: 1, startAt: 1 });
appointmentSchema.index({ patientId: 1, startAt: 1 });
appointmentSchema.index({ doctorId: 1, status: 1 });
appointmentSchema.index({ patientId: 1, status: 1 });
appointmentSchema.index({ startAt: 1, status: 1 });

export const AppointmentModel = mongoose.models.Appointment || mongoose.model("Appointment", appointmentSchema);
