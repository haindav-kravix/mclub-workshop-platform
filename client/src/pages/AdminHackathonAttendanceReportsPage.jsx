import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiBarChart2, FiCheckCircle, FiDownload, FiSearch, FiUsers } from 'react-icons/fi';
import { attendanceAPI } from '../utils/api';
import { ErrorMessage, LoadingSpinner } from '../components/UI';

const downloadBlob = (response, fileName) => {
  const url = URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a'); link.href = url; link.download = fileName; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
};

export const AdminHackathonAttendanceReportsPage = () => {
  const { workshopId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const load = () => attendanceAPI.getHackathonReports(workshopId).then(response => setReport(response.data)).catch(err => setError(err.response?.data?.message || 'Unable to load attendance reports')).finally(() => setLoading(false));
  useEffect(() => { load(); }, [workshopId]);
  const teams = useMemo(() => (report?.teams || []).filter(team => `${team.teamCode} ${team.teamMembers.map(member => member.name).join(' ')}`.toLowerCase().includes(search.toLowerCase())), [report, search]);
  const exportOverall = async () => { setExporting(true); try { const response = await attendanceAPI.exportHackathonReport(workshopId); downloadBlob(response, `${report.workshop.title}-attendance.xlsx`); } catch (err) { setError(err.response?.data?.message || 'Unable to export report'); } finally { setExporting(false); } };
  if (loading) return <LoadingSpinner />;
  const totals = report?.totals || {};
  return <div className="min-h-screen bg-slate-50">
    <header className="border-b bg-white"><div className="mx-auto max-w-7xl px-4 py-7"><button onClick={() => navigate(`/admin/hackathon/${workshopId}/attendance`)} className="inline-flex items-center gap-2 text-sm font-black text-secondary"><FiArrowLeft /> Attendance Control</button><div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-black uppercase text-secondary">Hackathon attendance</p><h1 className="mt-1 text-3xl font-black sm:text-5xl">Attendance Reports</h1><p className="mt-2 text-slate-600">{report?.workshop?.title}</p></div><button onClick={exportOverall} disabled={exporting} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-black text-white"><FiDownload /> {exporting ? 'Exporting...' : 'Export Full Excel'}</button></div></div></header>
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-7">{error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
        ['Confirmed teams', totals.teams || 0, FiUsers, 'bg-slate-950 text-white'], ['Team members', totals.members || 0, FiUsers, 'bg-white'], ['Sessions', totals.sessions || 0, FiBarChart2, 'bg-white'], ['Overall attendance', `${totals.percentage || 0}%`, FiCheckCircle, 'bg-emerald-600 text-white']
      ].map(([label,value,Icon,style]) => <div key={label} className={`rounded-lg border p-5 shadow-sm ${style}`}><Icon size={24} /><p className="mt-5 text-3xl font-black">{value}</p><p className="mt-1 text-sm font-bold opacity-75">{label}</p></div>)}</section>
      <section className="rounded-lg border bg-white p-4 shadow-sm"><h2 className="text-xl font-black">Session Summary</h2><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{report?.sessions?.map(session => <div key={session._id} className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black">{session.title}</h3><p className="text-xs text-slate-500">{new Date(session.date).toLocaleDateString('en-IN')}</p></div><span className="rounded-md bg-white px-2 py-1 text-sm font-black text-secondary">{session.present}/{session.total}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-100"><div className="h-full bg-emerald-500" style={{ width: `${session.total ? (session.present/session.total)*100 : 0}%` }} /></div></div>)}</div>{!report?.sessions?.length && <p className="py-8 text-center font-bold text-slate-500">No attendance sessions created yet.</p>}</section>
      <label className="flex items-center gap-3 rounded-lg border bg-white px-4 py-3 shadow-sm"><FiSearch /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search team or participant" className="w-full border-0 outline-none" /></label>
      <div className="space-y-5">{teams.map(team => { const possible = team.teamMembers.length * (report.sessions?.length || 0); const present = team.teamMembers.reduce((sum,member)=>sum+member.present,0); return <section key={team._id} className="overflow-hidden rounded-lg border bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-950 px-4 py-4 text-white"><div><p className="text-xs font-bold uppercase text-emerald-300">Team</p><h2 className="text-xl font-black">{team.teamCode}</h2></div><span className="rounded-lg bg-white/10 px-3 py-2 font-black">{possible ? Math.round((present/possible)*100) : 0}% overall</span></div><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Member</th>{report.sessions.map(session => <th key={session._id} className="whitespace-nowrap px-3 py-3">{session.title}</th>)}<th className="px-4 py-3">Total</th></tr></thead><tbody>{team.teamMembers.map(member => <tr key={member._id} className="border-t"><td className="px-4 py-3"><p className="font-black">{member.name}</p><p className="font-mono text-xs text-slate-500">PIN {member.pin}</p></td>{member.attendance.map(item => <td key={item.sessionId} className="px-3 py-3"><span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${item.status === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>{item.status === 'present' ? '✓' : '×'}</span></td>)}<td className="px-4 py-3 font-black">{member.present}/{member.total} <span className="text-secondary">({member.percentage}%)</span></td></tr>)}</tbody></table></div></section>; })}</div>
    </main>
  </div>;
};
