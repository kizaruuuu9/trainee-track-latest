import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
    LayoutDashboard, User, Briefcase, FileText, BarChart2, CheckCircle,
    LogOut, Bell, ChevronDown, Search, Filter, MapPin, Clock, Building2,
    TrendingUp, Award, Send, Star, AlertTriangle, CheckSquare, XCircle,
    Edit, Upload, Download, ChevronRight, X, Eye, Plus, Target, Menu
} from 'lucide-react';

// ─── REUSABLE LAYOUT ──────────────────────────────────────────────
const AppLayout = ({ sidebar, children, pageTitle, pageSubtitle }) => {
    const { currentUser, userRole, logout } = useApp();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotif, setShowNotif] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const initials = currentUser?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T';

    return (
        <div className="app-layout">
            {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
            {React.cloneElement(sidebar, { mobileOpen: sidebarOpen, closeSidebar: () => setSidebarOpen(false) })}
            <div className="main-content">
                <header className="top-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
                            <Menu size={20} />
                        </button>
                        <div>
                            <div className="header-title">{pageTitle}</div>
                            {pageSubtitle && <div className="header-subtitle">{pageSubtitle}</div>}
                        </div>
                    </div>
                    <div className="header-actions">
                        <div style={{ position: 'relative' }}>
                            <button className="header-icon-btn" onClick={() => setShowNotif(!showNotif)}>
                                <Bell size={17} />
                                <span className="notif-badge">3</span>
                            </button>
                            {showNotif && (
                                <div className="dropdown-menu" style={{ minWidth: 260, right: 0 }}>
                                    <div style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: 13 }}>Notifications</div>
                                    {['New opportunity match: Junior IT Technician', 'Your application was reviewed', 'Profile viewed by TechSolutions'].map((n, i) => (
                                        <div key={i} className="dropdown-item" style={{ fontSize: 12.5, alignItems: 'flex-start', gap: 8 }}>
                                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6', marginTop: 4, flexShrink: 0 }} />
                                            {n}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div style={{ position: 'relative' }}>
                            <div className="header-profile" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                                <div className="profile-avatar">{initials}</div>
                                <div>
                                    <div className="profile-name">{currentUser?.name || 'Trainee'}</div>
                                    <div className="profile-role">{userRole}</div>
                                </div>
                                <ChevronDown size={14} color="#94a3b8" />
                            </div>
                            {showProfileMenu && (
                                <div className="dropdown-menu">
                                    <div className="dropdown-item"><User size={14} /> My Profile</div>
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

// ─── SIDEBAR ─────────────────────────────────────────────────────
const TraineeSidebar = ({ activePage, setActivePage, mobileOpen, closeSidebar }) => {
    const { currentUser, logout } = useApp();
    const initials = currentUser?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T';
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} /> },
        { id: 'profile', label: 'My Profile', icon: <User size={17} /> },
        { id: 'certification', label: 'Certification Progress', icon: <Award size={17} /> },
        { id: 'recommendations', label: 'Opportunities', icon: <Briefcase size={17} /> },
        { id: 'applications', label: 'My Applications', icon: <FileText size={17} /> },
        { id: 'gap-analysis', label: 'Gap Analysis', icon: <BarChart2 size={17} /> },
        { id: 'employment', label: 'Employment Status', icon: <CheckCircle size={17} /> },
    ];

    const handleNav = (id) => {
        setActivePage(id);
        if (closeSidebar) closeSidebar();
    };

    return (
        <nav className={`sidebar ${mobileOpen ? 'open' : ''}`}>
            <div className="sidebar-brand">
                <div className="sidebar-logo">TT</div>
                <div className="sidebar-brand-text">
                    <div className="sidebar-brand-name">TraineeTrack</div>
                    <div className="sidebar-brand-sub">Trainee Portal</div>
                </div>
            </div>
            <div className="sidebar-section-label">Navigation</div>
            <div className="sidebar-nav">
                {navItems.map(item => (
                    <div key={item.id} className={`sidebar-item ${activePage === item.id ? 'active' : ''}`}
                        onClick={() => handleNav(item.id)}>
                        {item.icon} {item.label}
                    </div>
                ))}
            </div>
            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-avatar">{initials}</div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name">{currentUser?.name}</div>
                        <div className="sidebar-user-role">Trainee</div>
                    </div>
                </div>
                <div className="sidebar-item" onClick={logout} style={{ color: '#f87171' }}>
                    <LogOut size={16} /> Sign Out
                </div>
            </div>
        </nav>
    );
};

// ─── PROGRESS BAR HELPER ─────────────────────────────────────────
const ProgressBar = ({ value, showLabel = true }) => {
    const cls = value >= 70 ? 'progress-high' : value >= 40 ? 'progress-mid' : 'progress-low';
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="progress-bar-wrap" style={{ flex: 1 }}>
                <div className={`progress-bar-fill ${cls}`} style={{ width: `${value}%` }} />
            </div>
            {showLabel && <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', minWidth: 32, textAlign: 'right' }}>{value}%</span>}
        </div>
    );
};

// ─── PAGE 1: DASHBOARD ───────────────────────────────────────────
const TraineeDashboardHome = ({ setActivePage }) => {
    const { currentUser, trainees, jobPostings, applications, getTraineeRecommendedJobs, applyToJob } = useApp();
    const trainee = trainees.find(t => t.id === currentUser?.id) || trainees[0];
    const myApps = applications.filter(a => a.traineeId === trainee?.id);
    const recJobs = getTraineeRecommendedJobs(trainee?.id).slice(0, 3);

    const stats = [
        {
            label: 'Average Match Rate',
            value: recJobs.length > 0 ? `${Math.round(recJobs.reduce((s, j) => s + j.matchRate, 0) / recJobs.length)}%` : '0%',
            icon: <Target size={22} color="#2563eb" />, bg: '#dbeafe', sub: 'Across open positions'
        },
        {
            label: 'Applications Sent',
            value: myApps.length,
            icon: <Send size={22} color="#7c3aed" />, bg: '#ede9fe', sub: `${myApps.filter(a => a.status === 'Pending').length} pending`
        },
        {
            label: 'Employment Status',
            value: trainee?.employmentStatus || 'Unemployed',
            icon: <Briefcase size={22} color="#0ea5e9" />, bg: '#e0f2fe', sub: trainee?.employer || 'Not employed'
        },
        {
            label: 'Certifications',
            value: trainee?.certifications?.length || 0,
            icon: <Award size={22} color="#16a34a" />, bg: '#dcfce7', sub: trainee?.certifications?.join(', ').slice(0, 30) + '...' || ''
        },
    ];

    const handleApply = (jobId) => {
        const result = applyToJob(trainee?.id, jobId);
        if (!result.success) alert(result.error);
    };

    return (
        <div>
            {/* Welcome Banner */}
            <div style={{
                background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
                borderRadius: 16, padding: '24px 28px', marginBottom: 24, color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16
            }}>
                <div>
                    <div style={{ fontSize: 22, fontWeight: 800 }}>Welcome back, {trainee?.name?.split(' ')[0]}! 👋</div>
                    <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                        {trainee?.certifications?.length} certification{trainee?.certifications?.length !== 1 ? 's' : ''} earned &bull; Year: {trainee?.graduationYear}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Your Best Match</div>
                    <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1 }}>{recJobs[0]?.matchRate || 0}%</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Opportunity Compatibility</div>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="stats-grid">
                {stats.map((s, i) => (
                    <div key={i} className="stat-card">
                        <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
                        <div className="stat-info">
                            <div className="stat-label">{s.label}</div>
                            <div className="stat-value" style={{ fontSize: 20 }}>{s.value}</div>
                            <div className="stat-sub">{s.sub}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recommended Opportunities */}
            <div className="card">
                <div className="section-header">
                    <div>
                        <div className="section-title">Recommended Opportunities</div>
                        <div className="section-subtitle">Based on your TESDA certifications and competencies</div>
                    </div>
                    <button className="btn btn-outline btn-sm" onClick={() => setActivePage('recommendations')}>
                        View All <ChevronRight size={14} />
                    </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                    {recJobs.map(job => (
                        <div key={job.id} className="job-card" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg, #dbeafe, #ede9fe)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                                <Building2 size={20} color="#2563eb" />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{job.title}</div>
                                <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 6 }}>{job.companyName} &bull; {job.location}</div>
                                <ProgressBar value={job.matchRate} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    <span className={`badge badge-${job.status.toLowerCase()}`}>{job.status}</span>
                                    <span className="badge badge-cyan" style={{ fontSize: 10 }}>{job.opportunityType}</span>
                                </div>
                                <button className="btn btn-primary btn-sm" onClick={() => handleApply(job.id)}>Apply</button>
                            </div>
                        </div>
                    ))}
                    {recJobs.length === 0 && (
                        <div className="empty-state"><Briefcase size={40} /><h3>No open opportunities found</h3><p>Check back soon!</p></div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── PAGE 2: PROFILE ─────────────────────────────────────────────
const TraineeProfile = () => {
    const { currentUser, trainees, updateTrainee, NC_COMPETENCIES } = useApp();
    const trainee = trainees.find(t => t.id === currentUser?.id) || trainees[0];
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ ...trainee });
    const initials = trainee?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T';

    const save = () => {
        updateTrainee(trainee.id, form);
        setEditing(false);
    };

    const allCompetencies = Object.values(NC_COMPETENCIES).flat();

    return (
        <div>
            <div className="page-header">
                <div><div className="page-title">My Profile</div><div className="page-subtitle">Manage your personal information and credentials</div></div>
                <button className={`btn ${editing ? 'btn-success' : 'btn-primary'}`} onClick={editing ? save : () => setEditing(true)}>
                    {editing ? <><CheckCircle size={15} /> Save Changes</> : <><Edit size={15} /> Edit Profile</>}
                </button>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
                <div className="profile-bg-header" />
                <div style={{ padding: '48px 24px 24px', position: 'relative' }}>
                    <div className="profile-avatar-large">{initials}</div>
                    <div style={{ paddingLeft: 0 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 800 }}>{trainee?.name}</h2>
                        <p style={{ fontSize: 13, color: '#64748b' }}>{trainee?.email} &bull; Year: {trainee?.graduationYear}</p>
                        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                            {trainee?.certifications?.map(c => (
                                <span key={c} className="badge badge-blue"><Award size={11} />{c}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="two-col" style={{ marginBottom: 16 }}>
                {/* Personal Info */}
                <div className="card">
                    <div className="section-title" style={{ marginBottom: 16 }}>Personal Information</div>
                    {[
                        { label: 'Full Name', key: 'name', type: 'text' },
                        { label: 'Email', key: 'email', type: 'email' },
                        { label: 'Phone', key: 'phone', type: 'text' },
                        { label: 'Address', key: 'address', type: 'text' },
                        { label: 'Birthday', key: 'birthday', type: 'date' },
                        { label: 'Gender', key: 'gender', type: 'select', options: ['Male', 'Female', 'Other'] },
                    ].map(f => (
                        <div key={f.key} className="form-group" style={{ marginBottom: 12 }}>
                            <label className="form-label">{f.label}</label>
                            {editing ? (
                                f.type === 'select' ? (
                                    <select className="form-select" value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })}>
                                        {f.options.map(o => <option key={o}>{o}</option>)}
                                    </select>
                                ) : (
                                    <input type={f.type} className="form-input" value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                                )
                            ) : (
                                <div style={{ fontSize: 13.5, color: '#475569', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>{trainee?.[f.key] || '—'}</div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Competencies */}
                <div className="card">
                    <div className="section-title" style={{ marginBottom: 16 }}>Competencies & Skills</div>
                    {allCompetencies.slice(0, 8).map(comp => {
                        const has = trainee?.competencies?.includes(comp);
                        return (
                            <div key={comp} className="competency-item">
                                {has ? <CheckSquare size={16} color="#16a34a" style={{ flexShrink: 0 }} /> : <XCircle size={16} color="#dc2626" style={{ flexShrink: 0 }} />}
                                <span style={{ fontSize: 12.5, color: '#475569', flex: 1 }}>{comp}</span>
                                {has && <span className="badge badge-matched" style={{ fontSize: 10 }}>Acquired</span>}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="two-col">
                {/* Achievements */}
                <div className="card">
                    <div className="section-title" style={{ marginBottom: 14 }}>Achievements</div>
                    {trainee?.achievements?.length > 0 ? trainee.achievements.map((a, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <Star size={15} color="#f59e0b" />
                            <span style={{ fontSize: 13.5, color: '#475569' }}>{a}</span>
                        </div>
                    )) : <div className="empty-state" style={{ padding: 20 }}><Star size={28} /><p>No achievements added yet</p></div>}
                </div>

                {/* Documents */}
                <div className="card">
                    <div className="section-title" style={{ marginBottom: 14 }}>Uploaded Documents</div>
                    {[
                        { key: 'resume', label: 'Resume / CV' },
                        { key: 'diploma', label: 'Diploma' },
                        { key: 'tor', label: 'Transcript of Records' },
                    ].map(doc => (
                        <div key={doc.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <FileText size={15} color="#64748b" />
                                <span style={{ fontSize: 13.5, color: '#475569' }}>{doc.label}</span>
                            </div>
                            {trainee?.documents?.[doc.key] ? (
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button className="btn btn-outline btn-sm"><Eye size={12} /> View</button>
                                    <button className="btn btn-outline btn-sm"><Download size={12} /></button>
                                </div>
                            ) : (
                                <button className="btn btn-outline btn-sm"><Upload size={12} /> Upload</button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ─── PAGE 3: CERTIFICATION PROGRESS ──────────────────────────────
const CertificationProgress = () => {
    const { currentUser, trainees } = useApp();
    const trainee = trainees.find(t => t.id === currentUser?.id) || trainees[0];
    const progress = trainee?.certificationProgress || [];

    const getCompletionPercent = (cert) => {
        if (!cert.competencies || cert.competencies.length === 0) return 0;
        const passed = cert.competencies.filter(c => c.status === 'Passed').length;
        return Math.round((passed / cert.competencies.length) * 100);
    };

    const statusBadge = (s) => {
        const map = { Passed: 'badge-green', Failed: 'badge-red', 'Pending Assessment': 'badge-yellow' };
        return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
    };

    const certStatusBadge = (s) => {
        const map = { Completed: 'badge-green', 'In Progress': 'badge-blue', 'Not Started': 'badge-gray' };
        return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <div className="page-title">Certification Progress</div>
                    <div className="page-subtitle">Track your TESDA certification journey and competency status</div>
                </div>
                <div className="badge badge-blue">{progress.length} certification{progress.length !== 1 ? 's' : ''}</div>
            </div>

            {/* Overview Cards */}
            <div className="stats-grid" style={{ marginBottom: 24 }}>
                {[
                    { label: 'Total Certifications', value: progress.length, icon: <Award size={22} color="#7c3aed" />, bg: '#ede9fe' },
                    { label: 'Completed', value: progress.filter(p => p.status === 'Completed').length, icon: <CheckCircle size={22} color="#16a34a" />, bg: '#dcfce7' },
                    { label: 'In Progress', value: progress.filter(p => p.status === 'In Progress').length, icon: <Clock size={22} color="#2563eb" />, bg: '#dbeafe' },
                    { label: 'Overall Progress', value: progress.length > 0 ? `${Math.round(progress.reduce((s, c) => s + getCompletionPercent(c), 0) / progress.length)}%` : '0%', icon: <TrendingUp size={22} color="#d97706" />, bg: '#fef3c7' },
                ].map((s, i) => (
                    <div key={i} className="stat-card">
                        <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
                        <div className="stat-info">
                            <div className="stat-label">{s.label}</div>
                            <div className="stat-value">{s.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Certification Cards */}
            {progress.map((cert, ci) => {
                const pct = getCompletionPercent(cert);
                return (
                    <div key={ci} className="card" style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #ede9fe, #dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Award size={20} color="#7c3aed" />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>{cert.certification}</div>
                                        <div style={{ fontSize: 12, color: '#64748b' }}>Enrolled: {cert.enrolledDate}</div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                {certStatusBadge(cert.status)}
                                <span style={{ fontWeight: 800, fontSize: 18, color: pct >= 70 ? '#16a34a' : pct >= 40 ? '#d97706' : '#dc2626' }}>{pct}%</span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ marginBottom: 16 }}>
                            <ProgressBar value={pct} />
                        </div>

                        {/* Competencies Table */}
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Unit of Competency</th>
                                        <th>Status</th>
                                        <th>Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cert.competencies.map((comp, i) => (
                                        <tr key={i}>
                                            <td style={{ color: '#94a3b8', width: 40 }}>{i + 1}</td>
                                            <td style={{ fontWeight: 500 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    {comp.status === 'Passed' ? <CheckSquare size={14} color="#16a34a" /> :
                                                        comp.status === 'Failed' ? <XCircle size={14} color="#dc2626" /> :
                                                            <Clock size={14} color="#d97706" />}
                                                    {comp.name}
                                                </div>
                                            </td>
                                            <td>{statusBadge(comp.status)}</td>
                                            <td style={{ fontSize: 12.5, color: '#64748b', maxWidth: 200 }}>{comp.remarks || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}

            {progress.length === 0 && (
                <div className="empty-state"><Award size={48} /><h3>No certifications found</h3><p>Your certification progress will appear here once enrolled.</p></div>
            )}
        </div>
    );
};

// ─── PAGE 4: OPPORTUNITIES (was JOB RECOMMENDATIONS) ─────────────
const Opportunities = () => {
    const { currentUser, trainees, jobPostings, applications, getTraineeRecommendedJobs, applyToJob } = useApp();
    const trainee = trainees.find(t => t.id === currentUser?.id) || trainees[0];
    const myApps = applications.filter(a => a.traineeId === trainee?.id).map(a => a.jobId);
    const allJobs = getTraineeRecommendedJobs(trainee?.id);

    const [search, setSearch] = useState('');
    const [filterIndustry, setFilterIndustry] = useState('All');
    const [filterType, setFilterType] = useState('All');
    const [filterLocation, setFilterLocation] = useState('All');
    const [filterOpType, setFilterOpType] = useState('All');
    const [selectedJob, setSelectedJob] = useState(null);

    const industries = ['All', ...new Set(jobPostings.map(j => j.industry))];
    const types = ['All', 'Full-time', 'Part-time', 'Contract', 'Internship'];
    const locations = ['All', ...new Set(jobPostings.map(j => j.location))];
    const opTypes = ['All', 'Job', 'OJT', 'Apprenticeship'];

    const filtered = allJobs.filter(j => {
        const q = search.toLowerCase();
        return (
            (j.title.toLowerCase().includes(q) || j.companyName.toLowerCase().includes(q)) &&
            (filterIndustry === 'All' || j.industry === filterIndustry) &&
            (filterType === 'All' || j.employmentType === filterType) &&
            (filterLocation === 'All' || j.location === filterLocation) &&
            (filterOpType === 'All' || j.opportunityType === filterOpType)
        );
    });

    const handleApply = (jobId) => {
        const r = applyToJob(trainee?.id, jobId);
        if (!r.success) alert(r.error);
    };

    return (
        <div>
            <div className="page-header">
                <div><div className="page-title">Opportunities</div><div className="page-subtitle">Jobs, OJT, and apprenticeships matched to your qualifications</div></div>
                <div className="badge badge-blue">{filtered.length} positions found</div>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
                        <Search size={15} color="#94a3b8" />
                        <input placeholder="Search title or company..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    {[
                        { label: 'Type', val: filterOpType, set: setFilterOpType, opts: opTypes },
                        { label: 'Industry', val: filterIndustry, set: setFilterIndustry, opts: industries },
                        { label: 'Location', val: filterLocation, set: setFilterLocation, opts: locations },
                        { label: 'Employment', val: filterType, set: setFilterType, opts: types },
                    ].map(f => (
                        <select key={f.label} className="form-select" style={{ width: 'auto', minWidth: 130 }} value={f.val} onChange={e => f.set(e.target.value)}>
                            {f.opts.map(o => <option key={o}>{o}</option>)}
                        </select>
                    ))}
                </div>
            </div>

            {/* Opportunity Cards Grid */}
            <div className="cards-grid">
                {filtered.map(job => {
                    const applied = myApps.includes(job.id);
                    return (
                        <div key={job.id} className="job-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                <div style={{ width: 42, height: 42, borderRadius: 10, background: 'linear-gradient(135deg, #dbeafe, #ede9fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Building2 size={20} color="#2563eb" />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{job.title}</div>
                                    <div style={{ fontSize: 12, color: '#64748b' }}>{job.companyName}</div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                                    <span className={`badge badge-${job.status.toLowerCase()}`}>{job.status}</span>
                                    <span className="badge badge-cyan" style={{ fontSize: 10 }}>{job.opportunityType}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b' }}><MapPin size={12} />{job.location}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b' }}><Clock size={12} />{job.employmentType}</span>
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                                    <span style={{ color: '#64748b' }}>Match Rate</span>
                                    <span style={{ fontWeight: 700, color: job.matchRate >= 70 ? '#16a34a' : job.matchRate >= 40 ? '#d97706' : '#dc2626' }}>{job.matchRate}%</span>
                                </div>
                                <ProgressBar value={job.matchRate} showLabel={false} />
                            </div>

                            <div style={{ fontSize: 12, color: '#64748b' }}>{job.salaryRange}</div>
                            <span className="badge badge-purple" style={{ alignSelf: 'flex-start' }}>{job.ncLevel}</span>

                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => setSelectedJob(job)}>
                                    <Eye size={13} /> Details
                                </button>
                                <button className="btn btn-primary btn-sm" style={{ flex: 1 }} disabled={applied || job.status !== 'Open'} onClick={() => handleApply(job.id)}>
                                    {applied ? <><CheckCircle size={13} /> Applied</> : <><Send size={13} /> Apply</>}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filtered.length === 0 && (
                <div className="empty-state"><Briefcase size={48} /><h3>No opportunities found</h3><p>Try adjusting your filters.</p></div>
            )}

            {/* Detail Modal */}
            {selectedJob && (
                <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
                    <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">{selectedJob.title}</h3>
                                <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{selectedJob.companyName} &bull; {selectedJob.location}</p>
                            </div>
                            <button className="btn btn-outline btn-icon" onClick={() => setSelectedJob(null)}><X size={16} /></button>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                            <span className={`badge badge-${selectedJob.status.toLowerCase()}`}>{selectedJob.status}</span>
                            <span className="badge badge-cyan">{selectedJob.opportunityType}</span>
                            <span className="badge badge-purple">{selectedJob.ncLevel}</span>
                            <span className="badge badge-gray">{selectedJob.employmentType}</span>
                            <span className="badge badge-blue">{selectedJob.matchRate}% Match</span>
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Description</div>
                            <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6 }}>{selectedJob.description}</p>
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Required Competencies</div>
                            {selectedJob.requiredCompetencies.map((c, i) => (
                                <div key={i} className="competency-item">
                                    <CheckSquare size={14} color="#2563eb" />
                                    <span style={{ fontSize: 13, color: '#475569' }}>{c}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#16a34a' }}>{selectedJob.salaryRange}</span>
                            <button className="btn btn-primary" onClick={() => { applyToJob(trainee?.id, selectedJob.id); setSelectedJob(null); }}>
                                <Send size={15} /> Apply Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── PAGE 5: GAP ANALYSIS ────────────────────────────────────────
const GapAnalysis = () => {
    const { currentUser, trainees, jobPostings, getGapAnalysis, getMatchRate } = useApp();
    const trainee = trainees.find(t => t.id === currentUser?.id) || trainees[0];
    const [selectedJobId, setSelectedJobId] = useState(jobPostings[0]?.id || null);
    const selectedJob = jobPostings.find(j => j.id === selectedJobId);
    const analysis = selectedJobId ? getGapAnalysis(trainee?.id, selectedJobId) : [];
    const matchRate = selectedJobId ? getMatchRate(trainee?.id, selectedJobId) : 0;
    const matched = analysis.filter(a => a.status === 'Matched');
    const missing = analysis.filter(a => a.status === 'Missing');

    return (
        <div>
            <div className="page-header">
                <div><div className="page-title">Gap Analysis</div><div className="page-subtitle">Compare your competencies to opportunity requirements</div></div>
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Select an Opportunity to Analyze</label>
                    <select className="form-select" value={selectedJobId || ''} onChange={e => setSelectedJobId(Number(e.target.value))}>
                        {jobPostings.map(j => <option key={j.id} value={j.id}>{j.title} — {j.companyName} ({j.opportunityType})</option>)}
                    </select>
                </div>
            </div>

            {selectedJob && (
                <>
                    <div className="three-col" style={{ marginBottom: 20 }}>
                        {[
                            { label: 'Match Rate', value: `${matchRate}%`, icon: <TrendingUp size={22} color="#2563eb" />, bg: '#dbeafe' },
                            { label: 'Matched Skills', value: matched.length, icon: <CheckSquare size={22} color="#16a34a" />, bg: '#dcfce7' },
                            { label: 'Missing Skills', value: missing.length, icon: <AlertTriangle size={22} color="#dc2626" />, bg: '#fee2e2' },
                        ].map((s, i) => (
                            <div key={i} className="stat-card">
                                <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
                                <div className="stat-info">
                                    <div className="stat-label">{s.label}</div>
                                    <div className="stat-value">{s.value}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="card" style={{ marginBottom: 16 }}>
                        <div className="section-header">
                            <div>
                                <div className="section-title">Competency Comparison</div>
                                <div className="section-subtitle">{selectedJob.title} at {selectedJob.companyName} (NC: {selectedJob.ncLevel})</div>
                            </div>
                        </div>
                        <div style={{ overflowX: 'auto', marginTop: 8 }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Required Competency</th>
                                        <th>Your Status</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analysis.map((a, i) => (
                                        <tr key={i}>
                                            <td style={{ color: '#94a3b8', width: 40 }}>{i + 1}</td>
                                            <td style={{ fontWeight: 500 }}>{a.competency}</td>
                                            <td>
                                                {a.status === 'Matched'
                                                    ? <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>✓ You have this competency</span>
                                                    : <span style={{ fontSize: 13, color: '#dc2626' }}>✗ Not yet acquired</span>
                                                }
                                            </td>
                                            <td>
                                                <span className={`badge badge-${a.status.toLowerCase()}`}>{a.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {missing.length > 0 && (
                        <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
                            <div className="section-title" style={{ marginBottom: 12, color: '#92400e' }}>
                                <AlertTriangle size={16} style={{ display: 'inline', marginRight: 6 }} />
                                Skill Gap Recommendations
                            </div>
                            <p style={{ fontSize: 13.5, color: '#64748b', marginBottom: 12 }}>
                                You are missing <strong>{missing.length}</strong> competency/ies for this position. Here are recommended actions:
                            </p>
                            {missing.map((m, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid #fef9c3' }}>
                                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#92400e' }}>{i + 1}</span>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 13.5, color: '#0f172a' }}>{m.competency}</div>
                                        <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 2 }}>
                                            Enroll in TESDA training programs at PSTDII to acquire this competency.
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

// ─── PAGE 6: MY APPLICATIONS ──────────────────────────────────────
const MyApplications = () => {
    const { currentUser, trainees, getTraineeApplications } = useApp();
    const trainee = trainees.find(t => t.id === currentUser?.id) || trainees[0];
    const myApps = getTraineeApplications(trainee?.id);
    const [search, setSearch] = useState('');

    const filtered = myApps.filter(a =>
        a.job?.title?.toLowerCase().includes(search.toLowerCase()) ||
        a.job?.companyName?.toLowerCase().includes(search.toLowerCase())
    );

    const statusBadge = (s) => {
        const map = { Pending: 'badge-pending', Accepted: 'badge-accepted', Rejected: 'badge-rejected' };
        return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
    };

    return (
        <div>
            <div className="page-header">
                <div><div className="page-title">My Applications</div><div className="page-subtitle">Track all your opportunity applications</div></div>
                <div className="badge badge-blue">{myApps.length} total</div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                {[
                    { label: 'Total', count: myApps.length, color: '#2563eb', bg: '#dbeafe' },
                    { label: 'Pending', count: myApps.filter(a => a.status === 'Pending').length, color: '#d97706', bg: '#fef3c7' },
                    { label: 'Accepted', count: myApps.filter(a => a.status === 'Accepted').length, color: '#16a34a', bg: '#dcfce7' },
                    { label: 'Rejected', count: myApps.filter(a => a.status === 'Rejected').length, color: '#dc2626', bg: '#fee2e2' },
                ].map(s => (
                    <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.count}</span>
                        <span style={{ fontSize: 13, color: s.color, fontWeight: 600 }}>{s.label}</span>
                    </div>
                ))}
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                    <div className="section-title">Application History</div>
                    <div className="search-bar" style={{ width: 240 }}>
                        <Search size={14} color="#94a3b8" />
                        <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Company</th>
                                <th>Type</th>
                                <th>NC Level</th>
                                <th>Date Applied</th>
                                <th>Status</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(a => (
                                <tr key={a.id}>
                                    <td style={{ fontWeight: 600, color: '#1e3a5f' }}>{a.job?.title || '—'}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Building2 size={14} color="#94a3b8" />
                                            {a.job?.companyName || '—'}
                                        </div>
                                    </td>
                                    <td><span className="badge badge-cyan" style={{ fontSize: 10 }}>{a.job?.opportunityType || '—'}</span></td>
                                    <td><span className="badge badge-purple">{a.job?.ncLevel || '—'}</span></td>
                                    <td style={{ color: '#64748b', fontSize: 13 }}>{a.appliedAt}</td>
                                    <td>{statusBadge(a.status)}</td>
                                    <td style={{ fontSize: 12.5, color: '#64748b', maxWidth: 180 }}>{a.notes || '—'}</td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No applications yet. Start applying!</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ─── PAGE 7: EMPLOYMENT STATUS ────────────────────────────────────
const EmploymentStatus = () => {
    const { currentUser, trainees, updateTrainee } = useApp();
    const trainee = trainees.find(t => t.id === currentUser?.id) || trainees[0];
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        employmentStatus: trainee?.employmentStatus || 'Unemployed',
        employer: trainee?.employer || '',
        jobTitle: trainee?.jobTitle || '',
        dateHired: trainee?.dateHired || '',
    });

    const statusColors = {
        Employed: '#16a34a', Unemployed: '#dc2626', 'Self-Employed': '#2563eb', Underemployed: '#d97706'
    };

    const save = () => {
        updateTrainee(trainee.id, { ...form, monthsAfterGraduation: form.dateHired ? Math.round((new Date() - new Date(form.dateHired)) / (1000 * 60 * 60 * 24 * 30)) : null });
        setEditing(false);
    };

    return (
        <div>
            <div className="page-header">
                <div><div className="page-title">Employment Status</div><div className="page-subtitle">Update your current employment information</div></div>
                <button className={`btn ${editing ? 'btn-success' : 'btn-primary'}`} onClick={editing ? save : () => setEditing(true)}>
                    {editing ? <><CheckCircle size={15} /> Save</> : <><Edit size={15} /> Update Status</>}
                </button>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ textAlign: 'center', padding: '20px 0 10px' }}>
                    <div style={{ fontSize: 48, fontWeight: 800, color: statusColors[trainee?.employmentStatus] || '#64748b', marginBottom: 8 }}>
                        {trainee?.employmentStatus || 'Unemployed'}
                    </div>
                    <div style={{ fontSize: 14, color: '#64748b' }}>{trainee?.employer ? `at ${trainee.employer}` : 'Currently not employed'}</div>
                    {trainee?.dateHired && <div style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 4 }}>Since {trainee.dateHired} &bull; {trainee.monthsAfterGraduation} months after graduation</div>}
                </div>
            </div>

            <div className="card" style={{ maxWidth: 560 }}>
                <div className="section-title" style={{ marginBottom: 20 }}>Update Employment Details</div>
                <div className="form-group">
                    <label className="form-label">Employment Status</label>
                    {editing ? (
                        <select className="form-select" value={form.employmentStatus} onChange={e => setForm({ ...form, employmentStatus: e.target.value })}>
                            {['Employed', 'Unemployed', 'Self-Employed', 'Underemployed'].map(s => <option key={s}>{s}</option>)}
                        </select>
                    ) : (
                        <span className={`badge badge-${(trainee?.employmentStatus || 'unemployed').toLowerCase().replace(' ', '-')}`} style={{ fontSize: 13 }}>{trainee?.employmentStatus || 'Unemployed'}</span>
                    )}
                </div>
                {(editing ? form.employmentStatus !== 'Unemployed' : trainee?.employmentStatus !== 'Unemployed') && (
                    <>
                        <div className="form-group">
                            <label className="form-label">Employer / Company</label>
                            {editing ? <input type="text" className="form-input" value={form.employer} onChange={e => setForm({ ...form, employer: e.target.value })} placeholder="Company name" /> : <div style={{ fontSize: 14, color: '#475569' }}>{trainee?.employer || '—'}</div>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Job Title / Position</label>
                            {editing ? <input type="text" className="form-input" value={form.jobTitle} onChange={e => setForm({ ...form, jobTitle: e.target.value })} placeholder="Your position" /> : <div style={{ fontSize: 14, color: '#475569' }}>{trainee?.jobTitle || '—'}</div>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Date Hired</label>
                            {editing ? <input type="date" className="form-input" value={form.dateHired} onChange={e => setForm({ ...form, dateHired: e.target.value })} /> : <div style={{ fontSize: 14, color: '#475569' }}>{trainee?.dateHired || '—'}</div>}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// ─── MAIN TRAINEE DASHBOARD ─────────────────────────────────────
export default function TraineeDashboard() {
    const [activePage, setActivePage] = useState('dashboard');

    const pageMap = {
        dashboard: { title: 'Trainee Dashboard', sub: 'Overview of your certification and employment journey' },
        profile: { title: 'My Profile', sub: 'Personal information and credentials' },
        certification: { title: 'Certification Progress', sub: 'Track your TESDA certification status' },
        recommendations: { title: 'Opportunities', sub: 'Jobs, OJT & apprenticeships matched to your qualifications' },
        applications: { title: 'My Applications', sub: 'Your application history and status' },
        'gap-analysis': { title: 'Gap Analysis', sub: 'Compare competencies to opportunity requirements' },
        employment: { title: 'Employment Status', sub: 'Your current employment details' },
    };

    const current = pageMap[activePage] || pageMap.dashboard;

    const renderPage = () => {
        switch (activePage) {
            case 'dashboard': return <TraineeDashboardHome setActivePage={setActivePage} />;
            case 'profile': return <TraineeProfile />;
            case 'certification': return <CertificationProgress />;
            case 'recommendations': return <Opportunities />;
            case 'applications': return <MyApplications />;
            case 'gap-analysis': return <GapAnalysis />;
            case 'employment': return <EmploymentStatus />;
            default: return <TraineeDashboardHome setActivePage={setActivePage} />;
        }
    };

    return (
        <AppLayout sidebar={<TraineeSidebar activePage={activePage} setActivePage={setActivePage} />} pageTitle={current.title} pageSubtitle={current.sub}>
            {renderPage()}
        </AppLayout>
    );
}
