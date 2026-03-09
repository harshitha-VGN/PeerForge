import axios from 'axios';

// Ensure the port matches your backend (5001)
const API = axios.create({ baseURL: 'http://localhost:5001/api' });

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    // Note: MUST be "Bearer <token>"
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// ADD THIS: If we get a 401, redirect to login automatically
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;