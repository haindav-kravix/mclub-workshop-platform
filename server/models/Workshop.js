import mongoose from 'mongoose';

const formFieldSchema = new mongoose.Schema({
  fieldId: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'email', 'phone', 'textarea', 'image', 'file', 'select', 'radio', 'checkbox', 'question-text', 'question-mcq'],
    required: true
  },
  required: {
    type: Boolean,
    default: true
  },
  options: {
    type: [String],
    default: []
  },
  correctAnswer: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    required: true
  }
});

const dailyTimingSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    default: ''
  },
  endTime: {
    type: String,
    default: ''
  }
}, { _id: false });

const workshopSchema = new mongoose.Schema({
  eventType: {
    type: String,
    enum: ['workshop', 'internship', 'hackathon'],
    default: 'workshop'
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  coverImage: {
    type: String,
    required: true
  },
  qrImage: {
    type: String,
    default: ''
  },
  paymentEnabled: {
    type: Boolean
  },
  entryPassEnabled: {
    type: Boolean,
    default: true
  },
  hackathonLeaderboardVisible: {
    type: Boolean,
    default: false
  },
  hackathonReviewCount: {
    type: Number,
    default: 3,
    min: 1,
    max: 20
  },
  hackathonReviewMaxScores: {
    type: [Number],
    default: []
  },
  date: {
    type: Date,
    required: true
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  time: {
    type: String,
    default: ''
  },
  dailyTimings: {
    type: [dailyTimingSchema],
    default: []
  },
  telegramLink: {
    type: String,
    default: ''
  },
  venue: {
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    default: null
  },
  duration: {
    type: String,
    required: true
  },
  registrationFormFields: [formFieldSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  registrationCount: {
    type: Number,
    default: 0
  },
  registrationsOpen: {
    type: Boolean,
    default: true
  },
  isStopped: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
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

export default mongoose.model('Workshop', workshopSchema);
