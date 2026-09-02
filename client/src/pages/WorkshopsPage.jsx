import React, { useState, useEffect } from 'react';
import { registrationAPI, workshopAPI } from '../utils/api';
import { LoadingSpinner, ErrorMessage } from '../components/UI';
import { WorkshopGrid } from '../components/WorkshopCard';
import { useNavigate } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export const WorkshopsPage = () => {
  const [workshops, setWorkshops] = useState([]);
  const [filteredWorkshops, setFilteredWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchWorkshops = async () => {
      try {
        const [workshopsResponse, registrationIdsResponse] = await Promise.all([
          workshopAPI.getAllWorkshops(),
          isAuthenticated ? registrationAPI.getUserRegisteredWorkshopIds() : Promise.resolve({ data: { workshopIds: [] } })
        ]);
        const registeredIds = new Set(registrationIdsResponse.data?.workshopIds || []);
        const decoratedWorkshops = workshopsResponse.data.map(workshop => ({
          ...workshop,
          isRegistered: registeredIds.has(workshop._id)
        }));
        setWorkshops(decoratedWorkshops);
        setFilteredWorkshops(decoratedWorkshops);
      } catch (err) {
        setError('Failed to load workshops');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkshops();
  }, [isAuthenticated]);

  useEffect(() => {
    const filtered = workshops.filter(workshop =>
      workshop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workshop.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workshop.venue.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredWorkshops(filtered);
  }, [searchTerm, workshops]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-10 sm:py-12">
        {/* Header */}
        <div className="mb-10 panel rounded-lg p-5 sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-6">
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-wide mb-2">MongoDB Club Events</p>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Upcoming Events</h1>
              <p className="text-gray-600 text-base sm:text-lg mt-3">
                Explore live workshops, internship registrations, and technical sessions.
              </p>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-bold text-gray-900">{filteredWorkshops.length}</span> visible
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <FiSearch className="absolute left-4 top-3 text-gray-400 text-xl" />
            <input
              type="text"
              placeholder="Search events by title, description, or venue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus-ring bg-white"
            />
          </div>
        </div>

        {error && <ErrorMessage message={error} />}

        {/* Events Grid */}
        {filteredWorkshops.length > 0 ? (
          <WorkshopGrid
            workshops={filteredWorkshops}
            onWorkshopClick={(workshop) => navigate(`/workshop/${workshop._id}`)}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              {searchTerm ? 'No events found matching your search' : 'No events available'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
