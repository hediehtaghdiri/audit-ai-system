// src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://api.zer0team.ir/', // آدرس بک‌اندت
  withCredentials: true, // برای ارسال و دریافت کوکی‌ها
});

api.interceptors.request.use(
  (config) => {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('access_token='))
      ?.split('=')[1];
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;