import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiBookOpen, FiCheckCircle, FiChevronDown, FiClock, FiDownload, FiSave, FiSearch, FiUser, FiUsers } from 'react-icons/fi';
import { ErrorMessage, LoadingSpinner, SuccessMessage } from '../components/UI';
import { workshopAPI } from '../utils/api';

const PENDING_KEY = 'pending';

export const AdminProblemStatementSelectionsPage = () => {
  const { workshopId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [activeKey, setActiveKey] = useState('');
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [expandedTeam, setExpandedTeam] = useState('');
  const [success, setSuccess] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [assignmentChoices, setAssignmentChoices] = useState({});
  const [assigningTeam, setAssigningTeam] = useState('');

  const loadSelections = async ({ preserveActive = false } = {}) => {
    const response = await workshopAPI.getProblemStatementSelections(workshopId);
    setData(response.data);
    setAssignmentChoices(Object.fromEntries((response.data.teams || []).map(team => [team.registrationId, team.selectedStatementId || ''])));
    if (!preserveActive) setActiveKey(response.data.problemStatements?.[0]?._id || PENDING_KEY);
  };

  useEffect(() => {
    loadSelections().catch(err => setError(err.response?.data?.message || 'Unable to load selection overview'));
  }, [workshopId]);

  const activeGroup = useMemo(() => {
    if (!data) return null;
    if (activeKey === PENDING_KEY) {
      return { title: 'Pending selections', teams: data.pendingTeams, pending: true };
    }
    return data.problemStatements.find(statement => String(statement._id) === String(activeKey)) || null;
  }, [activeKey, data]);

  const exportSelections = async () => {
    setExporting(true);
    setError('');
    try {
      const response = await workshopAPI.exportProblemStatementSelections(workshopId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${data?.workshop?.title || 'hackathon'}-problem-selections.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to export problem selections');
    } finally {
      setExporting(false);
    }
  };

  const filteredTeams = useMemo(() => {
    const query = teamSearch.trim().toLowerCase();
    if (!query) return data?.teams || [];
    return (data?.teams || []).filter(team => [team.teamName, team.leaderName, ...(team.memberNames || [])]
      .filter(Boolean).join(' ').toLowerCase().includes(query));
  }, [data, teamSearch]);

  const assignStatement = async (team) => {
    const statementId = assignmentChoices[team.registrationId];
    if (!statementId) {
      setError('Select a published problem statement');
      return;
    }
    const statement = data.problemStatements.find(item => String(item._id) === String(statementId));
    const replacing = Boolean(team.selectedStatementId) && String(team.selectedStatementId) !== String(statementId);
    if (replacing && !window.confirm(`Replace ${team.teamName}'s current statement with “${statement?.title || 'the selected statement'}”?`)) return;

    setAssigningTeam(String(team.registrationId));
    setError('');
    try {
      const response = await workshopAPI.assignProblemStatementManually(workshopId, team.registrationId, statementId);
      setSuccess(response.data.message);
      await loadSelections({ preserveActive: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to assign problem statement');
    } finally {
      setAssigningTeam('');
    }
  };

  if (!data && !error) return <LoadingSpinner />;

  return (
    <div className="min-h-screen app-shell">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate(`/admin/hackathon/${workshopId}/problem-statements`)}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-secondary shadow-sm transition hover:bg-emerald-50"
          >
            <FiArrowLeft /> Back to Problem Statements
          </button>
          {data && (
            <button
              onClick={exportSelections}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
            >
              <FiDownload /> {exporting ? 'Exporting...' : 'Export Excel'}
            </button>
          )}
        </div>

        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
        {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}
        {data && (
          <>
            <section className="overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
              <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-emerald-300"><FiUsers /> Team selection overview</p>
              <h1 className="mt-3 break-words text-3xl font-black sm:text-5xl">{data.workshop.title}</h1>
              <p className="mt-3 max-w-2xl font-semibold text-slate-300">See which problem statement every confirmed team selected and follow up with teams that are still pending.</p>
            </section>

            <section className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Confirmed Teams', value: data.summary.confirmedTeams, icon: FiUsers, tone: 'text-slate-900 bg-white border-slate-200' },
                { label: 'Selected', value: data.summary.selectedTeams, icon: FiCheckCircle, tone: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
                { label: 'Pending', value: data.summary.pendingTeams, icon: FiClock, tone: 'text-amber-800 bg-amber-50 border-amber-200' }
              ].map(({ label, value, icon: Icon, tone }) => (
                <div key={label} className={`rounded-2xl border p-5 shadow-sm ${tone}`}>
                  <Icon className="text-2xl" />
                  <p className="mt-3 text-4xl font-black">{value}</p>
                  <p className="text-sm font-black">{label}</p>
                </div>
              ))}
            </section>

            {data.workshop.assignmentMode === 'manual' && (
              <section className="mt-7 rounded-3xl border border-blue-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div><p className="text-xs font-black uppercase tracking-wide text-blue-700">Manual assignment</p><h2 className="mt-1 text-2xl font-black text-slate-950">Search and assign teams</h2><p className="mt-2 text-sm font-semibold text-slate-600">Choose one published statement. Reassigning changes only that team.</p></div>
                  <p className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-black text-blue-800">{filteredTeams.length} team{filteredTeams.length === 1 ? '' : 's'}</p>
                </div>
                <label className="mt-5 flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 focus-within:border-blue-400 focus-within:bg-white">
                  <FiSearch className="text-slate-500" />
                  <input value={teamSearch} onChange={event => setTeamSearch(event.target.value)} placeholder="Search team, leader, or member name" className="min-w-0 flex-1 border-0 bg-transparent py-3 font-bold outline-none" />
                </label>
                <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
                  {filteredTeams.map(team => (
                    <div key={team.registrationId} className="grid gap-3 bg-white p-4 lg:grid-cols-[minmax(180px,0.8fr)_minmax(240px,1.2fr)_auto] lg:items-center">
                      <div className="min-w-0"><p className="break-words text-lg font-black text-slate-950">{team.teamName}</p><p className="mt-1 truncate text-sm font-semibold text-slate-500">Leader: {team.leaderName}</p>{team.selectedStatementTitle && <p className="mt-1 text-xs font-black text-emerald-700">Current: {team.selectedStatementTitle}</p>}</div>
                      <select value={assignmentChoices[team.registrationId] || ''} onChange={event => setAssignmentChoices(previous => ({ ...previous, [team.registrationId]: event.target.value }))} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 font-bold outline-none focus:border-blue-400">
                        <option value="">Select published statement</option>
                        {data.problemStatements.filter(statement => statement.isPublished && !statement.isDeleted).map(statement => <option key={statement._id} value={statement._id}>{statement.title}</option>)}
                      </select>
                      <button type="button" onClick={() => assignStatement(team)} disabled={assigningTeam === String(team.registrationId) || !assignmentChoices[team.registrationId]} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"><FiSave /> {assigningTeam === String(team.registrationId) ? 'Assigning...' : team.selectedStatementId ? 'Update' : 'Assign'}</button>
                    </div>
                  ))}
                  {filteredTeams.length === 0 && <p className="p-8 text-center font-bold text-slate-500">No confirmed teams match this search.</p>}
                </div>
              </section>
            )}

            <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.4fr)]">
              <section className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
                <h2 className="px-2 text-xl font-black text-slate-950">Problem statements</h2>
                <p className="px-2 pt-1 text-sm font-semibold text-slate-500">Select one to view its teams.</p>
                <div className="mt-4 grid gap-2">
                  {data.problemStatements.map((statement, index) => (
                    <button
                      key={statement._id}
                      onClick={() => setActiveKey(statement._id)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${String(activeKey) === String(statement._id) ? 'border-emerald-400 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/50'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Statement {index + 1}</p>
                          <p className="mt-1 break-words font-black text-slate-950">{statement.title}</p>
                          {statement.isDeleted && <p className="mt-1 text-xs font-bold text-rose-600">Deleted from current statements</p>}
                        </div>
                        <span className="flex h-10 min-w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 px-2 font-black text-white">{statement.selectedCount}</span>
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={() => setActiveKey(PENDING_KEY)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${activeKey === PENDING_KEY ? 'border-amber-400 bg-amber-50 shadow-sm' : 'border-slate-200 bg-white hover:border-amber-200 hover:bg-amber-50/50'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-amber-700">Needs attention</p>
                        <p className="mt-1 font-black text-slate-950">Pending selections</p>
                      </div>
                      <span className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-amber-500 px-2 font-black text-white">{data.summary.pendingTeams}</span>
                    </div>
                  </button>
                </div>
              </section>

              <section className="min-h-[360px] rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-7">
                <div className="flex items-start gap-3">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl ${activeGroup?.pending ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {activeGroup?.pending ? <FiClock /> : <FiBookOpen />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">Team list</p>
                    <h2 className="mt-1 break-words text-2xl font-black text-slate-950">{activeGroup?.title || 'Select a problem statement'}</h2>
                    <p className="mt-1 text-sm font-bold text-slate-500">{activeGroup?.teams?.length || 0} team{activeGroup?.teams?.length === 1 ? '' : 's'}</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  {activeGroup?.teams?.map((team, index) => {
                    const isExpanded = expandedTeam === String(team.registrationId);
                    return (
                      <div key={team.registrationId} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                        <button onClick={() => setExpandedTeam(isExpanded ? '' : String(team.registrationId))} className="flex w-full items-center gap-4 p-4 text-left hover:bg-emerald-50/60" aria-expanded={isExpanded}>
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-black text-emerald-800 shadow-sm">{index + 1}</span>
                          <p className="min-w-0 flex-1 break-words text-lg font-black text-slate-950">{team.teamName}</p>
                          <FiChevronDown className={`shrink-0 text-xl text-emerald-700 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {isExpanded && (
                          <div className="grid gap-2 border-t border-slate-200 bg-white p-4 sm:grid-cols-2">
                            {(team.members || []).map((member, memberIndex) => (
                              <div key={`${member.name}-${memberIndex}`} className={`rounded-xl border p-3 ${memberIndex === 0 ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                                <p className="flex items-center gap-1 text-xs font-black uppercase text-slate-500"><FiUser /> {member.role}</p>
                                <p className="mt-1 break-words font-black text-slate-950">{member.name}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {activeGroup && activeGroup.teams.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center font-bold text-slate-500">
                      {activeGroup.pending ? 'Every confirmed team has selected a problem statement.' : 'No confirmed team selected this problem statement yet.'}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
