import api from './axios'

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (name: string, email: string, password: string, workspaceName: string) =>
    api.post('/auth/register', { name, email, password, workspaceName }),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  verifyOtp: (email: string, otp: string) =>
    api.post('/auth/verify-otp', { email, otp }),

  resetPassword: (email: string, otp: string, newPassword: string) =>
    api.post('/auth/reset-password', { email, otp, newPassword }),

  logout: () => api.post('/auth/logout'),

  acceptInvite: (token: string, password: string) =>
    api.post(`/workspace/accept-invite/${token}`, { password })
}