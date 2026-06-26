import express from 'express'
import { createMeeting, getMeetings, getTodayActiveMeeting, confirmMeeting, rescheduleMeeting, processTranscript } from '../controllers/meeting.controller'
import { protect, adminOnly } from '../middleware/auth'
import { workspaceIsolation } from '../middleware/roleCheck'
import { processAudioChunk, processTranscriptChunk } from '../controllers/audioTranscript.controller'
const router = express.Router()

router.use(protect, workspaceIsolation)
router.post('/', adminOnly, createMeeting)
router.get('/', getMeetings)
router.get('/today-active', adminOnly, getTodayActiveMeeting)
router.post('/:id/process-audio-chunk', adminOnly, processAudioChunk)
router.post('/:id/process-transcript-chunk', adminOnly, processTranscriptChunk)
router.put('/:id/confirm', adminOnly, confirmMeeting)
router.put('/:id/reschedule', adminOnly, rescheduleMeeting)
router.post('/:id/process-transcript', adminOnly, processTranscript)

export default router