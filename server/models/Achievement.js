import mongoose from 'mongoose';

const achievementImageSchema = new mongoose.Schema({
  data: { type: Buffer, required: true },
  mimeType: { type: String, required: true },
  name: { type: String, default: 'achievement-image' }
}, { _id: false });

const achievementLinkSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true },
  url: { type: String, required: true, trim: true }
}, { _id: false });

const achievementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  summary: { type: String, required: true, trim: true },
  achievedOn: { type: Date, required: true },
  images: { type: [achievementImageSchema], default: [] },
  links: { type: [achievementLinkSchema], default: [] },
  isPublished: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

achievementSchema.index({ isPublished: 1, achievedOn: -1, createdAt: -1 });

export default mongoose.model('Achievement', achievementSchema);
