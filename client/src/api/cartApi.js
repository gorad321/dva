import axiosClient from './axiosClient';

export const cartApi = {
  getCart: () => axiosClient.get('/cart'),
  addItem: (product_id, quantity = 1) => axiosClient.post('/cart/items', { product_id, quantity }),
  updateItem: (id, quantity) => axiosClient.put(`/cart/items/${id}`, { quantity }),
  removeItem: (id) => axiosClient.delete(`/cart/items/${id}`),
  clearCart: () => axiosClient.delete('/cart'),
};
