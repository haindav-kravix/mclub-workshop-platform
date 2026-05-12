import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

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
  getReports: (workshopId) => axios.get(`${API_URL}/attendance/workshop/${workshopId}/reports`, {
    headers: getAuthHeaders()
  })
};

export const blogAPI = {
  getFeed: () => axios.get(`${API_URL}/blogs`, { headers: getAuthHeaders() }),
  getAdminPosts: () => axios.get(`${API_URL}/blogs/admin/all`, { headers: getAuthHeaders() }),
  getMyPosts: () => axios.get(`${API_URL}/blogs/me`, { headers: getAuthHeaders() }),
  createPost: (data) => axios.post(`${API_URL}/blogs`, data, { headers: getAuthHeaders() }),
  updatePost: (postId, data) => axios.put(`${API_URL}/blogs/${postId}`, data, { headers: getAuthHeaders() }),
  deletePost: (postId) => axios.delete(`${API_URL}/blogs/${postId}`, { headers: getAuthHeaders() }),
  toggleLike: (postId) => axios.patch(`${API_URL}/blogs/${postId}/like`, {}, { headers: getAuthHeaders() }),
  recordShare: (postId) => axios.patch(`${API_URL}/blogs/${postId}/share`, {}, { headers: getAuthHeaders() }),
  searchUsers: (query) => axios.get(`${API_URL}/blogs/users/search`, {
    headers: getAuthHeaders(),
    params: { q: query }
  }),
  toggleFollow: (userId) => axios.patch(`${API_URL}/blogs/users/${userId}/follow`, {}, { headers: getAuthHeaders() }),
  deleteUser: (userId) => axios.delete(`${API_URL}/blogs/users/${userId}`, { headers: getAuthHeaders() })
};
