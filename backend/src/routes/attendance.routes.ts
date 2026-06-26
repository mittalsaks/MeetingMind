import express from 'express'
import { markAttendance, getAttendance } from '../controllers/attendance.controller'
import { protect, adminOnly } from '../middleware/auth'
import { workspaceIsolation } from '../middleware/roleCheck'

const router = express.Router()

router.use(protect, workspaceIsolation)
router.post('/mark', adminOnly, markAttendance)
router.get('/', getAttendance)

export default router