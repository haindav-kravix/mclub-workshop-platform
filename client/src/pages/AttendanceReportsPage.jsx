import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { attendanceAPI, workshopAPI } from '../utils/api';
import { ErrorMessage, LoadingSpinner, SuccessMessage } from '../components/UI';
import { FiArrowLeft, FiDownload, FiRefreshCw } from 'react-icons/fi';

const toDateInput = (value) => value ? new Date(value).toISOString().split('T')[0] : '';

const downloadBlob = (blob, fileName) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const AttendanceReportsPage = () => {
  const { workshopId } = useParams();
  const navigate = useNavigate();
  const [workshop, setWorkshop] = useState(null);
  const [reports, setReports] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadReports = async () => {
      try {
        const [workshopResponse, reportsResponse] = await Promise.all([
          workshopAPI.getAdminWorkshopById(workshopId),
          attendanceAPI.getReports(workshopId)
        ]);
        setWorkshop(workshopResponse.data);
        setReports(reportsResponse.data);
        setSelectedDate(toDateInput(reportsResponse.data[0]?.date));
      } catch (err) {
        setError('Failed to load attendance reports');
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, [workshopId]);

  const selectedReport = reports.find(report => toDateInput(report.date) === selectedDate) || reports[0];
  const studentSummary = useMemo(() => {
    const students = new Map();
    reports.forEach(report => {
      [...report.present, ...report.absent].forEach(entry => {
        const id = entry.userId?._id;
        if (!id) return;
        const existing = students.get(id) || {
          user: entry.userId,
          present: 0,
          absent: 0
        };
        if (entry.status === 'present') existing.present += 1;
        else existing.absent += 1;
        students.set(id, existing);
      });
    });
    return Array.from(students.values()).map(item => ({
      ...item,
      percentage: reports.length ? ((item.present / reports.length) * 100).toFixed(2) : '0.00'
    }));
  }, [reports]);

  const exportDay = async () => {
    if (!selectedReport) return;
    setBusy(true);
    setError('');
    try {
      const response = await attendanceAPI.exportDay(workshopId, selectedDate);
      downloadBlob(response.data, `${workshop.title}-attendance-${selectedDate}.xlsx`);
      setSuccess('Day-wise attendance report exported');
    } catch {
      setError('Failed to export day-wise attendance report');
    } finally {
      setBusy(false);
    }
  };

  const exportOverall = async () => {
    setBusy(true);
    setError('');
    try {
      const response = await attendanceAPI.exportOverall(workshopId);
      downloadBlob(response.data, `${workshop.title}-overall-attendance.xlsx`);
      setSuccess('Overall percentage report exported');
    } catch {
      setError('Failed to export overall attendance report');
    } finally {
      setBusy(false);
    }
  };

  const retakeFromStart = async () => {
    if (!selectedReport) return;
    setBusy(true);
    setError('');
    try {
      await attendanceAPI.resetDay(workshopId, selectedDate);
      setShowResetConfirm(false);
      navigate(`/admin/attendance/${workshopId}?date=${selectedDate}&retake=fresh`);
    } catch {
      setError('Failed to start a fresh attendance retake');
      setBusy(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen app-shell">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <button onClick={() => navigate('/admin')} className="mb-5 flex items-center gap-2 font-semibold text-primary">
          <FiArrowLeft /> Back to Dashboard
        </button>
        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
        {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}

        <div className="panel mb-6 rounded-lg p-5 sm:p-8">
          <p className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-600">Attendance Report</p>
          <h1 className="text-3xl font-bold text-slate-950">{workshop?.title}</h1>
          {reports.length > 0 && (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="w-full sm:max-w-xs">
                <label className="mb-2 block text-sm font-semibold text-slate-700">Select Attendance Day</label>
                <select
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 font-semibold focus-ring"
                >
                  {reports.map(report => {
                    const date = toDateInput(report.date);
                    return <option key={date} value={date}>{new Date(`${date}T00:00:00`).toLocaleDateString()}</option>;
                  })}
                </select>
              </div>
              <button
                type="button"
                onClick={exportOverall}
                disabled={busy}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-3 font-bold text-white disabled:opacity-50"
              >
                <FiDownload /> Export Overall Percentage
              </button>
            </div>
          )}
        </div>

        {reports.length === 0 ? (
          <div className="panel rounded-lg p-10 text-center text-slate-600">No attendance submitted yet</div>
        ) : selectedReport && (
          <>
            <div className="panel mb-6 rounded-lg p-5">
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">{new Date(selectedReport.date).toLocaleDateString()}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    Present: {selectedReport.presentCount} | Absent: {selectedReport.absentCount} | Attendance: {selectedReport.percentage ?? 0}%
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={exportDay}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 font-bold text-secondary disabled:opacity-50"
                  >
                    <FiDownload /> Export This Day
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/attendance/${workshopId}?date=${selectedDate}&retake=continue`)}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 font-bold text-white disabled:opacity-50"
                  >
                    <FiRefreshCw /> Retake From Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(true)}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-lg bg-rose-50 px-4 py-2 font-bold text-rose-700 disabled:opacity-50"
                  >
                    <FiRefreshCw /> Retake From Start
                  </button>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-emerald-50 p-4">
                  <h3 className="mb-3 font-bold text-emerald-800">Present Students</h3>
                  <div className="space-y-2">
                    {selectedReport.present.map(entry => (
                      <p key={entry.userId._id} className="text-sm text-emerald-900">{entry.userId.name} - {entry.userId.email}</p>
                    ))}
                    {selectedReport.present.length === 0 && <p className="text-sm text-emerald-800">No students marked present.</p>}
                  </div>
                </div>
                <div className="rounded-lg bg-slate-100 p-4">
                  <h3 className="mb-3 font-bold text-slate-900">Absent Students</h3>
                  <div className="space-y-2">
                    {selectedReport.absent.map(entry => (
                      <p key={entry.userId._id} className="text-sm text-slate-800">{entry.userId.name} - {entry.userId.email}</p>
                    ))}
                    {selectedReport.absent.length === 0 && <p className="text-sm text-slate-700">No students absent.</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="panel rounded-lg p-5">
              <h2 className="text-xl font-bold text-slate-950">Overall Attendance Percentage</h2>
              <p className="mt-1 text-sm font-semibold text-slate-600">{reports.length} attendance day{reports.length === 1 ? '' : 's'} recorded</p>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left">
                  <thead>
                    <tr className="text-xs font-black uppercase text-slate-500">
                      <th className="px-3 py-3">Student</th>
                      <th className="px-3 py-3">Present</th>
                      <th className="px-3 py-3">Absent</th>
                      <th className="px-3 py-3">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentSummary.map(item => (
                      <tr key={item.user._id}>
                        <td className="px-3 py-3">
                          <p className="font-bold text-slate-950">{item.user.name}</p>
                          <p className="text-xs text-slate-500">{item.user.email}</p>
                        </td>
                        <td className="px-3 py-3 font-semibold text-emerald-700">{item.present}</td>
                        <td className="px-3 py-3 font-semibold text-slate-700">{item.absent}</td>
                        <td className="px-3 py-3 font-black text-secondary">{item.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <p className="text-xs font-black uppercase tracking-wide text-rose-600">Retake From Start</p>
            <h2 className="mt-2 text-xl font-black text-slate-950">Clear this day&apos;s attendance?</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
              Attendance already recorded for {new Date(`${selectedDate}T00:00:00`).toLocaleDateString()} will be cleared. Then you can take attendance again from the beginning.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                disabled={busy}
                className="rounded-lg border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={retakeFromStart}
                disabled={busy}
                className="rounded-lg bg-rose-600 px-4 py-3 font-bold text-white disabled:opacity-50"
              >
                {busy ? 'Clearing...' : 'Clear and Retake'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
