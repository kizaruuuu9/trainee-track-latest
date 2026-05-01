import React, { useEffect, useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import {
    LayoutDashboard, Users, Building2, Briefcase, TrendingUp, BarChart2,
    Settings, LogOut, Bell, ChevronDown, Search, Eye, Edit, CheckCircle,
    XCircle, Download, Plus, X, AlertCircle, FileText, Award, Shield,
    UserCheck, Clock, MapPin, Star, Filter, Trash2, Menu, MoreVertical,
    ChevronLeft, ChevronRight, BookOpen
} from 'lucide-react';
import {
    BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import BrandLogo from '../common/BrandLogo';
import TrainingBulletin from './TrainingBulletin';
import NotificationsDropdown from '../common/NotificationsDropdown';
import toast from 'react-hot-toast';
import NotificationsPage from './NotificationsPage';

// --- SHARED: TABLE PAGINATION ---
const TablePagination = ({ currentPage, totalItems, pageSize, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / pageSize);
    if (totalPages <= 1) return null;

    const startIdx = (currentPage - 1) * pageSize + 1;
    const endIdx = Math.min(totalItems, currentPage * pageSize);

    return (
        <div className="admin-pagination">
            <div className="admin-pagination-info">
                Showing <b>{startIdx}</b> to <b>{endIdx}</b> of <b>{totalItems}</b> entries
            </div>
            <div className="admin-pagination-controls">
                <button
                    className="admin-pagination-btn"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                >
                    <ChevronLeft size={16} />
                </button>

                <div className="admin-pagination-numbers">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1))
                        .map((p, i, arr) => (
                            <React.Fragment key={p}>
                                {i > 0 && arr[i - 1] !== p - 1 && <span className="admin-pagination-ellipsis" style={{ color: '#94a3b8', padding: '0 4px' }}>...</span>}
                                <button
                                    className={`admin-pagination-num ${currentPage === p ? 'active' : ''}`}
                                    onClick={() => onPageChange(p)}
                                >
                                    {p}
                                </button>
                            </React.Fragment>
                        ))}
                </div>

                <button
                    className="admin-pagination-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

// --- TIME AGO HELPER ---
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

// --- LAYOUT ---
const AppLayout = ({ sidebar, children, pageTitle, pageSubtitle }) => {
    const { currentUser, logout, notifications, lastSeenNotificationsAt, updateLastSeenNotificationsAt, confirmAction } = useApp();
    const [showProfile, setShowProfile] = useState(false);
    const [showNotif, setShowNotif] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const notifRef = useRef(null);

    const unreadNotifications = notifications?.filter(n => !n.read) || [];
    const unseenCount = lastSeenNotificationsAt
        ? unreadNotifications.filter(n => new Date(n.created_at).getTime() > lastSeenNotificationsAt).length
        : unreadNotifications.length;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotif(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                        <div style={{ position: 'relative' }} ref={notifRef}>
                            <button
                                className="header-icon-btn"
                                onClick={() => {
                                    setShowNotif(!showNotif);
                                    if (!showNotif && unseenCount > 0) {
                                        updateLastSeenNotificationsAt();
                                    }
                                }}
                            >
                                <Bell size={17} />
                                {unseenCount > 0 && <span className="notif-badge">{unseenCount > 99 ? '99+' : unseenCount}</span>}
                            </button>
                            {showNotif && (
                                <NotificationsDropdown onClose={() => setShowNotif(false)} />
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

// --- SIDEBAR ---
const AdminSidebar = ({ activePage, setActivePage, mobileOpen, closeSidebar }) => {
    const { logout } = useApp();

    // State to manage expanded/collapsed categories
    const [expandedCategories, setExpandedCategories] = useState({
        'Overview': true,
        'User Management': true,
        'Training & Employment': true,
        'Content & Opportunities': true,
        'System': true
    });

    const toggleCategory = (categoryTitle) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryTitle]: !prev[categoryTitle]
        }));
    };

    // Categorized navigation structure
    const navCategories = [
        {
            title: 'Overview',
            items: [
                { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} /> },
                { id: 'analytics', label: 'Analytics Reports', icon: <BarChart2 size={17} /> },
            ]
        },
        {
            title: 'User Management',
            items: [
                { id: 'accounts', label: 'Manage Accounts', icon: <UserCheck size={17} /> },
                { id: 'trainees', label: 'Manage Trainees', icon: <Users size={17} /> },
                { id: 'partners', label: 'Industry Partners', icon: <Building2 size={17} /> },
            ]
        },
        {
            title: 'Training & Employment',
            items: [
                { id: 'programs', label: 'TESDA Programs', icon: <Award size={17} /> },
                { id: 'employment', label: 'Employment Tracking', icon: <TrendingUp size={17} /> },
            ]
        },
        {
            title: 'Content & Opportunities',
            items: [
                { id: 'bulletin', label: 'Training Bulletin', icon: <BookOpen size={17} /> },
                { id: 'jobs', label: 'Opportunities Oversight', icon: <Briefcase size={17} /> },
            ]
        },
        {
            title: 'System',
            items: [
                { id: 'activity-log', label: 'Activity Log', icon: <FileText size={17} /> },
                { id: 'settings', label: 'System Settings', icon: <Settings size={17} /> },
            ]
        }
    ];

    const handleNav = (id) => {
        setActivePage(id);
        if (closeSidebar) closeSidebar();
    };

    return (
        <nav className={`sidebar ${mobileOpen ? 'open' : ''}`} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div className="sidebar-brand" style={{ paddingBottom: '20px', borderBottom: '1px solid #e2e8f0', marginBottom: '16px', flexShrink: 0 }}>
                <BrandLogo
                    size={40}
                    fallbackClassName="sidebar-logo"
                    fallbackStyle={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}
                />
                <div className="sidebar-brand-text">
                    <div className="sidebar-brand-name" style={{ fontWeight: 800 }}>TraineeTrack</div>
                    <div className="sidebar-brand-sub" style={{ color: '#64748b', fontSize: 12 }}>Admin Panel</div>
                </div>
            </div>

            <style>{`
                .sidebar-nav::-webkit-scrollbar { width: 4px; }
                .sidebar-nav::-webkit-scrollbar-track { background: transparent; }
                .sidebar-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
                .sidebar-nav:hover::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); }
            `}</style>
            <div className="sidebar-nav" style={{ flex: 1, paddingRight: '8px', overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
                {navCategories.map((category) => {
                    const isExpanded = expandedCategories[category.title];

                    return (
                        <div key={category.title} style={{ marginBottom: '12px' }}>
                            {/* Category Header */}
                            <div
                                onClick={() => toggleCategory(category.title)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    color: '#94a3b8',
                                    userSelect: 'none',
                                    transition: 'color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#475569'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                            >
                                <span style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    {category.title}
                                </span>
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </div>

                            {/* Category Items (Collapsible) */}
                            {isExpanded && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                                    {category.items.map(item => (
                                        <div
                                            key={item.id}
                                            className={`sidebar-item ${activePage === item.id ? 'active' : ''}`}
                                            onClick={() => handleNav(item.id)}
                                            style={{
                                                paddingLeft: '16px',
                                                margin: '0 8px',
                                                borderRadius: '8px',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <span style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: activePage === item.id ? '#FFFFFF' : '#64748b'
                                            }}>
                                                {item.icon}
                                            </span>
                                            <span style={{
                                                fontWeight: activePage === item.id ? 600 : 500,
                                                color: activePage === item.id ? '#FFFFFF' : '#475569'
                                            }}>
                                                {item.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="sidebar-footer" style={{ borderTop: '1px solid #e2e8f0', marginTop: 'auto', paddingTop: '16px', flexShrink: 0 }}>
                <div className="sidebar-user" style={{ marginBottom: '12px' }}>
                    <div className="sidebar-avatar" style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>AD</div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name" style={{ fontWeight: 600 }}>PSTDII Admin</div>
                        <div className="sidebar-user-role" style={{ fontSize: 12, color: '#64748b' }}>Administrator</div>
                    </div>
                </div>
                <div
                    className="sidebar-item"
                    onClick={logout}
                    style={{
                        color: '#ef4444',
                        margin: '0 8px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    <LogOut size={16} /> <span style={{ fontWeight: 500 }}>Sign Out</span>
                </div>
            </div>
        </nav>
    );
};

// --- PAGE 1: ADMIN DASHBOARD ---
// --- PAGE 1: ADMIN DASHBOARD (COMMAND CENTER) ---
const AdminHome = ({ setActivePage }) => {
    const { trainees, partners, posts, applications, getEmploymentStats, getSkillsDemand } = useApp();
    const stats = getEmploymentStats();

    // Export Handlers (Mock)
    const handleExportReport = () => toast.success("Compiling full platform report into PDF...");
    const handleExportCSV = () => toast.success("Exporting table data to CSV...");
    const handleExportChart = (chartName) => toast.success(`Exporting ${chartName} as PNG...`);

    // KPI Calculations
    const activePartners = partners.filter(p => p.verificationStatus === 'Verified').length;
    const pendingMatches = applications.filter(a => a.status === 'Pending').length;

    // Competency Supply vs Demand (Grouped Bar Chart)
    const skillsDemand = getSkillsDemand();
    const supplyDemandData = skillsDemand.map(d => {
        const supply = trainees.filter(t =>
            (t.skills || []).some(s => (typeof s === 'object' ? s.name : s).toLowerCase() === d.skill.toLowerCase()) ||
            (t.competencies || []).some(c => c.toLowerCase() === d.skill.toLowerCase()) ||
            (t.certifications || []).some(c => (typeof c === 'object' ? c.name : c).toLowerCase().includes(d.skill.toLowerCase()))
        ).length;
        return {
            name: d.skill.length > 15 ? d.skill.substring(0, 15) + '...' : d.skill,
            Demand: d.count,
            Supply: supply
        };
    });

    // Top Performing Sectors (Donut Chart)
    const sectors = {};
    posts.filter(p => p.post_type === 'hiring_update').forEach(j => {
        const ind = j.industry || 'General';
        sectors[ind] = (sectors[ind] || 0) + 1;
    });
    const sectorData = Object.keys(sectors).map(k => ({ name: k, value: sectors[k] })).sort((a, b) => b.value - a.value).slice(0, 5);
    const COLORS = ['#7c3aed', '#0ea5e9', '#16a34a', '#d97706', '#db2777'];

    // Normalized Date Formatter
    const formatNormalizedDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    };

    // Table Data Prep
    const recentMatches = applications.slice().sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt)).slice(0, 4).map(app => {
        const trainee = trainees.find(t => t.id === app.traineeId);
        const job = posts.find(p => p.post_type === 'hiring_update' && String(p.id) === String(app.jobId));
        return { ...app, traineeName: trainee?.name || 'Unknown Trainee', jobTitle: job?.title || 'Unknown Job', company: job?.companyName || 'Unknown Company' };
    });

    return (
        <div>
            {/* Header with Report Export */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: 16, padding: '22px 28px', marginBottom: 24, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <div style={{ fontSize: 22, fontWeight: 800 }}>Command Center</div>
                    <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Real-time graduate employability & competency tracking</div>
                </div>
                <button className="btn btn-primary" style={{ background: '#7c3aed', border: 'none', gap: 8 }} onClick={handleExportReport}>
                    <Download size={15} /> Generate Report (PDF)
                </button>
            </div>

            {/* KPI Cards */}
            <div className="stats-grid" style={{ marginBottom: 24 }}>
                <div className="stat-card" style={{ borderLeft: '4px solid #7c3aed' }}>
                    <div className="stat-info"><div className="stat-label">Total Active Partners</div><div className="stat-value" style={{ fontSize: 28 }}>{activePartners}</div><div className="stat-sub">Verified & recruiting</div></div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid #16a34a' }}>
                    <div className="stat-info"><div className="stat-label">Placement Rate</div><div className="stat-value" style={{ fontSize: 28 }}>{stats.employmentRate}%</div><div className="stat-sub">{stats.employed} graduates hired</div></div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid #d97706' }}>
                    <div className="stat-info"><div className="stat-label">Pending Job Matches</div><div className="stat-value" style={{ fontSize: 28 }}>{pendingMatches}</div><div className="stat-sub">Awaiting partner review</div></div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid #0ea5e9' }}>
                    <div className="stat-info"><div className="stat-label">Active Opportunities</div><div className="stat-value" style={{ fontSize: 28 }}>{posts.filter(p => p.post_type === 'hiring_update' && p.status === 'Open').length}</div><div className="stat-sub">Open job postings</div></div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="two-col" style={{ marginBottom: 24 }}>
                <div className="chart-wrap" style={{ position: 'relative' }}>
                    <button onClick={() => handleExportChart('Competency Chart')} style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }} title="Export Chart"><Download size={16} /></button>
                    <div className="chart-title">Competency Supply vs. Demand</div>
                    <div className="chart-subtitle">Market demand vs. actual certified graduates</div>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={supplyDemandData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={60} />
                            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                            <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                            <Bar dataKey="Demand" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={20} />
                            <Bar dataKey="Supply" fill="#7c3aed" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="chart-wrap" style={{ position: 'relative' }}>
                    <button onClick={() => handleExportChart('Sectors Chart')} style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }} title="Export Chart"><Download size={16} /></button>
                    <div className="chart-title">Top Hiring Sectors</div>
                    <div className="chart-subtitle">Opportunities distributed by industry</div>
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie data={sectorData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={4} dataKey="value" stroke="none">
                                {sectorData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                            <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: 12 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Actionable Data Table */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>Recent Placement Pipeline Activity</div>
                        <div style={{ fontSize: 13, color: '#64748b' }}>Latest applications and partner matches</div>
                    </div>
                    <button className="btn btn-outline btn-sm" onClick={handleExportCSV}><Download size={14} /> Export Data (CSV)</button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Trainee Candidate</th>
                                <th>Matched Role</th>
                                <th>Industry Partner</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentMatches.map((match, i) => (
                                <tr key={i}>
                                    <td style={{ fontSize: 12, color: '#64748b' }}>{formatNormalizedDate(match.appliedAt)}</td>
                                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{match.traineeName}</td>
                                    <td style={{ fontSize: 13, color: '#475569' }}>{match.jobTitle}</td>
                                    <td style={{ fontSize: 13, color: '#475569' }}><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Building2 size={13} color="#94a3b8" />{match.company}</div></td>
                                    <td>
                                        <span className={`badge badge-${match.status.toLowerCase() === 'accepted' ? 'green' : match.status.toLowerCase() === 'rejected' ? 'red' : 'yellow'}`}>
                                            {match.status}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="btn btn-ghost btn-icon" title="View Details"><MoreVertical size={16} color="#94a3b8" /></button>
                                    </td>
                                </tr>
                            ))}
                            {recentMatches.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>No recent matches found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- PAGE 2: MANAGE TRAINEES ---
const ManageTrainees = () => {
    const { trainees, totalTrainees, updateTrainee, deleteTrainee, confirmAction, fetchAdminDirectoryData } = useApp();
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [viewT, setViewT] = useState(null);
    const [editT, setEditT] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const pageSize = 15;

    // Reset page when search or filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterStatus]);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await fetchAdminDirectoryData(currentPage, pageSize, search);
            setIsLoading(false);
        };
        loadData();
    }, [currentPage, search, fetchAdminDirectoryData]);

    useEffect(() => {
        if (!openMenuId) return undefined;
        const handleDown = (e) => {
            if (!e.target.closest('.account-actions-cell')) setOpenMenuId(null);
        };
        document.addEventListener('mousedown', handleDown);
        return () => document.removeEventListener('mousedown', handleDown);
    }, [openMenuId]);

    const filtered = (trainees || []).filter(t => {
        if (!t) return false;
        // Search is handled by server, we only filter by employment status locally
        const employmentStatus = t?.employmentStatus || 'Not Employed';
        return filterStatus === 'All' || employmentStatus === filterStatus;
    });

    // Since server already sliced the data, we show what we got
    const displayedItems = filtered.slice(0, pageSize);


    const statusBadge = (s) => {
        const colorMap = {
            'Employed': '#057642',
            'Seeking Employment': '#0a66c2',
            'Certified': '#7c3aed',
            'Seeking OJT': '#ea580c',
            'OJT In Progress': '#ca8a04',
        };
        const bg = colorMap[s] || '#64748b';
        return <span className="badge" style={{ background: bg, color: 'white' }}>{s || 'None'}</span>;
    };

    const accountBadge = (status) => {
        const map = { Active: 'badge-green', Disabled: 'badge-red', Suspended: 'badge-yellow' };
        return <span className={`badge ${map[status] || 'badge-gray'}`}>{status || 'Active'}</span>;
    };





    return (
        <div>
            <div className="page-header">
                <div>
                    <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        Manage Trainees
                    </div>
                    <div className="page-subtitle">View and manage all registered trainees</div>
                </div>
            </div>
            <div className="card">
                <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="search-bar" style={{ flex: 1, minWidth: 200 }}><Search size={14} color="#94a3b8" /><input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                    <select className="form-select" style={{ width: 'auto', minWidth: 180 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        {['All', 'Employed', 'Seeking Employment', 'Not Employed'].map(s => <option key={s}>{s}</option>)}
                    </select>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead><tr><th>Profile Name</th><th>Auth Email</th><th>Program</th><th>Training Status</th><th>Employment Status</th><th>Account</th><th className="account-actions-column">Actions</th></tr></thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0' }}>
                                        <div className="spinner" style={{ margin: '0 auto', width: 24, height: 24, border: '3px solid #f3f4f6', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                        <div style={{ marginTop: 12, color: '#64748b', fontSize: 14 }}>Loading trainees...</div>
                                    </td>
                                </tr>
                            ) : displayedItems.map(t => (
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
                                    <td>{accountBadge(t.accountStatus || 'Active')}</td>
                                    <td className="account-actions-column">
                                        <div className={`account-actions-cell${openMenuId === t.id ? ' is-open' : ''}`}>
                                            <button
                                                className={`account-actions-trigger${openMenuId === t.id ? ' is-open' : ''}`}
                                                onClick={() => setOpenMenuId(prev => prev === t.id ? null : t.id)}
                                            >
                                                <MoreVertical size={16} />
                                            </button>
                                            {openMenuId === t.id && (
                                                <div className="account-actions-panel" style={{ right: 0 }}>
                                                    <div className="account-actions-header">Trainee Actions</div>
                                                    <button className="account-actions-item" onClick={() => { setViewT(t); setOpenMenuId(null); }}>
                                                        <Eye size={14} /> View Details
                                                    </button>
                                                    <button className="account-actions-item" onClick={() => { setEditT({ ...t }); setOpenMenuId(null); }}>
                                                        <Edit size={14} /> Edit Profile
                                                    </button>
                                                    <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />
                                                    <button className="account-actions-item" style={{ color: '#ef4444' }} onClick={() => {
                                                        setOpenMenuId(null);
                                                        confirmAction({ 
                                                            message: 'Delete trainee?', 
                                                            type: 'danger', 
                                                            onConfirm: async () => {
                                                                try {
                                                                    await deleteTrainee(t.id);
                                                                    toast.success('Trainee deleted successfully');
                                                                } catch (err) {
                                                                    toast.error('Failed to delete trainee');
                                                                }
                                                            } 
                                                        });
                                                    }}>
                                                        <Trash2 size={14} /> Delete Trainee
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!isLoading && filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No trainees found.</td></tr>}
                        </tbody>
                    </table>
                </div>
                <TablePagination
                    currentPage={currentPage}
                    totalItems={totalTrainees}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                />

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
                            {[['Address', viewT.address], ['Birthday', viewT.birthday], ['Status', viewT.trainingStatus], ['Year', viewT.graduationYear], ['Employment', viewT.employmentStatus], ['Employer', viewT.employer || '-']].map(([k, v]) => (
                                <div key={k} style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 8 }}>
                                    <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>{k}</div>
                                    <div style={{ fontSize: 13.5, fontWeight: 500, color: '#475569' }}>{v || '-'}</div>
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
                                <input type="number" min="1950" max="2099" className="form-input" placeholder="YYYY" maxLength={4} onInput={e => { if (e.target.value.length > 4) e.target.value = e.target.value.slice(0, 4); }} value={editT.graduationYear || ''} onChange={e => setEditT({ ...editT, graduationYear: e.target.value })} />
                            </div>
                        )}
                        <div className="form-group"><label className="form-label">Career Status</label>
                            <select className="form-select" value={editT.employmentStatus} onChange={e => setEditT({ ...editT, employmentStatus: e.target.value })}>
                                <option value="Employed">🟢 Employed</option>
                                <option value="Seeking Employment">🔵 Seeking Employment</option>
                                <option value="Not Employed">🔴 Not Employed</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setEditT(null)}>Cancel</button>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={async () => { 
                                 try {
                                     await updateTrainee(editT.id, editT); 
                                     toast.success('Trainee profile updated');
                                     setEditT(null); 
                                 } catch (err) {
                                     toast.error('Failed to update trainee');
                                 }
                             }}><CheckCircle size={15} /> Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- TESDA PROGRAMS: ADD / EDIT / DELETE WITH COMPETENCIES ---
const ManageTesdaPrograms = () => {
    const ncLevelOptions = ['NC I', 'NC II', 'NC III', 'NC IV'];
    const { programs, fetchPrograms } = useApp();
    const [totalPrograms, setTotalPrograms] = useState(0);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
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
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 20;

    // Reset page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

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
        } catch {
            // ignore error
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

    const loadPrograms = async (force = false) => {
        setIsLoading(true);
        try {
            const res = await fetchPrograms(currentPage, pageSize, search, force);
            if (res && res.total !== undefined) setTotalPrograms(res.total);
        } catch (err) {
            console.error('Failed to load programs:', err);
            openPopup('Failed to load TESDA programs.');
        } finally {
            setLoading(false);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadPrograms();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, search]);

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
            toast.success(editProgram ? 'Program updated' : 'Program added');
            await loadPrograms(true);
        } catch (err) {
            console.error('Failed to save program:', err);
            toast.error(err.message || 'Failed to save program.');
        } finally {
            setSaving(false);
        }
    };

    const deleteProgram = async (program) => {
        if (!window.confirm(`Delete program "${program.name}"?`)) return;
        try {
            const { error } = await supabase.from('programs').delete().eq('id', program.id);
            if (error) throw error;
            toast.success('Program deleted');
            await loadPrograms(true);
        } catch (err) {
            console.error('Failed to delete program:', err);
            toast.error('Failed to delete program. It may still be referenced by students.');
        }
    };

    const displayedItems = programs;

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
                            {(loading || isLoading) ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px 0' }}>
                                        <div className="spinner" style={{ margin: '0 auto', width: 24, height: 24, border: '3px solid #f3f4f6', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                        <div style={{ marginTop: 12, color: '#64748b', fontSize: 14 }}>Loading programs...</div>
                                    </td>
                                </tr>
                            ) : displayedItems.map(program => (
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
                            {!(loading || isLoading) && programs.length === 0 && (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>No TESDA programs found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <TablePagination
                    currentPage={currentPage}
                    totalItems={totalPrograms}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                />
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

// ————————————————————————————————————————————————————————————————————————————
const ManagePartners = () => {
    const { partners, totalPartners, approvePartner, rejectPartner, updatePartner, fetchAdminDirectoryData } = useApp();
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [viewPartner, setViewPartner] = useState(null);
    const [editPartner, setEditPartner] = useState(null);
    const [partnerDocs, setPartnerDocs] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [actionReasonById, setActionReasonById] = useState({});
    const [openPartnerMenuKey, setOpenPartnerMenuKey] = useState(null);
    const [menuPos, setMenuPos] = useState({ top: 'auto', bottom: 'auto', left: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const pageSize = 15;

    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterStatus]);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await fetchAdminDirectoryData(currentPage, pageSize, search);
            setIsLoading(false);
        };
        loadData();
    }, [currentPage, search, fetchAdminDirectoryData]);

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

    const submittedPartners = partners;

    const filtered = submittedPartners.filter(p => {
        // Search is handled by server, we only filter by verification status locally
        return filterStatus === 'All' || p.verificationStatus === filterStatus;
    });
    const displayedItems = filtered.slice(0, pageSize);


    const statusBadge = (s) => {
        const map = { Verified: 'badge-approved', Pending: 'badge-pending', Rejected: 'badge-rejected', 'Under Review': 'badge-pending' };
        return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
    };

    const accountBadge = (status) => {
        const map = { Active: 'badge-green', Disabled: 'badge-red', Suspended: 'badge-yellow' };
        return <span className={`badge ${map[status] || 'badge-gray'}`}>{status || 'Active'}</span>;
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
                    </div>
                    <div className="page-subtitle">Manage and verify industry partner accounts</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['All', 'Under Review', 'Verified', 'Rejected', 'Pending'].map(s => (
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
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead><tr><th>Company</th><th>Profile Name</th><th>Contact Person</th><th>Industry</th><th>Auth Email</th><th>Verification</th><th>Account</th><th className="account-actions-column">Actions</th></tr></thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px 0' }}>
                                        <div className="spinner" style={{ margin: '0 auto', width: 24, height: 24, border: '3px solid #f3f4f6', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                        <div style={{ marginTop: 12, color: '#64748b', fontSize: 14 }}>Loading partners...</div>
                                    </td>
                                </tr>
                            ) : displayedItems.map(p => (
                                <tr key={p.id}>
                                    <td style={{ fontWeight: 600 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #e0f2fe, #ede9fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#0ea5e9' }}>{p.companyName?.charAt(0)}</div><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{p.companyName}{p.verificationStatus === 'Verified' && <CheckCircle size={14} color="#0a66c2" title="Verified" />}</span></div></td>
                                    <td style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>{p.profileName || p.companyName || 'None'}</td>
                                    <td style={{ fontSize: 13, color: '#64748b' }}>{p.contactPerson}</td>
                                    <td><span className="badge badge-gray">{p.industry}</span></td>
                                    <td style={{ fontSize: 13, color: '#64748b' }}>{p.email}</td>
                                    <td>{statusBadge(p.verificationStatus)}</td>
                                    <td>{accountBadge(p.accountStatus || 'Active')}</td>
                                    <td className="account-actions-column">
                                        <div className={`account-actions-cell${isPartnerMenuOpen(p.id) ? ' is-open' : ''}`} onMouseDown={e => e.stopPropagation()}>
                                            <button
                                                className={`account-actions-trigger${isPartnerMenuOpen(p.id) ? ' is-open' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (isPartnerMenuOpen(p.id)) {
                                                        setOpenPartnerMenuKey(null);
                                                    } else {
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        const spaceBelow = window.innerHeight - rect.bottom;
                                                        const spaceAbove = rect.top;
                                                        const showUpward = spaceBelow < 200 && spaceAbove > spaceBelow;

                                                        setMenuPos({
                                                            top: showUpward ? 'auto' : (rect.bottom + 4),
                                                            bottom: showUpward ? (window.innerHeight - rect.top + 4) : 'auto',
                                                            left: rect.right - 160
                                                        });
                                                        setOpenPartnerMenuKey(p.id);
                                                    }
                                                }}
                                                title="Actions"
                                            >
                                                <MoreVertical size={16} />
                                            </button>
                                            {isPartnerMenuOpen(p.id) && createPortal(
                                                <React.Fragment>
                                                    <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onMouseDown={() => setOpenPartnerMenuKey(null)} />
                                                    <div
                                                        className="account-actions-panel"
                                                        style={{
                                                            position: 'fixed',
                                                            top: menuPos.top,
                                                            bottom: menuPos.bottom,
                                                            left: menuPos.left,
                                                            zIndex: 9999,
                                                            width: 160,
                                                            margin: 0,
                                                            display: 'block',
                                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                                        }}
                                                        onMouseDown={e => e.stopPropagation()}
                                                    >
                                                        <div className="account-actions-header">Partner Actions</div>
                                                        <button className="account-actions-item" onClick={() => { openPartnerView(p); setOpenPartnerMenuKey(null); }}>
                                                            <Eye size={14} /> View Details
                                                        </button>
                                                        <button className="account-actions-item" onClick={() => { setEditPartner({ ...p }); setOpenPartnerMenuKey(null); }}>
                                                            <Edit size={14} /> Edit Profile
                                                        </button>
                                                    </div>
                                                </React.Fragment>,
                                                document.body
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!isLoading && filtered.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No partners found.</td></tr>}
                        </tbody>
                    </table>
                </div>
                <TablePagination
                    currentPage={currentPage}
                    totalItems={totalPartners}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                />

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
                                            <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {doc.file_name}
                                                {doc.file_type && doc.file_type.includes('(') && (
                                                    <span style={{ color: '#16a34a', fontWeight: 600 }}>
                                                        ({doc.file_type.split('(').pop().replace(')', '')})
                                                    </span>
                                                )}
                                                | {new Date(doc.uploaded_at).toLocaleDateString()}
                                            </div>
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
                                            if (!reason) { toast.error('Please select a reject reason first.'); return; }
                                            rejectPartner(viewPartner.id, reason);
                                            setViewPartner(null);
                                            toast.success('Partner rejected');
                                        }}><XCircle size={15} /> Reject</button>
                                    )}
                                    {canApprove(viewPartner.verificationStatus) && <button className="btn btn-success" style={{ flex: 1 }} onClick={() => { approvePartner(viewPartner.id); setViewPartner(null); toast.success('Partner verified'); }}><CheckCircle size={15} /> Approve</button>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {editPartner && (
                <div className="modal-overlay" onClick={() => setEditPartner(null)}>
                    <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Edit Partner Verification</h3>
                            <button className="btn btn-outline btn-icon" onClick={() => setEditPartner(null)}><X size={16} /></button>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Verification Status</label>
                            <select
                                className="form-select"
                                value={editPartner.verificationStatus || ''}
                                onChange={e => setEditPartner({ ...editPartner, verificationStatus: e.target.value })}
                            >
                                <option value="Pending">Pending</option>
                                <option value="Under Review">Under Review</option>
                                <option value="Verified">Verified</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setEditPartner(null)}>Cancel</button>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={async () => {
                                const res = await updatePartner(editPartner.id, editPartner);
                                if (res?.success) {
                                    setEditPartner(null);
                                    toast.success('Partner updated successfully');
                                } else {
                                    toast.error('Failed to update partner: ' + (res?.error || 'Unknown error'));
                                }
                            }}><CheckCircle size={15} /> Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ————————————————————————————————————————————————————————————————————————————
const OpportunitiesOversight = () => {
    const { jobPostings, updatePartnerJobPosting, deleteJobPosting } = useApp();
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterType, setFilterType] = useState('All');
    const [openMenuId, setOpenMenuId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 20;

    const toggleMenu = (id) => setOpenMenuId(openMenuId === id ? null : id);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterStatus, filterType]);

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
        try {
            await deleteJobPosting(job.id);
            toast.success('Job posting deleted');
        } catch (err) {
            toast.error('Failed to delete job posting');
        }
        setOpenMenuId(null);
    };

    const opportunities = jobPostings;
    const filtered = opportunities.filter(j => {
        const q = search.toLowerCase();
        return ((j.title || '').toLowerCase().includes(q) || (j.companyName || '').toLowerCase().includes(q)) && (filterStatus === 'All' || j.status === filterStatus) && (filterType === 'All' || j.opportunityType === filterType);
    });
    const displayedItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const statusBadge = (s) => {
        const map = { Open: 'badge-open', Closed: 'badge-closed', Filled: 'badge-filled' };
        return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
    };
    return (
        <div>
            <div className="page-header"><div><div className="page-title">Opportunities Oversight</div><div className="page-subtitle">Monitor all opportunity postings from industry partners</div></div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['All', 'Open', 'Closed', 'Filled'].map(s => (
                        <button key={s} className={`btn btn-${filterStatus === s ? 'primary' : 'outline'} btn-sm`} onClick={() => setFilterStatus(s)}>
                            {s} ({s === 'All' ? opportunities.length : opportunities.filter(j => j.status === s).length})
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
                            {displayedItems.map(j => (
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
                                                        <button className="account-actions-item" onClick={async () => {
                                                            await updatePartnerJobPosting(j.id, { status: 'Closed' });
                                                            toast.success('Posting closed');
                                                            setOpenMenuId(null);
                                                        }}>
                                                            <XCircle size={14} /> Close Posting
                                                        </button>
                                                    ) : (
                                                        <button className="account-actions-item" onClick={async () => {
                                                            await updatePartnerJobPosting(j.id, { status: 'Open' });
                                                            toast.success('Posting opened');
                                                            setOpenMenuId(null);
                                                        }}>
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
                <TablePagination
                    currentPage={currentPage}
                    totalItems={filtered.length}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                />
            </div>
        </div>
    );
};

// ————————————————————————————————————————————————————————————————————————————
const EmploymentTracking = () => {
    const { getEmploymentStats, fetchAdminDirectoryData } = useApp();
    const stats = getEmploymentStats();
    const [traineesList, setTraineesList] = useState([]);
    const [totalTrainees, setTotalTrainees] = useState(0);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [filterStatus, setFilterStatus] = useState('All');
    const [isLoading, setIsLoading] = useState(false);
    const pageSize = 20;

    const loadData = async () => {
        setIsLoading(true);
        try {
            const timestamp = new Date().getTime();
            // We use the same backend endpoint but we'll only use the student data from it
            // Or we could use supabase directly if we want, but let's stick to the endpoint for consistency
            const res = await fetch(`/api/admin/data?t=${timestamp}&page=${currentPage}&limit=${pageSize}&search=${encodeURIComponent(search)}&status=${filterStatus}`);
            const data = await res.json();
            
            if (data.students) {
                // The backend returns snake_case keys (full_name, employment_status, etc.)
                // Filter by status if needed (though backend handles most of it)
                const filtered = data.students.filter(t => 
                    filterStatus === 'All' || 
                    t.employmentStatus === filterStatus ||
                    (filterStatus === 'Employed' && t.employmentStatus === 'employed') ||
                    (filterStatus === 'Seeking Employment' && t.employmentStatus === 'seeking_employment') ||
                    (filterStatus === 'Not Employed' && (t.employmentStatus === 'not_employed' || !t.employmentStatus))
                );
                setTraineesList(filtered);
                setTotalTrainees(data.totalStudents || 0);
            }
        } catch (err) {
            console.error('Failed to load employment data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentPage, search, filterStatus]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterStatus]);

    const displayedItems = traineesList;

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
                        <thead><tr><th>Name</th><th>Program</th><th>Status</th><th>Company / Employer</th><th>Date Hired</th></tr></thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px 0' }}>
                                        <div className="spinner" style={{ margin: '0 auto', width: 24, height: 24, border: '3px solid #f3f4f6', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                        <div style={{ marginTop: 12, color: '#64748b', fontSize: 14 }}>Loading data...</div>
                                    </td>
                                </tr>
                            ) : displayedItems.map(t => (
                                <tr key={t.id}>
                                    <td style={{ fontWeight: 600 }}>{t.fullName || t.full_name || t.profile_name || t.name || 'Trainee'}</td>
                                    <td style={{ color: '#64748b', fontSize: 13 }}>{t.program_name || t.program || (t.program_id ? `ID: ${t.program_id.slice(0,8)}` : '-')}</td>
                                    <td><span className={`badge badge-${(t.employmentStatus || t.employment_status || 'not-employed').toLowerCase().replace('_', '-').replace(' ', '-')}`}>{ (t.employmentStatus || t.employment_status || 'Not Employed').replace('_', ' ') }</span></td>
                                    <td style={{ color: '#64748b', fontSize: 13 }}>{t.employer || '-'}</td>
                                    <td style={{ color: '#64748b', fontSize: 13 }}>{t.dateHired || t.date_hired ? new Date(t.dateHired || t.date_hired).toLocaleDateString() : '-'}</td>
                                </tr>
                            ))}
                            {!isLoading && traineesList.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No trainees found.</td></tr>}
                        </tbody>
                    </table>
                </div>
                <TablePagination
                    currentPage={currentPage}
                    totalItems={totalTrainees}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                />
            </div>
        </div>
    );
};

// ——— PAGE 6: ANALYTICS (DEEP DIVE REPORTS) ————————————————————————————————
const Analytics = () => {
    const { trainees, posts, partners, applications, getEmploymentStats } = useApp();
    const stats = getEmploymentStats();

    const handleExportCSV = () => { toast.success("Exporting metrics to CSV..."); };
    const handleExportChart = (chartName) => { toast.success(`Exporting ${chartName} as PNG...`); };

    // Placement Funnel Logic
    const enrolled = trainees.length;
    const certified = trainees.filter(t => t.certifications && t.certifications.length > 0).length;
    const applied = new Set(applications.map(a => a.traineeId)).size;
    const hired = stats.employed;

    const funnelData = [
        { stage: 'Enrolled Trainees', count: enrolled, fill: '#cbd5e1' },
        { stage: 'NC Certified', count: certified, fill: '#0ea5e9' },
        { stage: 'Matched / Applied', count: applied, fill: '#d97706' },
        { stage: 'Successfully Hired', count: hired, fill: '#16a34a' }
    ];

    // Mock Partner Engagement Activity (Line Chart based on job postings over time)
    // In a real DB, you'd group by month. Here we mock a 6-month trend ending in current month.
    const monthNames = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
    const engagementData = monthNames.map((m, i) => ({
        month: m,
        postings: Math.floor(Math.random() * 15) + 5 + i, // Trending up mock
        interactions: Math.floor(Math.random() * 40) + 20 + (i * 5)
    }));

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div className="page-title">Analytics & Reporting</div>
                    <div className="page-subtitle">Deep dive into platform placement pipelines and engagement</div>
                </div>
                <button className="btn btn-outline" onClick={handleExportCSV}><Download size={14} /> Export Raw Data</button>
            </div>

            <div className="two-col" style={{ marginBottom: 24 }}>
                {/* Placement Funnel Chart */}
                <div className="chart-wrap" style={{ position: 'relative' }}>
                    <button onClick={() => handleExportChart('Pipeline Funnel')} style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><Download size={16} /></button>
                    <div className="chart-title">Placement Pipeline Funnel</div>
                    <div className="chart-subtitle">Trainee progression from enrollment to hire</div>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={funnelData} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#475569' }} width={120} />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                            <Bar dataKey="count" barSize={32} radius={[0, 6, 6, 0]} label={{ position: 'right', fill: '#0f172a', fontWeight: 800, fontSize: 14 }}>
                                {funnelData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Partner Engagement Line Chart */}
                <div className="chart-wrap" style={{ position: 'relative' }}>
                    <button onClick={() => handleExportChart('Partner Engagement')} style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><Download size={16} /></button>
                    <div className="chart-title">Partner Engagement Trends</div>
                    <div className="chart-subtitle">Job postings and platform interactions over time</div>
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={engagementData} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                            <Line type="monotone" dataKey="interactions" name="Partner Interactions" stroke="#7c3aed" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="postings" name="Job Postings" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

// ————————————————————————————————————————————————————————————————————————————
const AccountManagement = () => {
    const { trainees, totalTrainees, partners, totalPartners, accounts, totalAccounts, updateAccountStatus, deleteAccount, isPresenceEnabled, toggleGlobalPresence, fetchAdminDirectoryData } = useApp();
    const [currentPage, setCurrentPage] = useState(1);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('All');
    const [actionReasonById, setActionReasonById] = useState({});
    const [openActionMenuKey, setOpenActionMenuKey] = useState('');
    const [accountPendingDelete, setAccountPendingDelete] = useState(null);
    const [deletingAccountKey, setDeletingAccountKey] = useState('');
    const [activityNow, setActivityNow] = useState(Date.now());
    const [isLoading, setIsLoading] = useState(false);
    const pageSize = 15;
    const reasonOptions = ['Policy Violation', 'Fraudulent Information', 'Duplicate Account', 'Requested Deactivation', 'Other'];

    useEffect(() => {
        const timerId = setInterval(() => {
            setActivityNow(Date.now());
        }, 15000);
        return () => clearInterval(timerId);
    }, []);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await fetchAdminDirectoryData(currentPage, pageSize, search);
            setIsLoading(false);
        };
        loadData();
    }, [currentPage, search, fetchAdminDirectoryData]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterRole]);

    const allAccounts = useMemo(() => {
        if (filterRole === 'trainee') return trainees.map(t => ({ ...t, type: 'trainee', roleLabel: 'Student', displayName: t.profileName || t.name || 'Student', displayEmail: t.email !== 'Protected' ? t.email : 'None' }));
        if (filterRole === 'partner') return partners.map(p => ({ ...p, type: 'partner', roleLabel: 'Partner', displayName: p.profileName || p.companyName || 'Industry Partner', displayEmail: p.email !== 'Protected' ? p.email : 'None' }));
        return accounts.map(a => ({
            ...a,
            displayName: a.profileName || a.name || (a.type === 'trainee' ? 'Student' : 'Partner'),
            displayEmail: a.email && a.email !== 'Protected' ? a.email : 'None'
        }));
    }, [trainees, partners, accounts, filterRole]);

    const totalItems = useMemo(() => {
        if (filterRole === 'trainee') return totalTrainees;
        if (filterRole === 'partner') return totalPartners;
        return totalAccounts;
    }, [totalTrainees, totalPartners, totalAccounts, filterRole]);

    const displayedItems = allAccounts.slice(0, pageSize);

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

    const applyAccountAction = async (account, nextStatus) => {
        try {
            await updateAccountStatus(account.type, account.id, nextStatus, getActionReason(account));
            toast.success(`Account status updated to ${nextStatus}`);
        } catch (err) {
            toast.error('Failed to update account status');
        }
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


    const toggleActionMenu = (account) => {
        const key = reasonKey(account);
        setOpenActionMenuKey(prev => (prev === key ? '' : key));
    };

    const isActionMenuOpen = (account) => openActionMenuKey === reasonKey(account);

    const handleAccountStatusAction = (account, nextStatus) => {
        if (!getActionReason(account)) {
            toast.error('Please select a reason before taking action.');
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
                    { label: 'Total Accounts', value: totalItems, icon: <Users size={22} color="#7c3aed" />, bg: '#ede9fe' },
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px', background: isPresenceEnabled ? '#f0fdf4' : '#fef2f2', borderRadius: 100, border: `1px solid ${isPresenceEnabled ? '#bbf7d0' : '#fee2e2'}`, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: isPresenceEnabled ? '#166534' : '#991b1b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {isPresenceEnabled ? 'Activity Monitoring: Live' : 'Eco Mode: Active (Paused)'}
                        </span>

                        <div
                            onClick={() => toggleGlobalPresence(!isPresenceEnabled)}
                            style={{
                                width: 36,
                                height: 20,
                                borderRadius: 10,
                                background: isPresenceEnabled ? '#22c55e' : '#cbd5e1',
                                position: 'relative',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <div style={{
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                background: '#fff',
                                position: 'absolute',
                                top: 3,
                                left: isPresenceEnabled ? 19 : 3,
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                            }} />
                        </div>
                    </div>

                    <select className="form-select" style={{ width: 'auto', minWidth: 140 }} value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                        {['All', 'trainee', 'partner'].map(r => <option key={r} value={r}>{r === 'All' ? 'All Roles' : r === 'trainee' ? 'Student' : 'Partner'}</option>)}
                    </select>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead><tr><th>Profile Name</th><th>Auth Email</th><th>Role</th><th>Activity</th><th>Account</th><th className="account-actions-column">Actions</th></tr></thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px 0' }}>
                                        <div className="spinner" style={{ margin: '0 auto', width: 24, height: 24, border: '3px solid #f3f4f6', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                        <div style={{ marginTop: 12, color: '#64748b', fontSize: 14 }}>Loading accounts...</div>
                                    </td>
                                </tr>
                            ) : displayedItems.map((a, i) => (
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
                             {!isLoading && allAccounts.length === 0 && (
                                 <tr>
                                     <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
                                         No accounts found.
                                     </td>
                                 </tr>
                             )}
                        </tbody>
                    </table>
                </div>
                <TablePagination
                    currentPage={currentPage}
                    totalItems={totalItems}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                />
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
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 20;

    // Reset page when search or filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterAction, filterModule]);
    const filtered = activityLog.filter(l => {
        const q = search.toLowerCase();
        return (l.user.toLowerCase().includes(q) || l.description.toLowerCase().includes(q)) && (filterAction === 'All' || l.action === filterAction) && (filterModule === 'All' || l.module === filterModule);
    });
    const displayedItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
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
                            {displayedItems.map(l => (
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
                                <div style={{ padding: '8px 12px', background: '#fee2e2', borderRadius: 8 }}><div style={{ fontSize: 10, color: '#dc2626', fontWeight: 600, textTransform: 'uppercase' }}>Previous Value</div><div style={{ fontSize: 13, color: '#991b1b', marginTop: 4 }}>{viewEntry.prevValue || '-'}</div></div>
                                <div style={{ padding: '8px 12px', background: '#dcfce7', borderRadius: 8 }}><div style={{ fontSize: 10, color: '#16a34a', fontWeight: 600, textTransform: 'uppercase' }}>New Value</div><div style={{ fontSize: 13, color: '#166534', marginTop: 4 }}>{viewEntry.newValue || '-'}</div></div>
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
        bulletin: { title: 'Training Bulletin', sub: 'Manage training opportunities for trainees and partners' },
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
                <Route path="/bulletin" element={<TrainingBulletin />} />
                <Route path="/jobs" element={<OpportunitiesOversight />} />
                <Route path="/employment" element={<EmploymentTracking />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/accounts" element={<AccountManagement />} />
                <Route path="/activity-log" element={<SystemActivityLog />} />
                <Route path="/settings" element={<SystemSettings />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
        </AppLayout>
    );
}
