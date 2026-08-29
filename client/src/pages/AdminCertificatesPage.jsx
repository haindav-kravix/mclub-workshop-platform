import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiFileText, FiImage, FiSave, FiUsers } from 'react-icons/fi';
import '@fontsource/great-vibes/latin-400.css';
import { certificateAPI } from '../utils/api';
import { ErrorMessage, LoadingSpinner, SuccessMessage } from '../components/UI';

const defaults = {
  nameX: 0.5, nameY: 0.52, fontFamily: 'Great Vibes', fontSize: 160, fontColor: '#111827', alignment: 'center', uppercase: false, maxWidth: 0.9
};

const certificateFontFamily = (fontFamily) => {
  if (fontFamily === 'Great Vibes') return '"Great Vibes", cursive';
  if (fontFamily === 'Times Roman') return 'Times New Roman, serif';
  if (fontFamily === 'Courier') return 'Courier New, monospace';
  return 'Arial, sans-serif';
};

const normalizeCertificateFontSize = (fontFamily, fontSize) => {
  const value = Number(fontSize || 0);
  if (fontFamily === 'Great Vibes' && value > 0 && value < 120) return 160;
  return value || (fontFamily === 'Great Vibes' ? 160 : 42);
};

export const AdminCertificatesPage = () => {
  const { workshopId } = useParams();
  const navigate = useNavigate();
  const [workshop, setWorkshop] = useState(null);
  const [settings, setSettings] = useState(defaults);
  const [templateFile, setTemplateFile] = useState(null);
  const [templateImage, setTemplateImage] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [selected, setSelected] = useState([]);
  const [previewName, setPreviewName] = useState('Participant Name');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    try {
      const [setupResponse, eligibleResponse] = await Promise.all([
        certificateAPI.getSetup(workshopId),
        certificateAPI.getEligible(workshopId)
      ]);
      setWorkshop(setupResponse.data.workshop);
      if (setupResponse.data.template) {
        const { templateImage: image, ...saved } = setupResponse.data.template;
        setTemplateImage(image);
        setSettings(prev => ({
          ...prev,
          ...saved,
          fontSize: normalizeCertificateFontSize(saved.fontFamily || prev.fontFamily, saved.fontSize),
          maxWidth: (saved.fontFamily || prev.fontFamily) === 'Great Vibes' ? Math.max(saved.maxWidth || 0.9, 0.9) : saved.maxWidth
        }));
      }
      const people = eligibleResponse.data || [];
      setRecipients(people);
      setSelected(people.filter(item => !item.certificateIssuedAt).map(item => item.user._id));
      if (people[0]?.certificateName || people[0]?.user?.name) setPreviewName(people[0].certificateName || people[0].user.name);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load certificate setup');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [workshopId]);

  useEffect(() => () => {
    if (templateImage?.startsWith('blob:')) URL.revokeObjectURL(templateImage);
  }, [templateImage]);

  const displayName = settings.uppercase ? previewName.toUpperCase() : previewName;
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const chooseTemplate = (file) => {
    if (!file) return;
    if (templateImage?.startsWith('blob:')) URL.revokeObjectURL(templateImage);
    setTemplateFile(file);
    setTemplateImage(URL.createObjectURL(file));
  };

  const placeName = (event) => {
    if (!templateImage) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setSettings(prev => ({
      ...prev,
      nameX: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      nameY: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height))
    }));
  };

  const saveSetup = async () => {
    if (!templateImage) {
      setError('Upload a certificate design first');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const data = new FormData();
      if (templateFile) data.append('template', templateFile);
      Object.entries(settings).forEach(([key, value]) => data.append(key, String(value)));
      const response = await certificateAPI.saveSetup(workshopId, data);
      const { templateImage: savedImage, ...savedSettings } = response.data.template;
      setTemplateImage(savedImage);
      setTemplateFile(null);
      setSettings(prev => ({
        ...prev,
        nameX: savedSettings.nameX,
        nameY: savedSettings.nameY,
        fontFamily: savedSettings.fontFamily,
        fontSize: savedSettings.fontSize,
        fontColor: savedSettings.fontColor,
        alignment: savedSettings.alignment,
        uppercase: savedSettings.uppercase,
        maxWidth: savedSettings.maxWidth
      }));
      setSuccess('Certificate design saved');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save certificate design');
    } finally {
      setSaving(false);
    }
  };

  const generate = async () => {
    if (!selected.length) {
      setError('Select at least one confirmed participant');
      return;
    }
    setGenerating(true);
    setError('');
    try {
      const response = await certificateAPI.generate(workshopId, selected);
      setSuccess(response.data.message || 'Certificates generated');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to generate certificates');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-7">
          <button onClick={() => navigate('/admin')} className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-black text-secondary"><FiArrowLeft /> Dashboard</button>
          <p className="mt-5 text-sm font-black uppercase text-secondary">Certificate generation</p>
          <h1 className="mt-2 break-words text-3xl font-black text-slate-950 sm:text-5xl">{workshop?.title}</h1>
          <p className="mt-2 text-slate-600">Upload the final Canva design, click where the participant name should appear, preview it, and generate certificates for selected confirmed participants.</p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
        {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="text-xl font-black">Certificate preview</h2><p className="text-sm text-slate-500">Click directly on the certificate to place the name.</p></div>
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 font-black text-secondary"><FiImage /> Upload Canva design<input type="file" accept="image/png,image/jpeg" className="hidden" onChange={e => chooseTemplate(e.target.files?.[0])} /></label>
            </div>
            {templateImage ? (
              <div onClick={placeName} className="relative mx-auto w-full max-w-5xl cursor-crosshair overflow-hidden rounded-lg border border-emerald-200 bg-slate-100">
                <img src={templateImage} alt="Certificate design preview" className="block h-auto w-full" />
                <span
                  className="pointer-events-none absolute whitespace-nowrap font-bold"
                  style={{
                    left: `${settings.nameX * 100}%`, top: `${settings.nameY * 100}%`,
                    transform: settings.alignment === 'center' ? 'translate(-50%, -50%)' : settings.alignment === 'right' ? 'translate(-100%, -50%)' : 'translate(0, -50%)',
                    fontFamily: certificateFontFamily(settings.fontFamily),
                    fontSize: `clamp(18px, ${Math.max(1.8, settings.fontSize / 8)}vw, ${settings.fontSize}px)`,
                    lineHeight: 1,
                    color: settings.fontColor,
                    maxWidth: `${settings.maxWidth * 100}%`
                  }}
                >{displayName}</span>
              </div>
            ) : (
              <label className="flex min-h-80 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-emerald-300 bg-emerald-50 text-center"><FiImage size={42} /><span className="mt-3 text-lg font-black">Upload a PNG or JPG certificate design</span><input type="file" accept="image/png,image/jpeg" className="hidden" onChange={e => chooseTemplate(e.target.files?.[0])} /></label>
            )}
          </div>

          <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-5">
            <h2 className="text-xl font-black">Name controls</h2>
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-black">Preview name<input value={previewName} onChange={e => setPreviewName(e.target.value)} className="mt-2 w-full" /></label>
              <label className="block text-sm font-black">Font<select value={settings.fontFamily} onChange={e => setSettings(prev => ({ ...prev, fontFamily: e.target.value, fontSize: e.target.value === 'Great Vibes' ? Math.max(normalizeCertificateFontSize(e.target.value, prev.fontSize), 160) : prev.fontSize, maxWidth: e.target.value === 'Great Vibes' ? Math.max(prev.maxWidth, 0.9) : prev.maxWidth }))} className="mt-2 w-full"><option value="Great Vibes">Certificate Script</option><option>Helvetica</option><option>Times Roman</option><option>Courier</option></select></label>
              <label className="block text-sm font-black">Font size<div className="mt-2 flex items-center gap-3"><input type="range" min="20" max="420" value={settings.fontSize} onChange={e => setSettings(prev => ({ ...prev, fontSize: Number(e.target.value) }))} className="min-w-0 flex-1" /><span className="w-14 text-right font-black">{settings.fontSize}</span></div></label>
              <label className="block text-sm font-black">Move left / right<div className="mt-2 flex items-center gap-3"><input type="range" min="0" max="100" value={Math.round(settings.nameX * 100)} onChange={e => setSettings(prev => ({ ...prev, nameX: Number(e.target.value) / 100 }))} className="min-w-0 flex-1" /><span className="w-12 text-right font-black">{Math.round(settings.nameX * 100)}%</span></div></label>
              <label className="block text-sm font-black">Move up / down<div className="mt-2 flex items-center gap-3"><input type="range" min="0" max="100" value={Math.round(settings.nameY * 100)} onChange={e => setSettings(prev => ({ ...prev, nameY: Number(e.target.value) / 100 }))} className="min-w-0 flex-1" /><span className="w-12 text-right font-black">{Math.round(settings.nameY * 100)}%</span></div></label>
              <label className="block text-sm font-black">Text colour<input type="color" value={settings.fontColor} onChange={e => setSettings(prev => ({ ...prev, fontColor: e.target.value }))} className="mt-2 h-11 w-full rounded-lg" /></label>
              <label className="block text-sm font-black">Alignment<select value={settings.alignment} onChange={e => setSettings(prev => ({ ...prev, alignment: e.target.value }))} className="mt-2 w-full"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>
              <label className="block text-sm font-black">Maximum name width<div className="mt-2 flex items-center gap-3"><input type="range" min="20" max="100" value={Math.round(settings.maxWidth * 100)} onChange={e => setSettings(prev => ({ ...prev, maxWidth: Number(e.target.value) / 100 }))} className="min-w-0 flex-1" /><span className="w-12 text-right font-black">{Math.round(settings.maxWidth * 100)}%</span></div></label>
              <label className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm font-black"><input type="checkbox" checked={settings.uppercase} onChange={e => setSettings(prev => ({ ...prev, uppercase: e.target.checked }))} /> Uppercase participant names</label>
              <button onClick={saveSetup} disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-black text-white disabled:opacity-50"><FiSave /> {saving ? 'Saving...' : 'Save Design & Controls'}</button>
            </div>
          </aside>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-sm font-black uppercase text-secondary">Eligible confirmed participants</p><h2 className="mt-1 text-2xl font-black">Choose certificate recipients</h2></div>
            <div className="flex gap-2"><button onClick={() => setSelected(recipients.map(item => item.user._id))} className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-black text-secondary">Select all</button><button onClick={() => setSelected([])} className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-black">Clear</button></div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {recipients.map(item => {
              const checked = selectedSet.has(item.user._id);
              return (
                <label key={item.user._id} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${checked ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                  <input type="checkbox" checked={checked} onChange={() => setSelected(prev => checked ? prev.filter(id => id !== item.user._id) : [...prev, item.user._id])} />
                  <div className="min-w-0 flex-1"><p className="truncate font-black">{item.certificateName || item.user.name}</p><p className="truncate text-sm text-slate-500">{item.user.email}</p><div className="mt-2 flex flex-wrap gap-2 text-xs font-black"><span className="rounded-full bg-white px-2 py-1">{item.attendancePercentage === null ? 'No attendance yet' : `${item.attendancePercentage}% attendance`}</span>{item.certificateIssuedAt && <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700"><FiCheck className="inline" /> Issued</span>}</div></div>
                </label>
              );
            })}
          </div>
          {recipients.length === 0 && <div className="mt-5 rounded-lg bg-slate-50 p-8 text-center"><FiUsers className="mx-auto" size={28} /><p className="mt-2 font-black">No confirmed participants yet</p></div>}
          <button onClick={generate} disabled={generating || selected.length === 0} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-black text-white disabled:opacity-50 sm:w-auto"><FiFileText /> {generating ? 'Generating PDFs...' : `Generate ${selected.length} Certificate${selected.length === 1 ? '' : 's'}`}</button>
        </section>
      </main>
    </div>
  );
};
