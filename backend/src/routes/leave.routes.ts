import express from 'express'
import { submitLeave, getLeaves, reviewLeave } from '../controllers/leave.controller'
import { protect, adminOnly } from '../middleware/auth'
import { workspaceIsolation } from '../middleware/roleCheck'

const router = express.Router()

router.use(protect, workspaceIsolation)
router.post('/', submitLeave)
router.get('/', getLeaves)
router.put('/:id', adminOnly, reviewLeave)

export default router