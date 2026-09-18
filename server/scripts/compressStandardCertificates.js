import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Certificate from '../models/Certificate.js';
import CertificateTemplate from '../models/CertificateTemplate.js';
import Workshop from '../models/Workshop.js';
import Registration from '../models/Registration.js';
import '../models/User.js';
import { generateCertificatePdf, getCertificateRecipientName } from '../controllers/certificateController.js';

dotenv.config();

const apply = process.argv.includes('--apply');
const limitArg = process.argv.find(value => value.startsWith('--limit='));
const limit = limitArg ? Math.max(1, Number(limitArg.split('=')[1]) || 1) : null;

const run = async () => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  await mongoose.connect(process.env.MONGODB_URI);

  const certificates = await Certificate.find({}).select('_id workshopId userId').lean();
  const workshopIds = [...new Set(certificates.map(item => String(item.workshopId)))];
  const [workshops, templates] = await Promise.all([
    Workshop.find({ _id: { $in: workshopIds } }).select('registrationFormFields').lean(),
    CertificateTemplate.find({ workshopId: { $in: workshopIds } })
  ]);

  const workshopsById = new Map(workshops.map(item => [String(item._id), item]));
  const templatesByWorkshopId = new Map(templates.map(item => [String(item.workshopId), item]));
  const summary = { checked: 0, compressed: 0, skipped: 0, beforeBytes: 0, afterBytes: 0 };

  for (const certificate of certificates) {
    if (limit && summary.checked >= limit) break;
    const workshop = workshopsById.get(String(certificate.workshopId));
    const template = templatesByWorkshopId.get(String(certificate.workshopId));
    if (!workshop || !template) {
      summary.skipped += 1;
      continue;
    }

    const registration = await Registration.findOne({
      workshopId: certificate.workshopId,
      userId: certificate.userId,
      status: 'confirmed'
    }).select('formData userId').populate('userId', 'name email').lean();
    if (!registration) {
      summary.skipped += 1;
      continue;
    }

    const storedCertificate = await Certificate.findById(certificate._id).select('pdfData');
    const previousBytes = storedCertificate?.pdfData?.length || 0;
    if (!previousBytes) {
      summary.skipped += 1;
      continue;
    }

    const recipientName = getCertificateRecipientName(registration, workshop.registrationFormFields || []);
    const compactPdf = await generateCertificatePdf(template, recipientName);
    summary.checked += 1;
    summary.beforeBytes += previousBytes;

    if (compactPdf.length >= previousBytes) {
      summary.afterBytes += previousBytes;
      summary.skipped += 1;
      continue;
    }

    summary.afterBytes += compactPdf.length;
    summary.compressed += 1;
    if (apply) {
      await Certificate.updateOne({ _id: certificate._id }, { $set: { pdfData: compactPdf } });
    }
  }

  console.log(JSON.stringify({
    mode: apply ? 'applied' : 'dry-run',
    checked: summary.checked,
    compressed: summary.compressed,
    skipped: summary.skipped,
    beforeKB: Math.round(summary.beforeBytes / 1024),
    afterKB: Math.round(summary.afterBytes / 1024),
    savedKB: Math.round((summary.beforeBytes - summary.afterBytes) / 1024)
  }));
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
