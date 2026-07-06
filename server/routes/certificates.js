import express from 'express';
import upload from '../middleware/upload.js';
import { authenticateToken, adminOnly } from '../middleware/auth.js';
import * as certificateController from '../controllers/certificateController.js';

const router = express.Router();

router.get('/my', authenticateToken, certificateController.getMyCertificates);
router.get('/:id/file', authenticateToken, certificateController.getCertificateFile);
router.get('/admin/workshop/:workshopId/setup', authenticateToken, adminOnly, certificateController.getTemplateSetup);
router.put('/admin/workshop/:workshopId/setup', authenticateToken, adminOnly, upload.single('template'), certificateController.saveTemplateSetup);
router.get('/admin/workshop/:workshopId/eligible', authenticateToken, adminOnly, certificateController.getEligibleRecipients);
router.post('/admin/workshop/:workshopId/generate', authenticateToken, adminOnly, certificateController.generateCertificates);

export default router;
