import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_ORIGIN, blogAPI } from '../utils/api';
import { ErrorMessage, LoadingSpinner, SuccessMessage } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import {
  FiBookOpen,
  FiCalendar,
  FiEdit3,
  FiEye,
  FiHeart,
  FiHome,
  FiMenu,
  FiSearch,
  FiSettings,
  FiShare2,
  FiTrash2,
  FiUser,
  FiUserCheck,
  FiUserPlus,
  FiX
} from 'react-icons/fi';

const emptyPost = {
  title: '',
  body: '',
  tags: '',
  coverImage: ''
};

const getReadTime = (body = '') => {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
};

const formatTags = (tags = '') => tags.split(',').map(tag => tag.trim()).filter(Boolean);

export const BlogsPage = () => {
  const { isAdmin, user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [bioDraft, setBioDraft] = useState('');
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [postForm, setPostForm] = useState(emptyPost);
  const [feedSection, setFeedSection] = useState('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorTab, setEditorTab] = useState('write');
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
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

    try {
      const profileResponse = await blogAPI.getProfile();
      setProfile(profileResponse.data);
      setBioDraft(profileResponse.data.bio || '');
    } catch (err) {
      console.error('Failed to load blog profile', err);
    }
  };

  useEffect(() => {
    loadBlogs();
  }, [isAdmin]);

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

  const handleCreatePost = async (status) => {
    if (!postForm.title || !postForm.body) {
      setError('Title and content are required');
      return;
    }

    try {
      await blogAPI.createPost({
        ...postForm,
        status,
        tags: formatTags(postForm.tags)
      });
      setPostForm(emptyPost);
      setEditorOpen(false);
      setEditorTab('write');
      setSuccess(status === 'published' ? 'Blog published' : 'Draft saved');
      loadBlogs();
    } catch (err) {
      setError('Failed to save blog');
    }
  };

  const handleCoverImageUpload = async (file) => {
    if (!file) return;
    const data = new FormData();
    data.append('image', file);
    setImageUploading(true);
    try {
      const response = await blogAPI.uploadImage(data);
      setPostForm(prev => ({ ...prev, coverImage: response.data.imageUrl }));
    } catch (err) {
      setError('Failed to upload cover image');
    } finally {
      setImageUploading(false);
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
    const response = await blogAPI.searchUsers(value);
    setUsers(response.data);
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

  const handleBioSave = async () => {
    const response = await blogAPI.updateProfile({ bio: bioDraft });
    setProfile(response.data.profile);
    setBioDraft(response.data.profile.bio || '');
    setSuccess('Profile bio updated');
  };

  const navLinks = [
    { to: '/', label: 'Home', icon: FiHome },
    { to: '/workshops', label: 'Workshops', icon: FiCalendar },
    { to: '/my-registrations', label: 'My Events', icon: FiBookOpen },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin', icon: FiSettings }] : [])
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <button
            onClick={() => setMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100"
            aria-label="Open menu"
          >
            <FiMenu size={24} />
          </button>
          <Link to="/blogs" className="font-black text-xl text-slate-950">MClub Blogs</Link>
          <div className="relative flex-1 max-w-2xl mx-auto">
            <FiSearch className="absolute left-4 top-3 text-slate-400" />
            <input
              value={query}
              onChange={(e) => handleUserSearch(e.target.value)}
              placeholder="Search users"
              className="w-full pl-12 pr-4 py-2.5 border border-slate-300 rounded-lg focus-ring bg-white"
            />
            {users.length > 0 && (
              <div className="absolute left-0 right-0 top-12 bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden">
                {users.map(foundUser => (
                  <div key={foundUser._id} className="flex items-center justify-between gap-3 p-3 border-b last:border-b-0 border-slate-100">
                    <div className="flex items-center gap-3 min-w-0">
                      {foundUser.profilePhoto && <img src={foundUser.profilePhoto} alt={foundUser.name} className="w-10 h-10 rounded-full" />}
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{foundUser.name}</p>
                        <p className="text-xs text-slate-500">{foundUser.followerCount} followers</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleFollow(foundUser._id)}
                        className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-bold flex items-center gap-1"
                      >
                        {foundUser.isFollowing ? <FiUserCheck /> : <FiUserPlus />}
                        {foundUser.isFollowing ? 'Following' : 'Follow'}
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteUser(foundUser._id)}
                          className="p-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100"
                          title="Delete user"
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setEditorOpen(true)}
            className="hidden sm:inline-flex px-4 py-2 rounded-lg border border-primary text-primary font-bold hover:bg-indigo-50"
          >
            Create Post
          </button>
          <button
            onClick={() => setProfileOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold"
          >
            {profile?.profilePhoto ? (
              <img src={profile.profilePhoto} alt={profile.name} className="w-7 h-7 rounded-full" />
            ) : (
              <FiUser />
            )}
            <span className="hidden sm:inline">Profile</span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setMenuOpen(false)}>
          <div className="w-80 max-w-[85vw] h-full bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
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
            <p className="text-sm font-bold uppercase tracking-wide text-cyan-300 mb-2">Community writing space</p>
            <h1 className="text-3xl sm:text-5xl font-black leading-tight">Share MongoDB stories, projects, notes, and learning journeys.</h1>
            <p className="text-slate-300 mt-4">Scroll through every published blog, discover creators, follow people, and publish your own post with preview.</p>
          </div>
          <div className="absolute -right-12 -bottom-16 w-64 h-64 bg-cyan-400/20 rounded-full blur-2xl"></div>
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
                      {post.author?.profilePhoto && <img src={post.author.profilePhoto} alt={post.author.name} className="w-10 h-10 rounded-full" />}
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
                    <p className="text-slate-700 whitespace-pre-wrap line-clamp-5 text-base leading-7">{post.body}</p>
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
            {(feedSection === 'profile-followers' || feedSection === 'profile-following') && (
              <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                <h2 className="font-black text-slate-950 mb-3">
                  {feedSection === 'profile-followers' ? 'Followers' : 'Following'}
                </h2>
                <div className="space-y-3">
                  {(feedSection === 'profile-followers' ? profile?.followers : profile?.following)?.map(person => (
                    <div key={person._id} className="flex items-center gap-2">
                      {person.profilePhoto && <img src={person.profilePhoto} alt={person.name} className="w-8 h-8 rounded-full" />}
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{person.name}</p>
                        <p className="text-xs text-slate-500 truncate">{person.bio || person.email}</p>
                      </div>
                    </div>
                  ))}
                  {(feedSection === 'profile-followers' ? profile?.followers : profile?.following)?.length === 0 && (
                    <p className="text-sm text-slate-500">No users yet</p>
                  )}
                </div>
              </div>
            )}

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
        onClick={() => setEditorOpen(true)}
        className="fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full bg-primary text-white shadow-xl flex items-center justify-center"
        aria-label="Create post"
      >
        <FiEdit3 size={24} />
      </button>

      {editorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-slate-200 z-10">
            <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button onClick={() => setEditorOpen(false)} className="p-2 rounded-lg hover:bg-slate-100"><FiX /></button>
                <span className="font-black text-slate-950">Create Post</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditorTab('write')} className={`px-4 py-2 rounded-lg font-bold ${editorTab === 'write' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  Write
                </button>
                <button onClick={() => setEditorTab('preview')} className={`px-4 py-2 rounded-lg font-bold ${editorTab === 'preview' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  <FiEye className="inline mr-1" /> Preview
                </button>
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-4 py-6">
            {editorTab === 'write' ? (
              <div className="bg-white rounded-lg border border-slate-200 p-5 sm:p-8">
                <div className="mb-5">
                  {postForm.coverImage ? (
                    <img
                      src={postForm.coverImage.startsWith('/uploads') ? `${API_ORIGIN}${postForm.coverImage}` : postForm.coverImage}
                      alt="Cover preview"
                      className="w-full max-h-72 object-cover rounded-lg mb-3"
                    />
                  ) : (
                    <div className="rounded-lg border-2 border-dashed border-slate-300 p-8 text-center text-slate-500 mb-3">
                      Upload a cover photo from your device
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleCoverImageUpload(e.target.files?.[0])}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus-ring"
                  />
                  {imageUploading && <p className="text-sm text-slate-500 mt-2">Uploading image...</p>}
                </div>
                <input
                  value={postForm.title}
                  onChange={(e) => setPostForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="New post title here..."
                  className="w-full text-4xl sm:text-5xl font-black border-none focus:outline-none placeholder:text-slate-400 mb-5"
                />
                <input
                  value={postForm.tags}
                  onChange={(e) => setPostForm(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="Add up to 4 tags, comma separated"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus-ring mb-5"
                />
                <textarea
                  rows="18"
                  value={postForm.body}
                  onChange={(e) => setPostForm(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="Write your post content here..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus-ring text-lg leading-8"
                />
              </div>
            ) : (
              <article className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                {postForm.coverImage && <img src={postForm.coverImage.startsWith('/uploads') ? `${API_ORIGIN}${postForm.coverImage}` : postForm.coverImage} alt={postForm.title} className="w-full max-h-96 object-cover" />}
                <div className="p-5 sm:p-8">
                  <h1 className="text-4xl sm:text-5xl font-black mb-4">{postForm.title || 'Post preview title'}</h1>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {formatTags(postForm.tags).map(tag => <span key={tag} className="text-slate-600">#{tag}</span>)}
                  </div>
                  <p className="text-lg leading-8 whitespace-pre-wrap text-slate-800">{postForm.body || 'Your preview will appear here as you write.'}</p>
                </div>
              </article>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-5">
              <button onClick={() => handleCreatePost('published')} className="px-6 py-3 bg-primary text-white rounded-lg font-black">
                Publish
              </button>
              <button onClick={() => handleCreatePost('draft')} className="px-6 py-3 bg-slate-200 text-slate-900 rounded-lg font-black">
                Save Draft
              </button>
              <button onClick={() => setEditorOpen(false)} className="px-6 py-3 text-slate-700 rounded-lg font-bold">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {profileOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setProfileOpen(false)}>
          <div className="bg-white rounded-lg max-w-xl w-full overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="h-24 bg-slate-950"></div>
            <div className="p-5 -mt-12">
              <div className="flex items-start justify-between gap-3">
                {profile?.profilePhoto ? (
                  <img src={profile.profilePhoto} alt={profile.name} className="w-20 h-20 rounded-full border-4 border-white" />
                ) : (
                  <div className="w-20 h-20 rounded-full border-4 border-white bg-slate-200 flex items-center justify-center">
                    <FiUser />
                  </div>
                )}
                <button onClick={() => setProfileOpen(false)} className="mt-12 p-2 rounded-lg hover:bg-slate-100"><FiX /></button>
              </div>
              <h2 className="font-black text-2xl text-slate-950 mt-3">{profile?.name || user?.name}</h2>
              <p className="text-sm text-slate-500 break-all">{profile?.email || user?.email}</p>
              <div className="grid grid-cols-2 gap-2 my-4">
                <button onClick={() => setFeedSection('profile-followers')} className="rounded-lg bg-slate-50 p-3 text-left">
                  <p className="font-black">{profile?.followerCount || 0}</p>
                  <p className="text-xs text-slate-500">Followers</p>
                </button>
                <button onClick={() => setFeedSection('profile-following')} className="rounded-lg bg-slate-50 p-3 text-left">
                  <p className="font-black">{profile?.followingCount || 0}</p>
                  <p className="text-xs text-slate-500">Following</p>
                </button>
              </div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Bio</label>
              <textarea
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value)}
                maxLength={280}
                rows="4"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus-ring text-sm"
                placeholder="Tell the community about yourself..."
              />
              <button onClick={handleBioSave} className="mt-3 w-full px-4 py-2 rounded-lg bg-slate-950 text-white font-bold">
                Update Bio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
