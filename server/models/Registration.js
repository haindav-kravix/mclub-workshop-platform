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
  teamCode: {
    type: String,
    default: ''
  },
  evaluationScores: {
    type: [Number],
    default: []
  },
  evaluationReviews: {
    type: [{
      score: {
        type: Number,
        default: 0
      },
      reason: {
        type: String,
        default: ''
      }
    }],
    default: []
  },
  evaluationAverage: {
    type: Number,
    default: 0
  },
  evaluatedAt: {
    type: Date
  },
  evaluatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
registrationSchema.index({ workshopId: 1, teamCode: 1 });
registrationSchema.index({ workshopId: 1, evaluationAverage: -1 });

export default mongoose.model('Registration', registrationSchema);
