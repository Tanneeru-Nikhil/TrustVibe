import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import StoreDashboard from './pages/store/StoreDashboard';
import NormalUserDashboard from './pages/user/NormalUserDashboard';
import Layout from './components/Layout';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
      
      {/* Protected Routes wrapped in Layout */}
      <Route element={<Layout />}>
        <Route path="/" element={
          <ProtectedRoute>
            {user?.role === 'SYSTEM_ADMIN' && <Navigate to="/admin" replace />}
            {user?.role === 'STORE_OWNER' && <Navigate to="/store" replace />}
            {user?.role === 'NORMAL_USER' && <Navigate to="/home" replace />}
          </ProtectedRoute>
        } />
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        {/* Store Owner Routes */}
        <Route path="/store" element={
          <ProtectedRoute allowedRoles={['STORE_OWNER']}>
            <StoreDashboard />
          </ProtectedRoute>
        } />
        
        {/* Normal User Routes */}
        <Route path="/home" element={
          <ProtectedRoute allowedRoles={['NORMAL_USER']}>
            <NormalUserDashboard />
          </ProtectedRoute>
        } />
      </Route>
      
      <Route path="/unauthorized" element={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col">
          <h1 className="text-4xl font-bold text-red-500 mb-4">403 Unauthorized</h1>
          <p>You don't have permission to access this page.</p>
        </div>
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
