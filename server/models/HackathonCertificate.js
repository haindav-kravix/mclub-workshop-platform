import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  workshopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workshop', required: true },
  registrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', required: true },
  ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  memberId: { type: mongoose.Schema.Types.ObjectId, required: true },
  recipientName: { type: String, required: true },
  title: { type: String, required: true },
  fileName: { type: String, required: true },
  pdfData: { type: Buffer, required: true },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  issuedAt: { type: Date, default: Date.now }
}, { timestamps: true });

schema.index({ workshopId: 1, registrationId: 1, memberId: 1 }, { unique: true });
schema.index({ ownerUserId: 1, issuedAt: -1 });

export default mongoose.model('HackathonCertificate', schema);
