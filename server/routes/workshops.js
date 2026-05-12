import express from 'express';
import * as workshopController from '../controllers/workshopController.js';
import { authenticateToken, adminOnly } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/', workshopController.getAllWorkshops);

// Admin routes
router.post('/', authenticateToken, adminOnly, upload.single('coverImage'), workshopController.createWorkshop);
router.get('/admin/my-workshops', authenticateToken, adminOnly, workshopController.getAdminWorkshops);
router.put('/:id', authenticateToken, adminOnly, upload.single('coverImage'), workshopController.updateWorkshop);
router.delete('/:id', authenticateToken, adminOnly, workshopController.deleteWorkshop);
router.patch('/:id/toggle', authenticateToken, adminOnly, workshopController.toggleWorkshopStatus);
router.patch('/:id/registrations/toggle', authenticateToken, adminOnly, workshopController.toggleRegistrationStatus);
router.patch('/:id/stop/toggle', authenticateToken, adminOnly, workshopController.toggleStoppedStatus);

router.get('/:id', workshopController.getWorkshopById);

export default router;
