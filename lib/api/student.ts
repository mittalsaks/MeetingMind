import api from "./axios"
export const studentApi = {
  getTasks: () => api.get("/tasks"),
  getDailyUpdates: () => api.get("/daily-updates"),
  getAttendance: () => api.get("/attendance"),
  getMeetings: () => api.get("/meetings"),
  submitDailyUpdate: (data: { yesterday: string; today: string; blockers?: string}) =>
  api.post("/daily-updates", data),
  markTaskComplete: (id: string) => api.put(`/tasks/${id}/complete`),
}
