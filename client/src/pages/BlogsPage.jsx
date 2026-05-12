import React, { useEffect, useState } from 'react';
import { blogAPI } from '../utils/api';
import { ErrorMessage, LoadingSpinner, SuccessMessage } from '../components/UI';
import { FiEdit3, FiHeart, FiSearch, FiShare2, FiTrash2, FiUserPlus, FiUserCheck } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const emptyPost = {
  title: '',
  body: '',
  tags: '',
  coverImage: '',
  status: 'draft'
};

export const BlogsPage = () => {
  const { isAdmin, user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [postForm, setPostForm] = useState(emptyPost);
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

  const handleCreatePost = async (status) => {
    if (!postForm.title || !postForm.body) {
      setError('Title and content are required');
      return;
    }

    try {
      await blogAPI.createPost({
        ...postForm,
        status,
        tags: postForm.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      });
      setPostForm(emptyPost);
      setSuccess(status === 'published' ? 'Blog published' : 'Draft saved');
      loadBlogs();
    } catch (err) {
      setError('Failed to save blog');
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
    setUsers(prev => prev.map(user =>
      user._id === userId
        ? { ...user, isFollowing: response.data.isFollowing, followerCount: response.data.followerCount }
        : user
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
    setUsers(prev => prev.filter(user => user._id !== userId));
    setPosts(prev => prev.filter(post => post.author?._id !== userId));
    setSuccess('User deleted');
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen app-shell">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="panel rounded-lg p-5 sm:p-8 mb-6">
          <p className="text-sm font-bold text-primary uppercase tracking-wide mb-2">Community blogs</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-950">Read, write, follow, and share</h1>
          <p className="text-slate-600 mt-3">
            {isAdmin
              ? 'Admin moderation is enabled here: review all blogs, drafts, and published posts.'
              : 'All published blogs are visible to every logged-in user, whether they follow the author or not.'}
          </p>
        </div>

        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
        {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}

        <div className="grid lg:grid-cols-[300px_1fr_320px] gap-6">
          <aside className="space-y-6">
            <div className="panel rounded-lg p-4">
              <h2 className="font-bold text-slate-950 mb-3">Search Users</h2>
              <div className="relative mb-3">
                <FiSearch className="absolute left-3 top-3 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  placeholder="Search creators"
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus-ring"
                />
              </div>
              <div className="space-y-3">
                {users.map(user => (
                  <div key={user._id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {user.profilePhoto && <img src={user.profilePhoto} alt={user.name} className="w-9 h-9 rounded-full" />}
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.followerCount} followers</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleFollow(user._id)}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200"
                      title={user.isFollowing ? 'Unfollow' : 'Follow'}
                    >
                      {user.isFollowing ? <FiUserCheck /> : <FiUserPlus />}
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="p-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100"
                        title="Delete user"
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="panel rounded-lg p-4">
              <h2 className="font-bold text-slate-950 mb-3">Your Drafts</h2>
              <div className="space-y-2">
                {myPosts.filter(post => post.status === 'draft').map(post => (
                  <div key={post._id} className="rounded-lg bg-slate-50 p-3">
                    <p className="font-semibold text-sm">{post.title}</p>
                    <p className="text-xs text-slate-500">Draft</p>
                  </div>
                ))}
                {myPosts.filter(post => post.status === 'draft').length === 0 && (
                  <p className="text-sm text-slate-500">No drafts yet</p>
                )}
              </div>
            </div>
          </aside>

          <main className="space-y-5">
            {posts.map(post => (
              <article key={post._id} className="panel rounded-lg overflow-hidden">
                {post.coverImage && <img src={post.coverImage} alt={post.title} className="w-full max-h-72 object-cover" />}
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    {post.author?.profilePhoto && <img src={post.author.profilePhoto} alt={post.author.name} className="w-10 h-10 rounded-full" />}
                    <div>
                      <p className="font-bold text-slate-950">{post.author?.name}</p>
                      <p className="text-xs text-slate-500">{new Date(post.publishedAt || post.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-950 mb-3">{post.title}</h2>
                  {isAdmin && (
                    <span className={`inline-flex mb-3 px-2 py-1 rounded text-xs font-bold ${
                      post.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {post.status}
                    </span>
                  )}
                  <p className="text-slate-700 whitespace-pre-wrap line-clamp-6">{post.body}</p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {post.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-indigo-50 text-primary rounded text-sm">#{tag}</span>
                    ))}
                  </div>
                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={() => handleLike(post._id)}
                      className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${post.isLiked ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-800'}`}
                    >
                      <FiHeart /> {post.likeCount}
                    </button>
                    <button
                      onClick={() => handleShare(post)}
                      className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 bg-slate-100 text-slate-800"
                    >
                      <FiShare2 /> Share
                    </button>
                    {(isAdmin || post.author?._id === user?.id || post.author?._id === user?._id) && (
                      <button
                        onClick={() => handleDeletePost(post._id)}
                        className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 bg-rose-50 text-rose-700"
                      >
                        <FiTrash2 /> Delete
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </main>

          <aside className="panel rounded-lg p-4 h-fit">
            <h2 className="font-bold text-slate-950 mb-4 flex items-center gap-2"><FiEdit3 /> Create Post</h2>
            <div className="space-y-3">
              <input
                value={postForm.title}
                onChange={(e) => setPostForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Post title"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus-ring"
              />
              <input
                value={postForm.coverImage}
                onChange={(e) => setPostForm(prev => ({ ...prev, coverImage: e.target.value }))}
                placeholder="Cover image URL"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus-ring"
              />
              <input
                value={postForm.tags}
                onChange={(e) => setPostForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="Tags: mongodb, atlas"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus-ring"
              />
              <textarea
                rows="10"
                value={postForm.body}
                onChange={(e) => setPostForm(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Write your blog..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus-ring"
              />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleCreatePost('draft')} className="px-4 py-2 bg-slate-100 text-slate-800 rounded-lg font-bold">
                  Save Draft
                </button>
                <button onClick={() => handleCreatePost('published')} className="px-4 py-2 bg-slate-950 text-white rounded-lg font-bold">
                  Publish
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
