import axiosClient from './axiosClient';

export const authApi = {
  register: (data) => axiosClient.post('/auth/register', data),
  login: (data) => axiosClient.post('/auth/login', data),
  logout: () => axiosClient.post('/auth/logout'),
  refresh: () => axiosClient.post('/auth/refresh'),
  getMe: () => axiosClient.get('/auth/me'),
};
