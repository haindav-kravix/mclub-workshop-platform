import express from 'express';
import * as attendanceController from '../controllers/attendanceController.js';
import { authenticateToken, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/workshop/:workshopId/roster', authenticateToken, adminOnly, attendanceController.getAttendanceRoster);
router.post('/workshop/:workshopId', authenticateToken, adminOnly, attendanceController.submitAttendance);
router.post('/workshop/:workshopId/from-entry', authenticateToken, adminOnly, attendanceController.postEntryAttendance);
router.get('/workshop/:workshopId/reports', authenticateToken, adminOnly, attendanceController.getAttendanceReports);
router.delete('/workshop/:workshopId/reports/day', authenticateToken, adminOnly, attendanceController.resetAttendanceDay);
router.get('/workshop/:workshopId/reports/day/export', authenticateToken, adminOnly, attendanceController.exportDailyAttendance);
router.get('/workshop/:workshopId/reports/export', authenticateToken, adminOnly, attendanceController.exportOverallAttendance);
router.get('/workshop/:workshopId/qr-session', authenticateToken, adminOnly, attendanceController.getQrSession);
router.patch('/workshop/:workshopId/qr-session', authenticateToken, adminOnly, attendanceController.setQrSession);
router.post('/workshop/:workshopId/qr-check-in', authenticateToken, attendanceController.qrCheckIn);

export default router;
