import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const collections = [
  'blogposts',
  'blognotifications',
  'certificates',
  'hackathoncertificates',
  'certificatetemplates'
];

if (!process.env.MONGODB_URI || !process.env.CONTENT_MONGODB_URI) {
  throw new Error('MONGODB_URI and CONTENT_MONGODB_URI are required');
}

const source = mongoose.createConnection(process.env.MONGODB_URI);
const target = mongoose.createConnection(process.env.CONTENT_MONGODB_URI);

try {
  await Promise.all([source.asPromise(), target.asPromise()]);

  for (const collectionName of collections) {
    const sourceCollection = source.collection(collectionName);
    const targetCollection = target.collection(collectionName);
    const documents = await sourceCollection.find({}).toArray();

    if (documents.length) {
      await targetCollection.bulkWrite(documents.map(document => ({
        replaceOne: {
          filter: { _id: document._id },
          replacement: document,
          upsert: true
        }
      })), { ordered: false });
    }

    const targetCount = await targetCollection.countDocuments({});
    if (targetCount !== documents.length) {
      throw new Error(`${collectionName} verification failed: source=${documents.length}, target=${targetCount}`);
    }
    console.log(`${collectionName}: ${documents.length} verified`);
  }

  console.log('Content migration verified successfully');
} finally {
  await Promise.allSettled([source.close(), target.close()]);
}
