import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiCheckCircle, FiKey, FiSearch, FiUsers } from 'react-icons/fi';
import { attendanceAPI } from '../utils/api';
import { ErrorMessage, LoadingSpinner } from '../components/UI';

export const AdminHackathonTeamsPage = () => {
  const { workshopId } = useParams();
  const navigate = useNavigate();
  const [workshop, setWorkshop] = useState(null);
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    attendanceAPI.getHackathonTeams(workshopId)
      .then(response => { setWorkshop(response.data.workshop); setTeams(response.data.teams || []); })
      .catch(err => setError(err.response?.data?.message || 'Unable to load teams'))
      .finally(() => setLoading(false));
  }, [workshopId]);

  const visible = useMemo(() => teams.filter(team => (
    `${team.teamCode} ${team.leader?.name} ${team.leader?.email} ${(team.teamMembers || []).map(member => member.name).join(' ')}`
      .toLowerCase().includes(search.toLowerCase())
  )), [teams, search]);

  if (loading) return <LoadingSpinner />;
  return <div className="min-h-screen bg-slate-50">
    <header className="border-b border-emerald-100 bg-white"><div className="mx-auto max-w-7xl px-4 py-6">
      <button onClick={() => navigate('/admin/hackathons')} className="inline-flex items-center gap-2 text-sm font-black text-secondary"><FiArrowLeft /> Hackathons</button>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-black uppercase text-secondary">Generated after confirmation</p><h1 className="mt-1 text-3xl font-black sm:text-5xl">Team Members & PINs</h1><p className="mt-2 text-slate-600">{workshop?.title}</p></div><button onClick={() => navigate(`/admin/hackathon/${workshopId}/attendance`)} className="rounded-lg bg-primary px-5 py-3 font-black text-white">Attendance sessions</button></div>
    </div></header>
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6">
      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
      <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-900"><FiCheckCircle className="mr-2 inline" /> Names are taken from each registration. Four unique PINs are generated automatically only when the team is confirmed.</div>
      <label className="flex items-center gap-3 rounded-lg border bg-white px-4 py-3 shadow-sm"><FiSearch /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search team or member name" className="w-full border-0 outline-none" /></label>
      <div className="grid gap-5 lg:grid-cols-2">{visible.map(team => <section key={team._id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-3 border-b pb-4"><div><p className="text-xs font-black uppercase text-secondary">Team name</p><h2 className="text-2xl font-black">{team.teamCode}</h2></div><span className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-black text-secondary"><FiUsers className="inline" /> {team.teamMembers?.length || 0}/4</span></div>
        <div className="mt-4 space-y-2">{team.teamMembers?.map((member, index) => <div key={member._id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3"><div className="min-w-0"><p className="truncate font-black">{member.name}</p><p className="text-xs text-slate-500">{index === 0 ? 'Team leader' : `Member ${index}`}</p></div><span className="inline-flex min-w-24 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 py-2 font-mono text-lg font-black text-white"><FiKey /> {member.pin}</span></div>)}</div>
        {team.teamMembers?.length !== 4 && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm font-bold text-amber-800">This older registration does not contain four recognizable member names.</p>}
      </section>)}</div>
      {!visible.length && <div className="rounded-lg bg-white p-10 text-center font-black">No confirmed teams found.</div>}
    </main>
  </div>;
};
