import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiKey, FiSave, FiSearch, FiUsers } from 'react-icons/fi';
import { attendanceAPI } from '../utils/api';
import { ErrorMessage, LoadingSpinner, SuccessMessage } from '../components/UI';

const blankMember = () => ({ name: '', email: '', rollNumber: '', college: '', pin: '' });

export const AdminHackathonTeamsPage = () => {
  const { workshopId } = useParams();
  const navigate = useNavigate();
  const [workshop, setWorkshop] = useState(null);
  const [teams, setTeams] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    try {
      const response = await attendanceAPI.getHackathonTeams(workshopId);
      setWorkshop(response.data.workshop);
      setTeams(response.data.teams || []);
      setDrafts(Object.fromEntries((response.data.teams || []).map(team => [team._id, Array.from({ length: 4 }, (_, index) => ({ ...blankMember(), ...(team.teamMembers?.[index] || {}) }))])));
    } catch (err) { setError(err.response?.data?.message || 'Unable to load teams'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [workshopId]);
  const visible = useMemo(() => teams.filter(team => `${team.teamCode} ${team.leader?.name} ${team.leader?.email}`.toLowerCase().includes(search.toLowerCase())), [teams, search]);

  const update = (teamId, index, field, value) => setDrafts(prev => ({ ...prev, [teamId]: prev[teamId].map((member, memberIndex) => memberIndex === index ? { ...member, [field]: value } : member) }));
  const save = async (teamId) => {
    setSaving(teamId); setError(''); setSuccess('');
    try {
      const response = await attendanceAPI.saveHackathonTeam(workshopId, teamId, drafts[teamId]);
      setTeams(prev => prev.map(team => team._id === teamId ? response.data.team : team));
      setDrafts(prev => ({ ...prev, [teamId]: response.data.team.teamMembers }));
      setSuccess('Four team members saved and unique PINs generated');
    } catch (err) { setError(err.response?.data?.message || 'Unable to save team members'); }
    finally { setSaving(''); }
  };

  if (loading) return <LoadingSpinner />;
  return <div className="min-h-screen bg-slate-50">
    <header className="border-b border-emerald-100 bg-white"><div className="mx-auto max-w-7xl px-4 py-6">
      <button onClick={() => navigate('/admin/hackathons')} className="inline-flex items-center gap-2 text-sm font-black text-secondary"><FiArrowLeft /> Hackathons</button>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-black uppercase text-secondary">Hackathon team setup</p><h1 className="mt-1 text-3xl font-black sm:text-5xl">Team Members & PINs</h1><p className="mt-2 text-slate-600">{workshop?.title}</p></div><button onClick={() => navigate(`/admin/hackathon/${workshopId}/attendance`)} className="rounded-lg bg-primary px-5 py-3 font-black text-white">Attendance sessions</button></div>
    </div></header>
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6">
      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}{success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}
      <label className="flex items-center gap-3 rounded-lg border bg-white px-4 py-3 shadow-sm"><FiSearch /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search team name or leader" className="w-full border-0 outline-none" /></label>
      {visible.map(team => <section key={team._id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4"><div><p className="text-xs font-black uppercase text-secondary">Team name</p><h2 className="text-2xl font-black">{team.teamCode}</h2><p className="text-sm text-slate-500">Registered by {team.leader?.name || team.leader?.email}</p></div><div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-black text-secondary"><FiUsers className="inline" /> 4 members</div></div>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">{drafts[team._id]?.map((member, index) => <div key={member._id || index} className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-4">
          <div className="mb-3 flex items-center justify-between"><h3 className="font-black">Member {index + 1}</h3><span className="inline-flex min-w-24 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 py-2 font-mono text-lg font-black text-white"><FiKey /> {member.pin || '----'}</span></div>
          <div className="grid gap-3 sm:grid-cols-2">{[['name','Full name *'],['email','Email'],['rollNumber','Roll number'],['college','College']].map(([field,label]) => <label key={field} className="text-xs font-black uppercase text-slate-600">{label}<input value={member[field] || ''} onChange={e => update(team._id,index,field,e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm normal-case outline-none focus:border-secondary" /></label>)}</div>
        </div>)}</div>
        <button onClick={() => save(team._id)} disabled={saving === team._id} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-black text-white disabled:opacity-50 sm:w-auto"><FiSave /> {saving === team._id ? 'Saving...' : 'Save Members & Generate PINs'}</button>
      </section>)}
      {!visible.length && <div className="rounded-lg bg-white p-10 text-center font-black">No confirmed teams found.</div>}
    </main>
  </div>;
};
