import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { ErrorMessage, LoadingSpinner } from '../components/UI';
import { registrationAPI, resolveMediaUrl, workshopAPI } from '../utils/api';

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
        const [workshopResponse, registrationsResponse] = await Promise.all([
          workshopAPI.getWorkshopById(workshopId),
          registrationAPI.getWorkshopRegistrations(workshopId)
        ]);
        setWorkshop(workshopResponse.data);
        const found = registrationsResponse.data.find(item => item._id === registrationId);
        if (!found) {
          setError('Image not found');
        } else {
          setRegistration(found);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load image');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [registrationId, workshopId]);

  if (loading) return <LoadingSpinner />;

  const imageField = (workshop?.registrationFormFields || []).find(field => field.fieldId === imageKey);
  const isPaymentScreenshot = imageKey === 'paymentScreenshot';
  const imageTitle = isPaymentScreenshot ? 'Payment screenshot' : (imageField?.label || 'Uploaded image');
  const imageValue = isPaymentScreenshot ? registration?.paymentScreenshot : registration?.formData?.[imageKey];
  const screenshot = imageValue ? resolveMediaUrl(imageValue) : '';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-emerald-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-5">
          <button
            onClick={() => navigate(`/admin/registrations/${workshopId}`)}
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

        {!error && screenshot ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:p-6">
            <div className="mb-4 rounded-lg bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">{registration?.userId?.email}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                Status: {registration?.status || 'pending'}
              </p>
            </div>
            <img
              src={screenshot}
              alt={`${registration?.userId?.name || 'Student'} ${imageTitle}`}
              className="mx-auto max-h-[75vh] w-full rounded-xl border border-slate-100 object-contain"
            />
          </div>
        ) : !error ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center font-black text-slate-600">
            No image uploaded.
          </div>
        ) : null}
      </div>
    </div>
  );
};
