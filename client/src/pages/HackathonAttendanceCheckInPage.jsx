import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FiCheckCircle, FiKey } from 'react-icons/fi';
import { attendanceAPI } from '../utils/api';
import { LoadingSpinner } from '../components/UI';

export const HackathonAttendanceCheckInPage = () => {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const pinInputRef = useRef(null);
  const messageTimerRef = useRef(null);
  useEffect(() => { attendanceAPI.getPublicHackathonSession(sessionId).then(r => setSession(r.data)).catch(e => setError(e.response?.data?.message || 'Attendance session unavailable')).finally(() => setLoading(false)); }, [sessionId]);
  useEffect(() => () => window.clearTimeout(messageTimerRef.current), []);
  const focusForNextPerson = () => window.setTimeout(() => pinInputRef.current?.focus(), 50);
  const clearStatusSoon = () => {
    window.clearTimeout(messageTimerRef.current);
    messageTimerRef.current = window.setTimeout(() => {
      setMessage('');
      setError('');
      focusForNextPerson();
    }, 1200);
  };
  const submit = async e => {
    e.preventDefault();
    setSubmitting(true); setError(''); setMessage('');
    try {
      const response = await attendanceAPI.hackathonCheckIn(sessionId, { pin });
      setMessage(response.data.member);
      setPin('');
      focusForNextPerson();
      clearStatusSoon();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to mark attendance');
      setPin('');
      focusForNextPerson();
      clearStatusSoon();
    } finally {
      setSubmitting(false);
    }
  };
  if (loading) return <LoadingSpinner />;
  return <div className="flex min-h-screen items-center justify-center bg-emerald-50 px-4 py-10"><main className="w-full max-w-lg rounded-lg border border-emerald-100 bg-white p-6 shadow-xl sm:p-9">
    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary text-2xl text-white"><FiCheckCircle /></div><p className="mt-5 text-sm font-black uppercase text-secondary">{session?.workshop?.title}</p><h1 className="mt-1 text-3xl font-black">{session?.title || 'Hackathon attendance'}</h1><p className="mt-2 text-slate-600">Enter the unique four-digit PIN assigned to your name.</p>
    {!session?.qrEnabled && <div className="mt-5 rounded-lg bg-amber-50 p-4 font-bold text-amber-800">QR attendance is currently closed by the admin.</div>}
    {message && <div role="status" className="mt-5 flex items-center gap-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800"><FiCheckCircle className="flex-none text-4xl" /><div><p className="text-lg font-black">Attendance marked</p><p className="font-bold">{message.name}</p>{message.teamCode && <p className="text-sm">Team {message.teamCode}</p>}</div></div>}
    {error && <div role="alert" className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-4 font-black text-rose-700">{error}</div>}
    <form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-sm font-black"><FiKey className="mr-2 inline" /> Individual PIN<input ref={pinInputRef} value={pin} onChange={e => { setPin(e.target.value.replace(/\D/g,'').slice(0,4)); setMessage(''); setError(''); }} inputMode="numeric" pattern="\d{4}" autoComplete="off" autoFocus required className="mt-2 w-full rounded-lg border px-4 py-4 text-center font-mono text-3xl tracking-widest outline-none focus:border-secondary" /></label><button disabled={!session?.qrEnabled || submitting || pin.length !== 4} className="w-full rounded-lg bg-primary px-5 py-3 font-black text-white disabled:opacity-50">{submitting ? 'Checking...' : 'Submit Attendance'}</button><p className="text-center text-xs font-bold text-slate-500">After submission, the field clears automatically for the next person.</p></form>
  </main></div>;
};
