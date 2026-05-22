import express from 'express';
import * as registrationController from '../controllers/registrationController.js';
import { authenticateToken, adminOnly } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// User routes
router.post('/', authenticateToken, upload.single('paymentScreenshot'), registrationController.registerForWorkshop);
router.get('/my-registrations', authenticateToken, registrationController.getUserRegistrations);
router.delete('/:registrationId', authenticateToken, registrationController.cancelRegistration);

// Admin routes
router.get('/workshop/:workshopId', authenticateToken, adminOnly, registrationController.getWorkshopRegistrations);
router.get('/workshop/:workshopId/export', authenticateToken, adminOnly, registrationController.exportRegistrationsToExcel);
router.patch('/admin/:registrationId/status', authenticateToken, adminOnly, registrationController.updateRegistrationStatus);
router.delete('/admin/:registrationId', authenticateToken, adminOnly, registrationController.deleteRegistration);

export default router;
