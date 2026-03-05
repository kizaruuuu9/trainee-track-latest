import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
    LayoutDashboard, User, Briefcase, FileText, BarChart2, CheckCircle,
    LogOut, Bell, ChevronDown, Search, Filter, MapPin, Clock, Building2,
    TrendingUp, Award, Send, Star, AlertTriangle, CheckSquare, XCircle,
    Edit, Upload, Download, ChevronRight, X, Eye, Plus, Target, Menu,
    Home, BookOpen, Settings, ThumbsUp, MessageSquare, Share2, Bookmark
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════
   LINKEDIN-STYLE TRAINEE DASHBOARD
   ═══════════════════════════════════════════════════════════════════ */

// ─── TOP NAVIGATION BAR (LinkedIn-style) ─────────────────────────
const LinkedInTopNav = ({ activePage, setActivePage }) => {
    const { currentUser, userRole, logout } = useApp();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotif, setShowNotif] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const initials = currentUser?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T';

    const navItems = [
        { id: 'dashboard', label: 'Home', icon: <Home size={20} /> },
        { id: 'profile', label: 'Profile', icon: <User size={20} /> },
        { id: 'certification', label: 'Certifications', icon: <Award size={20} /> },
        { id: 'recommendations', label: 'Opportunities', icon: <Briefcase size={20} /> },
        { id: 'applications', label: 'Applications', icon: <FileText size={20} /> },
        { id: 'gap-analysis', label: 'Gap Analysis', icon: <BarChart2 size={20} /> },
        { id: 'employment', label: 'Employment', icon: <CheckCircle size={20} /> },
    ];

    return (
        <header className="ln-topnav">
            <div className="ln-topnav-inner">
                {/* Left: Logo + Search */}
                <div className="ln-topnav-left">
                    <div className="ln-logo">
                        <span className="ln-logo-icon">TT</span>
                    </div>
                    <div className="ln-search-wrap">
                        <Search size={16} className="ln-search-icon" />
                        <input
                            className="ln-search-input"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Center: Nav Items */}
                <nav className="ln-topnav-center">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            className={`ln-nav-item ${activePage === item.id ? 'active' : ''}`}
                            onClick={() => setActivePage(item.id)}
                            title={item.label}
                        >
                            {item.icon}
                            <span className="ln-nav-label">{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* Right: Notifications + Profile */}
                <div className="ln-topnav-right">
                    <div style={{ position: 'relative' }}>
                        <button className="ln-nav-item" onClick={() => { setShowNotif(!showNotif); setShowProfileMenu(false); }}>
                            <Bell size={20} />
                            <span className="ln-notif-dot" />
                            <span className="ln-nav-label">Alerts</span>
                        </button>
                        {showNotif && (
                            <div className="ln-dropdown" style={{ right: 0, minWidth: 300 }}>
                                <div className="ln-dropdown-header">Notifications</div>
                                {[
                                    { text: 'New opportunity match: Junior IT Technician', time: '2h ago' },
                                    { text: 'Your application was reviewed by TechSolutions', time: '5h ago' },
                                    { text: 'Profile viewed by 3 industry partners', time: '1d ago' },
                                ].map((n, i) => (
                                    <div key={i} className="ln-dropdown-item">
                                        <div className="ln-notif-avatar">
                                            <Building2 size={16} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div className="ln-notif-text">{n.text}</div>
                                            <div className="ln-notif-time">{n.time}</div>
                                        </div>
                                    </div>
                                ))}
                                <div className="ln-dropdown-footer">View all notifications</div>
                            </div>
                        )}
                    </div>

                    <div className="ln-topnav-divider" />

                    <div style={{ position: 'relative' }}>
                        <button className="ln-nav-item ln-profile-trigger" onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotif(false); }}>
                            <div className="ln-nav-avatar">{initials}</div>
                            <span className="ln-nav-label">
                                Me <ChevronDown size={12} style={{ marginLeft: 2 }} />
                            </span>
                        </button>
                        {showProfileMenu && (
                            <div className="ln-dropdown" style={{ right: 0, minWidth: 260 }}>
                                <div className="ln-dropdown-profile">
                                    <div className="ln-dropdown-profile-avatar">{initials}</div>
                                    <div>
                                        <div className="ln-dropdown-profile-name">{currentUser?.name || 'Trainee'}</div>
                                        <div className="ln-dropdown-profile-role">TESDA Trainee</div>
                                    </div>
                                </div>
                                <button className="ln-dropdown-profile-btn" onClick={() => { setActivePage('profile'); setShowProfileMenu(false); }}>
                                    View Profile
                                </button>
                                <div className="ln-dropdown-divider" />
                                <div className="ln-dropdown-item" onClick={() => { setActivePage('employment'); setShowProfileMenu(false); }}>
                                    <Settings size={16} /> Settings
                                </div>
                                <div className="ln-dropdown-divider" />
                                <div className="ln-dropdown-item ln-dropdown-danger" onClick={logout}>
                                    <LogOut size={16} /> Sign Out
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile hamburger */}
                <button className="ln-mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    <Menu size={22} />
                </button>
            </div>

            {/* Mobile nav dropdown */}
            {mobileMenuOpen && (
                <div className="ln-mobile-nav">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            className={`ln-mobile-nav-item ${activePage === item.id ? 'active' : ''}`}
                            onClick={() => { setActivePage(item.id); setMobileMenuOpen(false); }}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    ))}
                    <div className="ln-dropdown-divider" />
                    <button className="ln-mobile-nav-item ln-dropdown-danger" onClick={logout}>
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            )}
        </header>
    );
};

// ─── LAYOUT WRAPPER ──────────────────────────────────────────────
const LinkedInLayout = ({ children, activePage, setActivePage }) => (
    <div className="ln-app">
        <LinkedInTopNav activePage={activePage} setActivePage={setActivePage} />
        <main className="ln-main">
            {children}
        </main>
    </div>
);

// ─── LEFT PROFILE CARD (LinkedIn-style) ──────────────────────────
const ProfileSideCard = ({ trainee, setActivePage }) => {
    const initials = trainee?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T';
    return (
        <div className="ln-card ln-profile-card">
            <div className="ln-profile-banner" />
            <div className="ln-profile-card-body">
                <div className="ln-profile-avatar-wrap">
                    <div className="ln-profile-avatar-lg">{initials}</div>
                </div>
                <h2 className="ln-profile-name">{trainee?.name}</h2>
                <p className="ln-profile-headline">TESDA Trainee &bull; Class of {trainee?.graduationYear}</p>
                <p className="ln-profile-location"><MapPin size={13} /> {trainee?.address || 'Philippines'}</p>

                <div className="ln-profile-stats">
                    <div className="ln-profile-stat" onClick={() => setActivePage('certification')}>
                        <span className="ln-profile-stat-num">{trainee?.certifications?.length || 0}</span>
                        <span className="ln-profile-stat-label">Certifications</span>
                    </div>
                    <div className="ln-profile-stat-divider" />
                    <div className="ln-profile-stat" onClick={() => setActivePage('recommendations')}>
                        <span className="ln-profile-stat-num">{trainee?.competencies?.length || 0}</span>
                        <span className="ln-profile-stat-label">Skills</span>
                    </div>
                </div>

                <div className="ln-profile-certs">
                    {trainee?.certifications?.map(c => (
                        <span key={c} className="ln-cert-tag"><Award size={12} /> {c}</span>
                    ))}
                </div>

                <button className="ln-btn-profile-view" onClick={() => setActivePage('profile')}>
                    View full profile
                </button>
            </div>
        </div>
    );
};

// ─── RIGHT SIDEBAR WIDGET ────────────────────────────────────────
const SuggestedOpportunities = ({ recJobs, handleApply, setActivePage }) => (
    <div className="ln-card ln-widget">
        <div className="ln-widget-header">
            <span>Recommended for you</span>
            <button className="ln-link-btn" onClick={() => setActivePage('recommendations')}>See all</button>
        </div>
        {recJobs.slice(0, 3).map(job => (
            <div key={job.id} className="ln-suggested-item">
                <div className="ln-suggested-icon">
                    <Building2 size={18} />
                </div>
                <div className="ln-suggested-info">
                    <div className="ln-suggested-title">{job.title}</div>
                    <div className="ln-suggested-company">{job.companyName}</div>
                    <div className="ln-suggested-meta">
                        <MapPin size={11} /> {job.location} &bull; {job.opportunityType}
                    </div>
                    <div className="ln-match-row">
                        <div className="ln-match-bar">
                            <div
                                className={`ln-match-fill ${job.matchRate >= 70 ? 'high' : job.matchRate >= 40 ? 'mid' : 'low'}`}
                                style={{ width: `${job.matchRate}%` }}
                            />
                        </div>
                        <span className="ln-match-pct">{job.matchRate}%</span>
                    </div>
                </div>
            </div>
        ))}
        {recJobs.length === 0 && (
            <div className="ln-empty-widget">No recommendations yet</div>
        )}
    </div>
);

const QuickLinksWidget = ({ setActivePage }) => (
    <div className="ln-card ln-widget">
        <div className="ln-widget-header"><span>Quick Links</span></div>
        {[
            { label: 'Gap Analysis', icon: <BarChart2 size={16} />, page: 'gap-analysis' },
            { label: 'My Applications', icon: <FileText size={16} />, page: 'applications' },
            { label: 'Employment Status', icon: <TrendingUp size={16} />, page: 'employment' },
            { label: 'Certifications', icon: <Award size={16} />, page: 'certification' },
        ].map(link => (
            <button key={link.page} className="ln-quick-link" onClick={() => setActivePage(link.page)}>
                {link.icon} {link.label}
                <ChevronRight size={14} className="ln-quick-link-arrow" />
            </button>
        ))}
    </div>
);

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

// ─── PAGE 1: DASHBOARD HOME (LinkedIn Feed-style) ───────────────
const TraineeDashboardHome = ({ setActivePage }) => {
    const { currentUser, trainees, jobPostings, applications, getTraineeRecommendedJobs, applyToJob } = useApp();
    const trainee = trainees.find(t => t.id === currentUser?.id) || trainees[0];
    const myApps = applications.filter(a => a.traineeId === trainee?.id);
    const recJobs = getTraineeRecommendedJobs(trainee?.id).slice(0, 6);

    const handleApply = (jobId) => {
        const result = applyToJob(trainee?.id, jobId);
        if (!result.success) alert(result.error);
    };

    const stats = [
        { label: 'Match Rate', value: recJobs.length > 0 ? `${Math.round(recJobs.reduce((s, j) => s + j.matchRate, 0) / recJobs.length)}%` : '0%', icon: <Target size={20} />, color: '#0a66c2' },
        { label: 'Applications', value: myApps.length, icon: <Send size={20} />, color: '#057642' },
        { label: 'Status', value: trainee?.employmentStatus || 'Unemployed', icon: <Briefcase size={20} />, color: '#b24020' },
        { label: 'Certifications', value: trainee?.certifications?.length || 0, icon: <Award size={20} />, color: '#7c3aed' },
    ];

    return (
        <div className="ln-three-col">
            {/* Left Column - Profile Card */}
            <div className="ln-col-left">
                <ProfileSideCard trainee={trainee} setActivePage={setActivePage} />
            </div>

            {/* Center Column - Feed */}
            <div className="ln-col-center">
                {/* Stats Row */}
                <div className="ln-card ln-stats-row">
                    {stats.map((s, i) => (
                        <div key={i} className="ln-stat-item">
                            <div className="ln-stat-icon" style={{ color: s.color }}>{s.icon}</div>
                            <div className="ln-stat-value">{s.value}</div>
                            <div className="ln-stat-label">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Activity / Welcome card */}
                <div className="ln-card ln-feed-card">
                    <div className="ln-feed-card-header">
                        <div className="ln-feed-avatar">
                            {trainee?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T'}
                        </div>
                        <div>
                            <div className="ln-feed-author">{trainee?.name}</div>
                            <div className="ln-feed-meta">TESDA Trainee &bull; {trainee?.certifications?.length} certifications</div>
                        </div>
                    </div>
                    <div className="ln-feed-content">
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'rgba(0,0,0,0.9)' }}>
                            Welcome back! Here's your career snapshot
                        </h3>
                        <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', lineHeight: 1.6, marginBottom: 12 }}>
                            You have <strong>{recJobs.length}</strong> recommended opportunities based on your TESDA certifications.
                            {myApps.filter(a => a.status === 'Pending').length > 0 && (
                                <> You also have <strong>{myApps.filter(a => a.status === 'Pending').length}</strong> pending application(s).</>
                            )}
                        </p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {trainee?.certifications?.map(c => (
                                <span key={c} className="ln-cert-tag"><Award size={12} /> {c}</span>
                            ))}
                        </div>
                    </div>
                    <div className="ln-feed-actions">
                        <button className="ln-feed-action-btn" onClick={() => setActivePage('recommendations')}>
                            <Briefcase size={16} /> Browse Opportunities
                        </button>
                        <button className="ln-feed-action-btn" onClick={() => setActivePage('gap-analysis')}>
                            <BarChart2 size={16} /> Gap Analysis
                        </button>
                        <button className="ln-feed-action-btn" onClick={() => setActivePage('applications')}>
                            <FileText size={16} /> My Applications
                        </button>
                    </div>
                </div>

                {/* Top Recommended Opportunities as feed cards */}
                <div className="ln-card">
                    <div className="ln-section-header">
                        <h3>Top Opportunities for You</h3>
                        <button className="ln-link-btn" onClick={() => setActivePage('recommendations')}>
                            See all <ChevronRight size={14} />
                        </button>
                    </div>
                    <div className="ln-opportunities-list">
                        {recJobs.slice(0, 4).map(job => (
                            <div key={job.id} className="ln-opportunity-item">
                                <div className="ln-opportunity-icon">
                                    <Building2 size={22} />
                                </div>
                                <div className="ln-opportunity-info">
                                    <div className="ln-opportunity-title">{job.title}</div>
                                    <div className="ln-opportunity-company">{job.companyName}</div>
                                    <div className="ln-opportunity-details">
                                        <span><MapPin size={12} /> {job.location}</span>
                                        <span><Clock size={12} /> {job.employmentType}</span>
                                        <span className="ln-opp-type-badge">{job.opportunityType}</span>
                                    </div>
                                    <div className="ln-match-row" style={{ marginTop: 8 }}>
                                        <div className="ln-match-bar" style={{ flex: 1 }}>
                                            <div
                                                className={`ln-match-fill ${job.matchRate >= 70 ? 'high' : job.matchRate >= 40 ? 'mid' : 'low'}`}
                                                style={{ width: `${job.matchRate}%` }}
                                            />
                                        </div>
                                        <span className="ln-match-pct">{job.matchRate}% match</span>
                                    </div>
                                </div>
                                <div className="ln-opportunity-actions">
                                    <button className="ln-btn-apply" onClick={() => handleApply(job.id)}>
                                        <Send size={14} /> Apply
                                    </button>
                                    <button className="ln-btn-save">
                                        <Bookmark size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {recJobs.length === 0 && (
                            <div className="ln-empty-widget" style={{ padding: 40 }}>
                                <Briefcase size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
                                <p>No open opportunities found. Check back soon!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Column - Widgets */}
            <div className="ln-col-right">
                <SuggestedOpportunities recJobs={recJobs} handleApply={handleApply} setActivePage={setActivePage} />
                <QuickLinksWidget setActivePage={setActivePage} />
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
        <div className="ln-profile-page">
            {/* Profile Header Card */}
            <div className="ln-card ln-profile-header-card">
                <div className="ln-profile-header-banner" />
                <div className="ln-profile-header-body">
                    <div className="ln-profile-header-avatar">{initials}</div>
                    <div className="ln-profile-header-info">
                        <div className="ln-profile-header-top">
                            <div>
                                <h1 className="ln-profile-header-name">{trainee?.name}</h1>
                                <p className="ln-profile-header-headline">TESDA Trainee &bull; {trainee?.certifications?.join(', ')}</p>
                                <p className="ln-profile-header-loc"><MapPin size={14} /> {trainee?.address || 'Philippines'} &bull; Class of {trainee?.graduationYear}</p>
                                <p className="ln-profile-header-contact">{trainee?.email}</p>
                            </div>
                            <button className={`ln-btn ${editing ? 'ln-btn-success' : 'ln-btn-primary'}`} onClick={editing ? save : () => setEditing(true)}>
                                {editing ? <><CheckCircle size={15} /> Save Changes</> : <><Edit size={15} /> Edit Profile</>}
                            </button>
                        </div>
                        <div className="ln-profile-certs-row">
                            {trainee?.certifications?.map(c => (
                                <span key={c} className="ln-cert-tag"><Award size={12} /> {c}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="ln-profile-two-col">
                <div className="ln-profile-main">
                    {/* Personal Info */}
                    <div className="ln-card">
                        <div className="ln-section-header">
                            <h3>Personal Information</h3>
                        </div>
                        <div className="ln-info-grid">
                            {[
                                { label: 'Full Name', key: 'name', type: 'text' },
                                { label: 'Email', key: 'email', type: 'email' },
                                { label: 'Phone', key: 'phone', type: 'text' },
                                { label: 'Address', key: 'address', type: 'text' },
                                { label: 'Birthday', key: 'birthday', type: 'date' },
                                { label: 'Gender', key: 'gender', type: 'select', options: ['Male', 'Female', 'Other'] },
                            ].map(f => (
                                <div key={f.key} className="ln-info-item">
                                    <label className="ln-info-label">{f.label}</label>
                                    {editing ? (
                                        f.type === 'select' ? (
                                            <select className="form-select" value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })}>
                                                {f.options.map(o => <option key={o}>{o}</option>)}
                                            </select>
                                        ) : (
                                            <input type={f.type} className="form-input" value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                                        )
                                    ) : (
                                        <div className="ln-info-value">{trainee?.[f.key] || '—'}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Achievements */}
                    <div className="ln-card">
                        <div className="ln-section-header"><h3>Achievements</h3></div>
                        {trainee?.achievements?.length > 0 ? trainee.achievements.map((a, i) => (
                            <div key={i} className="ln-achievement-item">
                                <Star size={18} color="#f59e0b" />
                                <span>{a}</span>
                            </div>
                        )) : <div className="ln-empty-widget" style={{ padding: 24 }}><Star size={28} style={{ opacity: 0.3 }} /><p>No achievements added yet</p></div>}
                    </div>
                </div>

                <div className="ln-profile-sidebar">
                    {/* Competencies */}
                    <div className="ln-card">
                        <div className="ln-section-header"><h3>Skills & Competencies</h3></div>
                        {allCompetencies.slice(0, 8).map(comp => {
                            const has = trainee?.competencies?.includes(comp);
                            return (
                                <div key={comp} className="ln-skill-item">
                                    <div className="ln-skill-row">
                                        {has ? <CheckSquare size={16} color="#057642" /> : <XCircle size={16} color="#cc1016" />}
                                        <span className="ln-skill-name">{comp}</span>
                                    </div>
                                    {has && <span className="ln-skill-badge">Acquired</span>}
                                </div>
                            );
                        })}
                    </div>

                    {/* Documents */}
                    <div className="ln-card">
                        <div className="ln-section-header"><h3>Documents</h3></div>
                        {[
                            { key: 'resume', label: 'Resume / CV' },
                            { key: 'diploma', label: 'Diploma' },
                            { key: 'tor', label: 'Transcript of Records' },
                        ].map(doc => (
                            <div key={doc.key} className="ln-doc-item">
                                <div className="ln-doc-info">
                                    <FileText size={16} color="rgba(0,0,0,0.5)" />
                                    <span>{doc.label}</span>
                                </div>
                                {trainee?.documents?.[doc.key] ? (
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button className="ln-btn-sm ln-btn-outline"><Eye size={12} /> View</button>
                                        <button className="ln-btn-sm ln-btn-outline"><Download size={12} /></button>
                                    </div>
                                ) : (
                                    <button className="ln-btn-sm ln-btn-outline"><Upload size={12} /> Upload</button>
                                )}
                            </div>
                        ))}
                    </div>
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
        const map = { Passed: 'ln-badge-green', Failed: 'ln-badge-red', 'Pending Assessment': 'ln-badge-yellow' };
        return <span className={`ln-badge ${map[s] || 'ln-badge-gray'}`}>{s}</span>;
    };

    const certStatusBadge = (s) => {
        const map = { Completed: 'ln-badge-green', 'In Progress': 'ln-badge-blue', 'Not Started': 'ln-badge-gray' };
        return <span className={`ln-badge ${map[s] || 'ln-badge-gray'}`}>{s}</span>;
    };

    return (
        <div className="ln-page-content">
            <div className="ln-page-header">
                <div>
                    <h1 className="ln-page-title">Certification Progress</h1>
                    <p className="ln-page-subtitle">Track your TESDA certification journey</p>
                </div>
                <span className="ln-badge ln-badge-blue">{progress.length} certification{progress.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Overview Stats */}
            <div className="ln-stats-grid-4">
                {[
                    { label: 'Total Certifications', value: progress.length, icon: <Award size={22} />, color: '#7c3aed' },
                    { label: 'Completed', value: progress.filter(p => p.status === 'Completed').length, icon: <CheckCircle size={22} />, color: '#057642' },
                    { label: 'In Progress', value: progress.filter(p => p.status === 'In Progress').length, icon: <Clock size={22} />, color: '#0a66c2' },
                    { label: 'Overall Progress', value: progress.length > 0 ? `${Math.round(progress.reduce((s, c) => s + getCompletionPercent(c), 0) / progress.length)}%` : '0%', icon: <TrendingUp size={22} />, color: '#b24020' },
                ].map((s, i) => (
                    <div key={i} className="ln-stat-card">
                        <div className="ln-stat-card-icon" style={{ color: s.color }}>{s.icon}</div>
                        <div className="ln-stat-card-value">{s.value}</div>
                        <div className="ln-stat-card-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Certification Cards */}
            {progress.map((cert, ci) => {
                const pct = getCompletionPercent(cert);
                return (
                    <div key={ci} className="ln-card" style={{ marginBottom: 16 }}>
                        <div className="ln-cert-card-header">
                            <div className="ln-cert-card-left">
                                <div className="ln-cert-card-icon"><Award size={22} /></div>
                                <div>
                                    <div className="ln-cert-card-name">{cert.certification}</div>
                                    <div className="ln-cert-card-date">Enrolled: {cert.enrolledDate}</div>
                                </div>
                            </div>
                            <div className="ln-cert-card-right">
                                {certStatusBadge(cert.status)}
                                <span className={`ln-cert-pct ${pct >= 70 ? 'high' : pct >= 40 ? 'mid' : 'low'}`}>{pct}%</span>
                            </div>
                        </div>

                        <div style={{ margin: '16px 0' }}>
                            <ProgressBar value={pct} />
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table className="ln-table">
                                <thead>
                                    <tr><th>#</th><th>Unit of Competency</th><th>Status</th><th>Remarks</th></tr>
                                </thead>
                                <tbody>
                                    {cert.competencies.map((comp, i) => (
                                        <tr key={i}>
                                            <td style={{ color: '#00000066', width: 40 }}>{i + 1}</td>
                                            <td style={{ fontWeight: 500 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    {comp.status === 'Passed' ? <CheckSquare size={14} color="#057642" /> :
                                                        comp.status === 'Failed' ? <XCircle size={14} color="#cc1016" /> :
                                                            <Clock size={14} color="#b24020" />}
                                                    {comp.name}
                                                </div>
                                            </td>
                                            <td>{statusBadge(comp.status)}</td>
                                            <td style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)', maxWidth: 200 }}>{comp.remarks || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}

            {progress.length === 0 && (
                <div className="ln-empty-state"><Award size={48} /><h3>No certifications found</h3><p>Your certification progress will appear here once enrolled.</p></div>
            )}
        </div>
    );
};

// ─── PAGE 4: OPPORTUNITIES ───────────────────────────────────────
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
        <div className="ln-page-content">
            <div className="ln-page-header">
                <div>
                    <h1 className="ln-page-title">Opportunities</h1>
                    <p className="ln-page-subtitle">Jobs, OJT, and apprenticeships matched to your qualifications</p>
                </div>
                <span className="ln-badge ln-badge-blue">{filtered.length} positions found</span>
            </div>

            {/* Filters */}
            <div className="ln-card" style={{ marginBottom: 16 }}>
                <div className="ln-filters-row">
                    <div className="ln-search-wrap ln-search-wide">
                        <Search size={16} className="ln-search-icon" />
                        <input className="ln-search-input" placeholder="Search title or company..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    {[
                        { label: 'Type', val: filterOpType, set: setFilterOpType, opts: opTypes },
                        { label: 'Industry', val: filterIndustry, set: setFilterIndustry, opts: industries },
                        { label: 'Location', val: filterLocation, set: setFilterLocation, opts: locations },
                        { label: 'Employment', val: filterType, set: setFilterType, opts: types },
                    ].map(f => (
                        <select key={f.label} className="ln-filter-select" value={f.val} onChange={e => f.set(e.target.value)}>
                            {f.opts.map(o => <option key={o}>{o}</option>)}
                        </select>
                    ))}
                </div>
            </div>

            {/* Job Cards - LinkedIn Style */}
            <div className="ln-jobs-list">
                {filtered.map(job => {
                    const applied = myApps.includes(job.id);
                    return (
                        <div key={job.id} className="ln-card ln-job-card-li">
                            <div className="ln-job-card-top">
                                <div className="ln-job-card-icon">
                                    <Building2 size={24} />
                                </div>
                                <div className="ln-job-card-info">
                                    <div className="ln-job-card-title">{job.title}</div>
                                    <div className="ln-job-card-company">{job.companyName}</div>
                                    <div className="ln-job-card-meta">
                                        <span><MapPin size={13} /> {job.location}</span>
                                        <span><Clock size={13} /> {job.employmentType}</span>
                                    </div>
                                </div>
                                <div className="ln-job-card-badges">
                                    <span className={`ln-badge ln-badge-${job.status === 'Open' ? 'green' : 'gray'}`}>{job.status}</span>
                                    <span className="ln-badge ln-badge-blue" style={{ fontSize: 11 }}>{job.opportunityType}</span>
                                </div>
                            </div>

                            <div className="ln-match-row" style={{ margin: '12px 0' }}>
                                <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.6)' }}>Match Rate</span>
                                <div className="ln-match-bar" style={{ flex: 1 }}>
                                    <div className={`ln-match-fill ${job.matchRate >= 70 ? 'high' : job.matchRate >= 40 ? 'mid' : 'low'}`} style={{ width: `${job.matchRate}%` }} />
                                </div>
                                <span className="ln-match-pct">{job.matchRate}%</span>
                            </div>

                            <div className="ln-job-card-footer">
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <span className="ln-badge ln-badge-purple">{job.ncLevel}</span>
                                    {job.salaryRange && <span style={{ fontSize: 13, color: '#057642', fontWeight: 600 }}>{job.salaryRange}</span>}
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="ln-btn-sm ln-btn-outline" onClick={() => setSelectedJob(job)}>
                                        <Eye size={13} /> Details
                                    </button>
                                    <button className="ln-btn-sm ln-btn-primary" disabled={applied || job.status !== 'Open'} onClick={() => handleApply(job.id)}>
                                        {applied ? <><CheckCircle size={13} /> Applied</> : <><Send size={13} /> Apply</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filtered.length === 0 && (
                <div className="ln-empty-state"><Briefcase size={48} /><h3>No opportunities found</h3><p>Try adjusting your filters.</p></div>
            )}

            {/* Detail Modal */}
            {selectedJob && (
                <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
                    <div className="ln-modal" onClick={e => e.stopPropagation()}>
                        <div className="ln-modal-header">
                            <div>
                                <h3 className="ln-modal-title">{selectedJob.title}</h3>
                                <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', marginTop: 4 }}>{selectedJob.companyName} &bull; {selectedJob.location}</p>
                            </div>
                            <button className="ln-btn-icon" onClick={() => setSelectedJob(null)}><X size={18} /></button>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                            <span className={`ln-badge ln-badge-${selectedJob.status === 'Open' ? 'green' : 'gray'}`}>{selectedJob.status}</span>
                            <span className="ln-badge ln-badge-blue">{selectedJob.opportunityType}</span>
                            <span className="ln-badge ln-badge-purple">{selectedJob.ncLevel}</span>
                            <span className="ln-badge ln-badge-gray">{selectedJob.employmentType}</span>
                            <span className="ln-badge ln-badge-blue">{selectedJob.matchRate}% Match</span>
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: 'rgba(0,0,0,0.9)' }}>Description</div>
                            <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', lineHeight: 1.7 }}>{selectedJob.description}</p>
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: 'rgba(0,0,0,0.9)' }}>Required Competencies</div>
                            {selectedJob.requiredCompetencies.map((c, i) => (
                                <div key={i} className="ln-skill-item" style={{ borderBottom: '1px solid #f3f2ef' }}>
                                    <div className="ln-skill-row">
                                        <CheckSquare size={14} color="#0a66c2" />
                                        <span className="ln-skill-name">{c}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="ln-modal-footer">
                            <span style={{ fontSize: 15, fontWeight: 700, color: '#057642' }}>{selectedJob.salaryRange}</span>
                            <button className="ln-btn ln-btn-primary" onClick={() => { applyToJob(trainee?.id, selectedJob.id); setSelectedJob(null); }}>
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
        <div className="ln-page-content">
            <div className="ln-page-header">
                <div>
                    <h1 className="ln-page-title">Gap Analysis</h1>
                    <p className="ln-page-subtitle">Compare your competencies to opportunity requirements</p>
                </div>
            </div>

            <div className="ln-card" style={{ marginBottom: 16 }}>
                <label className="ln-info-label" style={{ marginBottom: 8, display: 'block' }}>Select an Opportunity to Analyze</label>
                <select className="ln-filter-select" style={{ width: '100%' }} value={selectedJobId || ''} onChange={e => setSelectedJobId(Number(e.target.value))}>
                    {jobPostings.map(j => <option key={j.id} value={j.id}>{j.title} — {j.companyName} ({j.opportunityType})</option>)}
                </select>
            </div>

            {selectedJob && (
                <>
                    <div className="ln-stats-grid-3">
                        {[
                            { label: 'Match Rate', value: `${matchRate}%`, icon: <TrendingUp size={22} />, color: '#0a66c2' },
                            { label: 'Matched Skills', value: matched.length, icon: <CheckSquare size={22} />, color: '#057642' },
                            { label: 'Missing Skills', value: missing.length, icon: <AlertTriangle size={22} />, color: '#cc1016' },
                        ].map((s, i) => (
                            <div key={i} className="ln-stat-card">
                                <div className="ln-stat-card-icon" style={{ color: s.color }}>{s.icon}</div>
                                <div className="ln-stat-card-value">{s.value}</div>
                                <div className="ln-stat-card-label">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="ln-card" style={{ marginBottom: 16 }}>
                        <div className="ln-section-header">
                            <h3>Competency Comparison</h3>
                            <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)' }}>{selectedJob.title} at {selectedJob.companyName}</span>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="ln-table">
                                <thead>
                                    <tr><th>#</th><th>Required Competency</th><th>Your Status</th><th>Status</th></tr>
                                </thead>
                                <tbody>
                                    {analysis.map((a, i) => (
                                        <tr key={i}>
                                            <td style={{ color: 'rgba(0,0,0,0.4)', width: 40 }}>{i + 1}</td>
                                            <td style={{ fontWeight: 500 }}>{a.competency}</td>
                                            <td>
                                                {a.status === 'Matched'
                                                    ? <span style={{ fontSize: 13, color: '#057642', fontWeight: 600 }}>✓ You have this</span>
                                                    : <span style={{ fontSize: 13, color: '#cc1016' }}>✗ Not yet acquired</span>
                                                }
                                            </td>
                                            <td>
                                                <span className={`ln-badge ${a.status === 'Matched' ? 'ln-badge-green' : 'ln-badge-red'}`}>{a.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {missing.length > 0 && (
                        <div className="ln-card ln-card-warning">
                            <h3 className="ln-warning-title">
                                <AlertTriangle size={18} /> Skill Gap Recommendations
                            </h3>
                            <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', marginBottom: 16 }}>
                                You are missing <strong>{missing.length}</strong> competency/ies. Consider enrolling in TESDA training programs.
                            </p>
                            {missing.map((m, i) => (
                                <div key={i} className="ln-gap-item">
                                    <div className="ln-gap-num">{i + 1}</div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 14, color: 'rgba(0,0,0,0.9)' }}>{m.competency}</div>
                                        <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)', marginTop: 2 }}>
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
        const map = { Pending: 'ln-badge-yellow', Accepted: 'ln-badge-green', Rejected: 'ln-badge-red' };
        return <span className={`ln-badge ${map[s] || 'ln-badge-gray'}`}>{s}</span>;
    };

    return (
        <div className="ln-page-content">
            <div className="ln-page-header">
                <div>
                    <h1 className="ln-page-title">My Applications</h1>
                    <p className="ln-page-subtitle">Track all your opportunity applications</p>
                </div>
                <span className="ln-badge ln-badge-blue">{myApps.length} total</span>
            </div>

            {/* Summary pills */}
            <div className="ln-pills-row">
                {[
                    { label: 'Total', count: myApps.length, color: '#0a66c2' },
                    { label: 'Pending', count: myApps.filter(a => a.status === 'Pending').length, color: '#b24020' },
                    { label: 'Accepted', count: myApps.filter(a => a.status === 'Accepted').length, color: '#057642' },
                    { label: 'Rejected', count: myApps.filter(a => a.status === 'Rejected').length, color: '#cc1016' },
                ].map(s => (
                    <div key={s.label} className="ln-pill" style={{ borderLeft: `3px solid ${s.color}` }}>
                        <span className="ln-pill-count" style={{ color: s.color }}>{s.count}</span>
                        <span className="ln-pill-label">{s.label}</span>
                    </div>
                ))}
            </div>

            <div className="ln-card">
                <div className="ln-section-header" style={{ marginBottom: 16 }}>
                    <h3>Application History</h3>
                    <div className="ln-search-wrap" style={{ width: 240 }}>
                        <Search size={16} className="ln-search-icon" />
                        <input className="ln-search-input" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="ln-table">
                        <thead>
                            <tr><th>Title</th><th>Company</th><th>Type</th><th>NC Level</th><th>Date Applied</th><th>Status</th><th>Notes</th></tr>
                        </thead>
                        <tbody>
                            {filtered.map(a => (
                                <tr key={a.id}>
                                    <td style={{ fontWeight: 600, color: '#0a66c2' }}>{a.job?.title || '—'}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Building2 size={14} color="rgba(0,0,0,0.4)" />
                                            {a.job?.companyName || '—'}
                                        </div>
                                    </td>
                                    <td><span className="ln-badge ln-badge-blue" style={{ fontSize: 11 }}>{a.job?.opportunityType || '—'}</span></td>
                                    <td><span className="ln-badge ln-badge-purple">{a.job?.ncLevel || '—'}</span></td>
                                    <td style={{ color: 'rgba(0,0,0,0.5)', fontSize: 13 }}>{a.appliedAt}</td>
                                    <td>{statusBadge(a.status)}</td>
                                    <td style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)', maxWidth: 180 }}>{a.notes || '—'}</td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'rgba(0,0,0,0.4)' }}>No applications yet. Start applying!</td></tr>
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
        Employed: '#057642', Unemployed: '#cc1016', 'Self-Employed': '#0a66c2', Underemployed: '#b24020'
    };

    const save = () => {
        updateTrainee(trainee.id, { ...form, monthsAfterGraduation: form.dateHired ? Math.round((new Date() - new Date(form.dateHired)) / (1000 * 60 * 60 * 24 * 30)) : null });
        setEditing(false);
    };

    return (
        <div className="ln-page-content">
            <div className="ln-page-header">
                <div>
                    <h1 className="ln-page-title">Employment Status</h1>
                    <p className="ln-page-subtitle">Update your current employment information</p>
                </div>
                <button className={`ln-btn ${editing ? 'ln-btn-success' : 'ln-btn-primary'}`} onClick={editing ? save : () => setEditing(true)}>
                    {editing ? <><CheckCircle size={15} /> Save</> : <><Edit size={15} /> Update Status</>}
                </button>
            </div>

            <div className="ln-card" style={{ marginBottom: 16 }}>
                <div className="ln-employment-status-hero">
                    <div className="ln-employment-status-text" style={{ color: statusColors[trainee?.employmentStatus] || 'rgba(0,0,0,0.5)' }}>
                        {trainee?.employmentStatus || 'Unemployed'}
                    </div>
                    <div style={{ fontSize: 15, color: 'rgba(0,0,0,0.6)' }}>{trainee?.employer ? `at ${trainee.employer}` : 'Currently not employed'}</div>
                    {trainee?.dateHired && <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)', marginTop: 4 }}>Since {trainee.dateHired} &bull; {trainee.monthsAfterGraduation} months after graduation</div>}
                </div>
            </div>

            <div className="ln-card" style={{ maxWidth: 560 }}>
                <div className="ln-section-header" style={{ marginBottom: 20 }}><h3>Update Employment Details</h3></div>
                <div className="form-group">
                    <label className="ln-info-label">Employment Status</label>
                    {editing ? (
                        <select className="ln-filter-select" style={{ width: '100%' }} value={form.employmentStatus} onChange={e => setForm({ ...form, employmentStatus: e.target.value })}>
                            {['Employed', 'Unemployed', 'Self-Employed', 'Underemployed'].map(s => <option key={s}>{s}</option>)}
                        </select>
                    ) : (
                        <span className={`ln-badge ${statusColors[trainee?.employmentStatus] === '#057642' ? 'ln-badge-green' : statusColors[trainee?.employmentStatus] === '#cc1016' ? 'ln-badge-red' : 'ln-badge-blue'}`} style={{ fontSize: 13 }}>
                            {trainee?.employmentStatus || 'Unemployed'}
                        </span>
                    )}
                </div>
                {(editing ? form.employmentStatus !== 'Unemployed' : trainee?.employmentStatus !== 'Unemployed') && (
                    <>
                        <div className="form-group">
                            <label className="ln-info-label">Employer / Company</label>
                            {editing ? <input type="text" className="form-input" value={form.employer} onChange={e => setForm({ ...form, employer: e.target.value })} placeholder="Company name" /> : <div className="ln-info-value">{trainee?.employer || '—'}</div>}
                        </div>
                        <div className="form-group">
                            <label className="ln-info-label">Job Title / Position</label>
                            {editing ? <input type="text" className="form-input" value={form.jobTitle} onChange={e => setForm({ ...form, jobTitle: e.target.value })} placeholder="Your position" /> : <div className="ln-info-value">{trainee?.jobTitle || '—'}</div>}
                        </div>
                        <div className="form-group">
                            <label className="ln-info-label">Date Hired</label>
                            {editing ? <input type="date" className="form-input" value={form.dateHired} onChange={e => setForm({ ...form, dateHired: e.target.value })} /> : <div className="ln-info-value">{trainee?.dateHired || '—'}</div>}
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
        <LinkedInLayout activePage={activePage} setActivePage={setActivePage}>
            {renderPage()}
        </LinkedInLayout>
    );
}
