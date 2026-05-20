import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { FormBuilder } from './FormBuilder';

const toDateInput = (value) => value ? value.split('T')[0] : '';

const addDaysToDateInput = (dateString, days) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
  const nextDay = String(date.getDate()).padStart(2, '0');
  return `${nextYear}-${nextMonth}-${nextDay}`;
};

const getDatesBetween = (startDate, endDate) => {
  if (!startDate) return [];
  const dates = [];
  const finalDate = endDate || startDate;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(finalDate) || finalDate < startDate) {
    return [];
  }

  for (let current = startDate; current <= finalDate; current = addDaysToDateInput(current, 1)) {
    dates.push(current);
  }
  return dates;
};

const buildInitialTimings = (initialData) => {
  if (initialData?.dailyTimings?.length) {
    return initialData.dailyTimings.map(item => ({
      date: toDateInput(item.date),
      startTime: item.startTime || initialData.time || '',
      endTime: item.endTime || ''
    }));
  }

  if (initialData?.date || initialData?.startDate) {
    return [{
      date: toDateInput(initialData.startDate || initialData.date),
      startTime: initialData.time || '',
      endTime: ''
    }];
  }

  return [];
};

export const CreateWorkshopModal = ({ onClose, onCreate, initialData = null, layout = 'modal' }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    startDate: toDateInput(initialData?.startDate || initialData?.date) || '',
    endDate: toDateInput(initialData?.endDate || initialData?.startDate || initialData?.date) || '',
    dailyTimings: buildInitialTimings(initialData),
    telegramLink: initialData?.telegramLink || '',
    venue: initialData?.venue || '',
    duration: initialData?.duration || '',
    capacity: initialData?.capacity || '',
    coverImage: null,
    qrImage: null,
    registrationFormFields: initialData?.registrationFormFields || []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = {
        ...prev,
        [name]: value
      };

      if (name === 'startDate' || name === 'endDate') {
        const dates = getDatesBetween(name === 'startDate' ? value : next.startDate, name === 'endDate' ? value : next.endDate);
        const existing = new Map(prev.dailyTimings.map(item => [item.date, item]));
        next.dailyTimings = dates.map(date => existing.get(date) || { date, startTime: '', endTime: '' });
      }

      return next;
    });
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      coverImage: e.target.files[0]
    }));
  };

  const handleQrFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      qrImage: e.target.files[0]
    }));
  };

  const handleFormFieldsChange = (fields) => {
    setFormData(prev => ({
      ...prev,
      registrationFormFields: fields
    }));
  };

  const handleTimingChange = (date, key, value) => {
    setFormData(prev => ({
      ...prev,
      dailyTimings: prev.dailyTimings.map(item =>
        item.date === date ? { ...item, [key]: value } : item
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.description || !formData.startDate || !formData.endDate || !formData.venue) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.dailyTimings.length === 0 || formData.dailyTimings.some(item => !item.startTime || !item.endTime)) {
      setError('Please add start and end timings for every workshop date');
      return;
    }

    if (!initialData && !formData.coverImage) {
      setError('Please upload a cover image');
      return;
    }

    setLoading(true);
    try {
      await onCreate(formData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <div className={layout === 'page' ? 'rounded-xl border border-slate-200 bg-white shadow-sm' : 'bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto'}>
        {/* Header */}
        <div className="flex justify-between items-center gap-3 p-5 sm:p-6 border-b sticky top-0 bg-white z-10">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-secondary">
              {initialData ? 'Edit workshop details' : 'New workshop setup'}
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
            {initialData ? 'Edit Workshop' : 'Create New Workshop'}
            </h2>
          </div>
          <button onClick={onClose} className="flex h-10 w-10 flex-none items-center justify-center rounded-lg border border-slate-200 text-gray-500 hover:text-gray-700">
            <FiX size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Workshop Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Workshop Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., MongoDB Aggregation Pipeline Mastery"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Describe your workshop in detail..."
              required
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date *</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">End Date *</label>
              <input
                type="date"
                name="endDate"
                min={formData.startDate}
                value={formData.endDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

          {/* Daily Timings */}
          {formData.dailyTimings.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Timings for all dates *</label>
              <div className="space-y-3">
                {formData.dailyTimings.map((timing) => (
                  <div key={timing.date} className="grid grid-cols-1 sm:grid-cols-[1fr_140px_140px] gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="font-semibold text-slate-800 flex items-center">
                      {new Date(`${timing.date}T00:00:00`).toLocaleDateString()}
                    </div>
                    <input
                      type="time"
                      value={timing.startTime}
                      onChange={(e) => handleTimingChange(timing.date, 'startTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                    <input
                      type="time"
                      value={timing.endTime}
                      onChange={(e) => handleTimingChange(timing.date, 'endTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Venue */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Venue *</label>
            <input
              type="text"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Room 101, Tech Building"
              required
            />
          </div>

          {/* Telegram Link */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Telegram Group Link *</label>
            <input
              type="url"
              name="telegramLink"
              value={formData.telegramLink}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://t.me/your_group"
              required
            />
          </div>

          {/* Duration & Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Duration *</label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., 2 hours"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Capacity (optional)</label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., 50"
              />
            </div>
          </div>

          {/* Cover Image */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Cover Image {!initialData && '*'}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required={!initialData}
            />
            <p className="text-xs text-gray-500 mt-1">Max 10MB. Supported formats: JPG, PNG, GIF, WebP</p>
          </div>

          {/* QR Image */}
          <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Display QR Image (optional)
            </label>
            {initialData?.qrImage && !formData.qrImage && (
              <div className="mb-3 flex flex-col gap-3 rounded-lg border border-emerald-100 bg-white p-3 sm:flex-row sm:items-center">
                <img
                  src={initialData.qrImage}
                  alt="Current workshop QR"
                  className="h-24 w-24 rounded-lg border border-slate-200 object-contain"
                />
                <p className="text-sm font-semibold text-slate-600">
                  Current QR is already visible on the workshop page. Upload a new image only if you want to replace it.
                </p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleQrFileChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-gray-500 mt-1">Upload a payment, entry, or information QR image to show on the workshop pages.</p>
          </div>

          {/* Form Builder */}
          <FormBuilder
            initialFields={formData.registrationFormFields}
            onFieldsChange={handleFormFieldsChange}
          />

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium disabled:opacity-50"
            >
              {loading ? (initialData ? 'Updating...' : 'Creating...') : initialData ? 'Update Workshop' : 'Create Workshop'}
            </button>
          </div>
        </form>
      </div>
  );

  if (layout === 'page') {
    return formContent;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      {formContent}
    </div>
  );
};
