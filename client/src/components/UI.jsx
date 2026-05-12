import React from 'react';

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
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex justify-between items-start">
      <div>
        <h3 className="text-red-800 font-semibold">Error</h3>
        <p className="text-red-700 text-sm">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-600 hover:text-red-800"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export const SuccessMessage = ({ message, onDismiss }) => {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex justify-between items-start">
      <div>
        <h3 className="text-green-800 font-semibold">Success</h3>
        <p className="text-green-700 text-sm">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-green-600 hover:text-green-800"
        >
          ✕
        </button>
      )}
    </div>
  );
};
