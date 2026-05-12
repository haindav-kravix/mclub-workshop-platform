import BlogPost from '../models/BlogPost.js';
import User from '../models/User.js';

const serializePost = (post, viewerId = null) => {
  const likeIds = (post.likes || []).map(id => id.toString());
  return {
    ...post.toObject(),
    likeCount: likeIds.length,
    isLiked: viewerId ? likeIds.includes(viewerId) : false
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

    res.json({
      ...user.toObject(),
      followerCount: user.followers.length,
      followingCount: user.following.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error loading blog profile', error: error.message });
  }
};

export const updateBlogProfile = async (req, res) => {
  try {
    const { bio = '' } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { bio: bio.slice(0, 280) },
      { new: true }
    ).populate('followers', 'name email profilePhoto bio')
      .populate('following', 'name email profilePhoto bio')
      .select('name email profilePhoto bio followers following');

    res.json({
      success: true,
      profile: {
        ...user.toObject(),
        followerCount: user.followers.length,
        followingCount: user.following.length
      }
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
    const query = req.query.q || '';
    const users = await User.find({
      _id: { $ne: req.user.id },
      $or: [
        { name: new RegExp(query, 'i') },
        { email: new RegExp(query, 'i') }
      ]
    }).select('name email profilePhoto bio followers following').limit(20);

    res.json(users.map(user => ({
      ...user.toObject(),
      isFollowing: user.followers.some(id => id.toString() === req.user.id),
      followerCount: user.followers.length
    })));
  } catch (error) {
    res.status(500).json({ message: 'Error searching users', error: error.message });
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
