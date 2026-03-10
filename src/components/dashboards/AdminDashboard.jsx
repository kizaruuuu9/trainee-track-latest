import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
    LayoutDashboard, Users, Building2, Briefcase, TrendingUp, BarChart2,
    Settings, LogOut, Bell, ChevronDown, Search, Eye, Edit, CheckCircle,
    XCircle, Download, Plus, X, AlertCircle, FileText, Award, Shield,
    UserCheck, Clock, MapPin, Star, Filter, Trash2, Menu
} from 'lucide-react';
import {
    BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// â”€â”€â”€ LAYOUT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const AppLayout = ({ sidebar, children, pageTitle, pageSubtitle }) => {
    const { currentUser, logout } = useApp();
    const [showProfile, setShowProfile] = useState(false);
    const [showNotif, setShowNotif] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    return (
        <div className="app-layout">
            {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
            {React.cloneElement(sidebar, { mobileOpen: sidebarOpen, closeSidebar: () => setSidebarOpen(false) })}
            <div className="main-content">
                <header className="top-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
                        <div>
                            <div className="header-title">{pageTitle}</div>
                            {pageSubtitle && <div className="header-subtitle">{pageSubtitle}</div>}
                        </div>
                    </div>
                    <div className="header-actions">
                        <div style={{ position: 'relative' }}>
                            <button className="header-icon-btn" onClick={() => setShowNotif(!showNotif)}><Bell size={17} /><span className="notif-badge">5</span></button>
                            {showNotif && (
                                <div className="dropdown-menu" style={{ minWidth: 260 }}>
                                    <div style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: 13 }}>Notifications</div>
                                    {['New partner registration: PowerGrid Solutions', '3 trainees updated employment status', '2 new applications this week', 'Monthly report is ready'].map((n, i) => (
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

// â”€â”€â”€ SIDEBAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const AdminSidebar = ({ activePage, setActivePage, mobileOpen, closeSidebar }) => {
    const { logout } = useApp();
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} /> },
        { id: 'trainees', label: 'Manage Trainees', icon: <Users size={17} /> },
        { id: 'partners', label: 'Industry Partners', icon: <Building2 size={17} /> },
        { id: 'jobs', label: 'Opportunities Oversight', icon: <Briefcase size={17} /> },
        { id: 'employment', label: 'Employment Tracking', icon: <TrendingUp size={17} /> },
        { id: 'activity-log', label: 'Activity Log', icon: <FileText size={17} /> },
        { id: 'settings', label: 'System Settings', icon: <Settings size={17} /> },
    ];
    const handleNav = (id) => { setActivePage(id); if (closeSidebar) closeSidebar(); };
    return (
        <nav className={`sidebar ${mobileOpen ? 'open' : ''}`}>
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
                    <div key={item.id} className={`sidebar-item ${activePage === item.id ? 'active' : ''}`} onClick={() => handleNav(item.id)}>
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

// â”€â”€â”€ PAGE 1: ADMIN DASHBOARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const AdminHome = ({ setActivePage }) => {
    const { trainees, partners, jobPostings, getEmploymentStats, getSkillsDemand } = useApp();
    const stats = getEmploymentStats();
    const skillsDemand = getSkillsDemand();
    const statCards = [
        { label: 'Total Trainees', value: trainees.length, icon: <Users size={22} color="#7c3aed" />, bg: '#ede9fe', sub: `${stats.employed} employed` },
        { label: 'Employment Rate', value: `${stats.employmentRate}%`, icon: <TrendingUp size={22} color="#16a34a" />, bg: '#dcfce7', sub: `${stats.unemployed} still unemployed` },
        { label: 'Active Partners', value: partners.filter(p => p.verificationStatus === 'Approved').length, icon: <Building2 size={22} color="#0ea5e9" />, bg: '#e0f2fe', sub: `${partners.filter(p => p.verificationStatus === 'Pending').length} pending approval` },
        { label: 'Active Opportunities', value: jobPostings.filter(j => j.status === 'Open').length, icon: <Briefcase size={22} color="#d97706" />, bg: '#fef3c7', sub: `${jobPostings.length} total postings` },
    ];
    const employmentChartData = [
        { name: '🟦 Employed', value: stats.employed || 0, color: '#3b82f6' },
        { name: '🟨 Seeking Employment', value: stats.seeking_employment || 0, color: '#eab308' },
        { name: '🟥 Not Employed', value: stats.not_employed || 0, color: '#ef4444' },
    ];
    // Build cert data dynamically from all programs that trainees hold
    const allCerts = [...new Set(trainees.flatMap(t => t.certifications || []))];
    const certData = allCerts.map(cert => ({
        name: cert.length > 25 ? cert.replace(/\(.*?\)/g, '').trim().substring(0, 25) + '…' : cert,
        fullName: cert,
        trainees: trainees.filter(t => t.certifications.includes(cert)).length,
    })).filter(c => c.trainees > 0);
    return (
        <div>
            <div style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 60%, #db2777 100%)', borderRadius: 16, padding: '22px 28px', marginBottom: 24, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>Admin Dashboard</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>Philippine School for Technology Development and Innovation Inc.</div>
                </div>
                <button className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }} onClick={() => setActivePage('analytics')}>
                    <BarChart2 size={15} /> View Reports
                </button>
            </div>
            <div className="stats-grid">
                {statCards.map((s, i) => (
                    <div key={i} className="stat-card">
                        <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
                        <div className="stat-info"><div className="stat-label">{s.label}</div><div className="stat-value">{s.value}</div><div className="stat-sub">{s.sub}</div></div>
                    </div>
                ))}
            </div>
            <div className="two-col" style={{ marginBottom: 20 }}>
                <div className="chart-wrap">
                    <div className="chart-title">Trainee Employment Status</div>
                    <div className="chart-subtitle">Distribution across employment categories</div>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart><Pie data={employmentChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                            {employmentChartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                        </Pie><Tooltip /><Legend /></PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="chart-wrap">
                    <div className="chart-title">Trainees by Certification</div>
                    <div className="chart-subtitle">Number of trainees per TESDA qualification</div>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={certData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 11 }} allowDecimals={false} /><Tooltip />
                            <Bar dataKey="trainees" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
};

// â”€â”€â”€ PAGE 2: MANAGE TRAINEES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ManageTrainees = () => {
    const { trainees, addTrainee, updateTrainee, deleteTrainee } = useApp();
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [viewT, setViewT] = useState(null);
    const [editT, setEditT] = useState(null);
    const filtered = trainees.filter(t => {
        const q = search.toLowerCase();
        return (t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q)) && (filterStatus === 'All' || t.employmentStatus === filterStatus);
    });
    const statusBadge = (s) => {
        const map = { Employed: 'badge-employed', 'Seeking Employment': 'badge-self-employed', 'Not Employed': 'badge-unemployed' };
        return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
    };
    return (
        <div>
            <div className="page-header">
                <div><div className="page-title">Manage Trainees</div><div className="page-subtitle">View and manage all registered trainees</div></div>
            </div>
            <div className="card">
                <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="search-bar" style={{ flex: 1, minWidth: 200 }}><Search size={14} color="#94a3b8" /><input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                    <select className="form-select" style={{ width: 'auto', minWidth: 160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        {['All', 'Employed', 'Seeking Employment', 'Not Employed'].map(s => <option key={s}>{s}</option>)}
                    </select>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead><tr><th>Name</th><th>Email</th><th>Certifications</th><th>Year</th><th>Employment Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {filtered.map(t => (
                                <tr key={t.id}>
                                    <td style={{ fontWeight: 600 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #ede9fe, #dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#7c3aed' }}>{t.name?.charAt(0)}</div>{t.name}</div></td>
                                    <td style={{ fontSize: 13, color: '#64748b' }}>{t.email}</td>
                                    <td><div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{t.certifications?.slice(0, 2).map(c => <span key={c} className="badge badge-blue" style={{ fontSize: 10 }}>{c}</span>)}</div></td>
                                    <td style={{ textAlign: 'center' }}>{t.graduationYear}</td>
                                    <td>{statusBadge(t.employmentStatus)}</td>
                                    <td><div style={{ display: 'flex', gap: 6 }}>
                                        <button className="btn btn-outline btn-sm" onClick={() => setViewT(t)}><Eye size={12} /> View</button>
                                        <button className="btn btn-outline btn-sm" onClick={() => setEditT({ ...t })}><Edit size={12} /></button>
                                        <button className="btn btn-danger btn-sm" onClick={() => { if (window.confirm('Delete trainee?')) deleteTrainee(t.id); }}><Trash2 size={12} /></button>
                                    </div></td>
                                </tr>
                            ))}
                            {filtered.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No trainees found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
            {viewT && (
                <div className="modal-overlay" onClick={() => setViewT(null)}>
                    <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3 className="modal-title">Trainee Details</h3><button className="btn btn-outline btn-icon" onClick={() => setViewT(null)}><X size={16} /></button></div>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #ede9fe, #dbeafe)', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#7c3aed' }}>{viewT.name?.charAt(0)}</div>
                            <div style={{ fontWeight: 800, fontSize: 18 }}>{viewT.name}</div>
                            <div style={{ fontSize: 13, color: '#64748b' }}>{viewT.email}</div>
                            <div style={{ marginTop: 8, display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>{viewT.certifications?.map(c => <span key={c} className="badge badge-blue"><Award size={10} />{c}</span>)}</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                            {[['Phone', viewT.phone], ['Address', viewT.address], ['Birthday', viewT.birthday], ['Year', viewT.graduationYear], ['Employment', viewT.employmentStatus], ['Employer', viewT.employer || 'â€”']].map(([k, v]) => (
                                <div key={k} style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 8 }}>
                                    <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>{k}</div>
                                    <div style={{ fontSize: 13.5, fontWeight: 500, color: '#475569' }}>{v || 'â€”'}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {editT && (
                <div className="modal-overlay" onClick={() => setEditT(null)}>
                    <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3 className="modal-title">Edit Trainee</h3><button className="btn btn-outline btn-icon" onClick={() => setEditT(null)}><X size={16} /></button></div>
                        {[['name', 'Full Name', 'text'], ['email', 'Email', 'email'], ['phone', 'Phone', 'text'], ['address', 'Address', 'text']].map(([key, label, type]) => (
                            <div key={key} className="form-group"><label className="form-label">{label}</label><input type={type} className="form-input" value={editT[key] || ''} onChange={e => setEditT({ ...editT, [key]: e.target.value })} /></div>
                        ))}
                        <div className="form-group"><label className="form-label">Employment Status</label>
                            <select className="form-select" value={editT.employmentStatus} onChange={e => setEditT({ ...editT, employmentStatus: e.target.value })}>
                                {['Employed', 'Seeking Employment', 'Not Employed'].map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setEditT(null)}>Cancel</button>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { updateTrainee(editT.id, editT); setEditT(null); }}><CheckCircle size={15} /> Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// â”€â”€â”€ PAGE 3: MANAGE INDUSTRY PARTNERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ManagePartners = () => {
    const { partners, approvePartner, rejectPartner } = useApp();
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [viewPartner, setViewPartner] = useState(null);
    const filtered = partners.filter(p => {
        const q = search.toLowerCase();
        return (p.companyName.toLowerCase().includes(q) || p.contactPerson.toLowerCase().includes(q)) && (filterStatus === 'All' || p.verificationStatus === filterStatus);
    });
    const statusBadge = (s) => {
        const map = { Approved: 'badge-approved', Pending: 'badge-pending', Rejected: 'badge-rejected' };
        return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
    };
    return (
        <div>
            <div className="page-header">
                <div><div className="page-title">Industry Partners</div><div className="page-subtitle">Manage and verify industry partner accounts</div></div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['All', 'Pending', 'Approved', 'Rejected'].map(s => (
                        <button key={s} className={`btn btn-${filterStatus === s ? 'primary' : 'outline'} btn-sm`} onClick={() => setFilterStatus(s)}>
                            {s} ({s === 'All' ? partners.length : partners.filter(p => p.verificationStatus === s).length})
                        </button>
                    ))}
                </div>
            </div>
            {partners.filter(p => p.verificationStatus === 'Pending').length > 0 && (
                <div className="alert alert-warning" style={{ marginBottom: 16 }}><AlertCircle size={16} /><strong>{partners.filter(p => p.verificationStatus === 'Pending').length} partner(s)</strong> are pending verification.</div>
            )}
            <div className="card">
                <div style={{ marginBottom: 14 }}><div className="search-bar" style={{ maxWidth: 320 }}><Search size={14} color="#94a3b8" /><input placeholder="Search company or contact..." value={search} onChange={e => setSearch(e.target.value)} /></div></div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead><tr><th>Company</th><th>Contact Person</th><th>Industry</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {filtered.map(p => (
                                <tr key={p.id}>
                                    <td style={{ fontWeight: 600 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #e0f2fe, #ede9fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#0ea5e9' }}>{p.companyName?.charAt(0)}</div>{p.companyName}</div></td>
                                    <td style={{ fontSize: 13, color: '#64748b' }}>{p.contactPerson}</td>
                                    <td><span className="badge badge-gray">{p.industry}</span></td>
                                    <td style={{ fontSize: 13, color: '#64748b' }}>{p.email}</td>
                                    <td>{statusBadge(p.verificationStatus)}</td>
                                    <td><div style={{ display: 'flex', gap: 6 }}>
                                        <button className="btn btn-outline btn-sm" onClick={() => setViewPartner(p)}><Eye size={12} /> View</button>
                                        {p.verificationStatus === 'Pending' && <><button className="btn btn-success btn-sm" onClick={() => approvePartner(p.id)}><CheckCircle size={12} /> Approve</button><button className="btn btn-danger btn-sm" onClick={() => rejectPartner(p.id)}><XCircle size={12} /> Reject</button></>}
                                        {p.verificationStatus === 'Rejected' && <button className="btn btn-success btn-sm" onClick={() => approvePartner(p.id)}><CheckCircle size={12} /> Approve</button>}
                                    </div></td>
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
                                <div key={k} style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 8 }}><div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>{k}</div><div style={{ fontSize: 13, fontWeight: 500, color: '#475569' }}>{v || 'â€”'}</div></div>
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

// â”€â”€â”€ PAGE 4: OPPORTUNITIES OVERSIGHT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const OpportunitiesOversight = () => {
    const { jobPostings, updateJobPosting } = useApp();
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterType, setFilterType] = useState('All');
    const filtered = jobPostings.filter(j => {
        const q = search.toLowerCase();
        return (j.title.toLowerCase().includes(q) || j.companyName.toLowerCase().includes(q)) && (filterStatus === 'All' || j.status === filterStatus) && (filterType === 'All' || j.opportunityType === filterType);
    });
    const statusBadge = (s) => {
        const map = { Open: 'badge-open', Closed: 'badge-closed', Filled: 'badge-filled' };
        return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
    };
    return (
        <div>
            <div className="page-header">
                <div><div className="page-title">Opportunities Oversight</div><div className="page-subtitle">Monitor all opportunity postings from industry partners</div></div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['All', 'Open', 'Closed', 'Filled'].map(s => (
                        <button key={s} className={`btn btn-${filterStatus === s ? 'primary' : 'outline'} btn-sm`} onClick={() => setFilterStatus(s)}>
                            {s} ({s === 'All' ? jobPostings.length : jobPostings.filter(j => j.status === s).length})
                        </button>
                    ))}
                </div>
            </div>
            <div className="card">
                <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="search-bar" style={{ flex: 1, minWidth: 200 }}><Search size={14} color="#94a3b8" /><input placeholder="Search opportunities or companies..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                    <select className="form-select" style={{ width: 'auto', minWidth: 140 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
                        {['All', 'Job', 'OJT', 'Apprenticeship'].map(t => <option key={t}>{t}</option>)}
                    </select>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead><tr><th>Title</th><th>Company</th><th>Type</th><th>NC Level</th><th>Location</th><th>Date Posted</th><th>Status</th><th>Action</th></tr></thead>
                        <tbody>
                            {filtered.map(j => (
                                <tr key={j.id}>
                                    <td style={{ fontWeight: 600, color: '#1e3a5f' }}>{j.title}</td>
                                    <td style={{ fontSize: 13, color: '#64748b' }}><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Building2 size={13} color="#94a3b8" />{j.companyName}</div></td>
                                    <td><span className="badge badge-cyan">{j.opportunityType}</span></td>
                                    <td><span className="badge badge-purple">{j.ncLevel}</span></td>
                                    <td style={{ fontSize: 13, color: '#64748b' }}><div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} />{j.location}</div></td>
                                    <td style={{ fontSize: 12.5, color: '#64748b' }}>{j.datePosted}</td>
                                    <td>{statusBadge(j.status)}</td>
                                    <td>
                                        {j.status === 'Open' && <button className="btn btn-danger btn-sm" onClick={() => updateJobPosting(j.id, { status: 'Closed' })}>Close</button>}
                                        {j.status === 'Closed' && <button className="btn btn-success btn-sm" onClick={() => updateJobPosting(j.id, { status: 'Open' })}>Re-open</button>}
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No opportunities found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// â”€â”€â”€ PAGE 5: EMPLOYMENT TRACKING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const EmploymentTracking = () => {
    const { trainees, getEmploymentStats } = useApp();
    const stats = getEmploymentStats();
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const filtered = trainees.filter(t => {
        const q = search.toLowerCase();
        return (t.name.toLowerCase().includes(q)) && (filterStatus === 'All' || t.employmentStatus === filterStatus);
    });
    return (
        <div>
            <div className="page-header"><div><div className="page-title">Employment Tracking</div><div className="page-subtitle">Monitor trainee employment outcomes</div></div></div>
            <div className="stats-grid" style={{ marginBottom: 20 }}>
                {[
                    { label: 'Employment Rate', value: `${stats.employmentRate}%`, icon: <TrendingUp size={22} color="#16a34a" />, bg: '#dcfce7' },
                    { label: 'Employed', value: stats.employed, icon: <CheckCircle size={22} color="#16a34a" />, bg: '#dcfce7' },
                    { label: 'Self-Employed', value: stats.selfEmployed, icon: <Building2 size={22} color="#2563eb" />, bg: '#dbeafe' },
                    { label: 'Unemployed', value: stats.unemployed, icon: <XCircle size={22} color="#dc2626" />, bg: '#fee2e2' },
                ].map((s, i) => (
                    <div key={i} className="stat-card"><div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div><div className="stat-info"><div className="stat-label">{s.label}</div><div className="stat-value">{s.value}</div></div></div>
                ))}
            </div>
            <div className="card">
                <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="search-bar" style={{ flex: 1, minWidth: 200 }}><Search size={14} color="#94a3b8" /><input placeholder="Search trainees..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                    <select className="form-select" style={{ width: 'auto', minWidth: 160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        {['All', 'Employed', 'Unemployed', 'Self-Employed', 'Underemployed'].map(s => <option key={s}>{s}</option>)}
                    </select>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead><tr><th>Name</th><th>Certifications</th><th>Status</th><th>Employer</th><th>Job Title</th><th>Date Hired</th></tr></thead>
                        <tbody>
                            {filtered.map(t => (
                                <tr key={t.id}>
                                    <td style={{ fontWeight: 600 }}>{t.name}</td>
                                    <td><div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{t.certifications?.slice(0, 2).map(c => <span key={c} className="badge badge-blue" style={{ fontSize: 10 }}>{c}</span>)}</div></td>
                                    <td><span className={`badge badge-${(t.employmentStatus || 'unemployed').toLowerCase().replace(' ', '-').replace('-', '-')}`}>{t.employmentStatus}</span></td>
                                    <td style={{ color: '#64748b', fontSize: 13 }}>{t.employer || 'â€”'}</td>
                                    <td style={{ color: '#64748b', fontSize: 13 }}>{t.jobTitle || 'â€”'}</td>
                                    <td style={{ color: '#64748b', fontSize: 13 }}>{t.dateHired || 'â€”'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// â”€â”€â”€ PAGE 6: ANALYTICS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Analytics = () => {
    const { trainees, jobPostings, partners, applications, getEmploymentStats, getSkillsDemand } = useApp();
    const stats = getEmploymentStats();
    const skillsDemand = getSkillsDemand();
    const empData = [
        { name: 'Employed', value: stats.employed, color: '#16a34a' },
        { name: 'Self-Employed', value: stats.selfEmployed, color: '#2563eb' },
        { name: 'Underemployed', value: stats.underEmployed, color: '#d97706' },
        { name: 'Unemployed', value: stats.unemployed, color: '#dc2626' },
    ];
    const opTypeData = [
        { type: 'Job', count: jobPostings.filter(j => j.opportunityType === 'Job').length },
        { type: 'OJT', count: jobPostings.filter(j => j.opportunityType === 'OJT').length },
        { type: 'Apprenticeship', count: jobPostings.filter(j => j.opportunityType === 'Apprenticeship').length },
    ];
    return (
        <div>
            <div className="page-header"><div><div className="page-title">Analytics Reports</div><div className="page-subtitle">Comprehensive data analysis and insights</div></div></div>
            <div className="stats-grid" style={{ marginBottom: 20 }}>
                {[
                    { label: 'Total Trainees', value: trainees.length, icon: <Users size={22} color="#7c3aed" />, bg: '#ede9fe' },
                    { label: 'Employment Rate', value: `${stats.employmentRate}%`, icon: <TrendingUp size={22} color="#16a34a" />, bg: '#dcfce7' },
                    { label: 'Open Opportunities', value: jobPostings.filter(j => j.status === 'Open').length, icon: <Briefcase size={22} color="#d97706" />, bg: '#fef3c7' },
                    { label: 'Active Partners', value: partners.filter(p => p.verificationStatus === 'Approved').length, icon: <Building2 size={22} color="#0ea5e9" />, bg: '#e0f2fe' },
                ].map((s, i) => (
                    <div key={i} className="stat-card"><div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div><div className="stat-info"><div className="stat-label">{s.label}</div><div className="stat-value">{s.value}</div></div></div>
                ))}
            </div>
            <div className="two-col" style={{ marginBottom: 20 }}>
                <div className="chart-wrap">
                    <div className="chart-title">Trainee Employment Distribution</div>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart><Pie data={empData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                            {empData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie><Tooltip /><Legend /></PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="chart-wrap">
                    <div className="chart-title">In-Demand Competencies</div>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={skillsDemand} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="skill" tick={{ fontSize: 9 }} interval={0} angle={-15} /><YAxis tick={{ fontSize: 11 }} allowDecimals={false} /><Tooltip />
                            <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="two-col">
                <div className="chart-wrap">
                    <div className="chart-title">Opportunities by Type</div>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={opTypeData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="type" tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip />
                            <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="chart-wrap">
                    <div className="chart-title">Summary</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '10px 0' }}>
                        {[
                            { label: 'Total applications', value: applications.length },
                            { label: 'Accepted', value: applications.filter(a => a.status === 'Accepted').length },
                            { label: 'Pending', value: applications.filter(a => a.status === 'Pending').length },
                            { label: 'Rejected', value: applications.filter(a => a.status === 'Rejected').length },
                            { label: 'Total opportunity postings', value: jobPostings.length },
                        ].map((r, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13.5 }}>
                                <span style={{ color: '#64748b' }}>{r.label}</span><span style={{ fontWeight: 700, color: '#0f172a' }}>{r.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// â”€â”€â”€ PAGE 7: ACCOUNT MANAGEMENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const AccountManagement = () => {
    const { trainees, partners, adminAccount, updateAccountStatus } = useApp();
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('All');
    const allAccounts = [
        ...trainees.map(t => ({ ...t, type: 'trainee', displayName: t.name, displayEmail: t.email })),
        ...partners.map(p => ({ ...p, type: 'partner', displayName: p.companyName, displayEmail: p.email })),
        { ...adminAccount, type: 'admin', displayName: adminAccount.name, displayEmail: adminAccount.email },
    ];
    const filtered = allAccounts.filter(a => {
        const q = search.toLowerCase();
        return (a.displayName.toLowerCase().includes(q) || a.displayEmail.toLowerCase().includes(q)) && (filterRole === 'All' || a.type === filterRole);
    });
    const statusBadge = (s) => {
        const map = { Active: 'badge-green', Disabled: 'badge-red', Suspended: 'badge-yellow' };
        return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
    };
    const roleBadge = (r) => {
        const map = { trainee: 'badge-blue', partner: 'badge-purple', admin: 'badge-red' };
        return <span className={`badge ${map[r] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{r}</span>;
    };
    const toggleStatus = (account) => {
        if (account.type === 'admin') return;
        const newStatus = account.accountStatus === 'Active' ? 'Disabled' : 'Active';
        updateAccountStatus(account.type, account.id, newStatus);
    };
    const suspendAccount = (account) => {
        if (account.type === 'admin') return;
        updateAccountStatus(account.type, account.id, 'Suspended');
    };
    return (
        <div>
            <div className="page-header"><div><div className="page-title">Account Management</div><div className="page-subtitle">Manage user accounts, enable/disable access</div></div></div>
            <div className="stats-grid" style={{ marginBottom: 20 }}>
                {[
                    { label: 'Total Accounts', value: allAccounts.length, icon: <Users size={22} color="#7c3aed" />, bg: '#ede9fe' },
                    { label: 'Active', value: allAccounts.filter(a => a.accountStatus === 'Active').length, icon: <CheckCircle size={22} color="#16a34a" />, bg: '#dcfce7' },
                    { label: 'Disabled', value: allAccounts.filter(a => a.accountStatus === 'Disabled').length, icon: <XCircle size={22} color="#dc2626" />, bg: '#fee2e2' },
                    { label: 'Suspended', value: allAccounts.filter(a => a.accountStatus === 'Suspended').length, icon: <AlertCircle size={22} color="#d97706" />, bg: '#fef3c7' },
                ].map((s, i) => (
                    <div key={i} className="stat-card"><div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div><div className="stat-info"><div className="stat-label">{s.label}</div><div className="stat-value">{s.value}</div></div></div>
                ))}
            </div>
            <div className="card">
                <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="search-bar" style={{ flex: 1, minWidth: 200 }}><Search size={14} color="#94a3b8" /><input placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                    <select className="form-select" style={{ width: 'auto', minWidth: 140 }} value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                        {['All', 'trainee', 'partner', 'admin'].map(r => <option key={r} value={r}>{r === 'All' ? 'All Roles' : r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                    </select>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {filtered.map((a, i) => (
                                <tr key={`${a.type}-${a.id}-${i}`}>
                                    <td style={{ fontWeight: 600 }}>{a.displayName}</td>
                                    <td style={{ fontSize: 13, color: '#64748b' }}>{a.displayEmail}</td>
                                    <td>{roleBadge(a.type)}</td>
                                    <td>{statusBadge(a.accountStatus)}</td>
                                    <td>
                                        {a.type !== 'admin' ? (
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button className="btn btn-outline btn-sm" onClick={() => toggleStatus(a)} title={a.accountStatus === 'Active' ? 'Disable' : 'Enable'}>
                                                    {a.accountStatus === 'Active' ? <><CheckCircle size={14} color="#16a34a" /> Disable</> : <><XCircle size={14} color="#dc2626" /> Enable</>}
                                                </button>
                                                {a.accountStatus !== 'Suspended' && (
                                                    <button className="btn btn-outline btn-sm" onClick={() => suspendAccount(a)} style={{ color: '#d97706' }}>
                                                        <AlertCircle size={13} /> Suspend
                                                    </button>
                                                )}
                                            </div>
                                        ) : <span style={{ fontSize: 12, color: '#94a3b8' }}>Protected</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// â”€â”€â”€ PAGE 8: ACTIVITY LOG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SystemActivityLog = () => {
    const { activityLog } = useApp();
    const [search, setSearch] = useState('');
    const [filterAction, setFilterAction] = useState('All');
    const [filterModule, setFilterModule] = useState('All');
    const [viewEntry, setViewEntry] = useState(null);
    const actions = ['All', ...new Set(activityLog.map(l => l.action))];
    const modules = ['All', ...new Set(activityLog.map(l => l.module))];
    const filtered = activityLog.filter(l => {
        const q = search.toLowerCase();
        return (l.user.toLowerCase().includes(q) || l.description.toLowerCase().includes(q)) && (filterAction === 'All' || l.action === filterAction) && (filterModule === 'All' || l.module === filterModule);
    });
    const actionBadge = (a) => {
        const map = { Create: 'badge-green', Edit: 'badge-blue', Delete: 'badge-red', 'Status Change': 'badge-yellow' };
        return <span className={`badge ${map[a] || 'badge-gray'}`}>{a}</span>;
    };
    return (
        <div>
            <div className="page-header"><div><div className="page-title">System Activity Log</div><div className="page-subtitle">Audit trail of all system actions</div></div>
                <div className="badge badge-purple">{activityLog.length} entries</div>
            </div>
            <div className="card">
                <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="search-bar" style={{ flex: 1, minWidth: 200 }}><Search size={14} color="#94a3b8" /><input placeholder="Search user or description..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                    <select className="form-select" style={{ width: 'auto', minWidth: 130 }} value={filterAction} onChange={e => setFilterAction(e.target.value)}>
                        {actions.map(a => <option key={a}>{a}</option>)}
                    </select>
                    <select className="form-select" style={{ width: 'auto', minWidth: 130 }} value={filterModule} onChange={e => setFilterModule(e.target.value)}>
                        {modules.map(m => <option key={m}>{m}</option>)}
                    </select>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Module</th><th>Description</th><th>Details</th></tr></thead>
                        <tbody>
                            {filtered.map(l => (
                                <tr key={l.id}>
                                    <td style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>{new Date(l.timestamp).toLocaleString()}</td>
                                    <td style={{ fontWeight: 600, fontSize: 13 }}>{l.user}</td>
                                    <td>{actionBadge(l.action)}</td>
                                    <td><span className="badge badge-gray">{l.module}</span></td>
                                    <td style={{ fontSize: 13, color: '#475569', maxWidth: 250 }}>{l.description}</td>
                                    <td><button className="btn btn-outline btn-sm" onClick={() => setViewEntry(l)}><Eye size={12} /> View</button></td>
                                </tr>
                            ))}
                            {filtered.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No activity entries found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
            {viewEntry && (
                <div className="modal-overlay" onClick={() => setViewEntry(null)}>
                    <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3 className="modal-title">Activity Log Details</h3><button className="btn btn-outline btn-icon" onClick={() => setViewEntry(null)}><X size={16} /></button></div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                            {[['User', viewEntry.user], ['Action', viewEntry.action], ['Module', viewEntry.module], ['Timestamp', new Date(viewEntry.timestamp).toLocaleString()]].map(([k, v]) => (
                                <div key={k} style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 8 }}><div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>{k}</div><div style={{ fontSize: 13, fontWeight: 500, color: '#475569' }}>{v}</div></div>
                            ))}
                        </div>
                        <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8, marginBottom: 12 }}>
                            <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Description</div>
                            <div style={{ fontSize: 13.5, color: '#475569', marginTop: 4 }}>{viewEntry.description}</div>
                        </div>
                        {(viewEntry.prevValue || viewEntry.newValue) && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div style={{ padding: '8px 12px', background: '#fee2e2', borderRadius: 8 }}><div style={{ fontSize: 10, color: '#dc2626', fontWeight: 600, textTransform: 'uppercase' }}>Previous Value</div><div style={{ fontSize: 13, color: '#991b1b', marginTop: 4 }}>{viewEntry.prevValue || 'â€”'}</div></div>
                                <div style={{ padding: '8px 12px', background: '#dcfce7', borderRadius: 8 }}><div style={{ fontSize: 10, color: '#16a34a', fontWeight: 600, textTransform: 'uppercase' }}>New Value</div><div style={{ fontSize: 13, color: '#166534', marginTop: 4 }}>{viewEntry.newValue || 'â€”'}</div></div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// â”€â”€â”€ PAGE 9: SYSTEM SETTINGS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SystemSettings = () => {
    const { appMetadata } = useApp();
    return (
        <div>
            <div className="page-header"><div><div className="page-title">System Settings</div><div className="page-subtitle">Configure platform settings and preferences</div></div></div>
            <div className="card" style={{ maxWidth: 600, marginBottom: 16 }}>
                <div className="section-title" style={{ marginBottom: 16 }}>Platform Information</div>
                {[['Platform Name', appMetadata.appName], ['Organization', appMetadata.orgName], ['Current Year', appMetadata.currentYear]].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ fontSize: 14, color: '#64748b' }}>{k}</span><span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{v}</span>
                    </div>
                ))}
            </div>
            <div className="card" style={{ maxWidth: 600 }}>
                <div className="section-title" style={{ marginBottom: 16 }}>Quick Settings</div>
                {['Email notifications', 'Auto-approve partners', 'Maintenance mode'].map((setting, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ fontSize: 14, color: '#475569' }}>{setting}</span>
                        <div style={{ width: 40, height: 22, borderRadius: 11, background: i === 0 ? '#16a34a' : '#e2e8f0', cursor: 'pointer', position: 'relative' }}>
                            <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: i === 0 ? 21 : 3, transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// â”€â”€â”€ MAIN EXPORT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function AdminDashboard() {
    const [activePage, setActivePage] = useState('dashboard');
    const pageMap = {
        dashboard: { title: 'Admin Dashboard', sub: 'System overview and management' },
        trainees: { title: 'Manage Trainees', sub: 'View and manage all registered trainees' },
        partners: { title: 'Industry Partners', sub: 'Manage and verify partner accounts' },
        jobs: { title: 'Opportunities Oversight', sub: 'Monitor all opportunity postings' },
        employment: { title: 'Employment Tracking', sub: 'Monitor trainee employment outcomes' },
        analytics: { title: 'Analytics Reports', sub: 'Comprehensive data analysis' },
        accounts: { title: 'Account Management', sub: 'Manage user accounts and access' },
        'activity-log': { title: 'System Activity Log', sub: 'Audit trail of system actions' },
        settings: { title: 'System Settings', sub: 'Platform configuration' },
    };
    const current = pageMap[activePage] || pageMap.dashboard;
    const renderPage = () => {
        switch (activePage) {
            case 'dashboard': return <AdminHome setActivePage={setActivePage} />;
            case 'trainees': return <ManageTrainees />;
            case 'partners': return <ManagePartners />;
            case 'jobs': return <OpportunitiesOversight />;
            case 'employment': return <EmploymentTracking />;
            case 'analytics': return <Analytics />;
            case 'accounts': return <AccountManagement />;
            case 'activity-log': return <SystemActivityLog />;
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
