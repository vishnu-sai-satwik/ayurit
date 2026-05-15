import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true, index: true },
    uploadedBy: { type: String, required: true },
    filename: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: { type: String, default: "application/octet-stream" },
    size: { type: Number, default: 0 },
    attachedToAppointmentId: { type: String, default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export const ReportModel = mongoose.models.Report || mongoose.model("Report", reportSchema);
