import axiosClient from './axiosClient';

export const adminApi = {
  // Dashboard
  getStats: () => axiosClient.get('/admin/stats'),

  // Produits
  getProducts: (params) => axiosClient.get('/admin/products', { params }),
  createProduct: (data) => axiosClient.post('/admin/products', data),
  updateProduct: (id, data) => axiosClient.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => axiosClient.delete(`/admin/products/${id}`),
  toggleFeatured: (id) => axiosClient.patch(`/admin/products/${id}/featured`),

  // Produit détails (images, specs, compat)
  getProductDetails: (id) => axiosClient.get(`/admin/products/${id}/details`),
  addProductImage: (id, data) => axiosClient.post(`/admin/products/${id}/images`, data),
  deleteProductImage: (imageId) => axiosClient.delete(`/admin/products/images/${imageId}`),
  addProductSpec: (id, data) => axiosClient.post(`/admin/products/${id}/specs`, data),
  deleteProductSpec: (specId) => axiosClient.delete(`/admin/products/specs/${specId}`),
  addProductCompat: (id, data) => axiosClient.post(`/admin/products/${id}/compat`, data),
  deleteProductCompat: (compatId) => axiosClient.delete(`/admin/products/compat/${compatId}`),

  // Commandes
  getOrders: (params) => axiosClient.get('/admin/orders', { params }),
  getOrderDetails: (id) => axiosClient.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, status) => axiosClient.patch(`/admin/orders/${id}/status`, { status }),

  // Utilisateurs
  getUsers: (params) => axiosClient.get('/admin/users', { params }),
  updateUserRole: (id, role) => axiosClient.patch(`/admin/users/${id}/role`, { role }),

  // Avis
  getReviews: (params) => axiosClient.get('/admin/reviews', { params }),
  deleteReview: (id) => axiosClient.delete(`/admin/reviews/${id}`),

  // Promotions
  getPromotions: () => axiosClient.get('/admin/promotions'),
  createPromotion: (data) => axiosClient.post('/admin/promotions', data),
  updatePromotion: (id, data) => axiosClient.put(`/admin/promotions/${id}`, data),
  deletePromotion: (id) => axiosClient.delete(`/admin/promotions/${id}`),

  // Catégories
  getCategories: () => axiosClient.get('/categories'),
  createCategory: (data) => axiosClient.post('/admin/categories', data),
  updateCategory: (id, data) => axiosClient.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => axiosClient.delete(`/admin/categories/${id}`),

  // Marques
  getBrands: () => axiosClient.get('/brands'),
  createBrand: (data) => axiosClient.post('/admin/brands', data),
  updateBrand: (id, data) => axiosClient.put(`/admin/brands/${id}`, data),
  deleteBrand: (id) => axiosClient.delete(`/admin/brands/${id}`),

  // Export CSV (téléchargement direct via URL)
  exportUrl: (type) => `/api/admin/export/${type}`,
};
