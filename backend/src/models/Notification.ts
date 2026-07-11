import mongoose, { Schema, Document } from 'mongoose'

export interface INotification extends Document {
  workspaceId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  type: string
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: Date
}

const NotificationSchema = new Schema<INotification>({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String },
  read: { type: Boolean, default: false },
}, { timestamps: true })

NotificationSchema.index({ workspaceId: 1, userId: 1, read: 1, createdAt: -1 })

export default mongoose.model<INotification>('Notification', NotificationSchema)