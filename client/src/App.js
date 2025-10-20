import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import OrderTaking from './pages/OrderTakingComplete';
import KitchenDisplay from './pages/KitchenDisplay';
import BillPrinting from './pages/BillPrinting';
import Bills from './pages/Bills';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import MenuManager from './pages/MenuManager';
import TableManagement from './pages/TableManagement';
import Settings from './pages/Settings';
import ShopManagement from './pages/ShopManagement';
import UserProfile from './pages/UserProfile';
import OwnerPortal from './pages/OwnerPortal';
import Layout from './components/Layout';
import OfflineIndicator from './components/OfflineIndicator';

// Protected Route Component
const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return children;
};

// Main App Component
const AppContent = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" />
      
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
        />
        
        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="orders" element={<OrderTaking />} />
          <Route path="tables" element={<TableManagement />} />
          <Route path="kitchen" element={<KitchenDisplay />} />
          <Route path="bills" element={<Bills />} />
          <Route 
            path="reports" 
            element={
              <ProtectedRoute roles={['manager', 'admin']}>
                <Reports />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="users" 
            element={
              <ProtectedRoute roles={['admin']}>
                <UserManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="menu" 
            element={
              <ProtectedRoute roles={['manager', 'admin']}>
                <MenuManager />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="settings" 
            element={
              <ProtectedRoute roles={['manager', 'admin']}>
                <Settings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="shops" 
            element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <ShopManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="owner" 
            element={
              <ProtectedRoute roles={['owner']}>
                <OwnerPortal />
              </ProtectedRoute>
            } 
          />
          <Route path="profile" element={<UserProfile />} />
        </Route>
      </Routes>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <OfflineIndicator />
      <AppContent />
    </AuthProvider>
  );
}

export default App;
