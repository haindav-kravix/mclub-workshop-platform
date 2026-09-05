import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiActivity, FiArrowLeft, FiBarChart2, FiCalendar, FiCheck, FiDownload, FiPlus, FiRefreshCw, FiSave, FiTrash2, FiUsers, FiX } from 'react-icons/fi';
import { attendanceAPI } from '../utils/api';
import { ErrorMessage, LoadingSpinner, SuccessMessage } from '../components/UI';

const downloadBlob = (response, fileName) => {
  const url = URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a'); link.href = url; link.download = fileName; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
};

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
    const next = response.data.sessions || [];
    setWorkshop(response.data.workshop); setSessions(next);
    if (chooseLatest && next[0]) setSelectedId(next[0]._id);
    return next;
  };
  const loadRoster = async (quiet = false) => {
    if (!selectedId) return;
    try { const response = await attendanceAPI.getHackathonSession(workshopId, selectedId); setSession(response.data.session); setTeams(response.data.teams || []); }
    catch (err) { if (!quiet) setError(err.response?.data?.message || 'Unable to load attendance session'); }
  };
  useEffect(() => { loadSessions(true).catch(err => setError(err.response?.data?.message || 'Unable to load attendance')).finally(() => setLoading(false)); }, [workshopId]);
  useEffect(() => { setSession(null); setTeams([]); loadRoster(); }, [selectedId]);
  useEffect(() => { if (!session?.qrEnabled) return undefined; const timer = setInterval(() => loadRoster(true), 1500); return () => clearInterval(timer); }, [selectedId, session?.qrEnabled]);

  const create = async event => {
    event.preventDefault(); setBusy(true); setError('');
    try { const response = await attendanceAPI.createHackathonSession(workshopId, { title, date }); setTitle(''); await loadSessions(); setSelectedId(response.data.session._id); setSuccess('Attendance session created'); }
    catch (err) { setError(err.response?.data?.message || 'Unable to create session'); }
    finally { setBusy(false); }
  };
  const removeSession = async (item) => {
    if (!window.confirm(`Delete "${item.title}" and all attendance recorded in it?`)) return;
    setBusy(true); setError('');
    try { await attendanceAPI.deleteHackathonSession(workshopId, item._id); const next = await loadSessions(); if (selectedId === item._id) { setSelectedId(next[0]?._id || ''); setSession(null); setTeams([]); } setSuccess('Attendance session deleted'); }
    catch (err) { setError(err.response?.data?.message || 'Unable to delete session'); }
    finally { setBusy(false); }
  };
  const toggleQr = async () => {
    setBusy(true); setError('');
    try { const response = await attendanceAPI.setHackathonQr(workshopId, selectedId, !session.qrEnabled); setSession(prev => ({ ...prev, qrEnabled: response.data.session.qrEnabled })); setSuccess(response.data.session.qrEnabled ? 'QR attendance is now open' : 'QR attendance is now closed'); }
    catch (err) { setError(err.response?.data?.message || 'Unable to update QR access'); }
    finally { setBusy(false); }
  };
  const setStatus = (registrationId, memberId, status) => setTeams(prev => prev.map(team => team._id !== registrationId ? team : ({ ...team, teamMembers: team.teamMembers.map(member => member._id !== memberId ? member : ({ ...member, status, source: 'manual', markedAt: status === 'present' ? new Date().toISOString() : null })) })));
  const save = async () => {
    setBusy(true); setError('');
    try { const entries = teams.flatMap(team => team.teamMembers.map(member => ({ registrationId: team._id, memberId: member._id, status: member.status }))); const response = await attendanceAPI.saveHackathonAttendance(workshopId, selectedId, entries); setTeams(response.data.teams || []); setSuccess('Manual attendance changes saved'); }
    catch (err) { setError(err.response?.data?.message || 'Unable to save attendance'); }
    finally { setBusy(false); }
  };
  const exportSession = async () => {
    setBusy(true); setError('');
    try { const response = await attendanceAPI.exportHackathonSession(workshopId, selectedId); downloadBlob(response, `${workshop.title}-${session.title}.xlsx`); }
    catch (err) { setError(err.response?.data?.message || 'Unable to export session'); }
    finally { setBusy(false); }
  };

  const members = useMemo(() => teams.flatMap(team => team.teamMembers.map(member => ({ ...member, teamCode: team.teamCode }))), [teams]);
  const present = members.filter(member => member.status === 'present');
  const recent = [...present].filter(member => member.markedAt).sort((a,b) => new Date(b.markedAt)-new Date(a.markedAt)).slice(0, 6);
  const checkInUrl = selectedId ? `${window.location.origin}/hackathon-attendance/${selectedId}` : '';
  if (loading) return <LoadingSpinner />;

  return <div className="min-h-screen bg-slate-100">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-7xl px-4 py-6">
      <button onClick={() => navigate('/admin/hackathons')} className="inline-flex items-center gap-2 text-sm font-black text-secondary"><FiArrowLeft /> Hackathons</button>
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-sm font-black uppercase text-secondary">Live hackathon operations</p><h1 className="mt-1 text-3xl font-black text-slate-950 sm:text-5xl">Attendance Control</h1><p className="mt-2 text-slate-600">{workshop?.title}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => navigate(`/admin/hackathon/${workshopId}/teams`)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 font-black"><FiUsers /> Teams & PINs</button><button onClick={() => navigate(`/admin/hackathon/${workshopId}/attendance/reports`)} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-3 font-black text-white"><FiBarChart2 /> Reports</button></div></div>
    </div></header>

    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-7 lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <form onSubmit={create} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-secondary"><FiPlus /></span><h2 className="font-black">New session</h2></div><label className="mt-4 block text-xs font-black uppercase text-slate-500">Session name<input value={title} onChange={e => setTitle(e.target.value)} placeholder="Day 1 morning" required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-3 text-sm normal-case outline-none focus:border-secondary" /></label><label className="mt-3 block text-xs font-black uppercase text-slate-500">Date<input type="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-3 text-sm normal-case outline-none focus:border-secondary" /></label><button disabled={busy} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-black text-white disabled:opacity-50"><FiPlus /> Create Session</button></form>
        <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"><div className="flex items-center justify-between px-2 py-2"><h2 className="font-black">Sessions</h2><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black">{sessions.length}</span></div><div className="mt-1 max-h-[48vh] space-y-2 overflow-y-auto">{sessions.map(item => <div key={item._id} className={`flex items-stretch overflow-hidden rounded-lg border ${selectedId === item._id ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white'}`}><button onClick={() => setSelectedId(item._id)} className="min-w-0 flex-1 p-3 text-left"><p className="truncate font-black">{item.title}</p><p className="mt-1 text-xs text-slate-500"><FiCalendar className="mr-1 inline" />{new Date(item.date).toLocaleDateString('en-IN')}</p><span className={`mt-2 inline-block rounded-full px-2 py-1 text-[10px] font-black uppercase ${item.qrEnabled ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>QR {item.qrEnabled ? 'open' : 'closed'}</span></button><button onClick={() => removeSession(item)} disabled={busy} title="Delete session" className="w-11 border-l border-inherit text-rose-600 hover:bg-rose-50"><FiTrash2 className="mx-auto" /></button></div>)}{!sessions.length && <p className="p-5 text-center text-sm font-bold text-slate-500">No sessions yet</p>}</div></section>
      </aside>

      <section className="min-w-0 space-y-5">{error && <ErrorMessage message={error} onDismiss={() => setError('')} />}{success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}
        {!selectedId ? <div className="rounded-lg border bg-white p-12 text-center"><FiCalendar className="mx-auto text-slate-300" size={42} /><h2 className="mt-4 text-xl font-black">Create an attendance session</h2><p className="mt-2 text-slate-500">Each session keeps its own QR and team-wise report.</p></div> : !session ? <LoadingSpinner /> : <>
          <section className="rounded-lg bg-slate-950 p-5 text-white shadow-lg sm:p-6"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><p className="text-xs font-black uppercase text-emerald-300">Current session</p><h2 className="mt-1 text-3xl font-black">{session.title}</h2><p className="mt-1 text-sm text-slate-300">{new Date(session.date).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => loadRoster()} className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 font-black"><FiRefreshCw /> Refresh</button><button onClick={exportSession} disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 font-black text-slate-950"><FiDownload /> Export Excel</button></div></div><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Total',members.length,'text-white'],['Present',present.length,'text-emerald-300'],['Absent',members.length-present.length,'text-rose-300'],['Teams',teams.length,'text-sky-300']].map(([label,value,color]) => <div key={label} className="rounded-lg bg-white/10 p-3"><p className={`text-3xl font-black ${color}`}>{value}</p><p className="text-xs font-bold uppercase text-slate-300">{label}</p></div>)}</div></section>

          <section className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]"><div className="rounded-lg border border-emerald-100 bg-white p-5 text-center shadow-sm"><div className={`mx-auto mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black uppercase ${session.qrEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}><FiActivity /> {session.qrEnabled ? 'Live scanning' : 'Scanner closed'}</div><img src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=10&data=${encodeURIComponent(checkInUrl)}`} alt="Hackathon attendance QR" className="mx-auto aspect-square w-full max-w-[270px] rounded-lg border border-slate-200 bg-white p-2" /><button onClick={toggleQr} disabled={busy} className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-black text-white ${session.qrEnabled ? 'bg-rose-600' : 'bg-primary'}`}>{session.qrEnabled ? <><FiX /> Close QR Attendance</> : <><FiCheck /> Open QR Attendance</>}</button><p className="mt-3 text-xs font-bold text-slate-500">Display this QR on the projector. The roster updates automatically.</p></div>
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase text-secondary">Live activity</p><h3 className="text-xl font-black">Recently Present</h3></div><span className="rounded-lg bg-emerald-50 px-3 py-2 font-black text-secondary">{present.length}/{members.length}</span></div><div className="mt-4 space-y-2">{recent.map(member => <div key={member._id} className="flex items-center justify-between gap-3 rounded-lg border border-emerald-100 bg-emerald-50/40 p-3"><div className="min-w-0"><p className="truncate font-black">{member.name}</p><p className="text-xs text-slate-500">{member.teamCode} · PIN {member.pin}</p></div><div className="text-right"><FiCheck className="ml-auto text-emerald-600" /><p className="mt-1 text-xs font-bold text-slate-500">{new Date(member.markedAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</p></div></div>)}{!recent.length && <div className="rounded-lg bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">No attendance marked yet.</div>}</div></div>
          </section>

          <section className="space-y-4"><div className="flex items-end justify-between"><div><p className="text-xs font-black uppercase text-secondary">Manual control</p><h2 className="text-2xl font-black">Team-wise Attendance</h2></div><p className="hidden text-sm font-bold text-slate-500 sm:block">Changes save when you press the button below</p></div><div className="grid gap-4 xl:grid-cols-2">{teams.map(team => { const teamPresent = team.teamMembers.filter(member => member.status === 'present').length; return <article key={team._id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase text-secondary">Team</p><h3 className="text-xl font-black">{team.teamCode}</h3></div><span className={`rounded-lg px-3 py-2 font-black ${teamPresent === team.teamMembers.length ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{teamPresent}/{team.teamMembers.length} present</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-emerald-500 transition-all" style={{width:`${team.teamMembers.length ? (teamPresent/team.teamMembers.length)*100 : 0}%`}} /></div></div><div className="divide-y divide-slate-100">{team.teamMembers.map(member => <div key={member._id} className="flex items-center justify-between gap-3 p-4"><div className="min-w-0"><div className="flex items-center gap-2"><span className={`flex h-7 w-7 flex-none items-center justify-center rounded-full ${member.status === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>{member.status === 'present' ? <FiCheck /> : <FiX />}</span><p className="truncate font-black">{member.name}</p></div><p className="ml-9 mt-1 text-xs text-slate-500">PIN {member.pin}{member.markedAt ? ` · ${new Date(member.markedAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}` : ''}{member.source ? ` · ${member.source.toUpperCase()}` : ''}</p></div><div className="flex flex-none gap-1 rounded-lg bg-slate-100 p-1"><button onClick={() => setStatus(team._id,member._id,'present')} title="Mark present" className={`flex h-9 w-9 items-center justify-center rounded-md ${member.status === 'present' ? 'bg-emerald-500 text-white shadow' : 'bg-transparent text-emerald-700'}`}><FiCheck /></button><button onClick={() => setStatus(team._id,member._id,'absent')} title="Mark absent" className={`flex h-9 w-9 items-center justify-center rounded-md ${member.status === 'absent' ? 'bg-rose-500 text-white shadow' : 'bg-transparent text-rose-700'}`}><FiX /></button></div></div>)}</div></article>; })}</div></section>
          <div className="sticky bottom-4 z-20 rounded-lg border border-emerald-200 bg-white/95 p-3 shadow-xl backdrop-blur"><button onClick={save} disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-4 font-black text-white disabled:opacity-50"><FiSave /> {busy ? 'Saving...' : 'Save Manual Attendance'}</button></div>
        </>}
      </section>
    </main>
  </div>;
};
