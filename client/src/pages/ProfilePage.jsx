import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { blogAPI } from '../utils/api';
import { ErrorMessage, LoadingSpinner, SuccessMessage } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { FiCamera, FiEdit3, FiLogOut, FiMail, FiSave, FiUserCheck, FiUsers } from 'react-icons/fi';
import { ProfileCertificates } from '../components/ProfileCertificates';
import { ProfileAvatar } from '../components/ProfileAvatar';

export const ProfilePage = () => {
  const { user, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [bioDraft, setBioDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadProfile = async () => {
    try {
      const response = await blogAPI.getProfile();
      setProfile(response.data);
      setBioDraft(response.data.bio || '');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleBioSave = async () => {
    setSaving(true);
    setError('');
    try {
      const response = await blogAPI.updateProfile({ bio: bioDraft });
      setProfile(response.data.profile);
      setBioDraft(response.data.profile.bio || '');
      await refreshProfile?.();
      setSuccess('Profile updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePhotoUpload = async (file) => {
    if (!file) return;
    setSaving(true);
    setError('');
    try {
      const data = new FormData();
      data.append('image', file);
      const response = await blogAPI.uploadImage(data);
      const updatedProfile = await blogAPI.updateProfile({ profilePhoto: response.data.imageUrl });
      setProfile(updatedProfile.data.profile);
      await refreshProfile?.();
      setSuccess('Profile photo updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload profile photo');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <LoadingSpinner />;

  const displayProfile = profile || user;

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold uppercase tracking-wide text-secondary">Account profile</p>
              <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-5xl">Your MongoDB Club identity</h1>
              <p className="mt-3 max-w-2xl text-slate-600">
                Your photo comes from Google when you sign in. You can replace it here anytime.
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-5 py-3 font-black text-rose-700 transition hover:bg-rose-100 sm:w-auto"
            >
              <FiLogOut />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-6 lg:grid-cols-[360px_1fr]">
        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <ProfileAvatar
                user={displayProfile}
                className="h-36 w-36 rounded-full border-4 border-white object-cover shadow-lg ring-4 ring-green-100"
                fallbackClassName="h-36 w-36 rounded-full bg-secondary text-5xl text-white shadow-lg ring-4 ring-green-100"
              />
              <label className="absolute bottom-2 right-2 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-secondary text-white shadow-lg transition hover:bg-secondary/90" title="Change profile photo">
                <FiCamera />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleProfilePhotoUpload(event.target.files?.[0])}
                  className="hidden"
                />
              </label>
            </div>

            <h2 className="mt-5 text-2xl font-black text-slate-950">{displayProfile?.name}</h2>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <FiMail />
              <span className="break-all">{displayProfile?.email}</span>
            </div>

            <div className="mt-5 grid w-full grid-cols-2 gap-2">
              <div className="rounded-lg bg-slate-50 p-3 text-left">
                <FiUsers className="mb-2 text-secondary" />
                <p className="text-2xl font-black text-slate-950">{profile?.followerCount || 0}</p>
                <p className="text-xs font-semibold text-slate-500">Followers</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 text-left">
                <FiUserCheck className="mb-2 text-secondary" />
                <p className="text-2xl font-black text-slate-950">{profile?.followingCount || 0}</p>
                <p className="text-xs font-semibold text-slate-500">Following</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="space-y-5">
          {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
          {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-secondary">
                <FiEdit3 />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-950">Bio</h2>
                <p className="text-sm text-slate-500">This appears on your public profile and in the blog community.</p>
              </div>
            </div>

            <textarea
              value={bioDraft}
              onChange={(event) => setBioDraft(event.target.value)}
              maxLength={280}
              rows="6"
              className="mt-5 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-secondary focus:ring-4 focus:ring-green-100"
              placeholder="Tell the community about yourself..."
            />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold text-slate-500">{bioDraft.length}/280 characters</p>
              <button
                onClick={handleBioSave}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-5 py-3 font-bold text-white transition hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiSave />
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Community Profile</h2>
            <p className="mt-2 text-sm text-slate-600">Preview the public version of your profile and posts.</p>
              <Link
                to={`/user/${displayProfile?.id || displayProfile?._id}`}
              className="mt-4 inline-flex w-full justify-center rounded-lg border border-slate-300 px-4 py-2 font-bold text-slate-700 transition hover:border-secondary hover:text-secondary sm:w-auto"
            >
              View Public Profile
            </Link>
          </section>

          <ProfileCertificates onError={setError} />
        </main>
      </div>
    </div>
  );
};
