import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
      fetchUserProfile(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      localStorage.removeItem('authToken');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      const response = await axios.post(`${API_URL}/auth/verify-token`, {
        token: credentialResponse.credential
      });

      if (response.data.success) {
        const { token, user } = response.data;
        setToken(token);
        setUser(user);
        localStorage.setItem('authToken', token);
        return { success: true, user };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const applyAuthSession = ({ token, user }) => {
    setToken(token);
    setUser(user);
    localStorage.setItem('authToken', token);
  };

  const handleAdminAuth = async ({ credential, mode = 'login' }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/admin/${mode}`, {
        token: credential
      });

      if (response.data.success) {
        const { token, user } = response.data;
        applyAuthSession({ token, user });
        return { success: true, user };
      }

      return { success: false, error: response.data.error || 'Admin authentication failed' };
    } catch (error) {
      console.error('Admin auth error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.message || 'Admin authentication failed'
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
  };

  const value = {
    user,
    token,
    loading,
    handleGoogleLoginSuccess,
    handleAdminAuth,
    logout,
    isAuthenticated: !!token,
    isAdmin: user?.isAdmin || false
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
