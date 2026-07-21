import React, { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';

const getOptionLabel = (index) => {
  let label = '';
  let number = index;
  do {
    label = String.fromCharCode(65 + (number % 26)) + label;
    number = Math.floor(number / 26) - 1;
  } while (number >= 0);
  return label;
};

export const RegistrationForm = ({ workshop, onClose, onSubmit, variant = 'modal' }) => {
  const [formData, setFormData] = useState({});
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [imageFiles, setImageFiles] = useState({});
  const [documentFiles, setDocumentFiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isModal = variant === 'modal';
  const requiresPaymentScreenshot = Boolean(workshop.paymentEnabled !== false && workshop.qrImage);

  useEffect(() => {
    if (!isModal) return undefined;

    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollY = window.scrollY;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      document.body.style.paddingRight = originalPaddingRight;
      window.scrollTo(0, scrollY);
    };
  }, [isModal]);

  useEffect(() => {
    setFormData({});
  }, [workshop?._id]);

  const handleChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (requiresPaymentScreenshot && !paymentScreenshot) {
      setError('Please upload your payment screenshot');
      setLoading(false);
      return;
    }

    const missingRequiredImageField = (workshop.registrationFormFields || []).find(field =>
      field.type === 'image' && field.required && !imageFiles[field.fieldId]
    );
    if (missingRequiredImageField) {
      setError(`Please upload ${missingRequiredImageField.label}`);
      setLoading(false);
      return;
    }

    const missingRequiredFileField = (workshop.registrationFormFields || []).find(field =>
      field.type === 'file' && field.required && !documentFiles[field.fieldId]
    );
    if (missingRequiredFileField) {
      setError(`Please upload ${missingRequiredFileField.label}`);
      setLoading(false);
      return;
    }

    try {
      await onSubmit(formData, paymentScreenshot, imageFiles, documentFiles);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <>
      {/* Header */}
      <div className="flex flex-none justify-between items-center p-4 sm:p-6 border-b bg-white">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-emerald-600">Workshop Registration</p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-950">{workshop.title}</h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX size={24} />
          </button>
        )}
      </div>

      {/* Body */}
      <form onSubmit={handleSubmit} className={`${isModal ? 'flex-1 overflow-y-auto overscroll-contain' : ''} p-4 sm:p-6 space-y-4`}>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        {workshop.registrationFormFields && workshop.registrationFormFields.length > 0 ? (
          workshop.registrationFormFields
            .sort((a, b) => a.order - b.order)
            .map(field => (
              <div key={field.fieldId} className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </label>

                {field.type === 'text' && (
                  <input
                    type="text"
                    required={field.required}
                    value={formData[field.fieldId] || ''}
                    onChange={(e) => handleChange(field.fieldId, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={field.label}
                  />
                )}

                {field.type === 'email' && (
                  <input
                    type="email"
                    required={field.required}
                    value={formData[field.fieldId] || ''}
                    onChange={(e) => handleChange(field.fieldId, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={field.label}
                  />
                )}

                {field.type === 'phone' && (
                  <input
                    type="tel"
                    required={field.required}
                    value={formData[field.fieldId] || ''}
                    onChange={(e) => handleChange(field.fieldId, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={field.label}
                  />
                )}

                {(field.type === 'textarea' || field.type === 'question-text') && (
                  <textarea
                    required={field.required}
                    value={formData[field.fieldId] || ''}
                    onChange={(e) => handleChange(field.fieldId, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={field.label}
                    rows="4"
                  />
                )}

                {field.type === 'image' && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.gif,.webp,.avif,.heic,.heif,image/*"
                      required={field.required}
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null;
                        setImageFiles(prev => ({
                          ...prev,
                          [field.fieldId]: file
                        }));
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {imageFiles[field.fieldId] && (
                      <p className="mt-2 text-xs font-bold text-emerald-700">
                        Selected: {imageFiles[field.fieldId].name}
                      </p>
                    )}
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      Upload JPG, PNG, GIF, WebP, AVIF, HEIC, or HEIF.
                    </p>
                  </div>
                )}

                {field.type === 'file' && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                      required={field.required}
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null;
                        setDocumentFiles(prev => ({
                          ...prev,
                          [field.fieldId]: file
                        }));
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {documentFiles[field.fieldId] && (
                      <p className="mt-2 break-words text-xs font-bold text-emerald-700">
                        Selected: {documentFiles[field.fieldId].name}
                      </p>
                    )}
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      Upload PDF, Word, PowerPoint, Excel, or text files up to 10MB.
                    </p>
                  </div>
                )}

                {field.type === 'select' && (
                  <select
                    required={field.required}
                    value={formData[field.fieldId] || ''}
                    onChange={(e) => handleChange(field.fieldId, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">{field.label}</option>
                    {field.options.map((option, idx) => (
                      <option key={idx} value={option}>{option}</option>
                    ))}
                  </select>
                )}

                {field.type === 'radio' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {field.options.map((option, idx) => {
                      const letter = getOptionLabel(idx);
                      const selected = formData[field.fieldId] === option;
                      return (
                        <label
                          key={idx}
                          className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition ${
                            selected
                              ? 'border-secondary bg-emerald-50 text-slate-950'
                              : 'border-gray-200 bg-white hover:border-secondary/60'
                          }`}
                        >
                          <input
                            type="radio"
                            name={field.fieldId}
                            value={option}
                            checked={selected}
                            onChange={(e) => handleChange(field.fieldId, e.target.value)}
                            required={field.required}
                            className="sr-only"
                          />
                          <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-md text-sm font-bold ${
                            selected ? 'bg-secondary text-white' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {letter}
                          </span>
                          <span className="text-gray-800">{option}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {field.type === 'question-mcq' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {field.options.map((option, idx) => {
                      const letter = getOptionLabel(idx);
                      const selected = formData[field.fieldId] === option;
                      return (
                        <label
                          key={idx}
                          className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition ${
                            selected
                              ? 'border-secondary bg-emerald-50 text-slate-950'
                              : 'border-gray-200 bg-white hover:border-secondary/60'
                          }`}
                        >
                          <input
                            type="radio"
                            name={field.fieldId}
                            value={option}
                            checked={selected}
                            onChange={(e) => handleChange(field.fieldId, e.target.value)}
                            required={field.required}
                            className="sr-only"
                          />
                          <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-md text-sm font-bold ${
                            selected ? 'bg-secondary text-white' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {letter}
                          </span>
                          <span className="text-gray-800">{option}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {field.type === 'checkbox' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {field.options.map((option, idx) => {
                      const letter = getOptionLabel(idx);
                      const selectedOptions = (formData[field.fieldId] || '').split(',').filter(Boolean);
                      const selected = selectedOptions.includes(option);
                      return (
                        <label
                          key={idx}
                          className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition ${
                            selected
                              ? 'border-secondary bg-emerald-50 text-slate-950'
                              : 'border-gray-200 bg-white hover:border-secondary/60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            value={option}
                            checked={selected}
                            onChange={(e) => {
                              const nextSelected = selectedOptions.filter(value => value !== option);
                              if (e.target.checked) nextSelected.push(option);
                              handleChange(field.fieldId, nextSelected.join(','));
                            }}
                            className="sr-only"
                          />
                          <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-md text-sm font-bold ${
                            selected ? 'bg-secondary text-white' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {letter}
                          </span>
                          <span className="text-gray-800">{option}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
        ) : (
          <p className="text-gray-500 text-center py-8">No form fields configured for this workshop</p>
        )}

        {requiresPaymentScreenshot && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <label className="block text-sm font-black text-slate-800 mb-2">
              Upload Payment Screenshot <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.webp,.avif,.heic,.heif,image/*"
              required
              onChange={(event) => setPaymentScreenshot(event.target.files?.[0] || null)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {paymentScreenshot && (
              <p className="mt-2 text-xs font-bold text-emerald-700">
                Selected: {paymentScreenshot.name}
              </p>
            )}
            <p className="mt-2 text-xs font-semibold text-slate-500">
              Upload the screenshot after completing payment through the QR shown above.
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Submit Registration'}
          </button>
        </div>
      </form>
    </>
  );

  if (!isModal) {
    return (
      <div className="overflow-hidden rounded-2xl bg-white shadow-xl border border-emerald-100">
        {formContent}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex h-[100dvh] items-center justify-center overflow-hidden bg-black/55 p-3 sm:p-4">
      <div className="flex w-full max-w-2xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {formContent}
      </div>
    </div>
  );
};
