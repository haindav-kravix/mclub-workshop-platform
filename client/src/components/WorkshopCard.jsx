import React, { useState, useEffect } from 'react';
import { workshopAPI, resolveMediaUrl } from '../utils/api';
import { LoadingSpinner, ErrorMessage } from './UI';
import { FiCalendar, FiMapPin, FiClock } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { formatWorkshopTime } from '../utils/formatters';
import { getEventLabel } from '../utils/eventLabels';

export const WorkshopCard = ({ workshop, onClick }) => {
  const isRegistered = Boolean(workshop.isRegistered);
  const registrationsOpen = workshop.registrationsOpen !== false && !workshop.isStopped;
  const eventLabel = getEventLabel(workshop);

  return (
    <div
      className={`panel rounded-lg overflow-hidden transition group ${
        isRegistered || !registrationsOpen ? 'cursor-default' : 'cursor-pointer hover:shadow-xl hover:-translate-y-1'
      }`}
      onClick={() => !isRegistered && registrationsOpen && onClick?.()}
    >
      {/* Image */}
      <div className="h-48 overflow-hidden bg-slate-100 relative">
        {workshop.coverImage ? (
          <img
            src={workshop.coverImagePreview || resolveMediaUrl(workshop.coverImage, { w: 760 })}
            alt={workshop.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain group-hover:scale-105 transition"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = '/brand/klh-head-banner.png';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-4xl font-bold">
            {workshop.title.charAt(0)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-xl text-slate-950 mb-2 line-clamp-2">{workshop.title}</h3>
        <div className={`inline-flex mb-3 rounded-lg px-3 py-1 text-xs font-bold ${
          registrationsOpen ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
        }`}>
          {eventLabel} Registrations {registrationsOpen ? 'Open' : 'Closed'}
        </div>
        <p className="text-slate-600 text-sm mb-4 line-clamp-2">{workshop.description}</p>

        {/* Details */}
        <div className="space-y-2 mb-5 text-sm text-slate-600">
          <div className="flex items-center space-x-2">
            <FiCalendar size={16} />
            <span>
              {new Date(workshop.startDate || workshop.date).toLocaleDateString()}
              {workshop.endDate && workshop.endDate !== (workshop.startDate || workshop.date) ? ` - ${new Date(workshop.endDate).toLocaleDateString()}` : ''}
            </span>
          </div>
          {formatWorkshopTime(workshop) && (
            <div className="flex items-center space-x-2">
              <FiClock size={16} />
              <span>{formatWorkshopTime(workshop)}</span>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <FiMapPin size={16} />
            <span>{workshop.venue}</span>
          </div>
        </div>

        <button
          type="button"
          disabled={isRegistered || !registrationsOpen}
          className={`w-full py-2.5 rounded-lg transition font-semibold ${
            isRegistered
              ? 'bg-emerald-50 text-emerald-700 cursor-default'
              : !registrationsOpen
              ? 'bg-amber-50 text-amber-700 cursor-default'
              : 'bg-slate-950 text-white hover:bg-slate-800'
          }`}
        >
          {isRegistered ? 'Registered' : registrationsOpen ? 'View Details' : 'Registrations Closed'}
        </button>
      </div>
    </div>
  );
};

export const WorkshopGrid = ({ workshops, onWorkshopClick }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {workshops.map((workshop) => (
        <div key={workshop._id}>
          <WorkshopCard workshop={workshop} onClick={() => onWorkshopClick(workshop)} />
        </div>
      ))}
    </div>
  );
};
