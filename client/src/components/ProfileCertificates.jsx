import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiAward, FiDownload, FiEye, FiX } from 'react-icons/fi';
import { certificateAPI } from '../utils/api';

export const ProfileCertificates = ({ onError }) => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    certificateAPI.getMy()
      .then(response => setCertificates(response.data || []))
      .catch(err => onError?.(err.response?.data?.message || 'Unable to load certificates'))
      .finally(() => setLoading(false));
    return () => { if (preview?.url) URL.revokeObjectURL(preview.url); };
  }, []);

  useEffect(() => {
    if (!preview) return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [preview]);

  const openPreview = async (certificate) => {
    try {
      const response = await certificateAPI.getFile(certificate._id);
      if (preview?.url) URL.revokeObjectURL(preview.url);
      setPreview({ certificate, url: URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' })) });
    } catch (err) { onError?.(err.response?.data?.message || 'Unable to preview certificate'); }
  };

  const download = async (certificate) => {
    try {
      const response = await certificateAPI.getFile(certificate._id, true);
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = certificate.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) { onError?.(err.response?.data?.message || 'Unable to download certificate'); }
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-secondary"><FiAward /></div>
        <div><h2 className="text-xl font-black">Certificates</h2><p className="text-sm text-slate-500">Preview and download certificates issued to you.</p></div>
      </div>
      {loading ? <p className="py-6 text-sm font-bold text-slate-500">Loading certificates...</p> : certificates.length === 0 ? (
        <div className="py-8 text-center"><FiAward className="mx-auto text-slate-400" size={32} /><p className="mt-3 font-black">No certificates issued yet</p></div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {certificates.map(certificate => (
            <article key={certificate._id} className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-xs font-black uppercase text-secondary">Issued {new Date(certificate.issuedAt).toLocaleDateString('en-IN')}</p>
              <h3 className="mt-2 font-black text-slate-950">{certificate.title}</h3>
              <div className="mt-4 grid grid-cols-2 gap-2"><button onClick={() => openPreview(certificate)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-black text-secondary"><FiEye /> Preview</button><button onClick={() => download(certificate)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-black text-white"><FiDownload /> Download</button></div>
            </article>
          ))}
        </div>
      )}
      {preview && createPortal(
        <div className="certificate-preview-backdrop fixed inset-0 z-[2147483000] flex items-center justify-center p-3 sm:p-6">
          <div role="dialog" aria-modal="true" aria-label={`Preview ${preview.certificate.title}`} className="certificate-preview-dialog flex w-full max-w-6xl flex-col overflow-hidden rounded-lg shadow-2xl">
            <div className="certificate-preview-header flex items-center justify-between gap-3 border-b border-slate-200 px-3 py-2 sm:px-4 sm:py-3">
              <p className="min-w-0 truncate text-sm font-black text-slate-950 sm:text-base">{preview.certificate.title}</p>
              <button onClick={() => { URL.revokeObjectURL(preview.url); setPreview(null); }} className="certificate-preview-close flex h-10 w-10 flex-none items-center justify-center rounded-lg" title="Close" aria-label="Close certificate preview"><FiX /></button>
            </div>
            <iframe title="Certificate preview" src={preview.url} className="certificate-preview-frame" />
          </div>
        </div>,
        document.body
      )}
    </section>
  );
};
