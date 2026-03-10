import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import RegistrationFlow from './components/auth/RegistrationFlow';

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
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
