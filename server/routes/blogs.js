import express from 'express';
import * as blogController from '../controllers/blogController.js';
import { authenticateToken, adminOnly } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/', authenticateToken, blogController.getFeed);
router.get('/admin/all', authenticateToken, adminOnly, blogController.getAdminPosts);
router.get('/me', authenticateToken, blogController.getMyPosts);
router.get('/profile/me', authenticateToken, blogController.getBlogProfile);
router.put('/profile/me', authenticateToken, blogController.updateBlogProfile);
router.post('/upload-image', authenticateToken, upload.single('image'), blogController.uploadBlogImage);
router.post('/', authenticateToken, blogController.createPost);
router.put('/:postId', authenticateToken, blogController.updatePost);
router.delete('/:postId', authenticateToken, blogController.deletePost);
router.patch('/:postId/like', authenticateToken, blogController.toggleLike);
router.patch('/:postId/share', authenticateToken, blogController.recordShare);
// IMPORTANT: Search route must come BEFORE :userId routes to avoid being caught by the :userId parameter
router.get('/users/search', authenticateToken, blogController.searchUsers);
router.get('/users/:userId/profile', authenticateToken, blogController.getUserProfile);
router.get('/users/:userId/posts', authenticateToken, blogController.getUserPosts);
router.patch('/users/:userId/follow', authenticateToken, blogController.toggleFollow);
router.delete('/users/:userId', authenticateToken, adminOnly, blogController.deleteUser);

export default router;
