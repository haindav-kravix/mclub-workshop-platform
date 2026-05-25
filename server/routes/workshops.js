import express from 'express';
import * as workshopController from '../controllers/workshopController.js';
import { authenticateToken, adminOnly } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();
const workshopImageUpload = upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'qrImage', maxCount: 1 }
]);

// Public routes
router.get('/', workshopController.getAllWorkshops);

// Admin routes
router.post('/', authenticateToken, adminOnly, workshopImageUpload, workshopController.createWorkshop);
router.get('/admin/my-workshops', authenticateToken, adminOnly, workshopController.getAdminWorkshops);
router.get('/admin/:id', authenticateToken, adminOnly, workshopController.getAdminWorkshopById);
router.get('/:id/report', authenticateToken, adminOnly, workshopController.generateWorkshopReport);
router.put('/:id', authenticateToken, adminOnly, workshopImageUpload, workshopController.updateWorkshop);
router.delete('/:id', authenticateToken, adminOnly, workshopController.deleteWorkshop);
router.patch('/:id/toggle', authenticateToken, adminOnly, workshopController.toggleWorkshopStatus);
router.patch('/:id/registrations/toggle', authenticateToken, adminOnly, workshopController.toggleRegistrationStatus);
router.patch('/:id/stop/toggle', authenticateToken, adminOnly, workshopController.toggleStoppedStatus);

router.get('/:id', workshopController.getWorkshopById);

export default router;
