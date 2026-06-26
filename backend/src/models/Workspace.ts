import mongoose, { Schema, Document } from 'mongoose'

export interface IWorkspace extends Document {
  name: string
  adminId: mongoose.Types.ObjectId
  inviteCode: string
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
  meetingSchedule: {
    dayOfWeek: { type: String, default: 'Thursday' },
    time: { type: String, default: '18:00' },
    googleMeetLink: { type: String },
    isActive: { type: Boolean, default: true }
  }
}, { timestamps: true })

export default mongoose.model<IWorkspace>('Workspace', WorkspaceSchema)
