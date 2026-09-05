import jwt from 'jsonwebtoken';
import ExcelJS from 'exceljs';
import Entry from '../models/Entry.js';
import Registration from '../models/Registration.js';
import Workshop from '../models/Workshop.js';
import HackathonEntry from '../models/HackathonEntry.js';
import { ensureHackathonTeamMembers } from '../utils/hackathonTeam.js';

const signEntryToken = (registration, member = null) => jwt.sign({
  purpose: member ? 'hackathon-entry-pass' : 'entry-pass',
  registrationId: registration._id.toString(),
  workshopId: registration.workshopId._id?.toString?.() || registration.workshopId.toString(),
  userId: registration.userId._id?.toString?.() || registration.userId.toString(),
  ...(member ? { memberId: member._id.toString() } : {})
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

const serializeHackathonEntry = (entry, registration = null, member = null) => entry ? ({
  _id: entry._id,
  registrationId: entry.registrationId,
  memberId: entry.memberId,
  checkedInAt: entry.checkedInAt,
  lastScannedAt: entry.lastScannedAt,
  scanCount: entry.scanCount,
  scannedBy: entry.scannedBy ? { _id: entry.scannedBy._id, name: entry.scannedBy.name, email: entry.scannedBy.email } : null,
  user: {
    _id: member?._id || entry.memberId,
    name: member?.name || entry.memberName,
    email: member?.email || registration?.userId?.email || '',
    profilePhoto: registration?.userId?.profilePhoto || ''
  }
}) : null;

const serializeEntryWorkshop = (workshop) => ({
  _id: workshop._id,
  title: workshop.title,
  eventType: workshop.eventType,
  date: workshop.date,
  startDate: workshop.startDate,
  endDate: workshop.endDate,
  dailyTimings: workshop.dailyTimings,
  venue: workshop.venue,
  duration: workshop.duration,
  entryPassEnabled: workshop.entryPassEnabled
});

const serializeConfirmedRegistration = (registration, entry = null) => ({
  _id: registration._id,
  status: registration.status,
  createdAt: registration.createdAt,
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
      .populate('workshopId', 'title eventType date startDate endDate dailyTimings venue duration entryPassEnabled registrationFormFields')
      .populate('userId', 'name email profilePhoto');

    if (!registration) return res.status(404).json({ message: 'Entry pass not found' });
    if (!isEntryPassEnabled(registration.workshopId)) {
      return res.status(403).json({ message: 'Entry pass is not enabled for this event' });
    }
    if (registration.status !== 'confirmed') {
      return res.status(403).json({ message: 'Entry pass is available only after confirmation' });
    }

    if (registration.workshopId.eventType === 'hackathon') {
      await ensureHackathonTeamMembers(registration, registration.workshopId);
      if (registration.teamMembers.length !== 4) return res.status(400).json({ message: 'Four team members are required before entry passes can be generated' });
      const entries = await HackathonEntry.find({ registrationId: registration._id }).populate('scannedBy', 'name email');
      const entryByMember = new Map(entries.map(entry => [String(entry.memberId), entry]));
      return res.json({
        registrationId: registration._id,
        workshop: serializeEntryWorkshop(registration.workshopId),
        teamCode: registration.teamCode,
        passes: registration.teamMembers.map(member => ({
          token: signEntryToken(registration, member),
          passCode: `${member.pin}-${registration._id.toString().slice(-4).toUpperCase()}`,
          pin: member.pin,
          user: { _id: member._id, name: member.name, email: member.email || registration.userId.email },
          entry: serializeHackathonEntry(entryByMember.get(String(member._id)), registration, member)
        }))
      });
    }

    const entry = await Entry.findOne({ registrationId: registration._id })
      .populate('scannedBy', 'name email')
      .populate('userId', 'name email profilePhoto');
    const token = signEntryToken(registration);

    res.json({
      registrationId: registration._id,
      token,
      passCode: registration._id.toString().slice(-8).toUpperCase(),
      workshop: serializeEntryWorkshop(registration.workshopId),
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
    const workshop = await Workshop.findById(req.params.workshopId)
      .select('title eventType date startDate endDate dailyTimings venue duration entryPassEnabled registrationFormFields');
    if (!workshop) return res.status(404).json({ message: 'Event not found' });
    if (!isEntryPassEnabled(workshop)) {
      return res.status(403).json({ message: 'Entry pass is not enabled for this event' });
    }

    const registrations = await Registration.find({
      workshopId: workshop._id,
      status: 'confirmed'
    })
      .select('status createdAt userId teamCode teamMembers formData')
      .populate('userId', 'name email profilePhoto')
      .sort({ createdAt: 1 });

    if (workshop.eventType === 'hackathon') {
      await Promise.all(registrations.map(registration => ensureHackathonTeamMembers(registration, workshop)));
      const entries = await HackathonEntry.find({ workshopId: workshop._id }).populate('scannedBy', 'name email').sort({ checkedInAt: -1 });
      const entryByMember = new Map(entries.map(entry => [`${entry.registrationId}:${entry.memberId}`, entry]));
      const confirmed = registrations.flatMap(registration => registration.teamMembers.map(member => ({
        _id: `${registration._id}:${member._id}`,
        registrationId: registration._id,
        status: registration.status,
        createdAt: registration.createdAt,
        teamCode: registration.teamCode,
        pin: member.pin,
        user: { _id: member._id, name: member.name, email: member.email || registration.userId?.email || '', profilePhoto: registration.userId?.profilePhoto || '' },
        entry: serializeHackathonEntry(entryByMember.get(`${registration._id}:${member._id}`), registration, member)
      })));
      const entered = confirmed.filter(item => item.entry);
      const notEntered = confirmed.filter(item => !item.entry);
      return res.json({ workshop: serializeEntryWorkshop(workshop), counts: { confirmed: confirmed.length, entered: entered.length, notEntered: notEntered.length, entryPercentage: confirmed.length ? Math.round((entered.length / confirmed.length) * 100) : 0 }, entered, notEntered });
    }

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
      workshop: serializeEntryWorkshop(workshop),
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
    console.error('Entry report error:', {
      workshopId: req.params.workshopId,
      message: error.message,
      stack: error.stack
    });
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

    if (!['entry-pass', 'hackathon-entry-pass'].includes(payload.purpose) || payload.workshopId !== req.params.workshopId) {
      return res.status(400).json({ message: 'This pass is not valid for this event' });
    }

    const workshop = await Workshop.findById(req.params.workshopId).select('entryPassEnabled eventType');
    if (!workshop) return res.status(404).json({ message: 'Event not found' });
    if (!isEntryPassEnabled(workshop)) {
      return res.status(403).json({ message: 'Entry pass is not enabled for this event' });
    }

    if (workshop.eventType === 'hackathon') {
      if (payload.purpose !== 'hackathon-entry-pass' || !payload.memberId) return res.status(400).json({ message: 'This is not a valid hackathon member pass' });
      const registration = await Registration.findOne({ _id: payload.registrationId, workshopId: req.params.workshopId, status: 'confirmed', 'teamMembers._id': payload.memberId }).populate('userId', 'name email profilePhoto');
      if (!registration) return res.status(404).json({ message: 'Confirmed team member not found for this pass' });
      const member = registration.teamMembers.id(payload.memberId);
      const existing = await HackathonEntry.findOne({ registrationId: registration._id, memberId: member._id }).populate('scannedBy', 'name email');
      if (existing) {
        existing.scanCount += 1; existing.lastScannedAt = new Date(); await existing.save();
        return res.json({ success: true, alreadyEntered: true, message: `${member.name} has already entered`, entry: serializeHackathonEntry(existing, registration, member) });
      }
      const entry = await HackathonEntry.create({ workshopId: registration.workshopId, registrationId: registration._id, memberId: member._id, memberName: member.name, memberPin: member.pin, scannedBy: req.user.id });
      await entry.populate('scannedBy', 'name email');
      return res.status(201).json({ success: true, alreadyEntered: false, message: 'Entry confirmed', entry: serializeHackathonEntry(entry, registration, member) });
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
    const workshop = await Workshop.findById(req.params.workshopId)
      .select('title eventType entryPassEnabled registrationFormFields')
      .lean();
    if (!workshop) return res.status(404).json({ message: 'Event not found' });
    if (!isEntryPassEnabled(workshop)) {
      return res.status(403).json({ message: 'Entry pass is not enabled for this event' });
    }

    const registrations = await Registration.find({
      workshopId: workshop._id,
      status: 'confirmed'
    }).populate('userId', 'name email profilePhoto');
    if (workshop.eventType === 'hackathon') {
      await Promise.all(registrations.map(registration => ensureHackathonTeamMembers(registration, workshop)));
      const entries = await HackathonEntry.find({ workshopId: workshop._id }).populate('scannedBy', 'name email');
      const entryByMember = new Map(entries.map(entry => [`${entry.registrationId}:${entry.memberId}`, entry]));
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Entry Report');
      worksheet.columns = [
        { header: 'Team', key: 'team', width: 22 }, { header: 'Member Name', key: 'name', width: 28 },
        { header: 'PIN', key: 'pin', width: 10 }, { header: 'Email', key: 'email', width: 34 },
        { header: 'Entry Status', key: 'status', width: 16 }, { header: 'Entry Time', key: 'entryTime', width: 26 },
        { header: 'Scanned By', key: 'scannedBy', width: 28 }, { header: 'Scan Count', key: 'scanCount', width: 12 }
      ];
      registrations.forEach(registration => registration.teamMembers.forEach(member => {
        const entry = entryByMember.get(`${registration._id}:${member._id}`);
        worksheet.addRow({ team: registration.teamCode, name: member.name, pin: member.pin, email: member.email || registration.userId?.email || '', status: entry ? 'Entered' : 'Not Entered', entryTime: entry ? new Date(entry.checkedInAt).toLocaleString('en-IN') : '', scannedBy: entry?.scannedBy?.name || '', scanCount: entry?.scanCount || '' });
      }));
      worksheet.getRow(1).font = { bold: true };
      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${workshop.title.replace(/[^a-z0-9]+/gi, '-')}-entry-report.xlsx"`);
      return res.send(buffer);
    }
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
