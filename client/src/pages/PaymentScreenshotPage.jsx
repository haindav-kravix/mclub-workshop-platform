import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiDownload, FiFileText } from 'react-icons/fi';
import { ErrorMessage, LoadingSpinner } from '../components/UI';
import { registrationAPI, resolveMediaUrl } from '../utils/api';

export const PaymentScreenshotPage = () => {
  const { workshopId, registrationId, imageKey = 'paymentScreenshot' } = useParams();
  const navigate = useNavigate();
  const [workshop, setWorkshop] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await registrationAPI.getRegistrationUpload(workshopId, registrationId, imageKey);
        setWorkshop(response.data.workshop);
        setRegistration({
          ...response.data.registration,
          paymentScreenshot: imageKey === 'paymentScreenshot' ? response.data.value : '',
          formData: imageKey === 'paymentScreenshot' ? {} : { [imageKey]: response.data.value }
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load image');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [registrationId, workshopId]);

  if (loading) return <LoadingSpinner />;

  const parseUploadedFile = (value) => {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value);
      return parsed?.dataUrl ? parsed : null;
    } catch {
      return null;
    }
  };

  const imageField = (workshop?.registrationFormFields || []).find(field => field.fieldId === imageKey);
  const isPaymentScreenshot = imageKey === 'paymentScreenshot';
  const isFileUpload = imageField?.type === 'file';
  const imageTitle = isPaymentScreenshot ? 'Payment screenshot' : (imageField?.label || (isFileUpload ? 'Uploaded file' : 'Uploaded image'));
  const rawValue = isPaymentScreenshot ? registration?.paymentScreenshot : registration?.formData?.[imageKey];
  const uploadedFile = isFileUpload ? parseUploadedFile(rawValue) : null;
  const mediaUrl = uploadedFile?.dataUrl ? uploadedFile.dataUrl : (rawValue ? resolveMediaUrl(rawValue) : '');
  const mimeType = uploadedFile?.mimeType || '';
  const isPreviewImage = !isFileUpload || mimeType.startsWith('image/');
  const isPdf = mimeType === 'application/pdf';
  const goBackToRegistrations = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(`/admin/registrations/${workshopId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-emerald-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-5">
          <button
            onClick={goBackToRegistrations}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-black text-secondary transition hover:bg-emerald-100"
          >
            <FiArrowLeft /> Back to Registrations
          </button>
          <p className="mt-5 text-xs font-black uppercase tracking-wide text-secondary">{imageTitle}</p>
          <h1 className="mt-2 break-words text-3xl font-black text-slate-950">{registration?.userId?.name || 'Student'}</h1>
          <p className="mt-1 break-words text-sm font-semibold text-slate-500">{workshop?.title}</p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}

        {!error && mediaUrl ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:p-6">
            <div className="mb-4 rounded-lg bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">{registration?.userId?.email}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                Status: {registration?.status || 'pending'}
              </p>
            </div>
            {isPreviewImage ? (
              <div className="flex max-h-[76vh] items-start justify-center overflow-auto rounded-xl border border-slate-100 bg-slate-50 p-2">
                <img
                  src={mediaUrl}
                  alt={`${registration?.userId?.name || 'Student'} ${imageTitle}`}
                  className="block h-auto max-h-[72vh] w-auto max-w-full object-contain"
                />
              </div>
            ) : isPdf ? (
              <iframe
                title={`${registration?.userId?.name || 'Student'} ${imageTitle}`}
                src={mediaUrl}
                className="h-[75vh] w-full rounded-xl border border-slate-100"
              />
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-emerald-50 text-secondary">
                  <FiFileText size={30} />
                </div>
                <p className="mt-4 break-words text-lg font-black text-slate-950">{uploadedFile?.name || imageTitle}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">Preview is not available for this file type.</p>
              </div>
            )}
            {isFileUpload && (
              <a
                href={mediaUrl}
                download={uploadedFile?.name || 'uploaded-file'}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
              >
                <FiDownload /> Download file
              </a>
            )}
          </div>
        ) : !error ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center font-black text-slate-600">
            No upload found.
          </div>
        ) : null}
      </div>
    </div>
  );
};
