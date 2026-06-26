import mongoose, { Schema, Document } from 'mongoose'

export interface IDailyUpdate extends Document {
  workspaceId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  date: Date
  yesterday: string
  today: string
  blockers?: string
  reminderSent: boolean
  createdAt: Date
}

const DailyUpdateSchema = new Schema<IDailyUpdate>({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  yesterday: { type: String, required: true },
  today: { type: String, required: true },
  blockers: { type: String },
  reminderSent: { type: Boolean, default: false },
}, { timestamps: true })

DailyUpdateSchema.index({ workspaceId: 1, userId: 1, date: 1 }, { unique: true })

export default mongoose.model<IDailyUpdate>('DailyUpdate', DailyUpdateSchema)