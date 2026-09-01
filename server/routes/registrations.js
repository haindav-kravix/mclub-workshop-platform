import express from 'express';
import * as registrationController from '../controllers/registrationController.js';
import { authenticateToken, adminOnly } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// User routes
router.post('/', authenticateToken, upload.any(), registrationController.registerForWorkshop);
router.get('/my-registrations', authenticateToken, registrationController.getUserRegistrations);
router.delete('/:registrationId', authenticateToken, registrationController.cancelRegistration);

// Admin routes
router.get('/workshop/:workshopId', authenticateToken, adminOnly, registrationController.getWorkshopRegistrations);
router.get('/workshop/:workshopId/export', authenticateToken, adminOnly, registrationController.exportRegistrationsToExcel);
router.get('/workshop/:workshopId/upload/:registrationId/:imageKey', authenticateToken, adminOnly, registrationController.getRegistrationUpload);
router.get('/hackathon/:workshopId/evaluation', authenticateToken, adminOnly, registrationController.getHackathonEvaluation);
router.get('/hackathon/:workshopId/evaluation/export', authenticateToken, adminOnly, registrationController.exportHackathonEvaluation);
router.patch('/hackathon/:workshopId/leaderboard', authenticateToken, adminOnly, registrationController.toggleHackathonLeaderboard);
router.patch('/hackathon/evaluation/:registrationId', authenticateToken, adminOnly, registrationController.updateHackathonEvaluation);
router.get('/hackathon/:workshopId/leaderboard', authenticateToken, registrationController.getHackathonLeaderboard);
router.patch('/admin/:registrationId/status', authenticateToken, adminOnly, registrationController.updateRegistrationStatus);
router.delete('/admin/:registrationId', authenticateToken, adminOnly, registrationController.deleteRegistration);

export default router;
