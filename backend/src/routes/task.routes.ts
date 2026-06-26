import express from 'express'
import { getTasks, createTask, markComplete, verifyTask, rejectTask } from '../controllers/task.controller'
import { protect, adminOnly } from '../middleware/auth'
import { workspaceIsolation } from '../middleware/roleCheck'

const router = express.Router()

router.use(protect, workspaceIsolation)

router.get('/', getTasks)
router.post('/', adminOnly, createTask)
router.put('/:id/complete', markComplete)
router.put('/:id/verify', adminOnly, verifyTask)
router.put('/:id/reject', adminOnly, rejectTask)

export default router