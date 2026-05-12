import React from 'react';
import { FiCalendar, FiClock, FiDownload, FiEdit2, FiMail, FiMapPin, FiTrash2, FiUsers } from 'react-icons/fi';
import { API_ORIGIN } from '../utils/api';

export const AdminWorkshopCard = ({
  workshop,
  onEdit,
  onDelete,
  onViewRegistrations,
  onExport,
  onEmail,
  onToggleRegistrations,
  onToggleStopped
}) => {
  const registrationsOpen = workshop.registrationsOpen !== false && !workshop.isStopped;

  return (
    <div className="panel rounded-lg overflow-hidden transition hover:-translate-y-1 hover:shadow-xl">
      {/* Image */}
      <div className="h-44 sm:h-48 overflow-hidden bg-slate-100 relative">
        {workshop.coverImage ? (
          <img
            src={`${API_ORIGIN}${workshop.coverImage}`}
            alt={workshop.title}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl font-bold">
            {workshop.title.charAt(0)}
          </div>
        )}
        <div className="absolute top-3 right-3 bg-slate-950/90 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow">
          {workshop.registrationCount || 0} Registrations
        </div>
        <div className={`absolute left-3 top-3 px-3 py-1 rounded-lg text-xs font-semibold ${
          workshop.isStopped ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
        }`}>
          {workshop.isStopped ? 'Stopped' : 'Running'}
        </div>
        <div className={`absolute left-3 bottom-3 px-3 py-1 rounded-lg text-xs font-semibold ${
          registrationsOpen ? 'bg-sky-500 text-white' : 'bg-amber-500 text-white'
        }`}>
          Registrations {registrationsOpen ? 'Open' : 'Closed'}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-xl mb-2 break-words text-slate-950">{workshop.title}</h3>
        <p className="text-slate-600 text-sm mb-4 line-clamp-2">{workshop.description}</p>

        <div className="text-sm text-slate-600 mb-5 grid gap-2">
          <p className="flex items-center gap-2"><FiCalendar className="text-primary" /> {new Date(workshop.date).toLocaleDateString()} at {workshop.time}</p>
          <p className="flex items-center gap-2"><FiMapPin className="text-primary" /> {workshop.venue}</p>
          <p className="flex items-center gap-2"><FiClock className="text-primary" /> {workshop.duration}</p>
          {workshop.capacity && <p className="flex items-center gap-2"><FiUsers className="text-primary" /> Capacity: {workshop.capacity}</p>}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onViewRegistrations(workshop._id)}
            className="col-span-2 px-3 py-2.5 bg-slate-950 text-white rounded-lg hover:bg-slate-800 transition text-sm font-semibold flex items-center justify-center space-x-2"
          >
            <FiUsers size={16} />
            <span>Registrations</span>
          </button>

          <button
            onClick={() => onEdit(workshop)}
            className="px-3 py-2 bg-indigo-50 text-primary rounded-lg hover:bg-indigo-100 transition text-sm font-semibold flex items-center justify-center space-x-1"
          >
            <FiEdit2 size={16} />
            <span>Edit</span>
          </button>

          <button
            onClick={() => onExport(workshop._id)}
            className="px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition text-sm font-semibold flex items-center justify-center space-x-1"
          >
            <FiDownload size={16} />
            <span>Export</span>
          </button>

          {workshop.isActive && (
            <button
              onClick={() => onEmail(workshop)}
              className="col-span-2 px-3 py-2 bg-sky-50 text-sky-700 rounded-lg hover:bg-sky-100 transition text-sm font-semibold flex items-center justify-center space-x-1"
            >
              <FiMail size={16} />
              <span>Send Emails</span>
            </button>
          )}

          <button
            onClick={() => onToggleRegistrations(workshop._id)}
            disabled={workshop.isStopped}
            className="px-3 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {registrationsOpen ? 'Close Reg.' : 'Open Reg.'}
          </button>

          <button
            onClick={() => onToggleStopped(workshop._id)}
            className="px-3 py-2 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition text-sm font-semibold"
          >
            {workshop.isStopped ? 'Resume' : 'Stop'}
          </button>

          <button
            onClick={() => onDelete(workshop._id)}
            className="col-span-2 px-3 py-2 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 transition text-sm font-semibold flex items-center justify-center space-x-1"
          >
            <FiTrash2 size={16} />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
