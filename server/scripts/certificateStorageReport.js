import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Certificate from '../models/Certificate.js';
import HackathonCertificate from '../models/HackathonCertificate.js';
import CertificateTemplate from '../models/CertificateTemplate.js';

dotenv.config();

const summarize = async (Model, label) => {
  const [result] = await Model.collection.aggregate([
    { $project: { size: { $bsonSize: '$$ROOT' } } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        totalBytes: { $sum: '$size' },
        maxBytes: { $max: '$size' }
      }
    }
  ]).toArray();

  const totalBytes = result?.totalBytes || 0;
  const count = result?.count || 0;
  console.log(JSON.stringify({
    label,
    count,
    totalKB: Math.round(totalBytes / 1024),
    averageKB: count ? Math.round(totalBytes / count / 1024) : 0,
    maxKB: Math.round((result?.maxBytes || 0) / 1024)
  }));
};

const run = async () => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  await mongoose.connect(process.env.MONGODB_URI);
  await summarize(Certificate, 'standard-certificates');
  await summarize(HackathonCertificate, 'hackathon-certificates');
  await summarize(CertificateTemplate, 'certificate-templates');
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
