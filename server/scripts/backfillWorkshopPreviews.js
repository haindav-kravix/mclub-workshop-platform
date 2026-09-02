import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Workshop from '../models/Workshop.js';

dotenv.config();

const run = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const workshops = await Workshop.find({
    coverImagePreview: { $ne: '' }
  }).select('title').lean();

  let updated = 0;
  for (const workshop of workshops) {
    try {
      await Workshop.updateOne({ _id: workshop._id }, { $set: { coverImagePreview: '' } });
      updated += 1;
      console.log(`preview cleared: ${workshop.title}`);
    } catch (error) {
      console.warn(`preview clear skipped: ${workshop.title} - ${error.message}`);
    }
  }

  console.log(`workshop previews cleared: ${updated}/${workshops.length}`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
