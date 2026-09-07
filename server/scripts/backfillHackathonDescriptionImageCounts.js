import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Workshop from '../models/Workshop.js';

dotenv.config();

const run = async () => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');

  await mongoose.connect(process.env.MONGODB_URI);
  const result = await Workshop.updateMany(
    { eventType: 'hackathon' },
    [{
      $set: {
        hackathonDescriptionImageCount: {
          $size: { $ifNull: ['$hackathonDescriptionImages', []] }
        }
      }
    }]
  );
  console.log(`hackathon image counts updated: ${result.modifiedCount}`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
