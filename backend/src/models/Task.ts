import mongoose, { Schema, Document } from 'mongoose'

export interface ITask extends Document {
  workspaceId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  title: string
  description?: string
  source: 'meeting' | 'manual'
  deadline?: Date
  status: 'pending' | 'waiting_verification' | 'verified' | 'rejected'
  submittedAt?: Date
  verifiedAt?: Date
  verifiedBy?: mongoose.Types.ObjectId
  meetingId?: mongoose.Types.ObjectId
  priority: 'Low' | 'Medium' | 'High'
  createdAt: Date
}

const TaskSchema = new Schema<ITask>({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String },
  source: { type: String, enum: ['meeting', 'manual'], default: 'manual' },
  deadline: { type: Date },
  status: { type: String, enum: ['pending', 'waiting_verification', 'verified', 'rejected'], default: 'pending' },
  submittedAt: { type: Date },
  verifiedAt: { type: Date },
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  meetingId: { type: Schema.Types.ObjectId, ref: 'Meeting' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
}, { timestamps: true })

TaskSchema.index({ workspaceId: 1, userId: 1 })
TaskSchema.index({ workspaceId: 1, status: 1 })

export default mongoose.model<ITask>('Task', TaskSchema)