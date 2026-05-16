import mongoose from 'mongoose';

const blogNotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['like', 'follow'],
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlogPost'
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

blogNotificationSchema.index({ recipient: 1, createdAt: -1 });

export default mongoose.model('BlogNotification', blogNotificationSchema);
