import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMenu, FiX, FiLogOut, FiHome, FiCalendar, FiClipboard, FiSettings, FiEdit3 } from 'react-icons/fi';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) => `flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
    isActive(path) ? 'bg-indigo-50 text-primary' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
  }`;

  const mobileLinkClass = (path) => `block px-4 py-3 rounded-lg font-semibold transition ${
    isActive(path) ? 'bg-indigo-50 text-primary' : 'text-slate-700 hover:bg-slate-100'
  }`;

  return (
    <nav className="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-secondary rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
              MC
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-lg leading-none text-slate-950">MongoDB Club</span>
              <p className="text-xs text-slate-500 -mt-0.5">Workshop Hub</p>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-2">
            <Link
              to="/"
              className={navLinkClass('/')}
            >
              <FiHome /> <span>Home</span>
            </Link>
            <Link
              to="/workshops"
              className={navLinkClass('/workshops')}
            >
              <FiCalendar /> <span>Workshops</span>
            </Link>
            {isAuthenticated && (
              <Link
                to="/blogs"
                className={navLinkClass('/blogs')}
              >
                <FiEdit3 /> <span>Blogs</span>
              </Link>
            )}

            {isAuthenticated && !isAdmin && (
              <Link
                to="/my-registrations"
                className={navLinkClass('/my-registrations')}
              >
                <FiClipboard /> <span>My Events</span>
              </Link>
            )}

            {isAuthenticated && isAdmin && (
              <Link
                to="/admin"
                className={navLinkClass('/admin')}
              >
                <FiSettings /> <span>Admin</span>
              </Link>
            )}

            {isAuthenticated ? (
              <div className="flex items-center space-x-3 pl-3 ml-2 border-l border-slate-200">
                <div className="flex items-center space-x-2 rounded-lg bg-slate-50 px-2 py-1">
                  {user?.profilePhoto && (
                    <img src={user.profilePhoto} alt="Profile" className="w-8 h-8 rounded-full" />
                  )}
                  <span className="text-sm font-semibold text-slate-700 max-w-[140px] truncate">{user?.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition text-sm font-semibold"
                >
                  <FiLogOut /> <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition font-semibold"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden rounded-lg border border-slate-200 p-2 text-slate-700"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2 border-t border-slate-100 pt-3">
            <Link
              to="/"
              className={mobileLinkClass('/')}
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/workshops"
              className={mobileLinkClass('/workshops')}
              onClick={() => setIsOpen(false)}
            >
              Workshops
            </Link>
            {isAuthenticated && (
              <Link
                to="/blogs"
                className={mobileLinkClass('/blogs')}
                onClick={() => setIsOpen(false)}
              >
                Blogs
              </Link>
            )}
            {isAuthenticated && !isAdmin && (
              <Link
                to="/my-registrations"
                className={mobileLinkClass('/my-registrations')}
                onClick={() => setIsOpen(false)}
              >
                My Events
              </Link>
            )}
            {isAuthenticated && isAdmin && (
              <Link
                to="/admin"
                className={mobileLinkClass('/admin')}
                onClick={() => setIsOpen(false)}
              >
                Admin Dashboard
              </Link>
            )}
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition font-semibold"
              >
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                className="block px-4 py-3 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition text-center font-semibold"
                onClick={() => setIsOpen(false)}
              >
                Login
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
