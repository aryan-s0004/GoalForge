import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (email, password) => api.post('/auth/login', { email, password });
export const register = (data) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');
export const getHealth = () => api.get('/health');

// Goals
export const getGoals = () => api.get('/goals');
export const createGoal = (data) => api.post('/goals', data);
export const updateGoal = (id, data) => api.put(`/goals/${id}`, data);
export const submitGoals = () => api.post('/goals/submit');

// Approvals
export const getPendingApprovals = () => api.get('/approvals/pending');
export const approveGoal = (id) => api.put(`/approvals/${id}/approve`);
export const rejectGoal = (id, feedback) => api.put(`/approvals/${id}/reject`, { feedback });
export const editGoalBeforeApprove = (id, data) => api.put(`/approvals/${id}/edit`, data);

// Check-ins
export const getCheckinsForGoal = (goalId) => api.get(`/checkins/goal/${goalId}`);
export const createCheckin = (goalId, achievement) => api.post(`/checkins/goal/${goalId}`, { achievement });
export const addCheckinComment = (checkinId, comment) => api.put(`/checkins/${checkinId}/comment`, { comment });

// Notifications
export const getNotifications = () => api.get('/notifications');
export const markNotificationsAsRead = () => api.post('/notifications/read');

// Admin & Escalations
export const createSharedGoal = (data) => api.post('/admin/shared-goal', data);
export const getSharedGoals = () => api.get('/admin/shared-goals');
export const getAdminGoals = () => api.get('/admin/goals');
export const unlockGoal = (id) => api.put(`/admin/goals/${id}/unlock`);
export const getAuditLogs = () => api.get('/admin/audit-logs');
export const getUsers = () => api.get('/admin/users');
export const getEscalations = () => api.get('/admin/escalations');
export const resolveEscalation = (id) => api.put(`/admin/escalations/${id}/resolve`);
export const triggerMockEscalation = () => api.post('/admin/escalations/trigger');
export const resetDemoData = () => api.post('/admin/reset-demo');

export default api;
