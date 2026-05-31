import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema({
  workshopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  formData: {
    type: Map,
    of: String,
    required: true
  },
  paymentScreenshot: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['confirmed', 'pending', 'cancelled', 'rejected'],
    default: 'pending'
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

// Compound unique index to prevent duplicate registrations
registrationSchema.index({ workshopId: 1, userId: 1 }, { unique: true });
registrationSchema.index({ workshopId: 1, createdAt: -1 });
registrationSchema.index({ userId: 1, createdAt: -1 });
registrationSchema.index({ workshopId: 1, status: 1 });

export default mongoose.model('Registration', registrationSchema);
