import React from 'react';
import { useApp } from '../context/AppContext';
import GraduateDashboard from './dashboards/GraduateDashboard';
import PartnerDashboard from './dashboards/PartnerDashboard';
import AdminDashboard from './dashboards/AdminDashboard';

export default function Dashboard() {
  const { userRole } = useApp();
  if (userRole === 'graduate') return <GraduateDashboard />;
  if (userRole === 'partner') return <PartnerDashboard />;
  if (userRole === 'admin') return <AdminDashboard />;
  return null;
}
