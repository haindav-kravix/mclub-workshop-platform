import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiCheck, FiPlus, FiRefreshCw, FiSave, FiUsers, FiX } from 'react-icons/fi';
import { attendanceAPI } from '../utils/api';
import { ErrorMessage, LoadingSpinner, SuccessMessage } from '../components/UI';

export const AdminHackathonAttendancePage = () => {
  const { workshopId } = useParams();
  const navigate = useNavigate();
  const [workshop, setWorkshop] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [session, setSession] = useState(null);
  const [teams, setTeams] = useState([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadSessions = async (chooseLatest = false) => {
    const response = await attendanceAPI.getHackathonSessions(workshopId);
    setWorkshop(response.data.workshop); setSessions(response.data.sessions || []);
    if (chooseLatest && response.data.sessions?.[0]) setSelectedId(response.data.sessions[0]._id);
  };
  const loadRoster = async (quiet = false) => { if (!selectedId) return; try { const response = await attendanceAPI.getHackathonSession(workshopId, selectedId); setSession(response.data.session); setTeams(response.data.teams || []); } catch (err) { if (!quiet) setError(err.response?.data?.message || 'Unable to load session'); } };
  useEffect(() => { loadSessions(true).catch(err => setError(err.response?.data?.message || 'Unable to load attendance')).finally(() => setLoading(false)); }, [workshopId]);
  useEffect(() => { loadRoster(); }, [selectedId]);
  useEffect(() => { if (!session?.qrEnabled) return undefined; const timer = setInterval(() => loadRoster(true), 2500); return () => clearInterval(timer); }, [selectedId, session?.qrEnabled]);

  const create = async e => { e.preventDefault(); setBusy(true); setError(''); try { const response = await attendanceAPI.createHackathonSession(workshopId, { title, date }); setTitle(''); await loadSessions(); setSelectedId(response.data.session._id); setSuccess('Attendance session created'); } catch (err) { setError(err.response?.data?.message || 'Unable to create session'); } finally { setBusy(false); } };
  const toggleQr = async () => { setBusy(true); try { const response = await attendanceAPI.setHackathonQr(workshopId, selectedId, !session.qrEnabled); setSession(prev => ({ ...prev, qrEnabled: response.data.session.qrEnabled })); setSuccess(response.data.session.qrEnabled ? 'QR attendance is open' : 'QR attendance is closed'); } catch (err) { setError(err.response?.data?.message || 'Unable to update QR'); } finally { setBusy(false); } };
  const setStatus = (registrationId, memberId, status) => setTeams(prev => prev.map(team => team._id !== registrationId ? team : ({ ...team, teamMembers: team.teamMembers.map(member => member._id !== memberId ? member : ({ ...member, status, source: 'manual' })) })));
  const save = async () => { setBusy(true); try { const entries = teams.flatMap(team => team.teamMembers.map(member => ({ registrationId: team._id, memberId: member._id, status: member.status }))); const response = await attendanceAPI.saveHackathonAttendance(workshopId, selectedId, entries); setTeams(response.data.teams || []); setSuccess('Attendance saved'); } catch (err) { setError(err.response?.data?.message || 'Unable to save attendance'); } finally { setBusy(false); } };
  const stats = useMemo(() => { const members = teams.flatMap(team => team.teamMembers || []); return { total: members.length, present: members.filter(member => member.status === 'present').length }; }, [teams]);
  const checkInUrl = selectedId ? `${window.location.origin}/hackathon-attendance/${selectedId}` : '';
  if (loading) return <LoadingSpinner />;

  return <div className="min-h-screen bg-slate-50"><header className="border-b bg-white"><div className="mx-auto max-w-7xl px-4 py-6"><button onClick={() => navigate('/admin/hackathons')} className="inline-flex items-center gap-2 text-sm font-black text-secondary"><FiArrowLeft /> Hackathons</button><div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-black uppercase text-secondary">Hackathon only</p><h1 className="text-3xl font-black sm:text-5xl">Attendance Control</h1><p className="mt-2 text-slate-600">{workshop?.title}</p></div><button onClick={() => navigate(`/admin/hackathon/${workshopId}/teams`)} className="rounded-lg bg-slate-950 px-5 py-3 font-black text-white"><FiUsers className="mr-2 inline" /> Team Members & PINs</button></div></div></header>
    <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-4"><form onSubmit={create} className="rounded-lg border bg-white p-4 shadow-sm"><h2 className="font-black"><FiPlus className="mr-2 inline" /> Create session</h2><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Example: Day 1 afternoon" required className="mt-4 w-full rounded-lg border px-3 py-3" /><input type="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-3 w-full rounded-lg border px-3 py-3" /><button disabled={busy} className="mt-3 w-full rounded-lg bg-primary px-4 py-3 font-black text-white">Create Session</button></form>
        <section className="rounded-lg border bg-white p-3 shadow-sm"><h2 className="px-2 py-2 font-black">Sessions</h2><div className="space-y-2">{sessions.map(item => <button key={item._id} onClick={() => setSelectedId(item._id)} className={`w-full rounded-lg border p-3 text-left ${selectedId === item._id ? 'border-emerald-400 bg-emerald-50' : 'bg-white'}`}><p className="font-black">{item.title}</p><p className="mt-1 text-xs text-slate-500"><FiCalendar className="inline" /> {new Date(item.date).toLocaleDateString('en-IN')} · QR {item.qrEnabled ? 'On' : 'Off'}</p></button>)}</div></section>
      </aside>
      <section className="min-w-0 space-y-5">{error && <ErrorMessage message={error} onDismiss={() => setError('')} />}{success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}{!session ? <div className="rounded-lg bg-white p-10 text-center font-black">Create or select an attendance session.</div> : <>
        <div className="grid gap-4 rounded-lg border bg-white p-4 shadow-sm md:grid-cols-[1fr_auto]"><div><p className="text-xs font-black uppercase text-secondary">Current session</p><h2 className="mt-1 text-2xl font-black">{session.title}</h2><div className="mt-4 flex flex-wrap gap-3"><span className="rounded-lg bg-emerald-50 px-3 py-2 font-black text-secondary">{stats.present} present</span><span className="rounded-lg bg-slate-100 px-3 py-2 font-black">{stats.total} members</span><button onClick={() => loadRoster()} className="rounded-lg border px-3 py-2 font-black"><FiRefreshCw className="inline" /> Refresh</button></div></div><div className="text-center"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(checkInUrl)}`} alt="Hackathon attendance QR" className="mx-auto h-52 w-52 rounded-lg border bg-white p-2" /><button onClick={toggleQr} disabled={busy} className={`mt-3 w-full rounded-lg px-4 py-3 font-black text-white ${session.qrEnabled ? 'bg-rose-600' : 'bg-primary'}`}>{session.qrEnabled ? <><FiX className="inline" /> Close QR</> : <><FiCheck className="inline" /> Open QR</>}</button><p className="mt-2 text-xs font-bold text-slate-500">Show this QR on the event screen.</p></div></div>
        <div className="space-y-4">{teams.map(team => <article key={team._id} className="rounded-lg border bg-white p-4 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3"><div><p className="text-xs font-black uppercase text-secondary">Team</p><h3 className="text-xl font-black">{team.teamCode}</h3></div><p className="text-sm font-bold text-slate-500">{team.teamMembers.length}/4 members configured</p></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{team.teamMembers.map(member => <div key={member._id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3"><div className="min-w-0"><p className="truncate font-black">{member.name}</p><p className="text-xs text-slate-500">PIN {member.pin} {member.markedAt ? `· ${new Date(member.markedAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}` : ''}</p></div><div className="flex gap-1"><button onClick={() => setStatus(team._id,member._id,'present')} title="Mark present" className={`h-10 w-10 rounded-lg ${member.status === 'present' ? 'bg-emerald-500 text-white' : 'bg-white text-emerald-700'}`}><FiCheck className="mx-auto" /></button><button onClick={() => setStatus(team._id,member._id,'absent')} title="Mark absent" className={`h-10 w-10 rounded-lg ${member.status === 'absent' ? 'bg-rose-500 text-white' : 'bg-white text-rose-700'}`}><FiX className="mx-auto" /></button></div></div>)}</div></article>)}</div>
        <button onClick={save} disabled={busy} className="sticky bottom-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-4 font-black text-white shadow-xl"><FiSave /> Save Manual Changes</button>
      </>}</section>
    </main></div>;
};
