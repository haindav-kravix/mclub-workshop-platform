import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMenu, FiX, FiHome, FiCalendar, FiClipboard, FiSettings, FiEdit3, FiUser } from 'react-icons/fi';
import { resolveMediaUrl } from '../utils/api';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, isAdmin, user } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) => `flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
    isActive(path) ? 'bg-primary/15 text-secondary' : 'text-slate-600 hover:bg-primary/10 hover:text-secondary'
  }`;

  const mobileLinkClass = (path) => `block px-4 py-3 rounded-lg font-semibold transition ${
    isActive(path) ? 'bg-primary/15 text-secondary' : 'text-slate-700 hover:bg-primary/10'
  }`;

  return (
    <nav className="bg-white/95 backdrop-blur border-b border-slate-200 z-50">
      <div className="max-w-[1680px] mx-auto px-3 sm:px-6">
        <div className="flex justify-between items-center min-h-16 sm:min-h-20 py-2 gap-2 sm:gap-4">
          {/* Logo */}
          <Link to="/" className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4 lg:flex-none lg:gap-5 lg:w-[610px] xl:w-[670px] 2xl:w-[720px]">
            <img
              src="/brand/klh-head-banner.png"
              alt="KLH University"
              className="h-7 w-[128px] min-[380px]:w-[150px] sm:h-8 sm:w-[235px] lg:h-10 lg:w-[320px] xl:h-11 xl:w-[360px] object-contain flex-none"
            />
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 lg:flex-none">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-secondary text-white flex items-center justify-center font-bold shadow-sm flex-none">
                MC
              </div>
              <div className="min-w-0 max-w-[96px] min-[380px]:max-w-[116px] sm:max-w-[150px] lg:w-[150px]">
                <span className="block truncate font-bold text-sm sm:text-base lg:text-lg leading-tight text-slate-950">MongoDB Club</span>
                <p className="hidden min-[380px]:block truncate text-[11px] lg:text-xs text-slate-500 leading-tight">Workshop Hub</p>
              </div>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-2 flex-none">
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
                to="/profile"
                className={navLinkClass('/profile')}
              >
                <FiUser /> <span>Profile</span>
              </Link>
            )}

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
                <Link to="/profile" className="flex items-center space-x-2 rounded-lg bg-slate-50 px-2 py-1 transition hover:bg-primary/10">
                  {user?.profilePhoto && (
                    <img src={resolveMediaUrl(user.profilePhoto)} alt="Profile" className="w-8 h-8 rounded-full" />
                  )}
                  <span className="text-sm font-semibold text-slate-700 max-w-[140px] truncate">{user?.name}</span>
                </Link>
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
            className="lg:hidden flex-none rounded-lg border border-slate-200 p-2 text-slate-700"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden pb-4 space-y-2 border-t border-slate-100 pt-3">
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
                to="/profile"
                className={mobileLinkClass('/profile')}
                onClick={() => setIsOpen(false)}
              >
                Profile
              </Link>
            )}
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
            {!isAuthenticated && (
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
