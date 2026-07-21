import mongoose from 'mongoose';

const entrySchema = new mongoose.Schema({
  workshopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop',
    required: true
  },
  registrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration',
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  checkedInAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  scannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scanCount: {
    type: Number,
    default: 1
  },
  lastScannedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

entrySchema.index({ workshopId: 1, checkedInAt: -1 });
entrySchema.index({ userId: 1, workshopId: 1 });

export default mongoose.model('Entry', entrySchema);
