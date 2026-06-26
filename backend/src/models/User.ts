import mongoose, { Schema, Document } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IUser extends Document {
  workspaceId: mongoose.Types.ObjectId
  name: string
  email: string
  password?: string
  googleId?: string
  role: 'admin' | 'user'
  isEmailVerified: boolean
  inviteToken?: string
  inviteAccepted: boolean
  profilePicture?: string
  isActive: boolean
  forgotPasswordToken?: string
  forgotPasswordExpiry?: Date
  refreshToken?: string
  createdAt: Date
  lastLoginAt?: Date
  comparePassword(candidatePassword: string): Promise<boolean>
}

const UserSchema = new Schema<IUser>({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  password: { type: String, select: false },
  googleId: { type: String },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  isEmailVerified: { type: Boolean, default: false },
  inviteToken: { type: String },
  inviteAccepted: { type: Boolean, default: false },
  profilePicture: { type: String },
  isActive: { type: Boolean, default: true },
  forgotPasswordToken: { type: String },
  forgotPasswordExpiry: { type: Date },
  refreshToken: { type: String, select: false },
  lastLoginAt: { type: Date },
}, { timestamps: true })

UserSchema.index({ email: 1, workspaceId: 1 }, { unique: true })

UserSchema.pre('save', async function(this: IUser) {
  if (!this.isModified('password') || !this.password) return
  this.password = await bcrypt.hash(this.password, 12)
})

UserSchema.methods.comparePassword = async function(candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password)
}

export default mongoose.model<IUser>('User', UserSchema)





