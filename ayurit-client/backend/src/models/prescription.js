import mongoose from "mongoose";

const medicationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    dose: { type: String, default: "" },
    frequency: { type: String, default: "" },
    duration: { type: String, default: "" },
    notes: { type: String, default: "" }
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true, index: true },
    doctorId: { type: String, required: true, index: true },
    consultationId: { type: String, default: null },
    medications: { type: [medicationSchema], default: [] },
    notes: { type: String, default: "" },
    issuedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const PrescriptionModel = mongoose.models.Prescription || mongoose.model("Prescription", prescriptionSchema);
