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

  const navLinkClass = (path) => `flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${
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
          <Link to="/" className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-4 min-[1440px]:flex-none min-[1440px]:gap-4 min-[1440px]:w-[470px] 2xl:w-[600px]">
            <img
              src="/brand/klh-head-banner.png"
              alt="KLH University"
              className="h-7 w-[108px] min-[380px]:w-[138px] sm:h-8 sm:w-[235px] lg:h-10 lg:w-[300px] min-[1440px]:h-10 min-[1440px]:w-[320px] 2xl:h-11 2xl:w-[360px] object-contain flex-none"
            />
            <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-3 min-[1440px]:flex-none">
              <div className="w-8 h-8 min-[380px]:w-9 min-[380px]:h-9 sm:w-10 sm:h-10 rounded-lg bg-secondary text-white flex items-center justify-center font-bold shadow-sm flex-none text-sm sm:text-base">
                MC
              </div>
              <div className="min-w-0 max-w-[82px] min-[380px]:max-w-[112px] sm:max-w-[150px] min-[1440px]:w-[128px] 2xl:w-[150px]">
                <span className="block truncate font-bold text-xs min-[380px]:text-sm sm:text-base min-[1440px]:text-base 2xl:text-lg leading-tight text-slate-950">MongoDB Club</span>
                <p className="hidden min-[380px]:block truncate text-[11px] lg:text-xs text-slate-500 leading-tight">Events Hub</p>
              </div>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden min-[1440px]:flex items-center gap-1.5 flex-none">
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
              <FiCalendar /> <span>Events</span>
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
              <div className="flex min-w-0 items-center pl-2 ml-1 border-l border-slate-200">
                <Link to="/profile" className="flex min-w-0 items-center gap-2 rounded-lg bg-slate-50 px-2 py-1 transition hover:bg-primary/10">
                  {user?.profilePhoto && (
                    <img src={resolveMediaUrl(user.profilePhoto)} alt="Profile" className="h-8 w-8 flex-none rounded-full object-cover" />
                  )}
                  <span className="min-w-0 max-w-[92px] truncate text-sm font-semibold text-slate-700 2xl:max-w-[140px]">{user?.name}</span>
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
            className="min-[1440px]:hidden flex h-10 w-10 flex-none items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-700"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="min-[1440px]:hidden pb-4 space-y-2 border-t border-slate-100 pt-3">
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
              Events
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
