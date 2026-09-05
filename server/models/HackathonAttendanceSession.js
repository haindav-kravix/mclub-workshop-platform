import mongoose from 'mongoose';

const entrySchema = new mongoose.Schema({
  registrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', required: true },
  memberId: { type: mongoose.Schema.Types.ObjectId, required: true },
  status: { type: String, enum: ['present', 'absent'], default: 'absent' },
  source: { type: String, enum: ['qr', 'manual'], default: 'manual' },
  markedAt: { type: Date }
}, { _id: false });

const schema = new mongoose.Schema({
  workshopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workshop', required: true },
  title: { type: String, trim: true, maxlength: 120, required: true },
  date: { type: Date, required: true },
  qrEnabled: { type: Boolean, default: false },
  entries: { type: [entrySchema], default: [] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

schema.index({ workshopId: 1, date: -1 });
schema.index({ workshopId: 1, title: 1 });

export default mongoose.model('HackathonAttendanceSession', schema);
