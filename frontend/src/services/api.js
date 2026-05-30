import axios from 'axios';

// ── API Base URL ─────────────────────────────────────────────────────────────
// Computed at RUNTIME so file:// protocol is correctly detected in the browser.
// Rule: VITE_API_URL must be the server ORIGIN only (no /api suffix).
//   - file://  → always use http://localhost:5000
//   - localhost served by the backend → relative '' works fine
//   - deployed (Render/Vercel) → set VITE_API_URL=https://your-api.com
const getApiBaseUrl = () => {
  // Runtime check: if page opened directly from disk via file:// or hosted on github.io static page
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('github.io')) {
      return 'https://formtek-production.up.railway.app';
    }
    if (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
  }
  // Build-time env variable (strips accidental /api suffix)
  const envUrl = import.meta.env.VITE_API_URL || '';
  return envUrl.replace(/\/api\/?$/, '') || 'https://formtek-production.up.railway.app';
};

const api = axios.create({
  baseURL: `${getApiBaseUrl()}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});


// Request interceptor to attach JWT token dynamically from Zustand persistent state
api.interceptors.request.use(
  (config) => {
    try {
      const authData = localStorage.getItem('formtek_auth');
      if (authData) {
        const token = JSON.parse(authData)?.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (e) {
      console.error('Error reading auth token in interceptor:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - strictly forward real server errors to frontend components
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

// ─── AUTHENTICATION API ───────────────────────────────────────────────────────
export const authAPI = {
  register: async (userData) => {
    return api.post('/auth/register', userData);
  },

  login: async (credentials) => {
    return api.post('/auth/login', credentials);
  },

  logout: async () => {
    return api.post('/auth/logout');
  },

  me: async () => {
    return api.get('/auth/me');
  },

  changePassword: async (passwords) => {
    return api.put('/auth/change-password', passwords);
  }
};

// ─── PRODUCTS API ─────────────────────────────────────────────────────────────
export const productsAPI = {
  getAll: async (params) => {
    return api.get('/products', { params });
  },

  getOne: async (id) => {
    return api.get(`/products/${id}`);
  },

  create: async (productData) => {
    return api.post('/products', productData);
  },

  update: async (id, productData) => {
    return api.put(`/products/${id}`, productData);
  },

  delete: async (id) => {
    return api.delete(`/products/${id}`);
  },

  addReview: async (productId, reviewData) => {
    return api.post(`/products/${productId}/reviews`, reviewData);
  },

  deleteReview: async (productId, reviewId) => {
    return api.delete(`/products/${productId}/reviews/${reviewId}`);
  },

  updateReviewStatus: async (productId, reviewId, status) => {
    return api.put(`/products/${productId}/reviews/${reviewId}/status`, { status });
  },

  getAllReviews: async () => {
    return api.get('/products/reviews/all');
  }
};

// ─── ORDERS API ───────────────────────────────────────────────────────────────
export const ordersAPI = {
  create: async (orderData) => {
    return api.post('/orders', orderData);
  },

  getAll: async (params) => {
    return api.get('/orders', { params });
  },

  getMy: async () => {
    return api.get('/orders/my');
  },

  getOne: async (id) => {
    return api.get(`/orders/${id}`);
  },

  updateStatus: async (id, statusData) => {
    return api.put(`/orders/${id}/status`, statusData);
  },

  getStats: async () => {
    return api.get('/orders/stats');
  }
};

// ─── USERS MANAGEMENT API ─────────────────────────────────────────────────────
export const usersAPI = {
  getAll: async () => {
    return api.get('/users');
  },

  toggleStatus: async (id) => {
    return api.put(`/users/${id}/toggle-status`);
  },

  updateProfile: async (data) => {
    return api.put('/users/profile', data);
  },

  addAddress: async (addressData) => {
    return api.post('/users/address', addressData);
  },

  deleteAddress: async (addressId) => {
    return api.delete(`/users/address/${addressId}`);
  },

  toggleWishlist: async (productId) => {
    return api.post(`/users/wishlist/${productId}`);
  },

  deleteUser: async (id) => {
    return api.delete(`/users/${id}`);
  }
};


// ─── UPLOAD API ───────────────────────────────────────────────────────────────
export const uploadAPI = {
  productImages: async (formData) => {
    return api.post('/upload/product-images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  avatar: async (formData) => {
    return api.post('/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  paymentProof: async (formData) => {
    return api.post('/upload/payment-proof', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
};

// ─── STORE SETTINGS API ────────────────────────────────────────────────────────
export const settingsAPI = {
  get: async () => {
    return api.get('/settings');
  },
  
  update: async (settingsData) => {
    return api.put('/settings', settingsData);
  }
};

// ─── STATS & METRICS API ───────────────────────────────────────────────────────
export const statsAPI = {
  getPublic: async () => {
    return api.get('/stats/public');
  },

  getAdmin: async () => {
    return api.get('/stats/admin');
  },

  getWeeklySales: async () => {
    return api.get('/stats/weekly-sales');
  }
};

// ─── MESSAGES (Contact Form) API ──────────────────────────────────────────────
export const messagesAPI = {
  send: async (data) => api.post('/messages', data),
  getAll: async () => api.get('/messages'),
  markRead: async (id) => api.put(`/messages/${id}/read`),
  delete: async (id) => api.delete(`/messages/${id}`)
};

// ─── VISIT TRACKING API ───────────────────────────────────────────────────────
export const trackVisit = async () => {
  try { await api.post('/logs/visit'); } catch (_) { /* silent */ }
};

export default api;
