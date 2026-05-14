import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_ORIGIN, blogAPI, resolveMediaUrl } from '../utils/api';
import { ErrorMessage, LoadingSpinner, SuccessMessage } from '../components/UI';
import { MarkdownPreview } from '../utils/markdownParser';
import { useAuth } from '../context/AuthContext';
import { BrandMark } from '../components/BrandMark';
import {
  FiBookOpen,
  FiCalendar,
  FiEdit3,
  FiHeart,
  FiHome,
  FiMenu,
  FiSearch,
  FiSettings,
  FiShare2,
  FiTrash2,
  FiUserCheck,
  FiUserPlus,
  FiX
} from 'react-icons/fi';

const getReadTime = (body = '') => {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
};

export const BlogsPage = () => {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [feedSection, setFeedSection] = useState('all');
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadBlogs = async () => {
    try {
      const [feedResponse, myPostsResponse] = await Promise.all([
        isAdmin ? blogAPI.getAdminPosts() : blogAPI.getFeed(),
        blogAPI.getMyPosts()
      ]);
      setPosts(feedResponse.data);
      setMyPosts(myPostsResponse.data);
    } catch (err) {
      setError('Failed to load blogs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();
  }, [isAdmin]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [menuOpen]);

  const visiblePosts = useMemo(() => {
    const published = posts.filter(post => post.status === 'published');
    if (feedSection === 'latest') {
      return [...published].sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt));
    }
    if (feedSection === 'top') {
      return [...published].sort((a, b) => (b.likeCount + b.shares) - (a.likeCount + a.shares));
    }
    if (feedSection === 'drafts') {
      return myPosts.filter(post => post.status === 'draft');
    }
    if (feedSection === 'admin') {
      return posts;
    }
    return published;
  }, [feedSection, posts, myPosts]);

  const refreshAdminReview = async () => {
    if (!isAdmin) return;
    try {
      const response = await blogAPI.getAdminPosts();
      setPosts(response.data);
      setFeedSection('admin');
      setSuccess('Admin review refreshed');
    } catch (err) {
      setError('Failed to refresh admin review');
    }
  };

  const handleLike = async (postId) => {
    const response = await blogAPI.toggleLike(postId);
    setPosts(prev => prev.map(post => post._id === postId ? response.data.post : post));
  };

  const handleShare = async (post) => {
    await blogAPI.recordShare(post._id);
    const url = `${window.location.origin}/blogs?post=${post._id}`;
    if (navigator.share) {
      navigator.share({ title: post.title, text: post.body.slice(0, 120), url });
    } else {
      navigator.clipboard?.writeText(url);
      setSuccess('Blog link copied');
    }
    loadBlogs();
  };

  const handleUserSearch = async (value) => {
    setQuery(value);
    if (!value.trim()) {
      setUsers([]);
      return;
    }
    try {
      const response = await blogAPI.searchUsers(value);
      console.log('Search results:', response.data);
      setUsers(response.data || []);
    } catch (error) {
      console.error('Search error:', error);
      setUsers([]);
      setError('Failed to search users');
    }
  };

  const handleFollow = async (userId) => {
    const response = await blogAPI.toggleFollow(userId);
    setUsers(prev => prev.map(foundUser =>
      foundUser._id === userId
        ? { ...foundUser, isFollowing: response.data.isFollowing, followerCount: response.data.followerCount }
        : foundUser
    ));
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this blog post?')) return;
    await blogAPI.deletePost(postId);
    setPosts(prev => prev.filter(post => post._id !== postId));
    setMyPosts(prev => prev.filter(post => post._id !== postId));
    setSuccess('Blog deleted');
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user and their blogs?')) return;
    await blogAPI.deleteUser(userId);
    setUsers(prev => prev.filter(foundUser => foundUser._id !== userId));
    setPosts(prev => prev.filter(post => post.author?._id !== userId));
    setSuccess('User deleted');
  };

  const navLinks = [
    { to: '/', label: 'Home', icon: FiHome },
    { to: '/profile', label: 'Profile', icon: FiUserCheck },
    { to: '/workshops', label: 'Workshops', icon: FiCalendar },
    { to: '/my-registrations', label: 'My Events', icon: FiBookOpen },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin', icon: FiSettings }] : [])
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 min-h-16 py-2 flex flex-wrap items-center gap-3 sm:gap-4">
          <button
            onClick={() => setMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100"
            aria-label="Open menu"
          >
            <FiMenu size={24} />
          </button>
          <Link to="/blogs" className="flex items-center gap-3 min-w-0 flex-1 sm:flex-none">
            <BrandMark compact />
            <span className="font-black text-sm sm:text-lg xl:text-xl leading-tight text-slate-950">MClub Blogs</span>
          </Link>
          <div className="relative order-3 w-full flex-none sm:order-none sm:flex-1 sm:max-w-2xl sm:mx-auto">
            <FiSearch className="absolute left-4 top-3 text-slate-400" />
            <input
              value={query}
              onChange={(e) => handleUserSearch(e.target.value)}
              placeholder="Search users"
              className="w-full pl-12 pr-4 py-2.5 border border-green-300 rounded-lg focus-ring bg-white shadow-md"
            />
            {users.length > 0 && (
              <div className="absolute left-0 right-0 top-12 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-200 shadow-2xl overflow-hidden z-50 backdrop-filter backdrop-blur-md">
                {users.map(foundUser => (
                  <button
                    key={foundUser._id}
                    onClick={() => {
                      setQuery('');
                      setUsers([]);
                      navigate(`/user/${foundUser._id}`);
                    }}
                    className="w-full flex items-center justify-between gap-3 p-4 border-b last:border-b-0 border-green-100 hover:bg-green-100 transition text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {foundUser.profilePhoto && <img src={resolveMediaUrl(foundUser.profilePhoto)} alt={foundUser.name} className="w-10 h-10 rounded-full border-2 border-green-500" />}
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate text-slate-900">{foundUser.name}</p>
                        <p className="text-xs text-slate-600">{foundUser.followerCount} followers</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFollow(foundUser._id);
                      }}
                      className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-bold flex items-center gap-1 whitespace-nowrap shadow-md"
                    >
                      {foundUser.isFollowing ? <FiUserCheck /> : <FiUserPlus />}
                      {foundUser.isFollowing ? 'Following' : 'Follow'}
                    </button>
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteUser(foundUser._id);
                        }}
                        className="p-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100"
                        title="Delete user"
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => navigate('/blogs/create')}
            className="hidden sm:inline-flex px-4 py-2 rounded-lg border-2 border-green-600 text-green-600 font-bold hover:bg-green-600 hover:text-white transition"
          >
            ✏️ Create Post
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-secondary hover:shadow-lg hover:scale-105 transition"
            title="My Profile"
          >
            {user?.profilePhoto ? (
              <img src={resolveMediaUrl(user.profilePhoto)} alt={user.name} className="w-10 h-10 rounded-full border-2 border-white object-cover" />
            ) : (
              <FiUserCheck className="text-white text-lg" />
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          className="bg-black/40"
          style={{ position: 'fixed', inset: 0, zIndex: 1000 }}
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="w-80 max-w-[85vw] bg-white p-5 shadow-xl overflow-y-auto"
            style={{ position: 'fixed', left: 0, top: 0, bottom: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black">Menu</h2>
              <button onClick={() => setMenuOpen(false)} className="p-2 rounded-lg hover:bg-slate-100"><FiX /></button>
            </div>
            <div className="space-y-2">
              {navLinks.map(item => {
                const Icon = item.icon;
                return (
                  <Link key={item.to} to={item.to} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-100 font-bold" onClick={() => setMenuOpen(false)}>
                    <Icon /> {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
        {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}

        <div className="mb-6 rounded-lg bg-slate-950 text-white p-6 sm:p-8 overflow-hidden relative">
          <div className="relative z-10 max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wide text-secondary mb-2">Community writing space</p>
            <h1 className="text-3xl sm:text-5xl font-black leading-tight">Share MongoDB stories, projects, notes, and learning journeys.</h1>
            <p className="text-slate-300 mt-4">Scroll through every published blog, discover creators, follow people, and publish your own post with preview.</p>
          </div>
          <div className="absolute -right-12 -bottom-16 w-64 h-64 bg-primary/20 rounded-full blur-2xl"></div>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-5">
          <main>
            {isAdmin && feedSection === 'admin' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="font-black text-amber-950">Admin Review</h2>
                  <p className="text-sm text-amber-800">Moderate every blog here, including drafts and published posts.</p>
                </div>
                <button onClick={refreshAdminReview} className="px-4 py-2 bg-amber-500 text-white rounded-lg font-bold">
                  Refresh Review
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 overflow-x-auto mb-4">
              {[
                ['all', 'All'],
                ['latest', 'Latest'],
                ['top', 'Top'],
                ['drafts', 'Drafts'],
                ...(isAdmin ? [['admin', 'Admin Review']] : [])
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFeedSection(key)}
                  className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap ${
                    feedSection === key ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {visiblePosts.map(post => (
                <article key={post._id} className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition">
                  {post.coverImage && <img src={post.coverImage.startsWith('/uploads') ? `${API_ORIGIN}${post.coverImage}` : post.coverImage} alt={post.title} className="w-full max-h-80 object-cover" />}
                  <div className="p-5 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                      {post.author?.profilePhoto && <img src={resolveMediaUrl(post.author.profilePhoto)} alt={post.author.name} className="w-10 h-10 rounded-full" />}
                      <div>
                        <p className="font-bold text-slate-950">{post.author?.name}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(post.publishedAt || post.createdAt).toLocaleDateString()} • {getReadTime(post.body)} min read
                        </p>
                      </div>
                      {isAdmin && (
                        <span className={`ml-auto px-2 py-1 rounded text-xs font-bold ${
                          post.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {post.status}
                        </span>
                      )}
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-950 mb-3 leading-tight">{post.title}</h2>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.map(tag => (
                        <span key={tag} className="text-sm text-slate-600 hover:text-primary">#{tag}</span>
                      ))}
                    </div>
                    <div className="prose prose-lg max-w-none mb-5">
                      <MarkdownPreview content={post.body} />
                    </div>
                    <div className="flex flex-wrap gap-3 mt-5">
                      <button onClick={() => handleLike(post._id)} className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${post.isLiked ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-800'}`}>
                        <FiHeart /> {post.likeCount} likes
                      </button>
                      <button onClick={() => handleShare(post)} className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 bg-slate-100 text-slate-800">
                        <FiShare2 /> Share
                      </button>
                      {(isAdmin || post.author?._id === user?.id || post.author?._id === user?._id) && (
                        <button onClick={() => handleDeletePost(post._id)} className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 bg-rose-50 text-rose-700">
                          <FiTrash2 /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
              {visiblePosts.length === 0 && (
                <div className="bg-white rounded-lg border border-slate-200 p-10 text-center text-slate-600">
                  No posts in this section yet.
                </div>
              )}
            </div>
          </main>

          <aside className="hidden lg:block space-y-4">
            {isAdmin && (
              <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
                <h2 className="font-black text-amber-900 mb-2">Admin Options</h2>
                <p className="text-sm text-amber-800 mb-3">Use Admin Review to see drafts, published posts, delete blogs, and remove unwanted users from search results.</p>
                <button onClick={refreshAdminReview} className="w-full px-4 py-2 bg-amber-500 text-white rounded-lg font-bold">
                  Open Admin Review
                </button>
              </div>
            )}

            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
              <h2 className="font-black text-slate-950 mb-3">Your Drafts</h2>
              <div className="space-y-2">
                {myPosts.filter(post => post.status === 'draft').map(post => (
                  <button key={post._id} onClick={() => setFeedSection('drafts')} className="block w-full text-left rounded-lg bg-slate-50 p-3">
                    <p className="font-semibold text-sm">{post.title}</p>
                    <p className="text-xs text-slate-500">Draft</p>
                  </button>
                ))}
                {myPosts.filter(post => post.status === 'draft').length === 0 && <p className="text-sm text-slate-500">No drafts yet</p>}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
              <h2 className="font-black text-slate-950 mb-2">Blog Sections</h2>
              <p className="text-sm text-slate-600">Published posts are visible to every user. Follow helps you discover creators, but it does not hide the global feed.</p>
            </div>
          </aside>
        </div>
      </div>

      <button
        onClick={() => navigate('/blogs/create')}
        className="fixed bottom-5 right-5 z-40 h-16 w-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl flex items-center justify-center text-2xl hover:scale-110 transition transform"
        aria-label="Create post"
        title="Create new post"
      >
        ✏️
      </button>
    </div>
  );
};
