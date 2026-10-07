import fs from 'fs';
import Registration from '../models/Registration.js';
import Workshop from '../models/Workshop.js';

const ALLOWED_TYPES = new Set(['text', 'email', 'phone', 'textarea', 'image', 'file', 'select', 'radio', 'checkbox', 'question-text', 'question-mcq']);

const cleanFields = (fields) => {
  if (!Array.isArray(fields) || fields.length > 30) throw new Error('Final submission form can contain up to 30 fields');
  const seen = new Set();
  return fields.map((field, index) => {
    const fieldId = String(field?.fieldId || '').trim().slice(0, 100);
    const label = String(field?.label || '').trim().slice(0, 180);
    const type = String(field?.type || 'text');
    if (!fieldId || seen.has(fieldId) || !label || !ALLOWED_TYPES.has(type)) throw new Error('Final submission form contains an invalid field');
    seen.add(fieldId);
    const options = Array.isArray(field.options)
      ? field.options.map(option => String(option).trim().slice(0, 200)).filter(Boolean).slice(0, 30)
      : [];
    if (['select', 'radio', 'checkbox', 'question-mcq'].includes(type) && options.length < 2) {
      throw new Error(`${label} needs at least two options`);
    }
    return { fieldId, label, type, required: field.required !== false, options, correctAnswer: '', order: index };
  });
};

const mapToObject = value => value instanceof Map ? Object.fromEntries(value.entries()) : { ...(value || {}) };

const cleanupFiles = files => (files || []).forEach(file => {
  if (file?.path) fs.unlink(file.path, () => {});
});

const serializeFile = async file => {
  const buffer = await fs.promises.readFile(file.path);
  const payload = JSON.stringify({
    dataUrl: `data:${file.mimetype || 'application/octet-stream'};base64,${buffer.toString('base64')}`,
    name: file.originalname || 'uploaded-file',
    mimeType: file.mimetype || 'application/octet-stream',
    size: file.size || 0
  });
  fs.unlink(file.path, () => {});
  return payload;
};

const safeFormData = (formData, fields) => {
  const types = new Map(fields.map(field => [field.fieldId, field.type]));
  return Object.fromEntries(Object.entries(mapToObject(formData)).map(([key, value]) => {
    if (!['image', 'file'].includes(types.get(key))) return [key, value];
    try {
      const parsed = JSON.parse(value);
      return [key, JSON.stringify({ name: parsed.name || 'uploaded-file', mimeType: parsed.mimeType || '', size: parsed.size || 0, uploaded: true })];
    } catch {
      return [key, value ? 'uploaded' : ''];
    }
  }));
};

const getHackathon = async workshopId => Workshop.findById(workshopId)
  .select('title eventType hackathonFinalSubmissionEnabled hackathonFinalSubmissionTitle hackathonFinalSubmissionInstructions hackathonFinalSubmissionFields');

export const getAdminFinalSubmission = async (req, res) => {
  try {
    const workshop = await getHackathon(req.params.workshopId).lean();
    if (!workshop || workshop.eventType !== 'hackathon') return res.status(404).json({ message: 'Hackathon not found' });
    const registrations = await Registration.find({ workshopId: workshop._id, status: 'confirmed' })
      .select('teamCode teamMembers finalSubmission submittedAt')
      .sort({ teamCode: 1 })
      .lean();
    res.json({
      workshop,
      teams: registrations.map(registration => ({
        registrationId: registration._id,
        teamCode: registration.teamCode,
        members: (registration.teamMembers || []).map(member => ({ name: member.name, email: member.email })),
        submittedAt: registration.finalSubmission?.submittedAt || null,
        updatedAt: registration.finalSubmission?.updatedAt || null
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load final submissions' });
  }
};

export const updateFinalSubmissionConfig = async (req, res) => {
  try {
    const workshop = await getHackathon(req.params.workshopId);
    if (!workshop || workshop.eventType !== 'hackathon') return res.status(404).json({ message: 'Hackathon not found' });
    const fields = cleanFields(req.body.fields || []);
    const enabled = Boolean(req.body.enabled);
    if (enabled && fields.length === 0) return res.status(400).json({ message: 'Add at least one field before opening final submissions' });
    workshop.hackathonFinalSubmissionTitle = String(req.body.title || 'Final Submission').trim().slice(0, 160) || 'Final Submission';
    workshop.hackathonFinalSubmissionInstructions = String(req.body.instructions || '').trim().slice(0, 3000);
    workshop.hackathonFinalSubmissionFields = fields;
    workshop.hackathonFinalSubmissionEnabled = enabled;
    workshop.updatedAt = new Date();
    await workshop.save();
    res.json({ message: enabled ? 'Final submissions are open' : 'Final submission settings saved', workshop });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Unable to save final submission settings' });
  }
};

export const getTeamFinalSubmission = async (req, res) => {
  try {
    const workshop = await getHackathon(req.params.workshopId).lean();
    if (!workshop || workshop.eventType !== 'hackathon') return res.status(404).json({ message: 'Hackathon not found' });
    const registration = await Registration.findOne({ workshopId: workshop._id, userId: req.user.id, status: 'confirmed' })
      .select('teamCode finalSubmission').lean();
    if (!registration) return res.status(403).json({ message: 'Only confirmed teams can access this form' });
    if (!workshop.hackathonFinalSubmissionEnabled && !registration.finalSubmission?.submittedAt) {
      return res.status(403).json({ message: 'Final submissions are not open' });
    }
    res.json({
      workshop: {
        _id: workshop._id,
        title: workshop.title,
        enabled: workshop.hackathonFinalSubmissionEnabled,
        formTitle: workshop.hackathonFinalSubmissionTitle,
        instructions: workshop.hackathonFinalSubmissionInstructions,
        fields: workshop.hackathonFinalSubmissionFields || []
      },
      registration: {
        teamCode: registration.teamCode,
        formData: safeFormData(registration.finalSubmission?.formData, workshop.hackathonFinalSubmissionFields || []),
        submittedAt: registration.finalSubmission?.submittedAt || null,
        updatedAt: registration.finalSubmission?.updatedAt || null
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load the final submission form' });
  }
};

export const submitTeamFinalSubmission = async (req, res) => {
  try {
    const workshop = await getHackathon(req.params.workshopId);
    if (!workshop || workshop.eventType !== 'hackathon') {
      cleanupFiles(req.files);
      return res.status(404).json({ message: 'Hackathon not found' });
    }
    if (!workshop.hackathonFinalSubmissionEnabled) {
      cleanupFiles(req.files);
      return res.status(403).json({ message: 'Final submissions are closed' });
    }
    const registration = await Registration.findOne({ workshopId: workshop._id, userId: req.user.id, status: 'confirmed' });
    if (!registration) {
      cleanupFiles(req.files);
      return res.status(403).json({ message: 'Only confirmed teams can submit' });
    }
    let incoming = {};
    try { incoming = JSON.parse(req.body.formData || '{}'); } catch { incoming = {}; }
    const fields = workshop.hackathonFinalSubmissionFields || [];
    const fieldsById = new Map(fields.map(field => [field.fieldId, field]));
    const uploadBytes = (req.files || []).reduce((total, file) => total + (file.size || 0), 0);
    if (uploadBytes > 8 * 1024 * 1024) {
      cleanupFiles(req.files);
      return res.status(413).json({ message: 'Final submission uploads must be 8 MB or less in total' });
    }
    const merged = { ...mapToObject(registration.finalSubmission?.formData) };
    for (const [key, value] of Object.entries(incoming)) {
      if (!fieldsById.has(key)) continue;
      merged[key] = Array.isArray(value) ? value.map(String).join(', ') : String(value ?? '').trim().slice(0, 10000);
    }
    for (const file of (req.files || [])) {
      const field = fieldsById.get(file.fieldname);
      if (!field || !['image', 'file'].includes(field.type)) {
        if (file.path) fs.unlink(file.path, () => {});
        continue;
      }
      merged[file.fieldname] = await serializeFile(file);
    }
    for (const field of fields) {
      const value = String(merged[field.fieldId] || '').trim();
      if (field.required && !value) {
        cleanupFiles(req.files);
        return res.status(400).json({ message: `${field.label} is required` });
      }
      if (['select', 'radio'].includes(field.type) && value && !field.options.includes(value)) {
        cleanupFiles(req.files);
        return res.status(400).json({ message: `${field.label} contains an invalid option` });
      }
    }
    const now = new Date();
    registration.finalSubmission = {
      formData: merged,
      submittedAt: registration.finalSubmission?.submittedAt || now,
      updatedAt: now
    };
    registration.updatedAt = now;
    await registration.save();
    res.json({ message: 'Final submission confirmed', submittedAt: registration.finalSubmission.submittedAt, updatedAt: now });
  } catch (error) {
    cleanupFiles(req.files);
    res.status(500).json({ message: 'Unable to save final submission' });
  }
};
