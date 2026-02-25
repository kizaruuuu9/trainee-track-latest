import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard, Users, Building2, Briefcase, TrendingUp, BarChart2,
  Settings, LogOut, Bell, ChevronDown, Search, Eye, Edit, CheckCircle,
  XCircle, Download, Plus, X, AlertCircle, FileText, Award, Shield,
  UserCheck, Clock, MapPin, Star, Filter, Trash2
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// ─── LAYOUT ───────────────────────────────────────────────────────
const AppLayout = ({ sidebar, children, pageTitle, pageSubtitle }) => {
  const { currentUser, logout } = useApp();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  return (
    <div className="app-layout">
      {sidebar}
      <div className="main-content">
        <header className="top-header">
          <div>
            <div className="header-title">{pageTitle}</div>
            {pageSubtitle && <div className="header-subtitle">{pageSubtitle}</div>}
          </div>
          <div className="header-actions">
            <div style={{ position: 'relative' }}>
              <button className="header-icon-btn" onClick={() => setShowNotif(!showNotif)}><Bell size={17} /><span className="notif-badge">5</span></button>
              {showNotif && (
                <div className="dropdown-menu" style={{ minWidth: 260 }}>
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: 13 }}>Notifications</div>
                  {['New partner registration: PowerGrid Solutions', '3 graduates updated employment status', '2 new job applications this week', 'Monthly report is ready'].map((n, i) => (
                    <div key={i} className="dropdown-item" style={{ fontSize: 12.5, alignItems: 'flex-start' }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6', marginTop: 4, flexShrink: 0, marginRight: 8 }} />{n}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <div className="header-profile" onClick={() => setShowProfile(!showProfile)}>
                <div className="profile-avatar" style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>AD</div>
                <div>
                  <div className="profile-name">{currentUser?.name || 'Admin'}</div>
                  <div className="profile-role">Administrator</div>
                </div>
                <ChevronDown size={14} color="#94a3b8" />
              </div>
              {showProfile && (
                <div className="dropdown-menu">
                  <div className="dropdown-item"><Shield size={14} /> Admin Settings</div>
                  <div className="dropdown-divider" />
                  <div className="dropdown-item danger" onClick={logout}><LogOut size={14} /> Sign Out</div>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="page-content page-enter">{children}</div>
      </div>
    </div>
  );
};

// ─── SIDEBAR ──────────────────────────────────────────────────────
const AdminSidebar = ({ activePage, setActivePage }) => {
  const { logout } = useApp();
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} /> },
    { id: 'graduates', label: 'Manage Graduates', icon: <Users size={17} /> },
    { id: 'partners', label: 'Industry Partners', icon: <Building2 size={17} /> },
    { id: 'jobs', label: 'Job Oversight', icon: <Briefcase size={17} /> },
    { id: 'employment', label: 'Employment Tracking', icon: <TrendingUp size={17} /> },
    { id: 'analytics', label: 'Analytics Reports', icon: <BarChart2 size={17} /> },
    { id: 'settings', label: 'System Settings', icon: <Settings size={17} /> },
  ];
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo" style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>TT</div>
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-name">TraineeTrack</div>
          <div className="sidebar-brand-sub">Admin Panel</div>
        </div>
      </div>
      <div className="sidebar-section-label">Management</div>
      <div className="sidebar-nav">
        {navItems.map(item => (
          <div key={item.id} className={`sidebar-item ${activePage === item.id ? 'active' : ''}`} onClick={() => setActivePage(item.id)}>
            {item.icon} {item.label}
          </div>
        ))}
      </div>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar" style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>AD</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">PSTDII Admin</div>
            <div className="sidebar-user-role">Administrator</div>
          </div>
        </div>
        <div className="sidebar-item" onClick={logout} style={{ color: '#f87171' }}><LogOut size={16} /> Sign Out</div>
      </div>
    </nav>
  );
};

// ─── PAGE 1: ADMIN DASHBOARD ──────────────────────────────────────
const AdminHome = ({ setActivePage }) => {
  const { graduates, partners, jobPostings, getEmploymentStats, getSkillsDemand } = useApp();
  const stats = getEmploymentStats();
  const skillsDemand = getSkillsDemand();

  const statCards = [
    { label: 'Total Graduates', value: graduates.length, icon: <Users size={22} color="#7c3aed" />, bg: '#ede9fe', sub: `${stats.employed} employed` },
    { label: 'Employment Rate', value: `${stats.employmentRate}%`, icon: <TrendingUp size={22} color="#16a34a" />, bg: '#dcfce7', sub: `${stats.unemployed} still unemployed` },
    { label: 'Active Partners', value: partners.filter(p => p.verificationStatus === 'Approved').length, icon: <Building2 size={22} color="#0ea5e9" />, bg: '#e0f2fe', sub: `${partners.filter(p => p.verificationStatus === 'Pending').length} pending approval` },
    { label: 'Active Job Posts', value: jobPostings.filter(j => j.status === 'Open').length, icon: <Briefcase size={22} color="#d97706" />, bg: '#fef3c7', sub: `${jobPostings.length} total postings` },
  ];

  const employmentChartData = [
    { name: 'Employed', value: stats.employed, color: '#16a34a' },
    { name: 'Self-Employed', value: stats.selfEmployed, color: '#2563eb' },
    { name: 'Underemployed', value: stats.underEmployed, color: '#d97706' },
    { name: 'Unemployed', value: stats.unemployed, color: '#dc2626' },
  ];

  const certData = [
    { name: 'CSS NC II', graduates: graduates.filter(g => g.certifications.includes('CSS NC II')).length },
    { name: 'Web Dev NC III', graduates: graduates.filter(g => g.certifications.includes('Web Development NC III')).length },
    { name: 'Auto NC II', graduates: graduates.filter(g => g.certifications.includes('Automotive NC II')).length },
    { name: 'Elec NC II', graduates: graduates.filter(g => g.certifications.includes('Electrical Installation NC II')).length },
    { name: 'Welding NC I', graduates: graduates.filter(g => g.certifications.includes('Welding NC I')).length },
  ];

  const COLORS = ['#16a34a', '#2563eb', '#d97706', '#dc2626'];

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 60%, #db2777 100%)', borderRadius: 16, padding: '22px 28px', marginBottom: 24, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Admin Dashboard</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>Philippine School for Technology Development and Innovation Inc.</div>
        </div>
        <button className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }} onClick={() => setActivePage('analytics')}>
          <BarChart2 size={15} /> View Reports
        </button>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {statCards.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div className="stat-info">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="two-col" style={{ marginBottom: 20 }}>
        <div className="chart-wrap">
          <div className="chart-title">Graduate Employment Status</div>
          <div className="chart-subtitle">Distribution across employment categories</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={employmentChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {employmentChartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-wrap">
          <div className="chart-title">Graduates by Certification</div>
          <div className="chart-subtitle">Number of graduates per TESDA qualification</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={certData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="graduates" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="section-title" style={{ marginBottom: 14 }}>Quick Actions</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'Manage Graduates', icon: <Users size={15} />, page: 'graduates', color: '#7c3aed', bg: '#ede9fe' },
            { label: 'Approve Partners', icon: <Building2 size={15} />, page: 'partners', color: '#0ea5e9', bg: '#e0f2fe' },
            { label: 'Job Oversight', icon: <Briefcase size={15} />, page: 'jobs', color: '#d97706', bg: '#fef3c7' },
            { label: 'Employment Tracking', icon: <TrendingUp size={15} />, page: 'employment', color: '#16a34a', bg: '#dcfce7' },
            { label: 'Analytics Reports', icon: <BarChart2 size={15} />, page: 'analytics', color: '#db2777', bg: '#fce7f3' },
          ].map(a => (
            <button key={a.page} className="btn btn-outline" onClick={() => setActivePage(a.page)} style={{ color: a.color, borderColor: a.bg, background: a.bg }}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── PAGE 2: MANAGE GRADUATES ──────────────────────────────────────
const ManageGraduates = () => {
  const { graduates, addGraduate, updateGraduate, deleteGraduate } = useApp();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [viewGrad, setViewGrad] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newGrad, setNewGrad] = useState({ name: '', email: '', username: '', password: 'grad123', phone: '', address: '', graduationYear: 2024, certifications: [] });
  const [editGrad, setEditGrad] = useState(null);

  const filtered = graduates.filter(g => {
    const q = search.toLowerCase();
    return (g.name.toLowerCase().includes(q) || g.email.toLowerCase().includes(q)) &&
      (filterStatus === 'All' || g.employmentStatus === filterStatus);
  });

  const statusBadge = (s) => {
    const map = { Employed: 'badge-employed', Unemployed: 'badge-unemployed', 'Self-Employed': 'badge-self-employed', Underemployed: 'badge-underemployed' };
    return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
  };

  const handleAdd = () => {
    if (!newGrad.name || !newGrad.email) return alert('Name and email are required.');
    addGraduate({ ...newGrad, username: newGrad.username || newGrad.email.split('@')[0] });
    setShowAdd(false);
    setNewGrad({ name: '', email: '', username: '', password: 'grad123', phone: '', address: '', graduationYear: 2024, certifications: [] });
  };

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Manage Graduates</div><div className="page-subtitle">View and manage all registered graduates</div></div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={15} /> Add Graduate</button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
            <Search size={14} color="#94a3b8" /><input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-select" style={{ width: 'auto', minWidth: 160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            {['All', 'Employed', 'Unemployed', 'Self-Employed', 'Underemployed'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Certifications</th><th>Grad Year</th><th>Employment Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(g => (
                <tr key={g.id}>
                  <td style={{ fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #ede9fe, #dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#7c3aed' }}>{g.name?.charAt(0)}</div>
                      {g.name}
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: '#64748b' }}>{g.email}</td>
                  <td><div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{g.certifications?.slice(0, 2).map(c => <span key={c} className="badge badge-blue" style={{ fontSize: 10 }}>{c}</span>)}</div></td>
                  <td style={{ textAlign: 'center' }}>{g.graduationYear}</td>
                  <td>{statusBadge(g.employmentStatus)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => setViewGrad(g)}><Eye size={12} /> View</button>
                      <button className="btn btn-outline btn-sm" onClick={() => setEditGrad({ ...g })}><Edit size={12} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => { if (window.confirm('Delete graduate?')) deleteGraduate(g.id); }}><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No graduates found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Graduate Modal */}
      {viewGrad && (
        <div className="modal-overlay" onClick={() => setViewGrad(null)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Graduate Details</h3>
              <button className="btn btn-outline btn-icon" onClick={() => setViewGrad(null)}><X size={16} /></button>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #ede9fe, #dbeafe)', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#7c3aed' }}>{viewGrad.name?.charAt(0)}</div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{viewGrad.name}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{viewGrad.email}</div>
              <div style={{ marginTop: 8, display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                {viewGrad.certifications?.map(c => <span key={c} className="badge badge-blue"><Award size={10} />{c}</span>)}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              {[['Phone', viewGrad.phone], ['Address', viewGrad.address], ['Birthday', viewGrad.birthday], ['Grad Year', viewGrad.graduationYear], ['Employment', viewGrad.employmentStatus], ['Employer', viewGrad.employer || '—']].map(([k, v]) => (
                <div key={k} style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>{k}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: '#475569' }}>{v || '—'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Graduate Modal */}
      {editGrad && (
        <div className="modal-overlay" onClick={() => setEditGrad(null)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">Edit Graduate</h3><button className="btn btn-outline btn-icon" onClick={() => setEditGrad(null)}><X size={16} /></button></div>
            {[['name', 'Full Name', 'text'], ['email', 'Email', 'email'], ['phone', 'Phone', 'text'], ['address', 'Address', 'text']].map(([key, label, type]) => (
              <div key={key} className="form-group"><label className="form-label">{label}</label><input type={type} className="form-input" value={editGrad[key] || ''} onChange={e => setEditGrad({ ...editGrad, [key]: e.target.value })} /></div>
            ))}
            <div className="form-group">
              <label className="form-label">Employment Status</label>
              <select className="form-select" value={editGrad.employmentStatus} onChange={e => setEditGrad({ ...editGrad, employmentStatus: e.target.value })}>
                {['Employed', 'Unemployed', 'Self-Employed', 'Underemployed'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setEditGrad(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { updateGraduate(editGrad.id, editGrad); setEditGrad(null); }}><CheckCircle size={15} /> Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Graduate Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">Add New Graduate</h3><button className="btn btn-outline btn-icon" onClick={() => setShowAdd(false)}><X size={16} /></button></div>
            {[['name', 'Full Name *', 'text'], ['email', 'Email *', 'email'], ['username', 'Username', 'text'], ['password', 'Password', 'password'], ['phone', 'Phone', 'text'], ['address', 'Address', 'text']].map(([key, label, type]) => (
              <div key={key} className="form-group"><label className="form-label">{label}</label><input type={type} className="form-input" value={newGrad[key] || ''} onChange={e => setNewGrad({ ...newGrad, [key]: e.target.value })} /></div>
            ))}
            <div className="form-group"><label className="form-label">Graduation Year</label><input type="number" className="form-input" value={newGrad.graduationYear} onChange={e => setNewGrad({ ...newGrad, graduationYear: Number(e.target.value) })} /></div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAdd}><Plus size={15} /> Add Graduate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── PAGE 3: MANAGE INDUSTRY PARTNERS ────────────────────────────
const ManagePartners = () => {
  const { partners, approvePartner, rejectPartner } = useApp();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [viewPartner, setViewPartner] = useState(null);

  const filtered = partners.filter(p => {
    const q = search.toLowerCase();
    return (p.companyName.toLowerCase().includes(q) || p.contactPerson.toLowerCase().includes(q)) &&
      (filterStatus === 'All' || p.verificationStatus === filterStatus);
  });

  const statusBadge = (s) => {
    const map = { Approved: 'badge-approved', Pending: 'badge-pending', Rejected: 'badge-rejected' };
    return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Industry Partners</div><div className="page-subtitle">Manage and verify industry partner accounts</div></div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['All', 'Pending', 'Approved', 'Rejected'].map(s => (
            <button key={s} className={`btn btn-${filterStatus === s ? 'primary' : 'outline'} btn-sm`} onClick={() => setFilterStatus(s)}>
              {s} ({s === 'All' ? partners.length : partners.filter(p => p.verificationStatus === s).length})
            </button>
          ))}
        </div>
      </div>

      {partners.filter(p => p.verificationStatus === 'Pending').length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 16 }}>
          <AlertCircle size={16} />
          <strong>{partners.filter(p => p.verificationStatus === 'Pending').length} partner(s)</strong> are pending verification.
        </div>
      )}

      <div className="card">
        <div style={{ marginBottom: 14 }}>
          <div className="search-bar" style={{ maxWidth: 320 }}>
            <Search size={14} color="#94a3b8" /><input placeholder="Search company or contact..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Company</th><th>Contact Person</th><th>Industry</th><th>Email</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #e0f2fe, #ede9fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#0ea5e9' }}>{p.companyName?.charAt(0)}</div>
                      {p.companyName}
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: '#64748b' }}>{p.contactPerson}</td>
                  <td><span className="badge badge-gray">{p.industry}</span></td>
                  <td style={{ fontSize: 13, color: '#64748b' }}>{p.email}</td>
                  <td>{statusBadge(p.verificationStatus)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => setViewPartner(p)}><Eye size={12} /> View</button>
                      {p.verificationStatus === 'Pending' && (
                        <>
                          <button className="btn btn-success btn-sm" onClick={() => approvePartner(p.id)}><CheckCircle size={12} /> Approve</button>
                          <button className="btn btn-danger btn-sm" onClick={() => rejectPartner(p.id)}><XCircle size={12} /> Reject</button>
                        </>
                      )}
                      {p.verificationStatus === 'Rejected' && (
                        <button className="btn btn-success btn-sm" onClick={() => approvePartner(p.id)}><CheckCircle size={12} /> Approve</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No partners found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {viewPartner && (
        <div className="modal-overlay" onClick={() => setViewPartner(null)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">Partner Details</h3><button className="btn btn-outline btn-icon" onClick={() => setViewPartner(null)}><X size={16} /></button></div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 60, height: 60, borderRadius: 14, background: 'linear-gradient(135deg, #e0f2fe, #ede9fe)', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#0ea5e9' }}>{viewPartner.companyName?.charAt(0)}</div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{viewPartner.companyName}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>{viewPartner.industry}</div>
              {statusBadge(viewPartner.verificationStatus)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {[['Contact', viewPartner.contactPerson], ['Email', viewPartner.email], ['Phone', viewPartner.phone], ['Address', viewPartner.address], ['Size', viewPartner.companySize], ['Website', viewPartner.website]].map(([k, v]) => (
                <div key={k} style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>{k}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#475569' }}>{v || '—'}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Documents</div>
              {[['businessPermit', 'Business Permit'], ['secRegistration', 'SEC Registration']].map(([key, label]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13.5 }}>
                  <span>{label}</span>
                  {viewPartner.documents?.[key] ? <span className="badge badge-accepted"><CheckCircle size={11} /> Uploaded</span> : <span className="badge badge-missing">Missing</span>}
                </div>
              ))}
            </div>
            {viewPartner.verificationStatus === 'Pending' && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => { rejectPartner(viewPartner.id); setViewPartner(null); }}><XCircle size={15} /> Reject</button>
                <button className="btn btn-success" style={{ flex: 1 }} onClick={() => { approvePartner(viewPartner.id); setViewPartner(null); }}><CheckCircle size={15} /> Approve</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── PAGE 4: JOB OVERSIGHT ────────────────────────────────────────
const JobOversight = () => {
  const { jobPostings, updateJobPosting } = useApp();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const filtered = jobPostings.filter(j => {
    const q = search.toLowerCase();
    return (j.title.toLowerCase().includes(q) || j.companyName.toLowerCase().includes(q)) &&
      (filterStatus === 'All' || j.status === filterStatus);
  });

  const statusBadge = (s) => {
    const map = { Open: 'badge-open', Closed: 'badge-closed', Filled: 'badge-filled' };
    return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Job Oversight</div><div className="page-subtitle">Monitor all job postings from industry partners</div></div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['All', 'Open', 'Closed', 'Filled'].map(s => (
            <button key={s} className={`btn btn-${filterStatus === s ? 'primary' : 'outline'} btn-sm`} onClick={() => setFilterStatus(s)}>
              {s} ({s === 'All' ? jobPostings.length : jobPostings.filter(j => j.status === s).length})
            </button>
          ))}
        </div>
      </div>
      <div className="card">
        <div style={{ marginBottom: 14 }}>
          <div className="search-bar" style={{ maxWidth: 320 }}>
            <Search size={14} color="#94a3b8" /><input placeholder="Search jobs or companies..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Job Title</th><th>Company</th><th>NC Level</th><th>Employment Type</th><th>Location</th><th>Date Posted</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {filtered.map(j => (
                <tr key={j.id}>
                  <td style={{ fontWeight: 600, color: '#1e3a5f' }}>{j.title}</td>
                  <td style={{ fontSize: 13, color: '#64748b' }}><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Building2 size={13} color="#94a3b8" />{j.companyName}</div></td>
                  <td><span className="badge badge-purple">{j.ncLevel}</span></td>
                  <td><span className="badge badge-gray">{j.employmentType}</span></td>
                  <td style={{ fontSize: 13, color: '#64748b' }}><div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} />{j.location}</div></td>
                  <td style={{ fontSize: 12.5, color: '#64748b' }}>{j.datePosted}</td>
                  <td>{statusBadge(j.status)}</td>
                  <td>
                    {j.status === 'Open' && <button className="btn btn-danger btn-sm" onClick={() => updateJobPosting(j.id, { status: 'Closed' })}>Close</button>}
                    {j.status === 'Closed' && <button className="btn btn-success btn-sm" onClick={() => updateJobPosting(j.id, { status: 'Open' })}>Re-open</button>}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No job postings found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── PAGE 5: EMPLOYMENT TRACKING ──────────────────────────────────
const EmploymentTracking = () => {
  const { graduates } = useApp();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const filtered = graduates.filter(g => {
    const q = search.toLowerCase();
    return (g.name.toLowerCase().includes(q) || (g.employer || '').toLowerCase().includes(q)) &&
      (filterStatus === 'All' || g.employmentStatus === filterStatus);
  });

  const statusBadge = (s) => {
    const map = { Employed: 'badge-employed', Unemployed: 'badge-unemployed', 'Self-Employed': 'badge-self-employed', Underemployed: 'badge-underemployed' };
    return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
  };

  const stats = { total: graduates.length, employed: graduates.filter(g => g.employmentStatus === 'Employed').length, selfEmp: graduates.filter(g => g.employmentStatus === 'Self-Employed').length, under: graduates.filter(g => g.employmentStatus === 'Underemployed').length, unemp: graduates.filter(g => g.employmentStatus === 'Unemployed').length };

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Employment Tracking</div><div className="page-subtitle">Monitor graduate employment outcomes after certification</div></div>
        <button className="btn btn-outline"><Download size={15} /> Export</button>
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total Graduates', value: stats.total, color: '#2563eb', bg: '#dbeafe' },
          { label: 'Employed', value: stats.employed, color: '#16a34a', bg: '#dcfce7' },
          { label: 'Self-Employed', value: stats.selfEmp, color: '#2563eb', bg: '#dbeafe' },
          { label: 'Underemployed', value: stats.under, color: '#d97706', bg: '#fef3c7' },
          { label: 'Unemployed', value: stats.unemp, color: '#dc2626', bg: '#fee2e2' },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: s.color, fontWeight: 600, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
            <Search size={14} color="#94a3b8" /><input placeholder="Search by name or employer..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-select" style={{ width: 'auto', minWidth: 160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            {['All', 'Employed', 'Unemployed', 'Self-Employed', 'Underemployed'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Graduate Name</th><th>Certifications</th><th>Employment Status</th><th>Employer</th><th>Job Title</th><th>Date Hired</th><th>Months After Graduation</th></tr>
            </thead>
            <tbody>
              {filtered.map(g => (
                <tr key={g.id}>
                  <td style={{ fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#7c3aed' }}>{g.name?.charAt(0)}</div>
                      {g.name}
                    </div>
                  </td>
                  <td><div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{g.certifications?.slice(0, 1).map(c => <span key={c} className="badge badge-blue" style={{ fontSize: 10 }}>{c}</span>)}</div></td>
                  <td>{statusBadge(g.employmentStatus)}</td>
                  <td style={{ fontSize: 13, color: '#64748b' }}>{g.employer || '—'}</td>
                  <td style={{ fontSize: 13, color: '#64748b' }}>{g.jobTitle || '—'}</td>
                  <td style={{ fontSize: 12.5, color: '#64748b' }}>{g.dateHired || '—'}</td>
                  <td style={{ textAlign: 'center' }}>
                    {g.monthsAfterGraduation != null ? (
                      <span style={{ fontWeight: 700, color: g.monthsAfterGraduation <= 6 ? '#16a34a' : '#d97706' }}>{g.monthsAfterGraduation} mos.</span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No records found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── PAGE 6: ANALYTICS REPORTS ────────────────────────────────────
const AnalyticsReports = () => {
  const { graduates, getEmploymentStats, getSkillsDemand, jobPostings } = useApp();
  const stats = getEmploymentStats();
  const skillsDemand = getSkillsDemand();

  const employmentTrend = [
    { month: 'Sep', rate: 42 }, { month: 'Oct', rate: 54 }, { month: 'Nov', rate: 61 },
    { month: 'Dec', rate: 65 }, { month: 'Jan', rate: 70 }, { month: 'Feb', rate: stats.employmentRate },
  ];

  const employmentPieData = [
    { name: 'Employed', value: stats.employed, color: '#16a34a' },
    { name: 'Self-Employed', value: stats.selfEmployed, color: '#2563eb' },
    { name: 'Underemployed', value: stats.underEmployed, color: '#d97706' },
    { name: 'Unemployed', value: stats.unemployed, color: '#dc2626' },
  ];

  const COLORS = ['#16a34a', '#2563eb', '#d97706', '#dc2626'];

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Analytics Reports</div><div className="page-subtitle">Employment outcomes and skills demand analysis</div></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline"><Download size={15} /> Export PDF</button>
          <button className="btn btn-primary"><Download size={15} /> Export Excel</button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Employment Rate', value: `${stats.employmentRate}%`, icon: <TrendingUp size={20} color="#16a34a" />, bg: '#dcfce7' },
          { label: 'Total Graduates', value: stats.total, icon: <Users size={20} color="#7c3aed" />, bg: '#ede9fe' },
          { label: 'Open Job Posts', value: jobPostings.filter(j => j.status === 'Open').length, icon: <Briefcase size={20} color="#0ea5e9" />, bg: '#e0f2fe' },
          { label: 'Avg. Time to Hire', value: '5.2 mos', icon: <Clock size={20} color="#d97706" />, bg: '#fef3c7' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div className="stat-info"><div className="stat-label">{s.label}</div><div className="stat-value">{s.value}</div></div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="two-col" style={{ marginBottom: 20 }}>
        <div className="chart-wrap">
          <div className="chart-title">Employment Rate Trend</div>
          <div className="chart-subtitle">Monthly employment rate over the past 6 months</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={employmentTrend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="rate" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Employment Rate" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-wrap">
          <div className="chart-title">Employment Status Distribution</div>
          <div className="chart-subtitle">Current breakdown of all graduate employment</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={employmentPieData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3} dataKey="value">
                {employmentPieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="two-col">
        <div className="chart-wrap">
          <div className="chart-title">Top Skills in Demand</div>
          <div className="chart-subtitle">Most requested competencies across open jobs</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={skillsDemand} layout="vertical" margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="skill" tick={{ fontSize: 10 }} width={160} />
              <Tooltip />
              <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} name="Job Demand" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-wrap">
          <div className="chart-title">Graduate Summary</div>
          <div className="chart-subtitle">At-a-glance statistics for the current cohort</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            {[
              { label: 'Total Graduates in System', value: stats.total, color: '#7c3aed', percent: 100 },
              { label: 'Employed / Self-Employed', value: stats.employed + stats.selfEmployed, color: '#16a34a', percent: stats.employmentRate },
              { label: 'Underemployed', value: stats.underEmployed, color: '#d97706', percent: Math.round(stats.underEmployed / stats.total * 100) },
              { label: 'Unemployed / Seeking', value: stats.unemployed, color: '#dc2626', percent: Math.round(stats.unemployed / stats.total * 100) },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: '#475569' }}>{s.label}</span>
                  <span style={{ fontWeight: 700, color: s.color }}>{s.value} ({s.percent}%)</span>
                </div>
                <div className="progress-bar-wrap">
                  <div className="progress-bar-fill" style={{ width: `${s.percent}%`, background: s.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── PAGE 7: SYSTEM SETTINGS ──────────────────────────────────────
const SystemSettings = () => {
  const { currentUser } = useApp();
  const [form, setForm] = useState({ name: currentUser?.name || '', email: currentUser?.email || '', phone: currentUser?.phone || '', position: currentUser?.position || '' });
  const [saved, setSaved] = useState(false);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div>
      <div className="page-header"><div><div className="page-title">System Settings</div><div className="page-subtitle">Manage system configuration and admin profile</div></div></div>
      <div className="two-col">
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Admin Profile</div>
          {saved && <div className="alert alert-success" style={{ marginBottom: 12 }}><CheckCircle size={15} /> Settings saved!</div>}
          {[['name', 'Full Name', 'text'], ['email', 'Email Address', 'email'], ['phone', 'Phone Number', 'text'], ['position', 'Position / Title', 'text']].map(([key, label, type]) => (
            <div key={key} className="form-group"><label className="form-label">{label}</label><input type={type} className="form-input" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} /></div>
          ))}
          <button className="btn btn-primary" onClick={handleSave}><CheckCircle size={15} /> Save Changes</button>
        </div>
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>System Information</div>
          {[
            ['System Name', 'TraineeTrack'],
            ['Organization', 'PSTDII'],
            ['Version', '2.0.0'],
            ['Framework', 'React + Vite'],
            ['Database', 'In-Memory (Demo)'],
            ['Last Updated', '2026-02-26'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13.5 }}>
              <span style={{ color: '#94a3b8', fontWeight: 600 }}>{k}</span>
              <span style={{ color: '#475569', fontWeight: 500 }}>{v}</span>
            </div>
          ))}
          <div style={{ marginTop: 16 }}>
            <div className="alert alert-info" style={{ margin: 0 }}><AlertCircle size={14} /> This is a prototype demonstration system for PSTDII.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN ADMIN DASHBOARD ─────────────────────────────────────────
export default function AdminDashboard() {
  const [activePage, setActivePage] = useState('dashboard');

  const pageMap = {
    dashboard: { title: 'Admin Dashboard', sub: 'PSTDII Graduate Employability System Overview' },
    graduates: { title: 'Manage Graduates', sub: 'View, add, and edit graduate records' },
    partners: { title: 'Industry Partners', sub: 'Verify and manage company accounts' },
    jobs: { title: 'Job Oversight', sub: 'Monitor all job postings from partners' },
    employment: { title: 'Employment Tracking', sub: 'Graduate employment status and outcomes' },
    analytics: { title: 'Analytics Reports', sub: 'Employment data insights and visualizations' },
    settings: { title: 'System Settings', sub: 'Admin profile and system configuration' },
  };

  const current = pageMap[activePage] || pageMap.dashboard;

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <AdminHome setActivePage={setActivePage} />;
      case 'graduates': return <ManageGraduates />;
      case 'partners': return <ManagePartners />;
      case 'jobs': return <JobOversight />;
      case 'employment': return <EmploymentTracking />;
      case 'analytics': return <AnalyticsReports />;
      case 'settings': return <SystemSettings />;
      default: return <AdminHome setActivePage={setActivePage} />;
    }
  };

  return (
    <AppLayout sidebar={<AdminSidebar activePage={activePage} setActivePage={setActivePage} />} pageTitle={current.title} pageSubtitle={current.sub}>
      {renderPage()}
    </AppLayout>
  );
}
