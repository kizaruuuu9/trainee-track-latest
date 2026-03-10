import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
    User, Briefcase, FileText, CheckCircle, Bell, ChevronDown, Search, Filter, MapPin, Clock, Building2,
    Award, Send, CheckSquare, X, Eye, Plus, Target, Menu, Home, Settings, LogOut, ThumbsUp, MessageSquare, Share2, Bookmark,
    Trash2, Camera, Loader, GraduationCap, MoveRight, ExternalLink, ShieldCheck, Mail, Calendar, AlignLeft, Users, ChevronRight, Edit
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';

/* ═══════════════════════════════════════════════════════════════════
   LINKEDIN-STYLE TRAINEE DASHBOARD
   ═══════════════════════════════════════════════════════════════ */

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
        { id: 'posting', label: 'Post', icon: <Plus size={20} /> },
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
                            className={`ln - mobile - nav - item ${activePage === item.id ? 'active' : ''} `}
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
                                className={`ln - match - fill ${job.matchRate >= 70 ? 'high' : job.matchRate >= 40 ? 'mid' : 'low'} `}
                                style={{ width: `${job.matchRate}% ` }}
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
                <div className={`progress - bar - fill ${cls} `} style={{ width: `${value}% ` }} />
            </div>
            {showLabel && <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', minWidth: 32, textAlign: 'right' }}>{value}%</span>}
        </div>
    );
};

// ─── PAGE 1: DASHBOARD HOME (LinkedIn Feed-style) ───────────────
const TraineeDashboardHome = ({ setActivePage }) => {
    const { currentUser, trainees, jobPostings, applications, getTraineeRecommendedJobs, applyToJob, posts, createPost } = useApp();
    const trainee = currentUser || trainees[0];
    const myApps = applications.filter(a => a.traineeId === trainee?.id);
    const recJobs = getTraineeRecommendedJobs(trainee?.id);

    // Modal state
    const [showPostModal, setShowPostModal] = useState(false);
    const [postContent, setPostContent] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [postType, setPostType] = useState('general');
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSelectedFile(file);
        if (file.type.startsWith('image/')) {
            setFilePreview(URL.createObjectURL(file));
        } else {
            setFilePreview(null);
        }
    };

    const handleCreatePost = async () => {
        if (!postContent.trim() && !selectedFile) return;
        setIsPosting(true);
        let media_url = null;

        try {
            if (selectedFile) {
                const ext = selectedFile.name.split('.').pop();
                const path = `post - media / ${trainee.id}/${Date.now()}_${selectedFile.name}`;
                const { error: uploadErr } = await supabase.storage
                    .from('registration-uploads')
                    .upload(path, selectedFile, { contentType: selectedFile.type });
                if (uploadErr) throw uploadErr;
                const { data: urlData } = supabase.storage.from('registration-uploads').getPublicUrl(path);
                media_url = urlData?.publicUrl;
            }

            const res = await createPost({
                content: postContent,
                post_type: postType,
                media_url: media_url,
                tags: [trainee?.program, ...(trainee?.skills || [])].filter(Boolean)
            });

            if (res.success) {
                setPostContent('');
                setPostType('general');
                setSelectedFile(null);
                setFilePreview(null);
                setShowPostModal(false);
            } else {
                alert(res.error);
            }
        } catch (err) {
            console.error('Posting error:', err);
            alert('Failed to post: ' + err.message);
        } finally {
            setIsPosting(false);
        }
    };

    // Unified Feed logic: Mix Jobs and Posts, sort by date
    const unifiedFeed = [
        ...posts.map(p => ({ ...p, feedType: 'post' })),
        ...recJobs.map(j => ({ ...j, feedType: 'job' }))
    ].sort((a, b) => new Date(b.created_at || b.datePosted) - new Date(a.created_at || a.datePosted));

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

                {/* Create Post Card (Trigger) */}
                <div className="ln-card" style={{ padding: '12px 16px', marginBottom: 16 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div className="ln-feed-avatar" style={{ flexShrink: 0 }}>
                            {trainee?.photo ? <img src={trainee.photo} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : (trainee?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T')}
                        </div>
                        <button
                            className="ln-search-input"
                            style={{
                                flex: 1, height: 40, padding: '0 16px', textAlign: 'left',
                                borderRadius: 24, border: '1px solid rgba(0,0,0,0.1)',
                                background: '#f0f2f5', cursor: 'text', color: 'rgba(0,0,0,0.5)',
                                fontSize: 15, transition: 'all 0.2s'
                            }}
                            onClick={() => setShowPostModal(true)}
                        >
                            Create Post
                        </button>
                    </div>
                </div>

                {/* Create Post Modal */}
                {showPostModal && (
                    <div className="ln-modal-overlay" style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(4px)',
                        zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
                    }}>
                        <div className="ln-card ln-modal-content" style={{
                            width: '100%', maxWidth: 500, padding: 0, borderRadius: 12,
                            boxShadow: '0 12px 28px 0 rgba(0, 0, 0, 0.2), 0 2px 4px 0 rgba(0, 0, 0, 0.1)',
                            overflow: 'hidden', animation: 'lnModalIn 0.2s ease-out'
                        }}>
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f2f5', position: 'relative', textAlign: 'center' }}>
                                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Create post</h3>
                                <button
                                    style={{
                                        position: 'absolute', right: 12, top: 12, background: '#e4e6eb',
                                        border: 'none', width: 32, height: 32, borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                                    }}
                                    onClick={() => setShowPostModal(false)}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div style={{ padding: '16px 16px' }}>
                                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                                    <div className="ln-feed-avatar" style={{ flexShrink: 0, width: 40, height: 40 }}>
                                        {trainee?.photo ? <img src={trainee.photo} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : (trainee?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T')}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 15 }}>{trainee?.name}</div>
                                        <select
                                            style={{
                                                background: '#e4e6eb', border: 'none', borderRadius: 6,
                                                padding: '2px 8px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                                marginTop: 4
                                            }}
                                            value={postType}
                                            onChange={e => setPostType(e.target.value)}
                                        >
                                            <option value="general">Public</option>
                                            <option value="achievement">Achievement</option>
                                            <option value="certification">Certification</option>
                                            <option value="project">Project</option>
                                        </select>
                                    </div>
                                </div>

                                <textarea
                                    autoFocus
                                    placeholder="What's on your mind?"
                                    style={{
                                        width: '100%', border: 'none', resize: 'none', fontSize: 18,
                                        minHeight: filePreview ? 80 : 150, padding: 0, outline: 'none', marginBottom: 20
                                    }}
                                    value={postContent}
                                    onChange={e => setPostContent(e.target.value)}
                                />

                                {filePreview && (
                                    <div style={{ position: 'relative', marginBottom: 20, borderRadius: 8, overflow: 'hidden', border: '1px solid #e4e6eb' }}>
                                        <img src={filePreview} alt="Preview" style={{ width: '100%', display: 'block' }} />
                                        <button
                                            style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer' }}
                                            onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                )}

                                {selectedFile && !filePreview && (
                                    <div style={{ marginBottom: 20, padding: '12px', background: '#f0f2f5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <FileText size={20} color="#65676b" />
                                            <span style={{ fontSize: 14, fontWeight: 500 }}>{selectedFile.name}</span>
                                        </div>
                                        <button
                                            style={{ background: 'none', border: 'none', color: '#65676b', cursor: 'pointer' }}
                                            onClick={() => setSelectedFile(null)}
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                )}

                                <div style={{
                                    border: '1px solid #e4e6eb', borderRadius: 8, padding: '12px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    marginBottom: 16
                                }}>
                                    <span style={{ fontWeight: 600, fontSize: 14 }}>Add to your post</span>
                                    <div style={{ display: 'flex', gap: 12, color: '#65676b' }}>
                                        <input
                                            type="file"
                                            hidden
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            accept="image/*,.pdf,.doc,.docx"
                                        />
                                        <Camera size={22} cursor="pointer" onClick={() => fileInputRef.current.click()} />
                                        <Plus size={22} cursor="pointer" onClick={() => fileInputRef.current.click()} />
                                    </div>
                                </div>

                                <button
                                    className="ln-btn-primary"
                                    style={{
                                        width: '100%', height: 36, borderRadius: 6, fontWeight: 600,
                                        opacity: (postContent.trim() || selectedFile) && !isPosting ? 1 : 0.5,
                                        cursor: (postContent.trim() || selectedFile) && !isPosting ? 'pointer' : 'not-allowed'
                                    }}
                                    disabled={(!postContent.trim() && !selectedFile) || isPosting}
                                    onClick={handleCreatePost}
                                >
                                    {isPosting ? 'Posting...' : 'Post'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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

                {/* Unified Feed */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {unifiedFeed.map(item => {
                        if (item.feedType === 'job') {
                            const applied = myApps.some(a => a.jobId === item.id);
                            return (
                                <div key={`job-${item.id}`} className="ln-card ln-feed-card" style={{ marginBottom: 0 }}>
                                    <div className="ln-feed-card-header">
                                        <div className="ln-feed-avatar" style={{ background: '#f0f7ff', color: '#0a66c2' }}>
                                            <Building2 size={20} />
                                        </div>
                                        <div>
                                            <div className="ln-feed-author">{item.companyName} <span style={{ fontWeight: 400, color: 'rgba(0,0,0,0.45)', marginLeft: 4 }}>posted a new {item.opportunityType}</span></div>
                                            <div className="ln-feed-meta">{item.industry} &bull; {item.location}</div>
                                        </div>
                                    </div>
                                    <div className="ln-feed-content">
                                        <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{item.title}</h4>
                                        <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.6)', marginBottom: 8 }}>{item.description.substring(0, 150)}...</p>
                                        <div className="ln-match-row">
                                            <div className="ln-match-bar" style={{ flex: 1 }}>
                                                <div className={`ln-match-fill ${item.matchRate >= 70 ? 'high' : item.matchRate >= 40 ? 'mid' : 'low'}`} style={{ width: `${item.matchRate}%` }} />
                                            </div>
                                            <span className="ln-match-pct" style={{ fontSize: 12 }}>{item.matchRate}% match</span>
                                        </div>
                                    </div>
                                    <div className="ln-feed-actions" style={{ borderTop: '1px solid #f3f3f3', padding: '8px 12px' }}>
                                        <button className="ln-feed-action-btn" onClick={() => handleApply(item.id)} disabled={applied}>
                                            {applied ? <><CheckCircle size={14} /> Applied</> : <><Send size={14} /> Apply Now</>}
                                        </button>
                                        <button className="ln-feed-action-btn" onClick={() => setActivePage('recommendations')}>
                                            <Eye size={14} /> View Details
                                        </button>
                                    </div>
                                </div>
                            );
                        } else {
                            const author = item.author_type === 'student'
                                ? trainees.find(t => t.id === item.author_id)
                                : partners.find(p => p.id === item.author_id);
                            const authorInitial = author?.name?.charAt(0) || author?.companyName?.charAt(0) || '?';

                            return (
                                <div key={`post-${item.id}`} className="ln-card ln-feed-card" style={{ marginBottom: 0 }}>
                                    <div className="ln-feed-card-header">
                                        <div className="ln-feed-avatar">
                                            {author?.photo || author?.company_logo_url ? (
                                                <img src={author.photo || author.company_logo_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                            ) : authorInitial}
                                        </div>
                                        <div>
                                            <div className="ln-feed-author" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {author?.name || author?.companyName || 'Unknown User'}
                                                {item.post_type !== 'general' && (
                                                    <span className="ln-badge ln-badge-blue" style={{ fontSize: 10, padding: '2px 8px' }}>
                                                        {item.post_type.replace('_', ' ')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="ln-feed-meta">
                                                {item.author_type === 'student' ? 'TESDA Trainee' : 'Industry Partner'} &bull; {new Date(item.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ln-feed-content">
                                        <p style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>{item.content}</p>
                                        {item.media_url && (
                                            <div style={{ marginTop: 12 }}>
                                                {item.media_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                    <img src={item.media_url} alt="Post media" style={{ width: '100%', borderRadius: 8, border: '1px solid #f3f3f3' }} />
                                                ) : (
                                                    <a
                                                        href={item.media_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                                                            background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0',
                                                            textDecoration: 'none', color: '#0a66c2', fontWeight: 600, fontSize: 13
                                                        }}
                                                    >
                                                        <FileText size={20} />
                                                        View Attached Document
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                                            {item.tags?.map(tag => (
                                                <span key={tag} style={{ color: '#0a66c2', fontSize: 12, fontWeight: 500 }}>#{tag.replace(/\s+/g, '')}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="ln-feed-actions" style={{ borderTop: '1px solid #f3f3f3', padding: '4px 12px' }}>
                                        <button className="ln-feed-action-btn"><ThumbsUp size={16} /> Like</button>
                                        <button className="ln-feed-action-btn"><MessageSquare size={16} /> Comment</button>
                                        <button className="ln-feed-action-btn"><Share2 size={16} /> Share</button>
                                    </div>
                                </div>
                            );
                        }
                    })}
                    {unifiedFeed.length === 0 && (
                        <div className="ln-empty-state"><Search size={48} /><h3>No posts yet</h3><p>Follow partners or update your profile to see relevant content.</p></div>
                    )}
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

class ErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { hasError: false, error: null }; }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    componentDidCatch(error, errorInfo) { console.error("ErrorBoundary caught:", error, errorInfo); }
    render() {
        if (this.state.hasError) {
            return <div style={{ padding: 20, color: 'red' }}><h1>Something went wrong.</h1><pre>{this.state.error.toString()}</pre></div>;
        }
        return this.props.children;
    }
}

// ─── PAGE 2: PROFILE ─────────────────────────────────────────────
const TraineeProfileContent = () => {
    const { currentUser, trainees, updateTrainee } = useApp();
    const trainee = currentUser || trainees[0];
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
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

    // Training Status state
    const [editingTraining, setEditingTraining] = useState(false);
    const [trainingForm, setTrainingForm] = useState({
        trainingStatus: trainee?.trainingStatus || 'Student',
        graduationYear: trainee?.graduationYear || '',
    });

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
            fetch(`/api/documents/${trainee.id}`)
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
        // Validate age — must be at least 15 years old
        if (form.birthday) {
            const bd = new Date(form.birthday);
            const today = new Date();
            let age = today.getFullYear() - bd.getFullYear();
            const m = today.getMonth() - bd.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
            if (age < 15) {
                alert('You must be at least 15 years old.');
                return;
            }
        }
        setSaving(true);
        try {
            // Save everything at once
            await updateTrainee(trainee.id, {
                ...form,
                trainingStatus: trainingForm.trainingStatus,
                graduationYear: trainingForm.trainingStatus === 'Graduated' ? trainingForm.graduationYear : '',
                ...empForm,
                educHistory,
                workExperience,
                certifications: certs,
            });
            setEditing(false);
        } catch (err) {
            console.error('Save error:', err);
            alert('Failed to save profile. Please try again.');
        } finally {
            setSaving(false);
        }
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
                const res = await fetch(`/api/documents/upload`, {
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
            const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
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
                await fetch(`/api/documents/${resume.id}`, { method: 'DELETE' });
            }
            const reader = new FileReader();
            reader.onload = async () => {
                const base64 = reader.result.split(',')[1];
                const res = await fetch(`/api/documents/upload`, {
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
        <div className="ln-profile-page" style={{ position: 'relative' }}>
            {/* Saving overlay */}
            {saving && (
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 50,
                    background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(2px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 12,
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <Loader size={32} color="#0a66c2" style={{ animation: 'ocr-spin 0.8s linear infinite' }} />
                        <span style={{ fontSize: 15, fontWeight: 600, color: '#1e3a5f' }}>Saving profile...</span>
                    </div>
                </div>
            )}
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
                            <button className={`ln-btn ${editing ? 'ln-btn-success' : 'ln-btn-primary'}`} onClick={editing ? save : () => setEditing(true)} disabled={saving}>
                                {saving ? <><Loader size={15} style={{ animation: 'ocr-spin 0.8s linear infinite' }} /> Saving...</> : editing ? <><CheckCircle size={15} /> Save Changes</> : <><Edit size={15} /> Edit Profile</>}
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
                                    {editing && (
                                        <button className="ln-btn-sm ln-btn-outline" onClick={() => resumeInputRef.current?.click()} style={{ flexShrink: 0 }} disabled={uploadingResume}>
                                            <Upload size={12} /> {uploadingResume ? '...' : 'Update'}
                                        </button>
                                    )}
                                </div>
                            ) : editing ? (
                                <button
                                    className="ln-btn-sm ln-btn-outline"
                                    onClick={() => resumeInputRef.current?.click()}
                                    disabled={uploadingResume}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13 }}
                                >
                                    <Upload size={14} /> {uploadingResume ? 'Uploading...' : 'Upload Resume / CV'}
                                </button>
                            ) : (
                                <div style={{ fontSize: 13, color: '#94a3b8' }}>No resume uploaded</div>
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

                    {/* Training Status Section */}
                    <div className="ln-card">
                        <div className="ln-section-header">
                            <h3>Training Status</h3>
                        </div>
                        <div className="ln-info-grid">
                            <div className="ln-info-item">
                                <label className="ln-info-label">Status</label>
                                {editing ? (
                                    <select className="form-select" value={trainingForm.trainingStatus} onChange={e => {
                                        setTrainingForm({ ...trainingForm, trainingStatus: e.target.value, graduationYear: e.target.value === 'Student' ? '' : trainingForm.graduationYear });
                                    }}>
                                        <option value="Student">Current Student</option>
                                        <option value="Graduated">Graduated</option>
                                    </select>
                                ) : (
                                    <span className={`ln-badge ${trainee?.trainingStatus === 'Graduated' ? 'ln-badge-green' : 'ln-badge-blue'}`} style={{ fontSize: 13 }}>
                                        {trainee?.trainingStatus || 'Student'}
                                    </span>
                                )}
                            </div>
                            {(editing ? trainingForm.trainingStatus === 'Graduated' : trainee?.trainingStatus === 'Graduated') && (
                                <div className="ln-info-item">
                                    <label className="ln-info-label">Graduation Year</label>
                                    {editing ? (
                                        <input type="number" min="1990" max="2030" className="form-input" value={trainingForm.graduationYear || ''} onChange={e => setTrainingForm({ ...trainingForm, graduationYear: e.target.value })} placeholder="e.g. 2024" />
                                    ) : (
                                        <div className="ln-info-value">{trainee?.graduationYear || '—'}</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Employment Status Section */}
                    <div className="ln-card">
                        <div className="ln-section-header">
                            <h3>Employment Status</h3>
                        </div>
                        <div className="ln-info-grid">
                            <div className="ln-info-item">
                                <label className="ln-info-label">Status</label>
                                {editing ? (
                                    <select className="form-select" value={empForm.employmentStatus} onChange={e => setEmpForm({ ...empForm, employmentStatus: e.target.value })}>
                                        {['Employed', 'Unemployed', 'Self-Employed', 'Underemployed'].map(s => <option key={s}>{s}</option>)}
                                    </select>
                                ) : (
                                    <span className={`ln-badge ${statusColors[trainee?.employmentStatus] === '#057642' ? 'ln-badge-green' : statusColors[trainee?.employmentStatus] === '#cc1016' ? 'ln-badge-red' : 'ln-badge-blue'}`} style={{ fontSize: 13 }}>
                                        {trainee?.employmentStatus || 'Unemployed'}
                                    </span>
                                )}
                            </div>
                            {(editing ? empForm.employmentStatus !== 'Unemployed' : trainee?.employmentStatus !== 'Unemployed') && (
                                <>
                                    <div className="ln-info-item">
                                        <label className="ln-info-label">Employer / Company</label>
                                        {editing ? <input type="text" className="form-input" value={empForm.employer} onChange={e => setEmpForm({ ...empForm, employer: e.target.value })} placeholder="Company name" /> : <div className="ln-info-value">{trainee?.employer || '—'}</div>}
                                    </div>
                                    <div className="ln-info-item">
                                        <label className="ln-info-label">Job Title</label>
                                        {editing ? <input type="text" className="form-input" value={empForm.jobTitle} onChange={e => setEmpForm({ ...empForm, jobTitle: e.target.value })} placeholder="Your position" /> : <div className="ln-info-value">{trainee?.jobTitle || '—'}</div>}
                                    </div>
                                    <div className="ln-info-item">
                                        <label className="ln-info-label">Date Hired</label>
                                        {editing ? <input type="date" className="form-input" value={empForm.dateHired} onChange={e => setEmpForm({ ...empForm, dateHired: e.target.value })} /> : <div className="ln-info-value">{trainee?.dateHired || '—'}</div>}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Educational History Section */}
                    <div className="ln-card">
                        <div className="ln-section-header">
                            <h3>Educational History</h3>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {editing && (
                                    <button className="ln-btn-sm ln-btn-primary" onClick={addEducObj}>
                                        <Plus size={12} /> Add
                                    </button>
                                )}
                            </div>
                        </div>
                        {educHistory.map((edu, i) => (
                            <div key={i} style={{ padding: '16px', borderBottom: i < educHistory.length - 1 ? '1px solid #f3f2ef' : 'none', marginBottom: i < educHistory.length - 1 ? 12 : 0, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', margin: '0 16px 16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <h4 style={{ margin: 0, fontSize: 13, color: '#475569' }}>Education #{i + 1}</h4>
                                    {editing && <button className="ln-link-btn" style={{ color: '#cc1016', fontSize: 12, padding: 0 }} onClick={() => removeEducIdx(i)}><Trash2 size={13} /> Remove</button>}
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
                            <h3>Work Experience</h3>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {editing && (
                                    <button className="ln-btn-sm ln-btn-primary" onClick={addWorkObj}>
                                        <Plus size={12} /> Add
                                    </button>
                                )}
                            </div>
                        </div>
                        {workExperience.map((work, i) => (
                            <div key={i} style={{ padding: '16px', borderBottom: i < workExperience.length - 1 ? '1px solid #f3f2ef' : 'none', marginBottom: i < workExperience.length - 1 ? 12 : 0, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', margin: '0 16px 16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <h4 style={{ margin: 0, fontSize: 13, color: '#475569' }}>Experience #{i + 1}</h4>
                                    {editing && <button className="ln-link-btn" style={{ color: '#cc1016', fontSize: 12, padding: 0 }} onClick={() => removeWorkIdx(i)}><Trash2 size={13} /> Remove</button>}
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
                            <h3>Licenses & Certifications</h3>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {editing && (
                                    <button className="ln-btn-sm ln-btn-primary" onClick={addCertObj}>
                                        <Plus size={12} /> Add
                                    </button>
                                )}
                            </div>
                        </div>
                        {certs.map((cert, i) => (
                            <div key={i} style={{ padding: '16px', borderBottom: i < certs.length - 1 ? '1px solid #f3f2ef' : 'none', marginBottom: i < certs.length - 1 ? 12 : 0, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', margin: '0 16px 16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <h4 style={{ margin: 0, fontSize: 13, color: '#475569' }}>License/Cert #{i + 1}</h4>
                                    {editing && <button className="ln-link-btn" style={{ color: '#cc1016', fontSize: 12, padding: 0 }} onClick={() => removeCertIdx(i)}><Trash2 size={13} /> Remove</button>}
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
                                    {editing && <button onClick={() => removeSkill(skill)} style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        padding: 0, display: 'flex', color: '#64748b'
                                    }}><X size={14} /></button>}
                                </span>
                            )) : <div className="ln-empty-widget" style={{ padding: 16, width: '100%' }}><p style={{ margin: 0 }}>No skills added yet</p></div>}
                        </div>
                        {editing && (
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
                        )}
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
                        {editing && (
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
                        )}
                    </div>

                    {/* Documents Section (real uploads) */}
                    <div className="ln-card">
                        <div className="ln-section-header">
                            <h3>Documents</h3>
                            {editing && (
                                <button className="ln-btn-sm ln-btn-primary" onClick={() => setShowUploadForm(!showUploadForm)}>
                                    {showUploadForm ? <><X size={12} /> Cancel</> : <><Plus size={12} /> Add</>}
                                </button>
                            )}
                        </div>

                        {editing && showUploadForm && (
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
                                    {editing && <button className="ln-btn-sm ln-btn-outline" onClick={() => deleteDoc(doc.id)} style={{ color: '#cc1016' }}><Trash2 size={12} /></button>}
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

const TraineeProfile = () => (
    <ErrorBoundary>
        <TraineeProfileContent />
    </ErrorBoundary>
);

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

// ─── PAGE 5: POSTING (Create & Manage Posts) ─────────────────────
const TraineePosting = () => {
    const { currentUser, posts, createPost } = useApp();
    const [postContent, setPostContent] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [postType, setPostType] = useState('general');
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSelectedFile(file);
        if (file.type.startsWith('image/')) {
            setFilePreview(URL.createObjectURL(file));
        } else {
            setFilePreview(null);
        }
    };

    const handleCreatePost = async () => {
        if (!postContent.trim() && !selectedFile) return;
        setIsPosting(true);
        let media_url = null;

        try {
            if (selectedFile) {
                const ext = selectedFile.name.split('.').pop();
                const path = `post-media/${currentUser.id}/${Date.now()}_${selectedFile.name}`;
                const { error: uploadErr } = await supabase.storage
                    .from('registration-uploads')
                    .upload(path, selectedFile, { contentType: selectedFile.type });
                if (uploadErr) throw uploadErr;
                const { data: urlData } = supabase.storage.from('registration-uploads').getPublicUrl(path);
                media_url = urlData?.publicUrl;
            }

            const res = await createPost({
                content: postContent,
                post_type: postType,
                media_url: media_url,
                tags: [currentUser?.program, 'Achievement', 'Shared'].filter(Boolean)
            });

            if (res.success) {
                setPostContent('');
                setPostType('general');
                setSelectedFile(null);
                setFilePreview(null);
            } else {
                alert(res.error || 'Failed to post. Check consoles.');
            }
        } catch (err) {
            console.error('Posting error:', err);
            alert('Failed to post: ' + err.message);
        } finally {
            setIsPosting(false);
        }
    };


    const myPosts = posts.filter(p => p.author_id === currentUser?.id);

    return (
        <div style={{ maxWidth: 640, margin: '0 auto', width: '100%' }}>
            {/* Create Widget */}
            <div className="ln-card" style={{ padding: '16px 20px', marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Create a Community Post</h3>
                <div style={{ display: 'flex', gap: 12 }}>
                    <div className="ln-nav-avatar" style={{ flexShrink: 0, width: 40, height: 40 }}>
                        {currentUser?.photo ? <img src={currentUser.photo} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : (currentUser?.name?.charAt(0) || 'T')}
                    </div>
                    <div style={{ flex: 1 }}>
                        <textarea
                            className="ln-search-input"
                            placeholder="What's on your mind? Share an achievement or update..."
                            style={{
                                width: '100%', minHeight: 120, padding: '16px',
                                borderRadius: 12, border: '1px solid rgba(0,0,0,0.15)',
                                resize: 'none', transition: 'all 0.2s', fontSize: 15,
                                background: '#f9fafb', marginBottom: 16
                            }}
                            value={postContent}
                            onChange={e => setPostContent(e.target.value)}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(0,0,0,0.6)' }}>POST TYPE:</label>
                                <select
                                    className="ln-filter-select"
                                    style={{ margin: 0, padding: '4px 8px', height: 36, fontSize: 13 }}
                                    value={postType}
                                    onChange={e => setPostType(e.target.value)}
                                >
                                    <option value="general">General Update</option>
                                    <option value="achievement">Achievement</option>
                                    <option value="certification">Certification</option>
                                    <option value="project">Project Share</option>
                                    <option value="looking_for_work">Looking for Work</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input
                                    type="file"
                                    hidden
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*,.pdf,.doc,.docx"
                                />
                                <button className="ln-btn-sm" style={{ padding: 8 }} title="Attach Media" onClick={() => fileInputRef.current.click()}>
                                    <Camera size={20} color="#65676b" />
                                </button>
                                <button
                                    className="ln-btn-sm ln-btn-primary"
                                    style={{ borderRadius: 24, padding: '8px 24px', fontWeight: 600 }}
                                    onClick={handleCreatePost}
                                    disabled={isPosting || (!postContent.trim() && !selectedFile)}
                                >
                                    {isPosting ? <Loader size={18} className="ln-spin" /> : 'Post Now'}
                                </button>
                            </div>
                        </div>

                        {filePreview && (
                            <div style={{ position: 'relative', marginTop: 16, borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                <img src={filePreview} alt="Preview" style={{ width: '100%', maxHeight: 300, objectFit: 'cover', display: 'block' }} />
                                <button
                                    style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer' }}
                                    onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}

                        {selectedFile && !filePreview && (
                            <div style={{ marginTop: 16, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <FileText size={18} color="#65676b" />
                                    <span style={{ fontSize: 13, fontWeight: 500 }}>{selectedFile.name}</span>
                                </div>
                                <X size={16} color="#65676b" cursor="pointer" onClick={() => setSelectedFile(null)} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* My Posts History */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="ln-section-header">
                    <h3 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Recent Activity</h3>
                    <span className="ln-badge ln-badge-gray">{myPosts.length} posts</span>
                </div>
                {myPosts.map(post => (
                    <div key={post.id} className="ln-card ln-feed-card" style={{ marginBottom: 0 }}>
                        <div className="ln-feed-card-header">
                            <div className="ln-feed-avatar">
                                {currentUser?.photo ? <img src={currentUser.photo} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : (currentUser?.name?.charAt(0) || 'T')}
                            </div>
                            <div>
                                <div className="ln-feed-author" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {currentUser?.name}
                                    <span className="ln-badge ln-badge-gray" style={{ fontSize: 10 }}>Author</span>
                                    {post.post_type !== 'general' && <span className="ln-badge ln-badge-blue" style={{ fontSize: 10 }}>{post.post_type.replace('_', ' ')}</span>}
                                </div>
                                <div className="ln-feed-meta">TESDA Trainee &bull; {new Date(post.created_at).toLocaleDateString()}</div>
                            </div>
                        </div>
                        <div className="ln-feed-content">
                            <p style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>{post.content}</p>
                            {post.media_url && (
                                <div style={{ marginTop: 12 }}>
                                    {post.media_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                        <img src={post.media_url} alt="Post media" style={{ width: '100%', borderRadius: 8, border: '1px solid #f3f3f3' }} />
                                    ) : (
                                        <a
                                            href={post.media_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                                                background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0',
                                                textDecoration: 'none', color: '#0a66c2', fontWeight: 600, fontSize: 13
                                            }}
                                        >
                                            <FileText size={20} />
                                            View Attached Document
                                        </a>
                                    )}
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                                {post.tags?.map(tag => (
                                    <span key={tag} style={{ color: '#0a66c2', fontSize: 12, fontWeight: 500 }}>#{tag.replace(/\s+/g, '')}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
                {myPosts.length === 0 && (
                    <div className="ln-empty-state" style={{ padding: 60 }}>
                        <Plus size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                        <h3 style={{ color: 'rgba(0,0,0,0.6)' }}>No posts yet</h3>
                        <p style={{ color: 'rgba(0,0,0,0.4)' }}>Share your first achievement to start building your professional feed!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── MAIN TRAINEE DASHBOARD ─────────────────────────────────────
export default function TraineeDashboard() {
    const { currentUser } = useApp();
    const navigate = useNavigate();
    const location = useLocation();

    // Deduce active page from URL for visual consistency in child components
    const path = location.pathname.split('/').pop();
    const activePage = (path === 'trainee' || !path) ? 'dashboard' : path;

    // Mock setActivePage to use navigate for smooth integration with existing buttons
    const setActivePage = (page) => {
        if (page === 'dashboard') {
            navigate('/trainee');
        } else {
            navigate(`/trainee/${page}`);
        }
    };

    if (!currentUser) return null;

    return (
        <LinkedInLayout activePage={activePage} setActivePage={setActivePage}>
            <Routes>
                <Route path="/" element={<TraineeDashboardHome setActivePage={setActivePage} />} />
                <Route path="/profile" element={<TraineeProfile />} />
                <Route path="/recommendations" element={<Opportunities />} />
                <Route path="/posting" element={<TraineePosting />} />
                <Route path="/applications" element={<MyApplications />} />
                <Route path="*" element={<Navigate to="/trainee" replace />} />
            </Routes>
        </LinkedInLayout>
    );
}
