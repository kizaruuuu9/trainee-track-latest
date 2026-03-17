import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import {
    LayoutDashboard, Users, Building2, Briefcase, TrendingUp, BarChart2,
    Settings, LogOut, Bell, ChevronDown, Search, Eye, Edit, CheckCircle,
    XCircle, Download, Plus, X, AlertCircle, FileText, Award, Shield,
    UserCheck, Clock, MapPin, Star, Filter, Trash2, Menu, MoreVertical
} from 'lucide-react';
import {
    BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';

// ─── TIME AGO HELPER ──────────────────────────────────────────────
const timeAgo = (dateStr) => {
    const raw = String(dateStr || '').trim();
    if (!raw) return 'Just now';

    const hasTimeInfo = raw.includes('T') || /\d{1,2}:\d{2}/.test(raw);
    const now = new Date();
    const date = new Date(raw);
    if (!Number.isFinite(date.getTime())) return 'Just now';

    if (!hasTimeInfo) {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const postDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayDiff = Math.floor((today - postDay) / (24 * 60 * 60 * 1000));
        if (dayDiff <= 0) return 'Today';
        if (dayDiff === 1) return '1d ago';
        if (dayDiff < 30) return `${dayDiff}d ago`;
        const months = Math.floor(dayDiff / 30);
        if (months < 12) return `${months}mo ago`;
        const years = Math.floor(months / 12);
        return `${years}y ago`;
    }

    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(months / 12);
    return `${years}y ago`;
};

// ─── LAYOUT ────────────────────────────────────────────────────────────────
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

// — SIDEBAR —————————————————————————————————————————————————————————————————
const AdminSidebar = ({ activePage, setActivePage, mobileOpen, closeSidebar }) => {
    const { logout } = useApp();
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} /> },
        { id: 'trainees', label: 'Manage Trainees', icon: <Users size={17} /> },
        { id: 'programs', label: 'TESDA Programs', icon: <Award size={17} /> },
        { id: 'partners', label: 'Industry Partners', icon: <Building2 size={17} /> },
        { id: 'accounts', label: 'Manage Accounts', icon: <UserCheck size={17} /> },
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

// — PAGE 1: ADMIN DASHBOARD —————————————————————————————————————————————————
const AdminHome = ({ setActivePage }) => {
    const { trainees, partners, jobPostings, getEmploymentStats, getSkillsDemand } = useApp();
    const stats = getEmploymentStats();
    const skillsDemand = getSkillsDemand();
    const statCards = [
        { label: 'Total Trainees', value: trainees.length, icon: <Users size={22} color="#7c3aed" />, bg: '#ede9fe', sub: `${stats.employed} employed` },
        { label: 'Employment Rate', value: `${stats.employmentRate}%`, icon: <TrendingUp size={22} color="#16a34a" />, bg: '#dcfce7', sub: `${stats.unemployed} still unemployed` },
        { label: 'Active Partners', value: partners.filter(p => p.verificationStatus === 'Verified').length, icon: <Building2 size={22} color="#0ea5e9" />, bg: '#e0f2fe', sub: `${partners.filter(p => p.verificationStatus === 'Pending').length} pending approval` },
        { label: 'Active Opportunities', value: jobPostings.filter(j => j.status === 'Open').length, icon: <Briefcase size={22} color="#d97706" />, bg: '#fef3c7', sub: `${jobPostings.length} total postings` },
    ];
    const employmentChartData = [
        { name: '🟦 Employed', value: stats.employed || 0, color: '#3b82f6' },
        { name: '🟨 Seeking Employment', value: stats.seeking_employment || 0, color: '#eab308' },
        { name: '🟥 Not Employed', value: stats.not_employed || 0, color: '#ef4444' },
    ];
    // Build cert data dynamically from all programs that trainees hold
    const allCerts = [...new Set(trainees.flatMap(t => (t.certifications || []).map(c => typeof c === 'object' ? c.name : c)).filter(Boolean))];
    const certData = allCerts.map(cert => ({
        name: cert.length > 25 ? cert.replace(/\(.*?\)/g, '').trim().substring(0, 25) + '…' : cert,
        fullName: cert,
        trainees: trainees.filter(t => (t.certifications || []).some(c => (typeof c === 'object' ? c.name : c) === cert)).length,
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
                        <PieChart><Pie data={employmentChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, value }) => value > 0 ? `${name}: ${value}` : null} labelLine={false}>
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
    const { trainees, updateTrainee, deleteTrainee } = useApp();
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [viewT, setViewT] = useState(null);
    const [editT, setEditT] = useState(null);
    const [activityNow, setActivityNow] = useState(Date.now());

    useEffect(() => {
        const timerId = setInterval(() => {
            setActivityNow(Date.now());
        }, 5000); // Smoother status updates
        return () => clearInterval(timerId);
    }, []);

    const filtered = (trainees || []).filter(t => {
        if (!t) return false;
        const q = search.toLowerCase();
        const name = (t?.profileName || t?.name || '').toLowerCase();
        const email = (t?.email || '').toLowerCase();
        const employmentStatus = t?.employmentStatus || 'Not Employed';
        return (name.includes(q) || email.includes(q)) && (filterStatus === 'All' || employmentStatus === filterStatus);
    });
    const statusBadge = (s) => {
        const map = { Employed: 'badge-employed', 'Seeking Employment': 'badge-seeking-employment', 'Not Employed': 'badge-unemployed' };
        return <span className={`badge ${map[s] || 'badge-gray'}`}>{s || 'None'}</span>;
    };

    const accountBadge = (status) => {
        const map = { Active: 'badge-green', Disabled: 'badge-red', Suspended: 'badge-yellow' };
        return <span className={`badge ${map[status] || 'badge-gray'}`}>{status || 'Active'}</span>;
    };

    const getActivityStatus = (status, lastSeenAt) => {
        const normalizedStatus = String(status || '').toLowerCase();
        if (normalizedStatus === 'offline') return 'Offline';

        const lastSeenTs = lastSeenAt ? new Date(lastSeenAt).getTime() : NaN;
        const isRecentlyActive = Number.isFinite(lastSeenTs) && (activityNow - lastSeenTs) <= 45 * 1000;

        return (normalizedStatus === 'online' || isRecentlyActive) ? 'Online' : 'Offline';
    };

    const activityBadge = (status, lastSeenAt) => {
        const normalized = getActivityStatus(status, lastSeenAt);
        return (
            <span
                className={`badge ${normalized === 'Online' ? 'badge-green' : 'badge-gray'}`}
                title={lastSeenAt ? `Last seen: ${new Date(lastSeenAt).toLocaleString()}` : 'No recent activity'}
            >
                {normalized}
            </span>
        );
    };

    console.log("AdminDashboard trainees array:", trainees, "filterStatus:", filterStatus, "filtered:", filtered);

    return (
        <div>
            <div className="page-header">
                <div>
                    <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        Manage Trainees
                        <div className="pulse-container" title="Live sync active">
                            <div className="pulse-dot"></div>
                            <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live</span>
                        </div>
                    </div>
                    <div className="page-subtitle">View and manage all registered trainees</div>
                </div>
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
                        <thead><tr><th>Profile Name</th><th>Auth Email</th><th>Program</th><th>Training Status</th><th>Employment Status</th><th>Activity</th><th>Account</th><th>Actions</th></tr></thead>
                        <tbody>
                            {filtered.map(t => (
                                <tr key={t.id}>
                                    <td style={{ fontWeight: 600 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #ede9fe, #dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#7c3aed' }}>{(t.profileName && t.profileName !== 'Trainee' ? t.profileName : (t.name || 'N')).charAt(0)}</div>{t.profileName || t.name || 'None'}</div></td>
                                    <td style={{ fontSize: 13, color: '#64748b' }}>{t.email && t.email !== 'Protected' ? t.email : 'None'}</td>
                                    <td><span className="badge badge-blue" style={{ fontSize: 11, fontWeight: 500 }}>{t.program}</span></td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span className={`badge ${t.trainingStatus === 'Graduated' ? 'badge-blue' : 'badge-gray'}`} style={{ fontSize: 11 }}>
                                            {t.trainingStatus === 'Student' ? 'Current Student' : t.trainingStatus}
                                        </span>
                                    </td>
                                    <td>{statusBadge(t.employmentStatus)}</td>
                                    <td>{activityBadge(t.activityStatus, t.lastSeenAt)}</td>
                                    <td>{accountBadge(t.accountStatus || 'Active')}</td>
                                    <td><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', minWidth: 180 }}>
                                        <button className="btn btn-outline btn-sm" onClick={() => setViewT(t)}><Eye size={12} /> View</button>
                                        <button className="btn btn-outline btn-sm" onClick={() => setEditT({ ...t })}><Edit size={12} /></button>
                                        <button className="btn btn-danger btn-sm" onClick={() => { if (window.confirm('Delete trainee?')) deleteTrainee(t.id); }}><Trash2 size={12} /></button>
                                    </div></td>
                                </tr>
                            ))}
                            {filtered.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No trainees found.</td></tr>}
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
                            <div style={{ marginTop: 8, display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>{viewT.certifications?.map((c, i) => <span key={i} className="badge badge-blue"><Award size={10} />{typeof c === 'object' ? c.name : c}</span>)}</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                            {[['Address', viewT.address], ['Birthday', viewT.birthday], ['Status', viewT.trainingStatus], ['Year', viewT.graduationYear], ['Employment', viewT.employmentStatus], ['Employer', viewT.employer || 'â€”']].map(([k, v]) => (
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
                        {[['name', 'Full Name', 'text'], ['email', 'Email', 'email'], ['address', 'Address', 'text']].map(([key, label, type]) => (
                            <div key={key} className="form-group"><label className="form-label">{label}</label><input type={type} className="form-input" value={editT[key] || ''} onChange={e => setEditT({ ...editT, [key]: e.target.value })} /></div>
                        ))}
                        <div className="form-group"><label className="form-label">Training Status</label>
                            <select className="form-select" value={editT.trainingStatus || 'Student'} onChange={e => {
                                setEditT({ ...editT, trainingStatus: e.target.value, graduationYear: e.target.value === 'Student' ? '' : editT.graduationYear });
                            }}>
                                <option value="Student">Student</option>
                                <option value="Graduated">Graduated</option>
                            </select>
                        </div>
                        {editT.trainingStatus === 'Graduated' && (
                            <div className="form-group"><label className="form-label">Graduation Year</label>
                                <input type="number" className="form-input" value={editT.graduationYear || ''} onChange={e => setEditT({ ...editT, graduationYear: e.target.value })} />
                            </div>
                        )}
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

// TESDA PROGRAMS: ADD / EDIT / DELETE WITH COMPETENCIES
const ManageTesdaPrograms = () => {
    const ncLevelOptions = ['NC I', 'NC II', 'NC III', 'NC IV'];
    const [programs, setPrograms] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editProgram, setEditProgram] = useState(null);
    const [supportsCompetenciesColumn, setSupportsCompetenciesColumn] = useState(true);
    const [supportsProgramNameKey, setSupportsProgramNameKey] = useState(true);
    const [popupMessage, setPopupMessage] = useState('');
    const [form, setForm] = useState({
        name: '',
        ncLevel: '',
        durationHours: '',
        description: '',
        competenciesText: '',
    });

    const openPopup = (message) => setPopupMessage(message || 'Something went wrong.');
    const closePopup = () => setPopupMessage('');

    const stripCode = (value = '') => value
        .replace(/^\s*[A-Z]{2,}\d+\s*[—-]\s*/i, '')
        .replace(/^\s*\d+\s*[—-]\s*/i, '')
        .replace(/^\s*[•\-*]\s*/, '')
        .trim();

    const normalizeProgramName = (value = '') => String(value)
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();

    const normalizeNcLevel = (value = '') => String(value)
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();

    const composeProgramNameKey = (name, ncLevel, durationHours) => {
        const safeNcLevel = normalizeNcLevel(ncLevel || '') || 'no-nc-level';
        const safeHours = Number.isFinite(durationHours) && durationHours > 0
            ? String(durationHours)
            : 'no-hours';

        return `${normalizeProgramName(name)}|${safeNcLevel}|${safeHours}`;
    };

    const parseCompetenciesText = (value = '') => {
        const unique = new Set();
        return value
            .split('\n')
            .map(line => stripCode(line))
            .filter(Boolean)
            .filter(item => {
                const key = item.toLowerCase();
                if (unique.has(key)) return false;
                unique.add(key);
                return true;
            });
    };

    const splitDescription = (description = '') => {
        if (!description) return { summary: '', competencies: [] };

        try {
            const parsed = JSON.parse(description);
            if (Array.isArray(parsed?.competencies)) {
                return {
                    summary: parsed.summary || '',
                    competencies: parsed.competencies.map(c => stripCode(String(c))).filter(Boolean),
                };
            }
        } catch (_) {
        }

        const lines = description.split('\n');
        const markerIndex = lines.findIndex(line => /^\s*competencies\s*:?.*$/i.test(line));

        if (markerIndex >= 0) {
            const summary = lines.slice(0, markerIndex).join('\n').trim();
            const competencies = lines.slice(markerIndex + 1).map(line => stripCode(line)).filter(Boolean);
            return { summary, competencies };
        }

        return { summary: description, competencies: [] };
    };

    const composeDescription = (summary, competencies) => {
        const cleanSummary = (summary || '').trim();
        return [
            cleanSummary,
            cleanSummary ? '' : null,
            'Competencies:',
            ...competencies.map(item => `• ${item}`),
        ].filter(Boolean).join('\n');
    };

    const isMissingCompetenciesColumnError = (error) => {
        if (!error) return false;
        if (error.code === 'PGRST204' || error.code === '42703') return true;

        const message = String(error.message || '').toLowerCase();
        return message.includes("could not find the 'competencies' column")
            || message.includes('column "competencies" does not exist')
            || message.includes('column competencies does not exist');
    };

    const isMissingProgramNameKeyColumnError = (error) => {
        if (!error) return false;
        if (error.code === 'PGRST204' || error.code === '42703') return true;

        const message = String(error.message || '').toLowerCase();
        return message.includes('name_key') && (
            message.includes('column')
            || message.includes('could not find')
        );
    };

    const isProgramNameKeyConflictError = (error) => {
        if (!error) return false;
        if (error.code !== '23505') return false;

        const message = String(error.message || '').toLowerCase();
        const details = String(error.details || '').toLowerCase();
        return message.includes('programs_name_key') || details.includes('programs_name_key');
    };

    const isMissingNormalizedCompetencyTablesError = (error) => {
        if (!error) return false;
        if (error.code === '42P01' || error.code === 'PGRST205' || error.code === 'PGRST204') return true;

        const message = String(error.message || '').toLowerCase();
        return message.includes('relation') && (
            message.includes('competencies')
            || message.includes('program_competencies')
        );
    };

    const normalizeCompetencyKey = (value = '') => String(value)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');

    const ensureProgramCompetencySync = async (programId, competencies) => {
        if (!programId || !Array.isArray(competencies) || competencies.length === 0) return;

        const expectedCount = competencies.length;

        const countExistingLinks = async () => {
            const countQuery = await supabase
                .from('program_competencies')
                .select('program_id', { count: 'exact', head: true })
                .eq('program_id', programId);

            if (countQuery.error) throw countQuery.error;
            return countQuery.count || 0;
        };

        try {
            const existingCount = await countExistingLinks();
            if (existingCount === expectedCount) return;

            const normalizedRows = competencies.map((item, index) => ({
                name: item,
                name_key: normalizeCompetencyKey(item),
                sort_order: index + 1,
            }));

            const competencyUpsert = await supabase
                .from('competencies')
                .upsert(
                    normalizedRows.map(({ name, name_key }) => ({ name, name_key })),
                    { onConflict: 'name_key' }
                );

            if (competencyUpsert.error) throw competencyUpsert.error;

            const keys = normalizedRows.map(row => row.name_key);
            const competencyFetch = await supabase
                .from('competencies')
                .select('id, name_key')
                .in('name_key', keys);

            if (competencyFetch.error) throw competencyFetch.error;

            const keyToId = new Map((competencyFetch.data || []).map(row => [row.name_key, row.id]));
            const missingKeys = keys.filter(key => !keyToId.has(key));
            if (missingKeys.length > 0) {
                throw new Error(`Missing competencies after upsert: ${missingKeys.join(', ')}`);
            }

            const deleteExisting = await supabase
                .from('program_competencies')
                .delete()
                .eq('program_id', programId);

            if (deleteExisting.error) throw deleteExisting.error;

            const linkRows = normalizedRows.map(row => ({
                program_id: programId,
                competency_id: keyToId.get(row.name_key),
                sort_order: row.sort_order,
            }));

            const insertLinks = await supabase
                .from('program_competencies')
                .insert(linkRows);

            if (insertLinks.error) throw insertLinks.error;

            const verifiedCount = await countExistingLinks();
            if (verifiedCount !== expectedCount) {
                throw new Error('Normalized competency sync incomplete.');
            }
        } catch (error) {
            if (isMissingNormalizedCompetencyTablesError(error)) {
                throw new Error('Required tables `competencies` and `program_competencies` are missing. Please run the setup SQL first.');
            }

            if (error.code === '42501') {
                throw new Error('Permission denied while syncing competencies tables. Please check Supabase RLS/policies for admin writes.');
            }

            throw error;
        }
    };

    const loadPrograms = async () => {
        setLoading(true);
        try {
            let useFallback = false;

            let { data, error } = await supabase
                .from('programs')
                .select('id, name, nc_level, duration_hours, description, competencies')
                .order('name', { ascending: true });

            if (error && isMissingCompetenciesColumnError(error)) {
                useFallback = true;
                setSupportsCompetenciesColumn(false);
                const fallback = await supabase
                    .from('programs')
                    .select('id, name, nc_level, duration_hours, description')
                    .order('name', { ascending: true });
                data = fallback.data;
                error = fallback.error;
            } else {
                setSupportsCompetenciesColumn(true);
            }

            if (error) throw error;

            const mapped = (data || []).map(row => {
                const fallbackParsed = splitDescription(row.description || '');
                const competencies = !useFallback && Array.isArray(row.competencies)
                    ? row.competencies.map(item => stripCode(String(item))).filter(Boolean)
                    : fallbackParsed.competencies;

                return {
                    id: row.id,
                    name: row.name || '',
                    ncLevel: row.nc_level || '',
                    durationHours: row.duration_hours || '',
                    description: useFallback ? (fallbackParsed.summary || '') : (row.description || ''),
                    competencies,
                };
            });

            setPrograms(mapped);
        } catch (err) {
            console.error('Failed to load programs:', err);
            openPopup('Failed to load TESDA programs.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPrograms();
    }, []);

    const openCreateModal = () => {
        setEditProgram(null);
        setForm({ name: '', ncLevel: '', durationHours: '', description: '', competenciesText: '' });
        setShowModal(true);
    };

    const openEditModal = (program) => {
        setEditProgram(program);
        setForm({
            name: program.name || '',
            ncLevel: program.ncLevel || '',
            durationHours: program.durationHours || '',
            description: program.description || '',
            competenciesText: (program.competencies || []).join('\n'),
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditProgram(null);
    };

    const saveProgram = async () => {
        const name = form.name.trim();
        const normalizedName = normalizeProgramName(name);
        const normalizedNcLevel = normalizeNcLevel(form.ncLevel);
        const competencies = parseCompetenciesText(form.competenciesText);
        const duration = Number(form.durationHours);
        const durationHours = Number.isFinite(duration) && duration > 0 ? Math.round(duration) : null;

        if (!name) {
            openPopup('Program name is required.');
            return;
        }

        if (competencies.length === 0) {
            openPopup('Please provide at least one competency.');
            return;
        }

        const duplicate = programs.find(program => {
            if (editProgram?.id && program.id === editProgram.id) return false;

            const sameName = normalizeProgramName(program.name) === normalizedName;
            const sameNcLevel = normalizeNcLevel(program.ncLevel || '') === normalizedNcLevel;
            const sameDuration = (program.durationHours || null) === durationHours;

            return sameName && sameNcLevel && sameDuration;
        });

        if (duplicate) {
            openPopup('This program already exists with the same Program Name, NC Level, and Duration. If this is a different version, change either the NC Level or Duration before saving.');
            return;
        }

        setSaving(true);
        try {
            const basePayload = {
                name,
                nc_level: form.ncLevel.trim() || null,
                duration_hours: durationHours,
            };

            const computedNameKey = composeProgramNameKey(name, form.ncLevel, durationHours);

            const writeRecord = async (withCompetenciesColumn, withNameKeyColumn) => {
                const payload = withCompetenciesColumn
                    ? {
                        ...basePayload,
                        description: form.description.trim() || null,
                        competencies,
                    }
                    : {
                        ...basePayload,
                        description: composeDescription(form.description, competencies),
                    };

                if (withNameKeyColumn) {
                    payload.name_key = computedNameKey;
                }

                if (editProgram?.id) {
                    return supabase
                        .from('programs')
                        .update(payload)
                        .eq('id', editProgram.id)
                        .select()
                        .single();
                }

                return supabase
                    .from('programs')
                    .insert([payload])
                    .select()
                    .single();
            };

            let { data: savedRecord, error } = await writeRecord(supportsCompetenciesColumn, supportsProgramNameKey);

            if (error && supportsProgramNameKey && isMissingProgramNameKeyColumnError(error)) {
                setSupportsProgramNameKey(false);
                const retryWithoutNameKey = await writeRecord(supportsCompetenciesColumn, false);
                savedRecord = retryWithoutNameKey.data;
                error = retryWithoutNameKey.error;
            }

            if (!error && supportsCompetenciesColumn && savedRecord?.id) {
                const savedComps = Array.isArray(savedRecord.competencies)
                    ? savedRecord.competencies.map(item => stripCode(String(item))).filter(Boolean)
                    : [];

                const expectedSet = new Set(competencies.map(item => item.toLowerCase()));
                const savedSet = new Set(savedComps.map(item => item.toLowerCase()));
                const matchesExpected = expectedSet.size === savedSet.size
                    && [...expectedSet].every(item => savedSet.has(item));

                if (!matchesExpected) {
                    const verifyPayload = {
                        competencies,
                        description: form.description.trim() || null,
                    };

                    const verify = await supabase
                        .from('programs')
                        .update(verifyPayload)
                        .eq('id', savedRecord.id)
                        .select('id, competencies')
                        .single();

                    error = verify.error;
                }
            }

            if (error && supportsCompetenciesColumn && isMissingCompetenciesColumnError(error)) {
                setSupportsCompetenciesColumn(false);
                const retry = await writeRecord(false, supportsProgramNameKey);
                savedRecord = retry.data;
                error = retry.error;

                if (error && supportsProgramNameKey && isMissingProgramNameKeyColumnError(error)) {
                    setSupportsProgramNameKey(false);
                    const secondRetry = await writeRecord(false, false);
                    savedRecord = secondRetry.data;
                    error = secondRetry.error;
                }
            }

            if (error && isProgramNameKeyConflictError(error)) {
                throw new Error('Program name conflict: same name is only allowed when NC Level and Hours are different. Please ensure your database `programs.name_key` uses name + NC level + hours, then try again.');
            }

            if (error) throw error;

            if (savedRecord?.id) {
                await ensureProgramCompetencySync(savedRecord.id, competencies);
            }

            closeModal();
            await loadPrograms();
        } catch (err) {
            console.error('Failed to save program:', err);
            openPopup(err.message || 'Failed to save program.');
        } finally {
            setSaving(false);
        }
    };

    const deleteProgram = async (program) => {
        if (!window.confirm(`Delete program "${program.name}"?`)) return;
        try {
            const { error } = await supabase.from('programs').delete().eq('id', program.id);
            if (error) throw error;
            await loadPrograms();
        } catch (err) {
            console.error('Failed to delete program:', err);
            openPopup(err.message || 'Failed to delete program. It may still be referenced by students.');
        }
    };

    const filteredPrograms = programs.filter(program => {
        const q = search.toLowerCase();
        return program.name.toLowerCase().includes(q) || (program.ncLevel || '').toLowerCase().includes(q);
    });

    return (
        <div>
            <div className="page-header">
                <div>
                    <div className="page-title">TESDA Programs</div>
                    <div className="page-subtitle">Add, edit, and delete programs with their competencies</div>
                </div>
                <button className="btn btn-primary" onClick={openCreateModal}><Plus size={14} /> Add Program</button>
            </div>

            <div className="card">
                <div style={{ marginBottom: 16 }}>
                    <div className="search-bar" style={{ maxWidth: 420 }}>
                        <Search size={14} color="#94a3b8" />
                        <input placeholder="Search program or NC level..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Program</th>
                                <th>NC Level</th>
                                <th>Duration (hrs)</th>
                                <th>Competencies</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 26, color: '#94a3b8' }}>Loading programs...</td></tr>
                            )}
                            {!loading && filteredPrograms.map(program => (
                                <tr key={program.id}>
                                    <td style={{ fontWeight: 700 }}>{program.name}</td>
                                    <td><span className="badge badge-blue">{program.ncLevel || 'N/A'}</span></td>
                                    <td>{program.durationHours || 'N/A'}</td>
                                    <td>
                                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{program.competencies.length} competency{program.competencies.length === 1 ? '' : 'ies'}</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                            {program.competencies.slice(0, 2).map(item => (
                                                <span key={item} className="badge badge-gray" style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item}</span>
                                            ))}
                                            {program.competencies.length > 2 && <span className="badge badge-gray">+{program.competencies.length - 2} more</span>}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn btn-outline btn-sm" onClick={() => openEditModal(program)}><Edit size={12} /> Edit</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => deleteProgram(program)}><Trash2 size={12} /> Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && filteredPrograms.length === 0 && (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>No TESDA programs found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" style={{ maxWidth: 780, width: '95%' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editProgram ? 'Edit TESDA Program' : 'Add TESDA Program'}</h3>
                            <button className="btn btn-outline btn-icon" onClick={closeModal}><X size={16} /></button>
                        </div>

                        <div className="two-col" style={{ gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
                            <div className="form-group">
                                <label className="form-label">Program Name</label>
                                <input className="form-input" value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Bread and Pastry Production" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">NC Level</label>
                                <select
                                    className="form-select"
                                    value={form.ncLevel}
                                    onChange={e => setForm(prev => ({ ...prev, ncLevel: e.target.value }))}
                                >
                                    <option value="">Select NC Level</option>
                                    {ncLevelOptions.map(level => (
                                        <option key={level} value={level}>{level}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="two-col" style={{ gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
                            <div className="form-group">
                                <label className="form-label">Duration (Hours)</label>
                                <input type="number" min="1" className="form-input" value={form.durationHours} onChange={e => setForm(prev => ({ ...prev, durationHours: e.target.value }))} placeholder="e.g. 137" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description (Optional)</label>
                                <input className="form-input" value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Short program summary" />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: 14 }}>
                            <label className="form-label">Competencies (one per line)</label>
                            <textarea
                                className="form-input"
                                value={form.competenciesText}
                                onChange={e => setForm(prev => ({ ...prev, competenciesText: e.target.value }))}
                                rows={12}
                                placeholder={"Participate in Workplace Communication\nWork in Team Environment\nPrepare and Produce Bakery Products"}
                                style={{ minHeight: 260, resize: 'vertical' }}
                            />
                            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 6 }}>
                                TESDA codes are optional and will be removed automatically.
                            </div>
                            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4, lineHeight: 1.45 }}>
                                To avoid duplicates: You cannot save two programs with the same Program Name, NC Level, and Duration. If one of these is different, it will be treated as a different program version.
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button className="btn btn-outline" style={{ flex: 1 }} onClick={closeModal} disabled={saving}>Cancel</button>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={saveProgram} disabled={saving}>
                                <CheckCircle size={15} /> {saving ? 'Saving...' : (editProgram ? 'Save Changes' : 'Add Program')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {popupMessage && (
                <div className="modal-overlay" onClick={closePopup}>
                    <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Notice</h3>
                            <button className="btn btn-outline btn-icon" onClick={closePopup}><X size={16} /></button>
                        </div>
                        <p style={{ margin: 0, fontSize: 14, color: '#334155', lineHeight: 1.6 }}>{popupMessage}</p>
                        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-primary" onClick={closePopup}>OK</button>
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
    const [partnerDocs, setPartnerDocs] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [actionReasonById, setActionReasonById] = useState({});
    const [openPartnerMenuKey, setOpenPartnerMenuKey] = useState(null);
    const [activityNow, setActivityNow] = useState(Date.now());

    useEffect(() => {
        const timerId = setInterval(() => {
            setActivityNow(Date.now());
        }, 15000);
        return () => clearInterval(timerId);
    }, []);

    const reasonOptions = ['Incomplete Verification', 'Policy Violation', 'Fraudulent Information', 'Duplicate Account', 'Other'];
    const getActionReason = (partnerId) => actionReasonById[partnerId] || '';
    const setActionReason = (partnerId, reason) => {
        setActionReasonById(prev => ({ ...prev, [partnerId]: reason }));
    };
    const togglePartnerMenu = (key) => setOpenPartnerMenuKey(prev => prev === key ? null : key);
    const isPartnerMenuOpen = (key) => openPartnerMenuKey === key;

    useEffect(() => {
        if (!openPartnerMenuKey) return;
        const close = (e) => {
            if (e.type === 'keydown' && e.key !== 'Escape') return;
            setOpenPartnerMenuKey(null);
        };
        document.addEventListener('mousedown', close);
        document.addEventListener('keydown', close);
        return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close); };
    }, [openPartnerMenuKey]);

    // Only show partners who submitted for verification (not just registered)
    const submittedPartners = partners.filter(p => p.verificationStatus !== 'Pending');

    const filtered = submittedPartners.filter(p => {
        const q = search.toLowerCase();
        const profileName = (p.profileName || p.companyName || '').toLowerCase();
        const companyName = (p.companyName || '').toLowerCase();
        const contactPerson = (p.contactPerson || '').toLowerCase();
        const authEmail = (p.email || '').toLowerCase();
        return (profileName.includes(q) || companyName.includes(q) || contactPerson.includes(q) || authEmail.includes(q)) && (filterStatus === 'All' || p.verificationStatus === filterStatus);
    });
    const statusBadge = (s) => {
        const map = { Verified: 'badge-approved', Pending: 'badge-pending', Rejected: 'badge-rejected', 'Under Review': 'badge-pending' };
        return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
    };

    const accountBadge = (status) => {
        const map = { Active: 'badge-green', Disabled: 'badge-red', Suspended: 'badge-yellow' };
        return <span className={`badge ${map[status] || 'badge-gray'}`}>{status || 'Active'}</span>;
    };

    const getActivityStatus = (status, lastSeenAt) => {
        const normalizedStatus = String(status || '').toLowerCase();
        if (normalizedStatus === 'offline') return 'Offline';

        const lastSeenTs = lastSeenAt ? new Date(lastSeenAt).getTime() : NaN;
        const isRecentlyActive = Number.isFinite(lastSeenTs) && (activityNow - lastSeenTs) <= 45 * 1000;

        return (normalizedStatus === 'online' || isRecentlyActive) ? 'Online' : 'Offline';
    };

    const activityBadge = (status, lastSeenAt) => {
        const normalized = getActivityStatus(status, lastSeenAt);
        return (
            <span
                className={`badge ${normalized === 'Online' ? 'badge-green' : 'badge-gray'}`}
                title={lastSeenAt ? `Last seen: ${new Date(lastSeenAt).toLocaleString()}` : 'No recent activity'}
            >
                {normalized}
            </span>
        );
    };

    const openPartnerView = async (partner) => {
        setViewPartner(partner);
        setLoadingDocs(true);
        setPartnerDocs([]);
        try {
            const res = await fetch(`/api/partner-verification/${partner.id}`);
            if (res.ok) {
                const data = await res.json();
                setPartnerDocs(data.documents || []);
            }
        } catch (err) {
            console.error('Failed to fetch partner docs:', err);
        }
        setLoadingDocs(false);
    };

    const canApprove = (status) => status !== 'Verified';
    const canReject = (status) => status !== 'Rejected';

    return (
        <div>
            <div className="page-header">
                <div>
                    <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        Industry Partners
                        <div className="pulse-container" title="Live sync active">
                            <div className="pulse-dot"></div>
                            <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live</span>
                        </div>
                    </div>
                    <div className="page-subtitle">Manage and verify industry partner accounts</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['All', 'Under Review', 'Verified', 'Rejected'].map(s => (
                        <button key={s} className={`btn btn-${filterStatus === s ? 'primary' : 'outline'} btn-sm`} onClick={() => setFilterStatus(s)}>
                            {s} ({s === 'All' ? submittedPartners.length : submittedPartners.filter(p => p.verificationStatus === s).length})
                        </button>
                    ))}
                </div>
            </div>
            {submittedPartners.filter(p => p.verificationStatus === 'Under Review').length > 0 && (
                <div className="alert alert-warning" style={{ marginBottom: 16 }}><AlertCircle size={16} /><strong>{submittedPartners.filter(p => p.verificationStatus === 'Under Review').length} partner(s)</strong> are awaiting verification.</div>
            )}
            <div className="card">
                <div style={{ marginBottom: 14 }}><div className="search-bar" style={{ maxWidth: 320 }}><Search size={14} color="#94a3b8" /><input placeholder="Search company or contact..." value={search} onChange={e => setSearch(e.target.value)} /></div></div>
                <div style={{ overflow: 'visible' }}>
                    <table className="data-table">
                        <thead><tr><th>Company</th><th>Profile Name</th><th>Contact Person</th><th>Industry</th><th>Auth Email</th><th>Activity</th><th>Verification</th><th>Account</th><th className="account-actions-column">Actions</th></tr></thead>
                        <tbody>
                            {filtered.map(p => (
                                <tr key={p.id}>
                                    <td style={{ fontWeight: 600 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #e0f2fe, #ede9fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#0ea5e9' }}>{p.companyName?.charAt(0)}</div><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{p.companyName}{p.verificationStatus === 'Verified' && <CheckCircle size={14} color="#0a66c2" title="Verified" />}</span></div></td>
                                    <td style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>{p.profileName || p.companyName || 'None'}</td>
                                    <td style={{ fontSize: 13, color: '#64748b' }}>{p.contactPerson}</td>
                                    <td><span className="badge badge-gray">{p.industry}</span></td>
                                    <td style={{ fontSize: 13, color: '#64748b' }}>{p.email}</td>
                                    <td>{activityBadge(p.activityStatus, p.lastSeenAt)}</td>
                                    <td>{statusBadge(p.verificationStatus)}</td>
                                    <td>{accountBadge(p.accountStatus || 'Active')}</td>
                                    <td className="account-actions-column">
                                        <div className={`account-actions-cell${isPartnerMenuOpen(p.id) ? ' is-open' : ''}`} onMouseDown={e => e.stopPropagation()}>
                                            <button
                                                className={`account-actions-trigger${isPartnerMenuOpen(p.id) ? ' is-open' : ''}`}
                                                onClick={() => togglePartnerMenu(p.id)}
                                                title="Actions"
                                            >
                                                <MoreVertical size={16} />
                                            </button>
                                            {isPartnerMenuOpen(p.id) && (
                                                <div className="account-actions-panel" onMouseDown={e => e.stopPropagation()}>
                                                    <div className="account-actions-header">Partner Actions</div>
                                                    <button className="account-actions-item" onClick={() => { openPartnerView(p); setOpenPartnerMenuKey(null); }}>
                                                        <Eye size={14} /> View Details
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No partners found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
            {viewPartner && (
                <div className="modal-overlay" onClick={() => setViewPartner(null)}>
                    <div className="modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3 className="modal-title">Partner Details</h3><button className="btn btn-outline btn-icon" onClick={() => setViewPartner(null)}><X size={16} /></button></div>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{ width: 60, height: 60, borderRadius: 14, background: 'linear-gradient(135deg, #e0f2fe, #ede9fe)', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#0ea5e9' }}>{viewPartner.companyName?.charAt(0)}</div>
                            <div style={{ fontWeight: 800, fontSize: 18, display: 'inline-flex', alignItems: 'center', gap: 8 }}>{viewPartner.companyName}{viewPartner.verificationStatus === 'Verified' && <CheckCircle size={16} color="#0a66c2" title="Verified" />}</div>
                            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>{viewPartner.industry}</div>
                            {statusBadge(viewPartner.verificationStatus)}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                            {[['Profile Name', viewPartner.profileName || viewPartner.companyName], ['Contact', viewPartner.contactPerson], ['Auth Email', viewPartner.email], ['Contact Email', viewPartner.contactEmail || '—'], ['Address', viewPartner.address], ['Size', viewPartner.companySize], ['Website', viewPartner.website], ['Activity', viewPartner.activityStatus || 'Offline']].map(([k, v]) => (
                                <div key={k} style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 8 }}><div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>{k}</div><div style={{ fontSize: 13, fontWeight: 500, color: '#475569' }}>{v || '–'}</div></div>
                            ))}
                        </div>
                        <div style={{ marginBottom: 14 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Verification Documents</div>
                            {loadingDocs ? (
                                <div style={{ textAlign: 'center', padding: '16px 0', color: '#94a3b8', fontSize: 13 }}>Loading documents...</div>
                            ) : partnerDocs.length > 0 ? (
                                partnerDocs.map(doc => (
                                    <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{doc.label}</div>
                                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{doc.file_name} • {new Date(doc.uploaded_at).toLocaleDateString()}</div>
                                        </div>
                                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm" style={{ textDecoration: 'none' }}>
                                            <Eye size={12} /> View
                                        </a>
                                    </div>
                                ))
                            ) : (
                                <div style={{ padding: '12px 0', fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>No documents uploaded yet.</div>
                            )}
                        </div>
                        {(canApprove(viewPartner.verificationStatus) || canReject(viewPartner.verificationStatus)) && (
                            <div>
                                {canReject(viewPartner.verificationStatus) && (
                                    <div style={{ marginBottom: 10 }}>
                                        <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Reject Reason</label>
                                        <select
                                            className="form-select"
                                            style={{ width: '100%', marginBottom: 10 }}
                                            value={getActionReason(viewPartner.id)}
                                            onChange={e => setActionReason(viewPartner.id, e.target.value)}
                                        >
                                            <option value="" disabled>-- Select reason --</option>
                                            {reasonOptions.map(reason => <option key={reason} value={reason}>{reason}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: 10 }}>
                                    {canReject(viewPartner.verificationStatus) && (
                                        <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => {
                                            const reason = getActionReason(viewPartner.id);
                                            if (!reason) { alert('Please select a reject reason first.'); return; }
                                            rejectPartner(viewPartner.id, reason);
                                            setViewPartner(null);
                                        }}><XCircle size={15} /> Reject</button>
                                    )}
                                    {canApprove(viewPartner.verificationStatus) && <button className="btn btn-success" style={{ flex: 1 }} onClick={() => { approvePartner(viewPartner.id); setViewPartner(null); }}><CheckCircle size={15} /> Approve</button>}
                                </div>
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
    const { jobPostings, updateJobPosting, deleteJobPosting } = useApp();
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterType, setFilterType] = useState('All');
    const [openMenuId, setOpenMenuId] = useState(null);

    const toggleMenu = (id) => setOpenMenuId(openMenuId === id ? null : id);

    useEffect(() => {
        if (!openMenuId) return;
        const close = (e) => {
            if (e.target.closest('.account-actions-cell')) return;
            setOpenMenuId(null);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [openMenuId]);

    const handleDelete = async (job) => {
        if (!window.confirm(`Delete opportunity "${job.title}"? This action cannot be undone.`)) return;
        await deleteJobPosting(job.id);
        setOpenMenuId(null);
    };

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
                <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
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
                                    <td style={{ fontSize: 12.5, color: '#64748b' }} title={new Date(j.createdAt).toLocaleString()}>{timeAgo(j.createdAt)}</td>
                                    <td>{statusBadge(j.status)}</td>
                                    <td>
                                        <div className={`account-actions-cell${openMenuId === j.id ? ' is-open' : ''}`}>
                                            <button
                                                className={`account-actions-trigger${openMenuId === j.id ? ' is-open' : ''}`}
                                                onClick={() => toggleMenu(j.id)}
                                                title="Actions"
                                            >
                                                <MoreVertical size={16} />
                                            </button>
                                            {openMenuId === j.id && (
                                                <div className="account-actions-panel" style={{ right: 0 }}>
                                                    <div className="account-actions-header">Opportunity Actions</div>
                                                    {j.status === 'Open' ? (
                                                        <button className="account-actions-item" onClick={() => { updateJobPosting(j.id, { status: 'Closed' }); setOpenMenuId(null); }}>
                                                            <XCircle size={14} /> Close Posting
                                                        </button>
                                                    ) : (
                                                        <button className="account-actions-item" onClick={() => { updateJobPosting(j.id, { status: 'Open' }); setOpenMenuId(null); }}>
                                                            <CheckCircle size={14} /> Re-open Posting
                                                        </button>
                                                    )}
                                                    <button className="account-actions-item" style={{ color: '#ef4444' }} onClick={() => handleDelete(j)}>
                                                        <Trash2 size={14} /> Delete Post
                                                    </button>
                                                </div>
                                            )}
                                        </div>
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
                    { label: 'Employed', value: stats.employed, icon: <CheckCircle size={22} color="#2563eb" />, bg: '#dbeafe' },
                    { label: 'Seeking Employment', value: stats.seeking_employment, icon: <Building2 size={22} color="#eab308" />, bg: '#fef9c3' },
                    { label: 'Not Employed', value: stats.not_employed, icon: <XCircle size={22} color="#dc2626" />, bg: '#fee2e2' },
                ].map((s, i) => (
                    <div key={i} className="stat-card"><div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div><div className="stat-info"><div className="stat-label">{s.label}</div><div className="stat-value">{s.value}</div></div></div>
                ))}
            </div>
            <div className="card">
                <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="search-bar" style={{ flex: 1, minWidth: 200 }}><Search size={14} color="#94a3b8" /><input placeholder="Search trainees..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                    <select className="form-select" style={{ width: 'auto', minWidth: 160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        {['All', 'Employed', 'Seeking Employment', 'Not Employed'].map(s => <option key={s}>{s}</option>)}
                    </select>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead><tr><th>Name</th><th>Certifications</th><th>Status</th><th>Employer</th><th>Job Title</th><th>Date Hired</th></tr></thead>
                        <tbody>
                            {filtered.map(t => (
                                <tr key={t.id}>
                                    <td style={{ fontWeight: 600 }}>{t.name}</td>
                                    <td><div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{t.certifications?.slice(0, 2).map((c, i) => <span key={i} className="badge badge-blue" style={{ fontSize: 10 }}>{typeof c === 'object' ? c.name : c}</span>)}</div></td>
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
        { name: '🟦 Employed', value: stats.employed, color: '#3b82f6' },
        { name: '🟨 Seeking Employment', value: stats.seeking_employment, color: '#eab308' },
        { name: '🟥 Not Employed', value: stats.not_employed, color: '#ef4444' },
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
                    { label: 'Active Partners', value: partners.filter(p => p.verificationStatus === 'Verified').length, icon: <Building2 size={22} color="#0ea5e9" />, bg: '#e0f2fe' },
                ].map((s, i) => (
                    <div key={i} className="stat-card"><div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div><div className="stat-info"><div className="stat-label">{s.label}</div><div className="stat-value">{s.value}</div></div></div>
                ))}
            </div>
            <div className="two-col" style={{ marginBottom: 20 }}>
                <div className="chart-wrap">
                    <div className="chart-title">Trainee Employment Distribution</div>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart><Pie data={empData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value" label={({ name, value }) => value > 0 ? `${name}: ${value}` : null} labelLine={false}>
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
    const { trainees, partners, updateAccountStatus, deleteAccount } = useApp();
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('All');
    const [actionReasonById, setActionReasonById] = useState({});
    const [openActionMenuKey, setOpenActionMenuKey] = useState('');
    const [accountPendingDelete, setAccountPendingDelete] = useState(null);
    const [deletingAccountKey, setDeletingAccountKey] = useState('');
    const [activityNow, setActivityNow] = useState(Date.now());
    const reasonOptions = ['Policy Violation', 'Fraudulent Information', 'Duplicate Account', 'Requested Deactivation', 'Other'];

    useEffect(() => {
        const timerId = setInterval(() => {
            setActivityNow(Date.now());
        }, 15000);
        return () => clearInterval(timerId);
    }, []);

    const allAccounts = [
        ...trainees.map(t => ({
            ...t,
            type: 'trainee',
            roleLabel: 'Student',
            displayName: t.profileName || t.name || 'Student',
            displayEmail: t.email && t.email !== 'Protected' ? t.email : 'None',
            activityStatus: t.activityStatus || 'Offline',
            lastSeenAt: t.lastSeenAt || null,
        })),
        ...partners.map(p => ({
            ...p,
            type: 'partner',
            roleLabel: 'Partner',
            displayName: p.profileName || p.companyName || 'Industry Partner',
            displayEmail: p.email && p.email !== 'Protected' ? p.email : 'None',
            activityStatus: p.activityStatus || 'Offline',
            lastSeenAt: p.lastSeenAt || null,
        })),
    ];

    const filtered = allAccounts.filter(a => {
        const q = search.toLowerCase();
        return (a.displayName.toLowerCase().includes(q) || a.displayEmail.toLowerCase().includes(q)) && (filterRole === 'All' || a.type === filterRole);
    });

    const accountBadge = (s) => {
        const map = { Active: 'badge-green', Disabled: 'badge-red', Suspended: 'badge-yellow' };
        return <span className={`badge ${map[s] || 'badge-gray'}`}>{s || 'Active'}</span>;
    };

    const roleBadge = (r) => {
        const map = { trainee: 'badge-blue', partner: 'badge-purple' };
        const label = r === 'trainee' ? 'Student' : 'Partner';
        return <span className={`badge ${map[r] || 'badge-gray'}`}>{label}</span>;
    };

    const getActivityStatus = (status, lastSeenAt) => {
        const normalizedStatus = String(status || '').toLowerCase();
        if (normalizedStatus === 'offline') return 'Offline';

        const lastSeenTs = lastSeenAt ? new Date(lastSeenAt).getTime() : NaN;
        const isRecentlyActive = Number.isFinite(lastSeenTs) && (activityNow - lastSeenTs) <= 45 * 1000;
        return (normalizedStatus === 'online' || isRecentlyActive) ? 'Online' : 'Offline';
    };

    const activityBadge = (status, lastSeenAt) => {
        const normalized = getActivityStatus(status, lastSeenAt);
        return (
            <span
                className={`badge ${normalized === 'Online' ? 'badge-green' : 'badge-gray'}`}
                title={lastSeenAt ? `Last seen: ${new Date(lastSeenAt).toLocaleString()}` : 'No recent activity'}
            >
                {normalized}
            </span>
        );
    };

    const reasonKey = (account) => `${account.type}-${account.id}`;

    const getActionReason = (account) => {
        const key = reasonKey(account);
        return actionReasonById[key] || '';
    };

    const setActionReason = (account, reason) => {
        const key = reasonKey(account);
        setActionReasonById(prev => ({ ...prev, [key]: reason }));
    };

    useEffect(() => {
        if (!openActionMenuKey) return undefined;

        const handlePointerDown = (event) => {
            if (event.target.closest('.account-actions-cell')) return;
            setOpenActionMenuKey('');
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') setOpenActionMenuKey('');
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [openActionMenuKey]);

    const applyAccountAction = (account, nextStatus) => {
        updateAccountStatus(account.type, account.id, nextStatus, getActionReason(account));
    };

    const toggleActionMenu = (account) => {
        const key = reasonKey(account);
        setOpenActionMenuKey(prev => (prev === key ? '' : key));
    };

    const isActionMenuOpen = (account) => openActionMenuKey === reasonKey(account);

    const handleAccountStatusAction = (account, nextStatus) => {
        if (!getActionReason(account)) {
            alert('Please select a reason before taking action.');
            return;
        }
        applyAccountAction(account, nextStatus);
        setOpenActionMenuKey('');
    };

    const handleDeleteAccount = (account) => {
        setOpenActionMenuKey('');
        setAccountPendingDelete(account);
    };

    const confirmDeleteAccount = async () => {
        if (!accountPendingDelete) return;

        const key = reasonKey(accountPendingDelete);
        setDeletingAccountKey(key);
        try {
            await deleteAccount(accountPendingDelete.type, accountPendingDelete.id);
            setAccountPendingDelete(null);
        } finally {
            setDeletingAccountKey('');
        }
    };

    const cancelDeleteAccount = () => {
        if (!deletingAccountKey) {
            setAccountPendingDelete(null);
        }
    };

    const isDeleting = (account) => deletingAccountKey === reasonKey(account);
    const pendingDeleteLabel = accountPendingDelete?.roleLabel || 'Account';
    const pendingDeleteName = accountPendingDelete?.displayName || '';
    const isDeleteInProgress = Boolean(deletingAccountKey);

    const modalDeleteKey = accountPendingDelete ? reasonKey(accountPendingDelete) : '';
    const isModalDeleting = isDeleteInProgress && modalDeleteKey === deletingAccountKey;

    const canCloseModal = !isModalDeleting;

    const onModalOverlayClick = () => {
        if (canCloseModal) cancelDeleteAccount();
    };

    return (
        <div>
            <div className="page-header"><div><div className="page-title">Manage Accounts</div><div className="page-subtitle">View and manage student and partner accounts</div></div></div>
            <div className="stats-grid" style={{ marginBottom: 20 }}>
                {[
                    { label: 'Total Accounts', value: allAccounts.length, icon: <Users size={22} color="#7c3aed" />, bg: '#ede9fe' },
                    { label: 'Online', value: allAccounts.filter(a => getActivityStatus(a.activityStatus, a.lastSeenAt) === 'Online').length, icon: <Clock size={22} color="#16a34a" />, bg: '#dcfce7' },
                    { label: 'Active', value: allAccounts.filter(a => (a.accountStatus || 'Active') === 'Active').length, icon: <CheckCircle size={22} color="#2563eb" />, bg: '#dbeafe' },
                    { label: 'Suspended', value: allAccounts.filter(a => a.accountStatus === 'Suspended').length, icon: <AlertCircle size={22} color="#d97706" />, bg: '#fef3c7' },
                ].map((s, i) => (
                    <div key={i} className="stat-card"><div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div><div className="stat-info"><div className="stat-label">{s.label}</div><div className="stat-value">{s.value}</div></div></div>
                ))}
            </div>
            <div className="card">
                <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="search-bar" style={{ flex: 1, minWidth: 200 }}><Search size={14} color="#94a3b8" /><input placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                    <select className="form-select" style={{ width: 'auto', minWidth: 140 }} value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                        {['All', 'trainee', 'partner'].map(r => <option key={r} value={r}>{r === 'All' ? 'All Roles' : r === 'trainee' ? 'Student' : 'Partner'}</option>)}
                    </select>
                </div>
                <div style={{ overflow: 'visible' }}>
                    <table className="data-table">
                        <thead><tr><th>Profile Name</th><th>Auth Email</th><th>Role</th><th>Activity</th><th>Account</th><th className="account-actions-column">Actions</th></tr></thead>
                        <tbody>
                            {filtered.map((a, i) => (
                                <tr key={`${a.type}-${a.id}-${i}`}>
                                    <td style={{ fontWeight: 600 }}>{a.displayName}</td>
                                    <td style={{ fontSize: 13, color: '#64748b' }}>{a.displayEmail}</td>
                                    <td>{roleBadge(a.type)}</td>
                                    <td>{activityBadge(a.activityStatus, a.lastSeenAt)}</td>
                                    <td>{accountBadge(a.accountStatus || 'Active')}</td>
                                    <td className="account-actions-column">
                                        <div className={`account-actions-cell${isActionMenuOpen(a) ? ' is-open' : ''}`}>
                                            <button
                                                type="button"
                                                className={`account-actions-trigger ${isActionMenuOpen(a) ? 'is-open' : ''}`}
                                                onClick={() => toggleActionMenu(a)}
                                                aria-haspopup="menu"
                                                aria-expanded={isActionMenuOpen(a)}
                                                aria-label={`Open actions for ${a.displayName}`}
                                            >
                                                <MoreVertical size={16} />
                                            </button>
                                            {isActionMenuOpen(a) && (
                                                <div className="account-actions-panel" role="menu">
                                                    <div className="account-actions-panel-header">Account Actions</div>
                                                    <label className="account-actions-label">Reason</label>
                                                    <select
                                                        className="form-select account-actions-select"
                                                        value={getActionReason(a)}
                                                        onChange={e => setActionReason(a, e.target.value)}
                                                    >
                                                        <option value="" disabled>-- Select reason --</option>
                                                        {reasonOptions.map(reason => <option key={reason} value={reason}>{reason}</option>)}
                                                    </select>
                                                    <div className="account-actions-divider" />
                                                    {(a.accountStatus || 'Active') === 'Active' ? (
                                                        <button type="button" className="account-actions-item" onClick={() => handleAccountStatusAction(a, 'Disabled')}>
                                                            <XCircle size={14} /> Disable
                                                        </button>
                                                    ) : (
                                                        <button type="button" className="account-actions-item" onClick={() => handleAccountStatusAction(a, 'Active')}>
                                                            <CheckCircle size={14} /> Enable
                                                        </button>
                                                    )}
                                                    {(a.accountStatus || 'Active') !== 'Suspended' && (
                                                        <button type="button" className="account-actions-item warning" onClick={() => handleAccountStatusAction(a, 'Suspended')}>
                                                            <AlertCircle size={14} /> Suspend
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className="account-actions-item danger"
                                                        onClick={() => handleDeleteAccount(a)}
                                                        disabled={isDeleting(a)}
                                                    >
                                                        <Trash2 size={14} /> {isDeleting(a) ? 'Deleting...' : 'Delete'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
                                        No accounts found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {accountPendingDelete && (
                <div className="modal-overlay" onClick={onModalOverlayClick}>
                    <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Confirm Delete</h3>
                            <button className="btn btn-ghost btn-sm" onClick={cancelDeleteAccount} disabled={!canCloseModal}>×</button>
                        </div>
                        <p style={{ marginTop: 0, marginBottom: 8, color: '#334155' }}>
                            Delete {pendingDeleteLabel} account: <strong>{pendingDeleteName}</strong>?
                        </p>
                        <p style={{ marginTop: 0, marginBottom: 16, color: '#64748b', fontSize: 13 }}>
                            This will permanently remove the account and all related records.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <button className="btn btn-outline btn-sm" onClick={cancelDeleteAccount} disabled={!canCloseModal}>Cancel</button>
                            <button className="btn btn-danger btn-sm" onClick={confirmDeleteAccount} disabled={isModalDeleting}>
                                <Trash2 size={12} /> {isModalDeleting ? 'Deleting...' : 'Delete Permanently'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
    const navigate = useNavigate();
    const location = useLocation();

    // Deduce active page from URL for visual consistency in child components
    const path = location.pathname.split('/').pop();
    const activePage = (path === 'admin' || !path) ? 'dashboard' : path;

    // Mock setActivePage to use navigate for smooth integration with existing buttons
    const setActivePage = (page) => {
        if (page === 'dashboard') {
            navigate('/admin');
        } else {
            navigate(`/admin/${page}`);
        }
    };

    const pageMap = {
        dashboard: { title: 'Admin Dashboard', sub: 'System overview and management' },
        trainees: { title: 'Manage Trainees', sub: 'View and manage all registered trainees' },
        programs: { title: 'TESDA Programs', sub: 'Manage TESDA programs and competencies' },
        partners: { title: 'Industry Partners', sub: 'Manage and verify partner accounts' },
        jobs: { title: 'Opportunities Oversight', sub: 'Monitor all opportunity postings' },
        employment: { title: 'Employment Tracking', sub: 'Monitor trainee employment outcomes' },
        analytics: { title: 'Analytics Reports', sub: 'Comprehensive data analysis' },
        accounts: { title: 'Manage Accounts', sub: 'View and manage student and partner accounts' },
        'activity-log': { title: 'System Activity Log', sub: 'Audit trail of system actions' },
        settings: { title: 'System Settings', sub: 'Platform configuration' },
    };

    const current = pageMap[activePage] || pageMap.dashboard;

    return (
        <AppLayout sidebar={<AdminSidebar activePage={activePage} setActivePage={setActivePage} />} pageTitle={current.title} pageSubtitle={current.sub}>
            <Routes>
                <Route path="/" element={<AdminHome setActivePage={setActivePage} />} />
                <Route path="/trainees" element={<ManageTrainees />} />
                <Route path="/programs" element={<ManageTesdaPrograms />} />
                <Route path="/partners" element={<ManagePartners />} />
                <Route path="/jobs" element={<OpportunitiesOversight />} />
                <Route path="/employment" element={<EmploymentTracking />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/accounts" element={<AccountManagement />} />
                <Route path="/activity-log" element={<SystemActivityLog />} />
                <Route path="/settings" element={<SystemSettings />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
        </AppLayout>
    );
}
