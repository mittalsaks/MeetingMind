import express from 'express'
import { submitUpdate, getUpdates } from '../controllers/dailyUpdate.controller'
import { protect } from '../middleware/auth'
import { workspaceIsolation } from '../middleware/roleCheck'

const router = express.Router()

router.use(protect, workspaceIsolation)
router.post('/', submitUpdate)
router.get('/', getUpdates)

export default router