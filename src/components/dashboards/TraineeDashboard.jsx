import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import SavedItemsView from './SavedItemsView';
import SettingsPage from './SettingsPage';
import NotificationsPage from './NotificationsPage';
import {
    User, Briefcase, FileText, CheckCircle, Bell, ChevronDown, Search, Filter, MapPin, Clock, Building2,
    Award, Send, CheckSquare, X, Eye, EyeOff, Plus, Menu, Home, Settings, LogOut, MessageSquare, Bookmark,
    Trash2, Camera, Loader, GraduationCap, MoveRight, ExternalLink, ShieldCheck, Mail, Calendar, AlignLeft, Users, ChevronRight, ChevronLeft, Edit, Upload, Link, Star, Heart, MoreVertical, Info
} from 'lucide-react';
import ProfileActivityTab from './ProfileActivityTab';
import EmptyState, {
    TrophyIllustration,
    BriefcaseIllustration,
    DocumentIllustration,
    StarIllustration,
    FolderIllustration
} from '../EmptyState';
import BrandLogo from '../common/BrandLogo';
import { supabase } from '../../lib/supabase';
import { Routes, Route, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import { CompanyProfile } from './PartnerDashboard';

/* ════════════════════════════════════════════════════════════════════
   LINKEDIN-STYLE TRAINEE DASHBOARD
   ═══════════════════════════════════════════════════════════════ */

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

const isImageAttachment = (attachmentUrl, attachmentType) => {
    const mime = String(attachmentType || '').toLowerCase();
    if (mime.startsWith('image/')) return true;
    const cleanUrl = String(attachmentUrl || '').split('?')[0].toLowerCase();
    return /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(cleanUrl);
};

const getCurrencySymbol = (currency = 'PHP') => {
    const code = String(currency || 'PHP').toUpperCase();
    const symbols = {
        PHP: '₱',
        USD: '$',
        EUR: '€',
        GBP: '£',
        JPY: '¥',
    };
    return symbols[code] || '₱';
};

const formatSalaryDisplay = (value = '') => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const digitsOnly = raw.replace(/,/g, '');
    if (/^\d+$/.test(digitsOnly)) {
        return `${getCurrencySymbol('PHP')}${Number(digitsOnly).toLocaleString('en-US')}`;
    }
    return raw;
};

const isStudentAuthorType = (authorType = '') => {
    const normalized = String(authorType || '').toLowerCase();
    return normalized === 'student' || normalized === 'trainee';
};

const normalizeProfileType = (profileType = '') => {
    const normalized = String(profileType || '').toLowerCase();
    if (normalized === 'student' || normalized === 'trainee') return 'trainee';
    if (normalized === 'industry_partner' || normalized === 'partner') return 'partner';
    return '';
};

const toProfileAuthorType = (authorType = '') => (isStudentAuthorType(authorType) ? 'trainee' : 'partner');
const toRecipientAuthorType = (authorType = '') => (isStudentAuthorType(authorType) ? 'student' : 'industry_partner');
const DEFAULT_TRAINEE_PUBLIC_INFO_FIELDS = ['name', 'birthday', 'gender', 'program'];
const resolveTraineeVisibility = (profile) => {
    const value = profile?.personalInfoVisibility ?? profile?.personal_info_visibility;
    return Array.isArray(value) ? value : DEFAULT_TRAINEE_PUBLIC_INFO_FIELDS;
};

const normalizeTraineeProfile = (profile) => {
    if (!profile) return null;

    const address = profile.address
        || [profile.detailed_address, profile.barangay, profile.city, profile.province, profile.region].filter(Boolean).join(', ')
        || '';

    const rawEmploymentStatus = String(profile.employmentStatus || profile.employment_status || '').toLowerCase();
    const employmentStatus = profile.employmentStatus
        || (rawEmploymentStatus === 'employed' || rawEmploymentStatus === 'hired'
            ? 'Employed'
            : rawEmploymentStatus === 'seeking_employment' || rawEmploymentStatus === 'open_to_work' || rawEmploymentStatus === 'not_employed' || rawEmploymentStatus === 'unemployed'
                ? 'Seeking Employment'
                : rawEmploymentStatus === 'certified'
                    ? 'Certified'
                    : rawEmploymentStatus === 'seeking_ojt'
                        ? 'Seeking OJT'
                        : rawEmploymentStatus === 'ojt_in_progress'
                            ? 'OJT In Progress'
                            : 'Seeking Employment');

    return {
        ...profile,
        name: profile.name || profile.full_name || profile.profile_name || 'Trainee',
        program: profile.program || profile.program_name || profile.programs?.name || '',
        ncLevel: profile.ncLevel || profile.nc_level || profile.programs?.nc_level || '',
        email: profile.email || profile.contact_email || '',
        address,
        birthday: profile.birthday || profile.birthdate || '',
        graduationYear: profile.graduationYear || profile.graduation_year || '',
        trainingStatus: profile.trainingStatus || profile.training_status || 'Student',
        trainings: Array.isArray(profile.trainings) ? profile.trainings : [],
        savedOpportunities: Array.isArray(profile.savedOpportunities) ? profile.savedOpportunities : [],
        certifications: Array.isArray(profile.certifications) ? profile.certifications : [],
        educHistory: Array.isArray(profile.educHistory) ? profile.educHistory : (Array.isArray(profile.educ_history) ? profile.educ_history : []),
        workExperience: Array.isArray(profile.workExperience) ? profile.workExperience : (Array.isArray(profile.work_experience) ? profile.work_experience : []),
        skills: Array.isArray(profile.skills) ? profile.skills : [],
        interests: Array.isArray(profile.interests) ? profile.interests : [],
        employmentStatus,
        employer: profile.employer || profile.employment_work || '',
        jobTitle: profile.jobTitle || profile.job_title || '',
        dateHired: profile.dateHired || profile.employment_start || '',
        photo: profile.photo || profile.profile_picture_url || null,
        bannerUrl: profile.bannerUrl || profile.banner_url || null,
        gender: (function () {
            const g = String(profile.gender || '').toLowerCase();
            if (g.startsWith('m')) return 'Male';
            if (g.startsWith('f')) return 'Female';
            if (g.trim()) return 'Other';
            return '';
        })(),
        personalInfoVisibility: resolveTraineeVisibility(profile),
    };
};


const BULLETIN_TYPES = ['training_batch', 'exam_schedule', 'certification_assessment', 'announcement'];
const BULLETIN_CONFIG = {
    training_batch: { label: 'Training Batch', color: '#7c3aed', bg: '#ede9fe', emoji: '📚', traineeLabel: 'Apply', type: 'apply' },
    exam_schedule: { label: 'Exam Schedule', color: '#0ea5e9', bg: '#e0f2fe', emoji: '📝', traineeLabel: 'Register', type: 'register' },
    certification_assessment: { label: 'Certification Assessment', color: '#16a34a', bg: '#dcfce7', emoji: '🏆', traineeLabel: 'Register', type: 'register' },
    announcement: { label: 'Announcement', color: '#d97706', bg: '#fef3c7', emoji: '📢', traineeLabel: 'Inquire', type: 'inquire' },
};

// ─── TOP NAVIGATION BAR (LinkedIn-style) ─────────────────────────
const LinkedInTopNav = ({ activePage, setActivePage }) => {
    const { currentUser, logout, notifications, markNotificationRead } = useApp();
    const unreadCount = notifications?.filter(n => !n.read).length || 0;
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotif, setShowNotif] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const initials = (currentUser?.name || '').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T';

    const navItems = [
        { id: 'dashboard', label: 'Home', icon: <Home size={20} /> },
        { id: 'profile', label: 'Profile', icon: <User size={20} /> },
        { id: 'recommendations', label: 'Opportunities', icon: <Briefcase size={20} /> },
        { id: 'applications', label: 'My Applications', icon: <FileText size={20} /> },
    ];

    return (
        <header className="ln-topnav">
            <div className="ln-topnav-inner">
                {/* Left: Logo + Search */}
                <div className="ln-topnav-left">
                    <div className="ln-logo">
                        <BrandLogo size={32} fallbackClassName="ln-logo-icon" />
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
                            {unreadCount > 0 && (
                                <span className="ln-notif-dot" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold', background: '#dc2626', color: 'white', width: 16, height: 16, borderRadius: '50%', position: 'absolute', top: 2, right: 10 }}>
                                    {unreadCount}
                                </span>
                            )}
                            <span className="ln-nav-label">Alerts</span>
                        </button>
                        {showNotif && (
                            <div className="ln-dropdown" style={{ right: 0, minWidth: 320, padding: 0, overflow: 'hidden' }}>
                                <div className="ln-dropdown-header" style={{ padding: '12px 16px', borderBottom: '1px solid #e4e6eb', fontWeight: 600 }}>
                                    Notifications
                                </div>
                                {(!notifications || notifications.length === 0) ? (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#65676b', fontSize: 13 }}>No notifications</div>
                                ) : (
                                    notifications.slice(0, 4).map((n) => (
                                        <div
                                            key={n.id}
                                            className="ln-dropdown-item hover:bg-slate-50"
                                            style={{ background: n.read ? 'transparent' : '#f0f7ff', borderBottom: '1px solid #f3f3f3', alignItems: 'flex-start', padding: '12px 16px', cursor: 'pointer' }}
                                            onClick={() => { markNotificationRead(n.id); setActivePage('notifications'); setShowNotif(false); }}
                                        >
                                            <div className="ln-notif-avatar" style={{ background: '#fff', border: '1px solid #e4e6eb', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%' }}>
                                                <Bell size={16} color="#0a66c2" />
                                            </div>
                                            <div style={{ flex: 1, marginLeft: 12 }}>
                                                <div className="ln-notif-text" style={{ fontWeight: n.read ? 400 : 600, color: '#1c1e21', fontSize: 13, lineHeight: 1.4, whiteSpace: 'normal' }}>{n.text}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div
                                    className="ln-dropdown-footer hover:bg-slate-50"
                                    style={{ textAlign: 'center', padding: '12px', borderTop: '1px solid #e4e6eb', color: '#0a66c2', fontWeight: 600, cursor: 'pointer' }}
                                    onClick={() => { setActivePage('notifications'); setShowNotif(false); }}
                                >
                                    View all notifications
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="ln-topnav-divider" />

                    <div style={{ position: 'relative' }}>
                        <button className="ln-nav-item ln-profile-trigger" onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotif(false); }}>
                            <div className="ln-nav-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {currentUser?.photo ? (
                                    <img src={currentUser.photo} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : initials}
                            </div>
                            <span className="ln-nav-label">
                                Me <ChevronDown size={12} style={{ marginLeft: 2 }} />
                            </span>
                        </button>
                        {showProfileMenu && (
                            <div className="ln-dropdown" style={{ right: 0, minWidth: 260 }}>
                                <div className="ln-dropdown-profile">
                                    <div className="ln-dropdown-profile-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {currentUser?.photo ? (
                                            <img src={currentUser.photo} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : initials}
                                    </div>
                                    <div>
                                        <div className="ln-dropdown-profile-name">{currentUser?.name || 'Trainee'}</div>
                                        <div className="ln-dropdown-profile-role">TESDA Trainee</div>
                                    </div>
                                </div>
                                <button className="ln-dropdown-profile-btn" onClick={() => { setActivePage('profile'); setShowProfileMenu(false); }}>
                                    View Profile
                                </button>
                                <div className="ln-dropdown-divider" />
                                <div className="ln-dropdown-item" onClick={() => { setActivePage('settings'); setShowProfileMenu(false); }}>
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
    const initials = (trainee?.name || '').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T';
    const visiblePersonalInfo = new Set(resolveTraineeVisibility(trainee));
    const showSideAddress = visiblePersonalInfo.has('address');
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
                {showSideAddress && trainee?.address && (
                    <p className="ln-profile-location"><MapPin size={13} /> {trainee.address}</p>
                )}

                <div className="ln-profile-stats">
                    <div className="ln-profile-stat" onClick={() => setActivePage('profile')}>
                        <span className="ln-profile-stat-num">{(trainee?.trainings || []).filter(t => t.status === 'Graduated').length}</span>
                        <span className="ln-profile-stat-label">Certifications</span>
                    </div>
                    <div className="ln-profile-stat-divider" />
                    <div className="ln-profile-stat" onClick={() => setActivePage('profile')}>
                        <span className="ln-profile-stat-num">{trainee?.skills?.length || 0}</span>
                        <span className="ln-profile-stat-label">Skills</span>
                    </div>
                </div>

                <div className="ln-profile-certs">
                    {(trainee?.trainings || []).filter(t => t.status === 'Graduated').slice(0, 3).map((t, i) => (
                        <span key={i} className="ln-cert-tag">
                            {t.certUrl ? <ShieldCheck size={12} /> : <Award size={12} />}
                            {' '}{t.program}
                        </span>
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
const SuggestedOpportunities = ({ recJobs, setActivePage, onViewProfile }) => (
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
                    <div className="ln-suggested-company">
                        <button
                            type="button"
                            onClick={() => onViewProfile && onViewProfile({ id: job.partnerId, type: 'partner' })}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', font: 'inherit', textAlign: 'left' }}
                        >
                            {job.companyName}
                        </button>
                    </div>
                    <div className="ln-suggested-meta">
                        <MapPin size={11} /> {job.location} &bull; {job.opportunityType}
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
    const {
        currentUser, trainees, applications, getTraineeRecommendedJobs,
        posts, jobPostings, createPost, updatePost, deletePost, partners,
        addPostComment, getPostComments, addJobPostingComment,
        getJobPostingComments, updateJobPostingComment,
        deleteJobPostingComment, sendContactRequest, applyToJob,
        updateTrainee, createPostInteraction, getUserPostInteraction,
        fetchPostInteractions, postInteractions
    } = useApp();
    const navigate = useNavigate();
    const trainee = currentUser || trainees[0];
    const myApps = applications.filter(a => a.traineeId === trainee?.id);
    const myAppJobIds = myApps.map(a => a.jobId);
    const recJobs = getTraineeRecommendedJobs(trainee?.id);

    // Edit/Delete post state
    const [editingPostId, setEditingPostId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [postMenuId, setPostMenuId] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [confirmSaveId, setConfirmSaveId] = useState(null);

    // Modal state
    const [showPostModal, setShowPostModal] = useState(false);
    const [postContent, setPostContent] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [postType, setPostType] = useState('general');
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [commentModalPost, setCommentModalPost] = useState(null);
    const [commentInput, setCommentInput] = useState('');
    const [commentSubmitting, setCommentSubmitting] = useState(false);
    const [contactTarget, setContactTarget] = useState(null);
    const [contactMessage, setContactMessage] = useState('');
    const [contactAttachment, setContactAttachment] = useState(null);
    const [contactSubmitting, setContactSubmitting] = useState(false);

    // Apply modal state (replicates Opportunities page logic)
    const [feedApplyJob, setFeedApplyJob] = useState(null);
    const [feedApplicationMessage, setFeedApplicationMessage] = useState('');
    const [feedResumeInfo, setFeedResumeInfo] = useState(null);
    const [feedSubmittingApp, setFeedSubmittingApp] = useState(false);

    const unifiedFeed = useMemo(() => {
        return [
            ...posts.map(p => ({
                ...p,
                feedType: (BULLETIN_TYPES.includes(p.post_type) && p.author_type !== 'industry_partner') ? 'bulletin' : 'post'
            })),
            ...jobPostings.map(j => ({ ...j, feedType: 'job' }))
        ].sort((a, b) => new Date(b.created_at || b.createdAt || b.datePosted) - new Date(a.created_at || a.createdAt || a.datePosted));
    }, [posts, jobPostings]);

    // ── Bulletin interaction state (local to this component) ──
    const [bulletinModal, setBulletinModal] = useState(null);
    const [bulletinMessage, setBulletinMessage] = useState('');
    const [bulletinSubmitting, setBulletinSubmitting] = useState(false);
    const [bulletinToast, setBulletinToast] = useState('');

    const showBulletinToast = (msg) => { setBulletinToast(msg); setTimeout(() => setBulletinToast(''), 3000); };

    const openBulletinModal = (post, type) => {
        setBulletinModal({ post, type });
        setBulletinMessage('');
    };

    const handleBulletinInteraction = async () => {
        if (!bulletinModal) return;
        setBulletinSubmitting(true);
        const details = { message: bulletinMessage, applied_at: new Date().toISOString() };
        const res = await createPostInteraction(bulletinModal.post.id, bulletinModal.type, details);
        setBulletinSubmitting(false);
        if (res.success) {
            setBulletinModal(null);
            showBulletinToast(
                bulletinModal.type === 'apply' ? 'Application submitted!' :
                    bulletinModal.type === 'register' ? 'Registered successfully!' :
                        'Inquiry sent!'
            );
            fetchPostInteractions();
        } else {
            alert(res.error || 'Failed to submit.');
        }
    };

    const [jobMediaModal, setJobMediaModal] = useState(null);
    const [jobMediaCommentsOnly, setJobMediaCommentsOnly] = useState(false);
    const [jobMediaCommentInput, setJobMediaCommentInput] = useState('');
    const [editingJobMediaCommentId, setEditingJobMediaCommentId] = useState(null);
    const [jobMediaEditInput, setJobMediaEditInput] = useState('');
    const [jobMediaCommentSaving, setJobMediaCommentSaving] = useState(false);

    useEffect(() => {
        fetchPostInteractions();
    }, []);
    const [jobMediaCommentMenuId, setJobMediaCommentMenuId] = useState(null);
    const [isCompactCommentViewport, setIsCompactCommentViewport] = useState(() => (
        typeof window !== 'undefined' ? window.innerWidth <= 1024 : false
    ));
    const fileInputRef = useRef(null);
    const contactFileInputRef = useRef(null);
    const jobMediaCommentInputRef = useRef(null);
    const openProfile = (target) => {
        if (!target?.id || !target?.type) return;
        const profileType = normalizeProfileType(target.type);
        if (!profileType) return;
        navigate(`/trainee/profile-view/${profileType}/${target.id}`);
    };


    const closeJobMediaModal = () => {
        setJobMediaModal(null);
        setJobMediaCommentsOnly(false);
        setJobMediaCommentInput('');
        setEditingJobMediaCommentId(null);
        setJobMediaEditInput('');
        setJobMediaCommentMenuId(null);
    };

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const handleResize = () => {
            setIsCompactCommentViewport(window.innerWidth <= 1024);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const activeFeedModal = jobMediaModal || commentModalPost;
        if (!activeFeedModal || typeof window === 'undefined' || typeof document === 'undefined') return undefined;

        const scrollY = window.scrollY;
        const originalBodyOverflow = document.body.style.overflow;
        const originalBodyPosition = document.body.style.position;
        const originalBodyTop = document.body.style.top;
        const originalBodyWidth = document.body.style.width;
        const originalHtmlOverflow = document.documentElement.style.overflow;

        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        document.documentElement.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = originalBodyOverflow;
            document.body.style.position = originalBodyPosition;
            document.body.style.top = originalBodyTop;
            document.body.style.width = originalBodyWidth;
            document.documentElement.style.overflow = originalHtmlOverflow;
            window.scrollTo(0, scrollY);
        };
    }, [jobMediaModal, commentModalPost]);

    const submitJobMediaComment = async () => {
        if (!jobMediaModal) return;
        const trimmed = jobMediaCommentInput.trim();
        if (!trimmed) return;

        const result = await addJobPostingComment(jobMediaModal.id, trimmed);
        if (!result.success) {
            alert(result.error || 'Failed to add comment.');
            return;
        }

        setJobMediaCommentInput('');
    };

    const startEditingJobMediaComment = (comment) => {
        if (!comment || comment.author_id !== currentUser?.id) return;
        setEditingJobMediaCommentId(comment.id);
        setJobMediaEditInput(comment.content || '');
    };

    const cancelEditingJobMediaComment = () => {
        setEditingJobMediaCommentId(null);
        setJobMediaEditInput('');
    };

    const saveEditedJobMediaComment = async () => {
        if (!editingJobMediaCommentId) return;
        const trimmed = jobMediaEditInput.trim();
        if (!trimmed) {
            alert('Comment cannot be empty.');
            return;
        }

        setJobMediaCommentSaving(true);
        const result = await updateJobPostingComment(editingJobMediaCommentId, trimmed);
        setJobMediaCommentSaving(false);
        if (!result.success) {
            alert(result.error || 'Failed to update comment.');
            return;
        }

        setEditingJobMediaCommentId(null);
        setJobMediaEditInput('');
    };

    const handleDeleteJobMediaComment = async (commentId) => {
        if (!commentId) return;
        const confirmed = window.confirm('Delete this comment?');
        if (!confirmed) return;

        const result = await deleteJobPostingComment(commentId);
        if (!result.success) {
            alert(result.error || 'Failed to delete comment.');
            return;
        }

        if (editingJobMediaCommentId === commentId) {
            setEditingJobMediaCommentId(null);
            setJobMediaEditInput('');
        }
    };

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
                const path = `post-media/${trainee.id}/${Date.now()}_${selectedFile.name}`;
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
                tags: []
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

    const formatBulletinDate = (dateStr) => {
        if (!dateStr) return '';
        if (dateStr.includes('–') || (dateStr.includes('-') && dateStr.split('-').length !== 3)) return dateStr;
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const handleApply = () => {
        setActivePage('recommendations');
    };

    // ── Feed Apply Modal logic ──
    const feedLoadResumeInfo = async () => {
        if (!trainee?.id) return;
        // setFeedLoadingResume(true); // Removed unused state setter
        setFeedResumeInfo(null);
        let resolvedResume = null;
        const isSupabaseUser = typeof trainee.id === 'string' && trainee.id.includes('-');
        if (isSupabaseUser) {
            try {
                const { data, error } = await supabase
                    .from('student_documents')
                    .select('file_url, file_name, label, uploaded_at')
                    .eq('student_id', trainee.id)
                    .ilike('label', '%resume%')
                    .order('uploaded_at', { ascending: false })
                    .limit(1);
                if (!error && data?.length) {
                    resolvedResume = { file_url: data[0].file_url, file_name: data[0].file_name || 'Resume' };
                }
            } catch (err) { console.warn('Resume fetch exception:', err); }
        }
        if (!resolvedResume && (trainee?.resumeUrl || trainee?.registrationResumeUrl)) {
            resolvedResume = { file_url: trainee.resumeUrl || trainee.registrationResumeUrl, file_name: 'Resume' };
        }
        setFeedResumeInfo(resolvedResume);
        // setFeedLoadingResume(false); // Removed unused state setter
    };

    const feedOpenApplyModal = async (job) => {
        setFeedApplyJob(job);
        setFeedApplicationMessage('');
        await feedLoadResumeInfo();
    };

    const feedHandleSubmitApplication = async () => {
        if (!feedApplyJob) return;
        setFeedSubmittingApp(true);
        const r = await applyToJob(trainee?.id, feedApplyJob.id, {
            applicationMessage: feedApplicationMessage,
            resumeUrl: feedResumeInfo?.file_url,
            resumeFileName: feedResumeInfo?.file_name || 'Resume',
        });
        setFeedSubmittingApp(false);
        if (!r.success) {
            alert(r.error || 'Failed to submit application.');
            return;
        }
        setFeedApplyJob(null);
        setFeedApplicationMessage('');
    };

    // ── Bookmark (Save/Unsave) toggle ──
    const toggleBookmark = async (jobId) => {
        if (!trainee?.id) return;
        const current = Array.isArray(trainee.savedOpportunities) ? trainee.savedOpportunities : [];
        const isSaved = current.includes(jobId);
        const updated = isSaved ? current.filter(id => id !== jobId) : [...current, jobId];
        await updateTrainee(trainee.id, { savedOpportunities: updated });
    };

    const openContactModal = (target) => {
        if (!target || target.recipientId === currentUser?.id) return;
        setContactTarget(target);
        setContactMessage('');
        setContactAttachment(null);
        if (contactFileInputRef.current) contactFileInputRef.current.value = '';
    };

    const closeContactModal = () => {
        setContactTarget(null);
        setContactMessage('');
        setContactAttachment(null);
        if (contactFileInputRef.current) contactFileInputRef.current.value = '';
    };

    const handleContactAttachmentChange = (event) => {
        const file = event.target.files?.[0] || null;
        setContactAttachment(file);
    };

    const handleSubmitContact = async () => {
        if (!contactTarget) return;

        const trimmed = contactMessage.trim();
        const requiresResume = contactTarget.recipientType === 'industry_partner';

        if (!trimmed) {
            alert('Message is required.');
            return;
        }

        if (requiresResume && !contactAttachment) {
            alert('Resume upload is required when contacting a partner.');
            return;
        }

        setContactSubmitting(true);

        let attachmentUrl = null;
        let attachmentName = null;

        try {
            if (contactAttachment) {
                const path = `contact-files/${trainee.id}/${Date.now()}_${contactAttachment.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('registration-uploads')
                    .upload(path, contactAttachment, { contentType: contactAttachment.type, upsert: true });

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage.from('registration-uploads').getPublicUrl(path);
                attachmentUrl = urlData?.publicUrl || null;
                attachmentName = contactAttachment.name;
            }

            const result = await sendContactRequest({
                recipientId: contactTarget.recipientId,
                recipientType: contactTarget.recipientType,
                postId: contactTarget.postId || null,
                jobPostingId: contactTarget.jobPostingId || null,
                message: trimmed,
                attachmentName,
                attachmentUrl,
                attachmentKind: requiresResume ? 'resume' : 'document',
            });

            if (!result.success) {
                alert(result.error || 'Failed to send contact request.');
                return;
            }

            closeContactModal();
            alert('Contact request sent.');
        } catch (err) {
            console.error('Contact submit error:', err);
            alert(err.message || 'Failed to send contact request.');
        } finally {
            setContactSubmitting(false);
        }
    };

    const handleCommentOnPost = (post) => {
        setCommentModalPost(post);
        setCommentInput('');
    };

    const handleSubmitComment = async () => {
        if (!commentModalPost) return;
        const trimmed = commentInput.trim();
        if (!trimmed) return;

        setCommentSubmitting(true);
        const result = await addPostComment(commentModalPost.id, trimmed);
        setCommentSubmitting(false);

        if (!result.success) {
            alert(result.error || 'Failed to add comment.');
            return;
        }

        setCommentInput('');
    };

    const handleEditPost = (post) => {
        setEditingPostId(post.id);
        setEditContent(post.content);
        setPostMenuId(null);
    };

    const handleSaveEdit = async (postId) => {
        if (!editContent.trim()) return;
        const res = await updatePost(postId, { content: editContent });
        if (res.success) {
            setEditingPostId(null);
            setEditContent('');
            setConfirmSaveId(null);
        } else {
            alert(res.error || 'Failed to update post');
            setConfirmSaveId(null);
        }
    };

    const handleDeletePost = async (postId) => {
        const res = await deletePost(postId);
        if (res.success) {
            setConfirmDeleteId(null);
        } else {
            alert(res.error || 'Failed to delete post');
        }
    };

    const stats = [
        { label: 'Job Applications', value: myApps.length, icon: <Send size={20} />, color: '#057642' },
        { label: 'Active Interviews', value: myApps.filter(a => String(a.status).toLowerCase() === 'interview scheduled').length, icon: <Calendar size={20} />, color: '#7c3aed' },
        { label: 'Offers Received', value: myApps.filter(a => ['accepted', 'offered'].includes(String(a.status).toLowerCase())).length, icon: <Award size={20} />, color: '#0a66c2' },
        { label: 'Saved for Later', value: (trainee?.savedOpportunities?.length || 0) + postInteractions.filter(i => i.user_id === currentUser?.id && i.interaction_type === 'save').length, icon: <Bookmark size={20} />, color: '#d97706' },
    ];

    const modalComments = commentModalPost ? getPostComments(commentModalPost.id) : [];
    const modalAuthor = commentModalPost
        ? (commentModalPost.author_id === currentUser?.id
            ? currentUser
            : isStudentAuthorType(commentModalPost.author_type)
                ? trainees.find(t => t.id === commentModalPost.author_id)
                : partners.find(p => p.id === commentModalPost.author_id))
        : null;
    const modalAuthorName = modalAuthor?.name || modalAuthor?.profileName || modalAuthor?.companyName || 'Community User';
    const canContactModalAuthor = Boolean(commentModalPost && commentModalPost.author_id !== currentUser?.id);
    const contactRequiresResume = contactTarget?.recipientType === 'industry_partner';
    const contactRecipientName = contactTarget?.recipientName || 'Recipient';
    const jobMediaComments = jobMediaModal ? getJobPostingComments(jobMediaModal.id) : [];
    const useCommentsOnlyJobModal = isCompactCommentViewport && jobMediaCommentsOnly;
    const useCompactPostCommentModal = isCompactCommentViewport;

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
                                    <button
                                        type="button"
                                        className="ln-feed-avatar"
                                        onClick={() => openProfile({ id: trainee?.id || currentUser?.id, type: 'trainee' })}
                                        style={{ flexShrink: 0, width: 40, height: 40, border: 'none', cursor: (trainee?.id || currentUser?.id) ? 'pointer' : 'default' }}
                                        disabled={!(trainee?.id || currentUser?.id)}
                                    >
                                        {trainee?.photo ? <img src={trainee.photo} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : ((trainee?.name || '').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T')}
                                    </button>
                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => openProfile({ id: trainee?.id || currentUser?.id, type: 'trainee' })}
                                            style={{ fontWeight: 600, fontSize: 15, background: 'none', border: 'none', padding: 0, cursor: (trainee?.id || currentUser?.id) ? 'pointer' : 'default', color: 'inherit' }}
                                            disabled={!(trainee?.id || currentUser?.id)}
                                        >
                                            {trainee?.name}
                                        </button>
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

                {/* Unified Feed */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {unifiedFeed.map(item => {
                        if (item.feedType === 'bulletin') {
                            const cfg = BULLETIN_CONFIG[item.post_type] || BULLETIN_CONFIG.announcement;
                            const alreadyInteracted = getUserPostInteraction(item.id, cfg.type);
                            const statusColors = { Open: { bg: '#dcfce7', color: '#16a34a' }, Full: { bg: '#fef3c7', color: '#d97706' }, Closed: { bg: '#fee2e2', color: '#dc2626' } };
                            const sc = statusColors[item.status] || statusColors.Open;
                            const reqs = Array.isArray(item.requirements) ? item.requirements : [];
                            return (
                                <div key={`bulletin-${item.id}`} className="ln-card ln-feed-card" style={{ marginBottom: 0, borderLeft: `4px solid ${cfg.color}` }}>
                                    {/* Header */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px 10px' }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{cfg.emoji}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontWeight: 700, fontSize: 13, color: cfg.color }}>{cfg.label}</span>
                                                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.color }}>{item.status || 'Open'}</span>
                                            </div>
                                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                                                {(function () {
                                                    const authorId = String(item.author_id || '');
                                                    const ADMIN_ID = 'de305d54-75b4-431b-adb2-eb6b9e546014';

                                                    if (item.author_type === 'admin' || authorId === ADMIN_ID) return 'PSTDII Admin';

                                                    if (item.author_type === 'industry_partner' || item.author_type === 'partner') {
                                                        const p = partners.find(p => String(p.id) === authorId);
                                                        return p ? (p.companyName || p.profileName) : 'Industry Partner';
                                                    }

                                                    if (item.author_type === 'student' || item.author_type === 'trainee') {
                                                        const t = trainees.find(t => String(t.id) === authorId);
                                                        // If it's a generic 'Trainee' record or not found, it's likely an admin post saved as student
                                                        if (!t || t.name === 'Trainee' || t.profileName === 'Trainee') return 'PSTDII Admin';
                                                        return t.name || t.profileName;
                                                    }

                                                    return 'PSTDII Admin';
                                                })()} • {timeAgo(item.created_at)}
                                            </div>
                                        </div>
                                        {item.author_id === currentUser?.id && (
                                            <div style={{ position: 'relative' }}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPostMenuId(postMenuId === item.id ? null : item.id);
                                                    }}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: '50%', color: '#65676b' }}
                                                    title="More options"
                                                >
                                                    <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2, lineHeight: 1 }}>···</span>
                                                </button>
                                                {postMenuId === item.id && (
                                                    <div style={{
                                                        position: 'absolute', right: 0, top: 32, background: '#fff',
                                                        borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                                                        border: '1px solid #e4e6eb', zIndex: 10, minWidth: 170, overflow: 'hidden'
                                                    }} onClick={e => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => {
                                                                setEditingPostId(item.id);
                                                                setEditContent(item.content);
                                                                setPostMenuId(null);
                                                            }}
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                                                                padding: '10px 16px', border: 'none', background: 'none',
                                                                cursor: 'pointer', fontSize: 14, color: '#1c1e21', textAlign: 'left'
                                                            }}
                                                            onMouseEnter={e => e.target.style.background = '#f2f3f5'}
                                                            onMouseLeave={e => e.target.style.background = 'none'}
                                                        >
                                                            <Edit size={16} /> Edit post
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm('Delete this post?')) {
                                                                    deletePost(item.id);
                                                                }
                                                                setPostMenuId(null);
                                                            }}
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                                                                padding: '10px 16px', border: 'none', background: 'none',
                                                                cursor: 'pointer', fontSize: 14, color: '#dc3545', textAlign: 'left'
                                                            }}
                                                            onMouseEnter={e => e.target.style.background = '#f2f3f5'}
                                                            onMouseLeave={e => e.target.style.background = 'none'}
                                                        >
                                                            <Trash2 size={16} /> Delete post
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {/* Body */}
                                    <div style={{ padding: '0 16px 12px' }}>
                                        <h4 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>{item.title}</h4>
                                        <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6 }}>{item.content}</p>
                                        {/* Details grid */}
                                        {(item.schedule || item.time_range || item.slots) && (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginTop: 10 }}>
                                                {item.schedule && <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 12px' }}><div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Schedule</div><div style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', marginTop: 2 }}>{formatBulletinDate(item.schedule)}</div></div>}
                                                {item.time_range && <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 12px' }}><div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Time</div><div style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', marginTop: 2 }}>{item.time_range}</div></div>}
                                                {item.slots && <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 12px' }}><div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Slots</div><div style={{ fontSize: 15, fontWeight: 800, color: cfg.color, marginTop: 2 }}>{item.slots}</div></div>}
                                            </div>
                                        )}
                                        {reqs.length > 0 && (
                                            <div style={{ marginTop: 10 }}>
                                                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 4 }}>REQUIREMENTS</div>
                                                {reqs.map((r, i) => <div key={i} style={{ fontSize: 12.5, color: '#475569', display: 'flex', gap: 6, marginBottom: 3 }}><span style={{ color: cfg.color }}>•</span>{r}</div>)}
                                            </div>
                                        )}
                                    </div>
                                    {/* Actions */}
                                    <div className="ln-feed-actions" style={{ borderTop: '1px solid #f3f3f3', padding: '8px 12px', display: 'flex', gap: 8 }}>
                                        {cfg.type && (
                                            <button
                                                className="ln-feed-action-btn"
                                                disabled={!!alreadyInteracted || item.status === 'Closed' || item.status === 'Full'}
                                                onClick={() => openBulletinModal(item, cfg.type)}
                                                style={alreadyInteracted ? { color: cfg.color, fontWeight: 700 } : {}}
                                            >
                                                {alreadyInteracted ? <><CheckCircle size={14} /> {cfg.traineeLabel.endsWith('y') ? cfg.traineeLabel.replace(/y$/, 'ied') : (cfg.traineeLabel.endsWith('e') ? cfg.traineeLabel + 'd' : cfg.traineeLabel + 'ed')}</> : <><Send size={14} /> {cfg.traineeLabel}</>}
                                            </button>
                                        )}
                                        <button className="ln-feed-action-btn" onClick={() => openBulletinModal(item, 'inquire')}>
                                            <MessageSquare size={14} /> Inquire
                                        </button>
                                        <button
                                            className="ln-feed-action-btn"
                                            onClick={() => createPostInteraction(item.id, 'save')}
                                            style={getUserPostInteraction(item.id, 'save') ? { color: '#d97706', fontWeight: 700 } : {}}
                                        >
                                            <Bookmark size={14} fill={getUserPostInteraction(item.id, 'save') ? "currentColor" : "none"} />
                                            {getUserPostInteraction(item.id, 'save') ? 'Saved' : 'Save'}
                                        </button>
                                    </div>
                                </div>
                            );
                        } else if (item.feedType === 'job') {
                            const applied = myAppJobIds.includes(item.id);
                            const isSaved = Array.isArray(trainee?.savedOpportunities) && trainee.savedOpportunities.includes(item.id);
                            const jobComments = getJobPostingComments(item.id);
                            return (
                                <div key={`job-${item.id}`} className="ln-card ln-feed-card" style={{ marginBottom: 0 }}>
                                    <div className="ln-feed-card-header">
                                        <button
                                            type="button"
                                            className="ln-feed-avatar"
                                            onClick={() => openProfile({ id: item.partnerId, type: 'partner' })}
                                            style={{ background: '#f0f7ff', color: '#0a66c2', border: 'none', cursor: item.partnerId ? 'pointer' : 'default' }}
                                            disabled={!item.partnerId}
                                        >
                                            <Building2 size={20} />
                                        </button>
                                        <div>
                                            <div className="ln-feed-author">
                                                <button
                                                    type="button"
                                                    onClick={() => openProfile({ id: item.partnerId, type: 'partner' })}
                                                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontWeight: 700, color: 'inherit', fontSize: 'inherit', fontFamily: 'inherit' }}
                                                >
                                                    {item.companyName}
                                                </button>
                                                <span style={{ fontWeight: 400, color: 'rgba(0,0,0,0.45)', marginLeft: 4 }}>posted a new {item.opportunityType}</span>
                                            </div>
                                            <div className="ln-feed-meta">
                                                {[
                                                    (item.industry && String(item.industry).trim().toLowerCase() !== 'general') ? item.industry : '',
                                                    item.location,
                                                    timeAgo(item.createdAt),
                                                ].filter(Boolean).join(' • ')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ln-feed-content">
                                        <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{item.title}</h4>
                                        <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.6)', marginBottom: 8 }}>{item.description.substring(0, 150)}...</p>
                                        {item.attachmentUrl && isImageAttachment(item.attachmentUrl, item.attachmentType) && (
                                            <div style={{ display: 'block', marginBottom: 10 }}>
                                                <div className="ln-media-frame">
                                                    <img
                                                        src={item.attachmentUrl}
                                                        alt={item.attachmentName || 'Opportunity attachment'}
                                                        className="ln-media-image"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {item.attachmentUrl && !isImageAttachment(item.attachmentUrl, item.attachmentType) && (
                                            <a href={item.attachmentUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#2563eb', marginBottom: 8, textDecoration: 'none' }}>
                                                <FileText size={13} /> {item.attachmentName || decodeURIComponent(String(item.attachmentUrl).split('/').pop()?.split('?')[0] || 'Attachment')}
                                            </a>
                                        )}
                                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                            <span className="ln-opp-type-badge">{item.opportunityType}</span>
                                            {item.opportunityType !== 'OJT' && item.employmentType && (
                                                <span className="ln-opp-type-badge" style={{ background: '#f8fafc', color: '#64748b' }}>{item.employmentType}</span>
                                            )}
                                            {item.ncLevel && (
                                                <span className="ln-opp-type-badge" style={{ background: '#ede9fe', color: '#6d28d9' }}>{item.ncLevel}</span>
                                            )}
                                            {item.salaryRange && (
                                                <span style={{ fontSize: 15, color: '#057642', fontWeight: 700 }}>{formatSalaryDisplay(item.salaryRange)}</span>
                                            )}
                                        </div>
                                        {jobComments.length > 0 && (
                                            <div style={{ marginTop: 10, fontSize: 12, color: '#64748b', display: 'flex', gap: 14 }}>
                                                {jobComments.length > 0 && <span>{jobComments.length} comment{jobComments.length === 1 ? '' : 's'}</span>}
                                            </div>
                                        )}
                                    </div>
                                    <div className="ln-feed-actions" style={{ borderTop: '1px solid #f3f3f3', padding: '8px 12px', display: 'flex', gap: 4 }}>
                                        <button
                                            className="ln-feed-action-btn"
                                            disabled={applied || item.status !== 'Open'}
                                            onClick={() => feedOpenApplyModal(item)}
                                            style={applied ? { color: '#057642', fontWeight: 600 } : {}}
                                        >
                                            {applied ? <><CheckCircle size={14} /> Applied</> : <><Send size={14} /> Apply</>}
                                        </button>
                                        <button
                                            className="ln-feed-action-btn"
                                            onClick={() => toggleBookmark(item.id)}
                                            style={isSaved ? { color: '#0a66c2', fontWeight: 600 } : {}}
                                        >
                                            <Bookmark size={14} fill={isSaved ? '#0a66c2' : 'none'} /> {isSaved ? 'Saved' : 'Save'}
                                        </button>
                                        <button
                                            className="ln-feed-action-btn"
                                            onClick={() => openContactModal({
                                                recipientId: item.partnerId,
                                                recipientType: 'industry_partner',
                                                recipientName: item.companyName,
                                                jobPostingId: item.id,
                                                sourceLabel: item.title,
                                            })}
                                        >
                                            <Mail size={14} /> Inquire
                                        </button>
                                    </div>
                                </div>
                            );
                        } else {
                            const isOwnPost = item.author_id === currentUser?.id;
                            const author = isOwnPost
                                ? currentUser
                                : isStudentAuthorType(item.author_type)
                                    ? trainees.find(t => t.id === item.author_id)
                                    : partners.find(p => p.id === item.author_id);
                            const authorProfileType = toProfileAuthorType(item.author_type);
                            const authorName = author?.name || author?.profileName || author?.companyName || 'Unknown User';
                            const authorPhoto = author?.photo || author?.company_logo_url;
                            const authorInitial = authorName.charAt(0) || '?';
                            const comments = getPostComments(item.id);
                            const getCommentAuthorName = (comment) => {
                                if (comment.author_id === currentUser?.id) return currentUser.name || trainee?.name || 'You';
                                if (isStudentAuthorType(comment.author_type)) {
                                    const student = trainees.find(t => t.id === comment.author_id);
                                    return student?.name || 'Trainee';
                                }
                                const company = partners.find(p => p.id === comment.author_id);
                                return company?.companyName || 'Industry Partner';
                            };

                            return (
                                <div key={`post-${item.id}`} className="ln-card ln-feed-card" style={{ marginBottom: 0 }}>
                                    <div className="ln-feed-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                            <button
                                                type="button"
                                                className="ln-feed-avatar"
                                                onClick={() => openProfile({ id: item.author_id, type: authorProfileType })}
                                                style={{ border: 'none', cursor: 'pointer' }}
                                            >
                                                {authorPhoto ? (
                                                    <img src={authorPhoto} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                                ) : authorInitial}
                                            </button>
                                            <div>
                                                <div className="ln-feed-author" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => openProfile({ id: item.author_id, type: authorProfileType })}
                                                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontWeight: 700, color: 'inherit', fontSize: 'inherit', fontFamily: 'inherit' }}
                                                    >
                                                        {authorName}
                                                    </button>
                                                    {item.post_type !== 'general' && (
                                                        <span
                                                            className="ln-badge"
                                                            style={{
                                                                fontSize: 10,
                                                                padding: '2px 8px',
                                                                background: item.post_type === 'announcement' ? '#fdf2f2' :
                                                                    item.post_type === 'hiring_update' ? '#f0f9ff' :
                                                                        item.post_type === 'achievement' ? '#fffbeb' :
                                                                            item.post_type === 'certification' ? '#f0fdf4' :
                                                                                item.post_type === 'project' ? '#faf5ff' : '#f1f5f9',
                                                                color: item.post_type === 'announcement' ? '#991b1b' :
                                                                    item.post_type === 'hiring_update' ? '#075985' :
                                                                        item.post_type === 'achievement' ? '#92400e' :
                                                                            item.post_type === 'certification' ? '#166534' :
                                                                                item.post_type === 'project' ? '#6b21a8' : '#475569',
                                                                border: `1px solid ${item.post_type === 'announcement' ? '#fecaca' :
                                                                    item.post_type === 'hiring_update' ? '#bae6fd' :
                                                                        item.post_type === 'achievement' ? '#fde68a' :
                                                                            item.post_type === 'certification' ? '#bbf7d0' :
                                                                                item.post_type === 'project' ? '#e9d5ff' : '#e2e8f0'}`
                                                            }}
                                                        >
                                                            {item.post_type === 'announcement' ? '📢 ' :
                                                                item.post_type === 'hiring_update' ? '💼 ' :
                                                                    item.post_type === 'achievement' ? '🏆 ' :
                                                                        item.post_type === 'certification' ? '📜 ' :
                                                                            item.post_type === 'project' ? '🚀 ' : ''}
                                                            {item.post_type.replace('_', ' ')}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="ln-feed-meta">
                                                    {isStudentAuthorType(item.author_type) ? (author?.program || 'Trainee') : (author?.companyName || 'Industry Partner')} &bull; {timeAgo(item.created_at)}
                                                    {item.updated_at && item.updated_at !== item.created_at && ' (edited)'}
                                                </div>
                                            </div>
                                        </div>
                                        {isOwnPost && (
                                            <div style={{ position: 'relative' }}>
                                                <button
                                                    onClick={() => setPostMenuId(postMenuId === item.id ? null : item.id)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: '50%', color: '#65676b' }}
                                                    title="More options"
                                                >
                                                    <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2, lineHeight: 1 }}>···</span>
                                                </button>
                                                {postMenuId === item.id && (
                                                    <div style={{
                                                        position: 'absolute', right: 0, top: 32, background: '#fff',
                                                        borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                                                        border: '1px solid #e4e6eb', zIndex: 10, minWidth: 150, overflow: 'hidden'
                                                    }}>
                                                        <button
                                                            onClick={() => handleEditPost(item)}
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                                                                padding: '10px 16px', border: 'none', background: 'none',
                                                                cursor: 'pointer', fontSize: 14, color: '#1c1e21'
                                                            }}
                                                            onMouseEnter={e => e.target.style.background = '#f2f3f5'}
                                                            onMouseLeave={e => e.target.style.background = 'none'}
                                                        >
                                                            <Edit size={16} /> Edit post
                                                        </button>
                                                        <button
                                                            onClick={() => { setConfirmDeleteId(item.id); setPostMenuId(null); }}
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                                                                padding: '10px 16px', border: 'none', background: 'none',
                                                                cursor: 'pointer', fontSize: 14, color: '#e74c3c'
                                                            }}
                                                            onMouseEnter={e => e.target.style.background = '#f2f3f5'}
                                                            onMouseLeave={e => e.target.style.background = 'none'}
                                                        >
                                                            <Trash2 size={16} /> Delete post
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="ln-feed-content">
                                        {editingPostId === item.id ? (
                                            <div>
                                                <textarea
                                                    value={editContent}
                                                    onChange={e => setEditContent(e.target.value)}
                                                    style={{
                                                        width: '100%', minHeight: 100, padding: 12, fontSize: 14,
                                                        border: '1px solid #0a66c2', borderRadius: 8, resize: 'none',
                                                        outline: 'none', fontFamily: 'inherit'
                                                    }}
                                                    maxLength={2000}
                                                />
                                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                                                    <button
                                                        onClick={() => { setEditingPostId(null); setEditContent(''); }}
                                                        className="ln-btn-sm"
                                                        style={{ padding: '6px 16px', borderRadius: 20, fontSize: 13 }}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmSaveId(item.id)}
                                                        className="ln-btn-sm ln-btn-primary"
                                                        style={{ padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}
                                                        disabled={!editContent.trim()}
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {item.title && (
                                                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#1e293b' }}>{item.title}</h3>
                                                )}
                                                <p style={{ whiteSpace: 'pre-wrap', fontSize: 14, color: '#334155' }}>{item.content}</p>
                                            </>
                                        )}
                                        {item.media_url && (
                                            <div style={{ marginTop: 12 }}>
                                                {item.media_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                    <div className="ln-media-frame">
                                                        <img src={item.media_url} alt="Post media" className="ln-media-image" />
                                                    </div>
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
                                        {comments.length > 0 && (
                                            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                {comments.slice(-3).map(comment => {
                                                    const previewCommentType = toProfileAuthorType(comment.author_type);
                                                    return (
                                                        <div key={comment.id} style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.4 }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => openProfile({ id: comment.author_id, type: previewCommentType })}
                                                                style={{ fontWeight: 700, color: '#1e293b', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                                                            >
                                                                {getCommentAuthorName(comment)}:
                                                            </button>{' '}
                                                            {comment.content}
                                                        </div>
                                                    );
                                                })}
                                                {comments.length > 3 && (
                                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>+{comments.length - 3} more comments</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="ln-feed-actions" style={{ borderTop: '1px solid #f3f3f3', padding: '4px 12px' }}>
                                        <button
                                            className="ln-feed-action-btn"
                                            onClick={() => openContactModal({
                                                recipientId: item.author_id,
                                                recipientType: toRecipientAuthorType(item.author_type),
                                                recipientName: authorName,
                                                postId: item.id,
                                                sourceLabel: item.content,
                                            })}
                                            disabled={isOwnPost}
                                            style={isOwnPost ? { opacity: 0.55, cursor: 'not-allowed' } : undefined}
                                        >
                                            <MessageSquare size={16} /> {isOwnPost ? 'Your Post' : 'Contact'}
                                        </button>
                                        <button className="ln-feed-action-btn" onClick={() => handleCommentOnPost(item)}><MessageSquare size={16} /> Comment ({comments.length})</button>
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
                <SuggestedOpportunities recJobs={recJobs} handleApply={handleApply} setActivePage={setActivePage} onViewProfile={openProfile} />
                <QuickLinksWidget setActivePage={setActivePage} />
            </div>

            {/* Bulletin Interaction Toast */}
            {bulletinToast && (
                <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle size={16} color="#4ade80" />{bulletinToast}
                </div>
            )}

            {/* Bulletin Interaction Modal */}
            {bulletinModal && (() => {
                const cfg = BULLETIN_CONFIG[bulletinModal.post.post_type] || BULLETIN_CONFIG.announcement;
                const isInquiry = bulletinModal.type === 'inquire';
                const title = isInquiry ? 'Send Inquiry' : bulletinModal.type === 'apply' ? 'Apply to Training' : 'Register';
                return (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                        <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
                            <div style={{ background: cfg.color, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ fontSize: 20 }}>{cfg.emoji}</div>
                                <div>
                                    <div style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>{title}</div>
                                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>{bulletinModal.post.title}</div>
                                </div>
                                <button onClick={() => setBulletinModal(null)} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <X size={14} color="#fff" />
                                </button>
                            </div>
                            <div style={{ padding: '20px' }}>
                                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
                                    {isInquiry ? 'Your Message *' : 'Message / Note (optional)'}
                                </label>
                                <textarea
                                    value={bulletinMessage}
                                    onChange={e => setBulletinMessage(e.target.value)}
                                    placeholder={isInquiry ? 'Type your inquiry here...' : 'Add a note or cover letter...'}
                                    rows={4}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                                />
                                <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' }}>
                                    <button onClick={() => setBulletinModal(null)} style={{ padding: '10px 18px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                                    <button
                                        onClick={handleBulletinInteraction}
                                        disabled={bulletinSubmitting || (isInquiry && !bulletinMessage.trim())}
                                        style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: cfg.color, color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: bulletinSubmitting ? 0.6 : 1 }}
                                    >
                                        {bulletinSubmitting ? 'Submitting...' : isInquiry ? 'Send Inquiry' : 'Confirm'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Delete Confirmation Dialog */}
            {confirmDeleteId && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
                    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="ln-card" style={{ padding: 24, maxWidth: 400, width: '90%', borderRadius: 12, textAlign: 'center' }}>
                        <Trash2 size={36} style={{ color: '#e74c3c', marginBottom: 12 }} />
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Delete Post?</h3>
                        <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', marginBottom: 20 }}>
                            This action cannot be undone. Are you sure you want to delete this post?
                        </p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                            <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="ln-btn-sm"
                                style={{ padding: '8px 24px', borderRadius: 20, fontSize: 14 }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeletePost(confirmDeleteId)}
                                style={{
                                    padding: '8px 24px', borderRadius: 20, fontSize: 14, fontWeight: 600,
                                    background: '#e74c3c', color: '#fff', border: 'none', cursor: 'pointer'
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Save Edit Confirmation Dialog */}
            {confirmSaveId && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
                    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="ln-card" style={{ padding: 24, maxWidth: 400, width: '90%', borderRadius: 12, textAlign: 'center' }}>
                        <Edit size={36} style={{ color: '#0a66c2', marginBottom: 12 }} />
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Save Changes?</h3>
                        <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', marginBottom: 20 }}>
                            Are you sure you want to save your changes to this post?
                        </p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                            <button
                                onClick={() => setConfirmSaveId(null)}
                                className="ln-btn-sm"
                                style={{ padding: '8px 24px', borderRadius: 20, fontSize: 14 }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleSaveEdit(confirmSaveId)}
                                className="ln-btn-sm ln-btn-primary"
                                style={{ padding: '8px 24px', borderRadius: 20, fontSize: 14, fontWeight: 600 }}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {jobMediaModal && (
                <div
                    className="modal-overlay"
                    style={useCommentsOnlyJobModal
                        ? { background: '#ffffff', padding: 0, alignItems: 'stretch' }
                        : { background: 'rgba(0, 0, 0, 0.82)' }}
                    onClick={closeJobMediaModal}
                >
                    <div
                        className="ln-modal"
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: useCommentsOnlyJobModal ? '100%' : '96%',
                            maxWidth: useCommentsOnlyJobModal ? '100%' : 1240,
                            height: useCommentsOnlyJobModal ? '100vh' : '90vh',
                            maxHeight: useCommentsOnlyJobModal ? '100vh' : 920,
                            padding: 0,
                            overflow: 'hidden',
                            display: useCommentsOnlyJobModal ? 'flex' : 'grid',
                            gridTemplateColumns: useCommentsOnlyJobModal ? undefined : 'minmax(0, 1fr) 360px',
                            borderRadius: useCommentsOnlyJobModal ? 0 : 14,
                            background: useCommentsOnlyJobModal ? '#ffffff' : '#0f172a',
                        }}
                    >
                        {!useCommentsOnlyJobModal && (
                            <div style={{ background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                <button
                                    onClick={closeJobMediaModal}
                                    style={{ position: 'absolute', top: 12, left: 12, width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'rgba(17,24,39,0.7)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <X size={18} />
                                </button>
                                {jobMediaModal.attachmentUrl && isImageAttachment(jobMediaModal.attachmentUrl, jobMediaModal.attachmentType) ? (
                                    <img src={jobMediaModal.attachmentUrl} alt={jobMediaModal.attachmentName || 'Opportunity media'} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                ) : jobMediaModal.attachmentUrl ? (
                                    <a href={jobMediaModal.attachmentUrl} target="_blank" rel="noreferrer" style={{ color: '#93c5fd', textDecoration: 'none', display: 'inline-flex', gap: 8, alignItems: 'center', background: '#111827', border: '1px solid #334155', borderRadius: 10, padding: '12px 14px' }}>
                                        <FileText size={18} />
                                        {jobMediaModal.attachmentName || 'Open attachment'}
                                    </a>
                                ) : (
                                    <div style={{ color: '#94a3b8', fontSize: 13 }}>No media attachment for this opportunity.</div>
                                )}
                            </div>
                        )}

                        <div style={{ background: '#ffffff', display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
                            <div style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => openProfile({ id: jobMediaModal.partnerId, type: 'partner' })}
                                            style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                                        >
                                            {jobMediaModal.companyName}
                                        </button>
                                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                                            {[
                                                (jobMediaModal.industry && String(jobMediaModal.industry).trim().toLowerCase() !== 'general') ? jobMediaModal.industry : '',
                                                jobMediaModal.location,
                                                formatSalaryDisplay(jobMediaModal.salaryRange),
                                                timeAgo(jobMediaModal.created_at || jobMediaModal.createdAt || jobMediaModal.datePosted),
                                            ].filter(Boolean).join(' • ')}
                                        </div>
                                        <div style={{ marginTop: 8, fontSize: 16, fontWeight: 700, color: '#111827' }}>{jobMediaModal.title}</div>
                                        <div style={{ marginTop: 4, fontSize: 13, color: '#475569', whiteSpace: 'pre-wrap' }}>{jobMediaModal.description}</div>
                                    </div>
                                    <button
                                        onClick={closeJobMediaModal}
                                        style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #d1d5db', background: '#fff', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                                        aria-label="Close"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ padding: '10px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}>
                                <span>{jobMediaComments.length} comments</span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6, padding: 10, borderBottom: '1px solid #e5e7eb' }}>
                                <button className="ln-feed-action-btn" onClick={() => jobMediaCommentInputRef.current?.focus()} style={{ justifyContent: 'center' }}>
                                    <MessageSquare size={15} /> Comment
                                </button>
                            </div>

                            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {jobMediaComments.length > 0 ? jobMediaComments.map(comment => {
                                    const commentAuthorName = comment.author_id === currentUser?.id
                                        ? (currentUser?.name || trainee?.name || 'You')
                                        : isStudentAuthorType(comment.author_type)
                                            ? (trainees.find(t => t.id === comment.author_id)?.name || 'Trainee')
                                            : (partners.find(p => p.id === comment.author_id)?.companyName || 'Industry Partner');
                                    const commentAuthorType = toProfileAuthorType(comment.author_type);
                                    const isOwnComment = comment.author_id === currentUser?.id;
                                    const isEditing = editingJobMediaCommentId === comment.id;
                                    const isMenuOpen = jobMediaCommentMenuId === comment.id;

                                    return (
                                        <div key={comment.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 10px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                                <button
                                                    type="button"
                                                    onClick={() => openProfile({ id: comment.author_id, type: commentAuthorType })}
                                                    style={{ fontSize: 12, fontWeight: 700, color: '#111827', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                                                >
                                                    {commentAuthorName}
                                                </button>
                                                {isOwnComment && !isEditing && (
                                                    <div style={{ position: 'relative' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setJobMediaCommentMenuId(isMenuOpen ? null : comment.id)}
                                                            style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', padding: '0 4px', fontSize: 18, lineHeight: 1, borderRadius: 4 }}
                                                            aria-label="Comment options"
                                                        >
                                                            ···
                                                        </button>
                                                        {isMenuOpen && (
                                                            <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 200, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 4px 14px rgba(0,0,0,0.13)', minWidth: 110, padding: '4px 0' }}>
                                                                <button type="button" onClick={() => { startEditingJobMediaComment(comment); setJobMediaCommentMenuId(null); }} style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: '8px 14px', fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                                                                    Edit
                                                                </button>
                                                                <button type="button" onClick={() => { handleDeleteJobMediaComment(comment.id); setJobMediaCommentMenuId(null); }} style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: '8px 14px', fontSize: 13, fontWeight: 600, color: '#b91c1c', cursor: 'pointer' }}>
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            {isEditing ? (
                                                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                    <textarea
                                                        value={jobMediaEditInput}
                                                        onChange={e => setJobMediaEditInput(e.target.value)}
                                                        maxLength={1000}
                                                        style={{ width: '100%', minHeight: 72, border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', color: '#334155' }}
                                                    />
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                                        <button type="button" onClick={cancelEditingJobMediaComment} disabled={jobMediaCommentSaving} style={{ border: '1px solid #cbd5e1', background: '#fff', color: '#334155', borderRadius: 9999, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                                            Cancel
                                                        </button>
                                                        <button type="button" onClick={saveEditedJobMediaComment} disabled={!jobMediaEditInput.trim() || jobMediaCommentSaving} style={{ border: 'none', background: '#0a66c2', color: '#fff', borderRadius: 9999, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: !jobMediaEditInput.trim() || jobMediaCommentSaving ? 'not-allowed' : 'pointer', opacity: !jobMediaEditInput.trim() || jobMediaCommentSaving ? 0.6 : 1 }}>
                                                            {jobMediaCommentSaving ? 'Saving...' : 'Save'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: 13, color: '#334155', whiteSpace: 'pre-wrap' }}>{comment.content}</div>
                                            )}
                                            <div style={{ marginTop: 3, fontSize: 11, color: '#94a3b8' }}>{timeAgo(comment.created_at || comment.createdAt)}</div>
                                        </div>
                                    );
                                }) : (
                                    <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 20 }}>No comments yet.</div>
                                )}
                            </div>

                            <div style={{ borderTop: '1px solid #e5e7eb', padding: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                                <input
                                    ref={jobMediaCommentInputRef}
                                    value={jobMediaCommentInput}
                                    onChange={e => setJobMediaCommentInput(e.target.value)}
                                    maxLength={1000}
                                    placeholder={`Comment as ${currentUser?.name || trainee?.name || 'You'}`}
                                    style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: 9999, padding: '10px 12px', fontSize: 13 }}
                                />
                                <button className="ln-btn ln-btn-primary" onClick={submitJobMediaComment} disabled={!jobMediaCommentInput.trim()}>
                                    <Send size={14} /> Send
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {contactTarget && (
                <div className="modal-overlay" onClick={closeContactModal}>
                    <div className="ln-modal" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, background: '#ffffff', color: '#0f172a', borderRadius: 18, padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '18px 22px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: 20, fontWeight: 800 }}>Contact {contactRecipientName}</div>
                                <div style={{ marginTop: 4, fontSize: 13, color: '#64748b' }}>
                                    {contactRequiresResume ? 'Send a message and attach your resume.' : 'Send a message and optionally attach a document.'}
                                </div>
                            </div>
                            <button className="ln-btn-icon" onClick={closeContactModal}><X size={18} /></button>
                        </div>

                        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase', color: '#64748b', marginBottom: 6 }}>Context</div>
                                <div style={{ fontSize: 14, color: '#0f172a', whiteSpace: 'pre-wrap' }}>{contactTarget.sourceLabel || 'Community post contact'}</div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Message</label>
                                <textarea
                                    value={contactMessage}
                                    onChange={e => setContactMessage(e.target.value)}
                                    maxLength={1000}
                                    placeholder={`Write your message to ${contactRecipientName}...`}
                                    style={{ width: '100%', minHeight: 130, borderRadius: 14, border: '1px solid #cbd5e1', padding: '14px 16px', resize: 'vertical', outline: 'none', fontFamily: 'inherit', fontSize: 14, lineHeight: 1.5, background: '#ffffff', color: '#0f172a' }}
                                />
                                <div style={{ marginTop: 6, fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>{contactMessage.length}/1000</div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                                    {contactRequiresResume ? 'Resume Upload' : 'Document Upload'}
                                </label>
                                <input ref={contactFileInputRef} type="file" onChange={handleContactAttachmentChange} style={{ display: 'none' }} />
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <button type="button" className="ln-btn ln-btn-outline" onClick={() => contactFileInputRef.current?.click()}>
                                        <Upload size={14} /> {contactRequiresResume ? 'Upload Resume' : 'Choose File'}
                                    </button>
                                    <span style={{ fontSize: 13, color: contactAttachment ? '#0f172a' : '#64748b' }}>
                                        {contactAttachment ? contactAttachment.name : (contactRequiresResume ? 'Resume is required.' : 'No file selected.')}
                                    </span>
                                </div>
                                <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
                                    {contactRequiresResume ? 'Required for student-to-partner contact.' : 'Optional for this contact type.'}
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '16px 22px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#ffffff' }}>
                            <button className="ln-btn ln-btn-outline" onClick={closeContactModal} disabled={contactSubmitting}>Cancel</button>
                            <button className="ln-btn ln-btn-primary" onClick={handleSubmitContact} disabled={contactSubmitting || !contactMessage.trim() || (contactRequiresResume && !contactAttachment)}>
                                <Send size={14} /> {contactSubmitting ? 'Sending...' : 'Send Contact'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {commentModalPost && (
                <div className="modal-overlay" style={useCompactPostCommentModal ? { background: '#ffffff', padding: 0, alignItems: 'stretch' } : { background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(2px)' }} onClick={() => setCommentModalPost(null)}>
                    <div
                        className="ln-modal"
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: useCompactPostCommentModal ? '100%' : '96%',
                            maxWidth: useCompactPostCommentModal ? '100%' : 740,
                            height: useCompactPostCommentModal ? '100vh' : '92vh',
                            maxHeight: useCompactPostCommentModal ? '100vh' : 940,
                            padding: 0,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: useCompactPostCommentModal ? 0 : 16,
                            color: '#0f172a'
                        }}
                    >
                        <div style={{ height: useCompactPostCommentModal ? 52 : 60, borderBottom: '1px solid #e2e8f0', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: useCompactPostCommentModal ? 'flex-end' : 'center', fontSize: 28, fontWeight: 700, color: '#0f172a', paddingRight: useCompactPostCommentModal ? 56 : 0 }}>
                            {!useCompactPostCommentModal ? `${modalAuthorName}'s Post` : ''}
                            <button
                                onClick={() => setCommentModalPost(null)}
                                style={{ position: 'absolute', right: 12, top: 12, width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#f1f5f9', color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {!useCompactPostCommentModal && (
                            <div style={{ flex: '0 0 clamp(250px, 50vh, 560px)', minHeight: 220, display: 'flex', flexDirection: 'column', borderBottom: '1px solid #e2e8f0' }}>
                                <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <button
                                        type="button"
                                        className="ln-feed-avatar"
                                        onClick={() => openProfile({ id: commentModalPost.author_id, type: toProfileAuthorType(commentModalPost.author_type) })}
                                        style={{ width: 34, height: 34, border: 'none', cursor: 'pointer' }}
                                    >
                                        {(modalAuthor?.photo || modalAuthor?.company_logo_url)
                                            ? <img src={modalAuthor.photo || modalAuthor.company_logo_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                            : (modalAuthorName?.charAt(0) || 'U')}
                                    </button>
                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => openProfile({ id: commentModalPost.author_id, type: toProfileAuthorType(commentModalPost.author_type) })}
                                            style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                                        >
                                            {modalAuthorName}
                                        </button>
                                        <div style={{ fontSize: 11.5, color: '#64748b' }}>{timeAgo(commentModalPost.created_at)}</div>
                                    </div>
                                </div>

                                <div style={{ padding: '0 12px 10px', color: '#0f172a', fontSize: 14.5, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                    {commentModalPost.content}
                                </div>

                                <div style={{ flex: 1, minHeight: 260, background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                    {commentModalPost.media_url ? (
                                        commentModalPost.media_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                            <img src={commentModalPost.media_url} alt="Post media" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        ) : (
                                            <a
                                                href={commentModalPost.media_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ minWidth: 260, minHeight: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '14px 18px', textDecoration: 'none', fontWeight: 600, fontSize: 13 }}
                                            >
                                                <FileText size={28} />
                                                Open attached document
                                            </a>
                                        )
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontWeight: 600 }}>No attachment</div>
                                    )}
                                </div>

                                <div style={{ padding: '8px 12px', borderTop: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: 12.5, marginBottom: 8 }}>
                                        <span>{modalComments.length} comment{modalComments.length === 1 ? '' : 's'}</span>
                                        <span>{commentModalPost.media_url ? '1 attachment' : 'No attachment'}</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
                                        <button
                                            onClick={() => canContactModalAuthor && openContactModal({
                                                recipientId: commentModalPost.author_id,
                                                recipientType: toRecipientAuthorType(commentModalPost.author_type),
                                                recipientName: modalAuthorName,
                                                postId: commentModalPost.id,
                                                sourceLabel: commentModalPost.content,
                                            })}
                                            disabled={!canContactModalAuthor}
                                            style={{ background: canContactModalAuthor ? '#0f172a' : '#e2e8f0', border: 'none', color: canContactModalAuthor ? '#ffffff' : '#94a3b8', fontWeight: 700, padding: '9px 10px', borderRadius: 10, display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: 6, cursor: canContactModalAuthor ? 'pointer' : 'not-allowed' }}
                                        >
                                            <MessageSquare size={16} /> {canContactModalAuthor ? 'Contact' : 'Your Post'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div style={{ flex: useCompactPostCommentModal ? '1 1 auto' : '1 1 44%', minHeight: 0, display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
                            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', padding: 12, display: 'flex', flexDirection: 'column', gap: 10, background: '#ffffff' }}>
                                {modalComments.length > 0 ? modalComments.map(comment => {
                                    const commentAuthorName = comment.author_id === currentUser?.id
                                        ? (currentUser.name || trainee?.name || 'You')
                                        : isStudentAuthorType(comment.author_type)
                                            ? (trainees.find(t => t.id === comment.author_id)?.name || 'Trainee')
                                            : (partners.find(p => p.id === comment.author_id)?.companyName || 'Industry Partner');
                                    const commentAuthorType = toProfileAuthorType(comment.author_type);

                                    return (
                                        <div key={comment.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                            <button
                                                type="button"
                                                className="ln-feed-avatar"
                                                onClick={() => openProfile({ id: comment.author_id, type: commentAuthorType })}
                                                style={{ width: 30, height: 30, flexShrink: 0, border: 'none', cursor: 'pointer' }}
                                            >
                                                {commentAuthorName?.charAt(0) || 'U'}
                                            </button>
                                            <div style={{ background: '#f1f5f9', borderRadius: 14, padding: '8px 11px', flex: 1 }}>
                                                <button
                                                    type="button"
                                                    onClick={() => openProfile({ id: comment.author_id, type: commentAuthorType })}
                                                    style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 2, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                                                >
                                                    {commentAuthorName}
                                                </button>
                                                <div style={{ fontSize: 13.2, color: '#0f172a', whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>{comment.content}</div>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#64748b' }}>
                                        <FileText size={56} color="#94a3b8" />
                                        <div style={{ fontSize: 34, fontWeight: 700, color: '#334155' }}>No comments yet</div>
                                        <div style={{ fontSize: 17 }}>Be the first to comment.</div>
                                    </div>
                                )}
                            </div>

                            <div style={{ borderTop: '1px solid #e2e8f0', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8, background: '#ffffff' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                    <div className="ln-feed-avatar" style={{ width: 32, height: 32, flexShrink: 0, fontSize: 13 }}>
                                        {(trainee?.photo)
                                            ? <img src={trainee.photo} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                            : (currentUser?.name || trainee?.name || 'T').charAt(0).toUpperCase()}
                                    </div>

                                    <div style={{ flex: 1, background: '#f8fafc', borderRadius: 20, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <textarea
                                            placeholder={`Comment as ${currentUser?.name || trainee?.name || 'Trainee'}`}
                                            value={commentInput}
                                            onChange={e => setCommentInput(e.target.value)}
                                            maxLength={1000}
                                            style={{ width: '100%', minHeight: 24, maxHeight: 78, resize: 'none', border: 'none', outline: 'none', background: 'transparent', color: '#0f172a', fontSize: 16, lineHeight: 1.3, fontFamily: 'inherit' }}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: '#64748b' }}>
                                                <MessageSquare size={14} />
                                                <Camera size={14} />
                                                <FileText size={14} />
                                            </div>
                                            <button
                                                onClick={handleSubmitComment}
                                                disabled={commentSubmitting || !commentInput.trim()}
                                                style={{ background: 'transparent', border: 'none', color: (commentSubmitting || !commentInput.trim()) ? '#94a3b8' : '#2563eb', cursor: (commentSubmitting || !commentInput.trim()) ? 'not-allowed' : 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }}
                                            >
                                                <Send size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ fontSize: 12, color: '#64748b', textAlign: 'left', marginLeft: 40 }}>{commentInput.length}/1000</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Feed Apply Modal */}
            {feedApplyJob && (
                <div className="modal-overlay" onClick={() => setFeedApplyJob(null)}>
                    <div className="ln-modal" onClick={e => e.stopPropagation()}>
                        <div className="ln-modal-header">
                            <div>
                                <h3 className="ln-modal-title">Application Form</h3>
                                <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', marginTop: 4 }}>
                                    {feedApplyJob.title} •
                                    <button
                                        type="button"
                                        onClick={() => openProfile({ id: feedApplyJob.partnerId, type: 'partner' })}
                                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#0a66c2', font: 'inherit', marginLeft: 4 }}
                                    >
                                        {feedApplyJob.companyName}
                                    </button>
                                </p>
                            </div>
                            <button className="ln-btn-icon" onClick={() => setFeedApplyJob(null)}><X size={18} /></button>
                        </div>
                        <div className="ln-profile-summary-notice" style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: 12, marginBottom: 16 }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                <ShieldCheck size={18} color="#0369a1" style={{ marginTop: 2 }} />
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0369a1' }}>Profile as Resume</div>
                                    <p style={{ fontSize: 12, color: '#0c4a6e', margin: '4px 0 0' }}>
                                        Your comprehensive profile (Education, Work Exp, Skills, and Certifications) will be shared with the recruiter as your official resume.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {feedResumeInfo?.file_url && (
                            <div style={{ marginBottom: 12 }}>
                                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Attached Resume (Optional Backup)</div>
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 10, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{feedResumeInfo.file_name || 'Resume'}</div>
                                    </div>
                                    <a href={feedResumeInfo.file_url} target="_blank" rel="noreferrer" className="ln-btn-sm ln-btn-outline"><Eye size={12} /> View</a>
                                </div>
                            </div>
                        )}

                        <div style={{ marginBottom: 14 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Application Message</div>
                            <textarea
                                className="ln-search-input"
                                placeholder="Write a short message for the recruiter (optional)..."
                                value={feedApplicationMessage}
                                onChange={e => setFeedApplicationMessage(e.target.value)}
                                maxLength={1000}
                                style={{ width: '100%', minHeight: 110, resize: 'none', borderRadius: 10, padding: 12 }}
                            />
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, textAlign: 'right' }}>{feedApplicationMessage.length}/1000</div>
                        </div>

                        <div className="ln-modal-footer">
                            <button className="ln-btn ln-btn-outline" onClick={() => setFeedApplyJob(null)}>Cancel</button>
                            <button className="ln-btn ln-btn-primary" disabled={feedSubmittingApp} onClick={feedHandleSubmitApplication}>
                                <Send size={15} /> {feedSubmittingApp ? 'Submitting...' : 'Submit Application'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
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

const ApplicationTimeline = ({ traineeId }) => {
    const { applications, jobPostings } = useApp();
    const myApps = applications.filter(a => String(a.traineeId) === String(traineeId));

    const stages = [
        { label: 'Applied', icon: <Send size={14} /> },
        { label: 'Screened', icon: <ShieldCheck size={14} /> },
        { label: 'Interview', icon: <Users size={14} /> },
        { label: 'Offered', icon: <Award size={14} /> }
    ];

    if (myApps.length === 0) {
        return (
            <div style={{ padding: 20, background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', opacity: 0.6 }}>
                <div style={{ marginBottom: 16, textAlign: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#64748b' }}>Application Journey</h4>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>Start applying to track your progress</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative', padding: '0 4px', opacity: 0.3 }}>
                    {stages.map((s, i) => (
                        <React.Fragment key={i}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 1, flex: 1 }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: '50%',
                                    background: '#f1f5f9',
                                    color: '#94a3b8',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {s.icon}
                                </div>
                                <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textAlign: 'center' }}>{s.label}</span>
                            </div>
                            {i < 3 && (
                                <div style={{
                                    height: 2, flex: 1,
                                    background: '#e2e8f0',
                                    marginTop: -18,
                                    zIndex: 0
                                }} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        );
    }

    const getStatusStep = (status) => {
        const s = String(status || '').toLowerCase();
        if (s === 'pending' || s === 'sent') return 1;
        if (s === 'screened') return 2;
        if (s === 'interviewscheduled' || s === 'interview') return 3;
        if (s === 'accepted' || s === 'offered') return 4;
        if (s === 'rejected') return -1;
        return 1;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {myApps.map(app => {
                const job = jobPostings.find(j => String(j.id) === String(app.jobId));
                const step = getStatusStep(app.status);
                const isRejected = step === -1;

                return (
                    <div key={app.id} style={{ padding: 20, background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'flex-start' }}>
                            <div>
                                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{job?.title || 'Direct Contact'}</h4>
                                <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{job?.companyName || 'Industry Partner'} • Applied {timeAgo(app.createdAt)}</div>
                            </div>
                            <span className={`ln-badge ${isRejected ? 'ln-badge-red' : (step === 4 ? 'ln-badge-green' : 'ln-badge-blue')}`} style={{ textTransform: 'capitalize' }}>
                                {app.status || 'Sent'}
                            </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', position: 'relative', padding: '0 4px' }}>
                            {[
                                { label: 'Applied', icon: <Send size={14} /> },
                                { label: 'Screened', icon: <ShieldCheck size={14} /> },
                                { label: 'Interview', icon: <Users size={14} /> },
                                { label: 'Offered', icon: <Award size={14} /> }
                            ].map((s, i) => {
                                const active = !isRejected && step >= (i + 1);
                                const current = !isRejected && step === (i + 1);
                                return (
                                    <React.Fragment key={i}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 1, flex: 1 }}>
                                            <div style={{
                                                width: 34, height: 34, borderRadius: '50%',
                                                background: active ? '#0a66c2' : (isRejected && i === 0 ? '#cc1016' : '#f1f5f9'),
                                                color: active || (isRejected && i === 0) ? 'white' : '#94a3b8',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                border: current ? '2px solid #93c5fd' : 'none',
                                                transition: 'all 0.3s ease'
                                            }}>
                                                {(active && !current) ? <CheckCircle size={18} /> : s.icon}
                                            </div>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: active ? '#0a66c2' : '#94a3b8', textAlign: 'center' }}>{s.label}</span>
                                        </div>
                                        {i < 3 && (
                                            <div style={{
                                                height: 3, flex: 1,
                                                background: !isRejected && step > (i + 1) ? '#0a66c2' : '#e2e8f0',
                                                marginTop: -20,
                                                zIndex: 0
                                            }} />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// SavedItemsView is now a separate component in SavedItemsView.jsx

// ─── PAGE 2: PROFILE ─────────────────────────────────────────────
export const TraineeProfileContent = ({ viewedProfileId = null, onBack = null, openBulletinModal }) => {
    const { currentUser, userRole, trainees, updateTrainee, getSkillInterestRecommendations, programs, getSkillsDemand, applyToJob } = useApp();
    const isOwnProfile = !viewedProfileId || String(viewedProfileId) === String(currentUser?.id);
    const isEmployer = userRole === 'partner';
    const [viewedTrainee, setViewedTrainee] = useState(null);
    const [loadingViewedProfile, setLoadingViewedProfile] = useState(false);
    const trainee = isOwnProfile
        ? (currentUser || trainees[0])
        : (viewedTrainee || trainees.find(t => String(t.id) === String(viewedProfileId)));
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('About'); // About | Training | Match Insights | Saved
    const [previewImage, setPreviewImage] = useState(null);
    const [form, setForm] = useState({ ...trainee });
    const [personalInfoVisibility, setPersonalInfoVisibility] = useState(() => resolveTraineeVisibility(trainee));
    const initials = (trainee?.name || '').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T';

    // Skills state
    const [newSkill, setNewSkill] = useState('');

    // Interests state
    const [newInterest, setNewInterest] = useState('');
    const [interestsList, setInterestsList] = useState(trainee?.interests || []);

    const recommendationBubbles = useMemo(() => {
        if (!trainee?.id || !isOwnProfile) {
            return { skills: [], interests: [], dualTypeLabels: [], engine: 'autonomous-bubble-v1' };
        }

        return getSkillInterestRecommendations(trainee.id);
    }, [trainee?.id, isOwnProfile, getSkillInterestRecommendations]);

    // Certification state (deprecated, now integrated into trainings)
    // const [certs, setCerts] = useState([]); 

    // Education state
    const [educHistory, setEducHistory] = useState(trainee?.educHistory || []);
    // eslint-disable-next-line no-unused-vars
    const [savingEduc, setSavingEduc] = useState(false);

    // Work Experience state
    const [workExperience, setWorkExperience] = useState(trainee?.workExperience || []);
    // eslint-disable-next-line no-unused-vars
    const [savingWork, setSavingWork] = useState(false);
    const [showAllEduc, setShowAllEduc] = useState(false);
    const [showAllWork, setShowAllWork] = useState(false);

    // Training Status state
    // eslint-disable-next-line no-unused-vars
    const [editingTraining, setEditingTraining] = useState(false);
    const [trainings, setTrainings] = useState(() => {
        const tArr = Array.isArray(trainee?.trainings) ? trainee.trainings.map(t => ({ ...t, status: t.status || trainee.trainingStatus || 'Student' })) : [];
        if (tArr.length === 0 && trainee?.program) {
            return [{ program: trainee.program, year: trainee.graduationYear || '', ncLevel: trainee.ncLevel || '', status: trainee.trainingStatus || 'Student' }];
        }
        return tArr;
    });
    // eslint-disable-next-line no-unused-vars
    const [trainingForm, setTrainingForm] = useState({
        graduationYear: trainee?.graduationYear || '',
    });

    const updateTraining = (idx, field, val) => { const arr = [...trainings]; arr[idx][field] = val; setTrainings(arr); };
    const addTrainingObj = () => setTrainings(prev => [...prev, { program: '', year: '' }]);
    const removeTrainingIdx = (idx) => { setTrainings(prev => prev.filter((_, i) => i !== idx)); };

    // Employment state
    // eslint-disable-next-line no-unused-vars
    const [editingEmployment, setEditingEmployment] = useState(false);
    const [empForm, setEmpForm] = useState({
        employmentStatus: (['Employed', 'Seeking Employment', 'Certified', 'Seeking OJT', 'OJT In Progress'].includes(trainee?.employmentStatus)
            ? trainee.employmentStatus
            : 'Seeking Employment'),
        employer: trainee?.employer || '',
        jobTitle: trainee?.jobTitle || '',
        dateHired: trainee?.dateHired || '',
    });

    // Profile photo & banner state
    const profilePicRef = useRef(null);
    const bannerInputRef = useRef(null);
    const certInputRef = useRef(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const [uploadingIdx, setUploadingIdx] = useState(null);
    const [uploadingCert, setUploadingCert] = useState(false);

    // Documents state
    const [documents, setDocuments] = useState([]);
    const [docLabel, setDocLabel] = useState('');
    const [docFile, setDocFile] = useState(null);
    const [linkTitle, setLinkTitle] = useState('');
    const [docLinkUrl, setDocLinkUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const fileInputRef = useRef(null);

    // Confirm dialog state
    const [confirmDialog, setConfirmDialog] = useState({ open: false, message: '', onConfirm: null });
    const showConfirm = (message, onConfirm) => setConfirmDialog({ open: true, message, onConfirm });
    const closeConfirm = () => setConfirmDialog({ open: false, message: '', onConfirm: null });
    // eslint-disable-next-line no-unused-vars
    const resumeInputRef = useRef(null);
    const [resume, setResume] = useState(null);
    // eslint-disable-next-line no-unused-vars
    const [uploadingResume, setUploadingResume] = useState(false);
    const [applyJob, setApplyJob] = useState(null);
    const [applicationMessage, setApplicationMessage] = useState('');
    const [resumeInfo, setResumeInfo] = useState(null);
    const [submittingApplication, setSubmittingApplication] = useState(false);

    useEffect(() => {
        if (isOwnProfile || !viewedProfileId) {
            setViewedTrainee(null);
            setLoadingViewedProfile(false);
            return;
        }

        let isMounted = true;
        const fetchViewedProfile = async () => {
            setLoadingViewedProfile(true);
            try {
                const { data, error } = await supabase
                    .from('students')
                    .select('*, programs(name, nc_level)')
                    .eq('id', viewedProfileId)
                    .single();

                if (error || !data) {
                    const response = await fetch(`/api/public-profile/trainee/${viewedProfileId}`);
                    if (!response.ok) throw error || new Error('Failed to load viewed profile');
                    const payload = await response.json();
                    if (isMounted) {
                        setViewedTrainee(normalizeTraineeProfile(payload?.profile || null));
                    }
                } else if (isMounted) {
                    setViewedTrainee(normalizeTraineeProfile(data || null));
                }
            } catch (err) {
                console.error('Fetch viewed trainee profile error:', err);
                if (isMounted) {
                    setViewedTrainee(null);
                }
            } finally {
                if (isMounted) {
                    setLoadingViewedProfile(false);
                }
            }
        };

        fetchViewedProfile();
        return () => {
            isMounted = false;
        };
    }, [isOwnProfile, viewedProfileId]);

    useEffect(() => {
        if (!trainee) return;
        setEditing(false);
        const { documents: _, ...traineeWithoutDocs } = trainee || {};
        setForm({ ...traineeWithoutDocs });
        setInterestsList(trainee?.interests || []);
        // Documents are managed separately via the trainee.id useEffect below to avoid clobbering during profile saves.

        setEducHistory(trainee?.educHistory || []);
        setWorkExperience(trainee?.workExperience || []);
        setTrainingForm({
            graduationYear: trainee?.graduationYear || '',
        });

        // Populate trainings list. If empty, fallback to registration program.
        let initialTrainings = Array.isArray(trainee?.trainings) ? trainee.trainings.map(t => ({
            ...t,
            status: t.status || trainee.trainingStatus || 'Student',
            ncLevel: t.ncLevel || (t.program && (programs || []).find(p => p.name === t.program)?.ncLevel) || ''
        })) : [];
        if (initialTrainings.length === 0 && trainee?.program) {
            initialTrainings.push({
                program: trainee.program,
                year: trainee.graduationYear || '',
                ncLevel: trainee.ncLevel || '',
                status: trainee.trainingStatus || 'Student'
            });
        }
        setTrainings(initialTrainings);

        setEmpForm({
            employmentStatus: (['Employed', 'Seeking Employment', 'Certified', 'Seeking OJT', 'OJT In Progress'].includes(trainee?.employmentStatus)
                ? trainee.employmentStatus
                : 'Seeking Employment'),
            employer: trainee?.employer || '',
            jobTitle: trainee?.jobTitle || '',
            dateHired: trainee?.dateHired || '',
        });
        setPersonalInfoVisibility(resolveTraineeVisibility(trainee));
        setShowUploadForm(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trainee]);

    // ─── Photo upload handler ──────────────────────────────
    const handlePhotoUpload = async (file) => {
        if (!isOwnProfile || !file || !trainee?.id) return;
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
        if (!isOwnProfile || !file || !trainee?.id) return;
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

                // Also record the banner in student_documents table for central tracking
                try {
                    const { data: existing } = await supabase
                        .from('student_documents')
                        .select('id')
                        .eq('student_id', trainee.id)
                        .eq('label', 'Profile Banner')
                        .maybeSingle();

                    const docData = {
                        student_id: trainee.id,
                        category: 'document',
                        label: 'Profile Banner',
                        file_url: publicUrl,
                        file_name: file.name,
                        file_type: file.type || 'image/jpeg',
                        uploaded_at: new Date().toISOString()
                    };

                    if (existing?.id) {
                        await supabase.from('student_documents').update(docData).eq('id', existing.id);
                    } else {
                        await supabase.from('student_documents').insert(docData);
                    }
                } catch (dbErr) {
                    console.warn('Silent failure saving banner to documents table:', dbErr);
                }
            }
        } catch (err) {
            console.error('Banner upload error:', err);
            alert('Failed to upload banner.');
        } finally {
            setUploadingBanner(false);
        }
    };

    // ─── Dynamic Arrays Handlers ────────────────────────────
    const handleCertUpload = async (idx, file) => {
        if (!isOwnProfile || !file || !trainee?.id) return;
        const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
        if (!allowed.includes(file.type)) { alert('Please upload image or PDF only.'); return; }
        setUploadingCert(true);
        setUploadingIdx(idx);
        try {
            const ext = file.name.split('.').pop();
            const path = `certificates/${trainee.id}/${Date.now()}_cert_${idx}.${ext}`;
            const { error: uploadErr } = await supabase.storage
                .from('registration-uploads')
                .upload(path, file, { contentType: file.type, upsert: true });
            if (uploadErr) throw uploadErr;
            const { data: urlData } = supabase.storage.from('registration-uploads').getPublicUrl(path);
            if (urlData?.publicUrl) {
                updateTraining(idx, 'certUrl', urlData.publicUrl);
            }
        } catch (err) {
            console.error('Cert upload error:', err);
            alert('Failed to upload certificate.');
        } finally {
            setUploadingCert(false);
            setUploadingIdx(null);
        }
    };

    const updateEduc = (idx, field, val) => { const arr = [...educHistory]; arr[idx][field] = val; setEducHistory(arr); };
    const addEducObj = () => setEducHistory(prev => [...prev, { school: '', degree: '', from: '', to: '' }]);
    const removeEducIdx = (idx) => { setEducHistory(prev => prev.filter((_, i) => i !== idx)); };
    // eslint-disable-next-line no-unused-vars
    const saveEduc = async () => { if (!isOwnProfile) return; setSavingEduc(true); await updateTrainee(trainee.id, { educHistory }); setSavingEduc(false); };

    const updateWork = (idx, field, val) => { const arr = [...workExperience]; arr[idx][field] = val; setWorkExperience(arr); };
    const addWorkObj = () => setWorkExperience(prev => [{ company: '', position: '', from: '', to: '', description: '' }, ...prev]);
    const removeWorkIdx = (idx) => { setWorkExperience(prev => prev.filter((_, i) => i !== idx)); };
    // eslint-disable-next-line no-unused-vars
    const saveWork = async () => { if (!isOwnProfile) return; setSavingWork(true); await updateTrainee(trainee.id, { workExperience }); setSavingWork(false); };

    const loadResumeInfo = async () => {
        if (!trainee?.id) return;
        try {
            const res = await fetch(`/api/documents/${trainee.id}`);
            const data = await res.json();
            if (data.success) {
                const r = data.documents.find(d => d.category === 'document' && d.label === 'Resume');
                if (r) {
                    setResumeInfo(r);
                } else if (data.registrationResumeUrl) {
                    setResumeInfo({ file_url: data.registrationResumeUrl, file_name: 'Resume' });
                } else {
                    setResumeInfo(null);
                }
            }
        } catch (err) {
            console.error('Error loading resume info:', err);
        }
    };

    const openApplyModal = async (job) => {
        setApplyJob(job);
        setApplicationMessage('');
        await loadResumeInfo();
    };

    const handleSubmitApplication = async () => {
        if (!applyJob) return;
        setSubmittingApplication(true);
        const r = await applyToJob(trainee?.id, applyJob.id, {
            applicationMessage,
            resumeUrl: resumeInfo?.file_url,
            resumeName: resumeInfo?.file_name || 'Resume'
        });
        setSubmittingApplication(false);
        if (!r.success) {
            alert(r.error || 'Failed to submit application.');
            return;
        }
        setApplyJob(null);
        setApplicationMessage('');
    };

    // Fetch documents on mount
    useEffect(() => {
        if (trainee?.id) {
            // Clear current documents to provide a fresh state when switching profiles
            setDocuments([]);
            fetch(`/api/documents/${trainee.id}`)
                .then(r => {
                    if (!r.ok) throw new Error(`Server returned ${r.status}`);
                    return r.json();
                })
                .then(data => {
                    if (data.success) {
                        const resumeDoc = data.documents.find(d => d.category === 'document' && d.label === 'Resume');
                        if (resumeDoc) {
                            setResume(resumeDoc);
                        } else if (data.registrationResumeUrl) {
                            setResume({ file_url: data.registrationResumeUrl, file_name: 'Resume', label: 'Resume', category: 'document' });
                        }
                        // Filter out both Resume and Profile Banner from the main documents list
                        setDocuments((data.documents || []).filter(d => d.label !== 'Resume' && d.label !== 'Profile Banner'));
                    }
                })
                .catch(err => console.error('Fetch docs error:', err));
        }
    }, [trainee?.id]);

    const save = async () => {
        if (!isOwnProfile) return;
        // --- VALIDATION ---
        const errors = [];

        // 1. Basic Info
        if (!form.name?.trim()) errors.push('Full Name is required.');
        if (!form.email?.trim()) errors.push('Contact Email is required.');

        // 2. Birthday validation
        if (form.birthday) {
            const bd = new Date(form.birthday);
            const today = new Date();
            let age = today.getFullYear() - bd.getFullYear();
            const m = today.getMonth() - bd.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
            if (age < 15) errors.push('You must be at least 15 years old.');
        }

        // 3. Employment Info
        if (empForm.employmentStatus === 'Employed') {
            if (!empForm.employer?.trim()) errors.push('Employer/Company is required when Employed.');
            if (!empForm.jobTitle?.trim()) errors.push('Job Title is required when Employed.');
            if (!empForm.dateHired) errors.push('Date Hired is required when Employed.');
        }

        // 4. Educational History
        educHistory.forEach((edu, i) => {
            if (!String(edu.school || '').trim() || !String(edu.degree || '').trim() || !String(edu.from || '').trim() || !String(edu.to || '').trim()) {
                errors.push(`Please fill all fields for Education #${i + 1}.`);
            }
        });

        // 5. Work Experience
        workExperience.forEach((work, i) => {
            if (!String(work.company || '').trim() || !String(work.position || '').trim() || !String(work.from || '').trim() || !String(work.to || '').trim()) {
                errors.push(`Please fill all fields for Work Experience #${i + 1}.`);
            }
        });


        if (errors.length > 0) {
            alert("Please fix the following issues before saving:\n\n• " + errors.join('\n• '));
            return;
        }

        setSaving(true);
        try {
            await updateTrainee(trainee.id, {
                ...form,
                trainingStatus: (trainings && trainings.length > 0) ? trainings[0].status : (trainee?.trainingStatus || 'Student'),
                graduationYear: (trainings && trainings.length > 0 && trainings[0].status === 'Graduated') ? trainings[0].year : (trainee?.graduationYear || ''),
                personalInfoVisibility,
                ...empForm,
                educHistory,
                workExperience,
                trainings,
                interests: interestsList,
            });

            setEditing(false);
        } catch (err) {
            console.error('Save error:', err);
            alert('Failed to save profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // eslint-disable-next-line no-unused-vars
    const saveEmployment = async () => {
        if (!isOwnProfile) return;
        await updateTrainee(trainee.id, {
            ...empForm,
            monthsAfterGraduation: empForm.dateHired ? Math.round((new Date() - new Date(empForm.dateHired)) / (1000 * 60 * 60 * 24 * 30)) : null
        });
        setEditingEmployment(false);
    };

    const addSkill = () => {
        if (!newSkill.trim()) return;
        const normalized = newSkill.trim();
        const exists = (form.skills || []).some(skill => String(skill || '').trim().toLowerCase() === normalized.toLowerCase());
        if (!exists) {
            const updatedSkills = [...(form.skills || []), normalized];
            setForm({ ...form, skills: updatedSkills });
        }
        setNewSkill('');
    };

    const removeSkill = (skill) => {
        const updatedSkills = (form.skills || []).filter(s => s !== skill);
        setForm({ ...form, skills: updatedSkills });
    };

    const addInterest = () => {
        if (!newInterest.trim()) return;
        const normalized = newInterest.trim();
        const exists = interestsList.some(interest => String(interest || '').trim().toLowerCase() === normalized.toLowerCase());
        if (!exists) {
            const updated = [...interestsList, normalized];
            setInterestsList(updated);
        }
        setNewInterest('');
    };

    const addRecommendedSkill = (value) => {
        const normalized = String(value || '').trim();
        if (!normalized) return;
        const exists = (form.skills || []).some(skill => String(skill || '').trim().toLowerCase() === normalized.toLowerCase());
        if (exists) return;
        setForm({ ...form, skills: [...(form.skills || []), normalized] });
    };

    const addRecommendedInterest = (value) => {
        const normalized = String(value || '').trim();
        if (!normalized) return;
        const exists = interestsList.some(interest => String(interest || '').trim().toLowerCase() === normalized.toLowerCase());
        if (exists) return;
        setInterestsList([...interestsList, normalized]);
    };

    const removeInterest = (interest) => {
        const updated = interestsList.filter(i => i !== interest);
        setInterestsList(updated);
    };

    const personalInfoFields = [
        { label: 'Full Name', key: 'name', type: 'text', required: true, maxLength: 100 },
        { label: 'Program Taken', key: 'program', type: 'select' },
        { label: 'Contact Email', key: 'email', type: 'email', required: true },
        { label: 'Address', key: 'address', type: 'text', maxLength: 150 },
        { label: 'Birthday', key: 'birthday', type: 'date' },
        { label: 'Gender', key: 'gender', type: 'select', options: ['Male', 'Female', 'Other'] },
    ];

    const togglePersonalInfoVisibility = (fieldKey) => {
        setPersonalInfoVisibility(prev => (
            prev.includes(fieldKey)
                ? prev.filter(key => key !== fieldKey)
                : [...prev, fieldKey]
        ));
    };

    const handleDocUpload = async () => {
        if (!isOwnProfile) return;
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
                    setDocuments(prev => Array.isArray(prev) ? [result.document, ...prev] : [result.document]);
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
        if (!isOwnProfile) return;

        try {
            const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
                setDocuments(prev => Array.isArray(prev) ? prev.filter(d => d.id !== docId) : []);
                alert('Document successfully deleted.');
            } else {
                alert(`Delete failed: ${result.error}`);
            }
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to connect to the server to delete document.');
        }
    };

    const statusColors = {
        'Employed': '#057642',          // 🟢 green
        'Seeking Employment': '#0a66c2', // 🔵 blue
        'Certified': '#7c3aed',          // 🟣 purple
        'Seeking OJT': '#ea580c',        // 🟠 true orange
        'OJT In Progress': '#ca8a04',    // 🟡 yellow
        // Legacy fallbacks
        'Not Employed': '#0a66c2',
        'Unemployed': '#0a66c2',
    };
    const visiblePersonalInfo = new Set(resolveTraineeVisibility(trainee));
    const showHeaderName = isOwnProfile || visiblePersonalInfo.has('name');
    const showHeaderAddress = isOwnProfile || visiblePersonalInfo.has('address');
    const showHeaderEmail = isOwnProfile || visiblePersonalInfo.has('email');
    // eslint-disable-next-line no-unused-vars
    const isHeaderAddressHiddenFromOthers = isOwnProfile && !visiblePersonalInfo.has('address');
    // eslint-disable-next-line no-unused-vars
    const isHeaderEmailHiddenFromOthers = isOwnProfile && !visiblePersonalInfo.has('email');
    const headerLocationParts = [];

    if (showHeaderAddress && trainee?.address) {
        headerLocationParts.push(trainee.address);
    }

    if (trainee?.graduationYear) {
        headerLocationParts.push(`Class of ${trainee.graduationYear}`);
    }

    // eslint-disable-next-line no-unused-vars
    const handleResumeUpload = async (file) => {
        if (!isOwnProfile) return;
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

    if (loadingViewedProfile) {
        return (
            <div className="ln-page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 240 }}>
                <Loader size={30} style={{ animation: 'ocr-spin 1s linear infinite', opacity: 0.4 }} />
            </div>
        );
    }

    if (!trainee) {
        return (
            <div className="ln-page-content">
                <div className="ln-empty-state">
                    <User size={40} />
                    <h3>Profile not found</h3>
                    {onBack && <button className="ln-btn ln-btn-outline" onClick={onBack}>Go Back</button>}
                </div>
            </div>
        );
    }

    return (
        <form className="ln-profile-page" style={{ position: 'relative' }} onSubmit={(e) => { e.preventDefault(); if (isOwnProfile && editing) save(); }}>
            {!isOwnProfile && onBack && (
                <div style={{ marginBottom: 12 }}>
                    <button type="button" className="ln-btn ln-btn-outline" onClick={onBack}>
                        <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} /> Back
                    </button>
                </div>
            )}
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
            <input ref={certInputRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }}
                onChange={e => { if (uploadingIdx !== null) handleCertUpload(uploadingIdx, e.target.files[0]); e.target.value = ''; }} />

            {/* Confirm Dialog */}
            {confirmDialog.open && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} onClick={closeConfirm}>
                    <div style={{
                        background: 'white', borderRadius: 14, padding: '28px 32px', minWidth: 340, maxWidth: 420,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.25)', textAlign: 'center',
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ marginBottom: 20 }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: '50%', background: '#fef2f2',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
                            }}>
                                <Trash2 size={22} color="#cc1016" />
                            </div>
                            <p style={{ fontSize: 15, color: '#1e293b', fontWeight: 500, margin: 0, lineHeight: 1.5 }}>{confirmDialog.message}</p>
                        </div>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                            <button type="button" onClick={closeConfirm} style={{
                                padding: '9px 24px', borderRadius: 8, border: '1px solid #d1d5db',
                                background: 'white', color: '#475569', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                            }}>Cancel</button>
                            <button type="button" onClick={() => { confirmDialog.onConfirm(); closeConfirm(); }} style={{
                                padding: '9px 24px', borderRadius: 8, border: 'none',
                                background: '#cc1016', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                            }}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Header Card */}
            <div className="ln-card ln-profile-header-card">
                {/* Banner Background with Upload */}
                <div className="ln-profile-header-banner" style={{
                    height: 160,
                    backgroundImage: trainee?.bannerUrl ? `url(${trainee.bannerUrl})` : 'none',
                    backgroundColor: trainee?.bannerUrl ? 'transparent' : '#f3f2ef',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderBottom: '1px solid #e2e8f0',
                    position: 'relative'
                }}>
                    {isOwnProfile && (
                        <button type="button" className="ln-btn-sm" style={{
                            position: 'absolute', top: 12, right: 12,
                            background: 'rgba(255,255,255,0.9)', color: '#0a66c2',
                            border: 'none', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6
                        }} onClick={() => bannerInputRef.current?.click()}>
                            {uploadingBanner ? <Loader size={12} style={{ animation: 'ocr-spin 0.8s linear infinite' }} /> : <Camera size={14} />}
                            {trainee?.bannerUrl ? 'Change Banner' : 'Add Banner'}
                        </button>
                    )}
                </div>
                <div className="ln-profile-header-body">
                    <div className="ln-profile-header-avatar" style={{
                        position: 'relative', cursor: isOwnProfile ? 'pointer' : 'default',
                        ...(trainee?.photo ? {
                            backgroundImage: `url(${trainee.photo})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            fontSize: 0,
                        } : {})
                    }} onClick={() => { if (isOwnProfile) profilePicRef.current?.click(); }}>
                        {!trainee?.photo && initials}
                        {isOwnProfile && (
                            <div style={{
                                position: 'absolute', bottom: 0, right: 0,
                                width: 28, height: 28, borderRadius: '50%',
                                background: '#0a66c2', border: '2px solid white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Camera size={13} color="white" />
                            </div>
                        )}
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
                                <h1 className="ln-profile-header-name" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    {showHeaderName ? trainee?.name : 'Trainee'}
                                    {trainee?.employmentStatus && (
                                        <span className="ln-badge" style={{
                                            background: statusColors[trainee.employmentStatus] || '#0a66c2',
                                            color: 'white', fontSize: 11, padding: '2px 10px', borderRadius: 12, fontWeight: 700
                                        }}>
                                            {trainee.employmentStatus}
                                        </span>
                                    )}
                                </h1>
                                <p className="ln-profile-header-headline">
                                    {trainee?.trainingStatus === 'Graduated' ? 'TESDA Graduate' : 'TESDA Trainee'} &bull;
                                    {trainings.filter(t => t.status === 'Graduated').length > 0
                                        ? ` ${trainings.filter(t => t.status === 'Graduated').length} Completed Program${trainings.filter(t => t.status === 'Graduated').length > 1 ? 's' : ''}`
                                        : ' No completed programs yet'}
                                </p>
                                {headerLocationParts.length > 0 && (
                                    <p className="ln-profile-header-loc" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {showHeaderAddress && trainee?.address && <MapPin size={14} />}
                                        <span>{headerLocationParts.join(' • ')}</span>
                                    </p>
                                )}
                                {showHeaderEmail && trainee?.email && (
                                    <p className="ln-profile-header-contact" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                        <span>{trainee?.email}</span>
                                    </p>
                                )}
                            </div>
                            {isOwnProfile && (!editing ? (
                                <button type="button" className="ln-btn ln-btn-primary" onClick={() => setEditing(true)} disabled={saving}>
                                    <Edit size={15} /> Edit Profile
                                </button>
                            ) : (
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button type="button" className="ln-btn" style={{ background: '#e2e8f0', color: '#475569' }} onClick={() => {
                                        setForm({ ...trainee });
                                        setTrainingForm({ trainingStatus: trainee?.trainingStatus || 'Student', graduationYear: trainee?.graduationYear || '' });
                                        setEmpForm({ employmentStatus: (trainee?.employmentStatus === 'Unemployed' ? 'Not Employed' : trainee?.employmentStatus) || 'Not Employed', employer: trainee?.employer || '', jobTitle: trainee?.jobTitle || '', dateHired: trainee?.dateHired || '' });
                                        setEducHistory(trainee?.educHistory || []);
                                        setWorkExperience(trainee?.workExperience || []);
                                        setInterestsList(trainee?.interests || []);
                                        setPersonalInfoVisibility(resolveTraineeVisibility(trainee));
                                        setEditing(false);
                                    }} disabled={saving}>
                                        <X size={15} /> Cancel
                                    </button>
                                    <button type="submit" className="ln-btn ln-btn-success" disabled={saving}>
                                        {saving ? (
                                            <React.Fragment>
                                                <Loader size={15} style={{ animation: 'ocr-spin 0.8s linear infinite' }} /> Saving...
                                            </React.Fragment>
                                        ) : (
                                            <React.Fragment>
                                                <CheckCircle size={15} /> Save Changes
                                            </React.Fragment>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                        {/* Resume section removed as per cleanup requirements */}
                    </div>
                </div>
            </div>

            <div className="ln-profile-tabs" style={{ display: 'flex', gap: 24, padding: '0 16px', marginBottom: 16, borderBottom: '1px solid #e2e8f0', background: 'white' }}>
                {(isEmployer ? ['About', 'Training'] : ['About', 'Training', 'Match Insights', 'Saved'].concat(isOwnProfile ? ['Activity'] : [])).map(tab => (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '12px 4px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === tab ? '2px solid #0a66c2' : '2px solid transparent',
                            color: activeTab === tab ? '#0a66c2' : '#64748b',
                            fontWeight: 600,
                            fontSize: 14.5,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                        }}
                    >
                        {tab}
                        {tab === 'Saved' && (trainee?.savedOpportunities?.length > 0) && (
                            <span style={{ fontSize: 11, background: '#e2e8f0', padding: '2px 6px', borderRadius: 10, color: '#475569' }}>
                                {trainee.savedOpportunities.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div className="ln-profile-single-col">
                <div className="ln-profile-main">
                    {activeTab === 'About' && (
                        <React.Fragment>
                            {/* Professional Summary / Bio */}
                            <div className="ln-card">
                                <div className="ln-section-header">
                                    <h3>Professional Summary</h3>
                                </div>
                                <div style={{ padding: '0 20px 20px' }}>
                                    {editing ? (
                                        <textarea
                                            className="form-input"
                                            placeholder="Share a brief overview of your professional background, skills, and career goals..."
                                            rows={4}
                                            value={form.bio || ''}
                                            onChange={e => setForm({ ...form, bio: e.target.value })}
                                            style={{ resize: 'vertical', fontSize: 14 }}
                                        />
                                    ) : (
                                        <div style={{
                                            fontSize: 14.5,
                                            color: trainee?.bio ? '#1e293b' : '#64748b',
                                            lineHeight: 1.6,
                                            whiteSpace: 'pre-wrap',
                                            fontStyle: trainee?.bio ? 'normal' : 'italic'
                                        }}>
                                            {trainee?.bio || (isOwnProfile ? "No professional summary added yet. Click 'Edit Profile' to add one." : "No professional summary provided.")}
                                        </div>
                                    )}
                                </div>
                            </div>


                            {/* Personal Information Section */}
                            <div className="ln-card">
                                <div className="ln-section-header"><h3>Personal Information</h3></div>
                                <div className="ln-info-grid">
                                    {(function () {
                                        const visibleSet = new Set(resolveTraineeVisibility(trainee));
                                        const fieldsToRender = personalInfoFields.filter(field => isOwnProfile || visibleSet.has(field.key));
                                        if (fieldsToRender.length === 0) {
                                            return <div style={{ gridColumn: '1 / -1', fontSize: 13, color: '#94a3b8' }}>This user chose to hide personal information.</div>;
                                        }
                                        return fieldsToRender.map(f => {
                                            const isVisible = personalInfoVisibility.includes(f.key);
                                            return (
                                                <div key={f.key} className="ln-info-item">
                                                    <label className="ln-info-label">
                                                        {f.label}{f.required && editing && <span style={{ color: '#cc1016', marginLeft: 4 }}>*</span>}
                                                    </label>
                                                    {editing ? (
                                                        f.type === 'select' ? (
                                                            f.key === 'program' ? (
                                                                <select className="form-select" value={form.programId || ''} onChange={e => {
                                                                    const p = (programs || []).find(p => String(p.id) === e.target.value);
                                                                    setForm({ ...form, programId: p?.id || '', program: p?.name || '' });
                                                                }}>
                                                                    <option value="">Select Program</option>
                                                                    {(programs || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                                </select>
                                                            ) : (
                                                                <select className="form-select" value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })}>
                                                                    {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                                                                </select>
                                                            )
                                                        ) : (
                                                            <input type={f.type} className="form-input" maxLength={f.maxLength} value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                                                        )
                                                    ) : (
                                                        <div className="ln-info-value">{trainee?.[f.key] || '—'}</div>
                                                    )}
                                                    {isOwnProfile && editing && (
                                                        <label style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: isVisible ? '#166534' : '#64748b', fontWeight: 600 }}>
                                                            <input type="checkbox" checked={isVisible} onChange={() => togglePersonalInfoVisibility(f.key)} style={{ width: 14, height: 14 }} />
                                                            {isVisible ? 'Shown to others' : 'Hidden from others'}
                                                        </label>
                                                    )}
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>

                            {/* Career Status Section */}
                            <div className="ln-card">
                                <div className="ln-section-header"><h3>Career Status</h3></div>
                                <div className="ln-info-grid">
                                    <div className="ln-info-item">
                                        <label className="ln-info-label">Status</label>
                                        {editing ? (
                                            <select className="form-select" value={empForm.employmentStatus} onChange={e => setEmpForm({ ...empForm, employmentStatus: e.target.value })}>
                                                <option value="Employed">🟢 Employed</option>
                                                <option value="Seeking Employment">🔵 Seeking Employment</option>
                                                <option value="Certified">🟣 Certified</option>
                                                <option value="Seeking OJT">🟠 Seeking OJT</option>
                                                <option value="OJT In Progress">🟡 OJT In Progress</option>
                                            </select>
                                        ) : (
                                            <span className="ln-badge" style={{ fontSize: 13, background: statusColors[trainee?.employmentStatus] || '#0a66c2', color: 'white' }}>
                                                {trainee?.employmentStatus || 'Seeking Employment'}
                                            </span>
                                        )}
                                    </div>
                                    {(editing ? empForm.employmentStatus === 'Employed' : trainee?.employmentStatus === 'Employed') && (
                                        <React.Fragment>
                                            <div className="ln-info-item">
                                                <label className="ln-info-label">Employer / Company{editing && <span style={{ color: '#cc1016', marginLeft: 4 }}>*</span>}</label>
                                                {editing ? <input type="text" required className="form-input" value={empForm.employer} onChange={e => setEmpForm({ ...empForm, employer: e.target.value })} placeholder="Company name" /> : <div className="ln-info-value">{trainee?.employer || '—'}</div>}
                                            </div>
                                            <div className="ln-info-item">
                                                <label className="ln-info-label">Job Title{editing && <span style={{ color: '#cc1016', marginLeft: 4 }}>*</span>}</label>
                                                {editing ? <input type="text" required className="form-input" value={empForm.jobTitle} onChange={e => setEmpForm({ ...empForm, jobTitle: e.target.value })} placeholder="Your position" /> : <div className="ln-info-value">{trainee?.jobTitle || '—'}</div>}
                                            </div>
                                            <div className="ln-info-item">
                                                <label className="ln-info-label">Date Hired{editing && <span style={{ color: '#cc1016', marginLeft: 4 }}>*</span>}</label>
                                                {editing ? <input type="date" required className="form-input" value={empForm.dateHired} onChange={e => setEmpForm({ ...empForm, dateHired: e.target.value })} /> : <div className="ln-info-value">{trainee?.dateHired || '—'}</div>}
                                            </div>
                                        </React.Fragment>
                                    )}
                                </div>
                            </div>

                            {/* Educational History Section */}
                            <div className="ln-card">
                                <div className="ln-section-header">
                                    <h3>Educational History</h3>
                                    {editing && <button type="button" className="ln-btn-sm ln-btn-primary" onClick={addEducObj}><Plus size={12} /> Add</button>}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '0 16px 20px' }}>
                                    {(editing ? educHistory : [...educHistory].sort((a, b) => (Number(b.to) || 0) - (Number(a.to) || 0)))
                                        .filter((_, i) => editing || showAllEduc || i === 0)
                                        .map((edu, i) => (
                                            <div key={i} style={{ padding: '20px', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                                                            <GraduationCap size={20} color="#64748b" />
                                                        </div>
                                                        <h4 style={{ margin: 0, fontSize: 13, color: '#475569', fontWeight: 600 }}>{editing ? `Education Entry #${i + 1}` : 'Education Entry'}</h4>
                                                    </div>
                                                    {editing && <button type="button" className="ln-link-btn" style={{ color: '#cc1016', fontSize: 12, padding: 0 }} onClick={(e) => { e.preventDefault(); showConfirm('Are you sure you want to remove this educational history?', () => removeEducIdx(i)); }}><Trash2 size={13} /> Remove</button>}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                                        <div className="ln-info-item" style={{ gridColumn: '1 / -1' }}>
                                                            <label className="ln-info-label" style={{ fontWeight: 700 }}>School / University{editing && <span style={{ color: '#cc1016', marginLeft: 4 }}>*</span>}</label>
                                                            {editing ? <input type="text" required className="form-input" placeholder="Enter school name" maxLength={100} value={edu.school || ''} onChange={e => updateEduc(i, 'school', e.target.value)} /> : <div className="ln-info-value" style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{edu.school || '—'}</div>}
                                                        </div>
                                                        <div className="ln-info-item" style={{ gridColumn: '1 / -1' }}>
                                                            <label className="ln-info-label" style={{ fontWeight: 700 }}>Degree / Program{editing && <span style={{ color: '#cc1016', marginLeft: 4 }}>*</span>}</label>
                                                            {editing ? <input type="text" required className="form-input" placeholder="e.g. Bachelor of Science in IT" maxLength={100} value={edu.degree || ''} onChange={e => updateEduc(i, 'degree', e.target.value)} /> : <div className="ln-info-value" style={{ fontSize: 14, color: '#475569' }}>{edu.degree || '—'}</div>}
                                                        </div>
                                                        <div className="ln-info-item">
                                                            <label className="ln-info-label" style={{ fontWeight: 700 }}>Year From{editing && <span style={{ color: '#cc1016', marginLeft: 4 }}>*</span>}</label>
                                                            {editing ? <input type="number" min="1950" max="2099" required className="form-input" placeholder="YYYY" maxLength={4} onInput={e => { if (e.target.value.length > 4) e.target.value = e.target.value.slice(0, 4); }} value={edu.from || ''} onChange={e => updateEduc(i, 'from', e.target.value)} /> : <div className="ln-info-value" style={{ fontSize: 13, color: '#64748b' }}>{edu.from ? `Started in ${edu.from}` : '—'}</div>}
                                                        </div>
                                                        <div className="ln-info-item">
                                                            <label className="ln-info-label" style={{ fontWeight: 700 }}>Year To (or expected){editing && <span style={{ color: '#cc1016', marginLeft: 4 }}>*</span>}</label>
                                                            {editing ? <input type="number" min="1950" max="2099" required className="form-input" placeholder="YYYY" maxLength={4} onInput={e => { if (e.target.value.length > 4) e.target.value = e.target.value.slice(0, 4); }} value={edu.to || ''} onChange={e => updateEduc(i, 'to', e.target.value)} /> : <div className="ln-info-value" style={{ fontSize: 13, color: '#64748b' }}>{edu.to ? `Graduated in ${edu.to}` : '—'}</div>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                    {!editing && educHistory.length > 1 && (
                                        <button
                                            type="button"
                                            className="ln-link-btn"
                                            style={{ alignSelf: 'center', marginTop: -8, fontWeight: 600 }}
                                            onClick={() => setShowAllEduc(!showAllEduc)}
                                        >
                                            {showAllEduc ? 'See Less' : `See More (${educHistory.length - 1} more)`}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Work Experience Section */}
                            <div className="ln-card">
                                <div className="ln-section-header">
                                    <h3>Work Experience</h3>
                                    {editing && <button type="button" className="ln-btn-sm ln-btn-primary" onClick={addWorkObj}><Plus size={12} /> Add</button>}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '0 16px 20px' }}>
                                    {(editing ? workExperience : [...workExperience].sort((a, b) => {
                                        const dateA = a.to === 'Present' || !a.to ? new Date() : new Date(a.to);
                                        const dateB = b.to === 'Present' || !b.to ? new Date() : new Date(b.to);
                                        return dateB - dateA;
                                    }))
                                        .filter((_, i) => editing || showAllWork || i === 0)
                                        .map((work, i) => (
                                            <div key={i} style={{ padding: '20px', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e0f2fe' }}>
                                                            <Briefcase size={20} color="#0369a1" />
                                                        </div>
                                                        <h4 style={{ margin: 0, fontSize: 13, color: '#475569', fontWeight: 600 }}>{editing ? `Work Entry #${workExperience.length - i}` : 'Work Experience'}</h4>
                                                    </div>
                                                    {editing && <button type="button" className="ln-link-btn" style={{ color: '#cc1016', fontSize: 12, padding: 0 }} onClick={(e) => { e.preventDefault(); showConfirm('Are you sure you want to remove this work experience?', () => removeWorkIdx(i)); }}><Trash2 size={13} /> Remove</button>}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                                        <div className="ln-info-item" style={{ gridColumn: '1 / -1' }}>
                                                            <label className="ln-info-label" style={{ fontWeight: 700 }}>Company / Organization{editing && <span style={{ color: '#cc1016', marginLeft: 4 }}>*</span>}</label>
                                                            {editing ? <input type="text" required className="form-input" placeholder="e.g. Google, TESDA, Local Shop" maxLength={100} value={work.company || ''} onChange={e => updateWork(i, 'company', e.target.value)} /> : <div className="ln-info-value" style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{work.company || '—'}</div>}
                                                        </div>
                                                        <div className="ln-info-item" style={{ gridColumn: '1 / -1' }}>
                                                            <label className="ln-info-label" style={{ fontWeight: 700 }}>Position / Role{editing && <span style={{ color: '#cc1016', marginLeft: 4 }}>*</span>}</label>
                                                            {editing ? <input type="text" required className="form-input" placeholder="e.g. IT Technician, Admin Assistant" maxLength={50} value={work.position || ''} onChange={e => updateWork(i, 'position', e.target.value)} /> : <div className="ln-info-value" style={{ fontSize: 14, color: '#475569' }}>{work.position || '—'}</div>}
                                                        </div>
                                                        <div className="ln-info-item">
                                                            <label className="ln-info-label" style={{ fontWeight: 700 }}>Start Date{editing && <span style={{ color: '#cc1016', marginLeft: 4 }}>*</span>}</label>
                                                            {editing ? <input type="date" required className="form-input" value={work.from || ''} onChange={e => updateWork(i, 'from', e.target.value)} /> : <div className="ln-info-value" style={{ fontSize: 13, color: '#64748b' }}>{work.from || '—'}</div>}
                                                        </div>
                                                        <div className="ln-info-item">
                                                            <label className="ln-info-label" style={{ fontWeight: 700 }}>End Date{editing && <span style={{ color: '#cc1016', marginLeft: 4 }}>*</span>}</label>
                                                            {editing ? <input type="date" required className="form-input" value={work.to || ''} onChange={e => updateWork(i, 'to', e.target.value)} /> : <div className="ln-info-value" style={{ fontSize: 13, color: '#64748b' }}>{work.to || 'Present'}</div>}
                                                        </div>
                                                        <div className="ln-info-item" style={{ gridColumn: '1 / -1' }}>
                                                            <label className="ln-info-label" style={{ fontWeight: 700 }}>Description / Contributions</label>
                                                            {editing ? (
                                                                <textarea
                                                                    className="form-input"
                                                                    placeholder="Briefly describe your role, responsibilities, and achievements..."
                                                                    rows={3}
                                                                    style={{ resize: 'vertical' }}
                                                                    value={work.description || ''}
                                                                    onChange={e => updateWork(i, 'description', e.target.value)}
                                                                />
                                                            ) : (
                                                                <div className="ln-info-value" style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                                                                    {work.description || 'No description provided.'}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                    {!editing && workExperience.length > 1 && (
                                        <button
                                            type="button"
                                            className="ln-link-btn"
                                            style={{ alignSelf: 'center', marginTop: -8, fontWeight: 600 }}
                                            onClick={() => setShowAllWork(!showAllWork)}
                                        >
                                            {showAllWork ? 'See Less' : `See More (${workExperience.length - 1} more)`}
                                        </button>
                                    )}
                                    {!editing && workExperience.length === 0 && (
                                        <EmptyState
                                            illustration={BriefcaseIllustration}
                                            title="No work experience yet"
                                            description="Adding your past roles and internships helps partners understand your professional background."
                                        />
                                    )}
                                </div>
                            </div>

                        </React.Fragment>
                    )}

                    {/* Training Tab */}
                    {activeTab === 'Training' && (
                        <div className="ln-card">
                            <div className="ln-section-header">
                                <h3>TESDA Trainings and Certifications</h3>
                                {editing && <button type="button" className="ln-btn-sm ln-btn-primary" onClick={addTrainingObj}><Plus size={12} /> Add Program</button>}
                            </div>
                            <div style={{ padding: '0 20px 20px' }}>
                                {/* Consolidated Programs List */}
                                {trainings.map((t, i) => (
                                    <div key={i} style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, position: 'relative' }}>
                                        <div style={{ flex: 1, width: '100%' }}>
                                            {editing ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(160px, 2fr) 100px 130px 90px', gap: 12 }}>
                                                        <div>
                                                            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>Program Taken</label>
                                                            <select className="form-select" value={(programs || []).find(p => p.name === t.program)?.id || ''} onChange={e => {
                                                                const p = (programs || []).find(p => String(p.id) === e.target.value);
                                                                updateTraining(i, 'program', p?.name || '');
                                                                if (p?.nc_level) updateTraining(i, 'ncLevel', p.nc_level);
                                                            }}>
                                                                <option value="">Select Program</option>
                                                                {(programs || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>NC Level</label>
                                                            <select className="form-select" value={t.ncLevel || ''} onChange={e => updateTraining(i, 'ncLevel', e.target.value)}>
                                                                <option value="">N/A</option>
                                                                <option value="NC I">NC I</option>
                                                                <option value="NC II">NC II</option>
                                                                <option value="NC III">NC III</option>
                                                                <option value="NC IV">NC IV</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>Status</label>
                                                            <select className="form-select" value={t.status || 'Student'} onChange={e => updateTraining(i, 'status', e.target.value)}>
                                                                <option value="Student">In Training</option>
                                                                <option value="Graduated">Completed</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>Year</label>
                                                            <input type="number" min="1950" max="2099" className="form-input" placeholder="YYYY" maxLength={4} onInput={e => { if (e.target.value.length > 4) e.target.value = e.target.value.slice(0, 4); }} value={t.year || ''} onChange={e => updateTraining(i, 'year', e.target.value)} />
                                                        </div>
                                                    </div>

                                                    {/* NEW: Combined 13-Digit Code & Upload Section for Graduates */}
                                                    {t.status === 'Graduated' && (
                                                        <div style={{ padding: '14px', background: '#fff', borderRadius: 8, border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>

                                                            {/* 13-Digit Code Input */}
                                                            <div>
                                                                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>13-Digit Certificate Number (Optional)</label>
                                                                <input
                                                                    type="text"
                                                                    maxLength="13"
                                                                    className="form-input"
                                                                    placeholder="e.g. 1234567890123"
                                                                    value={t.certNumber || ''}
                                                                    onChange={e => updateTraining(i, 'certNumber', e.target.value.replace(/\D/g, ''))}
                                                                    style={{ fontFamily: 'monospace', letterSpacing: '1px' }}
                                                                />
                                                            </div>

                                                            {/* Proof Upload Area */}
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                    <Award size={16} color="#0a66c2" />
                                                                    <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Certificate Proof (QR/Image)</span>
                                                                </div>
                                                                {t.certUrl ? (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                                        <a href={t.certUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#0a66c2', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
                                                                            <FileText size={14} /> View Document
                                                                        </a>
                                                                        <button type="button" className="ln-link-btn" style={{ color: '#cc1016', padding: 0 }} onClick={() => updateTraining(i, 'certUrl', '')}><Trash2 size={13} /></button>
                                                                    </div>
                                                                ) : (
                                                                    <button type="button" className="ln-btn-sm ln-btn-outline" disabled={uploadingCert && uploadingIdx === i} onClick={() => { setUploadingIdx(i); certInputRef.current?.click(); }} style={{ padding: '4px 12px', fontSize: 11 }}>
                                                                        {uploadingCert && uploadingIdx === i ? ' Uploading...' : ' Upload Proof'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                                                    <div style={{ flex: 1, minWidth: 0, paddingBottom: (t.status === 'Graduated' && (t.certUrl || t.certNumber)) ? '36px' : '0' }}>
                                                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 16, marginBottom: 4 }}>{t.program}</div>
                                                        <div style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <Award size={14} /> {t.ncLevel}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                                                        <span className={`ln-badge ${t.status === 'Graduated' ? 'ln-badge-green' : 'ln-badge-blue'}`} style={{ fontSize: 11 }}>
                                                            {t.status === 'Graduated' ? 'Completed' : 'In Training'}
                                                        </span>
                                                        <div style={{ fontWeight: 600, fontSize: 13, color: '#475569' }}>{t.year || '—'}</div>
                                                    </div>

                                                    {/* Read-Only View for 13-Digit Code & Document Link */}
                                                    {t.status === 'Graduated' && (t.certUrl || t.certNumber) && (
                                                        <div style={{ position: 'absolute', bottom: 12, left: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
                                                            {t.certNumber && (
                                                                <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, background: '#f0fdf4', padding: '4px 10px', borderRadius: 6, border: '1px solid #bbf7d0', fontFamily: 'monospace' }}>
                                                                    <ShieldCheck size={14} />
                                                                    {t.certNumber.replace(/(\d{3})(\d{4})(\d{6})/, '$1-$2-$3')}
                                                                </div>
                                                            )}
                                                            {t.certUrl && (
                                                                <button type="button" onClick={() => setPreviewImage(t.certUrl)} style={{ fontSize: 12, color: '#0a66c2', fontWeight: 600, border: '1px solid #bae6fd', background: '#f0f9ff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6 }}>
                                                                    <FileText size={14} /> View Certificate Proof (QR)
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {editing && <button type="button" onClick={() => removeTrainingIdx(i)} style={{ marginLeft: 16, background: 'none', border: 'none', color: '#cc1016', cursor: 'pointer', marginTop: 4 }}><Trash2 size={16} /></button>}
                                    </div>
                                ))}
                                {!editing && trainings.length === 0 && (
                                    <EmptyState
                                        illustration={TrophyIllustration}
                                        title="No achievements yet"
                                        description="Start adding your TESDA trainings, certifications, and awards to showcase your expertise."
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Match Insights Tab */}
                    {activeTab === 'Match Insights' && (
                        <React.Fragment>
                            {/* Profile Strength Score */}
                            <div className="ln-card" style={{ marginBottom: 16 }}>
                                <div className="ln-section-header"><h3>Profile Strength</h3></div>
                                <div style={{ padding: '0 24px 24px' }}>
                                    {(() => {
                                        const checks = [
                                            { label: 'Profile Photo', done: Boolean(trainee?.photo) },
                                            { label: 'Bio / About Me', done: Boolean(trainee?.bio && trainee.bio.trim().length > 10) },
                                            { label: 'Skills (3+)', done: (trainee?.skills || []).length >= 3 },
                                            { label: 'Education History', done: (trainee?.educHistory || []).length > 0 },
                                            { label: 'Work Experience', done: (trainee?.workExperience || []).length > 0 },
                                            { label: 'Training / Program', done: Boolean(trainee?.program) },
                                            { label: 'Contact Info (Email)', done: Boolean(trainee?.email) },
                                            { label: 'Interests (2+)', done: (trainee?.interests || []).length >= 2 },
                                        ];
                                        const score = Math.round((checks.filter(c => c.done).length / checks.length) * 100);
                                        const color = score >= 80 ? '#057642' : score >= 50 ? '#d97706' : '#dc2626';
                                        const label = score >= 80 ? 'Strong' : score >= 50 ? 'Moderate' : 'Needs Improvement';
                                        return (
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                                                    <div style={{
                                                        width: 80, height: 80, borderRadius: '50%',
                                                        background: `conic-gradient(${color} ${score * 3.6}deg, #e2e8f0 0deg)`,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                                    }}>
                                                        <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20, color }}>
                                                            {score}%
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{label}</div>
                                                        <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Complete your profile to improve your match rate with recruiters.</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                    {checks.map((c, i) => (
                                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: c.done ? '#f0fdf4' : '#fef2f2' }}>
                                                            <CheckCircle size={16} color={c.done ? '#057642' : '#d1d5db'} />
                                                            <span style={{ fontSize: 13, fontWeight: 500, color: c.done ? '#166534' : '#991b1b' }}>{c.label}</span>
                                                            {!c.done && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#dc2626', fontWeight: 600 }}>Missing</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Skills vs. Demand */}
                            <div className="ln-card">
                                <div className="ln-section-header"><h3>Skills vs. Industry Demand</h3></div>
                                <div style={{ padding: '0 24px 24px' }}>
                                    <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                                        See how your skills compare to the most in-demand competencies from current job postings.
                                    </div>
                                    {(() => {
                                        const mySkills = (trainee?.skills || []).map(s => String(s).toLowerCase().trim());
                                        // Build demand from getSkillsDemand context function
                                        const demandData = getSkillsDemand();
                                        const demandMap = {};
                                        demandData.forEach(d => {
                                            demandMap[String(d.skill).toLowerCase().trim()] = d.count;
                                        });
                                        // Merge with trainee skills
                                        mySkills.forEach(s => { if (!demandMap[s]) demandMap[s] = 0; });
                                        const allSkills = Object.entries(demandMap)
                                            .sort((a, b) => b[1] - a[1])
                                            .slice(0, 12);
                                        const maxCount = Math.max(1, ...allSkills.map(([, c]) => c));

                                        if (allSkills.length === 0) {
                                            return (
                                                <div className="ln-empty-widget" style={{ padding: 24 }}>
                                                    <Award size={32} style={{ opacity: 0.25 }} />
                                                    <p>Add skills to your profile to see how they match with industry demand.</p>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                {allSkills.map(([skill, count]) => {
                                                    const hasSkill = mySkills.includes(skill);
                                                    const pct = Math.round((count / maxCount) * 100);
                                                    return (
                                                        <div key={skill}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                                <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                    {skill}
                                                                    {hasSkill && <CheckCircle size={13} color="#057642" />}
                                                                </span>
                                                                <span style={{ fontSize: 11, color: '#64748b' }}>{count > 0 ? `${count} posting${count === 1 ? '' : 's'}` : 'Not in demand'}</span>
                                                            </div>
                                                            <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                                                                <div style={{
                                                                    height: '100%',
                                                                    width: `${pct}%`,
                                                                    background: hasSkill ? 'linear-gradient(90deg, #0a66c2, #057642)' : '#94a3b8',
                                                                    borderRadius: 4,
                                                                    transition: 'width 0.5s ease'
                                                                }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: 12, color: '#64748b' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 12, height: 8, borderRadius: 2, background: 'linear-gradient(90deg, #0a66c2, #057642)' }} /> Your Skill + In Demand</span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 12, height: 8, borderRadius: 2, background: '#94a3b8' }} /> In Demand (not on your profile)</span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </React.Fragment>
                    )}

                    {activeTab === 'Activity' && isOwnProfile && (
                        <ProfileActivityTab profileId={trainee.id} profileType="trainee" isOwnProfile={isOwnProfile} />
                    )}

                    {/* Saved Tab */}
                    {activeTab === 'Saved' && (
                        <div className="ln-card">
                            <div className="ln-section-header"><h3>Saved Items</h3></div>
                            <div style={{ padding: '0 20px 20px' }}>
                                <SavedItemsView
                                    userId={trainee.id}
                                    userType="trainee"
                                    onApply={openApplyModal}
                                    onOpenBulletin={(p) => openBulletinModal(p, 'inquire')}
                                />
                            </div>
                        </div>
                    )}
                </div> {/* ln-profile-main */}
                {/* ── Section Group: More About Me ──────────────── */}
                {activeTab === 'About' && (
                    <React.Fragment>
                        <div className="ln-section-group-divider">
                            <span>More About Me</span>
                        </div>

                        {/* Skills + Interests: 2-up side-by-side grid */}
                        <div className="ln-skills-interests-row">
                            {/* Skills */}
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
                                            {isOwnProfile && editing && <button type="button" onClick={() => removeSkill(skill)} style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                padding: 0, display: 'flex', color: '#64748b'
                                            }}><X size={14} /></button>}
                                        </span>
                                    )) : (
                                        <div style={{ width: '100%' }}>
                                            <EmptyState
                                                illustration={StarIllustration}
                                                title="No skills added"
                                                description="List your technical and soft skills to help partners find the right match for their needs."
                                            />
                                        </div>
                                    )}
                                </div>
                                {isOwnProfile && editing && recommendationBubbles.skills.length > 0 && (
                                    <div style={{ padding: '0 16px 12px' }}>
                                        <div className="ln-info-label" style={{ marginBottom: 8 }}>Suggested Skills</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                            {recommendationBubbles.skills.map((item) => (
                                                <button key={`skill-suggestion-${item.label}`} type="button" className="ln-btn-sm ln-btn-outline" onClick={() => addRecommendedSkill(item.label)} title="Suggested as skill">
                                                    <Plus size={12} /> {item.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {isOwnProfile && editing && (
                                    <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px' }}>
                                        <input type="text" className="form-input" placeholder="Add a skill..." value={newSkill} onChange={e => setNewSkill(e.target.value)} maxLength={30} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} style={{ flex: 1, fontSize: 13 }} />
                                        <button type="button" className="ln-btn-sm ln-btn-primary" onClick={addSkill} disabled={!newSkill.trim()}><Plus size={14} /></button>
                                    </div>
                                )}
                            </div>

                            {/* Interests */}
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
                                            <span key={i} className="ln-interest-word" onClick={() => { if (isOwnProfile && editing) removeInterest(interest); }} style={{
                                                display: 'inline-flex', alignItems: 'center',
                                                fontSize: sizes[i % sizes.length],
                                                fontWeight: 600 + (i % 3) * 100,
                                                color: colors[i % colors.length],
                                                padding: '4px 10px',
                                                cursor: (isOwnProfile && editing) ? 'pointer' : 'default',
                                            }}>
                                                {interest}
                                            </span>
                                        );
                                    }) : (
                                        <div style={{ width: '100%' }}>
                                            <EmptyState
                                                illustration={Heart}
                                                title="No interests listed"
                                                description="Share what drives you! Interests help partners see your passion and cultural fit."
                                            />
                                        </div>
                                    )}
                                </div>
                                {isOwnProfile && editing && recommendationBubbles.interests.length > 0 && (
                                    <div style={{ padding: '0 16px 12px' }}>
                                        <div className="ln-info-label" style={{ marginBottom: 8 }}>Suggested Interests</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                            {recommendationBubbles.interests.map((item) => (
                                                <button key={`interest-suggestion-${item.label}`} type="button" className="ln-btn-sm ln-btn-outline" onClick={() => addRecommendedInterest(item.label)} title="Suggested as interest">
                                                    <Plus size={12} /> {item.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {isOwnProfile && editing && (
                                    <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px' }}>
                                        <input type="text" className="form-input" placeholder="Add an interest..." value={newInterest} onChange={e => setNewInterest(e.target.value)} maxLength={30} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addInterest(); } }} style={{ flex: 1, fontSize: 13 }} />
                                        <button type="button" className="ln-btn-sm ln-btn-primary" onClick={addInterest} disabled={!newInterest.trim()}><Plus size={14} /></button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Documents */}
                        <div className="ln-card">
                            <div className="ln-section-header">
                                <h3>Documents</h3>
                                {isOwnProfile && editing && (
                                    <button type="button" className="ln-btn-sm ln-btn-primary" onClick={() => setShowUploadForm(!showUploadForm)}>
                                        {showUploadForm ? <><X size={12} /> Cancel</> : <><Plus size={12} /> Add</>}
                                    </button>
                                )}
                            </div>

                            {isOwnProfile && editing && showUploadForm && (
                                <div style={{ marginBottom: 16, padding: 16, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                                    <div style={{ marginBottom: 10 }}>
                                        <label className="ln-info-label" style={{ marginBottom: 4, display: 'block' }}>Document Label <span style={{ color: '#cc1016' }}>*</span></label>
                                        <input type="text" required className="form-input" placeholder="e.g. Resume, Diploma, TOR..." maxLength={40} value={docLabel} onChange={e => setDocLabel(e.target.value)} style={{ fontSize: 13 }} />
                                    </div>
                                    <div style={{ marginBottom: 10 }}>
                                        <label className="ln-info-label" style={{ marginBottom: 4, display: 'block' }}>File (PDF, DOC, DOCX only) <span style={{ color: '#cc1016' }}>*</span></label>
                                        <input ref={fileInputRef} type="file" required accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e => setDocFile(e.target.files[0] || null)} style={{ fontSize: 13 }} />
                                    </div>
                                    <button type="button" className="ln-btn-sm ln-btn-success" onClick={handleDocUpload} disabled={uploading || !docFile || !docLabel.trim()} style={{ width: '100%' }}>
                                        {uploading ? 'Uploading...' : <><Upload size={12} /> Upload Document</>}
                                    </button>
                                </div>
                            )}

                            {(function () {
                                const fileDocs = (Array.isArray(documents) ? documents : []).filter(d => d.file_type !== 'link' && d.label !== 'Profile Banner');
                                if (fileDocs.length > 0) {
                                    return fileDocs.map(doc => (
                                        <div key={doc.id} className="ln-doc-item">
                                            <div className="ln-doc-info">
                                                <div style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <FileText size={18} color="rgba(0,0,0,0.4)" />
                                                </div>
                                                <div className="ln-doc-text-wrap">
                                                    <span className="ln-doc-label-text">{doc.label}</span>
                                                    <span className="ln-doc-filename-text">{doc.file_name}</span>
                                                </div>
                                            </div>
                                            <div className="ln-doc-actions">
                                                <a href={doc.file_url} target="_blank" rel="noreferrer" className="ln-btn-sm ln-btn-outline" title="View Document">
                                                    <Eye size={12} />
                                                    <span style={{ marginLeft: 4 }}>View</span>
                                                </a>
                                                {isOwnProfile && editing && (
                                                    <button
                                                        type="button"
                                                        className="ln-btn-sm ln-btn-outline"
                                                        onClick={(e) => { e.preventDefault(); showConfirm('Are you sure you want to delete this document?', () => deleteDoc(doc.id)); }}
                                                        style={{ color: '#cc1016', padding: '6px' }}
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ));
                                } else if (!showUploadForm) {
                                    return (
                                        <EmptyState
                                            illustration={DocumentIllustration}
                                            title="No documents yet"
                                            description="Upload your certificates, resumes, or portfolios to provide more details about your work."
                                        />
                                    );
                                }
                                return null;
                            })()}

                            {/* Social & Portfolio Links — add form ONLY in edit mode */}
                            {isOwnProfile && editing && (
                                <div className="ln-social-links-edit">
                                    <div className="ln-social-links-header">
                                        <Link size={14} /> Social &amp; Portfolio Links
                                    </div>
                                    <div className="ln-social-links-row">
                                        <div style={{ flex: 1, minWidth: 150 }}>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Title (e.g. Portfolio, GitHub...)"
                                                value={linkTitle}
                                                onChange={e => setLinkTitle(e.target.value)}
                                                style={{ fontSize: 13 }}
                                            />
                                        </div>
                                        <div className="ln-social-input-group">
                                            <input
                                                type="url"
                                                className="form-input"
                                                placeholder="URL (https://...)"
                                                value={docLinkUrl}
                                                onChange={e => setDocLinkUrl(e.target.value)}
                                                style={{ fontSize: 13, flex: 1 }}
                                            />
                                            <button
                                                type="button"
                                                className="ln-btn-sm ln-btn-primary"
                                                onClick={async () => {
                                                    if (!linkTitle.trim() || !docLinkUrl.trim()) return;
                                                    setUploading(true);
                                                    try {
                                                        const res = await fetch(`/api/documents/upload`, {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                traineeId: trainee.id,
                                                                label: linkTitle.trim(),
                                                                fileName: 'Link',
                                                                fileType: 'link',
                                                                fileData: docLinkUrl.trim(),
                                                                category: 'link'
                                                            }),
                                                        });
                                                        const result = await res.json();
                                                        if (result.success) {
                                                            setDocuments(prev => Array.isArray(prev) ? [result.document, ...prev] : [result.document]);
                                                            setLinkTitle('');
                                                            setDocLinkUrl('');
                                                        } else {
                                                            alert(result.error || 'Failed to add link');
                                                        }
                                                    } catch (err) {
                                                        console.error('Link upload error:', err);
                                                        alert('Error connecting to server');
                                                    }
                                                    setUploading(false);
                                                }}
                                                disabled={uploading || !linkTitle.trim() || !docLinkUrl.trim()}
                                                style={{ width: 40, padding: 0, justifyContent: 'center' }}
                                                title="Add Link"
                                            >
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Social & Portfolio Links list — always visible when links exist */}
                            {(Array.isArray(documents) ? documents : []).filter(d => d.file_type === 'link').length > 0 && (
                                <div className="ln-social-links-edit" style={editing ? {} : { borderTop: '1px solid #f1f5f9', marginTop: 12 }}>
                                    {!editing && (
                                        <div className="ln-social-links-header">
                                            <Link size={14} /> Social &amp; Portfolio Links
                                        </div>
                                    )}
                                    {(Array.isArray(documents) ? documents : []).filter(d => d.file_type === 'link').map(link => (
                                        <div key={link.id} className="ln-doc-item" style={{ marginTop: 8 }}>
                                            <div className="ln-doc-info">
                                                <div style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <Link size={16} color="rgba(0,0,0,0.4)" />
                                                </div>
                                                <div className="ln-doc-text-wrap">
                                                    <span className="ln-doc-label-text">{link.label}</span>
                                                    <span className="ln-doc-filename-text" style={{ color: '#0a66c2', wordBreak: 'break-all' }}>{link.file_url}</span>
                                                </div>
                                            </div>
                                            <div className="ln-doc-actions">
                                                <a href={link.file_url} target="_blank" rel="noreferrer" className="ln-btn-sm ln-btn-outline" title="Open Link">
                                                    <ExternalLink size={12} />
                                                    <span style={{ marginLeft: 4 }}>Open</span>
                                                </a>
                                                {isOwnProfile && editing && (
                                                    <button
                                                        type="button"
                                                        className="ln-btn-sm ln-btn-outline"
                                                        onClick={(e) => { e.preventDefault(); showConfirm('Are you sure you want to delete this link?', () => deleteDoc(link.id)); }}
                                                        style={{ color: '#cc1016', padding: '6px' }}
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </React.Fragment>
                )}
            </div>

            {/* Application Modal for Saved tab */}
            {applyJob && (
                <div className="modal-overlay" onClick={() => setApplyJob(null)}>
                    <div className="ln-modal" onClick={e => e.stopPropagation()}>
                        <div className="ln-modal-header">
                            <div>
                                <h3 className="ln-modal-title">Application Form</h3>
                                <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', marginTop: 4 }}>
                                    {applyJob.title} • {applyJob.companyName}
                                </p>
                            </div>
                            <button type="button" className="ln-btn-icon" onClick={() => setApplyJob(null)}><X size={18} /></button>
                        </div>

                        <div className="ln-profile-summary-notice" style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: 12, marginBottom: 16 }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                <Info size={18} color="#0369a1" style={{ marginTop: 2 }} />
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0369a1' }}>Profile as Resume</div>
                                    <p style={{ fontSize: 12, color: '#0c4a6e', margin: '4px 0 0' }}>
                                        Your profile will be shared with the recruiter as your official resume.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {resumeInfo?.file_url && (
                            <div style={{ marginBottom: 12 }}>
                                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Attached Resume (Optional Backup)</div>
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 10, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{resumeInfo.file_name || 'Resume'}</div>
                                    </div>
                                    <a href={resumeInfo.file_url} target="_blank" rel="noreferrer" className="ln-btn-sm ln-btn-outline"><Eye size={12} /> View</a>
                                </div>
                            </div>
                        )}

                        <div style={{ marginBottom: 14 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Application Message</div>
                            <textarea
                                className="ln-search-input"
                                placeholder="Write a short message for the recruiter (optional)..."
                                value={applicationMessage}
                                onChange={e => setApplicationMessage(e.target.value)}
                                maxLength={1000}
                                style={{ width: '100%', minHeight: 110, resize: 'none', borderRadius: 10, padding: 12 }}
                            />
                        </div>

                        <div className="ln-modal-footer">
                            <button type="button" className="ln-btn ln-btn-outline" onClick={() => setApplyJob(null)}>Cancel</button>
                            <button type="button" className="ln-btn ln-btn-primary" disabled={submittingApplication} onClick={handleSubmitApplication}>
                                <Send size={15} /> {submittingApplication ? 'Submitting...' : 'Submit Application'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* NEW: Certificate Proof Preview Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-75 p-4 transition-opacity"
                    onClick={() => setPreviewImage(null)}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                >
                    {/* Modal Container - Prevents closing when clicking inside the white box */}
                    <div
                        className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden"
                        onClick={e => e.stopPropagation()}
                        style={{ maxHeight: '90vh' }}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50" style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc', padding: '16px' }}>
                            <h3 className="font-bold text-gray-800 flex items-center gap-2" style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ShieldCheck size={20} color="#0284c7" />
                                Official Certificate Proof
                            </h3>
                            <button type="button" onClick={() => setPreviewImage(null)} style={{ background: '#e2e8f0', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer', display: 'flex' }}>
                                <X size={20} color="#64748b" />
                            </button>
                        </div>

                        {/* Image Body */}
                        <div className="p-6 bg-gray-100 flex-1 overflow-auto flex items-center justify-center" style={{ padding: '24px', background: '#f1f5f9', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {previewImage.toLowerCase().endsWith('.pdf') ? (
                                <div className="text-center" style={{ textAlign: 'center' }}>
                                    <FileText size={64} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
                                    <p style={{ color: '#475569', fontWeight: 500, marginBottom: '12px' }}>This proof is a PDF document.</p>
                                    <a href={previewImage} target="_blank" rel="noreferrer" style={{ background: '#0284c7', color: '#fff', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontWeight: 600, display: 'inline-block' }}>
                                        Open PDF to View
                                    </a>
                                </div>
                            ) : (
                                <img
                                    src={previewImage}
                                    alt="Certificate Proof"
                                    style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', background: '#fff' }}
                                />
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-white border-t border-gray-100 flex justify-between items-center" style={{ padding: '16px', background: '#fff', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: 500 }}>Industry Partners can scan this directly.</p>
                            <a href={previewImage} download target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#0284c7', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <ExternalLink size={14} /> Open Original
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </form>
    );
};

const TraineeProfile = (props) => (
    <ErrorBoundary>
        <TraineeProfileContent {...props} />
    </ErrorBoundary>
);

// ─── PAGE 4: OPPORTUNITIES ───────────────────────────────────────
const Opportunities = () => {
    const { currentUser, trainees, jobPostings, applications, getTraineeRecommendedJobs, applyToJob } = useApp();
    const navigate = useNavigate();
    const trainee = currentUser || trainees[0];
    const myApps = applications.filter(a => a.traineeId === trainee?.id).map(a => a.jobId);
    const allJobs = getTraineeRecommendedJobs(trainee?.id);

    const [search, setSearch] = useState('');
    const [filterIndustry, setFilterIndustry] = useState('All');
    const [filterType, setFilterType] = useState('All');
    const [filterLocation, setFilterLocation] = useState('All');
    const [filterOpType, setFilterOpType] = useState('All');
    const [selectedJob, setSelectedJob] = useState(null);
    const [applyJob, setApplyJob] = useState(null);
    const [applicationMessage, setApplicationMessage] = useState('');
    const [resumeInfo, setResumeInfo] = useState(null);
    const [submittingApplication, setSubmittingApplication] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // Reset page when filters change
    useEffect(() => {
        // Use a functional update or a slight delay to avoid cascading render warning in some linters
        // though in this case we just want to reset to page 1.
        setCurrentPage(prev => prev === 1 ? prev : 1);
    }, [search, filterIndustry, filterType, filterLocation, filterOpType]);
    const openProfile = (target) => {
        if (!target?.id || !target?.type) return;
        const profileType = normalizeProfileType(target.type);
        if (!profileType) return;
        navigate(`/trainee/profile-view/${profileType}/${target.id}`);
    };

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

    const totalPages = Math.ceil(filtered.length / pageSize);
    const displayedJobs = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const loadResumeInfo = async () => {
        if (!trainee?.id) return;
        // setLoadingResume(true); // Removed unused state setter
        setResumeInfo(null);

        let resolvedResume = null;
        const isSupabaseUser = typeof trainee.id === 'string' && trainee.id.includes('-');

        if (isSupabaseUser) {
            try {
                const { data, error } = await supabase
                    .from('student_documents')
                    .select('file_url, file_name, label, uploaded_at')
                    .eq('student_id', trainee.id)
                    .ilike('label', '%resume%')
                    .order('uploaded_at', { ascending: false })
                    .limit(1);

                if (error && error.code !== '42P01') {
                    console.warn('Resume fetch error:', error);
                }

                if (!error && data?.length) {
                    resolvedResume = {
                        file_url: data[0].file_url,
                        file_name: data[0].file_name || 'Resume',
                    };
                }
            } catch (err) {
                console.warn('Resume fetch exception:', err);
            }
        }

        if (!resolvedResume && (trainee?.resumeUrl || trainee?.registrationResumeUrl)) {
            resolvedResume = {
                file_url: trainee.resumeUrl || trainee.registrationResumeUrl,
                file_name: 'Resume',
            };
        }

        setResumeInfo(resolvedResume);
        // setLoadingResume(false); // Removed unused state setter
    };

    const openApplyModal = async (job) => {
        setApplyJob(job);
        setApplicationMessage('');
        await loadResumeInfo();
    };

    const handleSubmitApplication = async () => {
        if (!applyJob) return;
        setSubmittingApplication(true);
        const r = await applyToJob(trainee?.id, applyJob.id, {
            applicationMessage,
            resumeUrl: resumeInfo?.file_url,
            resumeFileName: resumeInfo?.file_name || 'Resume',
        });
        setSubmittingApplication(false);

        if (!r.success) {
            alert(r.error || 'Failed to submit application.');
            return;
        }

        setApplyJob(null);
        setApplicationMessage('');
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
                {displayedJobs.map(job => {
                    const applied = myApps.includes(job.id);
                    return (
                        <div key={job.id} className="ln-card ln-job-card-li">
                            <div className="ln-job-card-top">
                                <button
                                    type="button"
                                    className="ln-job-card-icon"
                                    onClick={() => openProfile({ id: job.partnerId, type: 'partner' })}
                                    style={{ border: 'none', cursor: job.partnerId ? 'pointer' : 'default' }}
                                    disabled={!job.partnerId}
                                >
                                    <Building2 size={24} />
                                </button>
                                <div className="ln-job-card-info">
                                    <div className="ln-job-card-title">{job.title}</div>
                                    <div className="ln-job-card-company">
                                        <button
                                            type="button"
                                            onClick={() => openProfile({ id: job.partnerId, type: 'partner' })}
                                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', font: 'inherit' }}
                                        >
                                            {job.companyName}
                                        </button>
                                    </div>
                                    <div className="ln-job-card-meta">
                                        <span><MapPin size={13} /> {job.location}</span>
                                        <span><Clock size={13} /> {job.employmentType}</span>
                                        <span title={new Date(job.createdAt).toLocaleString()}><Clock size={13} /> {timeAgo(job.createdAt)}</span>
                                    </div>
                                </div>
                                <div className="ln-job-card-badges">
                                    <span className={`ln-badge ln-badge-${job.status === 'Open' ? 'green' : 'gray'}`}>{job.status}</span>
                                    <span className="ln-badge ln-badge-blue" style={{ fontSize: 11 }}>{job.opportunityType}</span>
                                </div>
                            </div>

                            <div className="ln-job-card-footer">
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <span className="ln-badge ln-badge-purple">{job.ncLevel}</span>
                                    {job.salaryRange && <span style={{ fontSize: 13, color: '#057642', fontWeight: 600 }}>{formatSalaryDisplay(job.salaryRange)}</span>}
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="ln-btn-sm ln-btn-outline" onClick={() => setSelectedJob(job)}>
                                        <Eye size={13} /> Details
                                    </button>
                                    <button className="ln-btn-sm ln-btn-primary" disabled={applied || job.status !== 'Open'} onClick={() => openApplyModal(job)}>
                                        {applied ? <><CheckCircle size={13} /> Applied</> : <><Send size={13} /> Apply</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination Controls */}
            {filtered.length > 0 && (
                <div className="ln-pagination">
                    <div className="ln-pagination-info">
                        Showing <b>{Math.min(filtered.length, (currentPage - 1) * pageSize + 1)}</b> to <b>{Math.min(filtered.length, currentPage * pageSize)}</b> of <b>{filtered.length}</b> opportunities
                    </div>
                    <div className="ln-pagination-controls">
                        <button
                            className="ln-pagination-btn"
                            disabled={currentPage === 1}
                            onClick={() => { setCurrentPage(prev => prev - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        >
                            <ChevronLeft size={16} /> Previous
                        </button>

                        <div className="ln-pagination-numbers">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1))
                                .map((p, i, arr) => (
                                    <React.Fragment key={p}>
                                        {i > 0 && arr[i - 1] !== p - 1 && <span className="ln-pagination-ellipsis">...</span>}
                                        <button
                                            className={`ln-pagination-num ${currentPage === p ? 'active' : ''}`}
                                            onClick={() => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                        >
                                            {p}
                                        </button>
                                    </React.Fragment>
                                ))}
                        </div>

                        <button
                            className="ln-pagination-btn"
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

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
                                <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', marginTop: 4 }}>
                                    <button
                                        type="button"
                                        onClick={() => openProfile({ id: selectedJob.partnerId, type: 'partner' })}
                                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#0a66c2', font: 'inherit' }}
                                    >
                                        {selectedJob.companyName}
                                    </button>
                                    {' '}• {selectedJob.location} • {timeAgo(selectedJob.createdAt)}
                                </p>
                            </div>
                            <button className="ln-btn-icon" onClick={() => setSelectedJob(null)}><X size={18} /></button>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                            <span className={`ln-badge ln-badge-${selectedJob.status === 'Open' ? 'green' : 'gray'}`}>{selectedJob.status}</span>
                            <span className="ln-badge ln-badge-blue">{selectedJob.opportunityType}</span>
                            <span className="ln-badge ln-badge-purple">{selectedJob.ncLevel}</span>
                            <span className="ln-badge ln-badge-gray">{selectedJob.employmentType}</span>
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: 'rgba(0,0,0,0.9)' }}>Description</div>
                            <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', lineHeight: 1.7 }}>{selectedJob.description}</p>
                        </div>
                        {selectedJob.attachmentUrl && (
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: 'rgba(0,0,0,0.9)' }}>Attachment</div>
                                {isImageAttachment(selectedJob.attachmentUrl, selectedJob.attachmentType) ? (
                                    <a href={selectedJob.attachmentUrl} target="_blank" rel="noreferrer" style={{ display: 'block' }}>
                                        <img
                                            src={selectedJob.attachmentUrl}
                                            alt={selectedJob.attachmentName || 'Opportunity attachment'}
                                            style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 10, border: '1px solid #e2e8f0' }}
                                        />
                                    </a>
                                ) : (
                                    <a href={selectedJob.attachmentUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: '#2563eb', textDecoration: 'none', fontSize: 13 }}>
                                        <FileText size={15} />
                                        {selectedJob.attachmentName || decodeURIComponent(String(selectedJob.attachmentUrl).split('/').pop()?.split('?')[0] || 'Attachment')}
                                    </a>
                                )}
                            </div>
                        )}
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
                            <span style={{ fontSize: 15, fontWeight: 700, color: '#057642' }}>{formatSalaryDisplay(selectedJob.salaryRange)}</span>
                            <button
                                className="ln-btn ln-btn-primary"
                                disabled={myApps.includes(selectedJob.id) || selectedJob.status !== 'Open'}
                                onClick={async () => {
                                    const jobToApply = selectedJob;
                                    setSelectedJob(null);
                                    await openApplyModal(jobToApply);
                                }}
                            >
                                {myApps.includes(selectedJob.id) ? <><CheckCircle size={15} /> Applied</> : <><Send size={15} /> Apply</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {applyJob && (
                <div className="modal-overlay" onClick={() => setApplyJob(null)}>
                    <div className="ln-modal" onClick={e => e.stopPropagation()}>
                        <div className="ln-modal-header">
                            <div>
                                <h3 className="ln-modal-title">Application Form</h3>
                                <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', marginTop: 4 }}>
                                    {applyJob.title} •
                                    <button
                                        type="button"
                                        onClick={() => openProfile({ id: applyJob.partnerId, type: 'partner' })}
                                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#0a66c2', font: 'inherit', marginLeft: 4 }}
                                    >
                                        {applyJob.companyName}
                                    </button>
                                </p>
                            </div>
                            <button className="ln-btn-icon" onClick={() => setApplyJob(null)}><X size={18} /></button>
                        </div>
                        <div className="ln-profile-summary-notice" style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: 12, marginBottom: 16 }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                <Info size={18} color="#0369a1" style={{ marginTop: 2 }} />
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0369a1' }}>Profile as Resume</div>
                                    <p style={{ fontSize: 12, color: '#0c4a6e', margin: '4px 0 0' }}>
                                        Your comprehensive profile (Education, Work Exp, Skills, and Certifications) will be shared with the recruiter as your official resume.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {resumeInfo?.file_url && (
                            <div style={{ marginBottom: 12 }}>
                                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Attached Resume (Optional Backup)</div>
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 10, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{resumeInfo.file_name || 'Resume'}</div>
                                    </div>
                                    <a href={resumeInfo.file_url} target="_blank" rel="noreferrer" className="ln-btn-sm ln-btn-outline"><Eye size={12} /> View</a>
                                </div>
                            </div>
                        )}

                        <div style={{ marginBottom: 14 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Application Message</div>
                            <textarea
                                className="ln-search-input"
                                placeholder="Write a short message for the recruiter (optional)..."
                                value={applicationMessage}
                                onChange={e => setApplicationMessage(e.target.value)}
                                maxLength={1000}
                                style={{ width: '100%', minHeight: 110, resize: 'none', borderRadius: 10, padding: 12 }}
                            />
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, textAlign: 'right' }}>{applicationMessage.length}/1000</div>
                        </div>

                        <div className="ln-modal-footer">
                            <button className="ln-btn ln-btn-outline" onClick={() => setApplyJob(null)}>Cancel</button>
                            <button className="ln-btn ln-btn-primary" disabled={submittingApplication} onClick={handleSubmitApplication}>
                                <Send size={15} /> {submittingApplication ? 'Submitting...' : 'Submit Application'}
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
    const { currentUser, trainees, getTraineeApplications, saveInterviewBooking } = useApp();
    const navigate = useNavigate();
    const trainee = currentUser || trainees[0];
    const myApps = getTraineeApplications(trainee?.id);
    const [search, setSearch] = useState('');
    const [messageModal, setMessageModal] = useState(null);
    const [bookingApp, setBookingApp] = useState(null);
    const [actionMenuId, setActionMenuId] = useState(null);
    const openProfile = (target) => {
        if (!target?.id || !target?.type) return;
        const profileType = normalizeProfileType(target.type);
        if (!profileType) return;
        navigate(`/trainee/profile-view/${profileType}/${target.id}`);
    };

    const filtered = myApps.filter(a => {
        const q = search.toLowerCase();
        return [
            a.activityType,
            a.job?.title,
            a.partner?.companyName,
            a.directionLabel,
            a.outgoingMessage,
            a.incomingMessage,
        ].some(value => String(value || '').toLowerCase().includes(q));
    });

    const statusBadge = (s) => {
        const raw = String(s || '').toLowerCase();
        const map = {
            pending: 'ln-badge-yellow',
            accepted: 'ln-badge-green',
            rejected: 'ln-badge-red',
            sent: 'ln-badge-blue',
            received: 'ln-badge-blue',
            'interview scheduled': 'ln-badge-purple',
            // Keep capitalized versions for compatibility during transition
            Pending: 'ln-badge-yellow',
            Accepted: 'ln-badge-green',
            Rejected: 'ln-badge-red',
            Sent: 'ln-badge-blue',
            Received: 'ln-badge-blue',
            'Interview Scheduled': 'ln-badge-purple',
        };
        const labelMap = {
            pending: 'Pending',
            accepted: 'Accepted',
            rejected: 'Rejected',
            sent: 'Sent',
            received: 'Received',
            'interview scheduled': 'Interview Scheduled',
        };
        return <span className={`ln-badge ${map[s] || map[raw] || 'ln-badge-gray'}`}>{labelMap[raw] || s}</span>;
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
                    { label: 'Applications', count: myApps.filter(a => a.recordType === 'application').length, color: '#b24020' },
                    { label: 'My Contact', count: myApps.filter(a => a.recordType === 'contact' && a.directionLabel === 'You contacted partner').length, color: '#057642' },
                    { label: 'Partner Contact', count: myApps.filter(a => a.recordType === 'contact' && a.directionLabel === 'Partner contacted you').length, color: '#cc1016' },
                ].map(s => (
                    <div key={s.label} className="ln-pill" style={{ borderLeft: `3px solid ${s.color}` }}>
                        <span className="ln-pill-count" style={{ color: s.color }}>{s.count}</span>
                        <span className="ln-pill-label">{s.label}</span>
                    </div>
                ))}
            </div>

            {/* Status Pipeline Visualization - Improved Linear Design */}
            {(() => {
                const appRecords = myApps.filter(a => a.recordType === 'application');
                const getPhase = (status) => {
                    const s = String(status || '').toLowerCase();
                    if (s === 'rejected') return 'rejected';
                    if (s === 'accepted' || s === 'offered') return 'accepted';
                    if (s === 'interview scheduled' || s === 'interviewscheduled' || s === 'interview') return 'interview';
                    if (s === 'screened' || s === 'under review') return 'review';
                    return 'received';
                };
                const phases = [
                    { key: 'received', label: 'Received', icon: <Send size={16} />, color: '#0a66c2', count: appRecords.filter(a => getPhase(a.status) === 'received').length },
                    { key: 'review', label: 'In Review', icon: <Eye size={16} />, color: '#d97706', count: appRecords.filter(a => getPhase(a.status) === 'review').length },
                    { key: 'interview', label: 'Interviews', icon: <Calendar size={16} />, color: '#7c3aed', count: appRecords.filter(a => getPhase(a.status) === 'interview').length },
                    { key: 'accepted', label: 'Accepted', icon: <CheckCircle size={16} />, color: '#057642', count: appRecords.filter(a => getPhase(a.status) === 'accepted').length },
                ];

                return appRecords.length > 0 ? (
                    <div className="ln-card" style={{ marginBottom: 16, padding: '24px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                            {/* The Connecting Line Background */}
                            <div style={{ position: 'absolute', top: 18, left: '10%', right: '10%', height: 2, background: '#f1f5f9', zIndex: 0 }} />

                            {phases.map((p) => {
                                const isActive = p.count > 0;
                                return (
                                    <div key={p.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, position: 'relative' }}>
                                        {/* Node Icon */}
                                        <div style={{
                                            width: 36, height: 36, borderRadius: '50%',
                                            background: isActive ? p.color : '#f8fafc',
                                            color: isActive ? '#fff' : '#94a3b8',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            border: isActive ? `2px solid #fff` : '2px solid #f1f5f9',
                                            boxShadow: isActive ? `0 0 0 2px ${p.color}40` : 'none',
                                            marginBottom: 8, transition: 'all 0.3s'
                                        }}>
                                            {p.icon}
                                        </div>
                                        {/* Count & Label */}
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: 20, fontWeight: 800, color: isActive ? '#1e293b' : '#cbd5e1', lineHeight: 1 }}>{p.count}</div>
                                            <div style={{ fontSize: 11, fontWeight: 600, color: isActive ? '#64748b' : '#94a3b8', marginTop: 2, letterSpacing: -0.1 }}>{p.label}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : null;
            })()}

            <div className="ln-card">
                <div className="ln-section-header" style={{ marginBottom: 16 }}>
                    <h3>Applications and Contact Activity</h3>
                    <div className="ln-search-wrap" style={{ width: 240 }}>
                        <Search size={16} className="ln-search-icon" />
                        <input className="ln-search-input" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="ln-table" style={{ tableLayout: 'fixed', width: '100%' }}>
                        <thead>
                            <tr>
                                <th style={{ width: '220px' }}>Partner</th>
                                <th style={{ width: '220px' }}>Opportunity</th>
                                <th style={{ width: '120px' }}>Date</th>
                                <th style={{ width: '100px' }}>Match %</th>
                                <th style={{ width: '140px' }}>Status</th>
                                <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(a => {
                                const partner = a.partner || { companyName: a.job?.companyName || '—', id: a.job?.partnerId };
                                const initials = (partner.companyName || 'P').charAt(0).toUpperCase();
                                const rate = a.matchRate || 0;
                                const getMatchColor = (rate) => {
                                    if (rate >= 80) return '#057642';
                                    if (rate >= 60) return '#ea580c';
                                    return '#7c3aed';
                                };

                                return (
                                    <tr key={a.rowKey || a.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{
                                                    width: 32, height: 32, borderRadius: 6, background: '#f8fafc',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 13, fontWeight: 700, color: '#64748b', border: '1px solid #e2e8f0',
                                                    flexShrink: 0
                                                }}>
                                                    {partner.company_logo_url ? <img src={partner.company_logo_url} alt="" style={{ width: '100%', height: '100%', borderRadius: 6, objectFit: 'cover' }} /> : initials}
                                                </div>
                                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => openProfile({ id: partner.id, type: 'partner' })}
                                                        style={{ background: 'none', border: 'none', padding: 0, cursor: partner.id ? 'pointer' : 'default', color: '#1e293b', font: 'inherit', fontWeight: 600, textAlign: 'left' }}
                                                        disabled={!partner.id}
                                                    >
                                                        {partner.companyName}
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 600, color: '#0a66c2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {a.job?.title || 'Direct Contact'}
                                        </td>
                                        <td style={{ color: '#64748b', fontSize: 13 }}>{a.eventDate || '—'}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <div style={{ height: 6, flex: 1, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${rate}%`, background: getMatchColor(rate) }} />
                                                </div>
                                                <span style={{ fontSize: 12, fontWeight: 700, color: getMatchColor(rate), minWidth: 28 }}>{rate}%</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                                                {statusBadge(a.status)}
                                                {a.interviewDate && (
                                                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>
                                                        {new Date(a.interviewDate).toLocaleDateString()} @ {new Date(a.interviewDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center', position: 'relative' }}>
                                            <button
                                                className="ln-btn-icon"
                                                style={{ background: actionMenuId === (a.rowKey || a.id) ? '#f1f5f9' : 'transparent' }}
                                                onClick={(e) => { e.stopPropagation(); setActionMenuId(actionMenuId === (a.rowKey || a.id) ? null : (a.rowKey || a.id)); }}
                                            >
                                                <MoreVertical size={16} />
                                            </button>

                                            {actionMenuId === (a.rowKey || a.id) && (
                                                <React.Fragment>
                                                    <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setActionMenuId(null)} />
                                                    <div style={{
                                                        position: 'absolute', right: '100%', top: 0, marginRight: 8,
                                                        background: 'white', border: '1px solid #e2e8f0', borderRadius: 8,
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100,
                                                        width: 170, overflow: 'hidden'
                                                    }}>
                                                        <button className="ln-dropdown-item" onClick={() => { setActionMenuId(null); openProfile({ id: partner.id, type: 'partner' }); }} disabled={!partner.id}>
                                                            <Building2 size={14} /> View Partner
                                                        </button>
                                                        {(a.outgoingMessage || a.incomingMessage) && (
                                                            <button className="ln-dropdown-item" onClick={() => { setActionMenuId(null); setMessageModal(a); }}>
                                                                <MessageSquare size={14} /> View Messages
                                                            </button>
                                                        )}
                                                        {a.attachmentUrl && (
                                                            <a href={a.attachmentUrl} target="_blank" rel="noreferrer" className="ln-dropdown-item" style={{ textDecoration: 'none' }} onClick={() => setActionMenuId(null)}>
                                                                <Eye size={14} /> View Attachment
                                                            </a>
                                                        )}
                                                        {!a.attachmentUrl && (
                                                            <button className="ln-dropdown-item" onClick={() => { setActionMenuId(null); navigate('/trainee/profile'); }}>
                                                                <User size={14} /> My Profile (Resume)
                                                            </button>
                                                        )}
                                                        {String(a.status).toLowerCase() === 'interview scheduled' && (
                                                            <button className="ln-dropdown-item" onClick={() => { setActionMenuId(null); setBookingApp(a); }} style={{ color: '#7c3aed' }}>
                                                                <Calendar size={14} /> {a.interviewDate ? 'Reschedule' : 'Pick Time'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </React.Fragment>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {messageModal && (
                <div className="modal-overlay" onClick={() => setMessageModal(null)}>
                    <div className="ln-modal" onClick={e => e.stopPropagation()}>
                        <div className="ln-modal-header">
                            <div>
                                <h3 className="ln-modal-title">Message Details</h3>
                            </div>
                            <button className="ln-btn-icon" onClick={() => setMessageModal(null)}><X size={18} /></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {messageModal.outgoingMessage && (
                                <div style={{ padding: 12, borderRadius: 10, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (trainee?.id) {
                                                    setMessageModal(null);
                                                    openProfile({ id: trainee.id, type: 'trainee' });
                                                }
                                            }}
                                            style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: '50%',
                                                background: trainee?.photo ? 'transparent' : '#dbeafe',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 700,
                                                color: '#1e3a8a',
                                                overflow: 'hidden',
                                                flexShrink: 0,
                                                border: 'none',
                                                padding: 0,
                                                cursor: trainee?.id ? 'pointer' : 'default',
                                            }}
                                            disabled={!trainee?.id}
                                        >
                                            {trainee?.photo ? (
                                                <img src={trainee.photo} alt={trainee?.name || 'You'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                ((trainee?.name || 'Y').charAt(0) || 'Y').toUpperCase()
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (trainee?.id) {
                                                    setMessageModal(null);
                                                    openProfile({ id: trainee.id, type: 'trainee' });
                                                }
                                            }}
                                            style={{ background: 'none', border: 'none', padding: 0, fontWeight: 700, fontSize: 14, cursor: trainee?.id ? 'pointer' : 'default', color: '#1e3a8a', textAlign: 'left' }}
                                            disabled={!trainee?.id}
                                        >
                                            You
                                        </button>
                                    </div>
                                    <div style={{ fontSize: 13, color: '#1e3a8a', lineHeight: 1.5 }}>{messageModal.outgoingMessage}</div>
                                </div>
                            )}

                            {messageModal.incomingMessage && (
                                <div style={{ padding: 12, borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const partnerId = messageModal.partner?.id || messageModal.job?.partnerId;
                                                if (partnerId) {
                                                    setMessageModal(null);
                                                    openProfile({ id: partnerId, type: 'partner' });
                                                }
                                            }}
                                            style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: '50%',
                                                background: (messageModal.partner?.photo || messageModal.partner?.company_logo_url) ? 'transparent' : '#dcfce7',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 700,
                                                color: '#166534',
                                                overflow: 'hidden',
                                                flexShrink: 0,
                                                border: 'none',
                                                padding: 0,
                                                cursor: (messageModal.partner?.id || messageModal.job?.partnerId) ? 'pointer' : 'default',
                                            }}
                                            disabled={!(messageModal.partner?.id || messageModal.job?.partnerId)}
                                        >
                                            {(messageModal.partner?.photo || messageModal.partner?.company_logo_url) ? (
                                                <img src={messageModal.partner?.photo || messageModal.partner?.company_logo_url} alt={messageModal.partner?.companyName || 'Partner'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                ((messageModal.partner?.companyName || messageModal.job?.companyName || 'P').charAt(0) || 'P').toUpperCase()
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const partnerId = messageModal.partner?.id || messageModal.job?.partnerId;
                                                if (partnerId) {
                                                    setMessageModal(null);
                                                    openProfile({ id: partnerId, type: 'partner' });
                                                }
                                            }}
                                            style={{ background: 'none', border: 'none', padding: 0, fontWeight: 700, fontSize: 14, cursor: (messageModal.partner?.id || messageModal.job?.partnerId) ? 'pointer' : 'default', color: '#166534', textAlign: 'left' }}
                                            disabled={!(messageModal.partner?.id || messageModal.job?.partnerId)}
                                        >
                                            {messageModal.partner?.companyName || messageModal.job?.companyName || 'Partner'}
                                        </button>
                                    </div>
                                    <div style={{ fontSize: 13, color: '#14532d', lineHeight: 1.5 }}>{messageModal.incomingMessage}</div>
                                </div>
                            )}
                        </div>

                        <div className="ln-modal-footer">
                            <button className="ln-btn ln-btn-outline" onClick={() => setMessageModal(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {bookingApp && (
                <div className="modal-overlay" onClick={() => setBookingApp(null)}>
                    <div className="ln-modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
                        <div className="ln-modal-header">
                            <div>
                                <h3 className="ln-modal-title">Schedule Interview</h3>
                                <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)', marginTop: 2 }}>{bookingApp.partner?.companyName || 'Partner'}</p>
                            </div>
                            <button className="ln-btn-icon" onClick={() => setBookingApp(null)}><X size={18} /></button>
                        </div>
                        <div style={{ padding: '0 0 16px' }}>
                            <PickTime
                                partnerId={bookingApp.partner?.id || bookingApp.job?.partnerId}
                                onBook={async (slot) => {
                                    await saveInterviewBooking({
                                        application_id: bookingApp.id,
                                        trainee_id: trainee.id,
                                        partner_id: bookingApp.partner?.id || bookingApp.job?.partnerId,
                                        start_time: slot.toISOString(),
                                        end_time: new Date(slot.getTime() + 60 * 60 * 1000).toISOString(),
                                    });
                                    setBookingApp(null);
                                    alert('Interview successfully booked!');
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── SUBCOMPONENT: PICK TIME ──────────────────────────────────────
const PickTime = ({ partnerId, onBook }) => {
    const { availabilitySlots, fetchAvailability, interviewBookings, fetchBookings } = useApp();
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [weekOffset, setWeekOffset] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await Promise.all([
                fetchAvailability(partnerId),
                fetchBookings(partnerId)
            ]);
            setLoading(false);
        };
        load();
    }, [partnerId]);

    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const getWeekStart = () => {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1) + (weekOffset * 7);
        const mon = new Date(now);
        mon.setDate(diff);
        mon.setHours(0, 0, 0, 0);
        return mon;
    };

    const weekStart = getWeekStart();
    const weekDates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
    });

    // Check if slot is available and NOT already booked
    const getSlotAvailability = (date, hour) => {
        const dayIdx = (date.getDay() + 6) % 7; // Mon=0 .. Sun=6
        const isPartnerAvailable = availabilitySlots.some(s => {
            if (s.day_of_week !== dayIdx) return false;
            const startH = parseInt(String(s.start_time).split(':')[0], 10);
            return hour === startH;
        });

        if (!isPartnerAvailable) return 'unavailable';

        const isBooked = interviewBookings.some(b => {
            if (b.status === 'cancelled') return false;
            const bStart = new Date(b.start_time);
            return bStart.toDateString() === date.toDateString() && bStart.getHours() === hour;
        });

        if (isBooked) return 'booked';

        // Prevent booking in the past
        const slotTime = new Date(date);
        slotTime.setHours(hour, 0, 0, 0);
        if (slotTime < new Date()) return 'past';

        return 'available';
    };

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Loader className="animate-spin" /></div>;

    const hours = Array.from({ length: 11 }, (_, i) => i + 7); // 7 AM to 5 PM

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <button className="ln-btn-icon" onClick={() => setWeekOffset(w => w - 1)}><ChevronLeft size={18} /></button>
                <div style={{ fontWeight: 700 }}>
                    {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <button className="ln-btn-icon" onClick={() => setWeekOffset(w => w + 1)}><ChevronRight size={18} /></button>
            </div>

            <div style={{ overflowX: 'auto', maxHeight: 350, border: '1px solid #e2e8f0', borderRadius: 12 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: '#f8fafc' }}>
                        <tr>
                            <th style={{ padding: 6, borderBottom: '1px solid #e2e8f0' }}>Time</th>
                            {dayLabels.map((d, i) => (
                                <th key={d} style={{ padding: 6, borderBottom: '1px solid #e2e8f0' }}>
                                    {d}<br />{weekDates[i].getDate()}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {hours.map(h => (
                            <tr key={h}>
                                <td style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    {h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`}
                                </td>
                                {weekDates.map((date, i) => {
                                    const status = getSlotAvailability(date, h);
                                    const isSelected = selectedSlot && selectedSlot.toDateString() === date.toDateString() && selectedSlot.getHours() === h;

                                    return (
                                        <td key={i} style={{ padding: 2, borderBottom: '1px solid #f1f5f9' }}>
                                            {status === 'available' ? (
                                                <button
                                                    onClick={() => {
                                                        const s = new Date(date);
                                                        s.setHours(h, 0, 0, 0);
                                                        setSelectedSlot(s);
                                                    }}
                                                    style={{
                                                        width: '100%', height: 32, border: 'none', borderRadius: 4,
                                                        background: isSelected ? '#7c3aed' : '#f5f3ff',
                                                        color: isSelected ? '#fff' : '#7c3aed',
                                                        cursor: 'pointer', fontWeight: 600
                                                    }}
                                                >
                                                    Select
                                                </button>
                                            ) : status === 'booked' ? (
                                                <div style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>Booked</div>
                                            ) : null}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    className="ln-btn ln-btn-primary"
                    disabled={!selectedSlot}
                    onClick={() => onBook(selectedSlot)}
                >
                    Confirm Appointment
                </button>
            </div>
        </div>
    );
};

const TraineeProfileViewRoute = () => {
    const { profileType, profileId } = useParams();
    const navigate = useNavigate();
    const normalizedProfileType = normalizeProfileType(profileType);

    if (normalizedProfileType === 'trainee') {
        return (
            <ErrorBoundary>
                <TraineeProfileContent viewedProfileId={profileId} onBack={() => navigate(-1)} openBulletinModal={openBulletinModal} />
            </ErrorBoundary>
        );
    }

    if (normalizedProfileType === 'partner') {
        return <CompanyProfile viewedPartnerId={profileId} onBack={() => navigate(-1)} />;
    }

    return <Navigate to="/trainee" replace />;
};

// ─── MAIN TRAINEE DASHBOARD ─────────────────────────────────────
export default function TraineeDashboard() {
    const { currentUser, createPostInteraction, fetchPostInteractions } = useApp();
    const navigate = useNavigate();
    const location = useLocation();

    // Lifted from TraineeDashboardHome
    const [bulletinModal, setBulletinModal] = useState(null);
    const [bulletinMessage, setBulletinMessage] = useState('');
    const [bulletinSubmitting, setBulletinSubmitting] = useState(false);
    const [bulletinToast, setBulletinToast] = useState('');

    const showBulletinToast = (msg) => { setBulletinToast(msg); setTimeout(() => setBulletinToast(''), 3000); };

    const openBulletinModal = (post, type) => {
        setBulletinModal({ post, type });
        setBulletinMessage('');
    };

    const handleBulletinInteraction = async () => {
        if (!bulletinModal) return;
        setBulletinSubmitting(true);
        const details = { message: bulletinMessage, applied_at: new Date().toISOString() };
        const res = await createPostInteraction(bulletinModal.post.id, bulletinModal.type, details);
        setBulletinSubmitting(false);
        if (res.success) {
            setBulletinModal(null);
            showBulletinToast(
                bulletinModal.type === 'apply' ? 'Application submitted!' :
                    bulletinModal.type === 'register' ? 'Registered successfully!' :
                        'Inquiry sent!'
            );
            fetchPostInteractions();
        } else {
            alert(res.error || 'Failed to submit.');
        }
    };

    // Deduce active page from URL for visual consistency in child components
    const path = location.pathname.split('/').pop();
    const activePage = location.pathname.includes('/profile-view/') ? 'dashboard' : ((path === 'trainee' || !path) ? 'dashboard' : path);

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
                <Route path="/" element={<TraineeDashboardHome setActivePage={setActivePage} openBulletinModal={openBulletinModal} />} />
                <Route path="/profile" element={<TraineeProfile openBulletinModal={openBulletinModal} />} />
                <Route path="/recommendations" element={<Opportunities />} />
                <Route path="/applications" element={<MyApplications />} />
                <Route path="/profile-view/:profileType/:profileId" element={<TraineeProfileViewRoute openBulletinModal={openBulletinModal} />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="*" element={<Navigate to="/trainee" replace />} />
            </Routes>

            {/* Lifted Bulletin UI Elements */}
            {bulletinToast && (
                <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle size={16} color="#4ade80" />{bulletinToast}
                </div>
            )}

            {bulletinModal && (() => {
                const cfg = BULLETIN_CONFIG[bulletinModal.post.post_type] || BULLETIN_CONFIG.announcement;
                const isInquiry = bulletinModal.type === 'inquire';
                const title = isInquiry ? 'Send Inquiry' : cfg.traineeLabel;
                return (
                    <div className="modal-overlay">
                        <div className="ln-modal" style={{ width: '100%', maxWidth: 460 }}>
                            <div style={{ background: cfg.color, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ fontSize: 20 }}>{cfg.emoji}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>{title}</div>
                                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>{bulletinModal.post.title}</div>
                                </div>
                                <button onClick={() => setBulletinModal(null)} className="ln-close-btn" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}><X size={16} /></button>
                            </div>
                            <div style={{ padding: 20 }}>
                                <div style={{ marginBottom: 14 }}>
                                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                                        {isInquiry ? 'Your Message *' : 'Notes (optional)'}
                                    </label>
                                    <textarea
                                        value={bulletinMessage}
                                        onChange={e => setBulletinMessage(e.target.value)}
                                        placeholder={isInquiry ? "Type your inquiry here..." : "Add a note..."}
                                        rows={4}
                                        className="form-input"
                                        style={{ resize: 'none' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                    <button onClick={() => setBulletinModal(null)} className="ln-btn ln-btn-outline">Cancel</button>
                                    <button
                                        onClick={handleBulletinInteraction}
                                        disabled={bulletinSubmitting || (isInquiry && !bulletinMessage.trim())}
                                        className="ln-btn"
                                        style={{ background: cfg.color, color: '#fff' }}
                                    >
                                        {bulletinSubmitting ? 'Submitting...' : 'Confirm'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </LinkedInLayout>
    );
}
