import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const login = (email) => api.post('/auth/login', { email });
export const getGoals = () => api.get('/goals');
export const createGoal = (data) => api.post('/goals', data);
export const updateGoal = (id, data) => api.put(`/goals/${id}`, data);
export const submitGoals = () => api.post('/goals/submit');
export const getPendingApprovals = () => api.get('/approvals/pending');
export const approveGoal = (id) => api.put(`/approvals/${id}/approve`);
export const rejectGoal = (id, feedback) => api.put(`/approvals/${id}/reject`, { feedback });
export const editGoalBeforeApprove = (id, data) => api.put(`/approvals/${id}/edit`, data);
export const createSharedGoal = (data) => api.post('/admin/shared-goal', data);
export const getAdminGoals = () => api.get('/admin/goals');
export const unlockGoal = (id) => api.put(`/admin/goals/${id}/unlock`);
export const getAuditLogs = () => api.get('/admin/audit-logs');
export const getUsers = () => api.get('/admin/users');

export default api;
