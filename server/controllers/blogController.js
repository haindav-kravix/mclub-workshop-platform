import BlogPost from '../models/BlogPost.js';
import BlogNotification from '../models/BlogNotification.js';
import User from '../models/User.js';

const serializePost = (post, viewerId = null) => {
  const likeIds = (post.likes || []).map(id => id.toString());
  return {
    ...post.toObject(),
    likeCount: likeIds.length,
    isLiked: viewerId ? likeIds.includes(viewerId) : false
  };
};

const serializeProfile = (user) => {
  const profile = user.toObject();
  return {
    ...profile,
    id: profile._id.toString(),
    followerCount: user.followers.length,
    followingCount: user.following.length
  };
};

const createBlogNotification = async ({ recipient, actor, type, post = null }) => {
  if (!recipient || !actor || recipient.toString() === actor.toString()) return;

  await BlogNotification.findOneAndUpdate(
    {
      recipient,
      actor,
      type,
      ...(post ? { post } : {})
    },
    {
      recipient,
      actor,
      type,
      post,
      read: false,
      createdAt: new Date()
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const serializeNotification = (notification, viewer) => {
  const item = notification.toObject();
  const actorId = item.actor?._id?.toString();
  const isFollowingActor = actorId
    ? (viewer.following || []).some(id => id.toString() === actorId)
    : false;

  return {
    ...item,
    isFollowingActor
  };
};

export const getFeed = async (req, res) => {
  try {
    const posts = await BlogPost.find({ status: 'published' })
      .populate('author', 'name email profilePhoto bio followers')
      .sort({ publishedAt: -1, createdAt: -1 });

    res.json(posts.map(post => serializePost(post, req.user?.id)));
  } catch (error) {
    res.status(500).json({ message: 'Error loading blog feed', error: error.message });
  }
};

export const getAdminPosts = async (req, res) => {
  try {
    const posts = await BlogPost.find({})
      .populate('author', 'name email profilePhoto bio followers')
      .sort({ updatedAt: -1, createdAt: -1 });

    res.json(posts.map(post => serializePost(post, req.user?.id)));
  } catch (error) {
    res.status(500).json({ message: 'Error loading admin blog list', error: error.message });
  }
};

export const getMyPosts = async (req, res) => {
  try {
    const posts = await BlogPost.find({ author: req.user.id })
      .populate('author', 'name email profilePhoto bio followers')
      .sort({ updatedAt: -1 });

    res.json(posts.map(post => serializePost(post, req.user.id)));
  } catch (error) {
    res.status(500).json({ message: 'Error loading your posts', error: error.message });
  }
};

export const getBlogProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('followers', 'name email profilePhoto bio')
      .populate('following', 'name email profilePhoto bio')
      .select('name email profilePhoto bio followers following');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(serializeProfile(user));
  } catch (error) {
    res.status(500).json({ message: 'Error loading blog profile', error: error.message });
  }
};

export const updateBlogProfile = async (req, res) => {
  try {
    const updates = {};
    if (req.body.bio !== undefined) {
      updates.bio = String(req.body.bio).slice(0, 280);
    }
    if (req.body.profilePhoto !== undefined) {
      updates.profilePhoto = String(req.body.profilePhoto);
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true }
    ).populate('followers', 'name email profilePhoto bio')
      .populate('following', 'name email profilePhoto bio')
      .select('name email profilePhoto bio followers following');

    res.json({
      success: true,
      profile: serializeProfile(user)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating blog profile', error: error.message });
  }
};

export const uploadBlogImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image is required' });
    }
    res.json({
      success: true,
      imageUrl: `/uploads/${req.file.filename}`
    });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading image', error: error.message });
  }
};

export const createPost = async (req, res) => {
  try {
    const { title, body, tags = [], status = 'draft', coverImage = '' } = req.body;
    const post = new BlogPost({
      title,
      body,
      tags: Array.isArray(tags) ? tags : String(tags).split(',').map(tag => tag.trim()).filter(Boolean),
      status,
      coverImage,
      author: req.user.id,
      publishedAt: status === 'published' ? new Date() : undefined
    });

    await post.save();
    await post.populate('author', 'name email profilePhoto bio followers');
    res.status(201).json({ success: true, post: serializePost(post, req.user.id) });
  } catch (error) {
    res.status(500).json({ message: 'Error creating post', error: error.message });
  }
};

export const updatePost = async (req, res) => {
  try {
    const post = await BlogPost.findOne({ _id: req.params.postId, author: req.user.id });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const { title, body, tags, status, coverImage } = req.body;
    if (title !== undefined) post.title = title;
    if (body !== undefined) post.body = body;
    if (coverImage !== undefined) post.coverImage = coverImage;
    if (tags !== undefined) {
      post.tags = Array.isArray(tags) ? tags : String(tags).split(',').map(tag => tag.trim()).filter(Boolean);
    }
    if (status !== undefined) {
      post.status = status;
      if (status === 'published' && !post.publishedAt) post.publishedAt = new Date();
    }
    post.updatedAt = new Date();
    await post.save();
    await post.populate('author', 'name email profilePhoto bio followers');

    res.json({ success: true, post: serializePost(post, req.user.id) });
  } catch (error) {
    res.status(500).json({ message: 'Error updating post', error: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const query = req.user.isAdmin
      ? { _id: req.params.postId }
      : { _id: req.params.postId, author: req.user.id };
    const post = await BlogPost.findOneAndDelete(query);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting post', error: error.message });
  }
};

export const toggleLike = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.postId);
    if (!post || post.status !== 'published') {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user.id;
    const alreadyLiked = post.likes.some(id => id.toString() === userId);
    post.likes = alreadyLiked
      ? post.likes.filter(id => id.toString() !== userId)
      : [...post.likes, userId];
    post.updatedAt = new Date();
    await post.save();

    if (!alreadyLiked) {
      await createBlogNotification({
        recipient: post.author,
        actor: userId,
        type: 'like',
        post: post._id
      });
    }

    await post.populate('author', 'name email profilePhoto bio followers');

    res.json({ success: true, post: serializePost(post, userId) });
  } catch (error) {
    res.status(500).json({ message: 'Error updating like', error: error.message });
  }
};

export const recordShare = async (req, res) => {
  try {
    const post = await BlogPost.findByIdAndUpdate(
      req.params.postId,
      { $inc: { shares: 1 }, updatedAt: new Date() },
      { new: true }
    ).populate('author', 'name email profilePhoto bio followers');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json({ success: true, post: serializePost(post, req.user?.id) });
  } catch (error) {
    res.status(500).json({ message: 'Error recording share', error: error.message });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const query = String(req.query.q || '').trim();
    if (!query) {
      return res.json([]);
    }

    const users = await User.find({
      _id: { $ne: req.user.id },
      $or: [
        { name: new RegExp(query, 'i') },
        { email: new RegExp(query, 'i') }
      ]
    }).select('_id name email profilePhoto bio followers following').limit(20);

    res.json(users.map(user => {
      const isFollowing = user.followers && user.followers.some(id => id.toString() === req.user.id);
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePhoto: user.profilePhoto,
        bio: user.bio,
        isFollowing: isFollowing || false,
        followerCount: user.followers ? user.followers.length : 0
      };
    }));
  } catch (error) {
    res.status(500).json({ message: 'Error searching users', error: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId)
      .populate('followers', 'name email profilePhoto bio')
      .populate('following', 'name email profilePhoto bio')
      .select('name email profilePhoto bio followers following');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if current user is following this user
    const isFollowing = user.followers.some(follower => follower._id.toString() === req.user.id);
    
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePhoto: user.profilePhoto,
      bio: user.bio,
      followers: user.followers,
      following: user.following,
      isFollowing,
      followerCount: user.followers.length,
      followingCount: user.following.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error loading user profile', error: error.message });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const userId = req.params.userId;
    const posts = await BlogPost.find({ author: userId, status: 'published' })
      .populate('author', 'name email profilePhoto bio followers')
      .sort({ publishedAt: -1, createdAt: -1 });

    res.json(posts.map(post => serializePost(post, req.user?.id)));
  } catch (error) {
    res.status(500).json({ message: 'Error loading user posts', error: error.message });
  }
};

export const toggleFollow = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    if (targetUserId === req.user.id) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const target = await User.findById(targetUserId);
    const current = await User.findById(req.user.id);
    if (!target || !current) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isFollowing = current.following.some(id => id.toString() === targetUserId);
    if (isFollowing) {
      current.following = current.following.filter(id => id.toString() !== targetUserId);
      target.followers = target.followers.filter(id => id.toString() !== req.user.id);
    } else {
      current.following.push(targetUserId);
      target.followers.push(req.user.id);
      await createBlogNotification({
        recipient: targetUserId,
        actor: req.user.id,
        type: 'follow'
      });
    }

    await current.save();
    await target.save();

    res.json({
      success: true,
      isFollowing: !isFollowing,
      followerCount: target.followers.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating follow status', error: error.message });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const viewer = await User.findById(req.user.id).select('following');
    const notifications = await BlogNotification.find({ recipient: req.user.id })
      .populate('actor', 'name email profilePhoto followers following')
      .populate('post', 'title')
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await BlogNotification.countDocuments({
      recipient: req.user.id,
      read: false
    });

    res.json({
      notifications: notifications.map(notification => serializeNotification(notification, viewer)),
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Error loading notifications', error: error.message });
  }
};

export const markNotificationsRead = async (req, res) => {
  try {
    await BlogNotification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error updating notifications', error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    if (targetUserId === req.user.id) {
      return res.status(400).json({ message: 'Admins cannot delete their own account here' });
    }

    const target = await User.findByIdAndDelete(targetUserId);
    if (!target) {
      return res.status(404).json({ message: 'User not found' });
    }

    await BlogPost.deleteMany({ author: targetUserId });
    await User.updateMany({}, {
      $pull: {
        followers: targetUserId,
        following: targetUserId
      }
    });

    res.json({ success: true, message: 'User and their blogs deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};
