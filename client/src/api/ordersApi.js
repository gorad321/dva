import axiosClient from './axiosClient';

export const ordersApi = {
  createOrder: (data) => axiosClient.post('/orders', data),
  getOrders: () => axiosClient.get('/orders'),
  getOrderById: (id) => axiosClient.get(`/orders/${id}`),
  validatePromo: (code, cart_total) => axiosClient.post('/promotions/validate', { code, cart_total }),
  getProfile: () => axiosClient.get('/account/profile'),
  updateProfile: (data) => axiosClient.put('/account/profile', data),
  changePassword: (data) => axiosClient.put('/account/password', data),
};
