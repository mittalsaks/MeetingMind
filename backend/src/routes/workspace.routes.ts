import express from 'express'
import { inviteStudent, acceptInvite, getStudents, deactivateStudent, getWorkspace, updateWorkspace } from '../controllers/workspace.controller'
import { protect, adminOnly } from '../middleware/auth'
import { workspaceIsolation } from '../middleware/roleCheck'

const router = express.Router()

router.post('/accept-invite/:token', acceptInvite)

router.use(protect, workspaceIsolation)
router.get('/', adminOnly, getWorkspace)
router.put('/', adminOnly, updateWorkspace)
router.post('/invite', adminOnly, inviteStudent)
router.get('/students', adminOnly, getStudents)
router.delete('/students/:id', adminOnly, deactivateStudent)

export default router