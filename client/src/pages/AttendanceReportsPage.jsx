import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { attendanceAPI, workshopAPI } from '../utils/api';
import { ErrorMessage, LoadingSpinner } from '../components/UI';
import { FiArrowLeft } from 'react-icons/fi';

export const AttendanceReportsPage = () => {
  const { workshopId } = useParams();
  const navigate = useNavigate();
  const [workshop, setWorkshop] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadReports = async () => {
      try {
        const [workshopResponse, reportsResponse] = await Promise.all([
          workshopAPI.getWorkshopById(workshopId),
          attendanceAPI.getReports(workshopId)
        ]);
        setWorkshop(workshopResponse.data);
        setReports(reportsResponse.data);
      } catch (err) {
        setError('Failed to load attendance reports');
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, [workshopId]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen app-shell">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-primary font-semibold mb-5">
          <FiArrowLeft /> Back to Dashboard
        </button>
        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}

        <div className="panel rounded-lg p-5 sm:p-8 mb-6">
          <p className="text-sm font-bold uppercase tracking-wide text-slate-600 mb-2">Attendance reports</p>
          <h1 className="text-3xl font-bold text-slate-950">{workshop?.title}</h1>
        </div>

        {reports.length === 0 ? (
          <div className="panel rounded-lg p-10 text-center text-slate-600">No attendance submitted yet</div>
        ) : (
          <div className="grid gap-5">
            {reports.map(report => (
              <div key={report._id} className="panel rounded-lg p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">{new Date(report.date).toLocaleDateString()}</h2>
                    <p className="text-sm text-slate-600">Present: {report.presentCount} | Absent: {report.absentCount}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/admin/attendance/${workshopId}?date=${new Date(report.date).toISOString().split('T')[0]}&fresh=1`)}
                    className="px-4 py-2 bg-slate-950 text-white rounded-lg font-semibold"
                  >
                    Retake Attendance
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-emerald-50 p-4">
                    <h3 className="font-bold text-emerald-800 mb-3">Present Students</h3>
                    <div className="space-y-2">
                      {report.present.map(entry => (
                        <p key={entry.userId._id} className="text-sm text-emerald-900">{entry.userId.name} - {entry.userId.email}</p>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-100 p-4">
                    <h3 className="font-bold text-slate-900 mb-3">Absentees List</h3>
                    <div className="space-y-2">
                      {report.absent.map(entry => (
                        <p key={entry.userId._id} className="text-sm text-slate-800">{entry.userId.name} - {entry.userId.email}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
