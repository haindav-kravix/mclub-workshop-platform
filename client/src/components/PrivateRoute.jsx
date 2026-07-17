import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from './UI';

export const PrivateRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to={requireAdmin ? '/MC-ADMIN' : '/login'} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/MC-ADMIN" replace />;
  }

  return children;
};
