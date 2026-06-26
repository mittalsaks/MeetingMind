import mongoose, { Schema, Document } from 'mongoose'

export interface IAttendance extends Document {
  workspaceId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  meetingId: mongoose.Types.ObjectId
  date: Date
  status: 'present' | 'absent' | 'leave_approved'
  markedBy: 'extension' | 'admin'
  verbalUpdateGiven: boolean
  joinedMeeting: boolean
  createdAt: Date
}

const AttendanceSchema = new Schema<IAttendance>({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  meetingId: { type: Schema.Types.ObjectId, ref: 'Meeting', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['present', 'absent', 'leave_approved'], default: 'absent' },
  markedBy: { type: String, enum: ['extension', 'admin'], default: 'admin' },
  verbalUpdateGiven: { type: Boolean, default: false },
  joinedMeeting: { type: Boolean, default: false },
}, { timestamps: true })

AttendanceSchema.index({ workspaceId: 1, userId: 1, date: 1 })
AttendanceSchema.index({ workspaceId: 1, meetingId: 1 })

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema)