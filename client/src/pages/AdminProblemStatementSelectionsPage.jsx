import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiBookOpen, FiCheckCircle, FiClock, FiUsers } from 'react-icons/fi';
import { ErrorMessage, LoadingSpinner } from '../components/UI';
import { workshopAPI } from '../utils/api';

const PENDING_KEY = 'pending';

export const AdminProblemStatementSelectionsPage = () => {
  const { workshopId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [activeKey, setActiveKey] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    workshopAPI.getProblemStatementSelections(workshopId)
      .then((response) => {
        setData(response.data);
        setActiveKey(response.data.problemStatements?.[0]?._id || PENDING_KEY);
      })
      .catch(err => setError(err.response?.data?.message || 'Unable to load selection overview'));
  }, [workshopId]);

  const activeGroup = useMemo(() => {
    if (!data) return null;
    if (activeKey === PENDING_KEY) {
      return { title: 'Pending selections', teams: data.pendingTeams, pending: true };
    }
    return data.problemStatements.find(statement => String(statement._id) === String(activeKey)) || null;
  }, [activeKey, data]);

  if (!data && !error) return <LoadingSpinner />;

  return (
    <div className="min-h-screen app-shell">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
        <button
          onClick={() => navigate(`/admin/hackathon/${workshopId}/problem-statements`)}
          className="mb-5 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-secondary shadow-sm transition hover:bg-emerald-50"
        >
          <FiArrowLeft /> Back to Problem Statements
        </button>

        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
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
                  {activeGroup?.teams?.map((team, index) => (
                    <div key={team.registrationId} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-black text-emerald-800 shadow-sm">{index + 1}</span>
                      <p className="min-w-0 break-words text-lg font-black text-slate-950">{team.teamName}</p>
                    </div>
                  ))}
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
