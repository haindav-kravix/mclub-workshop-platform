import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import sharp from 'sharp';
import Achievement from '../models/Achievement.js';

const imageCacheDir = path.join('/tmp', 'mclub-highlight-cache');

if (!fs.existsSync(imageCacheDir)) {
  fs.mkdirSync(imageCacheDir, { recursive: true });
}

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

const ACHIEVEMENT_CATEGORIES = new Set(['Community', 'Workshops', 'Internships', 'Certifications', 'Events', 'Media', 'Highlights']);

const parseCategory = (value) => {
  const category = String(value || '').trim();
  return ACHIEVEMENT_CATEGORIES.has(category) ? category : 'Highlights';
};

const clampImageWidth = (value) => {
  const requested = Number(value || 0);
  if (!Number.isFinite(requested) || requested <= 0) return 1400;
  return Math.max(320, Math.min(2000, Math.round(requested)));
};

const canOptimizeImage = (mimeType = '') => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'].includes(mimeType);

const toImageBuffer = (data) => {
  if (!data) return null;
  if (Buffer.isBuffer(data)) return data;
  if (data.buffer) return Buffer.from(data.buffer);
  if (data.$binary?.base64) return Buffer.from(data.$binary.base64, 'base64');
  return null;
};

const highlightCacheKey = (id, index, width, updatedAt = '') => crypto
  .createHash('sha1')
  .update(String(id))
  .update(String(index))
  .update(String(width))
  .update(String(updatedAt))
  .digest('hex');

const serializeAchievement = (achievement, req) => {
  const data = typeof achievement.toObject === 'function' ? achievement.toObject() : achievement;
  return {
    ...data,
    images: (data.images || []).map((_, index) => `/media/highlights/${data._id}/${index}`),
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
    const imageIndex = Number(req.params.index);
    if (!Number.isInteger(imageIndex) || imageIndex < 0) {
      return res.status(404).json({ message: 'Achievement image not found' });
    }
    const width = clampImageWidth(req.query.w);
    const metadata = await Achievement.findOne(
      { _id: req.params.id, isPublished: true },
      { isPublished: 1, updatedAt: 1, 'images.mimeType': 1, 'images.name': 1 }
    ).lean();
    const imageMeta = metadata?.images?.[imageIndex];
    if (!metadata || !metadata.isPublished || !imageMeta) {
      return res.status(404).json({ message: 'Achievement image not found' });
    }
    const etag = highlightCacheKey(req.params.id, imageIndex, width, metadata.updatedAt);
    const cachePath = path.join(imageCacheDir, `${etag}.webp`);
    res.setHeader('ETag', `"${etag}"`);
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    if (req.headers['if-none-match'] === `"${etag}"`) return res.status(304).end();

    if (fs.existsSync(cachePath)) {
      const cached = fs.readFileSync(cachePath);
      res.setHeader('Content-Type', 'image/webp');
      res.setHeader('Content-Length', String(cached.length));
      return res.send(cached);
    }

    const achievement = await Achievement.findOne(
      { _id: req.params.id, isPublished: true },
      { images: { $slice: [imageIndex, 1] }, isPublished: 1 }
    ).lean();
    const image = achievement?.images?.[0];
    const imageBuffer = toImageBuffer(image.data);
    if (!imageBuffer) return res.status(404).json({ message: 'Achievement image not found' });

    if (canOptimizeImage(image.mimeType)) {
      try {
        const optimized = await sharp(imageBuffer, { limitInputPixels: 80_000_000 })
          .rotate()
          .resize({ width, height: Math.round(width * 1.2), fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 78, effort: 4 })
          .toBuffer();
        fs.writeFile(cachePath, optimized, () => {});
        res.setHeader('Content-Type', 'image/webp');
        res.setHeader('Content-Length', String(optimized.length));
        return res.send(optimized);
      } catch (error) {
        console.warn('Achievement image optimization failed:', error.message);
      }
    }

    res.setHeader('Content-Type', image.mimeType);
    res.setHeader('Content-Length', String(imageBuffer.length));
    res.send(imageBuffer);
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
      category: parseCategory(req.body.category),
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
    if (req.body.category !== undefined) achievement.category = parseCategory(req.body.category);
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
