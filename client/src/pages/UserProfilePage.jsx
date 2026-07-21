import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { blogAPI, API_ORIGIN } from '../utils/api';
import { LoadingSpinner, ErrorMessage } from '../components/UI';
import { MarkdownPreview } from '../utils/markdownParser';
import { useAuth } from '../context/AuthContext';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { FiArrowLeft, FiHeart, FiShare2, FiTrash2, FiUserCheck, FiUserPlus } from 'react-icons/fi';

const getReadTime = (body = '') => {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
};

export const UserProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const currentUserId = user?.id || user?._id;

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const [profileRes, postsRes] = await Promise.all([
          blogAPI.getUserProfile(userId),
          blogAPI.getUserPosts(userId)
        ]);
        setProfile(profileRes.data);
        setPosts(postsRes.data || []);
        setIsFollowing(profileRes.data.isFollowing || false);
      } catch (err) {
        console.error('Profile load error:', err);
        setError(err.response?.data?.message || 'Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadUserProfile();
    }
  }, [userId]);

  const handleFollow = async () => {
    try {
      await blogAPI.toggleFollow(userId);
      setIsFollowing(!isFollowing);
      if (profile) {
        setProfile(prev => ({
          ...prev,
          followerCount: isFollowing ? prev.followerCount - 1 : prev.followerCount + 1
        }));
      }
    } catch (err) {
      setError('Failed to update follow status');
    }
  };

  const handleLike = async (postId) => {
    try {
      await blogAPI.likePost(postId);
      setPosts(prev => prev.map(p => 
        p._id === postId 
          ? { ...p, isLiked: !p.isLiked, likeCount: p.isLiked ? p.likeCount - 1 : p.likeCount + 1 }
          : p
      ));
    } catch (err) {
      setError('Failed to like post');
    }
  };

  if (loading) return <LoadingSpinner />;
  
  if (error) {
    return (
      <div className="min-h-screen app-shell flex items-center justify-center">
        <div className="text-center panel p-8 max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">⚠️ Error</h2>
          <p className="text-gray-800 mb-6">{error}</p>
          <button onClick={() => navigate('/blogs')} className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700">
            Back to Blogs
          </button>
        </div>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="min-h-screen app-shell flex items-center justify-center">
        <div className="text-center panel p-8 max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">👤 User Not Found</h2>
          <p className="text-gray-700 mb-6">The user you're looking for doesn't exist.</p>
          <button onClick={() => navigate('/blogs')} className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700">
            Back to Blogs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-shell">
      {/* Back Button */}
      <div className="bg-white border-b border-slate-200 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/blogs')}
            className="flex items-center gap-2 text-green-600 hover:text-green-700 font-bold"
          >
            <FiArrowLeft /> Back to Blogs
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}

        {/* Profile Header */}
        <div className="panel rounded-2xl p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Profile Photo */}
            <ProfileAvatar
              user={profile}
              className="w-32 h-32 rounded-full border-4 border-green-500 object-cover shadow-lg"
              fallbackClassName="w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white text-5xl"
            />

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{profile.name}</h1>
              <p className="text-gray-700 text-lg mb-4">{profile.bio || 'No bio yet'}</p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center sm:text-left">
                  <p className="text-2xl font-bold text-green-600">{posts.length}</p>
                  <p className="text-sm text-gray-700">Posts</p>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-2xl font-bold text-green-600">{profile.followerCount || 0}</p>
                  <p className="text-sm text-gray-700">Followers</p>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-2xl font-bold text-green-600">{profile.followingCount || 0}</p>
                  <p className="text-sm text-gray-700">Following</p>
                </div>
              </div>

              {/* Action Button */}
              {currentUserId !== userId && (
                <button
                  onClick={handleFollow}
                  className={`px-6 py-3 rounded-lg font-bold transition ${
                    isFollowing
                      ? 'bg-gray-300 text-gray-900 hover:bg-gray-400'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isFollowing ? (
                    <span className="flex items-center gap-2"><FiUserCheck /> Following</span>
                  ) : (
                    <span className="flex items-center gap-2"><FiUserPlus /> Follow</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-6 py-3 rounded-lg font-bold transition ${
              activeTab === 'posts'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-green-500'
            }`}
          >
            Posts ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab('followers')}
            className={`px-6 py-3 rounded-lg font-bold transition ${
              activeTab === 'followers'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-green-500'
            }`}
          >
            Followers ({profile.followerCount || 0})
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`px-6 py-3 rounded-lg font-bold transition ${
              activeTab === 'following'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-green-500'
            }`}
          >
            Following ({profile.followingCount || 0})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'posts' && (
          <div className="space-y-6">
            {posts.length > 0 ? (
              posts.map(post => (
                <article key={post._id} className="panel rounded-lg overflow-hidden">
                  {post.coverImage && (
                    <img
                      src={post.coverImage.startsWith('/uploads') ? `${API_ORIGIN}${post.coverImage}` : post.coverImage}
                      alt={post.title}
                      className="w-full max-h-64 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{post.title}</h2>
                    <p className="text-gray-600 mb-3 text-sm">
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString()} • {getReadTime(post.body)} min read
                    </p>
                    <p className="text-gray-700 mb-4 leading-7 line-clamp-2">{post.body.replace(/[`#_*>-]/g, '').substring(0, 300)}...</p>
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleLike(post._id)}
                        className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${
                          post.isLiked ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        <FiHeart /> {post.likeCount} likes
                      </button>
                      <button className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 bg-gray-100 text-gray-700">
                        <FiShare2 /> Share
                      </button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="panel rounded-lg p-8 text-center text-gray-600">
                <p>No posts yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'followers' && (
          <div className="space-y-3">
            {profile.followers && profile.followers.length > 0 ? (
              profile.followers.map(follower => (
                <div key={follower._id} className="panel rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ProfileAvatar
                      user={follower}
                      className="w-12 h-12 rounded-full object-cover"
                      fallbackClassName="w-12 h-12 rounded-full bg-green-500 text-white"
                    />
                    <div>
                      <p className="font-bold text-gray-900">{follower.name}</p>
                      <p className="text-sm text-gray-600">{follower.bio || 'No bio'}</p>
                    </div>
                  </div>
                  <button onClick={() => navigate(`/user/${follower._id}`)} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700">
                    View Profile
                  </button>
                </div>
              ))
            ) : (
              <div className="panel rounded-lg p-8 text-center text-gray-600">
                <p>No followers yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'following' && (
          <div className="space-y-3">
            {profile.following && profile.following.length > 0 ? (
              profile.following.map(followed => (
                <div key={followed._id} className="panel rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ProfileAvatar
                      user={followed}
                      className="w-12 h-12 rounded-full object-cover"
                      fallbackClassName="w-12 h-12 rounded-full bg-green-500 text-white"
                    />
                    <div>
                      <p className="font-bold text-gray-900">{followed.name}</p>
                      <p className="text-sm text-gray-600">{followed.bio || 'No bio'}</p>
                    </div>
                  </div>
                  <button onClick={() => navigate(`/user/${followed._id}`)} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700">
                    View Profile
                  </button>
                </div>
              ))
            ) : (
              <div className="panel rounded-lg p-8 text-center text-gray-600">
                <p>Not following anyone yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
