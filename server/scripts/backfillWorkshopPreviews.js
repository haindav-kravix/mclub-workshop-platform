import mongoose from 'mongoose';
import sharp from 'sharp';
import dotenv from 'dotenv';
import Workshop from '../models/Workshop.js';

dotenv.config();

const canOptimizeImage = (mimeType = '') => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif'].includes(mimeType);

const createCoverImagePreview = async (dataUrl) => {
  const match = String(dataUrl || '').match(/^data:([^;]+);base64,(.*)$/);
  if (!match) return '';

  const [, mimeType, base64Data] = match;
  if (!canOptimizeImage(mimeType)) return '';

  const preview = await sharp(Buffer.from(base64Data, 'base64'), { limitInputPixels: 80_000_000 })
    .rotate()
    .resize({ width: 520, height: 360, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 72, effort: 4 })
    .toBuffer();

  return `data:image/webp;base64,${preview.toString('base64')}`;
};

const run = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const workshops = await Workshop.find({
    coverImage: /^data:image\//,
    $or: [
      { coverImagePreview: { $exists: false } },
      { coverImagePreview: '' }
    ]
  }).select('title coverImage').lean();

  let updated = 0;
  for (const workshop of workshops) {
    try {
      const coverImagePreview = await createCoverImagePreview(workshop.coverImage);
      if (!coverImagePreview) continue;
      await Workshop.updateOne({ _id: workshop._id }, { $set: { coverImagePreview } });
      updated += 1;
      console.log(`preview saved: ${workshop.title}`);
    } catch (error) {
      console.warn(`preview skipped: ${workshop.title} - ${error.message}`);
    }
  }

  console.log(`workshop previews updated: ${updated}/${workshops.length}`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
