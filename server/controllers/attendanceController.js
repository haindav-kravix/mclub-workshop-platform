import Attendance from '../models/Attendance.js';
import AttendanceSession from '../models/AttendanceSession.js';
import Registration from '../models/Registration.js';
import Workshop from '../models/Workshop.js';

const normalizeDate = (date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

export const getAttendanceRoster = async (req, res) => {
  try {
    const { workshopId } = req.params;
    const { date } = req.query;

    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    const registrations = await Registration.find({ workshopId, status: 'confirmed' })
      .populate('userId', 'name email profilePhoto')
      .sort({ createdAt: 1 });

    const attendance = date
      ? await Attendance.findOne({ workshopId, date: normalizeDate(date) })
      : null;
    const statusByUser = new Map((attendance?.entries || []).map(entry => [
      entry.userId.toString(),
      entry.status
    ]));
    const sourceByUser = new Map((attendance?.entries || []).map(entry => [
      entry.userId.toString(),
      entry.source || 'manual'
    ]));

    res.json({
      workshop,
      date,
      roster: registrations.map(registration => ({
        user: registration.userId,
        registrationId: registration._id,
        status: statusByUser.get(registration.userId._id.toString()) || 'absent',
        source: sourceByUser.get(registration.userId._id.toString()) || 'manual'
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error loading attendance roster', error: error.message });
  }
};

export const submitAttendance = async (req, res) => {
  try {
    const { workshopId } = req.params;
    const { date, entries } = req.body;

    if (!date || !Array.isArray(entries)) {
      return res.status(400).json({ message: 'Date and attendance entries are required' });
    }

    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    const registeredUsers = await Registration.find({ workshopId, status: 'confirmed' }).select('userId');
    const registeredUserIds = new Set(registeredUsers.map(registration => registration.userId.toString()));
    const incomingStatusByUser = new Map(
      entries
        .filter(entry => registeredUserIds.has(entry.userId))
        .map(entry => [entry.userId, entry.status === 'present' ? 'present' : 'absent'])
    );
    const currentAttendance = await Attendance.findOne({ workshopId, date: normalizeDate(date) });
    const qrPresentUsers = new Set(
      (currentAttendance?.entries || [])
        .filter(entry => entry.source === 'qr' && entry.status === 'present')
        .map(entry => entry.userId.toString())
    );
    const cleanEntries = registeredUsers.map(registration => {
      const userId = registration.userId.toString();
      if (qrPresentUsers.has(userId)) {
        return { userId, status: 'present', source: 'qr' };
      }

      return {
        userId,
        status: incomingStatusByUser.get(userId) || 'absent',
        source: 'manual'
      };
    });

    const attendance = await Attendance.findOneAndUpdate(
      { workshopId, date: normalizeDate(date) },
      {
        workshopId,
        date: normalizeDate(date),
        entries: cleanEntries,
        submittedBy: req.user.id,
        updatedAt: new Date()
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate('entries.userId', 'name email profilePhoto');

    res.json({ success: true, attendance });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting attendance', error: error.message });
  }
};

export const getAttendanceReports = async (req, res) => {
  try {
    const { workshopId } = req.params;
    const reports = await Attendance.find({ workshopId })
      .populate('entries.userId', 'name email profilePhoto')
      .populate('submittedBy', 'name email')
      .sort({ date: 1 });

    res.json(reports.map(report => {
      const present = report.entries.filter(entry => entry.status === 'present');
      const absent = report.entries.filter(entry => entry.status === 'absent');
      return {
        _id: report._id,
        date: report.date,
        submittedBy: report.submittedBy,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
        presentCount: present.length,
        absentCount: absent.length,
        present,
        absent
      };
    }));
  } catch (error) {
    res.status(500).json({ message: 'Error loading attendance reports', error: error.message });
  }
};

export const getQrSession = async (req, res) => {
  try {
    const { workshopId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const session = await AttendanceSession.findOne({
      workshopId,
      date: normalizeDate(date)
    });

    res.json({
      workshopId,
      date: normalizeDate(date),
      qrEnabled: session?.qrEnabled || false,
      manualEnabled: session?.manualEnabled || false
    });
  } catch (error) {
    res.status(500).json({ message: 'Error loading QR session', error: error.message });
  }
};

export const setQrSession = async (req, res) => {
  try {
    const { workshopId } = req.params;
    const { date, qrEnabled, manualEnabled } = req.body;

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    const session = await AttendanceSession.findOneAndUpdate(
      { workshopId, date: normalizeDate(date) },
      {
        workshopId,
        date: normalizeDate(date),
        ...(typeof qrEnabled === 'boolean' ? { qrEnabled } : {}),
        ...(typeof manualEnabled === 'boolean' ? { manualEnabled } : {}),
        updatedBy: req.user.id,
        updatedAt: new Date()
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ message: 'Error updating QR session', error: error.message });
  }
};

export const qrCheckIn = async (req, res) => {
  try {
    const { workshopId } = req.params;
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({ message: 'Attendance date is required' });
    }

    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    const session = await AttendanceSession.findOne({
      workshopId,
      date: normalizeDate(date)
    });

    if (!session?.qrEnabled) {
      return res.status(403).json({ message: 'Attendance is done for the day' });
    }

    const registration = await Registration.findOne({
      workshopId,
      userId: req.user.id,
      status: 'confirmed'
    }).populate('userId', 'name email profilePhoto');

    if (!registration) {
      return res.status(403).json({
        message: 'Attendance can only be marked with the Google account used for this workshop registration'
      });
    }

    const attendanceDate = normalizeDate(date);
    let attendance = await Attendance.findOne({ workshopId, date: attendanceDate });
    const registeredUsers = await Registration.find({ workshopId, status: 'confirmed' }).select('userId');

    if (!attendance) {
      attendance = new Attendance({
        workshopId,
        date: attendanceDate,
        submittedBy: req.user.id,
        entries: registeredUsers.map(item => ({
          userId: item.userId,
          status: item.userId.toString() === req.user.id ? 'present' : 'absent',
          source: item.userId.toString() === req.user.id ? 'qr' : 'manual'
        }))
      });
    } else {
      const existingIds = new Set(attendance.entries.map(entry => entry.userId.toString()));
      registeredUsers.forEach(item => {
        if (!existingIds.has(item.userId.toString())) {
          attendance.entries.push({ userId: item.userId, status: 'absent', source: 'manual' });
        }
      });

      const entry = attendance.entries.find(item => item.userId.toString() === req.user.id);
      if (entry) {
        entry.status = 'present';
        entry.source = 'qr';
      } else {
        attendance.entries.push({ userId: req.user.id, status: 'present', source: 'qr' });
      }
      attendance.updatedAt = new Date();
    }

    await attendance.save();

    res.json({
      success: true,
      message: 'Attendance marked present',
      workshop,
      date: attendanceDate,
      user: registration.userId
    });
  } catch (error) {
    res.status(500).json({ message: 'Error marking QR attendance', error: error.message });
  }
};
