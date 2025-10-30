import axios from 'axios';

// Central axios instance (web-only)
const instance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'https://restaurant-pos-system-1-7h0m.onrender.com'
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;


