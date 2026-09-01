import React from 'react';
import { FiAward, FiBarChart2, FiCalendar, FiCheckSquare, FiClock, FiDownload, FiEdit2, FiFileText, FiList, FiLogIn, FiMail, FiMapPin, FiTrash2, FiUsers } from 'react-icons/fi';
import { resolveMediaUrl } from '../utils/api';
import { formatWorkshopTime } from '../utils/formatters';
import { getEventLabel } from '../utils/eventLabels';

export const AdminWorkshopCard = ({
  workshop,
  onEdit,
  onDelete,
  onViewRegistrations,
  onExport,
  onReport,
  onEmail,
  onToggleRegistrations,
  onToggleStopped,
  onTakeAttendance,
  onAttendanceReports,
  onEntryManagement,
  onCertificates,
  onHackathonEvaluation,
  showEmail = true
}) => {
  const registrationsOpen = workshop.registrationsOpen !== false;
  const totalRegistrations = workshop.totalRegistrationCount ?? workshop.registrationStats?.total ?? workshop.registrationCount ?? 0;
  const confirmedRegistrations = workshop.confirmedRegistrationCount ?? workshop.registrationStats?.confirmed ?? workshop.registrationCount ?? 0;
  const rejectedRegistrations = workshop.rejectedRegistrationCount ?? workshop.registrationStats?.rejected ?? 0;
  const eventLabel = getEventLabel(workshop);

  return (
    <div className="panel rounded-lg overflow-hidden transition hover:-translate-y-1 hover:shadow-xl">
      {/* Image */}
      <div className="h-44 sm:h-48 overflow-hidden bg-slate-100 relative">
        {workshop.coverImage ? (
          <img
            src={workshop.coverImagePreview || resolveMediaUrl(workshop.coverImage, { w: 720 })}
            alt={workshop.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = '/brand/klh-head-banner.png';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl font-bold">
            {workshop.title.charAt(0)}
          </div>
        )}
        <div className="absolute top-3 right-3 bg-slate-950/90 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow">
          {totalRegistrations} Registrations
        </div>
        <div className={`absolute left-3 top-3 px-3 py-1 rounded-lg text-xs font-semibold ${
          workshop.isStopped ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
        }`}>
          {workshop.isStopped ? 'Stopped' : 'Running'} {eventLabel}
        </div>
        <div className={`absolute left-3 bottom-3 px-3 py-1 rounded-lg text-xs font-semibold ${
          registrationsOpen ? 'bg-secondary text-white' : 'bg-amber-500 text-white'
        }`}>
          Registrations {registrationsOpen ? 'Open' : 'Closed'}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-xl mb-2 break-words text-slate-950">{workshop.title}</h3>
        <p className="text-slate-600 text-sm mb-4 line-clamp-2">{workshop.description}</p>

        <div className="mb-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg border border-slate-200 bg-white p-2">
            <p className="text-lg font-black text-slate-950">{totalRegistrations}</p>
            <p className="text-[11px] font-bold text-slate-500">Total</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2">
            <p className="text-lg font-black text-emerald-700">{confirmedRegistrations}</p>
            <p className="text-[11px] font-bold text-emerald-700">Confirmed</p>
          </div>
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-2">
            <p className="text-lg font-black text-rose-700">{rejectedRegistrations}</p>
            <p className="text-[11px] font-bold text-rose-700">Rejected</p>
          </div>
        </div>

        <div className="text-sm text-slate-600 mb-5 grid gap-2">
          <p className="flex items-center gap-2">
            <FiCalendar className="text-primary" />
            {new Date(workshop.date).toLocaleDateString()}{formatWorkshopTime(workshop) ? ` at ${formatWorkshopTime(workshop)}` : ''}
          </p>
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
            onClick={() => onTakeAttendance(workshop._id)}
            className="px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition text-sm font-semibold flex items-center justify-center space-x-1"
          >
            <FiCheckSquare size={16} />
            <span>Attendance</span>
          </button>

          <button
            onClick={() => onAttendanceReports(workshop._id)}
            className="px-3 py-2 bg-zinc-100 text-zinc-800 rounded-lg hover:bg-zinc-200 transition text-sm font-semibold flex items-center justify-center space-x-1"
          >
            <FiList size={16} />
            <span>Attendance Report</span>
          </button>

          {workshop.entryPassEnabled !== false && (
            <button
              onClick={() => onEntryManagement(workshop._id)}
              className="col-span-2 px-3 py-2 bg-slate-950 text-white rounded-lg hover:bg-slate-800 transition text-sm font-semibold flex items-center justify-center space-x-1"
            >
              <FiLogIn size={16} />
              <span>Entry Management</span>
            </button>
          )}

          {workshop.eventType === 'hackathon' && (
            <button
              onClick={() => onHackathonEvaluation(workshop._id)}
              className="col-span-2 px-3 py-2 bg-violet-50 text-violet-700 rounded-lg hover:bg-violet-100 transition text-sm font-semibold flex items-center justify-center space-x-1"
            >
              <FiBarChart2 size={16} />
              <span>Evaluation & Leaderboard</span>
            </button>
          )}

          <button
            onClick={() => onEdit(workshop)}
            className="px-3 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition text-sm font-semibold flex items-center justify-center space-x-1"
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

          <button
            onClick={() => onReport(workshop._id)}
            className="col-span-2 px-3 py-2 bg-primary text-slate-950 rounded-lg hover:bg-primary/80 transition text-sm font-semibold flex items-center justify-center space-x-1"
          >
            <FiFileText size={16} />
            <span>Generate Report</span>
          </button>

          <button
            onClick={() => onCertificates(workshop._id)}
            className="col-span-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition text-sm font-semibold flex items-center justify-center space-x-1"
          >
            <FiAward size={16} />
            <span>Certificates</span>
          </button>

          {showEmail && workshop.isActive && (
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
            className="px-3 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition text-sm font-semibold"
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
