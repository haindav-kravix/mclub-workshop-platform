import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  workshopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workshop', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  fileName: { type: String, required: true },
  pdfData: { type: Buffer, required: true },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  issuedAt: { type: Date, default: Date.now }
}, { timestamps: true });

certificateSchema.index({ workshopId: 1, userId: 1 }, { unique: true });
certificateSchema.index({ userId: 1, issuedAt: -1 });

export default mongoose.model('Certificate', certificateSchema);
