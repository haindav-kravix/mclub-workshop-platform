import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiEdit2, FiImage, FiLink, FiPlus, FiSave, FiTrash2, FiX } from 'react-icons/fi';
import { achievementAPI, resolveMediaUrl } from '../utils/api';
import { ErrorMessage, LoadingSpinner, SuccessMessage } from '../components/UI';
import { CATEGORY_RULES, getHighlightCategory } from '../utils/highlights';

const emptyForm = () => ({
  title: '',
  summary: '',
  category: 'Community',
  achievedOn: new Date().toISOString().slice(0, 10),
  links: [{ label: '', url: '' }],
  isPublished: true
});

export const AdminAchievementsPage = () => {
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [images, setImages] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    try {
      const response = await achievementAPI.getAdmin();
      setAchievements(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load achievements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const reset = () => {
    setEditing(null);
    setForm(emptyForm());
    setImages([]);
  };

  const startEdit = (item) => {
    setEditing(item);
    setForm({
      title: item.title,
      summary: item.summary,
      category: getHighlightCategory(item),
      achievedOn: new Date(item.achievedOn).toISOString().slice(0, 10),
      links: item.links?.length ? item.links : [{ label: '', url: '' }],
      isPublished: item.isPublished !== false
    });
    setImages([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setLink = (index, key, value) => setForm(prev => ({
    ...prev,
    links: prev.links.map((link, current) => current === index ? { ...link, [key]: value } : link)
  }));

  const submit = async (event) => {
    event.preventDefault();
    if (!editing && images.length === 0) {
      setError('Add at least one achievement image');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const data = new FormData();
      data.append('title', form.title);
      data.append('summary', form.summary);
      data.append('category', form.category);
      data.append('achievedOn', form.achievedOn);
      data.append('isPublished', String(form.isPublished));
      data.append('links', JSON.stringify(form.links.filter(link => link.label.trim() && link.url.trim())));
      images.forEach(image => data.append('images', image));
      if (editing) await achievementAPI.update(editing._id, data);
      else await achievementAPI.create(data);
      setSuccess(editing ? 'Achievement updated' : 'Achievement published');
      reset();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save achievement');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this achievement?')) return;
    try {
      await achievementAPI.remove(id);
      setAchievements(prev => prev.filter(item => item._id !== id));
      setSuccess('Achievement deleted');
      if (editing?._id === id) reset();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete achievement');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-emerald-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-7">
          <button onClick={() => navigate('/admin')} className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-black text-secondary"><FiArrowLeft /> Dashboard</button>
          <h1 className="mt-5 text-3xl font-black text-slate-950 sm:text-5xl">Club achievements</h1>
          <p className="mt-2 text-slate-600">Publish milestones with images and useful links. The newest achievement appears first.</p>
        </div>
      </div>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,440px)_1fr]">
        <section className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black">{editing ? 'Edit achievement' : 'Add achievement'}</h2>
            {editing && <button onClick={reset} title="Cancel editing" className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100"><FiX /></button>}
          </div>
          {error && <div className="mt-4"><ErrorMessage message={error} onDismiss={() => setError('')} /></div>}
          {success && <div className="mt-4"><SuccessMessage message={success} onDismiss={() => setSuccess('')} /></div>}
          <form onSubmit={submit} className="mt-5 space-y-4">
            <label className="block text-sm font-black">Title<input required value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} className="mt-2 w-full" /></label>
            <label className="block text-sm font-black">
              Category
              <select required value={form.category} onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))} className="mt-2 w-full">
                {CATEGORY_RULES.map(category => (
                  <option key={category.label} value={category.label}>{category.label}</option>
                ))}
                <option value="Highlights">Highlights</option>
              </select>
            </label>
            <label className="block text-sm font-black">Achievement date<input required type="date" value={form.achievedOn} onChange={e => setForm(prev => ({ ...prev, achievedOn: e.target.value }))} className="mt-2 w-full" /></label>
            <label className="block text-sm font-black">Description<textarea required rows="6" value={form.summary} onChange={e => setForm(prev => ({ ...prev, summary: e.target.value }))} className="mt-2 w-full" /></label>
            <div>
              <p className="text-sm font-black">Images</p>
              <label className="mt-2 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-emerald-300 bg-emerald-50 px-4 text-center">
                <FiImage size={24} /><span className="mt-2 text-sm font-bold">{images.length ? `${images.length} selected` : editing ? 'Choose new images to replace existing' : 'Choose up to 4 images'}</span>
                <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={e => setImages(Array.from(e.target.files || []).slice(0, 4))} />
              </label>
            </div>
            <div>
              <div className="flex items-center justify-between"><p className="text-sm font-black">Links</p><button type="button" onClick={() => setForm(prev => ({ ...prev, links: [...prev.links, { label: '', url: '' }] }))} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-black text-secondary"><FiPlus /> Add</button></div>
              <div className="mt-2 space-y-2">
                {form.links.map((link, index) => (
                  <div key={index} className="grid grid-cols-[1fr_1.4fr_36px] gap-2">
                    <input aria-label="Link label" placeholder="Label" value={link.label} onChange={e => setLink(index, 'label', e.target.value)} />
                    <input aria-label="Link URL" type="url" placeholder="https://..." value={link.url} onChange={e => setLink(index, 'url', e.target.value)} />
                    <button type="button" title="Remove link" onClick={() => setForm(prev => ({ ...prev, links: prev.links.filter((_, current) => current !== index) }))} className="flex items-center justify-center rounded-lg bg-rose-50 text-rose-700"><FiX /></button>
                  </div>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm font-black"><input type="checkbox" checked={form.isPublished} onChange={e => setForm(prev => ({ ...prev, isPublished: e.target.checked }))} /> Publish immediately</label>
            <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-black text-white disabled:opacity-50"><FiSave /> {saving ? 'Saving...' : editing ? 'Update Achievement' : 'Publish Achievement'}</button>
          </form>
        </section>

        <section className="space-y-4">
          {achievements.length === 0 && <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-slate-500">No achievements posted yet.</div>}
          {achievements.map(item => (
            <article key={item._id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex gap-4">
                {item.images?.[0] ? <img src={resolveMediaUrl(item.images[0], { w: 500 })} alt="" className="h-24 w-28 flex-none rounded-lg object-cover" /> : <div className="flex h-24 w-28 items-center justify-center rounded-lg bg-emerald-50"><FiImage /></div>}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-1 text-xs font-black ${item.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{item.isPublished ? 'Published' : 'Draft'}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-700">{getHighlightCategory(item)}</span><span className="text-xs font-bold text-slate-500">{new Date(item.achievedOn).toLocaleDateString()}</span></div>
                  <h3 className="mt-2 text-lg font-black text-slate-950">{item.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.summary}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button onClick={() => startEdit(item)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 font-black text-secondary"><FiEdit2 /> Edit</button>
                <button onClick={() => remove(item._id)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-50 px-3 py-2 font-black text-rose-700"><FiTrash2 /> Delete</button>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
};
