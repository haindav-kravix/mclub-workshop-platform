import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiBookOpen, FiCheckCircle } from 'react-icons/fi';
import { ErrorMessage, LoadingSpinner, SuccessMessage } from '../components/UI';
import { registrationAPI } from '../utils/api';

export const HackathonProblemStatementsPage = () => {
  const { workshopId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [selecting, setSelecting] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    registrationAPI.getHackathonProblemStatements(workshopId)
      .then(response => setData(response.data))
      .catch(err => setError(err.response?.data?.message || 'Unable to load problem statements'));
  }, [workshopId]);

  const chooseStatement = async (statement) => {
    if (!window.confirm(`Select “${statement.title}”? Your team can select only one statement.`)) return;
    setSelecting(statement._id);
    setError('');
    try {
      const response = await registrationAPI.selectHackathonProblemStatement(workshopId, statement._id);
      setData(prev => ({ ...prev, selectedProblemStatement: response.data.selectedProblemStatement }));
      setSuccess('Problem statement selected for your team');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to select problem statement');
    } finally {
      setSelecting('');
    }
  };

  if (!data && !error) return <LoadingSpinner />;
  const selected = data?.selectedProblemStatement;

  return (
    <div className="min-h-screen app-shell">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <button onClick={() => navigate('/my-registrations')} className="mb-5 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-secondary shadow-sm hover:bg-emerald-50"><FiArrowLeft /> Back to My Events</button>
        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
        {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}
        {data && (
          <>
            <div className="mb-7 rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
              <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-emerald-300"><FiBookOpen /> Confirmed team access</p>
              <h1 className="mt-3 break-words text-3xl font-black sm:text-5xl">{data.workshop.title}</h1>
              <p className="mt-3 font-bold text-slate-300">Team {data.teamCode}</p>
            </div>

            {selected?.statementId ? (
              <section className="rounded-3xl border-2 border-emerald-300 bg-white p-6 shadow-lg sm:p-8">
                <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-emerald-700"><FiCheckCircle /> Your selected statement</p>
                <h2 className="mt-3 text-2xl font-black text-slate-950 sm:text-3xl">{selected.title}</h2>
                <p className="mt-4 whitespace-pre-wrap font-medium leading-7 text-slate-600">{selected.description}</p>
                <p className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">This statement is locked to your team.</p>
              </section>
            ) : (
              <div className="grid gap-5">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">Choose carefully. A confirmed team can select only one problem statement.</div>
                {data.problemStatements.map((statement, index) => (
                  <article key={statement._id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                    <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Problem statement {index + 1}</p>
                    <h2 className="mt-2 text-2xl font-black text-slate-950">{statement.title}</h2>
                    <p className="mt-3 whitespace-pre-wrap font-medium leading-7 text-slate-600">{statement.description}</p>
                    <button onClick={() => chooseStatement(statement)} disabled={Boolean(selecting)} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 font-black text-secondary shadow-sm hover:bg-primary/80 disabled:opacity-50 sm:w-auto"><FiCheckCircle /> {selecting === statement._id ? 'Selecting...' : 'Select This Statement'}</button>
                  </article>
                ))}
                {data.problemStatements.length === 0 && <div className="rounded-3xl border border-dashed border-emerald-200 bg-white p-10 text-center font-bold text-slate-500">Problem statements have not been published yet.</div>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
