import Attendance from '../models/Attendance.js';
import AttendanceSession from '../models/AttendanceSession.js';
import Entry from '../models/Entry.js';
import Registration from '../models/Registration.js';
import Workshop from '../models/Workshop.js';
import ExcelJS from 'exceljs';

const normalizeDate = (date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const formatDate = (date) => new Date(date).toLocaleDateString('en-IN');

const safeFileName = (value = 'attendance-report') => String(value)
  .replace(/[^a-z0-9]+/gi, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase() || 'attendance-report';

const percentage = (present, total) => total ? Number(((present / total) * 100).toFixed(2)) : 0;

const styleWorksheet = (worksheet) => {
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00684A' } };
  worksheet.getRow(1).alignment = { horizontal: 'center' };
  worksheet.columns.forEach(column => {
    let longest = 12;
    column.eachCell({ includeEmpty: true }, cell => {
      longest = Math.max(longest, String(cell.value || '').length + 2);
    });
    column.width = Math.min(longest, 42);
  });
};

export const getAttendanceRoster = async (req, res) => {
  try {
    const { workshopId } = req.params;
    const { date } = req.query;

    const workshop = await Workshop.findById(workshopId)
      .select('title eventType date startDate endDate time duration dailyTimings venue')
      .lean();
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

    const workshop = await Workshop.findById(workshopId)
      .select('_id')
      .lean();
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    const registeredUsers = await Registration.find({ workshopId, status: 'confirmed' }).select('userId');
    const registeredUserIds = new Set(registeredUsers.map(registration => registration.userId.toString()));
    const incomingStatusByUser = new Map(
      entries
        .filter(entry => registeredUserIds.has(entry.userId))
        .map(entry => [entry.userId, {
          status: entry.status === 'present' ? 'present' : 'absent',
          source: entry.source === 'entry' ? 'entry' : 'manual'
        }])
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
        status: incomingStatusByUser.get(userId)?.status || 'absent',
        source: incomingStatusByUser.get(userId)?.source || 'manual'
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

export const postEntryAttendance = async (req, res) => {
  try {
    const { workshopId } = req.params;
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const workshop = await Workshop.findById(workshopId)
      .select('_id')
      .lean();
    if (!workshop) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const attendanceDate = normalizeDate(date);
    const confirmedRegistrations = await Registration.find({ workshopId, status: 'confirmed' })
      .select('userId')
      .sort({ createdAt: 1 });
    const entries = await Entry.find({ workshopId }).select('userId');
    const enteredUserIds = new Set(entries.map(entry => entry.userId.toString()));

    const existingAttendance = await Attendance.findOne({ workshopId, date: attendanceDate });
    const existingByUser = new Map((existingAttendance?.entries || []).map(entry => [
      entry.userId.toString(),
      {
        status: entry.status,
        source: entry.source || 'manual'
      }
    ]));

    const cleanEntries = confirmedRegistrations.map(registration => {
      const userId = registration.userId.toString();
      const existing = existingByUser.get(userId);

      if (enteredUserIds.has(userId)) {
        return { userId, status: 'present', source: 'entry' };
      }

      if (existing?.status === 'present') {
        return { userId, status: 'present', source: existing.source };
      }

      return { userId, status: 'absent', source: existing?.source || 'manual' };
    });

    const attendance = await Attendance.findOneAndUpdate(
      { workshopId, date: attendanceDate },
      {
        workshopId,
        date: attendanceDate,
        entries: cleanEntries,
        submittedBy: req.user.id,
        updatedAt: new Date()
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate('entries.userId', 'name email profilePhoto');

    const presentCount = attendance.entries.filter(entry => entry.status === 'present').length;

    res.json({
      success: true,
      message: existingAttendance ? 'Attendance updated from entry scans' : 'Attendance posted from entry scans',
      attendance,
      counts: {
        confirmed: confirmedRegistrations.length,
        entered: enteredUserIds.size,
        present: presentCount,
        absent: Math.max(0, attendance.entries.length - presentCount)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error posting entry attendance', error: error.message });
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
        totalCount: report.entries.length,
        percentage: percentage(present.length, report.entries.length),
        present,
        absent
      };
    }));
  } catch (error) {
    res.status(500).json({ message: 'Error loading attendance reports', error: error.message });
  }
};

export const resetAttendanceDay = async (req, res) => {
  try {
    const { workshopId } = req.params;
    const { date } = req.body;
    if (!date) return res.status(400).json({ message: 'Date is required' });

    const workshop = await Workshop.findById(workshopId)
      .select('_id')
      .lean();
    if (!workshop) return res.status(404).json({ message: 'Event not found' });

    await Attendance.deleteOne({ workshopId, date: normalizeDate(date) });
    res.json({ success: true, message: 'Attendance cleared. Retake can begin from start.' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting attendance', error: error.message });
  }
};

export const exportDailyAttendance = async (req, res) => {
  try {
    const { workshopId } = req.params;
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'Date is required' });

    const workshop = await Workshop.findById(workshopId)
      .select('title')
      .lean();
    const attendance = await Attendance.findOne({ workshopId, date: normalizeDate(date) })
      .populate('entries.userId', 'name email');
    if (!workshop || !attendance) return res.status(404).json({ message: 'Attendance report not found' });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Daily Attendance');
    sheet.addRow(['Name', 'Email', 'Status', 'Marked Through']);
    attendance.entries.forEach(entry => {
      sheet.addRow([
        entry.userId?.name || '',
        entry.userId?.email || '',
        entry.status,
        entry.source === 'qr' ? 'QR' : entry.source === 'entry' ? 'Entry Pass' : 'Manual'
      ]);
    });
    styleWorksheet(sheet);

    const dateLabel = new Date(date).toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFileName(workshop.title)}-attendance-${dateLabel}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: 'Error exporting daily attendance', error: error.message });
  }
};

export const exportOverallAttendance = async (req, res) => {
  try {
    const { workshopId } = req.params;
    const workshop = await Workshop.findById(workshopId)
      .select('title')
      .lean();
    if (!workshop) return res.status(404).json({ message: 'Event not found' });

    const reports = await Attendance.find({ workshopId })
      .populate('entries.userId', 'name email')
      .sort({ date: 1 });
    const totalSessions = reports.length;
    const students = new Map();

    reports.forEach(report => {
      report.entries.forEach(entry => {
        const id = entry.userId?._id?.toString();
        if (!id) return;
        const item = students.get(id) || {
          name: entry.userId.name,
          email: entry.userId.email,
          present: 0,
          absent: 0
        };
        if (entry.status === 'present') item.present += 1;
        else item.absent += 1;
        students.set(id, item);
      });
    });

    const workbook = new ExcelJS.Workbook();
    const summary = workbook.addWorksheet('Overall Percentage');
    summary.addRow(['Name', 'Email', 'Sessions Held', 'Present', 'Absent', 'Attendance Percentage']);
    Array.from(students.values()).forEach(student => {
      summary.addRow([
        student.name,
        student.email,
        totalSessions,
        student.present,
        student.absent,
        `${percentage(student.present, totalSessions)}%`
      ]);
    });
    styleWorksheet(summary);

    const days = workbook.addWorksheet('Day Wise');
    days.addRow(['Date', 'Present', 'Absent', 'Attendance Percentage']);
    reports.forEach(report => {
      const present = report.entries.filter(entry => entry.status === 'present').length;
      const absent = report.entries.filter(entry => entry.status === 'absent').length;
      days.addRow([formatDate(report.date), present, absent, `${percentage(present, present + absent)}%`]);
    });
    styleWorksheet(days);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFileName(workshop.title)}-overall-attendance.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: 'Error exporting overall attendance', error: error.message });
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

    const workshop = await Workshop.findById(workshopId)
      .select('_id')
      .lean();
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

    const workshop = await Workshop.findById(workshopId)
      .select('_id')
      .lean();
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
