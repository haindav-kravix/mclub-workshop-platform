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
  teamMembers: {
    type: [{
      name: { type: String, trim: true, required: true },
      email: { type: String, trim: true, lowercase: true, default: '' },
      rollNumber: { type: String, trim: true, default: '' },
      college: { type: String, trim: true, default: '' },
      pin: { type: String, match: /^\d{4}$/, required: true }
    }],
    default: []
  },
  selectedProblemStatement: {
    statementId: {
      type: mongoose.Schema.Types.ObjectId
    },
    title: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    selectedAt: {
      type: Date
    }
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
      },
      evaluator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      evaluatorName: {
        type: String,
        default: ''
      },
      reviewedAt: {
        type: Date
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
registrationSchema.index({ userId: 1, status: 1 });
registrationSchema.index({ workshopId: 1, status: 1 });
registrationSchema.index({ workshopId: 1, teamCode: 1 });
registrationSchema.index(
  { workshopId: 1, 'teamMembers.pin': 1 },
  { unique: true, partialFilterExpression: { 'teamMembers.pin': { $type: 'string' } } }
);
registrationSchema.index({ workshopId: 1, evaluationAverage: -1 });

export default mongoose.model('Registration', registrationSchema);
