import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import Certificate from '../models/Certificate.js';
import CertificateTemplate from '../models/CertificateTemplate.js';
import Workshop from '../models/Workshop.js';
import Registration from '../models/Registration.js';
import Attendance from '../models/Attendance.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const safeFileName = (value = 'certificate') => String(value)
  .replace(/[^a-z0-9]+/gi, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase() || 'certificate';

const fontMap = {
  Helvetica: StandardFonts.Helvetica,
  'Times Roman': StandardFonts.TimesRoman,
  Courier: StandardFonts.Courier
};

const scriptFontPath = path.join(
  __dirname,
  '../node_modules/@fontsource/great-vibes/files/great-vibes-latin-400-normal.woff'
);
let scriptFontBytes = null;

const getCertificateFont = async (pdf, fontFamily) => {
  if (fontFamily === 'Great Vibes') {
    pdf.registerFontkit(fontkit);
    scriptFontBytes ||= fs.readFileSync(scriptFontPath);
    return pdf.embedFont(scriptFontBytes);
  }

  return pdf.embedFont(fontMap[fontFamily] || StandardFonts.Helvetica);
};

const hexToRgb = (hex = '#111827') => {
  const normalized = String(hex).replace('#', '');
  const value = /^[0-9a-f]{6}$/i.test(normalized) ? normalized : '111827';
  return rgb(
    parseInt(value.slice(0, 2), 16) / 255,
    parseInt(value.slice(2, 4), 16) / 255,
    parseInt(value.slice(4, 6), 16) / 255
  );
};

const templateResponse = (template) => template ? {
  _id: template._id,
  workshopId: template.workshopId,
  templateName: template.templateName,
  templateImage: `data:${template.templateMimeType};base64,${template.templateImage.toString('base64')}`,
  nameX: template.nameX,
  nameY: template.nameY,
  fontFamily: template.fontFamily,
  fontSize: template.fontSize,
  fontColor: template.fontColor,
  alignment: template.alignment,
  uppercase: template.uppercase,
  maxWidth: template.maxWidth,
  updatedAt: template.updatedAt
} : null;

const generateCertificatePdf = async (template, participantName) => {
  const pdf = await PDFDocument.create();
  const imageBytes = template.templateImage;
  const image = template.templateMimeType === 'image/png'
    ? await pdf.embedPng(imageBytes)
    : await pdf.embedJpg(imageBytes);
  const page = pdf.addPage([image.width, image.height]);
  page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });

  const font = await getCertificateFont(pdf, template.fontFamily);
  const text = template.uppercase ? participantName.toUpperCase() : participantName;
  const isScriptFont = template.fontFamily === 'Great Vibes';
  const maxNameWidth = isScriptFont ? Math.max(template.maxWidth, 0.9) : template.maxWidth;
  const maxTextWidth = image.width * maxNameWidth;
  let fontSize = template.fontSize;
  if (!isScriptFont) {
    while (fontSize > 10 && font.widthOfTextAtSize(text, fontSize) > maxTextWidth) fontSize -= 1;
  }
  const textWidth = font.widthOfTextAtSize(text, fontSize);
  let x = image.width * template.nameX;
  if (template.alignment === 'center') x -= textWidth / 2;
  if (template.alignment === 'right') x -= textWidth;
  const y = image.height * (1 - template.nameY) - fontSize * 0.32;

  page.drawText(text, {
    x: Math.max(0, x),
    y: Math.max(0, y),
    size: fontSize,
    font,
    color: hexToRgb(template.fontColor)
  });
  return Buffer.from(await pdf.save());
};

export const getTemplateSetup = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.workshopId)
      .select('title eventType date startDate endDate');
    if (!workshop) return res.status(404).json({ message: 'Event not found' });
    const template = await CertificateTemplate.findOne({ workshopId: workshop._id });
    res.json({ workshop, template: templateResponse(template) });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load certificate setup', error: error.message });
  }
};

export const saveTemplateSetup = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.workshopId).select('_id');
    if (!workshop) {
      if (req.file?.path) fs.unlink(req.file.path, () => {});
      return res.status(404).json({ message: 'Event not found' });
    }
    const existing = await CertificateTemplate.findOne({ workshopId: workshop._id });
    if (!existing && !req.file) return res.status(400).json({ message: 'Upload a PNG or JPG certificate design' });
    if (req.file && !['image/png', 'image/jpeg'].includes(req.file.mimetype)) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ message: 'Certificate template must be a PNG or JPG image' });
    }
    const update = {
      nameX: Number(req.body.nameX ?? existing?.nameX ?? 0.5),
      nameY: Number(req.body.nameY ?? existing?.nameY ?? 0.52),
      fontFamily: req.body.fontFamily || existing?.fontFamily || 'Great Vibes',
      fontSize: Number(req.body.fontSize ?? existing?.fontSize ?? 58),
      fontColor: req.body.fontColor || existing?.fontColor || '#111827',
      alignment: req.body.alignment || existing?.alignment || 'center',
      uppercase: String(req.body.uppercase) === 'true',
      maxWidth: Number(req.body.maxWidth ?? existing?.maxWidth ?? 0.9),
      updatedBy: req.user.id
    };
    if (req.file) {
      update.templateImage = fs.readFileSync(req.file.path);
      update.templateMimeType = req.file.mimetype;
      update.templateName = req.file.originalname;
      fs.unlink(req.file.path, () => {});
    }
    const template = await CertificateTemplate.findOneAndUpdate(
      { workshopId: workshop._id },
      { $set: update, $setOnInsert: { workshopId: workshop._id } },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ success: true, template: templateResponse(template) });
  } catch (error) {
    if (req.file?.path) fs.unlink(req.file.path, () => {});
    res.status(500).json({ message: 'Unable to save certificate setup', error: error.message });
  }
};

export const getEligibleRecipients = async (req, res) => {
  try {
    const workshopId = req.params.workshopId;
    const registrations = await Registration.find({ workshopId, status: 'confirmed' })
      .select('userId createdAt')
      .populate('userId', 'name email profilePhoto')
      .sort({ createdAt: 1 });
    const reports = await Attendance.find({ workshopId }).select('entries');
    const totals = new Map();
    reports.forEach(report => report.entries.forEach(entry => {
      const key = String(entry.userId);
      const current = totals.get(key) || { present: 0, total: 0 };
      current.total += 1;
      if (entry.status === 'present') current.present += 1;
      totals.set(key, current);
    }));
    const existing = await Certificate.find({ workshopId }).select('userId issuedAt').lean();
    const existingByUser = new Map(existing.map(item => [String(item.userId), item]));
    res.json(registrations.map(registration => {
      const userId = String(registration.userId?._id || registration.userId);
      const attendance = totals.get(userId) || { present: 0, total: reports.length };
      return {
        registrationId: registration._id,
        user: registration.userId,
        attendancePresent: attendance.present,
        attendanceTotal: attendance.total,
        attendancePercentage: attendance.total ? Math.round((attendance.present / attendance.total) * 100) : null,
        certificateIssuedAt: existingByUser.get(userId)?.issuedAt || null
      };
    }));
  } catch (error) {
    res.status(500).json({ message: 'Unable to load eligible participants', error: error.message });
  }
};

export const generateCertificates = async (req, res) => {
  try {
    const { workshopId } = req.params;
    const userIds = Array.isArray(req.body.userIds) ? [...new Set(req.body.userIds)] : [];
    if (!userIds.length) return res.status(400).json({ message: 'Select at least one eligible participant' });
    const [workshop, template, registrations] = await Promise.all([
      Workshop.findById(workshopId).select('title'),
      CertificateTemplate.findOne({ workshopId }),
      Registration.find({ workshopId, status: 'confirmed', userId: { $in: userIds } })
        .populate('userId', 'name email')
    ]);
    if (!workshop) return res.status(404).json({ message: 'Event not found' });
    if (!template) return res.status(400).json({ message: 'Save the certificate design before generating certificates' });
    if (!registrations.length) return res.status(400).json({ message: 'No eligible confirmed participants selected' });

    for (const registration of registrations) {
      const pdfData = await generateCertificatePdf(template, registration.userId.name);
      const fileName = `${safeFileName(workshop.title)}-${safeFileName(registration.userId.name)}.pdf`;
      await Certificate.findOneAndUpdate(
        { workshopId, userId: registration.userId._id },
        {
          workshopId,
          userId: registration.userId._id,
          title: workshop.title,
          fileName,
          pdfData,
          generatedBy: req.user.id,
          issuedAt: new Date()
        },
        { upsert: true, new: true, runValidators: true }
      );
    }
    res.json({ success: true, generatedCount: registrations.length, message: `${registrations.length} certificate${registrations.length === 1 ? '' : 's'} generated` });
  } catch (error) {
    res.status(500).json({ message: 'Unable to generate certificates', error: error.message });
  }
};

export const getMyCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({ userId: req.user.id })
      .select('-pdfData')
      .populate('workshopId', 'title eventType date startDate')
      .sort({ issuedAt: -1 })
      .lean();
    res.json(certificates);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load certificates', error: error.message });
  }
};

export const getCertificateFile = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) return res.status(404).json({ message: 'Certificate not found' });
    const isOwner = String(certificate.userId) === String(req.user.id);
    if (!isOwner && !req.user.isAdmin) return res.status(403).json({ message: 'Access denied' });
    const disposition = req.query.download === '1' ? 'attachment' : 'inline';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${disposition}; filename="${certificate.fileName}"`);
    res.send(certificate.pdfData);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load certificate', error: error.message });
  }
};
