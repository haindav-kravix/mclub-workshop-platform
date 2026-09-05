import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FiCheckCircle, FiKey, FiUsers } from 'react-icons/fi';
import { attendanceAPI } from '../utils/api';
import { LoadingSpinner } from '../components/UI';

export const HackathonAttendanceCheckInPage = () => {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [teamCode, setTeamCode] = useState('');
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => { attendanceAPI.getPublicHackathonSession(sessionId).then(r => setSession(r.data)).catch(e => setError(e.response?.data?.message || 'Attendance session unavailable')).finally(() => setLoading(false)); }, [sessionId]);
  const submit = async e => { e.preventDefault(); setSubmitting(true); setError(''); setMessage(''); try { const response = await attendanceAPI.hackathonCheckIn(sessionId, { teamCode, pin }); setMessage(`${response.data.member.name}, your attendance is marked.`); setPin(''); } catch (err) { setError(err.response?.data?.message || 'Unable to mark attendance'); } finally { setSubmitting(false); } };
  if (loading) return <LoadingSpinner />;
  return <div className="flex min-h-screen items-center justify-center bg-emerald-50 px-4 py-10"><main className="w-full max-w-lg rounded-lg border border-emerald-100 bg-white p-6 shadow-xl sm:p-9">
    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary text-2xl text-white"><FiCheckCircle /></div><p className="mt-5 text-sm font-black uppercase text-secondary">{session?.workshop?.title}</p><h1 className="mt-1 text-3xl font-black">{session?.title || 'Hackathon attendance'}</h1><p className="mt-2 text-slate-600">Enter your team name and your individual four-digit PIN.</p>
    {!session?.qrEnabled && <div className="mt-5 rounded-lg bg-amber-50 p-4 font-bold text-amber-800">QR attendance is currently closed by the admin.</div>}
    {message && <div className="mt-5 rounded-lg bg-emerald-50 p-4 font-black text-emerald-800">{message}</div>}{error && <div className="mt-5 rounded-lg bg-rose-50 p-4 font-black text-rose-700">{error}</div>}
    <form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-sm font-black"><FiUsers className="mr-2 inline" /> Team name<input value={teamCode} onChange={e => setTeamCode(e.target.value.toUpperCase())} required className="mt-2 w-full rounded-lg border px-4 py-3 uppercase outline-none focus:border-secondary" /></label><label className="block text-sm font-black"><FiKey className="mr-2 inline" /> Individual PIN<input value={pin} onChange={e => setPin(e.target.value.replace(/\D/g,'').slice(0,4))} inputMode="numeric" pattern="\d{4}" required className="mt-2 w-full rounded-lg border px-4 py-3 text-center font-mono text-2xl tracking-widest outline-none focus:border-secondary" /></label><button disabled={!session?.qrEnabled || submitting} className="w-full rounded-lg bg-primary px-5 py-3 font-black text-white disabled:opacity-50">{submitting ? 'Checking...' : 'Mark My Attendance'}</button></form>
  </main></div>;
};
