import mongoose from 'mongoose';

const attendanceSessionSchema = new mongoose.Schema({
  workshopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  qrEnabled: {
    type: Boolean,
    default: false
  },
  manualEnabled: {
    type: Boolean,
    default: false
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

attendanceSessionSchema.index({ workshopId: 1, date: 1 }, { unique: true });

export default mongoose.model('AttendanceSession', attendanceSessionSchema);
