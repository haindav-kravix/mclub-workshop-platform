import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export const resolveMediaUrl = (url) => {
  if (!url || !url.startsWith('/uploads')) return url;
  return `${API_ORIGIN}${url}`;
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    Authorization: `Bearer ${token}`
  };
};

// Workshop API
export const workshopAPI = {
  getAllWorkshops: () => axios.get(`${API_URL}/workshops`),
  getWorkshopById: (id) => axios.get(`${API_URL}/workshops/${id}`),
  getAdminWorkshopById: (id) => axios.get(`${API_URL}/workshops/admin/${id}`, {
    headers: getAuthHeaders()
  }),
  createWorkshop: (data) => axios.post(`${API_URL}/workshops`, data, { 
    headers: getAuthHeaders()
  }),
  updateWorkshop: (id, data) => axios.put(`${API_URL}/workshops/${id}`, data, {
    headers: getAuthHeaders()
  }),
  deleteWorkshop: (id) => axios.delete(`${API_URL}/workshops/${id}`, {
    headers: getAuthHeaders()
  }),
  getAdminWorkshops: () => axios.get(`${API_URL}/workshops/admin/my-workshops`, {
    headers: getAuthHeaders()
  }),
  downloadReport: (id) => axios.get(`${API_URL}/workshops/${id}/report`, {
    headers: getAuthHeaders(),
    responseType: 'blob'
  }),
  toggleWorkshopStatus: (id) => axios.patch(`${API_URL}/workshops/${id}/toggle`, {}, {
    headers: getAuthHeaders()
  }),
  toggleRegistrationStatus: (id) => axios.patch(`${API_URL}/workshops/${id}/registrations/toggle`, {}, {
    headers: getAuthHeaders()
  }),
  toggleStoppedStatus: (id) => axios.patch(`${API_URL}/workshops/${id}/stop/toggle`, {}, {
    headers: getAuthHeaders()
  })
};

// Registration API
export const registrationAPI = {
  registerForWorkshop: (data) => axios.post(`${API_URL}/registrations`, data, {
    headers: getAuthHeaders()
  }),
  getUserRegistrations: () => axios.get(`${API_URL}/registrations/my-registrations`, {
    headers: getAuthHeaders()
  }),
  getWorkshopRegistrations: (workshopId) => axios.get(`${API_URL}/registrations/workshop/${workshopId}`, {
    headers: getAuthHeaders()
  }),
  cancelRegistration: (registrationId) => axios.delete(`${API_URL}/registrations/${registrationId}`, {
    headers: getAuthHeaders()
  }),
  deleteRegistration: (registrationId, workshopId) => axios.delete(`${API_URL}/registrations/admin/${registrationId}`, {
    headers: getAuthHeaders(),
    data: { workshopId }
  }),
  updateRegistrationStatus: (registrationId, status) => axios.patch(`${API_URL}/registrations/admin/${registrationId}/status`, { status }, {
    headers: getAuthHeaders()
  }),
  exportRegistrations: (workshopId) => axios.get(`${API_URL}/registrations/workshop/${workshopId}/export`, {
    headers: getAuthHeaders(),
    responseType: 'blob'
  })
};

export const attendanceAPI = {
  getRoster: (workshopId, date) => axios.get(`${API_URL}/attendance/workshop/${workshopId}/roster`, {
    headers: getAuthHeaders(),
    params: { date }
  }),
  submitAttendance: (workshopId, data) => axios.post(`${API_URL}/attendance/workshop/${workshopId}`, data, {
    headers: getAuthHeaders()
  }),
  qrCheckIn: (workshopId, data) => axios.post(`${API_URL}/attendance/workshop/${workshopId}/qr-check-in`, data, {
    headers: getAuthHeaders()
  }),
  getReports: (workshopId) => axios.get(`${API_URL}/attendance/workshop/${workshopId}/reports`, {
    headers: getAuthHeaders()
  }),
  resetDay: (workshopId, date) => axios.delete(`${API_URL}/attendance/workshop/${workshopId}/reports/day`, {
    headers: getAuthHeaders(),
    data: { date }
  }),
  exportDay: (workshopId, date) => axios.get(`${API_URL}/attendance/workshop/${workshopId}/reports/day/export`, {
    headers: getAuthHeaders(),
    params: { date },
    responseType: 'blob'
  }),
  exportOverall: (workshopId) => axios.get(`${API_URL}/attendance/workshop/${workshopId}/reports/export`, {
    headers: getAuthHeaders(),
    responseType: 'blob'
  }),
  getQrSession: (workshopId, date) => axios.get(`${API_URL}/attendance/workshop/${workshopId}/qr-session`, {
    headers: getAuthHeaders(),
    params: { date }
  }),
  setQrSession: (workshopId, data) => axios.patch(`${API_URL}/attendance/workshop/${workshopId}/qr-session`, data, {
    headers: getAuthHeaders()
  })
};

export const blogAPI = {
  getFeed: () => axios.get(`${API_URL}/blogs`, { headers: getAuthHeaders() }),
  getAdminPosts: () => axios.get(`${API_URL}/blogs/admin/all`, { headers: getAuthHeaders() }),
  getMyPosts: () => axios.get(`${API_URL}/blogs/me`, { headers: getAuthHeaders() }),
  getProfile: () => axios.get(`${API_URL}/blogs/profile/me`, { headers: getAuthHeaders() }),
  updateProfile: (data) => axios.put(`${API_URL}/blogs/profile/me`, data, { headers: getAuthHeaders() }),
  uploadImage: (data) => axios.post(`${API_URL}/blogs/upload-image`, data, { headers: getAuthHeaders() }),
  createPost: (data) => axios.post(`${API_URL}/blogs`, data, { headers: getAuthHeaders() }),
  updatePost: (postId, data) => axios.put(`${API_URL}/blogs/${postId}`, data, { headers: getAuthHeaders() }),
  deletePost: (postId) => axios.delete(`${API_URL}/blogs/${postId}`, { headers: getAuthHeaders() }),
  likePost: (postId) => axios.patch(`${API_URL}/blogs/${postId}/like`, {}, { headers: getAuthHeaders() }),
  toggleLike: (postId) => axios.patch(`${API_URL}/blogs/${postId}/like`, {}, { headers: getAuthHeaders() }),
  recordShare: (postId) => axios.patch(`${API_URL}/blogs/${postId}/share`, {}, { headers: getAuthHeaders() }),
  getNotifications: () => axios.get(`${API_URL}/blogs/notifications`, { headers: getAuthHeaders() }),
  markNotificationsRead: () => axios.patch(`${API_URL}/blogs/notifications/read`, {}, { headers: getAuthHeaders() }),
  searchUsers: (query) => axios.get(`${API_URL}/blogs/users/search`, {
    headers: getAuthHeaders(),
    params: { q: query }
  }),
  toggleFollow: (userId) => axios.patch(`${API_URL}/blogs/users/${userId}/follow`, {}, { headers: getAuthHeaders() }),
  deleteUser: (userId) => axios.delete(`${API_URL}/blogs/users/${userId}`, { headers: getAuthHeaders() }),
  getUserProfile: (userId) => axios.get(`${API_URL}/blogs/users/${userId}/profile`, { headers: getAuthHeaders() }),
  getUserPosts: (userId) => axios.get(`${API_URL}/blogs/users/${userId}/posts`, { headers: getAuthHeaders() })
};
