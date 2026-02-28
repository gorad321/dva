import axiosClient from './axiosClient';

export const productsApi = {
  getProducts: (params) => axiosClient.get('/products', { params }),
  getProductBySlug: (slug) => axiosClient.get(`/products/${slug}`),
  getFeatured: () => axiosClient.get('/products/featured'),
  getSuggestions: (q) => axiosClient.get('/products/search/suggestions', { params: { q } }),
  getCategories: () => axiosClient.get('/categories'),
  getBrands: () => axiosClient.get('/brands'),
  getReviews: (slug) => axiosClient.get(`/reviews/${slug}`),
  createReview: (slug, data) => axiosClient.post(`/reviews/${slug}`, data),
};
