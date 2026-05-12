import Attendance from '../models/Attendance.js';
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

    res.json({
      workshop,
      date,
      roster: registrations.map(registration => ({
        user: registration.userId,
        registrationId: registration._id,
        status: statusByUser.get(registration.userId._id.toString()) || 'absent'
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
    const cleanEntries = entries
      .filter(entry => registeredUserIds.has(entry.userId))
      .map(entry => ({
        userId: entry.userId,
        status: entry.status === 'present' ? 'present' : 'absent'
      }));

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
