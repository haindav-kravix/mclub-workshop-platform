import mongoose from 'mongoose';

const attendanceEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent'],
    required: true
  }
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
  workshopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  entries: {
    type: [attendanceEntrySchema],
    default: []
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

attendanceSchema.index({ workshopId: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
