import mongoose from 'mongoose';
import Workshop from '../models/Workshop.js';
import Registration from '../models/Registration.js';
import HackathonAttendanceSession from '../models/HackathonAttendanceSession.js';

const loadHackathon = async (workshopId) => {
  if (!mongoose.isValidObjectId(workshopId)) return null;
  return Workshop.findOne({ _id: workshopId, eventType: 'hackathon' }).select('title eventType').lean();
};

const createUniquePin = async (workshopId, reserved) => {
  for (let attempt = 0; attempt < 10000; attempt += 1) {
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    if (reserved.has(pin)) continue;
    const exists = await Registration.exists({ workshopId, 'teamMembers.pin': pin });
    if (!exists) {
      reserved.add(pin);
      return pin;
    }
  }
  throw new Error('Unable to generate a unique member PIN');
};

const serializeTeam = (registration) => ({
  _id: registration._id,
  teamCode: registration.teamCode,
  leader: registration.userId,
  teamMembers: registration.teamMembers || []
});

export const getTeams = async (req, res) => {
  try {
    const workshop = await loadHackathon(req.params.workshopId);
    if (!workshop) return res.status(404).json({ message: 'Hackathon not found' });
    const registrations = await Registration.find({ workshopId: workshop._id, status: 'confirmed' })
      .select('teamCode teamMembers userId createdAt')
      .populate('userId', 'name email')
      .sort({ createdAt: 1 })
      .lean();
    res.json({ workshop, teams: registrations.map(serializeTeam) });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load hackathon teams', error: error.message });
  }
};

export const saveTeamMembers = async (req, res) => {
  try {
    const { workshopId, registrationId } = req.params;
    const workshop = await loadHackathon(workshopId);
    if (!workshop) return res.status(404).json({ message: 'Hackathon not found' });
    const registration = await Registration.findOne({ _id: registrationId, workshopId, status: 'confirmed' });
    if (!registration) return res.status(404).json({ message: 'Confirmed team not found' });
    const supplied = Array.isArray(req.body.members) ? req.body.members.slice(0, 4) : [];
    if (supplied.length !== 4 || supplied.some(member => !String(member.name || '').trim())) {
      return res.status(400).json({ message: 'Enter the names of all four team members' });
    }

    const ownPins = new Set((registration.teamMembers || []).map(member => member.pin).filter(Boolean));
    const reserved = new Set();
    const members = [];
    for (let index = 0; index < supplied.length; index += 1) {
      const member = supplied[index];
      const existing = registration.teamMembers?.id(member._id) || registration.teamMembers?.[index];
      let pin = existing?.pin;
      if (!pin || reserved.has(pin)) pin = await createUniquePin(workshopId, reserved);
      else {
        reserved.add(pin);
        ownPins.delete(pin);
      }
      members.push({
        _id: existing?._id || new mongoose.Types.ObjectId(),
        name: String(member.name).trim().slice(0, 120),
        email: String(member.email || '').trim().toLowerCase().slice(0, 180),
        rollNumber: String(member.rollNumber || '').trim().slice(0, 80),
        college: String(member.college || '').trim().slice(0, 180),
        pin
      });
    }
    registration.teamMembers = members;
    registration.updatedAt = new Date();
    await registration.save();
    res.json({ success: true, team: serializeTeam(registration) });
  } catch (error) {
    res.status(500).json({ message: 'Unable to save team members', error: error.message });
  }
};

const buildRoster = async (session) => {
  const teams = await Registration.find({ workshopId: session.workshopId, status: 'confirmed' })
    .select('teamCode teamMembers userId createdAt')
    .populate('userId', 'name email')
    .sort({ createdAt: 1 })
    .lean();
  const entryMap = new Map(session.entries.map(entry => [`${entry.registrationId}:${entry.memberId}`, entry]));
  return teams.map(team => ({
    ...serializeTeam(team),
    teamMembers: (team.teamMembers || []).map(member => {
      const entry = entryMap.get(`${team._id}:${member._id}`);
      return { ...member, status: entry?.status || 'absent', source: entry?.source || '', markedAt: entry?.markedAt || null };
    })
  }));
};

export const getSessions = async (req, res) => {
  try {
    const workshop = await loadHackathon(req.params.workshopId);
    if (!workshop) return res.status(404).json({ message: 'Hackathon not found' });
    const sessions = await HackathonAttendanceSession.find({ workshopId: workshop._id })
      .select('-entries')
      .sort({ date: -1, createdAt: -1 })
      .lean();
    res.json({ workshop, sessions });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load attendance sessions', error: error.message });
  }
};

export const createSession = async (req, res) => {
  try {
    const workshop = await loadHackathon(req.params.workshopId);
    if (!workshop) return res.status(404).json({ message: 'Hackathon not found' });
    const title = String(req.body.title || '').trim();
    const date = new Date(req.body.date);
    if (!title || Number.isNaN(date.getTime())) return res.status(400).json({ message: 'Session title and date are required' });
    const session = await HackathonAttendanceSession.create({ workshopId: workshop._id, title, date, createdBy: req.user.id, updatedBy: req.user.id });
    res.status(201).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ message: 'Unable to create attendance session', error: error.message });
  }
};

export const getSessionRoster = async (req, res) => {
  try {
    const session = await HackathonAttendanceSession.findOne({ _id: req.params.sessionId, workshopId: req.params.workshopId }).lean();
    if (!session) return res.status(404).json({ message: 'Attendance session not found' });
    res.json({ session, teams: await buildRoster(session) });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load attendance roster', error: error.message });
  }
};

export const setQrEnabled = async (req, res) => {
  try {
    const session = await HackathonAttendanceSession.findOneAndUpdate(
      { _id: req.params.sessionId, workshopId: req.params.workshopId },
      { $set: { qrEnabled: Boolean(req.body.enabled), updatedBy: req.user.id } },
      { new: true }
    );
    if (!session) return res.status(404).json({ message: 'Attendance session not found' });
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ message: 'Unable to update QR access', error: error.message });
  }
};

export const saveManualAttendance = async (req, res) => {
  try {
    const session = await HackathonAttendanceSession.findOne({ _id: req.params.sessionId, workshopId: req.params.workshopId });
    if (!session) return res.status(404).json({ message: 'Attendance session not found' });
    const updates = Array.isArray(req.body.entries) ? req.body.entries : [];
    const registrations = await Registration.find({
      _id: { $in: updates.map(entry => entry.registrationId) },
      workshopId: req.params.workshopId,
      status: 'confirmed'
    }).select('teamMembers').lean();
    const validMembers = new Set(registrations.flatMap(registration => (
      (registration.teamMembers || []).map(member => `${registration._id}:${member._id}`)
    )));
    for (const update of updates) {
      if (!validMembers.has(`${update.registrationId}:${update.memberId}`)) continue;
      const index = session.entries.findIndex(entry => String(entry.registrationId) === String(update.registrationId) && String(entry.memberId) === String(update.memberId));
      const entry = { registrationId: update.registrationId, memberId: update.memberId, status: update.status === 'present' ? 'present' : 'absent', source: 'manual', markedAt: update.status === 'present' ? new Date() : undefined };
      if (index >= 0) session.entries[index] = entry;
      else session.entries.push(entry);
    }
    session.updatedBy = req.user.id;
    await session.save();
    res.json({ success: true, teams: await buildRoster(session.toObject()) });
  } catch (error) {
    res.status(500).json({ message: 'Unable to save attendance', error: error.message });
  }
};

export const getPublicSession = async (req, res) => {
  try {
    const session = await HackathonAttendanceSession.findById(req.params.sessionId).select('workshopId title date qrEnabled').populate('workshopId', 'title eventType').lean();
    if (!session || session.workshopId?.eventType !== 'hackathon') return res.status(404).json({ message: 'Attendance session not found' });
    res.json({ _id: session._id, title: session.title, date: session.date, qrEnabled: session.qrEnabled, workshop: { title: session.workshopId.title } });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load attendance session', error: error.message });
  }
};

export const memberCheckIn = async (req, res) => {
  try {
    const session = await HackathonAttendanceSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: 'Attendance session not found' });
    if (!session.qrEnabled) return res.status(403).json({ message: 'QR attendance is currently closed' });
    const teamCode = String(req.body.teamCode || '').trim().toUpperCase();
    const pin = String(req.body.pin || '').trim();
    if (!/^\d{4}$/.test(pin)) return res.status(400).json({ message: 'Enter your four-digit PIN' });
    const registration = await Registration.findOne({ workshopId: session.workshopId, status: 'confirmed', teamCode, 'teamMembers.pin': pin }).select('teamCode teamMembers');
    if (!registration) return res.status(404).json({ message: 'Team name or PIN is incorrect' });
    const member = registration.teamMembers.find(item => item.pin === pin);
    const existing = session.entries.find(entry => String(entry.registrationId) === String(registration._id) && String(entry.memberId) === String(member._id));
    if (existing?.status === 'present') return res.status(409).json({ message: `${member.name} is already marked present`, alreadyMarked: true });
    if (existing) Object.assign(existing, { status: 'present', source: 'qr', markedAt: new Date() });
    else session.entries.push({ registrationId: registration._id, memberId: member._id, status: 'present', source: 'qr', markedAt: new Date() });
    await session.save();
    res.json({ success: true, message: 'Attendance marked', member: { name: member.name, teamCode: registration.teamCode } });
  } catch (error) {
    res.status(500).json({ message: 'Unable to mark attendance', error: error.message });
  }
};
