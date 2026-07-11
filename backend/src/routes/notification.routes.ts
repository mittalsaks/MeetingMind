import express from 'express'
import { getNotifications, markAllRead, markNotificationRead } from '../controllers/notification.controller'
import { protect } from '../middleware/auth'
import { workspaceIsolation } from '../middleware/roleCheck'

const router = express.Router()

router.use(protect, workspaceIsolation)
router.get('/', getNotifications)
router.put('/read-all', markAllRead)
router.put('/:id/read', markNotificationRead)

export default router