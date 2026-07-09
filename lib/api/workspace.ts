import api from './axios'

export const workspaceApi = {
  inviteStudent: (name: string, email: string) =>
    api.post('/workspace/invite', { name, email }),

  getStudents: () =>
    api.get('/workspace/students'),

  deactivateStudent: (id: string) =>
    api.delete(`/workspace/students/${id}`),

  getWorkspace: () =>
    api.get('/workspace'),

  updateWorkspace: (data: {
    name: string
    url: string
    timezone: string
    weekStart: string
  }) => api.put('/workspace', data),
}