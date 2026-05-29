import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../api';

export const useUserStore = defineStore('user', () => {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));
  const token = ref(localStorage.getItem('token') || '');

  async function login(username, password) {
    const res = await api.post('/auth/login', { username, password });
    token.value = res.token;
    user.value = res.user;
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
  }

  function logout() {
    token.value = '';
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  const isAdmin = () => user.value?.role === 'admin';

  return { user, token, login, logout, isAdmin };
});
