import express from 'express';
import upload from '../middleware/upload.js';
import { authenticateToken, adminOnly } from '../middleware/auth.js';
import * as achievementController from '../controllers/achievementController.js';

const router = express.Router();

router.get('/', achievementController.getPublishedAchievements);
router.get('/:id/images/:index', achievementController.getAchievementImage);
router.get('/admin/all', authenticateToken, adminOnly, achievementController.getAdminAchievements);
router.post('/', authenticateToken, adminOnly, upload.array('images', 4), achievementController.createAchievement);
router.put('/:id', authenticateToken, adminOnly, upload.array('images', 4), achievementController.updateAchievement);
router.delete('/:id', authenticateToken, adminOnly, achievementController.deleteAchievement);

export default router;
