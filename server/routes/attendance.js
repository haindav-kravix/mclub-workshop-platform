import express from 'express';
import * as attendanceController from '../controllers/attendanceController.js';
import { authenticateToken, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/workshop/:workshopId/roster', authenticateToken, adminOnly, attendanceController.getAttendanceRoster);
router.post('/workshop/:workshopId', authenticateToken, adminOnly, attendanceController.submitAttendance);
router.get('/workshop/:workshopId/reports', authenticateToken, adminOnly, attendanceController.getAttendanceReports);
router.get('/workshop/:workshopId/qr-session', authenticateToken, adminOnly, attendanceController.getQrSession);
router.patch('/workshop/:workshopId/qr-session', authenticateToken, adminOnly, attendanceController.setQrSession);
router.post('/workshop/:workshopId/qr-check-in', authenticateToken, attendanceController.qrCheckIn);

export default router;
