import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const contentUri = process.env.CONTENT_MONGODB_URI;

export const contentConnection = contentUri
  ? mongoose.createConnection(contentUri, { serverSelectionTimeoutMS: 15000 })
  : mongoose.connection;

export const waitForContentDatabase = async () => {
  if (!contentUri) return mongoose.connection;
  await contentConnection.asPromise();
  return contentConnection;
};
