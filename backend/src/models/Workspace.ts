import mongoose, { Schema, Document } from 'mongoose'

export interface IWorkspace extends Document {
  name: string
  adminId: mongoose.Types.ObjectId
  inviteCode: string
  url: string
  timezone: string
  weekStart: 'Monday' | 'Sunday'
  meetingSchedule: {
    dayOfWeek: string
    time: string
    googleMeetLink: string
    isActive: boolean
  }
  createdAt: Date
}

const WorkspaceSchema = new Schema<IWorkspace>({
  name: { type: String, required: true, trim: true },
  adminId: { type: Schema.Types.ObjectId, ref: 'User' },
  inviteCode: { type: String, unique: true },
  url: { type: String, trim: true },
  timezone: { type: String, default: 'Asia/Kolkata' },
  weekStart: { type: String, enum: ['Monday', 'Sunday'], default: 'Monday' },
  meetingSchedule: {
    dayOfWeek: { type: String, default: 'Thursday' },
    time: { type: String, default: '18:00' },
    googleMeetLink: { type: String },
    isActive: { type: Boolean, default: true }
  }
}, { timestamps: true })

export default mongoose.model<IWorkspace>('Workspace', WorkspaceSchema)
