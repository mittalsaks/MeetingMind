import mongoose, { Schema, Document } from 'mongoose'

export interface IMeeting extends Document {
  workspaceId: mongoose.Types.ObjectId
  scheduledDate: Date
  scheduledTime: string
  googleMeetLink?: string
  status: 'scheduled' | 'confirmed' | 'rescheduled' | 'completed' | 'cancelled'
  adminConfirmedAt?: Date
  rescheduledTo?: Date
  reminderSent: boolean
  attendanceCount: number
  totalInvited: number
  summary?: string
  createdAt: Date
}

const MeetingSchema = new Schema<IMeeting>({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  scheduledDate: { type: Date, required: true },
  scheduledTime: { type: String, required: true },
  googleMeetLink: { type: String },
  status: { type: String, enum: ['scheduled', 'confirmed', 'rescheduled', 'completed', 'cancelled'], default: 'scheduled' },
  adminConfirmedAt: { type: Date },
  rescheduledTo: { type: Date },
  reminderSent: { type: Boolean, default: false },
  attendanceCount: { type: Number, default: 0 },
  totalInvited: { type: Number, default: 0 },
  summary: { type: String },
}, { timestamps: true })

MeetingSchema.index({ workspaceId: 1, scheduledDate: -1 })

export default mongoose.model<IMeeting>('Meeting', MeetingSchema)