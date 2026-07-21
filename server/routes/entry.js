import express from 'express';
import { authenticateToken, adminOnly } from '../middleware/auth.js';
import * as entryController from '../controllers/entryController.js';

const router = express.Router();

router.get('/pass/:registrationId', authenticateToken, entryController.getMyEntryPass);
router.get('/admin/workshop/:workshopId', authenticateToken, adminOnly, entryController.getEntryReport);
router.post('/admin/workshop/:workshopId/scan', authenticateToken, adminOnly, entryController.scanEntryPass);
router.get('/admin/workshop/:workshopId/export', authenticateToken, adminOnly, entryController.exportEntryReport);

export default router;
