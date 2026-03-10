import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
    LayoutDashboard, User, Briefcase, FileText, BarChart2, CheckCircle,
    LogOut, Bell, ChevronDown, Search, Filter, MapPin, Clock, Building2,
    TrendingUp, Award, Send, Star, AlertTriangle, CheckSquare, XCircle,
    Edit, Upload, Download, ChevronRight, X, Eye, Plus, Target, Menu,
    Home, BookOpen, Settings, ThumbsUp, MessageSquare, Share2, Bookmark,
    Trash2, Camera, Loader
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

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
        { id: 'recommendations', label: 'Opportunities', icon: <Briefcase size={20} /> },
        { id: 'applications', label: 'Applications', icon: <FileText size={20} /> },
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
                                <div className="ln-dropdown-item" onClick={() => { setActivePage('profile'); setShowProfileMenu(false); }}>
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
            <div className="ln-profile-banner" style={trainee?.bannerUrl ? {
                backgroundImage: `url(${trainee.bannerUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            } : {}} />
            <div className="ln-profile-card-body">
                <div className="ln-profile-avatar-wrap">
                    <div className="ln-profile-avatar-lg" style={trainee?.photo ? {
                        backgroundImage: `url(${trainee.photo})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        fontSize: 0,
                    } : {}}>{!trainee?.photo && initials}</div>
                </div>
                <h2 className="ln-profile-name">{trainee?.name}</h2>
                <p className="ln-profile-headline">TESDA Trainee &bull; Class of {trainee?.graduationYear}</p>
                <p className="ln-profile-location"><MapPin size={13} /> {trainee?.address || 'Philippines'}</p>

                <div className="ln-profile-stats">
                    <div className="ln-profile-stat" onClick={() => setActivePage('profile')}>
                        <span className="ln-profile-stat-num">{trainee?.certifications?.length || 0}</span>
                        <span className="ln-profile-stat-label">Certifications</span>
                    </div>
                    <div className="ln-profile-stat-divider" />
                    <div className="ln-profile-stat" onClick={() => setActivePage('profile')}>
                        <span className="ln-profile-stat-num">{trainee?.skills?.length || 0}</span>
                        <span className="ln-profile-stat-label">Skills</span>
                    </div>
                </div>

                <div className="ln-profile-certs">
                    {trainee?.certifications?.slice(0, 3).map((c, i) => (
                        <span key={i} className="ln-cert-tag"><Award size={12} /> {typeof c === 'string' ? c : c.name}</span>
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
            { label: 'My Applications', icon: <FileText size={16} />, page: 'applications' },
            { label: 'My Profile', icon: <User size={16} />, page: 'profile' },
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
    const trainee = currentUser || trainees[0];
    const myApps = applications.filter(a => a.traineeId === trainee?.id);
    const recJobs = getTraineeRecommendedJobs(trainee?.id).slice(0, 6);

    const handleApply = async (jobId) => {
        const result = await applyToJob(trainee?.id, jobId);
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
                        <button className="ln-feed-action-btn" onClick={() => setActivePage('profile')}>
                            <User size={16} /> My Profile
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
    const { currentUser, trainees, updateTrainee } = useApp();
    const trainee = currentUser || trainees[0];
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ ...trainee });
    const initials = trainee?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T';

    // Skills state
    const [newSkill, setNewSkill] = useState('');

    // Interests state
    const [newInterest, setNewInterest] = useState('');
    const [interestsList, setInterestsList] = useState(trainee?.interests || []);

    // Certification state
    const [certs, setCerts] = useState(trainee?.certifications?.map(c => typeof c === 'string' ? { name: c, org: '', issue: '', exp: '', credId: '', url: '' } : c) || []);
    const [savingCerts, setSavingCerts] = useState(false);

    // Education state
    const [educHistory, setEducHistory] = useState(trainee?.educHistory || []);
    const [savingEduc, setSavingEduc] = useState(false);

    // Work Experience state
    const [workExperience, setWorkExperience] = useState(trainee?.workExperience || []);
    const [savingWork, setSavingWork] = useState(false);

    // Employment state
    const [editingEmployment, setEditingEmployment] = useState(false);
    const [empForm, setEmpForm] = useState({
        employmentStatus: trainee?.employmentStatus || 'Unemployed',
        employer: trainee?.employer || '',
        jobTitle: trainee?.jobTitle || '',
        dateHired: trainee?.dateHired || '',
    });

    // Profile photo & banner state
    const profilePicRef = useRef(null);
    const bannerInputRef = useRef(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);

    // Documents state
    const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '';
    const [documents, setDocuments] = useState([]);
    const [docLabel, setDocLabel] = useState('');
    const [docFile, setDocFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const fileInputRef = useRef(null);
    const resumeInputRef = useRef(null);
    const [resume, setResume] = useState(null);
    const [uploadingResume, setUploadingResume] = useState(false);

    // ─── Photo upload handler ──────────────────────────────
    const handlePhotoUpload = async (file) => {
        if (!file || !trainee?.id) return;
        const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!allowed.includes(file.type)) { alert('Please upload PNG, JPG, or WEBP images only.'); return; }
        setUploadingPhoto(true);
        try {
            const ext = file.name.split('.').pop();
            const path = `avatars/${trainee.id}/${Date.now()}_profile.${ext}`;
            const { error: uploadErr } = await supabase.storage
                .from('registration-uploads')
                .upload(path, file, { contentType: file.type, upsert: true });
            if (uploadErr) throw uploadErr;
            const { data: urlData } = supabase.storage.from('registration-uploads').getPublicUrl(path);
            const publicUrl = urlData?.publicUrl;
            if (publicUrl) {
                await updateTrainee(trainee.id, { photo: publicUrl });
            }
        } catch (err) {
            console.error('Photo upload error:', err);
            alert('Failed to upload photo.');
        } finally {
            setUploadingPhoto(false);
        }
    };

    // ─── Banner upload handler ─────────────────────────────
    const handleBannerUpload = async (file) => {
        if (!file || !trainee?.id) return;
        const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!allowed.includes(file.type)) { alert('Please upload PNG, JPG, or WEBP images only.'); return; }
        setUploadingBanner(true);
        try {
            const ext = file.name.split('.').pop();
            const path = `banners/${trainee.id}/${Date.now()}_banner.${ext}`;
            const { error: uploadErr } = await supabase.storage
                .from('registration-uploads')
                .upload(path, file, { contentType: file.type, upsert: true });
            if (uploadErr) throw uploadErr;
            const { data: urlData } = supabase.storage.from('registration-uploads').getPublicUrl(path);
            const publicUrl = urlData?.publicUrl;
            if (publicUrl) {
                await updateTrainee(trainee.id, { bannerUrl: publicUrl });
            }
        } catch (err) {
            console.error('Banner upload error:', err);
            alert('Failed to upload banner.');
        } finally {
            setUploadingBanner(false);
        }
    };

    // ─── Dynamic Arrays Handlers ────────────────────────────
    const updateCert = (idx, field, val) => { const arr = [...certs]; arr[idx][field] = val; setCerts(arr); };
    const addCertObj = () => setCerts([...certs, { name: '', org: '', issue: '', exp: '', credId: '', url: '', noExp: false }]);
    const removeCertIdx = (idx) => { if (!confirm('Remove this certification?')) return; setCerts(certs.filter((_, i) => i !== idx)); };
    const saveCerts = async () => { setSavingCerts(true); await updateTrainee(trainee.id, { certifications: certs }); setSavingCerts(false); };

    const updateEduc = (idx, field, val) => { const arr = [...educHistory]; arr[idx][field] = val; setEducHistory(arr); };
    const addEducObj = () => setEducHistory([...educHistory, { school: '', degree: '', from: '', to: '' }]);
    const removeEducIdx = (idx) => { if (!confirm('Remove this education?')) return; setEducHistory(educHistory.filter((_, i) => i !== idx)); };
    const saveEduc = async () => { setSavingEduc(true); await updateTrainee(trainee.id, { educHistory }); setSavingEduc(false); };

    const updateWork = (idx, field, val) => { const arr = [...workExperience]; arr[idx][field] = val; setWorkExperience(arr); };
    const addWorkObj = () => setWorkExperience([...workExperience, { company: '', position: '', from: '', to: '' }]);
    const removeWorkIdx = (idx) => { if (!confirm('Remove this work experience?')) return; setWorkExperience(workExperience.filter((_, i) => i !== idx)); };
    const saveWork = async () => { setSavingWork(true); await updateTrainee(trainee.id, { workExperience }); setSavingWork(false); };

    // Fetch documents on mount
    useEffect(() => {
        if (trainee?.id) {
            fetch(`${API_BASE}/api/documents/${trainee.id}`)
                .then(r => r.json())
                .then(data => {
                    if (data.success) {
                        const resumeDoc = data.documents.find(d => d.category === 'document' && d.label === 'Resume');
                        if (resumeDoc) {
                            setResume(resumeDoc);
                        } else if (data.registrationResumeUrl) {
                            // Fallback: resume from students table
                            setResume({ file_url: data.registrationResumeUrl, file_name: 'Resume', label: 'Resume', category: 'document' });
                        }
                        setDocuments(data.documents.filter(d => d.label !== 'Resume'));
                    }
                })
                .catch(err => console.error('Fetch docs error:', err));
        }
    }, [trainee?.id]);

    const save = async () => {
        await updateTrainee(trainee.id, form);
        setEditing(false);
    };

    const saveEmployment = async () => {
        await updateTrainee(trainee.id, {
            ...empForm,
            monthsAfterGraduation: empForm.dateHired ? Math.round((new Date() - new Date(empForm.dateHired)) / (1000 * 60 * 60 * 24 * 30)) : null
        });
        setEditingEmployment(false);
    };

    const addSkill = async () => {
        if (!newSkill.trim()) return;
        const currentSkills = form.skills || [];
        if (currentSkills.includes(newSkill.trim())) { setNewSkill(''); return; }
        const updatedSkills = [...currentSkills, newSkill.trim()];
        setForm({ ...form, skills: updatedSkills });
        await updateTrainee(trainee.id, { skills: updatedSkills });
        setNewSkill('');
    };

    const removeSkill = async (skill) => {
        const updatedSkills = (form.skills || []).filter(s => s !== skill);
        setForm({ ...form, skills: updatedSkills });
        await updateTrainee(trainee.id, { skills: updatedSkills });
    };

    const addInterest = async () => {
        if (!newInterest.trim()) return;
        if (interestsList.includes(newInterest.trim())) { setNewInterest(''); return; }
        const updated = [...interestsList, newInterest.trim()];
        setInterestsList(updated);
        await updateTrainee(trainee.id, { interests: updated });
        setNewInterest('');
    };

    const removeInterest = async (interest) => {
        const updated = interestsList.filter(i => i !== interest);
        setInterestsList(updated);
        await updateTrainee(trainee.id, { interests: updated });
    };

    const handleDocUpload = async () => {
        if (!docFile || !docLabel.trim()) return;
        setUploading(true);
        try {
            const reader = new FileReader();
            reader.onload = async () => {
                const base64 = reader.result.split(',')[1];
                const res = await fetch(`${API_BASE}/api/documents/upload`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        traineeId: trainee.id,
                        label: docLabel.trim(),
                        fileName: docFile.name,
                        fileType: docFile.type,
                        fileData: base64,
                    }),
                });
                const result = await res.json();
                if (result.success) {
                    setDocuments(prev => [result.document, ...prev]);
                    setDocLabel('');
                    setDocFile(null);
                    setShowUploadForm(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                } else {
                    alert(result.error || 'Upload failed.');
                }
                setUploading(false);
            };
            reader.readAsDataURL(docFile);
        } catch (err) {
            console.error('Upload error:', err);
            alert('Failed to upload document.');
            setUploading(false);
        }
    };

    const deleteDoc = async (docId) => {
        if (!confirm('Delete this document?')) return;
        try {
            const res = await fetch(`${API_BASE}/api/documents/${docId}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
                setDocuments(prev => prev.filter(d => d.id !== docId));
            }
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const statusColors = {
        Employed: '#057642', Unemployed: '#cc1016', 'Self-Employed': '#0a66c2', Underemployed: '#b24020'
    };

    const handleResumeUpload = async (file) => {
        if (!file) return;
        const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowed.includes(file.type)) { alert('Only PDF, DOC, DOCX files allowed.'); return; }
        setUploadingResume(true);
        try {
            // Delete old resume if exists
            if (resume?.id) {
                await fetch(`${API_BASE}/api/documents/${resume.id}`, { method: 'DELETE' });
            }
            const reader = new FileReader();
            reader.onload = async () => {
                const base64 = reader.result.split(',')[1];
                const res = await fetch(`${API_BASE}/api/documents/upload`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        traineeId: trainee.id,
                        label: 'Resume',
                        fileName: file.name,
                        fileType: file.type,
                        fileData: base64,
                    }),
                });
                const result = await res.json();
                if (result.success) {
                    setResume(result.document);
                } else { alert(result.error || 'Upload failed.'); }
                setUploadingResume(false);
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error('Resume upload error:', err);
            setUploadingResume(false);
        }
    };

    return (
        <div className="ln-profile-page">
            {/* Hidden file inputs */}
            <input ref={profilePicRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { handlePhotoUpload(e.target.files[0]); e.target.value = ''; }} />
            <input ref={bannerInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { handleBannerUpload(e.target.files[0]); e.target.value = ''; }} />

            {/* Profile Header Card */}
            <div className="ln-card ln-profile-header-card">
                <div className="ln-profile-header-banner" style={trainee?.bannerUrl ? {
                    backgroundImage: `url(${trainee.bannerUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                } : {}}>
                    <button className="ln-banner-change-btn" onClick={() => bannerInputRef.current?.click()} disabled={uploadingBanner}
                        style={{
                            position: 'absolute', top: 12, right: 12,
                            background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 8,
                            color: 'white', padding: '6px 12px', fontSize: 12, fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                            transition: 'background 0.2s',
                        }}>
                        <Camera size={14} /> {uploadingBanner ? 'Uploading...' : 'Change Banner'}
                    </button>
                </div>
                <div className="ln-profile-header-body">
                    <div className="ln-profile-header-avatar" style={{
                        position: 'relative', cursor: 'pointer',
                        ...(trainee?.photo ? {
                            backgroundImage: `url(${trainee.photo})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            fontSize: 0,
                        } : {})
                    }} onClick={() => profilePicRef.current?.click()}>
                        {!trainee?.photo && initials}
                        <div style={{
                            position: 'absolute', bottom: 0, right: 0,
                            width: 28, height: 28, borderRadius: '50%',
                            background: '#0a66c2', border: '2px solid white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Camera size={13} color="white" />
                        </div>
                        {uploadingPhoto && (
                            <div style={{
                                position: 'absolute', inset: 0, borderRadius: '50%',
                                background: 'rgba(0,0,0,0.5)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Loader size={20} color="white" style={{ animation: 'ocr-spin 0.8s linear infinite' }} />
                            </div>
                        )}
                    </div>
                    <div className="ln-profile-header-info">
                        <div className="ln-profile-header-top">
                            <div>
                                <h1 className="ln-profile-header-name">{trainee?.name}</h1>
                                <p className="ln-profile-header-headline">TESDA Trainee &bull; {(trainee?.certifications?.length > 0) ? trainee.certifications.map(c => typeof c === 'string' ? c : c.name).slice(0, 2).join(', ') : 'No certifications yet'}</p>
                                <p className="ln-profile-header-loc"><MapPin size={14} /> {trainee?.address || 'Philippines'} &bull; Class of {trainee?.graduationYear}</p>
                                <p className="ln-profile-header-contact">{trainee?.email}</p>
                            </div>
                            <button className={`ln-btn ${editing ? 'ln-btn-success' : 'ln-btn-primary'}`} onClick={editing ? save : () => setEditing(true)}>
                                {editing ? <><CheckCircle size={15} /> Save Changes</> : <><Edit size={15} /> Edit Profile</>}
                            </button>
                        </div>
                        {/* Resume section — bottom right */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                            <input
                                ref={resumeInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx"
                                style={{ display: 'none' }}
                                onChange={e => { handleResumeUpload(e.target.files[0]); e.target.value = ''; }}
                            />
                            {resume ? (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '8px 14px', background: '#f0f7ff', borderRadius: 10,
                                    border: '1px solid #cce0f5', fontSize: 13
                                }}>
                                    <FileText size={16} color="#0a66c2" />
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, color: '#1e3a5f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>{resume.file_name}</div>
                                        <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)' }}>Resume / CV</div>
                                    </div>
                                    <a href={resume.file_url} target="_blank" rel="noreferrer" className="ln-btn-sm ln-btn-outline" style={{ flexShrink: 0 }}><Eye size={12} /></a>
                                    <button className="ln-btn-sm ln-btn-outline" onClick={() => resumeInputRef.current?.click()} style={{ flexShrink: 0 }} disabled={uploadingResume}>
                                        <Upload size={12} /> {uploadingResume ? '...' : 'Update'}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    className="ln-btn-sm ln-btn-outline"
                                    onClick={() => resumeInputRef.current?.click()}
                                    disabled={uploadingResume}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13 }}
                                >
                                    <Upload size={14} /> {uploadingResume ? 'Uploading...' : 'Upload Resume / CV'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="ln-profile-two-col">
                <div className="ln-profile-main">
                    {/* Personal Info */}
                    <div className="ln-card">
                        <div className="ln-section-header"><h3>Personal Information</h3></div>
                        <div className="ln-info-grid">
                            {[
                                { label: 'Full Name', key: 'name', type: 'text' },
                                { label: 'Email', key: 'email', type: 'email' },
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

                    {/* Employment Status Section */}
                    <div className="ln-card">
                        <div className="ln-section-header">
                            <h3>Employment Status</h3>
                            <button className={`ln-btn-sm ${editingEmployment ? 'ln-btn-success' : 'ln-btn-outline'}`} onClick={editingEmployment ? saveEmployment : () => setEditingEmployment(true)}>
                                {editingEmployment ? <><CheckCircle size={12} /> Save</> : <><Edit size={12} /> Edit</>}
                            </button>
                        </div>
                        <div className="ln-info-grid">
                            <div className="ln-info-item">
                                <label className="ln-info-label">Status</label>
                                {editingEmployment ? (
                                    <select className="form-select" value={empForm.employmentStatus} onChange={e => setEmpForm({ ...empForm, employmentStatus: e.target.value })}>
                                        {['Employed', 'Unemployed', 'Self-Employed', 'Underemployed'].map(s => <option key={s}>{s}</option>)}
                                    </select>
                                ) : (
                                    <span className={`ln-badge ${statusColors[trainee?.employmentStatus] === '#057642' ? 'ln-badge-green' : statusColors[trainee?.employmentStatus] === '#cc1016' ? 'ln-badge-red' : 'ln-badge-blue'}`} style={{ fontSize: 13 }}>
                                        {trainee?.employmentStatus || 'Unemployed'}
                                    </span>
                                )}
                            </div>
                            {(editingEmployment ? empForm.employmentStatus !== 'Unemployed' : trainee?.employmentStatus !== 'Unemployed') && (
                                <>
                                    <div className="ln-info-item">
                                        <label className="ln-info-label">Employer / Company</label>
                                        {editingEmployment ? <input type="text" className="form-input" value={empForm.employer} onChange={e => setEmpForm({ ...empForm, employer: e.target.value })} placeholder="Company name" /> : <div className="ln-info-value">{trainee?.employer || '—'}</div>}
                                    </div>
                                    <div className="ln-info-item">
                                        <label className="ln-info-label">Job Title</label>
                                        {editingEmployment ? <input type="text" className="form-input" value={empForm.jobTitle} onChange={e => setEmpForm({ ...empForm, jobTitle: e.target.value })} placeholder="Your position" /> : <div className="ln-info-value">{trainee?.jobTitle || '—'}</div>}
                                    </div>
                                    <div className="ln-info-item">
                                        <label className="ln-info-label">Date Hired</label>
                                        {editingEmployment ? <input type="date" className="form-input" value={empForm.dateHired} onChange={e => setEmpForm({ ...empForm, dateHired: e.target.value })} /> : <div className="ln-info-value">{trainee?.dateHired || '—'}</div>}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Educational History Section */}
                    <div className="ln-card">
                        <div className="ln-section-header">
                            <h3>Educational History *</h3>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {educHistory.length > 0 && (
                                    <button className={`ln-btn-sm ${savingEduc ? 'ln-btn-success' : 'ln-btn-outline'}`} onClick={saveEduc} disabled={savingEduc}>
                                        {savingEduc ? 'Saving...' : <><CheckCircle size={12} /> Save</>}
                                    </button>
                                )}
                                <button className="ln-btn-sm ln-btn-primary" onClick={addEducObj}>
                                    <Plus size={12} /> Add
                                </button>
                            </div>
                        </div>
                        {educHistory.map((edu, i) => (
                            <div key={i} style={{ padding: '16px', borderBottom: i < educHistory.length - 1 ? '1px solid #f3f2ef' : 'none', marginBottom: i < educHistory.length - 1 ? 12 : 0, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', margin: '0 16px 16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <h4 style={{ margin: 0, fontSize: 13, color: '#475569' }}>Education #{i + 1}</h4>
                                    <button className="ln-link-btn" style={{ color: '#cc1016', fontSize: 12, padding: 0 }} onClick={() => removeEducIdx(i)}><Trash2 size={13} /> Remove</button>
                                </div>
                                <div className="ln-info-grid" style={{ gap: 12 }}>
                                    <div className="ln-info-item" style={{ gridColumn: '1 / -1' }}>
                                        <input type="text" className="form-input" placeholder="School / University" value={edu.school || ''} onChange={e => updateEduc(i, 'school', e.target.value)} />
                                    </div>
                                    <div className="ln-info-item" style={{ gridColumn: '1 / -1' }}>
                                        <input type="text" className="form-input" placeholder="Degree / Program (e.g. BS Computer Science)" value={edu.degree || ''} onChange={e => updateEduc(i, 'degree', e.target.value)} />
                                    </div>
                                    <div className="ln-info-item">
                                        <input type="text" className="form-input" placeholder="Year From" value={edu.from || ''} onChange={e => updateEduc(i, 'from', e.target.value)} />
                                    </div>
                                    <div className="ln-info-item">
                                        <input type="text" className="form-input" placeholder="Year To (or expected)" value={edu.to || ''} onChange={e => updateEduc(i, 'to', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Work Experience Section */}
                    <div className="ln-card">
                        <div className="ln-section-header">
                            <h3>Work Experience (Optional)</h3>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {workExperience.length > 0 && (
                                    <button className={`ln-btn-sm ${savingWork ? 'ln-btn-success' : 'ln-btn-outline'}`} onClick={saveWork} disabled={savingWork}>
                                        {savingWork ? 'Saving...' : <><CheckCircle size={12} /> Save</>}
                                    </button>
                                )}
                                <button className="ln-btn-sm ln-btn-primary" onClick={addWorkObj}>
                                    <Plus size={12} /> Add
                                </button>
                            </div>
                        </div>
                        {workExperience.map((work, i) => (
                            <div key={i} style={{ padding: '16px', borderBottom: i < workExperience.length - 1 ? '1px solid #f3f2ef' : 'none', marginBottom: i < workExperience.length - 1 ? 12 : 0, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', margin: '0 16px 16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <h4 style={{ margin: 0, fontSize: 13, color: '#475569' }}>Experience #{i + 1}</h4>
                                    <button className="ln-link-btn" style={{ color: '#cc1016', fontSize: 12, padding: 0 }} onClick={() => removeWorkIdx(i)}><Trash2 size={13} /> Remove</button>
                                </div>
                                <div className="ln-info-grid" style={{ gap: 12 }}>
                                    <div className="ln-info-item" style={{ gridColumn: '1 / -1' }}>
                                        <input type="text" className="form-input" placeholder="Company / Organization" value={work.company || ''} onChange={e => updateWork(i, 'company', e.target.value)} />
                                    </div>
                                    <div className="ln-info-item" style={{ gridColumn: '1 / -1' }}>
                                        <input type="text" className="form-input" placeholder="Position / Role" value={work.position || ''} onChange={e => updateWork(i, 'position', e.target.value)} />
                                    </div>
                                    <div className="ln-info-item">
                                        <input type="date" className="form-input" title="Start Date" value={work.from || ''} onChange={e => updateWork(i, 'from', e.target.value)} />
                                        <span style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'block' }}>Start Date</span>
                                    </div>
                                    <div className="ln-info-item">
                                        <input type="date" className="form-input" title="End Date" value={work.to || ''} onChange={e => updateWork(i, 'to', e.target.value)} />
                                        <span style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'block' }}>End Date</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Certifications Section */}
                    <div className="ln-card">
                        <div className="ln-section-header">
                            <h3>Licenses & Certifications (Optional)</h3>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {certs.length > 0 && (
                                    <button className={`ln-btn-sm ${savingCerts ? 'ln-btn-success' : 'ln-btn-outline'}`} onClick={saveCerts} disabled={savingCerts}>
                                        {savingCerts ? 'Saving...' : <><CheckCircle size={12} /> Save</>}
                                    </button>
                                )}
                                <button className="ln-btn-sm ln-btn-primary" onClick={addCertObj}>
                                    <Plus size={12} /> Add
                                </button>
                            </div>
                        </div>
                        {certs.map((cert, i) => (
                            <div key={i} style={{ padding: '16px', borderBottom: i < certs.length - 1 ? '1px solid #f3f2ef' : 'none', marginBottom: i < certs.length - 1 ? 12 : 0, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', margin: '0 16px 16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <h4 style={{ margin: 0, fontSize: 13, color: '#475569' }}>License/Cert #{i + 1}</h4>
                                    <button className="ln-link-btn" style={{ color: '#cc1016', fontSize: 12, padding: 0 }} onClick={() => removeCertIdx(i)}><Trash2 size={13} /> Remove</button>
                                </div>
                                <div className="ln-info-grid" style={{ gap: 12 }}>
                                    <div className="ln-info-item" style={{ gridColumn: '1 / -1' }}>
                                        <label className="ln-info-label" style={{ marginBottom: 4 }}>Certification / License Name</label>
                                        <input type="text" className="form-input" placeholder="e.g. AWS Certified Solutions Architect" value={cert.name || ''} onChange={e => updateCert(i, 'name', e.target.value)} />
                                    </div>
                                    <div className="ln-info-item" style={{ gridColumn: '1 / -1' }}>
                                        <label className="ln-info-label" style={{ marginBottom: 4 }}>Issuing Organization</label>
                                        <input type="text" className="form-input" placeholder="e.g. Amazon Web Services, Google, PRC" value={cert.org || ''} onChange={e => updateCert(i, 'org', e.target.value)} />
                                    </div>
                                    <div className="ln-info-item">
                                        <label className="ln-info-label" style={{ marginBottom: 4 }}>Issue Date</label>
                                        <input type="date" className="form-input" value={cert.issue || ''} onChange={e => updateCert(i, 'issue', e.target.value)} />
                                    </div>
                                    <div className="ln-info-item">
                                        <label className="ln-info-label" style={{ marginBottom: 4 }}>Expiration Date</label>
                                        <input type="date" className="form-input" disabled={cert.noExp} value={cert.exp || ''} onChange={e => updateCert(i, 'exp', e.target.value)} />
                                        <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, cursor: 'pointer', color: '#64748b' }}>
                                            <input type="checkbox" checked={cert.noExp || false} onChange={e => updateCert(i, 'noExp', e.target.checked)} /> Does not expire
                                        </label>
                                    </div>
                                    <div className="ln-info-item" style={{ gridColumn: '1 / -1' }}>
                                        <label className="ln-info-label" style={{ marginBottom: 4 }}>Credential ID (optional)</label>
                                        <input type="text" className="form-input" placeholder="e.g. AWS-12345" value={cert.credId || ''} onChange={e => updateCert(i, 'credId', e.target.value)} />
                                    </div>
                                    <div className="ln-info-item" style={{ gridColumn: '1 / -1' }}>
                                        <label className="ln-info-label" style={{ marginBottom: 4 }}>Credential URL (optional)</label>
                                        <input type="url" className="form-input" placeholder="https://credly.com/badges/abc123" value={cert.url || ''} onChange={e => updateCert(i, 'url', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="ln-profile-sidebar">
                    {/* Skills Section (editable) */}
                    <div className="ln-card">
                        <div className="ln-section-header"><h3>Skills</h3></div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12, padding: '0 16px' }}>
                            {(form.skills || []).length > 0 ? (form.skills || []).map((skill, i) => (
                                <span key={i} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    padding: '6px 12px', background: '#dbeafe', color: '#1e3a5f',
                                    borderRadius: 20, fontSize: 13, fontWeight: 600
                                }}>
                                    {typeof skill === 'string' ? skill : JSON.stringify(skill)}
                                    <button onClick={() => removeSkill(skill)} style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        padding: 0, display: 'flex', color: '#64748b'
                                    }}><X size={14} /></button>
                                </span>
                            )) : <div className="ln-empty-widget" style={{ padding: 16, width: '100%' }}><p style={{ margin: 0 }}>No skills added yet</p></div>}
                        </div>
                        <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px' }}>
                            <input
                                type="text" className="form-input" placeholder="Add a skill..."
                                value={newSkill} onChange={e => setNewSkill(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') addSkill(); }}
                                style={{ flex: 1, fontSize: 13 }}
                            />
                            <button className="ln-btn-sm ln-btn-primary" onClick={addSkill} disabled={!newSkill.trim()}>
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Interests Section (editable word cloud) */}
                    <div className="ln-card">
                        <div className="ln-section-header"><h3>Interests</h3></div>
                        <div style={{
                            display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', alignItems: 'center',
                            padding: 20, margin: '0 16px 12px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', minHeight: 80
                        }}>
                            {interestsList.length > 0 ? interestsList.map((interest, i) => {
                                const sizes = [14, 17, 20, 15, 18];
                                const colors = ['#0a66c2', '#7c3aed', '#057642', '#b24020', '#1e3a5f'];
                                return (
                                    <span key={i} className="ln-interest-word" onClick={() => removeInterest(interest)} style={{
                                        display: 'inline-flex', alignItems: 'center',
                                        fontSize: sizes[i % sizes.length],
                                        fontWeight: 600 + (i % 3) * 100,
                                        color: colors[i % colors.length],
                                        padding: '4px 10px',
                                        cursor: 'pointer',
                                    }}>
                                        {interest}
                                    </span>
                                );
                            }) : <div className="ln-empty-widget" style={{ padding: 16, width: '100%' }}><p style={{ margin: 0 }}>No interests added yet</p></div>}
                        </div>
                        <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px' }}>
                            <input
                                type="text" className="form-input" placeholder="Add an interest..."
                                value={newInterest} onChange={e => setNewInterest(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') addInterest(); }}
                                style={{ flex: 1, fontSize: 13 }}
                            />
                            <button className="ln-btn-sm ln-btn-primary" onClick={addInterest} disabled={!newInterest.trim()}>
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Documents Section (real uploads) */}
                    <div className="ln-card">
                        <div className="ln-section-header">
                            <h3>Documents</h3>
                            <button className="ln-btn-sm ln-btn-primary" onClick={() => setShowUploadForm(!showUploadForm)}>
                                {showUploadForm ? <><X size={12} /> Cancel</> : <><Plus size={12} /> Add</>}
                            </button>
                        </div>

                        {showUploadForm && (
                            <div style={{ marginBottom: 16, padding: 16, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                                <div style={{ marginBottom: 10 }}>
                                    <label className="ln-info-label" style={{ marginBottom: 4, display: 'block' }}>Document Label</label>
                                    <input type="text" className="form-input" placeholder="e.g. Resume, Diploma, TOR..." value={docLabel} onChange={e => setDocLabel(e.target.value)} style={{ fontSize: 13 }} />
                                </div>
                                <div style={{ marginBottom: 10 }}>
                                    <label className="ln-info-label" style={{ marginBottom: 4, display: 'block' }}>File (PDF, DOC, DOCX only)</label>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                        onChange={e => setDocFile(e.target.files[0] || null)}
                                        style={{ fontSize: 13 }}
                                    />
                                </div>
                                <button className="ln-btn-sm ln-btn-success" onClick={handleDocUpload} disabled={uploading || !docFile || !docLabel.trim()} style={{ width: '100%' }}>
                                    {uploading ? 'Uploading...' : <><Upload size={12} /> Upload Document</>}
                                </button>
                            </div>
                        )}

                        {documents.length > 0 ? documents.map(doc => (
                            <div key={doc.id} className="ln-doc-item">
                                <div className="ln-doc-info">
                                    <FileText size={16} color="rgba(0,0,0,0.5)" />
                                    <div>
                                        <span style={{ fontWeight: 600, fontSize: 13 }}>{doc.label}</span>
                                        <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)' }}>{doc.file_name}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <a href={doc.file_url} target="_blank" rel="noreferrer" className="ln-btn-sm ln-btn-outline"><Eye size={12} /> View</a>
                                    <button className="ln-btn-sm ln-btn-outline" onClick={() => deleteDoc(doc.id)} style={{ color: '#cc1016' }}><Trash2 size={12} /></button>
                                </div>
                            </div>
                        )) : !showUploadForm && (
                            <div className="ln-empty-widget" style={{ padding: 20 }}>
                                <FileText size={28} style={{ opacity: 0.3 }} />
                                <p>No documents uploaded yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
// ─── PAGE 4: OPPORTUNITIES ───────────────────────────────────────
const Opportunities = () => {
    const { currentUser, trainees, jobPostings, applications, getTraineeRecommendedJobs, applyToJob } = useApp();
    const trainee = currentUser || trainees[0];
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

    const handleApply = async (jobId) => {
        const r = await applyToJob(trainee?.id, jobId);
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
                            <button className="ln-btn ln-btn-primary" onClick={async () => { await applyToJob(trainee?.id, selectedJob.id); setSelectedJob(null); }}>
                                <Send size={15} /> Apply Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── PAGE 5: MY APPLICATIONS ──────────────────────────────────────
const MyApplications = () => {
    const { currentUser, trainees, getTraineeApplications } = useApp();
    const trainee = currentUser || trainees[0];
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

// ─── MAIN TRAINEE DASHBOARD ─────────────────────────────────────
export default function TraineeDashboard() {
    const [activePage, setActivePage] = useState('dashboard');

    const renderPage = () => {
        switch (activePage) {
            case 'dashboard': return <TraineeDashboardHome setActivePage={setActivePage} />;
            case 'profile': return <TraineeProfile />;
            case 'recommendations': return <Opportunities />;
            case 'applications': return <MyApplications />;
            default: return <TraineeDashboardHome setActivePage={setActivePage} />;
        }
    };

    return (
        <LinkedInLayout activePage={activePage} setActivePage={setActivePage}>
            {renderPage()}
        </LinkedInLayout>
    );
}
