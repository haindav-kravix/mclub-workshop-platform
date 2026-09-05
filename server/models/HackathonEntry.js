import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  workshopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workshop', required: true },
  registrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', required: true },
  memberId: { type: mongoose.Schema.Types.ObjectId, required: true },
  memberName: { type: String, required: true },
  memberPin: { type: String, required: true },
  checkedInAt: { type: Date, default: Date.now, required: true },
  scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scanCount: { type: Number, default: 1 },
  lastScannedAt: { type: Date, default: Date.now }
}, { timestamps: true });

schema.index({ workshopId: 1, registrationId: 1, memberId: 1 }, { unique: true });
schema.index({ workshopId: 1, checkedInAt: -1 });

export default mongoose.model('HackathonEntry', schema);
