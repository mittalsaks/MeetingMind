import api from "./axios"

export const adminApi = {
  // Daily updates
  getDailyUpdates: () => api.get("/daily-updates"),

  // Stats
  getStats: () => api.get("/admin/stats"),

  // Leave requests
    getLeaveRequests: () => api.get("/leave-requests"),


  // Students
  getStudents: () => api.get("/workspace/students"),

  // Meetings
  getMeetings: () => api.get("/meetings"),
}