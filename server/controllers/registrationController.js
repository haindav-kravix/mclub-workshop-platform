import Registration from '../models/Registration.js';
import Workshop from '../models/Workshop.js';
import User from '../models/User.js';
import { generateExcelReport } from '../utils/excelExport.js';
import fs from 'fs';
import mongoose from 'mongoose';

const safeExportFileName = (value = 'registrations') => String(value)
  .replace(/[^a-z0-9]+/gi, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase() || 'registrations';

const eventLabel = (workshop, lower = false) => {
  const label = workshop?.eventType === 'hackathon' ? 'Hackathon' : workshop?.eventType === 'internship' ? 'Internship' : 'Workshop';
  return lower ? label.toLowerCase() : label;
};

const ADMIN_SCORE_CODE = 'KLHAZ';
const generateTeamCode = () => {
  const prefixes = ['Code', 'Data', 'Query', 'Cloud', 'Byte', 'Stack', 'Logic', 'Script', 'Atlas', 'Node', 'Dev', 'Tech'];
  const suffixes = ['Forge', 'Nest', 'Crew', 'Labs', 'Minds', 'Flow', 'Spark', 'Quest', 'Core', 'Verse', 'Works', 'Zone'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  return `${prefix}${suffix}`;
};

const generateUniqueTeamCode = async (workshopId) => {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const teamCode = generateTeamCode();
    const exists = await Registration.exists({ workshopId, teamCode });
    if (!exists) return teamCode;
  }
  return generateTeamCode();
};

const parseFormData = (formData) => {
  if (!formData) return {};
  if (typeof formData !== 'string') return formData;

  try {
    const parsed = JSON.parse(formData);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const uploadedFileToDataUrl = (file) => {
  const fileBuffer = fs.readFileSync(file.path);
  fs.unlink(file.path, (err) => {
    if (err) console.error('Error deleting temporary upload:', err);
  });
  return `data:${file.mimetype};base64,${fileBuffer.toString('base64')}`;
};

const cleanupUploadedFile = (file) => {
  if (!file?.path) return;
  fs.unlink(file.path, (err) => {
    if (err) console.error('Error deleting file:', err);
  });
};

const getUploadedFile = (req, fieldName) => {
  if (req.file?.fieldname === fieldName) return req.file;
  return (req.files || []).find(file => file.fieldname === fieldName) || null;
};

const cleanupUploadedFiles = (req) => {
  cleanupUploadedFile(req.file);
  (req.files || []).forEach(cleanupUploadedFile);
};

const serializeUploadedDocument = (file) => JSON.stringify({
  dataUrl: uploadedFileToDataUrl(file),
  name: file.originalname || 'uploaded-file',
  mimeType: file.mimetype || 'application/octet-stream',
  size: file.size || 0
});

const formDataToObject = (formData) => {
  if (!formData) return {};
  if (formData instanceof Map) return Object.fromEntries(formData.entries());
  if (typeof formData.toObject === 'function') return formData.toObject();
  return { ...formData };
};

const summarizeUploadValue = (value, type) => {
  if (!value) return '';
  if (type === 'file') {
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify({
        name: parsed?.name || 'uploaded-file',
        mimeType: parsed?.mimeType || 'application/octet-stream',
        size: parsed?.size || 0,
        uploaded: Boolean(parsed?.dataUrl || value)
      });
    } catch {
      return JSON.stringify({ name: 'uploaded-file', uploaded: true });
    }
  }
  if (type === 'image') return 'uploaded';
  return value;
};

const summarizeRegistrationUploads = (registration, formFields = []) => {
  const data = typeof registration.toObject === 'function' ? registration.toObject() : registration;
  const fieldTypes = new Map(formFields.map(field => [field.fieldId, field.type]));
  const formData = formDataToObject(data.formData);

  Object.keys(formData).forEach(fieldId => {
    const fieldType = fieldTypes.get(fieldId);
    if (fieldType === 'image' || fieldType === 'file') {
      formData[fieldId] = summarizeUploadValue(formData[fieldId], fieldType);
    }
  });

  return {
    ...data,
    formData,
    paymentScreenshot: data.paymentScreenshot ? 'uploaded' : ''
  };
};

const hasStringValueExpression = (path) => ({
  $gt: [
    { $strLenBytes: { $ifNull: [path, ''] } },
    0
  ]
});

const isPaymentEnabled = (workshop) => workshop?.paymentEnabled !== false && Boolean(workshop?.qrImage);

const buildRegistrationListProjection = (formFields = []) => {
  const formDataProjection = {};

  formFields.forEach(field => {
    if (!field.fieldId) return;
    const fieldPath = `$formData.${field.fieldId}`;
    if (field.type === 'image') {
      formDataProjection[field.fieldId] = {
        $cond: [hasStringValueExpression(fieldPath), 'uploaded', '']
      };
      return;
    }
    if (field.type === 'file') {
      formDataProjection[field.fieldId] = {
        $cond: [hasStringValueExpression(fieldPath), JSON.stringify({ name: 'View file', uploaded: true }), '']
      };
      return;
    }
    formDataProjection[field.fieldId] = fieldPath;
  });

  return {
    _id: 1,
    workshopId: 1,
    userId: 1,
    status: 1,
    createdAt: 1,
    updatedAt: 1,
    teamCode: 1,
    evaluationScores: 1,
    evaluationReviews: 1,
    evaluationAverage: 1,
    formData: formDataProjection,
    paymentScreenshot: {
      $cond: [hasStringValueExpression('$paymentScreenshot'), 'uploaded', '']
    }
  };
};

const attachRegistrationUploads = (formData, files = [], formFields = []) => {
  const nextFormData = { ...formData };
  const fieldsById = new Map(formFields.map(field => [field.fieldId, field]));
  files
    .filter(file => file.fieldname !== 'paymentScreenshot')
    .forEach(file => {
      const field = fieldsById.get(file.fieldname);
      nextFormData[file.fieldname] = field?.type === 'file'
        ? serializeUploadedDocument(file)
        : uploadedFileToDataUrl(file);
    });
  return nextFormData;
};

export const registerForWorkshop = async (req, res) => {
  try {
    const { workshopId, formData } = req.body;
    let parsedFormData = parseFormData(formData);
    const paymentScreenshotFile = getUploadedFile(req, 'paymentScreenshot');

    // Check if workshop exists
    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      cleanupUploadedFiles(req);
      return res.status(404).json({ message: 'Event not found' });
    }

    if (workshop.isStopped || !workshop.registrationsOpen) {
      cleanupUploadedFiles(req);
      return res.status(400).json({ message: `Registrations are closed for this ${eventLabel(workshop, true)}` });
    }

    if (isPaymentEnabled(workshop) && workshop.qrImage && !paymentScreenshotFile) {
      cleanupUploadedFiles(req);
      return res.status(400).json({ message: 'Payment screenshot is required for this workshop' });
    }

    // Check if already registered
    const existingRegistration = await Registration.findOne({
      workshopId,
      userId: req.user.id
    });

    if (existingRegistration) {
      const statusMessages = {
        pending: 'Your registration is already under review',
        confirmed: `You are already confirmed for this ${eventLabel(workshop, true)}`,
        rejected: 'Your registration was rejected. Please contact guidance for help.',
        cancelled: 'This registration was cancelled. Please contact guidance if you need help.'
      };
      cleanupUploadedFiles(req);
      return res.status(400).json({ message: statusMessages[existingRegistration.status] || 'You are already registered for this workshop' });
    }

    // Check capacity
    if (workshop.capacity) {
      const registrationCount = await Registration.countDocuments({
        workshopId,
        status: 'confirmed'
      });

      if (registrationCount >= workshop.capacity) {
        cleanupUploadedFiles(req);
      return res.status(400).json({ message: `${eventLabel(workshop)} is full` });
      }
    }

    parsedFormData = attachRegistrationUploads(parsedFormData, req.files || [], workshop.registrationFormFields || []);

    const registration = new Registration({
      workshopId,
      userId: req.user.id,
      formData: parsedFormData,
      paymentScreenshot: isPaymentEnabled(workshop) && paymentScreenshotFile ? uploadedFileToDataUrl(paymentScreenshotFile) : '',
      teamCode: workshop.eventType === 'hackathon' ? await generateUniqueTeamCode(workshopId) : '',
      status: 'pending'
    });

    await registration.save();

    res.status(201).json({
      success: true,
      message: 'Registration submitted for review',
      registration
    });
  } catch (error) {
    cleanupUploadedFiles(req);
    res.status(500).json({ message: 'Error registering for workshop', error: error.message });
  }
};

export const getUserRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ userId: req.user.id })
      .populate('workshopId', 'title eventType date startDate endDate time duration dailyTimings venue telegramLink registrationFormFields entryPassEnabled hackathonLeaderboardVisible')
      .sort({ createdAt: -1 })
      .allowDiskUse(true);

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching registrations', error: error.message });
  }
};

export const getWorkshopRegistrations = async (req, res) => {
  try {
    const { workshopId } = req.params;

    // Check if workshop exists and user is admin
    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    const registrations = await Registration.aggregate([
      { $match: { workshopId: new mongoose.Types.ObjectId(workshopId) } },
      { $sort: { createdAt: -1 } },
      { $project: buildRegistrationListProjection(workshop.registrationFormFields || []) }
    ]).allowDiskUse(true);
    const userIds = registrations.map(registration => registration.userId).filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } })
      .select('name email profilePhoto')
      .lean();
    const usersById = new Map(users.map(user => [String(user._id), user]));

    res.json(registrations.map(registration => ({
      ...registration,
      userId: usersById.get(String(registration.userId)) || registration.userId
    })));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching registrations', error: error.message });
  }
};

export const getRegistrationUpload = async (req, res) => {
  try {
    const { workshopId, registrationId, imageKey } = req.params;

    const workshop = await Workshop.findById(workshopId).select('title registrationFormFields');
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    const registration = await Registration.findOne({ _id: registrationId, workshopId })
      .populate('userId', 'name email profilePhoto');

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    const field = imageKey === 'paymentScreenshot'
      ? null
      : (workshop.registrationFormFields || []).find(item => item.fieldId === imageKey);
    const rawValue = imageKey === 'paymentScreenshot'
      ? registration.paymentScreenshot
      : registration.formData?.get?.(imageKey);

    if (!rawValue) {
      return res.status(404).json({ message: 'Upload not found' });
    }

    res.json({
      workshop: {
        _id: workshop._id,
        title: workshop.title,
        registrationFormFields: workshop.registrationFormFields || []
      },
      registration: {
        _id: registration._id,
        userId: registration.userId,
        status: registration.status,
        createdAt: registration.createdAt
      },
      imageKey,
      field,
      value: rawValue
    });
  } catch (error) {
    res.status(500).json({ message: 'Error loading upload', error: error.message });
  }
};

export const cancelRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await Registration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    if (registration.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const wasConfirmed = registration.status === 'confirmed';
    registration.status = 'cancelled';
    await registration.save();

    // Update registration count
    const workshop = await Workshop.findById(registration.workshopId);
    if (wasConfirmed && workshop && workshop.registrationCount > 0) {
      workshop.registrationCount -= 1;
      await workshop.save();
    }

    res.json({ success: true, message: 'Registration cancelled' });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling registration', error: error.message });
  }
};

export const exportRegistrationsToExcel = async (req, res) => {
  try {
    const { workshopId } = req.params;

    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    const registrations = await Registration.find({ workshopId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .allowDiskUse(true);

    const workbook = await generateExcelReport(registrations, workshop.title, workshop.registrationFormFields);
    const fileName = `${safeExportFileName(workshop.title)}-registrations.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting registrations:', error);
    res.status(500).json({ message: 'Error exporting registrations', error: error.message });
  }
};

export const updateRegistrationStatus = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { status } = req.body;

    if (!['confirmed', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid registration status' });
    }

    const registration = await Registration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    const workshop = await Workshop.findById(registration.workshopId);
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    const previousStatus = registration.status;

    if (status === 'confirmed' && previousStatus !== 'confirmed' && workshop.capacity) {
      const confirmedCount = await Registration.countDocuments({
        workshopId: registration.workshopId,
        status: 'confirmed'
      });

      if (confirmedCount >= workshop.capacity) {
        return res.status(400).json({ message: 'Workshop is full' });
      }
    }

    registration.status = status;
    registration.updatedAt = new Date();
    await registration.save();

    if (previousStatus !== status) {
      if (status === 'confirmed' && previousStatus !== 'confirmed') {
        workshop.registrationCount = (workshop.registrationCount || 0) + 1;
        await workshop.save();
      }

      if (previousStatus === 'confirmed' && status !== 'confirmed' && workshop.registrationCount > 0) {
        workshop.registrationCount -= 1;
        await workshop.save();
      }
    }

    await registration.populate('userId', 'name email profilePhoto');

    res.json({
      success: true,
      message: status === 'confirmed' ? 'Registration approved' : 'Registration rejected',
      registration
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating registration status', error: error.message });
  }
};

export const getHackathonEvaluation = async (req, res) => {
  try {
    const { workshopId } = req.params;
    const workshop = await Workshop.findById(workshopId)
      .select('title eventType hackathonReviewCount hackathonLeaderboardVisible')
      .lean();

    if (!workshop) return res.status(404).json({ message: 'Event not found' });
    if (workshop.eventType !== 'hackathon') return res.status(400).json({ message: 'Evaluation is available only for hackathons' });

    const registrations = await Registration.find({ workshopId, status: 'confirmed' })
      .populate('userId', 'name email profilePhoto')
      .select('userId formData status teamCode evaluationScores evaluationReviews evaluationAverage evaluatedAt')
      .sort({ evaluationAverage: -1, updatedAt: -1 })
      .lean();

    res.json({ workshop, registrations });
  } catch (error) {
    res.status(500).json({ message: 'Error loading evaluation', error: error.message });
  }
};

export const updateHackathonEvaluation = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { scores = [], reviews = [], code } = req.body;

    const registration = await Registration.findById(registrationId);
    if (!registration) return res.status(404).json({ message: 'Registration not found' });

    const workshop = await Workshop.findById(registration.workshopId).select('eventType hackathonReviewCount');
    if (!workshop || workshop.eventType !== 'hackathon') {
      return res.status(400).json({ message: 'Evaluation is available only for hackathons' });
    }

    const hasExistingMarks = registration.evaluatedAt ||
      registration.evaluationScores?.some(score => Number(score) > 0) ||
      registration.evaluationReviews?.some(review => Number(review?.score) > 0 || String(review?.reason || '').trim());
    if (hasExistingMarks && code !== ADMIN_SCORE_CODE) {
      return res.status(403).json({ message: 'Invalid admin code' });
    }

    const reviewCount = Math.min(20, Math.max(1, Number(workshop.hackathonReviewCount) || 3));
    const normalizedReviews = Array.from({ length: reviewCount }, (_, index) => {
      const review = reviews[index] || {};
      const value = Number(review.score ?? scores[index]);
      if (!Number.isFinite(value)) return 0;
      return {
        score: Math.min(100, Math.max(0, value)),
        reason: String(review.reason || '').trim().slice(0, 600)
      };
    });
    const normalizedScores = normalizedReviews.map(review => review.score);
    const average = normalizedScores.length
      ? Math.round((normalizedScores.reduce((total, score) => total + score, 0) / normalizedScores.length) * 100) / 100
      : 0;

    registration.evaluationScores = normalizedScores;
    registration.evaluationReviews = normalizedReviews;
    registration.evaluationAverage = average;
    registration.evaluatedAt = new Date();
    registration.evaluatedBy = req.user.id;
    registration.updatedAt = new Date();
    await registration.save();
    await registration.populate('userId', 'name email profilePhoto');

    res.json({ success: true, registration });
  } catch (error) {
    res.status(500).json({ message: 'Error saving evaluation', error: error.message });
  }
};

export const toggleHackathonLeaderboard = async (req, res) => {
  try {
    const { workshopId } = req.params;
    const { visible } = req.body;
    const workshop = await Workshop.findById(workshopId);
    if (!workshop) return res.status(404).json({ message: 'Event not found' });
    if (workshop.eventType !== 'hackathon') return res.status(400).json({ message: 'Leaderboard is available only for hackathons' });

    workshop.hackathonLeaderboardVisible = Boolean(visible);
    workshop.updatedAt = new Date();
    await workshop.save();
    res.json({ success: true, workshop });
  } catch (error) {
    res.status(500).json({ message: 'Error updating leaderboard visibility', error: error.message });
  }
};

export const getHackathonLeaderboard = async (req, res) => {
  try {
    const { workshopId } = req.params;
    const workshop = await Workshop.findById(workshopId)
      .select('title eventType hackathonLeaderboardVisible')
      .lean();
    if (!workshop) return res.status(404).json({ message: 'Event not found' });
    if (workshop.eventType !== 'hackathon') return res.status(400).json({ message: 'Leaderboard is available only for hackathons' });
    if (!workshop.hackathonLeaderboardVisible) return res.status(403).json({ message: 'Leaderboard is not visible yet' });

    const ownRegistration = await Registration.exists({
      workshopId,
      userId: req.user.id,
      status: 'confirmed'
    });
    if (!ownRegistration && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Leaderboard is visible only for confirmed teams' });
    }

    const registrations = await Registration.find({
      workshopId,
      status: 'confirmed',
      evaluationAverage: { $gt: 0 }
    })
      .populate('userId', 'name')
      .select('userId formData teamCode evaluationAverage')
      .sort({ evaluationAverage: -1, updatedAt: 1 })
      .lean();

    res.json({ workshop, leaderboard: registrations });
  } catch (error) {
    res.status(500).json({ message: 'Error loading leaderboard', error: error.message });
  }
};

export const deleteRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { workshopId } = req.body;

    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    const registration = await Registration.findByIdAndDelete(registrationId);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Update registration count
    if (registration.status === 'confirmed' && workshop.registrationCount > 0) {
      workshop.registrationCount -= 1;
      await workshop.save();
    }

    res.json({ success: true, message: 'Registration deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting registration', error: error.message });
  }
};
