import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';

const AppContent = () => {
  const { userRole } = useApp();
  if (userRole) return <Dashboard />;
  return <LoginScreen />;
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
