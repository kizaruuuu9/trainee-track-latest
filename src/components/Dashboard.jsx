import React, { useEffect } from 'react'; 
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import TraineeDashboard from './dashboards/TraineeDashboard';
import PartnerDashboard from './dashboards/PartnerDashboard';
import AdminDashboard from './dashboards/AdminDashboard';

export default function Dashboard() {
  const { userRole } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (userRole && !location.pathname.startsWith(`/${userRole}`)) {
      navigate(`/${userRole}`, { replace: true });
    }
  }, [userRole, location.pathname, navigate]);

  if (userRole === 'trainee') return <TraineeDashboard />;
  if (userRole === 'partner') return <PartnerDashboard />;
  if (userRole === 'admin') return <AdminDashboard />;
  return null;
}
