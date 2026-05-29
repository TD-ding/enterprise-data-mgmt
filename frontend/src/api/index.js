import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '../router';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => {
    const body = res.data;
    if (body.success === false) {
      const msg = body.error || '操作失败';
      ElMessage({ message: msg, type: 'error', duration: 5000, showClose: true });
      return Promise.reject(new Error(msg));
    }
    return body.success === true ? body : body;
  },
  err => {
    const msg = err.response?.data?.error || err.message || '请求失败';
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    }
    ElMessage({ message: msg, type: 'error', duration: 5000, showClose: true });
    return Promise.reject(err);
  }
);

export default api;
