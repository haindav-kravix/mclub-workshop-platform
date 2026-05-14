import React from 'react';
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from 'react-icons/fi';

export const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
};

export const ErrorMessage = ({ message, onDismiss }) => {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-white p-4 shadow-lg shadow-rose-100/60">
      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-rose-100 text-rose-700">
        <FiAlertCircle size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-bold text-rose-900">Something needs attention</h3>
        <p className="mt-1 text-sm text-rose-700">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100"
          aria-label="Dismiss message"
        >
          <FiX />
        </button>
      )}
    </div>
  );
};

export const SuccessMessage = ({ message, onDismiss }) => {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-lg shadow-emerald-100/60">
      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <FiCheckCircle size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-bold text-emerald-900">Done</h3>
        <p className="mt-1 text-sm text-emerald-700">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          aria-label="Dismiss message"
        >
          <FiX />
        </button>
      )}
    </div>
  );
};

export const FeedbackPopup = ({
  open,
  type = 'info',
  title,
  message,
  onClose
}) => {
  if (!open) return null;

  const styles = {
    success: {
      icon: FiCheckCircle,
      ring: 'border-emerald-200',
      iconWrap: 'bg-emerald-100 text-emerald-700',
      title: 'text-emerald-950',
      button: 'bg-emerald-600 hover:bg-emerald-700 text-white'
    },
    warning: {
      icon: FiAlertCircle,
      ring: 'border-amber-200',
      iconWrap: 'bg-amber-100 text-amber-700',
      title: 'text-amber-950',
      button: 'bg-amber-600 hover:bg-amber-700 text-white'
    },
    error: {
      icon: FiAlertCircle,
      ring: 'border-rose-200',
      iconWrap: 'bg-rose-100 text-rose-700',
      title: 'text-rose-950',
      button: 'bg-rose-600 hover:bg-rose-700 text-white'
    },
    info: {
      icon: FiInfo,
      ring: 'border-sky-200',
      iconWrap: 'bg-sky-100 text-sky-700',
      title: 'text-sky-950',
      button: 'bg-slate-950 hover:bg-slate-800 text-white'
    }
  }[type] || {};

  const Icon = styles.icon || FiInfo;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm">
      <div className={`w-full max-w-sm rounded-3xl border ${styles.ring} bg-white p-6 text-center shadow-2xl`}>
        <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${styles.iconWrap}`}>
          <Icon size={38} />
        </div>
        <h2 className={`text-2xl font-black ${styles.title}`}>{title}</h2>
        {message && <p className="mt-3 text-base leading-7 text-slate-600">{message}</p>}
        <button
          type="button"
          onClick={onClose}
          className={`mt-6 w-full rounded-2xl px-5 py-3 font-bold ${styles.button}`}
        >
          OK
        </button>
      </div>
    </div>
  );
};
