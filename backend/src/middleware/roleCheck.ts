import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth'

export const workspaceIsolation = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.workspaceId) {
    return res.status(403).json({ message: 'Workspace access denied' })
  }
  next()
}