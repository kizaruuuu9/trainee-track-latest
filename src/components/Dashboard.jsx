import React, { useEffect, Suspense } from 'react'; 
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Loader } from 'lucide-react';

const TraineeDashboard = React.lazy(() => import('./dashboards/TraineeDashboard'));
const PartnerDashboard = React.lazy(() => import('./dashboards/PartnerDashboard'));
const AdminDashboard = React.lazy(() => import('./dashboards/AdminDashboard'));

export default function Dashboard() {
  const { userRole } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (userRole && !location.pathname.startsWith(`/${userRole}`)) {
      navigate(`/${userRole}`, { replace: true });
    }
  }, [userRole, location.pathname, navigate]);

  const fallback = <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin text-blue-600" size={48} /></div>;

  if (userRole === 'trainee') return <Suspense fallback={fallback}><TraineeDashboard /></Suspense>;
  if (userRole === 'partner') return <Suspense fallback={fallback}><PartnerDashboard /></Suspense>;
  if (userRole === 'admin') return <Suspense fallback={fallback}><AdminDashboard /></Suspense>;
  return null;
}
