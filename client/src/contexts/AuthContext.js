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
    } catch (error) {
      console.error('Error fetching user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post('/api/auth/login', { username, password });
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
      
      // Then update state
      setToken(newToken);
      setUser(normalizedUser);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
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
