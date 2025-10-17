import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Setup axios interceptors for better error handling
  useEffect(() => {
    // Request interceptor - add token to all requests
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle 401 errors
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Only clear auth if we're not on the login endpoint
          if (!error.config.url?.includes('/api/auth/login')) {
            console.log('Unauthorized - clearing auth');
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = useCallback(async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user:', error);
      // Only logout if it's an authentication error (401/403)
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('Token invalid, logging out...');
        logout();
      } else {
        // For other errors (network, server waking up, etc.), just log
        console.log('Temporary error fetching user, keeping session');
        setLoading(false);
      }
    }
  }, []);

  const login = async (username, password) => {
    try {
      console.log('Attempting login...');
      const response = await axios.post('/api/auth/login', { username, password }, {
        timeout: 30000, // 30 second timeout (for server wake up)
        withCredentials: true
      });
      console.log('Login response:', response.data);
      
      const { token: newToken, user: userData } = response.data;
      
      if (!newToken || !userData) {
        console.error('Invalid response structure:', response.data);
        return { 
          success: false, 
          error: 'Invalid login response from server' 
        };
      }
      
      // Store token first
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      // Normalize user data to use snake_case (first_name, last_name)
      const normalizedUser = {
        ...userData,
        first_name: userData?.first_name || userData?.firstName || '',
        last_name: userData?.last_name || userData?.lastName || '',
        avatar_url: userData?.avatar_url || null
      };
      
      // Remove camelCase versions if they exist
      delete normalizedUser.firstName;
      delete normalizedUser.lastName;
      
      console.log('Normalized user:', normalizedUser);
      console.log('Token stored:', newToken.substring(0, 20) + '...');
      
      // Then update state
      setToken(newToken);
      setUser(normalizedUser);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Login failed';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Server is waking up, please wait 30 seconds and try again';
      } else if (error.message === 'Network Error') {
        errorMessage = 'Cannot connect to server. Please check your internet connection.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many login attempts. Please wait a few minutes.';
      } else {
        errorMessage = error.response?.data?.error || 'Login failed';
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const value = {
    user,
    token,
    login,
    logout,
    hasRole,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
