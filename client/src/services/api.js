// API wrapper that automatically switches between cloud and local API
import axios from 'axios';
import { isDesktopApp, localAPI } from './localAPI';

// Check if we should use local API
const useLocalAPI = () => {
  return isDesktopApp();
};

// Unified API interface
export const api = {
  // Auth
  login: async (username, password) => {
    if (useLocalAPI()) {
      return await localAPI.login(username, password);
    } else {
      const response = await axios.post('/api/auth/login', { username, password });
      return response.data;
    }
  },

  getMe: async () => {
    if (useLocalAPI()) {
      const token = localStorage.getItem('token');
      const userId = token?.split('-')[2]; // Extract user ID from local token
      return await localAPI.getMe(parseInt(userId));
    } else {
      const response = await axios.get('/api/auth/me');
      return response.data;
    }
  },

  // Menu
  getMenu: async () => {
    if (useLocalAPI()) {
      return await localAPI.getMenu();
    } else {
      const response = await axios.get('/api/menu');
      return response.data;
    }
  },

  // Categories
  getCategories: async () => {
    if (useLocalAPI()) {
      return await localAPI.getCategories();
    } else {
      const response = await axios.get('/api/categories');
      return response.data;
    }
  },

  // Tables
  getTables: async () => {
    if (useLocalAPI()) {
      return await localAPI.getTables();
    } else {
      const response = await axios.get('/api/tables');
      return response.data;
    }
  },

  // Orders
  getPendingOrders: async () => {
    if (useLocalAPI()) {
      return await localAPI.getPendingOrders();
    } else {
      const response = await axios.get('/api/orders?status=pending');
      return response.data;
    }
  },

  createOrder: async (orderData) => {
    if (useLocalAPI()) {
      return await localAPI.createOrder(orderData);
    } else {
      const response = await axios.post('/api/orders', orderData);
      return response.data;
    }
  },

  // Bills
  getPaidBills: async () => {
    if (useLocalAPI()) {
      return await localAPI.getPaidBills();
    } else {
      const response = await axios.get('/api/bills?filter=today');
      return response.data;
    }
  },

  createBill: async (billData) => {
    if (useLocalAPI()) {
      return await localAPI.createBill(billData);
    } else {
      const response = await axios.post('/api/bills', billData);
      return response.data;
    }
  },

  // Settings
  getSettings: async () => {
    if (useLocalAPI()) {
      return await localAPI.getSettings();
    } else {
      const response = await axios.get('/api/settings');
      return response.data;
    }
  },

  // Tables
  updateTableStatus: async (tableNumber, status, orderId) => {
    if (useLocalAPI()) {
      return await localAPI.updateTableStatus(tableNumber, status, orderId);
    } else {
      // Cloud API call would go here
      return { success: true };
    }
  }
};

export default api;

