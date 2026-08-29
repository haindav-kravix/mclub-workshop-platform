import mongoose from 'mongoose';

const certificateTemplateSchema = new mongoose.Schema({
  workshopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop',
    required: true,
    unique: true
  },
  templateImage: { type: Buffer, required: true },
  templateMimeType: { type: String, enum: ['image/png', 'image/jpeg'], required: true },
  templateName: { type: String, default: 'certificate-template' },
  nameX: { type: Number, min: 0, max: 1, default: 0.5 },
  nameY: { type: Number, min: 0, max: 1, default: 0.52 },
  fontFamily: { type: String, enum: ['Great Vibes', 'Helvetica', 'Times Roman', 'Courier'], default: 'Great Vibes' },
  fontSize: { type: Number, min: 10, max: 120, default: 42 },
  fontColor: { type: String, default: '#111827' },
  alignment: { type: String, enum: ['left', 'center', 'right'], default: 'center' },
  uppercase: { type: Boolean, default: false },
  maxWidth: { type: Number, min: 0.2, max: 0.95, default: 0.72 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('CertificateTemplate', certificateTemplateSchema);
