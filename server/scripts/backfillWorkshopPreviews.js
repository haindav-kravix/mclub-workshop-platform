import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Workshop from '../models/Workshop.js';

dotenv.config();

const createCoverImagePreview = async (dataUrl) => {
  return String(dataUrl || '');
};

const run = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const workshops = await Workshop.find({
    coverImage: /^data:image\//
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
