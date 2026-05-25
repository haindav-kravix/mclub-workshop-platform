import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { attendanceAPI, workshopAPI } from '../utils/api';
import { ErrorMessage, LoadingSpinner, SuccessMessage } from '../components/UI';
import { FiArrowLeft, FiCheck, FiCopy, FiX } from 'react-icons/fi';

const toDateInput = (value) => value ? new Date(value).toISOString().split('T')[0] : '';

const addDaysToDateInput = (dateString, days) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
};

const getDatesBetween = (startDate, endDate) => {
  if (!startDate) return [];
  const dates = [];
  const finalDate = endDate || startDate;
  for (let current = startDate; current <= finalDate; current = addDaysToDateInput(current, 1)) {
    dates.push(current);
  }
  return dates;
};

export const TakeAttendancePage = () => {
  const { workshopId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const requestedDate = searchParams.get('date');
  const retakeMode = searchParams.get('retake');
  const [workshop, setWorkshop] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [qrEnabled, setQrEnabled] = useState(false);
  const [manualEnabled, setManualEnabled] = useState(false);
  const [qrUpdating, setQrUpdating] = useState(false);
  const [manualUpdating, setManualUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadWorkshop = async () => {
      try {
        const response = await workshopAPI.getAdminWorkshopById(workshopId);
        setWorkshop(response.data);
        const firstDate = response.data.dailyTimings?.[0]?.date || response.data.startDate || response.data.date;
        setSelectedDate(requestedDate || toDateInput(firstDate));
      } catch (err) {
        setError('Failed to load workshop');
      } finally {
        setLoading(false);
      }
    };
    loadWorkshop();
  }, [workshopId, requestedDate]);

  useEffect(() => {
    if (!selectedDate) return;
    const loadRoster = async () => {
      setLoading(true);
      try {
        const response = await attendanceAPI.getRoster(workshopId, selectedDate);
        setRoster(response.data.roster);
        const sessionResponse = await attendanceAPI.getQrSession(workshopId, selectedDate);
        setQrEnabled(sessionResponse.data.qrEnabled);
        setManualEnabled(sessionResponse.data.manualEnabled);
      } catch (err) {
        setError('Failed to load registered students');
      } finally {
        setLoading(false);
      }
    };
    loadRoster();
  }, [workshopId, selectedDate]);

  useEffect(() => {
    if (!qrEnabled || !selectedDate) return undefined;
    const refreshQrConfirmations = async () => {
      try {
        const response = await attendanceAPI.getRoster(workshopId, selectedDate);
        setRoster(currentRoster => response.data.roster.map(latest => {
          const current = currentRoster.find(item => item.user._id === latest.user._id);
          return latest.status === 'present' && latest.source === 'qr' ? latest : (current || latest);
        }));
      } catch {
        // Keep the current roster visible if a background refresh briefly fails.
      }
    };
    const intervalId = window.setInterval(refreshQrConfirmations, 3000);
    return () => window.clearInterval(intervalId);
  }, [qrEnabled, selectedDate, workshopId]);

  const dateOptions = useMemo(() => {
    if (workshop?.dailyTimings?.length) {
      return workshop.dailyTimings.map(item => toDateInput(item.date));
    }
    return getDatesBetween(
      toDateInput(workshop?.startDate || workshop?.date),
      toDateInput(workshop?.endDate || workshop?.startDate || workshop?.date)
    );
  }, [workshop]);

  const setStatus = (userId, status) => {
    setRoster(prev => prev.map(item =>
      item.user._id === userId && item.source !== 'qr' ? { ...item, status, source: 'manual' } : item
    ));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      const rosterForSubmit = manualEnabled
        ? roster
        : (await attendanceAPI.getRoster(workshopId, selectedDate)).data.roster;
      if (!manualEnabled) {
        setRoster(rosterForSubmit);
      }

      await attendanceAPI.submitAttendance(workshopId, {
        date: selectedDate,
        entries: rosterForSubmit.map(item => ({ userId: item.user._id, status: item.status }))
      });
      setSuccess(manualEnabled ? 'Attendance submitted successfully' : 'QR attendance submitted successfully');
      setTimeout(() => navigate(`/admin/attendance/${workshopId}/reports`), 700);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleQr = async () => {
    setQrUpdating(true);
    setError('');
    try {
      const response = await attendanceAPI.setQrSession(workshopId, {
        date: selectedDate,
        qrEnabled: !qrEnabled
      });
      setQrEnabled(response.data.session.qrEnabled);
      setSuccess(response.data.session.qrEnabled ? 'QR attendance is ON' : 'QR attendance is OFF for the day');
    } catch (err) {
      setError('Failed to update QR attendance status');
    } finally {
      setQrUpdating(false);
    }
  };

  const handleToggleManual = async () => {
    setManualUpdating(true);
    setError('');
    try {
      const response = await attendanceAPI.setQrSession(workshopId, {
        date: selectedDate,
        manualEnabled: !manualEnabled
      });
      setManualEnabled(response.data.session.manualEnabled);
      setSuccess(response.data.session.manualEnabled ? 'Manual attendance is ON' : 'Manual attendance is OFF');
    } catch (err) {
      setError('Failed to update manual attendance status');
    } finally {
      setManualUpdating(false);
    }
  };

  const qrCheckInUrl = selectedDate
    ? `${window.location.origin}/attendance/check-in/${workshopId}?date=${encodeURIComponent(selectedDate)}`
    : '';
  const qrImageUrl = qrCheckInUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrCheckInUrl)}`
    : '';
  const qrConfirmedStudents = roster.filter(item => item.status === 'present' && item.source === 'qr');

  if (loading && !workshop) return <LoadingSpinner />;

  return (
    <div className="min-h-screen app-shell">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-primary font-semibold mb-5">
          <FiArrowLeft /> Back to Dashboard
        </button>
        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
        {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}

        <div className="panel rounded-lg p-5 sm:p-8 mb-6">
          <div className="grid lg:grid-cols-[1fr_320px] gap-6">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-emerald-600 mb-2">Take attendance</p>
              <h1 className="text-3xl font-bold text-slate-950">{workshop?.title}</h1>
              {retakeMode === 'fresh' && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                  Retake from start is active. Attendance for this day has been cleared and will be recorded again.
                </div>
              )}
              {retakeMode === 'continue' && (
                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                  Retake from now is active. Previously marked attendance is kept while you continue.
                </div>
              )}
              <div className="mt-5 max-w-xs">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Workshop Day</label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus-ring"
                >
                  {dateOptions.map(date => (
                    <option key={date} value={date}>{new Date(`${date}T00:00:00`).toLocaleDateString()}</option>
                  ))}
                </select>
              </div>
              <div className="mt-5 rounded-lg border border-slate-200 bg-white/70 p-4 max-w-md">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-950">Manual Attendance</p>
                    <p className="text-sm text-slate-600">
                      {manualEnabled
                        ? 'Manual marking is enabled for absentees.'
                        : 'Manual marking is hidden until you turn it on.'}
                    </p>
                  </div>
                  <button
                    onClick={handleToggleManual}
                    disabled={manualUpdating || !selectedDate}
                    className={`px-4 py-2 rounded-lg font-bold ${
                      manualEnabled ? 'bg-secondary text-white' : 'bg-slate-100 text-slate-800'
                    } disabled:opacity-50`}
                  >
                    {manualUpdating ? 'Updating...' : manualEnabled ? 'Turn Manual Off' : 'Turn Manual On'}
                  </button>
                </div>
              </div>
            </div>

            {qrImageUrl && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4 text-center">
                <div className={`inline-flex px-3 py-1 rounded-lg text-sm font-bold mb-3 ${
                  qrEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  QR Attendance {qrEnabled ? 'ON' : 'OFF'}
                </div>
                <p className="font-bold text-slate-950 mb-2">QR Check-in</p>
                <div className={`rounded-lg bg-white p-3 border border-emerald-100 ${qrEnabled ? '' : 'opacity-35 grayscale pointer-events-none'}`}>
                  <img src={qrImageUrl} alt="Attendance QR code" className="mx-auto w-full max-w-56 aspect-square object-contain" />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {qrEnabled
                    ? 'Scan is open. Students must use their registered Google email.'
                    : 'Scan is closed. Students will see attendance is done for the day.'}
                </p>
                <button
                  onClick={handleToggleQr}
                  disabled={qrUpdating}
                  className={`mt-3 w-full px-4 py-2 rounded-lg font-bold ${
                    qrEnabled ? 'bg-secondary text-white' : 'bg-primary text-secondary'
                  } disabled:opacity-50`}
                >
                  {qrUpdating ? 'Updating...' : qrEnabled ? 'Turn QR Off' : 'Turn QR On'}
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(qrCheckInUrl);
                    setSuccess('QR check-in link copied');
                  }}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-800 rounded-lg font-semibold"
                >
                  <FiCopy /> Copy Link
                </button>
              </div>
            )}
          </div>
        </div>

        {!manualEnabled ? (
          <div className="panel rounded-lg p-8 text-center">
            <p className="text-lg font-bold text-slate-950">Manual attendance is off</p>
            <p className="mt-2 text-slate-600">QR scans will still mark students present. Submit QR attendance when scanning is complete, or turn manual on to update remaining absentees.</p>
          </div>
        ) : (
          <div className="grid gap-3">
          {roster.map(item => {
            const isQrPresent = item.status === 'present' && item.source === 'qr';
            return (
            <div key={item.user._id} className="panel rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {item.user.profilePhoto && <img src={item.user.profilePhoto} alt={item.user.name} className="w-11 h-11 rounded-full" />}
                <div className="min-w-0">
                  <p className="font-bold text-slate-950 truncate">{item.user.name}</p>
                  <p className="text-sm text-slate-600 break-all">{item.user.email}</p>
                  {isQrPresent && (
                    <p className="mt-1 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                      QR scanned - present
                    </p>
                  )}
                </div>
              </div>
              {isQrPresent ? (
                <div className="sm:w-72 rounded-lg bg-emerald-50 px-4 py-2 text-center font-bold text-emerald-700">
                  Present by QR
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:w-72">
                  <button
                    onClick={() => setStatus(item.user._id, 'present')}
                    className={`px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 ${
                      item.status === 'present' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    <FiCheck /> Present
                  </button>
                  <button
                    onClick={() => setStatus(item.user._id, 'absent')}
                    className={`px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 ${
                      item.status === 'absent' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    <FiX /> Absent
                  </button>
                </div>
              )}
            </div>
          )})}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving || roster.length === 0}
          className="mt-6 w-full px-6 py-3 bg-slate-950 text-white rounded-lg font-bold hover:bg-slate-800 transition disabled:opacity-50"
        >
          {saving ? 'Submitting...' : manualEnabled ? 'Submit Attendance' : 'Submit QR Attendance'}
        </button>

        {!manualEnabled && (
          <div className="panel mt-5 rounded-lg p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-950">QR Confirmed Attendance</h2>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-700">
                {qrConfirmedStudents.length}
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Confirmed scans appear here automatically while QR attendance is on.
            </p>
            <div className="mt-4 space-y-2">
              {qrConfirmedStudents.map(item => (
                <div key={item.user._id} className="flex items-center justify-between gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-950">{item.user.name}</p>
                    <p className="break-all text-xs font-semibold text-slate-600">{item.user.email}</p>
                  </div>
                  <span className="flex-none rounded-full bg-emerald-600 px-3 py-1 text-xs font-black text-white">
                    Present
                  </span>
                </div>
              ))}
              {qrConfirmedStudents.length === 0 && (
                <p className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                  No QR attendance confirmed yet.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
