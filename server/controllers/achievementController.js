import fs from 'fs';
import Achievement from '../models/Achievement.js';

const readAndRemoveFile = (file) => {
  const data = fs.readFileSync(file.path);
  fs.unlink(file.path, () => {});
  return {
    data,
    mimeType: file.mimetype,
    name: file.originalname || 'achievement-image'
  };
};

const cleanupFiles = (files = []) => files.forEach(file => {
  if (file?.path) fs.unlink(file.path, () => {});
});

const parseLinks = (value) => {
  if (!value) return [];
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(link => ({ label: String(link?.label || '').trim(), url: String(link?.url || '').trim() }))
      .filter(link => link.label && /^https?:\/\//i.test(link.url));
  } catch {
    return [];
  }
};

const serializeAchievement = (achievement, req) => {
  const data = typeof achievement.toObject === 'function' ? achievement.toObject() : achievement;
  return {
    ...data,
    images: (data.images || []).map((_, index) => `/api/achievements/${data._id}/images/${index}`),
    imageCount: data.images?.length || 0
  };
};

export const getPublishedAchievements = async (req, res) => {
  try {
    const achievements = await Achievement.find({ isPublished: true })
      .select('-images.data')
      .sort({ achievedOn: -1, createdAt: -1 })
      .lean();
    res.json(achievements.map(item => serializeAchievement(item, req)));
  } catch (error) {
    res.status(500).json({ message: 'Unable to load achievements', error: error.message });
  }
};

export const getAdminAchievements = async (req, res) => {
  try {
    const achievements = await Achievement.find({})
      .select('-images.data')
      .populate('createdBy', 'name email')
      .sort({ achievedOn: -1, createdAt: -1 })
      .lean();
    res.json(achievements.map(item => serializeAchievement(item, req)));
  } catch (error) {
    res.status(500).json({ message: 'Unable to load achievements', error: error.message });
  }
};

export const getAchievementImage = async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id).select('images isPublished');
    const image = achievement?.images?.[Number(req.params.index)];
    if (!achievement || !achievement.isPublished || !image) {
      return res.status(404).json({ message: 'Achievement image not found' });
    }
    res.setHeader('Content-Type', image.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(image.data);
  } catch (error) {
    res.status(404).json({ message: 'Achievement image not found' });
  }
};

export const createAchievement = async (req, res) => {
  try {
    const { title, summary, achievedOn, isPublished } = req.body;
    if (!title?.trim() || !summary?.trim() || !achievedOn) {
      cleanupFiles(req.files);
      return res.status(400).json({ message: 'Title, description, and achievement date are required' });
    }
    if (!req.files?.length) {
      return res.status(400).json({ message: 'Add at least one achievement image' });
    }
    const totalSize = req.files.reduce((sum, file) => sum + (file.size || 0), 0);
    if (totalSize > 12 * 1024 * 1024) {
      cleanupFiles(req.files);
      return res.status(400).json({ message: 'Achievement images must be under 12 MB in total' });
    }
    const achievement = await Achievement.create({
      title: title.trim(),
      summary: summary.trim(),
      achievedOn,
      links: parseLinks(req.body.links),
      images: req.files.map(readAndRemoveFile),
      isPublished: String(isPublished) !== 'false',
      createdBy: req.user.id
    });
    res.status(201).json({ success: true, achievement: serializeAchievement(achievement, req) });
  } catch (error) {
    cleanupFiles(req.files);
    res.status(500).json({ message: 'Unable to create achievement', error: error.message });
  }
};

export const updateAchievement = async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id);
    if (!achievement) {
      cleanupFiles(req.files);
      return res.status(404).json({ message: 'Achievement not found' });
    }
    const totalSize = (req.files || []).reduce((sum, file) => sum + (file.size || 0), 0);
    if (totalSize > 12 * 1024 * 1024) {
      cleanupFiles(req.files);
      return res.status(400).json({ message: 'Achievement images must be under 12 MB in total' });
    }
    if (req.body.title !== undefined) achievement.title = req.body.title.trim();
    if (req.body.summary !== undefined) achievement.summary = req.body.summary.trim();
    if (req.body.achievedOn) achievement.achievedOn = req.body.achievedOn;
    if (req.body.links !== undefined) achievement.links = parseLinks(req.body.links);
    if (req.body.isPublished !== undefined) achievement.isPublished = String(req.body.isPublished) !== 'false';
    if (req.files?.length) achievement.images = req.files.map(readAndRemoveFile);
    await achievement.save();
    res.json({ success: true, achievement: serializeAchievement(achievement, req) });
  } catch (error) {
    cleanupFiles(req.files);
    res.status(500).json({ message: 'Unable to update achievement', error: error.message });
  }
};

export const deleteAchievement = async (req, res) => {
  try {
    const achievement = await Achievement.findByIdAndDelete(req.params.id);
    if (!achievement) return res.status(404).json({ message: 'Achievement not found' });
    res.json({ success: true, message: 'Achievement deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete achievement', error: error.message });
  }
};
