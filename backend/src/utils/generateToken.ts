import jwt from 'jsonwebtoken'

export const generateAccessToken = (userId: string, role: string, workspaceId: string) => {
  return jwt.sign(
    { userId, role, workspaceId },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  )
}

export const generateRefreshToken = (userId: string) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  )
}