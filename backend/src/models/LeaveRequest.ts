import mongoose, { Schema, Document } from 'mongoose'

export interface ILeaveRequest extends Document {
  workspaceId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  reason: string
  fromDate: Date
  toDate: Date
  weekProgress: string
  nextPlan: string
  status: 'pending' | 'approved' | 'rejected'
  adminNote?: string
  reviewedBy?: mongoose.Types.ObjectId
  reviewedAt?: Date
  createdAt: Date
}

const LeaveRequestSchema = new Schema<ILeaveRequest>({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  weekProgress: { type: String, required: true },
  nextPlan: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNote: { type: String },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
}, { timestamps: true })

LeaveRequestSchema.index({ workspaceId: 1, userId: 1 })
LeaveRequestSchema.index({ workspaceId: 1, status: 1 })

export default mongoose.model<ILeaveRequest>('LeaveRequest', LeaveRequestSchema)