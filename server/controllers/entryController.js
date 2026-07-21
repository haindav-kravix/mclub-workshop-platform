import jwt from 'jsonwebtoken';
import ExcelJS from 'exceljs';
import Entry from '../models/Entry.js';
import Registration from '../models/Registration.js';
import Workshop from '../models/Workshop.js';

const signEntryToken = (registration) => jwt.sign({
  purpose: 'entry-pass',
  registrationId: registration._id.toString(),
  workshopId: registration.workshopId._id?.toString?.() || registration.workshopId.toString(),
  userId: registration.userId._id?.toString?.() || registration.userId.toString()
}, process.env.JWT_SECRET, { expiresIn: '30d' });

const extractToken = (value = '') => {
  const text = String(value || '').trim();
  if (!text) return '';
  try {
    const url = new URL(text);
    return url.searchParams.get('entryToken') || url.searchParams.get('token') || text;
  } catch {
    return text;
  }
};

const isEntryPassEnabled = (workshop) => workshop?.entryPassEnabled !== false;

const serializeEntry = (entry) => ({
  _id: entry._id,
  registrationId: entry.registrationId?._id || entry.registrationId,
  checkedInAt: entry.checkedInAt,
  lastScannedAt: entry.lastScannedAt,
  scanCount: entry.scanCount,
  scannedBy: entry.scannedBy ? {
    _id: entry.scannedBy._id,
    name: entry.scannedBy.name,
    email: entry.scannedBy.email
  } : null,
  user: entry.userId ? {
    _id: entry.userId._id,
    name: entry.userId.name,
    email: entry.userId.email,
    profilePhoto: entry.userId.profilePhoto
  } : null
});

const serializeConfirmedRegistration = (registration, entry = null) => ({
  _id: registration._id,
  status: registration.status,
  createdAt: registration.createdAt,
  formData: registration.formData,
  user: registration.userId ? {
    _id: registration.userId._id,
    name: registration.userId.name,
    email: registration.userId.email,
    profilePhoto: registration.userId.profilePhoto
  } : null,
  entry: entry ? serializeEntry(entry) : null
});

export const getMyEntryPass = async (req, res) => {
  try {
    const registration = await Registration.findOne({
      _id: req.params.registrationId,
      userId: req.user.id
    })
      .populate('workshopId')
      .populate('userId', 'name email profilePhoto');

    if (!registration) return res.status(404).json({ message: 'Entry pass not found' });
    if (!isEntryPassEnabled(registration.workshopId)) {
      return res.status(403).json({ message: 'Entry pass is not enabled for this event' });
    }
    if (registration.status !== 'confirmed') {
      return res.status(403).json({ message: 'Entry pass is available only after confirmation' });
    }

    const entry = await Entry.findOne({ registrationId: registration._id })
      .populate('scannedBy', 'name email')
      .populate('userId', 'name email profilePhoto');
    const token = signEntryToken(registration);

    res.json({
      registrationId: registration._id,
      token,
      passCode: registration._id.toString().slice(-8).toUpperCase(),
      workshop: registration.workshopId,
      user: {
        _id: registration.userId._id,
        name: registration.userId.name,
        email: registration.userId.email,
        profilePhoto: registration.userId.profilePhoto
      },
      entry: entry ? serializeEntry(entry) : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load entry pass' });
  }
};

export const getEntryReport = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.workshopId);
    if (!workshop) return res.status(404).json({ message: 'Event not found' });
    if (!isEntryPassEnabled(workshop)) {
      return res.status(403).json({ message: 'Entry pass is not enabled for this event' });
    }

    const registrations = await Registration.find({
      workshopId: workshop._id,
      status: 'confirmed'
    })
      .populate('userId', 'name email profilePhoto')
      .sort({ createdAt: 1 });

    const entries = await Entry.find({ workshopId: workshop._id })
      .populate('userId', 'name email profilePhoto')
      .populate('scannedBy', 'name email')
      .sort({ checkedInAt: -1 });

    const entryByRegistration = new Map(entries.map(entry => [entry.registrationId.toString(), entry]));
    const confirmed = registrations.map(registration => serializeConfirmedRegistration(
      registration,
      entryByRegistration.get(registration._id.toString())
    ));
    const entered = confirmed.filter(item => item.entry);
    const notEntered = confirmed.filter(item => !item.entry);

    res.json({
      workshop,
      counts: {
        confirmed: confirmed.length,
        entered: entered.length,
        notEntered: notEntered.length,
        entryPercentage: confirmed.length ? Math.round((entered.length / confirmed.length) * 100) : 0
      },
      entered,
      notEntered
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load entry report' });
  }
};

export const scanEntryPass = async (req, res) => {
  try {
    const token = extractToken(req.body.token || req.body.entryToken || req.body.value);
    if (!token) return res.status(400).json({ message: 'Entry pass token is required' });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ message: 'Invalid or expired entry pass' });
    }

    if (payload.purpose !== 'entry-pass' || payload.workshopId !== req.params.workshopId) {
      return res.status(400).json({ message: 'This pass is not valid for this event' });
    }

    const workshop = await Workshop.findById(req.params.workshopId).select('entryPassEnabled');
    if (!workshop) return res.status(404).json({ message: 'Event not found' });
    if (!isEntryPassEnabled(workshop)) {
      return res.status(403).json({ message: 'Entry pass is not enabled for this event' });
    }

    const registration = await Registration.findOne({
      _id: payload.registrationId,
      workshopId: req.params.workshopId,
      status: 'confirmed'
    }).populate('userId', 'name email profilePhoto');

    if (!registration) {
      return res.status(404).json({ message: 'Confirmed registration not found for this pass' });
    }

    const existing = await Entry.findOne({ registrationId: registration._id })
      .populate('userId', 'name email profilePhoto')
      .populate('scannedBy', 'name email');

    if (existing) {
      existing.scanCount += 1;
      existing.lastScannedAt = new Date();
      await existing.save();
      return res.json({
        success: true,
        alreadyEntered: true,
        message: 'This student has already entered',
        entry: serializeEntry(existing)
      });
    }

    const entry = await Entry.create({
      workshopId: registration.workshopId,
      registrationId: registration._id,
      userId: registration.userId._id,
      scannedBy: req.user.id,
      checkedInAt: new Date(),
      lastScannedAt: new Date()
    });
    await entry.populate('userId', 'name email profilePhoto');
    await entry.populate('scannedBy', 'name email');

    res.status(201).json({
      success: true,
      alreadyEntered: false,
      message: 'Entry confirmed',
      entry: serializeEntry(entry)
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to verify entry pass' });
  }
};

export const exportEntryReport = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.workshopId);
    if (!workshop) return res.status(404).json({ message: 'Event not found' });
    if (!isEntryPassEnabled(workshop)) {
      return res.status(403).json({ message: 'Entry pass is not enabled for this event' });
    }

    const registrations = await Registration.find({
      workshopId: workshop._id,
      status: 'confirmed'
    }).populate('userId', 'name email');
    const entries = await Entry.find({ workshopId: workshop._id })
      .populate('scannedBy', 'name email');
    const entryByRegistration = new Map(entries.map(entry => [entry.registrationId.toString(), entry]));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Entry Report');
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 28 },
      { header: 'Email', key: 'email', width: 34 },
      { header: 'Entry Status', key: 'status', width: 16 },
      { header: 'Entry Time', key: 'entryTime', width: 26 },
      { header: 'Scanned By', key: 'scannedBy', width: 28 },
      { header: 'Scan Count', key: 'scanCount', width: 12 }
    ];

    registrations.forEach(registration => {
      const entry = entryByRegistration.get(registration._id.toString());
      worksheet.addRow({
        name: registration.userId?.name || '',
        email: registration.userId?.email || '',
        status: entry ? 'Entered' : 'Not Entered',
        entryTime: entry ? new Date(entry.checkedInAt).toLocaleString('en-IN') : '',
        scannedBy: entry?.scannedBy?.name || '',
        scanCount: entry?.scanCount || ''
      });
    });

    worksheet.getRow(1).font = { bold: true };
    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${workshop.title.replace(/[^a-z0-9]+/gi, '-')}-entry-report.xlsx"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: 'Unable to export entry report' });
  }
};
