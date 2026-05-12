import express from 'express';
import * as blogController from '../controllers/blogController.js';
import { authenticateToken, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, blogController.getFeed);
router.get('/admin/all', authenticateToken, adminOnly, blogController.getAdminPosts);
router.get('/me', authenticateToken, blogController.getMyPosts);
router.post('/', authenticateToken, blogController.createPost);
router.put('/:postId', authenticateToken, blogController.updatePost);
router.delete('/:postId', authenticateToken, blogController.deletePost);
router.patch('/:postId/like', authenticateToken, blogController.toggleLike);
router.patch('/:postId/share', authenticateToken, blogController.recordShare);
router.get('/users/search', authenticateToken, blogController.searchUsers);
router.patch('/users/:userId/follow', authenticateToken, blogController.toggleFollow);
router.delete('/users/:userId', authenticateToken, adminOnly, blogController.deleteUser);

export default router;
