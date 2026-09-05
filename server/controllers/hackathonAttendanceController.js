import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import Workshop from '../models/Workshop.js';
import Registration from '../models/Registration.js';
import HackathonAttendanceSession from '../models/HackathonAttendanceSession.js';
import { ensureHackathonTeamMembers } from '../utils/hackathonTeam.js';

const loadHackathon = async (workshopId) => {
  if (!mongoose.isValidObjectId(workshopId)) return null;
  return Workshop.findOne({ _id: workshopId, eventType: 'hackathon' }).select('title eventType registrationFormFields').lean();
};

const serializeTeam = (registration) => ({
  _id: registration._id,
  teamCode: registration.teamCode,
  leader: registration.userId,
  teamMembers: registration.teamMembers || []
});

const safeFileName = (value = 'attendance') => String(value).replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'attendance';

const loadReportData = async (workshopId) => {
  const workshop = await loadHackathon(workshopId);
  if (!workshop) return null;
  const [registrations, sessions] = await Promise.all([
    Registration.find({ workshopId, status: 'confirmed' }).select('teamCode teamMembers formData userId createdAt').populate('userId', 'name email').sort({ createdAt: 1 }),
    HackathonAttendanceSession.find({ workshopId }).sort({ date: 1, createdAt: 1 }).lean()
  ]);
  await Promise.all(registrations.map(registration => ensureHackathonTeamMembers(registration, workshop)));
  const teams = registrations.map(registration => ({
    _id: registration._id,
    teamCode: registration.teamCode,
    teamMembers: registration.teamMembers.map(member => {
      const attendance = sessions.map(session => {
        const entry = (session.entries || []).find(item => String(item.registrationId) === String(registration._id) && String(item.memberId) === String(member._id));
        return { sessionId: session._id, status: entry?.status || 'absent', source: entry?.source || '', markedAt: entry?.markedAt || null };
      });
      const present = attendance.filter(item => item.status === 'present').length;
      return { _id: member._id, name: member.name, email: member.email, rollNumber: member.rollNumber, college: member.college, pin: member.pin, attendance, present, total: sessions.length, percentage: sessions.length ? Math.round((present / sessions.length) * 100) : 0 };
    })
  }));
  const members = teams.flatMap(team => team.teamMembers);
  const presentMarks = members.reduce((total, member) => total + member.present, 0);
  const possibleMarks = members.length * sessions.length;
  return { workshop, sessions: sessions.map(({ entries = [], ...session }) => ({ ...session, present: entries.filter(entry => entry.status === 'present').length, total: members.length })), teams, totals: { teams: teams.length, members: members.length, sessions: sessions.length, presentMarks, possibleMarks, percentage: possibleMarks ? Math.round((presentMarks / possibleMarks) * 100) : 0 } };
};

export const getTeams = async (req, res) => {
  try {
    const workshop = await loadHackathon(req.params.workshopId);
    if (!workshop) return res.status(404).json({ message: 'Hackathon not found' });
    const registrations = await Registration.find({ workshopId: workshop._id, status: 'confirmed' })
      .select('teamCode teamMembers formData userId createdAt')
      .populate('userId', 'name email')
      .sort({ createdAt: 1 });
    await Promise.all(registrations.map(registration => ensureHackathonTeamMembers(registration, workshop)));
    res.json({ workshop, teams: registrations.map(serializeTeam) });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load hackathon teams', error: error.message });
  }
};

const buildRoster = async (session) => {
  const workshop = await loadHackathon(session.workshopId);
  const teams = await Registration.find({ workshopId: session.workshopId, status: 'confirmed' })
    .select('teamCode teamMembers formData userId createdAt')
    .populate('userId', 'name email')
    .sort({ createdAt: 1 });
  await Promise.all(teams.map(team => ensureHackathonTeamMembers(team, workshop)));
  const entryMap = new Map(session.entries.map(entry => [`${entry.registrationId}:${entry.memberId}`, entry]));
  return teams.map(teamDocument => {
    const team = teamDocument.toObject();
    return ({
    ...serializeTeam(teamDocument),
    teamMembers: (team.teamMembers || []).map(member => {
      const entry = entryMap.get(`${team._id}:${member._id}`);
      return { ...member, status: entry?.status || 'absent', source: entry?.source || '', markedAt: entry?.markedAt || null };
    })
  });
  });
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

export const deleteSession = async (req, res) => {
  try {
    const session = await HackathonAttendanceSession.findOneAndDelete({ _id: req.params.sessionId, workshopId: req.params.workshopId });
    if (!session) return res.status(404).json({ message: 'Attendance session not found' });
    res.json({ success: true, message: 'Attendance session deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete attendance session', error: error.message });
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

export const getAttendanceReports = async (req, res) => {
  try {
    const report = await loadReportData(req.params.workshopId);
    if (!report) return res.status(404).json({ message: 'Hackathon not found' });
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load hackathon attendance reports', error: error.message });
  }
};

const styleWorksheet = (worksheet) => {
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047857' } };
  worksheet.eachRow(row => row.eachCell(cell => { cell.alignment = { vertical: 'top', wrapText: true }; }));
};

export const exportAttendanceReport = async (req, res) => {
  try {
    const report = await loadReportData(req.params.workshopId);
    if (!report) return res.status(404).json({ message: 'Hackathon not found' });
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Overall Attendance');
    worksheet.columns = [
      { header: 'S.No', key: 'sno', width: 8 }, { header: 'Team Name', key: 'team', width: 22 },
      { header: 'Member Name', key: 'name', width: 28 }, { header: 'PIN', key: 'pin', width: 10 },
      { header: 'Email', key: 'email', width: 32 }, { header: 'Roll Number', key: 'rollNumber', width: 18 },
      ...report.sessions.map((session, index) => ({ header: `${index + 1}. ${session.title} (${new Date(session.date).toLocaleDateString('en-IN')})`, key: `session${index}`, width: 24 })),
      { header: 'Present', key: 'present', width: 12 }, { header: 'Total Sessions', key: 'total', width: 15 }, { header: 'Attendance %', key: 'percentage', width: 15 }
    ];
    let sno = 0;
    report.teams.forEach(team => team.teamMembers.forEach(member => {
      const row = { sno: ++sno, team: team.teamCode, name: member.name, pin: member.pin, email: member.email || '', rollNumber: member.rollNumber || '', present: member.present, total: member.total, percentage: member.percentage };
      member.attendance.forEach((item, index) => { row[`session${index}`] = item.status === 'present' ? 'Present' : 'Absent'; });
      worksheet.addRow(row);
    }));
    styleWorksheet(worksheet);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFileName(report.workshop.title)}-attendance-report.xlsx"`);
    await workbook.xlsx.write(res); res.end();
  } catch (error) {
    res.status(500).json({ message: 'Unable to export attendance report', error: error.message });
  }
};

export const exportSessionAttendance = async (req, res) => {
  try {
    const session = await HackathonAttendanceSession.findOne({ _id: req.params.sessionId, workshopId: req.params.workshopId }).lean();
    if (!session) return res.status(404).json({ message: 'Attendance session not found' });
    const workshop = await loadHackathon(req.params.workshopId);
    if (!workshop) return res.status(404).json({ message: 'Hackathon not found' });
    const teams = await buildRoster(session);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Session Attendance');
    worksheet.columns = [
      { header: 'S.No', key: 'sno', width: 8 }, { header: 'Team Name', key: 'team', width: 22 },
      { header: 'Member Name', key: 'name', width: 28 }, { header: 'PIN', key: 'pin', width: 10 },
      { header: 'Status', key: 'status', width: 14 }, { header: 'Marked Through', key: 'source', width: 18 }, { header: 'Marked Time', key: 'markedAt', width: 26 }
    ];
    let sno = 0;
    teams.forEach(team => team.teamMembers.forEach(member => worksheet.addRow({ sno: ++sno, team: team.teamCode, name: member.name, pin: member.pin, status: member.status === 'present' ? 'Present' : 'Absent', source: member.source ? member.source.toUpperCase() : '', markedAt: member.markedAt ? new Date(member.markedAt).toLocaleString('en-IN') : '' })));
    styleWorksheet(worksheet);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFileName(workshop.title)}-${safeFileName(session.title)}.xlsx"`);
    await workbook.xlsx.write(res); res.end();
  } catch (error) {
    res.status(500).json({ message: 'Unable to export attendance session', error: error.message });
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
    const pin = String(req.body.pin || '').trim();
    if (!/^\d{4}$/.test(pin)) return res.status(400).json({ message: 'Enter your four-digit PIN' });
    const registration = await Registration.findOne({ workshopId: session.workshopId, status: 'confirmed', 'teamMembers.pin': pin }).select('teamCode teamMembers');
    if (!registration) return res.status(404).json({ message: 'PIN is incorrect' });
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
