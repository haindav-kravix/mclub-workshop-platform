import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { attendanceAPI, workshopAPI } from '../utils/api';
import { ErrorMessage, LoadingSpinner, SuccessMessage } from '../components/UI';
import { FiArrowLeft, FiCheck, FiCopy, FiX } from 'react-icons/fi';

const toDateInput = (value) => value ? new Date(value).toISOString().split('T')[0] : '';

export const TakeAttendancePage = () => {
  const { workshopId } = useParams();
  const navigate = useNavigate();
  const [workshop, setWorkshop] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadWorkshop = async () => {
      try {
        const response = await workshopAPI.getWorkshopById(workshopId);
        setWorkshop(response.data);
        const firstDate = response.data.dailyTimings?.[0]?.date || response.data.startDate || response.data.date;
        setSelectedDate(toDateInput(firstDate));
      } catch (err) {
        setError('Failed to load workshop');
      } finally {
        setLoading(false);
      }
    };
    loadWorkshop();
  }, [workshopId]);

  useEffect(() => {
    if (!selectedDate) return;
    const loadRoster = async () => {
      setLoading(true);
      try {
        const response = await attendanceAPI.getRoster(workshopId, selectedDate);
        setRoster(response.data.roster);
      } catch (err) {
        setError('Failed to load registered students');
      } finally {
        setLoading(false);
      }
    };
    loadRoster();
  }, [workshopId, selectedDate]);

  const dateOptions = useMemo(() => {
    if (workshop?.dailyTimings?.length) {
      return workshop.dailyTimings.map(item => toDateInput(item.date));
    }
    return [toDateInput(workshop?.startDate || workshop?.date)].filter(Boolean);
  }, [workshop]);

  const setStatus = (userId, status) => {
    setRoster(prev => prev.map(item =>
      item.user._id === userId ? { ...item, status } : item
    ));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      await attendanceAPI.submitAttendance(workshopId, {
        date: selectedDate,
        entries: roster.map(item => ({ userId: item.user._id, status: item.status }))
      });
      setSuccess('Attendance submitted successfully');
      setTimeout(() => navigate(`/admin/attendance/${workshopId}/reports`), 700);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit attendance');
    } finally {
      setSaving(false);
    }
  };

  const qrCheckInUrl = selectedDate
    ? `${window.location.origin}/attendance/check-in/${workshopId}?date=${encodeURIComponent(selectedDate)}`
    : '';
  const qrImageUrl = qrCheckInUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrCheckInUrl)}`
    : '';

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
            </div>

            {qrImageUrl && (
              <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
                <p className="font-bold text-slate-950 mb-2">QR Check-in</p>
                <img src={qrImageUrl} alt="Attendance QR code" className="mx-auto w-56 h-56" />
                <p className="text-xs text-slate-500 mt-2">Students must scan and login with their registered Google email.</p>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(qrCheckInUrl);
                    setSuccess('QR check-in link copied');
                  }}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-slate-950 text-white rounded-lg font-semibold"
                >
                  <FiCopy /> Copy Link
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-3">
          {roster.map(item => (
            <div key={item.user._id} className="panel rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {item.user.profilePhoto && <img src={item.user.profilePhoto} alt={item.user.name} className="w-11 h-11 rounded-full" />}
                <div className="min-w-0">
                  <p className="font-bold text-slate-950 truncate">{item.user.name}</p>
                  <p className="text-sm text-slate-600 break-all">{item.user.email}</p>
                </div>
              </div>
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
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving || roster.length === 0}
          className="mt-6 w-full px-6 py-3 bg-slate-950 text-white rounded-lg font-bold hover:bg-slate-800 transition disabled:opacity-50"
        >
          {saving ? 'Submitting...' : 'Submit Attendance'}
        </button>
      </div>
    </div>
  );
};
