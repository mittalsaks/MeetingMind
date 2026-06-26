import api from './axios'

export const workspaceApi = {
  inviteStudent: (name: string, email: string) =>
    api.post('/workspace/invite', { name, email }),

  getStudents: () =>
    api.get('/workspace/students'),

  deactivateStudent: (id: string) =>
    api.delete(`/workspace/students/${id}`)
}