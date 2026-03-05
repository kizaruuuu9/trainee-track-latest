import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import RegistrationFlow from './components/auth/RegistrationFlow';

const AppContent = () => {
  const { userRole } = useApp();
  const [showRegistration, setShowRegistration] = useState(false);

  if (userRole) return <Dashboard />;
  if (showRegistration) return <RegistrationFlow onBackToLogin={() => setShowRegistration(false)} />;
  return <LoginScreen onShowRegistration={() => setShowRegistration(true)} />;
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
