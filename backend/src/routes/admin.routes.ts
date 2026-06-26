import express from 'express'
import { getAdminStats, getMissedCommitments } from '../controllers/admin.controller'
import { protect, adminOnly } from '../middleware/auth'
import { workspaceIsolation } from '../middleware/roleCheck'
import { sendReminderEmail } from '../controllers/admin.controller'
const router = express.Router()

router.use(protect, adminOnly, workspaceIsolation)

router.get('/stats', getAdminStats)
router.get('/missed-commitments', getMissedCommitments)
router.post('/send-reminder/:userId', sendReminderEmail)
export default router