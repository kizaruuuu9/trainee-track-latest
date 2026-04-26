import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useApp } from './context/AppContext';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import RegistrationFlow from './components/auth/RegistrationFlow';

import GlobalConfirmModal from './components/common/GlobalConfirmModal';

const AppRoutes = () => {
  const { userRole } = useApp();
  const navigate = useNavigate();

  if (userRole) {
    return (
      <Routes>
        <Route path="/trainee/*" element={<Dashboard />} />
        <Route path="/partner/*" element={<Dashboard />} />
        <Route path="/admin/*" element={<Dashboard />} />
        <Route path="*" element={<Navigate to={`/${userRole}`} replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginScreen onShowRegistration={() => navigate('/register')} />} />
      <Route path="/register" element={<RegistrationFlow onBackToLogin={() => navigate('/login')} />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Toaster 
          position="top-center" 
          toastOptions={{ 
            duration: 4000,
            style: { 
              fontFamily: "'Inter', sans-serif",
              fontSize: '15px', 
              fontWeight: 500, 
              borderRadius: '8px',
              padding: '12px 16px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' }
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' }
            }
          }} 
        />
        <GlobalConfirmModal />
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
