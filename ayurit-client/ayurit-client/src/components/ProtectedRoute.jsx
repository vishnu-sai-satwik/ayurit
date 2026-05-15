import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getSessionRole, isAuthenticated, roleMatches } from '../utils/session';

const routeByRole = {
  superadmin: '/admin-dashboard',
  doctor: '/dashboard',
  patient: '/patient-dashboard',
};

export default function ProtectedRoute({ children, allowRole }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!roleMatches(allowRole)) {
    const fallback = routeByRole[getSessionRole()] || '/login';
    return <Navigate to={fallback} replace />;
  }

  return children;
}
