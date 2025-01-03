import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema(
  {
    complaintBy: { type: String }, // Name of the complainer
    complaintType: { type: String }, // Type of the complaint
    complaintSource: { type: String }, // Source of complaint
    phone: { type: String }, // Optional
    date: { type: Date, default: Date.now }, // Date of complaint
    actionsTaken: { type: String }, // Actions taken
    assigned: { type: String }, // Assigned to
    description: { type: String }, // Complaint description
    file: { type: String }, // File path for uploaded file
  },
  { timestamps: true }
);

const ComplaintModel = mongoose.model('Complaint', complaintSchema);

export default ComplaintModel;
