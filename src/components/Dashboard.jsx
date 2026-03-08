import React from 'react'; 
import { useApp } from '../context/AppContext';
import TraineeDashboard from './dashboards/TraineeDashboard';
import PartnerDashboard from './dashboards/PartnerDashboard';
import AdminDashboard from './dashboards/AdminDashboard';

export default function Dashboard() {
  const { userRole } = useApp();
  if (userRole === 'trainee') return <TraineeDashboard />;
  if (userRole === 'partner') return <PartnerDashboard />;
  if (userRole === 'admin') return <AdminDashboard />;
  return null;
}
