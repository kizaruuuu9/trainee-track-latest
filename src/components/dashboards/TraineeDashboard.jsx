import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
    usePosts, 
    useJobPostings, 
    useApplications, 
    useTrainees, 
    usePartners, 
    useContactRequests,
    useApplyToJob, 
    useUpdateTrainee, 
    useUpdateApplicationStatus, 
    useDeleteApplication, 
    useSaveInterviewBooking,
    useCreatePost,
    useUpdatePost,
    useDeletePost,
    useCreatePostInteraction,
    useSendContactRequest,
    usePostInteractions,
    useToggleBookmark,
    useInterviewBookings,
    useAvailability,
    usePrograms
} from '../../hooks';
import { useApp } from '../../context/AppContext';
import { getTraineeRecommendedJobs, getMatchRate } from '../../utils/matching';

import SavedItemsView from './SavedItemsView';
import SettingsPage from './SettingsPage';
import NotificationsPage from './NotificationsPage';
import AIResumeBuilder from './AIResumeBuilder';
import {
    User, Briefcase, FileText, CheckCircle, Bell, ChevronDown, ChevronUp, Search, Filter, MapPin, Clock, Building2,
    Award, Send, CheckSquare, Check, X, Eye, EyeOff, Plus, Menu, Home, Settings, LogOut, MessageSquare, Bookmark,
    Trash2, Camera, Loader, GraduationCap, MoveRight, ExternalLink, ShieldCheck, Mail, Calendar, AlignLeft, Users, ChevronRight, ChevronLeft, Edit, Upload, Link, Star, Heart, MoreVertical, Info, LayoutDashboard, Target, FileCheck, AlertCircle, Sparkles
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
import toast from 'react-hot-toast';
import { Routes, Route, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import TopNavBar from '../common/TopNavBar';
import ImageCropModal from '../common/ImageCropModal';
import { normalizeLocation } from '../../lib/psgc';
import { CompactFeedItem, FeedItemDetailModal, BULLETIN_CONFIG, POST_THEME, VerifiedBadge, RealtimeStatus, FeedSkeleton } from './FeedComponents';

const CompanyProfile = React.lazy(() => import('./PartnerDashboard').then(m => ({ default: m.CompanyProfile })));

/* ====================================================================
   LINKEDIN-STYLE TRAINEE DASHBOARD
   ==================================================================== */

// --- TIME AGO HELPER ---
const isValidUrl = (string) => {
    try {
        const url = new URL(string.includes('://') ? string : `https://${string}`);
        const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
        return domainRegex.test(url.hostname);
    } catch (_) {
        return false;
    }
};

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
        PHP: '\u20B1',
        USD: '$',
        EUR: '€',
        GBP: '£',
        JPY: '¥',
    };
    return symbols[code] || '\u20B1';
};

const formatSalaryDisplay = (value = '') => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (raw === 'Confidential') return 'To Be Discussed';
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
const LLN_SCORE_OPTIONS = ['95 and above', '90 to 94', '85 to 89', '80 to 84', '75 to 79'];
const LLN_FIELDS = [
    { key: 'llnReading', label: 'Reading Comprehension' },
    { key: 'llnWriting', label: 'Writing Skills' },
    { key: 'llnMath', label: 'Solving Math Problems' },
    { key: 'llnComputer', label: 'Computer Literacy' },
];
const ETHNIC_GROUP_OPTIONS = ['Tagalog', 'Kapampangan', 'Cebuano', 'Ilocano', 'Hiligaynon', 'Bicolano', 'Waray', 'Moro', 'Others'];
const LANGUAGE_SPOKEN_OPTIONS = ['Filipino', 'English', 'Others'];
const HIGHEST_EDUCATION_OPTIONS = [
    'ALS Graduate/JHS Graduate',
    'Senior School Level',
    'Senior High School Graduate',
    'Diploma Graduate',
    'College Level',
    'College Graduate',
    "With units in master's degree",
    "Master's Graduate",
    "With units in Doctor's degree",
    'Doctoral Graduate',
];
const DISABILITY_OPTIONS = ['None', 'Hearing Disability', 'Speech Impairment', 'Orthopedic (Musculoskeletal) Disability', 'Others'];
const CAUSE_OF_DISABILITY_OPTIONS = ['Congenital/Inborn', 'Illness', 'Injury'];
const HEALTH_CONDITION_OPTIONS = ['None', 'Asthma', 'Heart disease', 'Anemia', 'Hypertension', 'Diabetes', 'Others'];
const LEARNING_STYLE_OPTIONS = ['Visual', 'Kinesthetic', 'Auditory'];
const OTHER_NEEDS_OPTIONS = ['Financially challenged', 'Working student', 'Solo parent', 'Others'];
const learnerFieldStyle = {
    borderRadius: 6,
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
    background: '#ffffff',
};

const resolveTraineeVisibility = (profile) => {
    const value = profile?.personalInfoVisibility ?? profile?.personal_info_visibility;
    return Array.isArray(value) ? value : DEFAULT_TRAINEE_PUBLIC_INFO_FIELDS;
};

const buildLearnerProfileState = (profile = {}) => ({
    llnReading: profile.llnReading || profile.lln_reading || '',
    llnWriting: profile.llnWriting || profile.lln_writing || '',
    llnMath: profile.llnMath || profile.lln_math || '',
    llnComputer: profile.llnComputer || profile.lln_computer || '',
    ethnicGroup: profile.ethnicGroup || profile.ethnic_group || '',
    ethnicGroupOther: profile.ethnicGroupOther || profile.ethnic_group_other || '',
    languageSpoken: profile.languageSpoken || profile.language_spoken || '',
    languageSpokenOther: profile.languageSpokenOther || profile.language_spoken_other || '',
    tribalGroup: profile.tribalGroup || profile.tribal_group || '',
    highestEducation: profile.highestEducation || profile.highest_education || '',
    disability: profile.disability || '',
    disabilityOther: profile.disabilityOther || profile.disability_other || '',
    causeOfDisability: profile.causeOfDisability || profile.cause_of_disability || '',
    healthCondition: profile.healthCondition || profile.health_condition || '',
    healthConditionOther: profile.healthConditionOther || profile.health_condition_other || '',
    learningStyle: profile.learningStyle || profile.learning_style || '',
    otherNeeds: profile.otherNeeds || profile.other_needs || '',
    otherNeedsOther: profile.otherNeedsOther || profile.other_needs_other || '',
});

const formatLearnerValue = (value) => {
    const normalized = String(value ?? '').trim();
    return normalized || '—';
};

const formatOtherAwareValue = (value, otherValue) => {
    const normalized = String(value || '').trim();
    if (!normalized) return '—';
    if (normalized === 'Others') {
        return otherValue ? `Others: ${otherValue}` : 'Others';
    }
    return normalized;
};

const LearnerSummaryCard = ({ label, value }) => (
    <div style={{ padding: '12px 14px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', lineHeight: 1.5 }}>{formatLearnerValue(value)}</div>
    </div>
);

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
        llnReading: profile.llnReading || profile.lln_reading || '',
        llnWriting: profile.llnWriting || profile.lln_writing || '',
        llnMath: profile.llnMath || profile.lln_math || '',
        llnComputer: profile.llnComputer || profile.lln_computer || '',
        ethnicGroup: profile.ethnicGroup || profile.ethnic_group || '',
        ethnicGroupOther: profile.ethnicGroupOther || profile.ethnic_group_other || '',
        languageSpoken: profile.languageSpoken || profile.language_spoken || '',
        languageSpokenOther: profile.languageSpokenOther || profile.language_spoken_other || '',
        tribalGroup: profile.tribalGroup || profile.tribal_group || '',
        highestEducation: profile.highestEducation || profile.highest_education || '',
        disability: profile.disability || '',
        disabilityOther: profile.disabilityOther || profile.disability_other || '',
        causeOfDisability: profile.causeOfDisability || profile.cause_of_disability || '',
        healthCondition: profile.healthCondition || profile.health_condition || '',
        healthConditionOther: profile.healthConditionOther || profile.health_condition_other || '',
        learningStyle: profile.learningStyle || profile.learning_style || '',
        otherNeeds: profile.otherNeeds || profile.other_needs || '',
        otherNeedsOther: profile.otherNeedsOther || profile.other_needs_other || '',
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


// --- TOP NAVIGATION BAR (LinkedIn-style) ---
// --- LEFT NAVIGATION BAR ---
const TraineeSideNav = ({ activePage, setActivePage }) => {
    const { currentUser } = useApp();
    const navigate = useNavigate();

    // Trainee-specific data
    const initials = (currentUser?.name || '').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T';

    const navItems = [
        { id: 'dashboard', label: 'Home', icon: <LayoutDashboard size={18} /> },
        { id: 'recommendations', label: 'Opportunities', icon: <Target size={18} /> },
        { id: 'applications', label: 'My Applications', icon: <FileCheck size={18} /> },
    ];

    return (
        <aside className="tt-sidenav">
            <div
                className="tt-sidenav-profile"
                onClick={() => setActivePage('profile')}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setActivePage('profile')}
            >
                <div className="tt-sidenav-avatar">
                    {currentUser?.photo
                        ? <img src={currentUser.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={currentUser?.name || 'Profile'} />
                        : initials
                    }
                </div>
                <div className="tt-sidenav-profile-info">
                    <div className="tt-sidenav-profile-name">{currentUser?.name || 'Trainee'}</div>
                    <div className="tt-sidenav-profile-role">TESDA Trainee</div>
                </div>
                <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
            </div>

            <div className="tt-sidenav-section-label">Navigation</div>
            <nav className="tt-sidenav-nav">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        className={`tt-sidenav-item ${activePage === item.id ? 'active' : ''}`}
                        onClick={() => setActivePage(item.id)}
                        title={item.label}
                    >
                        <span className="tt-sidenav-item-icon">
                            {item.icon}
                        </span>
                        <span className="tt-sidenav-item-label">{item.label}</span>
                    </button>
                ))}
            </nav>
        </aside>
    );
};

// --- LAYOUT WRAPPER ---
const TraineeLayout = ({ children, activePage, setActivePage }) => (
    <div className="ln-app">
        <TopNavBar activePage={activePage} setActivePage={setActivePage} />
        <TraineeSideNav activePage={activePage} setActivePage={setActivePage} />
        <main className="ln-main">
            {children}
        </main>
    </div>
);

// --- LEFT PROFILE CARD (LinkedIn-style) ---
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

// --- RIGHT SIDEBAR WIDGET ---
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

// --- PROGRESS BAR HELPER ---
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

// --- PAGE 1: DASHBOARD HOME (LinkedIn Feed-style) ---
const TraineeDashboardHome = ({ 
    setActivePage, openBulletinModal, openContactModal, openApplyModal, toggleBookmark,
    editingPostId, setEditingPostId, editContent, setEditContent, postMenuId, setPostMenuId,
    handleEditPost, handleSaveEdit, setConfirmDeleteId, onViewDetail,
    contactedJobIds = [], contactedPostIds = []
}) => {
    const { currentUser, getUserPostInteraction, createPostInteraction } = useApp();
    const createPostMutation = useCreatePost();
    const updatePostMutation = useUpdatePost();
    const deletePostMutation = useDeletePost();
    const applyToJobMutation = useApplyToJob();
    const updateTraineeMutation = useUpdateTrainee();
    const createPostInteractionMutation = useCreatePostInteraction();
    const sendContactRequestMutation = useSendContactRequest();
    const { data: trainees = [] } = useTrainees();
    const { data: partners = [] } = usePartners();
    const { data: posts = [], isLoading: isLoadingPosts, isFetching: isFetchingPosts } = usePosts(40);
    const { data: jobPostings = [], isLoading: isLoadingJobs, isFetching: isFetchingJobs } = useJobPostings(40);
    const { data: applications = [], isLoading: isLoadingApps, isFetching: isFetchingApps } = useApplications();
    const { data: postInteractions = [], isFetching: isFetchingInteractions } = usePostInteractions({ userId: currentUser?.id });
    
    // 1. Get all potential saved IDs
    const profileSavedJobIds = currentUser?.savedOpportunities || [];
    const interactionSavedIds = postInteractions
        .filter(i => i.interaction_type === 'save')
        .map(i => i.post_id);
    const allSavedIds = useMemo(() => [...new Set([...profileSavedJobIds, ...interactionSavedIds])], [profileSavedJobIds, interactionSavedIds]);

    // 2. Fetch specific items to verify existence and author validity
    const { data: verifiedSavedJobs = [] } = useJobPostings({ ids: allSavedIds });
    const { data: verifiedSavedPosts = [] } = usePosts({ ids: allSavedIds });

    const savedItemsCount = useMemo(() => {
        let count = 0;
        // Count verified jobs that have valid partners
        count += verifiedSavedJobs.filter(j => j.hasValidPartner !== false).length;
        // Count verified posts
        count += verifiedSavedPosts.length;
        return count;
    }, [verifiedSavedJobs, verifiedSavedPosts]);
    
    const isLoading = isLoadingPosts || isLoadingJobs || isLoadingApps;
    const isFetching = isFetchingPosts || isFetchingJobs || isFetchingApps || isFetchingInteractions;
    const navigate = useNavigate();
    const trainee = currentUser || trainees[0];
    const myApps = applications.filter(a => a.traineeId === trainee?.id);
    const myAppJobIds = myApps.map(a => a.jobId);
    const mySavedJobIds = useMemo(() => Array.isArray(currentUser?.savedOpportunities) ? currentUser.savedOpportunities : [], [currentUser?.savedOpportunities]);
    const recJobs = useMemo(() => getTraineeRecommendedJobs(trainee, jobPostings), [trainee, jobPostings]);

    // Feed Filter and Search state
    const [feedViewMode, setFeedViewMode] = useState('list');
    const [feedFilter, setFeedFilter] = useState('All');
    const [feedSearchText, setFeedSearchText] = useState('');
    const [visibleFeedCount, setVisibleFeedCount] = useState(20);
    const [feedCurrentPage, setFeedCurrentPage] = useState(1);
    const feedPageSize = 20;

    const ADMIN_ID = 'de305d54-75b4-431b-adb2-eb6b9e546014';
    const unifiedFeed = useMemo(() => {
        const BULLETIN_TYPES = ['training_batch', 'exam_schedule', 'certification_assessment', 'announcement'];
        return [
            ...posts.map(p => ({
                ...p,
                feedType: (BULLETIN_TYPES.includes(p.post_type) && p.author_type !== 'industry_partner') ? 'bulletin' : 'post'
            }))
        ]
            .filter(p => {
                const authorType = String(p.author_type || '').toLowerCase();
                const isTrainee = authorType === 'student' || authorType === 'trainee';
                const isOwnPost = String(p.author_id) === String(trainee?.id || currentUser?.id);

                // Hide job posts from main feed (they belong in Opportunities tab)
                if (p.post_type === 'hiring_update' || p.feedType === 'job') return false;

                // Trainee should not see other trainee posts
                if (isTrainee && !isOwnPost) return false;

                return true;
            })
            .sort((a, b) => new Date(b.created_at || b.createdAt || b.datePosted) - new Date(a.created_at || a.createdAt || a.datePosted));
    }, [posts, trainee?.id, currentUser?.id]);

    const filteredFeed = useMemo(() => {
        let list = unifiedFeed;
        if (feedFilter === 'All' || feedFilter === 'Recommended') {
        } else if (feedFilter === 'Announcement') {
            list = list.filter(item => (item.post_type === 'announcement' || item.feedType === 'bulletin') &&
                ['industry_partner', 'admin', 'partner'].includes(item.author_type || item.role));
        }

        if (feedSearchText.trim()) {
            const query = feedSearchText.toLowerCase();
            list = list.filter(item => {
                const searchableText = `${item.title || ''} ${item.content || ''} ${item.description || ''} ${item.company_name || ''} ${item.jobTitle || ''} ${item.author?.name || ''} ${item.profileName || ''}`.toLowerCase();
                return searchableText.includes(query);
            });
        }
        return list;
    }, [unifiedFeed, feedFilter, feedSearchText]);

    // Post interactions use parent props

    // Modal state
    const [showPostModal, setShowPostModal] = useState(false);
    const [postContent, setPostContent] = useState({});
    const [isPosting, setIsPosting] = useState(false);
    const [postType, setPostType] = useState('lf_job');
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const fileInputRef = useRef(null);
    const contactFileInputRef = useRef(null);
    const openProfile = (target) => {
        if (!target?.id || !target?.type) return;
        const profileType = normalizeProfileType(target.type);
        if (!profileType) return;
        navigate(`/trainee/profile-view/${profileType}/${target.id}`);
    };




    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const handleResize = () => {
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const activeFeedModal = showPostModal;
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
    }, [showPostModal]);



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
        if (!postContent.description?.trim() && !selectedFile) return;
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

            const res = await createPostMutation.mutateAsync({
                content: (postContent.description || '').trim(),
                post_type: 'general',
                title: (postContent.title || '').trim() || null,
                media_url: media_url,
                tags: []
            });

            if (res) {
                toast.success('Post created successfully!');
                setPostContent({});
                setSelectedFile(null);
                setFilePreview(null);
                setShowPostModal(false);
            } else {
                toast.error(res.error || 'Failed to create post.');
            }
        } catch (err) {
            console.error('Posting error:', err);
            toast.error('Failed to post: ' + err.message);
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

    // Application logic is managed by parent TraineeDashboard component







    // Handlers are now passed as props from parent TraineeDashboard

    const stats = [
        { label: 'Job Applications', value: myApps.length, icon: <Send size={20} />, color: '#057642' },
        { label: 'Active Interviews', value: myApps.filter(a => String(a.status).toLowerCase() === 'interview scheduled').length, icon: <Calendar size={20} />, color: '#7c3aed' },
        { label: 'Offers Received', value: myApps.filter(a => ['accepted', 'offered'].includes(String(a.status).toLowerCase())).length, icon: <Award size={20} />, color: '#0a66c2' },
        { label: 'Saved for Later', value: savedItemsCount, icon: <Bookmark size={20} />, color: '#d97706' },
    ];



    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, alignItems: 'start', width: '100%' }}>
            <div style={{ minWidth: 0 }}>
                {/* Dashboard Summary / Stats */}
                <div className="ln-card ln-stats-row" style={{ marginBottom: 16 }}>
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
                                        <span style={{ fontSize: 12, color: '#65676b', marginTop: 2, display: 'block' }}>📝 Public Post</span>
                                    </div>
                                </div>

                                <input
                                    type="text"
                                    placeholder="Title (optional)"
                                    value={postContent.title || ''}
                                    onChange={e => setPostContent({ ...postContent, title: e.target.value })}
                                    maxLength={100}
                                    style={{
                                        width: '100%', border: 'none', borderBottom: '1px solid #f0f2f5', fontSize: 16,
                                        fontWeight: 600, padding: '0 0 8px', outline: 'none', marginBottom: 12,
                                        color: '#1c1e21', background: 'transparent'
                                    }}
                                />

                                <textarea
                                    autoFocus
                                    placeholder="What's on your mind?"
                                    style={{
                                        width: '100%', border: 'none', resize: 'none', fontSize: 15,
                                        minHeight: filePreview ? 80 : 120, padding: 0, outline: 'none', marginBottom: 4,
                                        color: '#1c1e21'
                                    }}
                                    value={postContent.description || ''}
                                    onChange={e => { if (e.target.value.length <= 500) setPostContent({ ...postContent, description: e.target.value }); }}
                                    maxLength={500}
                                />
                                <div style={{ fontSize: 12, color: (postContent.description || '').length >= 450 ? '#dc2626' : '#94a3b8', textAlign: 'right', marginBottom: 16 }}>
                                    {(postContent.description || '').length}/500
                                </div>

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

                                <div style={{
                                    border: '1px solid #e4e6eb', borderRadius: 8, padding: '12px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    marginBottom: 16
                                }}>
                                    <span style={{ fontWeight: 600, fontSize: 14 }}>Add a photo</span>
                                    <div style={{ display: 'flex', gap: 12, color: '#65676b' }}>
                                        <input
                                            type="file"
                                            hidden
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            accept="image/*"
                                        />
                                        <Camera size={22} cursor="pointer" onClick={() => fileInputRef.current.click()} />
                                    </div>
                                </div>

                                <button
                                    className="ln-btn-primary"
                                    style={{
                                        width: '100%', height: 36, borderRadius: 6, fontWeight: 600,
                                        opacity: (postContent.description?.trim() || selectedFile) && !isPosting ? 1 : 0.5,
                                        cursor: (postContent.description?.trim() || selectedFile) && !isPosting ? 'pointer' : 'not-allowed'
                                    }}
                                    disabled={(!postContent.description?.trim() && !selectedFile) || isPosting}
                                    onClick={handleCreatePost}
                                >
                                    {isPosting ? 'Posting...' : 'Post'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Feed Filter and Search */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)', alignItems: 'center', marginBottom: 16, gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Community Feed</h3>
                        <RealtimeStatus isFetching={isFetching} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', minWidth: '150px', maxWidth: '800px', width: 'clamp(200px, 40vw, 800px)' }}>
                            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '10px' }} />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={feedSearchText}
                                onChange={(e) => setFeedSearchText(e.target.value)}
                                style={{
                                    padding: '8px 12px 8px 32px',
                                    borderRadius: 8,
                                    border: '1px solid #cbd5e1',
                                    background: '#fff',
                                    fontSize: 14,
                                    color: '#0f172a',
                                    outline: 'none',
                                    width: '100%'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'center' }}>
                        <select
                            style={{
                                padding: '8px 12px',
                                borderRadius: 8,
                                border: '1px solid #cbd5e1',
                                background: '#fff',
                                fontSize: 14,
                                color: '#1e293b',
                                cursor: 'pointer',
                                outline: 'none',
                                fontWeight: 500
                            }}
                            value={feedFilter}
                            onChange={(e) => {
                                setFeedFilter(e.target.value);
                                setFeedCurrentPage(1);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                        >
                            <option value="All">All</option>
                            <option value="Announcement">Announcement</option>
                        </select>

                        <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
                            <button
                                style={{ padding: '8px 12px', border: 'none', background: feedViewMode === 'grid' ? '#f1f5f9' : 'transparent', cursor: 'pointer', color: feedViewMode === 'grid' ? '#0f172a' : '#64748b', display: 'flex', alignItems: 'center' }}
                                onClick={() => setFeedViewMode('grid')}
                                title="Grid View"
                            >
                                <LayoutDashboard size={16} />
                            </button>
                            <button
                                style={{ padding: '8px 12px', border: 'none', borderLeft: '1px solid #e2e8f0', background: feedViewMode === 'list' ? '#f1f5f9' : 'transparent', cursor: 'pointer', color: feedViewMode === 'list' ? '#0f172a' : '#64748b', display: 'flex', alignItems: 'center' }}
                                onClick={() => setFeedViewMode('list')}
                                title="List View"
                            >
                                <AlignLeft size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Unified Feed Grid */}
                <div className={feedViewMode === 'list' ? "tt-feed-list" : "tt-feed-grid"} style={feedViewMode === 'list' ? { display: 'flex', flexDirection: 'column', gap: '16px' } : {}}>
                    {isLoading ? (
                        <FeedSkeleton count={6} viewMode={feedViewMode} />
                    ) : (
                        <>
                            {filteredFeed.slice((feedCurrentPage - 1) * feedPageSize, feedCurrentPage * feedPageSize).map(item => {
                        if (feedViewMode === 'list') {
                            if (editingPostId === item.id) {
                                return (
                                    <div key={`edit-${item.id}`} className="ln-card ln-feed-card" style={{ padding: 20 }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Edit Post</div>
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            style={{
                                                width: '100%', minHeight: 120, padding: 12, borderRadius: 8,
                                                border: '1px solid #4f46e5', fontSize: 14, outline: 'none', resize: 'vertical',
                                                fontFamily: 'inherit'
                                            }}
                                            placeholder="What's on your mind?"
                                        />
                                        <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => { setEditingPostId(null); setEditContent(''); }}
                                                style={{ padding: '8px 20px', borderRadius: 20, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#475569' }}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleSaveEdit(item.id)}
                                                style={{ padding: '8px 20px', borderRadius: 20, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                                            >
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                );
                            }
                            return <CompactFeedItem
                                key={`compact-${item.id}`}
                                item={item}
                                isOwnPost={item.author_id === currentUser?.id}
                                postMenuId={postMenuId}
                                setPostMenuId={setPostMenuId}
                                onEdit={handleEditPost}
                                onDelete={(id) => setConfirmDeleteId(id)}
                                onInquire={(i) => {
                                    openContactModal({
                                        recipientId: i.partnerId || i.author_id,
                                        recipientType: i.feedType === 'job' ? 'industry_partner' : (i.author_type === 'admin' ? 'admin' : (i.author_type || 'partner')),
                                        recipientName: i.companyName || i.name || 'Recipient',
                                        jobPostingId: i.feedType === 'job' ? i.id : undefined,
                                        sourceLabel: i.title,
                                    });
                                }}
                                 onSave={() => toggleBookmark(item.id)}
                                 onApply={(i, type) => i.feedType === 'job' ? openApplyModal(i) : openBulletinModal(i, type)}
                                 openProfile={openProfile}
                                 applied={item.feedType === 'job' ? myAppJobIds.includes(item.id) : !!getUserPostInteraction(item.id, 'apply')}
                                 contacted={item.feedType === 'job' ? contactedJobIds.includes(item.id) : contactedPostIds.includes(item.id)}
                                 saved={item.feedType === 'job' ? mySavedJobIds.includes(item.id) : !!getUserPostInteraction(item.id, 'save')}
                                onViewDetail={(i) => {
                                    if (onViewDetail) {
                                        onViewDetail(i);
                                    }
                                }}
                            />;
                        }
                        if (item.feedType === 'bulletin') {
                            const cfg = BULLETIN_CONFIG[item.post_type] || BULLETIN_CONFIG.announcement;
                            const alreadyInteracted = getUserPostInteraction(item.id, cfg.type);
                            const statusColors = { Open: { bg: '#dcfce7', color: '#16a34a' }, Full: { bg: '#fef3c7', color: '#d97706' }, Closed: { bg: '#fee2e2', color: '#dc2626' } };
                            const sc = statusColors[item.status] || statusColors.Open;
                            const reqs = Array.isArray(item.requirements) ? item.requirements : [];
                            return (
                                <div key={`bulletin-${item.id}`} className="ln-card ln-feed-card" onClick={() => onViewDetail?.(item)} style={{ marginBottom: 0, borderLeft: `4px solid ${cfg.color}`, cursor: 'pointer' }}>
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
                                                })()} | {timeAgo(item.created_at)}
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
                                                    <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2, lineHeight: 1 }}>...</span>
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
                                        <h4 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>{item.title}</h4>
                                        <p style={{ fontSize: 14.5, color: '#475569', lineHeight: 1.6 }}>{item.content}</p>
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
                                    {item.author_id !== (currentUser?.id || trainee?.id) && (
                                        <div className="ln-feed-actions" style={{ borderTop: '1px solid #f3f3f3', padding: '8px 12px', display: 'flex', gap: 8 }}>
                                            {cfg.type && (
                                                <button
                                                    className="ln-feed-action-btn"
                                                    disabled={!!alreadyInteracted || item.status === 'Closed' || item.status === 'Full'}
                                                    onClick={(e) => { e.stopPropagation(); openBulletinModal(item, cfg.type); }}
                                                    style={alreadyInteracted ? { color: cfg.color, fontWeight: 700 } : {}}
                                                >
                                                    {alreadyInteracted ? <><CheckCircle size={14} /> Applied</> : <><Send size={14} /> {cfg.traineeLabel}</>}
                                                </button>
                                            )}
                                            <button className="ln-feed-action-btn" onClick={(e) => { e.stopPropagation(); openBulletinModal(item, 'inquire'); }}>
                                                <MessageSquare size={14} /> Inquire
                                            </button>
                                            <button
                                                className="ln-feed-action-btn"
                                                onClick={(e) => { e.stopPropagation(); toggleBookmark(item.id); }}
                                                style={getUserPostInteraction(item.id, 'save') ? { color: '#d97706', fontWeight: 700 } : {}}
                                            >
                                                <Bookmark size={14} fill={getUserPostInteraction(item.id, 'save') ? "currentColor" : "none"} />
                                                {getUserPostInteraction(item.id, 'save') ? 'Saved' : 'Save'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        } else if (item.feedType === 'job') {
                            const applied = myAppJobIds.includes(item.id);
                            const isSaved = (Array.isArray(trainee?.savedOpportunities) && trainee.savedOpportunities.includes(item.id)) || !!getUserPostInteraction(item.id, 'save');
                            const tColor = POST_THEME['job']?.color || '#0a66c2';
                            return (
                                <div key={`job-${item.id}`} className="ln-card ln-feed-card" onClick={() => onViewDetail(item)} style={{ marginBottom: 0, borderLeft: `4px solid ${tColor}`, cursor: 'pointer' }}>
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
                                                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontWeight: 700, color: 'inherit', fontSize: 'inherit', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}
                                                >
                                                    {item.companyName}
                                                    {partners.find(p => p.id === item.partnerId)?.verificationStatus === 'Verified' && (
                                                        <VerifiedBadge size={14} />
                                                    )}
                                                </button>
                                                <span style={{ fontWeight: 400, color: 'rgba(0,0,0,0.45)', marginLeft: 4 }}>posted a new {item.opportunityType}</span>
                                            </div>
                                            <div className="ln-feed-meta">
                                                {[
                                                    (item.industry && String(item.industry).trim().toLowerCase() !== 'general') ? item.industry : '',
                                                    item.location,
                                                    timeAgo(item.createdAt),
                                                ].filter(Boolean).join(' | ')}
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
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                                            <span className="ln-opp-type-badge">{item.opportunityType}</span>
                                            {item.opportunityType !== 'OJT' && item.employmentType && (
                                                <span className="ln-opp-type-badge" style={{ background: '#f8fafc', color: '#64748b' }}>{item.employmentType}</span>
                                            )}
                                            {item.ncLevel && (
                                                <span className="ln-opp-type-badge" style={{ background: '#ede9fe', color: '#6d28d9' }}>{item.ncLevel}</span>
                                            )}
                                        </div>
                                        {item.salaryRange && (
                                            <div style={{ marginBottom: 8 }}>
                                                <span style={{ fontSize: 15, color: '#057642', fontWeight: 700 }}>{formatSalaryDisplay(item.salaryRange)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="ln-feed-actions" style={{ borderTop: '1px solid #f3f3f3', padding: '8px 12px', display: 'flex', gap: 4 }}>
                                        <button
                                            className="ln-feed-action-btn"
                                            disabled={applied || item.status !== 'Open'}
                                            onClick={(e) => { e.stopPropagation(); openApplyModal(item); }}
                                            style={applied ? { color: '#057642', fontWeight: 600 } : {}}
                                        >
                                            {applied ? <><CheckCircle size={14} /> Applied</> : <><Send size={14} /> Apply</>}
                                        </button>
                                        <button
                                            className="ln-feed-action-btn"
                                            onClick={(e) => { e.stopPropagation(); toggleBookmark(item.id); }}
                                            style={isSaved ? { color: '#d97706', fontWeight: 600 } : {}}
                                        >
                                            <Bookmark size={14} fill={isSaved ? '#d97706' : 'none'} /> {isSaved ? 'Saved' : 'Save'}
                                        </button>
                                        <button
                                            className="ln-feed-action-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openContactModal({
                                                    recipientId: item.partnerId,
                                                    recipientType: 'industry_partner',
                                                    recipientName: item.companyName,
                                                    jobPostingId: item.id,
                                                    sourceLabel: item.title,
                                                });
                                            }}
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
                            const tColor = POST_THEME[item.post_type]?.color || POST_THEME['general'].color;

                            return (
                                <div key={`post-${item.id}`} className="ln-card ln-feed-card" onClick={() => onViewDetail(item)} style={{ marginBottom: 0, borderLeft: `4px solid ${tColor}`, cursor: 'pointer' }}>
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
                                                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontWeight: 700, color: 'inherit', fontSize: 'inherit', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}
                                                    >
                                                        {authorName}
                                                        {author?.verificationStatus === 'Verified' && (
                                                            <VerifiedBadge size={14} />
                                                        )}
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
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: '50%', color: '#65676b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    title="More options"
                                                >
                                                    <MoreVertical size={20} />
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
                                                        onClick={() => handleSaveEdit(item.id)}
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
                                    </div>
                                    <div className="ln-feed-actions" style={{ borderTop: '1px solid #f3f3f3', padding: '4px 12px' }}>
                                        <button
                                            className="ln-feed-action-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openContactModal({
                                                    recipientId: item.author_id,
                                                    recipientType: toRecipientAuthorType(item.author_type),
                                                    recipientName: authorName,
                                                    postId: item.id,
                                                    sourceLabel: item.content,
                                                });
                                            }}
                                            disabled={isOwnPost}
                                            style={isOwnPost ? { opacity: 0.55, cursor: 'not-allowed' } : undefined}
                                        >
                                            <MessageSquare size={16} /> {isOwnPost ? 'Your Post' : 'Contact'}
                                        </button>
                                        {!isOwnPost && (
                                            <button
                                                className="ln-feed-action-btn"
                                                onClick={(e) => { e.stopPropagation(); toggleBookmark(item.id); }}
                                                style={getUserPostInteraction(item.id, 'save') ? { color: '#d97706', fontWeight: 700 } : {}}
                                            >
                                                <Bookmark size={14} fill={getUserPostInteraction(item.id, 'save') ? "currentColor" : "none"} />
                                                {getUserPostInteraction(item.id, 'save') ? 'Saved' : 'Save'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        }
                            })}
                            {filteredFeed.length === 0 && (
                                <div className="ln-empty-state"><Search size={48} /><h3>No posts found</h3><p>Try changing your filter or updating your profile.</p></div>
                            )}
                        </>
                    )}
                </div>

                {filteredFeed.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: 20, padding: '16px 0', borderTop: '1px solid #e2e8f0', gap: 12 }}>
                        <div style={{ fontSize: 13, color: '#64748b' }}>
                            Showing <b>{Math.min(filteredFeed.length, (feedCurrentPage - 1) * feedPageSize + 1)}</b> to <b>{Math.min(filteredFeed.length, feedCurrentPage * feedPageSize)}</b> of <b>{filteredFeed.length}</b> items
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button
                                disabled={feedCurrentPage === 1}
                                onClick={() => { setFeedCurrentPage(prev => prev - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: feedCurrentPage === 1 ? 'not-allowed' : 'pointer', opacity: feedCurrentPage === 1 ? 0.5 : 1, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                                <ChevronLeft size={16} /> Previous
                            </button>

                            <div style={{ display: 'flex', gap: 4 }}>
                                {Array.from({ length: Math.ceil(filteredFeed.length / feedPageSize) }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === Math.ceil(filteredFeed.length / feedPageSize) || (p >= feedCurrentPage - 1 && p <= feedCurrentPage + 1))
                                    .map((p, i, arr) => (
                                        <React.Fragment key={p}>
                                            {i > 0 && arr[i - 1] !== p - 1 && <span style={{ color: '#64748b', alignSelf: 'center' }}>...</span>}
                                            <button
                                                style={{
                                                    padding: '6px 10px',
                                                    borderRadius: 8,
                                                    border: '1px solid',
                                                    borderColor: feedCurrentPage === p ? '#2563eb' : '#cbd5e1',
                                                    background: feedCurrentPage === p ? '#2563eb' : '#fff',
                                                    color: feedCurrentPage === p ? '#fff' : '#1e293b',
                                                    fontWeight: feedCurrentPage === p ? 700 : 500,
                                                    cursor: 'pointer',
                                                    fontSize: 13
                                                }}
                                                onClick={() => { setFeedCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                            >
                                                {p}
                                            </button>
                                        </React.Fragment>
                                    ))}
                            </div>

                            <button
                                disabled={feedCurrentPage === Math.ceil(filteredFeed.length / feedPageSize) || Math.ceil(filteredFeed.length / feedPageSize) === 0}
                                onClick={() => { setFeedCurrentPage(prev => prev + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: (feedCurrentPage === Math.ceil(filteredFeed.length / feedPageSize) || Math.ceil(filteredFeed.length / feedPageSize) === 0) ? 'not-allowed' : 'pointer', opacity: (feedCurrentPage === Math.ceil(filteredFeed.length / feedPageSize) || Math.ceil(filteredFeed.length / feedPageSize) === 0) ? 0.5 : 1, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
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

const ApplicationTimeline = ({ traineeId }) => {
    const { data: applications = [] } = useApplications(traineeId);
    const { data: posts = [] } = usePosts();
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
                const rawJob = posts.find(j => String(j.id) === String(app.jobId));
                const job = rawJob ? { ...rawJob, ...(rawJob.details || {}) } : null;
                const step = getStatusStep(app.status);
                const isRejected = step === -1;

                return (
                    <div key={app.id} style={{ padding: 20, background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'flex-start' }}>
                            <div>
                                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{job?.title || 'Direct Contact'}</h4>
                                <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{job?.companyName || 'Industry Partner'} | Applied {timeAgo(app.createdAt)}</div>
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


// --- PAGE 2: PROFILE ---
export const TraineeProfileContent = ({ viewedProfileId = null, onBack = null, openBulletinModal, onViewDetail }) => {
    const { currentUser, userRole, trainees, updateTrainee, getSkillInterestRecommendations, getSkillsDemand } = useApp();
    const applyToJobMutation = useApplyToJob();
    const { data: programsData } = usePrograms();
    const programs = programsData?.data || [];
    
    const { data: posts = [] } = usePosts(40);
    const { data: jobPostings = [] } = useJobPostings(40);
    const { data: postInteractions = [] } = usePostInteractions({ userId: currentUser?.id });

    // 1. Get all potential saved IDs
    const profileSavedJobIds = currentUser?.savedOpportunities || [];
    const interactionSavedIds = postInteractions
        .filter(i => i.interaction_type === 'save')
        .map(i => i.post_id);
    const allSavedIds = useMemo(() => [...new Set([...profileSavedJobIds, ...interactionSavedIds])], [profileSavedJobIds, interactionSavedIds]);

    // 2. Fetch specific items to verify existence and author validity
    const { data: verifiedSavedJobs = [] } = useJobPostings({ ids: allSavedIds });
    const { data: verifiedSavedPosts = [] } = usePosts({ ids: allSavedIds });

    const savedItemsCount = useMemo(() => {
        let count = 0;
        count += verifiedSavedJobs.filter(j => j.hasValidPartner !== false).length;
        count += verifiedSavedPosts.length;
        return count;
    }, [verifiedSavedJobs, verifiedSavedPosts]);
    const isOwnProfile = !viewedProfileId || String(viewedProfileId) === String(currentUser?.id);
    const isEmployer = userRole === 'partner';
    const [viewedTrainee, setViewedTrainee] = useState(null);
    const [loadingViewedProfile, setLoadingViewedProfile] = useState(false);
    const trainee = isOwnProfile
        ? (currentUser || trainees[0])
        : (viewedTrainee || trainees.find(t => String(t.id) === String(viewedProfileId)));
    const [editingSection, setEditingSection] = useState(null);
    const [activeMenu, setActiveMenu] = useState(null);
    const editing = editingSection !== null;
    const setEditing = (val) => setEditingSection(val ? "all" : null);
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
    const [educHistory, setEducHistory] = useState(() => {
        const hist = trainee?.educHistory || [];
        return hist.map(h => ({
            school: h.school || '',
            level: h.level || '',
            strand: h.strand || '',
            degreeLevel: h.degreeLevel || '',
            course: h.course || '',
            degree: h.degree || '', // legacy fallback
            from: h.from || '',
            to: h.to || ''
        }));
    });
    // eslint-disable-next-line no-unused-vars
    const [savingEduc, setSavingEduc] = useState(false);

    // PQF Education Options
    const [customEducationLevels, setCustomEducationLevels] = useState([]);
    const [pqfProgramsFull, setPqfProgramsFull] = useState([]);

    useEffect(() => {
        const fetchPqfData = async () => {
            try {
                const [levelsRes, progsRes] = await Promise.all([
                    supabase.from('education_levels').select('id, name, requires_program, sort_order').order('sort_order'),
                    supabase.from('pqf_programs').select('id, pqf_level_id, sector, program_name, program_type').eq('is_active', true).order('program_name')
                ]);

                let finalLevels = levelsRes.data || [];
                if (finalLevels.length === 0) {
                    finalLevels = [
                        { id: '1', name: 'Elementary', requires_program: false },
                        { id: '2', name: 'Junior High School', requires_program: false },
                        { id: '3', name: 'Senior High School', requires_program: true },
                        { id: '4', name: 'College', requires_program: true },
                        { id: '5', name: 'Vocational', requires_program: true }
                    ];
                }
                setCustomEducationLevels(finalLevels);
                if (progsRes.data) setPqfProgramsFull(progsRes.data);
            } catch (err) {
                console.error("Error fetching standard education levels", err);
            }
        };
        fetchPqfData();
    }, []);

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
    const [learnerProfile, setLearnerProfile] = useState(() => buildLearnerProfileState(trainee));

    const updateTraining = (idx, field, val) => {
        const arr = [...trainings];
        arr[idx] = { ...arr[idx], [field]: val };
        setTrainings(arr);
    };
    const addTrainingObj = () => setTrainings(prev => [...prev, { program: '', year: '' }]);
    const removeTrainingIdx = (idx) => { setTrainings(prev => prev.filter((_, i) => i !== idx)); };
    const updateLearnerProfile = (field, value) => {
        setLearnerProfile(prev => {
            const next = { ...prev, [field]: value };

            if (field === 'ethnicGroup' && value !== 'Others') next.ethnicGroupOther = '';
            if (field === 'languageSpoken' && value !== 'Others') next.languageSpokenOther = '';
            if (field === 'disability') {
                if (value !== 'Others') next.disabilityOther = '';
                if (!value || value === 'None') next.causeOfDisability = '';
            }
            if (field === 'healthCondition' && value !== 'Others') next.healthConditionOther = '';
            if (field === 'otherNeeds' && value !== 'Others') next.otherNeedsOther = '';

            return next;
        });
    };

    // Employment state
    // eslint-disable-next-line no-unused-vars
    const [editingEmployment, setEditingEmployment] = useState(false);
    const [empForm, setEmpForm] = useState({
        employmentStatus: (['Employed', 'Seeking Employment', 'Not Employed'].includes(trainee?.employmentStatus)
            ? trainee.employmentStatus
            : 'Seeking Employment'),
        employer: trainee?.employer || '',
        jobTitle: trainee?.jobTitle || '',
        dateHired: trainee?.dateHired || '',
    });

    const [isEditingCareerStatus, setIsEditingCareerStatus] = useState(false);
    const [pendingCareerStatus, setPendingCareerStatus] = useState('');

    const handleCareerStatusChange = (newStatus) => {
        setPendingCareerStatus(newStatus);

        toast((t) => (
            <div>
                <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 500, color: '#1e293b' }}>
                    Do you want to save changes to your career status?
                </p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            setIsEditingCareerStatus(false);
                        }}
                        style={{ padding: '6px 12px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                await updateTrainee(trainee.id, { employmentStatus: newStatus });
                                toast.success('Career status updated!');
                                setIsEditingCareerStatus(false);
                            } catch (err) {
                                toast.error('Failed to update status.');
                            }
                        }}
                        style={{ padding: '6px 12px', background: '#0a66c2', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
                    >
                        Confirm / Save
                    </button>
                </div>
            </div>
        ), { duration: Infinity, id: 'career-status-toast' });
    };

    // AI Resume Builder state
    const [showAIBuilder, setShowAIBuilder] = useState(false);

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

    // URL real-time validation state for links
    const [urlValidation, setUrlValidation] = useState({ social: null, work: null });
    const checkWebsiteReachability = async (url, section) => {
        if (!url?.trim()) {
            setUrlValidation(prev => ({ ...prev, [section]: null }));
            return;
        }
        const pattern = new RegExp('^(https?:\\/\\/)?((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|((\\d{1,3}\\.){3}\\d{1,3}))(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*(\\?[;&a-z\\d%_.~+=-]*)?(\\#[-a-z\\d_]*)?$', 'i');
        if (!pattern.test(url)) {
            setUrlValidation(prev => ({ ...prev, [section]: 'invalid' }));
            return;
        }
        setUrlValidation(prev => ({ ...prev, [section]: 'checking' }));
        try {
            const res = await fetch('http://localhost:3001/api/check-website', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url.trim() })
            });
            const data = await res.json();
            setUrlValidation(prev => ({ ...prev, [section]: data.exists ? 'valid' : 'unreachable' }));
        } catch {
            setUrlValidation(prev => ({ ...prev, [section]: 'error' }));
        }
    };

    const urlCheckTimeoutRef = useRef({ social: null, work: null });
    const handleUrlChange = (value, section, updateStateCallback) => {
        updateStateCallback(value);
        setUrlValidation(prev => ({ ...prev, [section]: value.trim() ? 'checking' : null }));

        if (urlCheckTimeoutRef.current[section]) {
            clearTimeout(urlCheckTimeoutRef.current[section]);
        }
        urlCheckTimeoutRef.current[section] = setTimeout(() => {
            checkWebsiteReachability(value, section);
        }, 1500);
    };
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

    const [cropModal, setCropModal] = useState({ isOpen: false, image: null, type: 'photo', aspect: 1 });

    const handleCropComplete = async (croppedBlob) => {
        setCropModal(prev => ({ ...prev, isOpen: false }));
        const file = new File([croppedBlob], `${cropModal.type}_${Date.now()}.jpeg`, { type: 'image/jpeg' });

        if (cropModal.type === 'banner') {
            await handleBannerUpload(file);
        } else {
            await handlePhotoUpload(file);
        }
    };

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
                    .select('id, full_name, student_id, program_id, phone, birthdate, gender, region, province, city, barangay, detailed_address, selfie_url, banner_url, front_id_url, back_id_url, employment_status, employment_work, employment_start, graduate_school, educ_history, work_experience, resume_url, profile_completed, created_at, updated_at, profile_picture_url, skills, interests, certifications, graduation_year, training_status, contact_email, activity_status, last_seen_at, personal_info_visibility, trainings, bio, employer, job_title, date_hired, programs(name, nc_level)')
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
        setLearnerProfile(buildLearnerProfileState(trainee));

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
            employmentStatus: (['Employed', 'Seeking Employment', 'Not Employed'].includes(trainee?.employmentStatus)
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

    // --- Photo upload handler ---
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
                const res = await updateTrainee(trainee.id, { photo: publicUrl });
                if (res?.success) toast.success('Profile photo updated!');
            }
        } catch (err) {
            console.error('Photo upload error:', err);
            alert('Failed to upload photo.');
        } finally {
            setUploadingPhoto(false);
        }
    };

    // --- Banner upload handler ---
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
                const res = await updateTrainee(trainee.id, { bannerUrl: publicUrl });
                if (res?.success) toast.success('Cover photo updated!');

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

    const validateEducRow = (edu) => {
        if (!edu.school?.trim() || !edu.from || !edu.to) return false;
        if (String(edu.from).trim().length !== 4 || String(edu.to).trim().length !== 4) return false;
        if (Number(edu.from) > Number(edu.to)) return false;
        if (!edu.level && edu.degree?.trim()) return true; // legacy fallback
        if (!edu.level) return false;

        const selectedLvl = customEducationLevels.find(l => l.name === edu.level);
        if (selectedLvl && selectedLvl.requires_program && !edu.course) return false;
        return true;
    };

    const updateEduc = (idx, field, val) => {
        const arr = [...educHistory];
        arr[idx] = { ...arr[idx], [field]: val };
        setEducHistory(arr);
    };
    const addEducObj = () => {
        for (let i = 0; i < educHistory.length; i++) {
            if (!validateEducRow(educHistory[i])) {
                toast.error(`Please complete Education Entry #${i + 1} correctly before adding a new one.`);
                return;
            }
        }
        if (educHistory.length >= 15) {
            toast.error('Maximum of 15 entries allowed.');
            return;
        }
        setEducHistory(prev => [...prev, { school: '', level: '', strand: '', degreeLevel: '', course: '', degree: '', from: '', to: '' }]);
    };
    const removeEducIdx = (idx) => { setEducHistory(prev => prev.filter((_, i) => i !== idx)); };
    // eslint-disable-next-line no-unused-vars
    const saveEduc = async () => {
        if (!isOwnProfile) return;
        setSavingEduc(true);
        const res = await updateTrainee(trainee.id, { educHistory });
        if (res?.success) toast.success('Education history updated!');
        else toast.error('Failed to update education history.');
        setSavingEduc(false);
    };

    const updateWork = (idx, field, val) => {
        const arr = [...workExperience];
        arr[idx] = { ...arr[idx], [field]: val };
        setWorkExperience(arr);
    };
    const addWorkObj = () => setWorkExperience(prev => [{ company: '', position: '', website: '', from: '', to: '', description: '' }, ...prev]);
    const removeWorkIdx = (idx) => { setWorkExperience(prev => prev.filter((_, i) => i !== idx)); };
    // eslint-disable-next-line no-unused-vars
    const saveWork = async () => {
        if (!isOwnProfile) return;
        setSavingWork(true);
        const res = await updateTrainee(trainee.id, { workExperience });
        if (res?.success) toast.success('Work experience updated!');
        else toast.error('Failed to update work experience.');
        setSavingWork(false);
    };

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
        try {
            await applyToJobMutation.mutateAsync({
                traineeId: trainee?.id,
                jobId: applyJob.id,
                applicationMessage,
                resumeUrl: resumeInfo?.file_url,
                resumeName: resumeInfo?.file_name || 'Resume'
            });
            toast.success('Application submitted successfully!');
            setApplyJob(null);
            setApplicationMessage('');
        } catch (err) {
            alert(err.message || 'Failed to submit application.');
        } finally {
            setSubmittingApplication(false);
        }
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


    // Click outside listener for 3-dot menus
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.ln-menu-container')) {
                setActiveMenu(null);
            }
        };
        if (activeMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeMenu]);


    const handleCancelEdit = (section) => {
        switch (section) {
            case 'summary':
                setForm(prev => ({ ...prev, bio: trainee?.bio || '' }));
                break;
            case 'personalInfo':
                setForm(prev => ({
                    ...prev,
                    name: trainee?.fullName || trainee?.name || '',
                    email: trainee?.contactEmail || trainee?.email || '',
                    address: trainee?.detailedAddress || '',
                    birthday: trainee?.birthdate || '',
                    gender: trainee?.gender || '',
                    program: trainee?.program?.name || trainee?.program || '',
                    programId: trainee?.programId || ''
                }));
                // setPersonalInfoVisibility if needed, but it's okay to skip
                break;
            case 'educHistory':
                setEducHistory(() => {
                    const hist = trainee?.educHistory || [];
                    return hist.map(h => ({ ...h }));
                });
                break;
            case 'workExp':
                setWorkExperience(() => {
                    const exp = trainee?.workExperience || [];
                    return exp.map(w => ({ ...w }));
                });
                break;
            case 'training':
                setTrainings(() => {
                    const tArr = Array.isArray(trainee?.trainings) ? trainee.trainings.map(t => ({ ...t, status: t.status || trainee.trainingStatus || 'Student' })) : [];
                    if (tArr.length === 0 && trainee?.program) {
                        return [{ program: trainee.program, year: trainee.graduationYear || '', ncLevel: trainee.ncLevel || '', status: trainee.trainingStatus || 'Student' }];
                    }
                    return tArr;
                });
                setTrainingForm({ graduationYear: trainee?.graduationYear || '' });
                break;
            case 'learner':
                // For learner profile, buildLearnerProfileState is already in scope but wait, is it?
                // Yes, buildLearnerProfileState is outside the component.
                setLearnerProfile(buildLearnerProfileState(trainee));
                break;
            case 'skills':
                setNewSkill('');
                setForm(prev => ({ ...prev, skills: trainee?.skills || [] }));
                break;
            case 'interests':
                setNewInterest('');
                setInterestsList(trainee?.interests || []);
                break;
            case 'documents':
                setDocLabel('');
                setDocFile(null);
                break;
            case 'links':
                setLinkTitle('');
                setDocLinkUrl('');
                setUrlValidation(prev => ({ ...prev, social: null }));
                break;
            default:
                break;
        }
        setEditingSection(null);
    };

    const SECTION_LABELS = { summary: 'Professional Summary', personalInfo: 'Personal Information', educHistory: 'Educational History', workExp: 'Work Experience', training: 'Training & Certifications', learner: 'Learner Profile', skills: 'Skills', interests: 'Interests', documents: 'Documents', links: 'Social & Portfolio Links' };

    const saveSection = async (sectionName) => {
        if (!isOwnProfile) return;
        setSaving(true);
        try {
            let payload = {};

            switch (sectionName) {
                case 'summary':
                    payload = { bio: form.bio };
                    break;
                case 'personalInfo': {
                    if (!form.name?.trim()) { toast.error('Full Name is required.'); setSaving(false); return; }
                    if (!form.email?.trim()) { toast.error('Contact Email is required.'); setSaving(false); return; }
                    if (form.birthday) {
                        const bd = new Date(form.birthday);
                        const today = new Date();
                        let age = today.getFullYear() - bd.getFullYear();
                        const m = today.getMonth() - bd.getMonth();
                        if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
                        if (age < 15) { toast.error('You must be at least 15 years old.'); setSaving(false); return; }
                    }
                    payload = { name: form.name, email: form.email, address: form.address, birthday: form.birthday, gender: form.gender, program: form.program, programId: form.programId, personalInfoVisibility };
                    break;
                }
                case 'educHistory': {
                    for (let i = 0; i < educHistory.length; i++) {
                        const edu = educHistory[i];
                        if (!validateEducRow(edu)) {
                            if (!edu.from || String(edu.from).trim().length !== 4 || !edu.to || String(edu.to).trim().length !== 4) {
                                toast.error(`Please enter a valid 4-digit year for Education #${i + 1}.`);
                            } else if (edu.from && edu.to && Number(edu.from) > Number(edu.to)) {
                                toast.error(`Invalid year range for Education #${i + 1} (The graduation year cannot be earlier than the start year).`);
                            } else {
                                toast.error(`Please fill all required fields for Education #${i + 1}.`);
                            }
                            setSaving(false); return;
                        }
                    }
                    payload = { educHistory };
                    break;
                }
                case 'workExp': {
                    for (let i = 0; i < workExperience.length; i++) {
                        const work = workExperience[i];
                        if (!String(work.company || '').trim() || !String(work.position || '').trim() || !String(work.from || '').trim() || !String(work.to || '').trim()) {
                            toast.error(`Please fill all fields for Work Experience #${i + 1}.`); setSaving(false); return;
                        }
                        if (work.from && work.to && new Date(work.from) > new Date(work.to)) {
                            toast.error(`Start Date cannot be after End Date for Work Experience #${i + 1}.`); setSaving(false); return;
                        }
                        if (work.website && work.website.trim()) {
                            if (!isValidUrl(work.website)) {
                                toast.error(`Please enter a valid company website for Work Experience #${i + 1}.`);
                                setSaving(false); return;
                            }
                        }
                    }
                    payload = { workExperience };
                    break;
                }
                case 'training': {
                    for (let i = 0; i < trainings.length; i++) {
                        const t = trainings[i];
                        if (!String(t.program || '').trim()) {
                            toast.error(`Please select a Program for Training #${i + 1}.`);
                            setSaving(false); return;
                        }
                        if (!String(t.year || '').trim() || String(t.year || '').trim().length !== 4) {
                            toast.error(`Please enter a valid 4-digit year for Training #${i + 1}.`);
                            setSaving(false); return;
                        }
                    }
                    payload = {
                        trainings,
                        trainingStatus: (trainings && trainings.length > 0) ? trainings[0].status : (trainee?.trainingStatus || 'Student'),
                        graduationYear: (trainings && trainings.length > 0 && trainings[0].status === 'Graduated') ? trainings[0].year : (trainee?.graduationYear || ''),
                    };
                    break;
                }
                case 'learner': {
                    const lerrors = [];
                    if (learnerProfile.ethnicGroup === 'Others' && !String(learnerProfile.ethnicGroupOther || '').trim()) lerrors.push('Please specify the ethnic group.');
                    if (learnerProfile.languageSpoken === 'Others' && !String(learnerProfile.languageSpokenOther || '').trim()) lerrors.push('Please specify the language spoken.');
                    if (learnerProfile.disability === 'Others' && !String(learnerProfile.disabilityOther || '').trim()) lerrors.push('Please specify the disability.');
                    if (learnerProfile.disability && learnerProfile.disability !== 'None' && !String(learnerProfile.causeOfDisability || '').trim()) lerrors.push('Cause of Disability is required.');
                    if (learnerProfile.healthCondition === 'Others' && !String(learnerProfile.healthConditionOther || '').trim()) lerrors.push('Please specify the health condition.');
                    if (learnerProfile.otherNeeds === 'Others' && !String(learnerProfile.otherNeedsOther || '').trim()) lerrors.push('Please specify the learner need.');
                    if (lerrors.length > 0) { toast.error(lerrors[0]); setSaving(false); return; }
                    payload = {
                        ...learnerProfile,
                        ethnicGroupOther: learnerProfile.ethnicGroup === 'Others' ? learnerProfile.ethnicGroupOther : '',
                        languageSpokenOther: learnerProfile.languageSpoken === 'Others' ? learnerProfile.languageSpokenOther : '',
                        disabilityOther: learnerProfile.disability === 'Others' ? learnerProfile.disabilityOther : '',
                        causeOfDisability: learnerProfile.disability && learnerProfile.disability !== 'None' ? learnerProfile.causeOfDisability : '',
                        healthConditionOther: learnerProfile.healthCondition === 'Others' ? learnerProfile.healthConditionOther : '',
                        otherNeedsOther: learnerProfile.otherNeeds === 'Others' ? learnerProfile.otherNeedsOther : '',
                    };
                    break;
                }
                case 'skills':
                    payload = { skills: form.skills };
                    break;
                case 'interests':
                    payload = { interests: interestsList };
                    break;
                case 'documents':
                case 'links':
                    // Documents and Links are saved via upload/delete directly, no profile payload needed
                    setEditingSection(null);
                    setActiveMenu(null);
                    setSaving(false);
                    toast.success(`${SECTION_LABELS[sectionName]} updated.`);
                    return;
                default:
                    break;
            }

            await updateTrainee(trainee.id, payload);
            setEditingSection(null);
            setActiveMenu(null);
            toast.success(`${SECTION_LABELS[sectionName] || 'Section'} saved successfully!`);
        } catch (err) {
            console.error('Save error:', err);
            toast.error('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Keep legacy save for form onSubmit compatibility
    const save = async () => {
        if (editingSection) {
            await saveSection(editingSection);
        }
    };

    // eslint-disable-next-line no-unused-vars
    const saveEmployment = async () => {
        if (!isOwnProfile) return;
        const res = await updateTrainee(trainee.id, {
            ...empForm,
            monthsAfterGraduation: empForm.dateHired ? Math.round((new Date() - new Date(empForm.dateHired)) / (1000 * 60 * 60 * 24 * 30)) : null
        });
        if (res?.success) toast.success('Employment status updated!');
        else toast.error('Failed to update employment status.');
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
                    if (fileInputRef.current) fileInputRef.current.value = '';
                } else {
                    toast.error(result.error || 'Upload failed.');
                }
                setUploading(false);
            };
            reader.readAsDataURL(docFile);
        } catch (err) {
            console.error('Upload error:', err);
            toast.error('Failed to upload document.');
            setUploading(false);
        }
    };

    const handleAddLink = async () => {
        if (!isOwnProfile) return;
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
                    fileData: /^https?:\/\//i.test(docLinkUrl.trim()) ? docLinkUrl.trim() : `https://${docLinkUrl.trim()}`,
                    category: 'link'
                }),
            });
            const result = await res.json();
            if (result.success) {
                setDocuments(prev => Array.isArray(prev) ? [result.document, ...prev] : [result.document]);
                setLinkTitle('');
                setDocLinkUrl('');
                toast.success('Link added successfully.');
            } else {
                toast.error(result.error || 'Failed to add link');
            }
        } catch (err) {
            console.error('Link upload error:', err);
            toast.error('Error connecting to server');
        }
        setUploading(false);
    };

    const deleteDoc = async (docId) => {
        if (!isOwnProfile) return;

        try {
            const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
                setDocuments(prev => Array.isArray(prev) ? prev.filter(d => d.id !== docId) : []);
                toast.success('Document successfully deleted.');
            } else {
                toast.error(`Delete failed: ${result.error}`);
            }
        } catch (err) {
            console.error('Delete error:', err);
            toast.error('Failed to connect to the server to delete document.');
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
                onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = () => setCropModal({ isOpen: true, image: reader.result, type: 'photo', aspect: 1 });
                        reader.readAsDataURL(file);
                    }
                    e.target.value = '';
                }} />
            <input ref={bannerInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = () => setCropModal({ isOpen: true, image: reader.result, type: 'banner', aspect: 4 });
                        reader.readAsDataURL(file);
                    }
                    e.target.value = '';
                }} />
            <input ref={certInputRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }}
                onChange={e => { if (uploadingIdx !== null) handleCertUpload(uploadingIdx, e.target.files[0]); e.target.value = ''; }} />

            {showAIBuilder && (
                <AIResumeBuilder 
                    trainee={trainee} 
                    onBack={() => setShowAIBuilder(false)} 
                />
            )}
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

            {cropModal.isOpen && (
                <ImageCropModal
                    image={cropModal.image}
                    aspect={cropModal.aspect}
                    onCropComplete={handleCropComplete}
                    onCancel={() => setCropModal(prev => ({ ...prev, isOpen: false }))}
                />
            )}

            {/* Profile Header Card */}
            <div className="ln-card ln-profile-header-card" style={{ position: 'relative' }}>
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
                                        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                                            <span
                                                className="ln-badge"
                                                onClick={() => {
                                                    if (isOwnProfile) {
                                                        setIsEditingCareerStatus(!isEditingCareerStatus);
                                                    }
                                                }}
                                                style={{
                                                    background: statusColors[trainee.employmentStatus] || '#0a66c2',
                                                    color: 'white', fontSize: 11, padding: '2px 10px', borderRadius: 12, fontWeight: 700,
                                                    cursor: isOwnProfile ? 'pointer' : 'default', marginLeft: 12, verticalAlign: 'middle',
                                                    display: 'inline-flex', alignItems: 'center'
                                                }}
                                                title={isOwnProfile ? "Click to edit career status" : ""}
                                            >
                                                {trainee.employmentStatus}
                                                {isOwnProfile && <ChevronDown size={12} style={{ marginLeft: 4, opacity: 0.9 }} />}
                                            </span>

                                            {isEditingCareerStatus && (
                                                <div style={{
                                                    position: 'absolute', top: '100%', left: 12, marginTop: 4,
                                                    background: '#0a66c2', borderRadius: 4, overflow: 'hidden',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 100, minWidth: 140
                                                }}>
                                                    {['Seeking Employment', 'Employed', 'Not Employed'].map(status => (
                                                        <div
                                                            key={status}
                                                            onClick={() => {
                                                                setIsEditingCareerStatus(false);
                                                                if (status !== trainee.employmentStatus) {
                                                                    handleCareerStatusChange(status);
                                                                }
                                                            }}
                                                            style={{
                                                                padding: '6px 12px', fontSize: 11, color: 'white',
                                                                cursor: 'pointer', fontWeight: 600, textAlign: 'center',
                                                                borderBottom: status === 'Not Employed' ? 'none' : '1px solid rgba(255,255,255,0.15)'
                                                            }}
                                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                        >
                                                            {status}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
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
                                        <span>{headerLocationParts.join(' | ')}</span>
                                    </p>
                                )}
                                {showHeaderEmail && trainee?.email && (
                                    <p className="ln-profile-header-contact" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                        <span>{trainee?.email}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                        {/* Resume section removed as per cleanup requirements */}
                    </div>
                </div>
                {isOwnProfile && (
                    <button 
                        type="button" 
                        className="ln-btn-sm" 
                        style={{
                            position: 'absolute', bottom: 16, right: 16,
                            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', 
                            color: 'white',
                            border: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6,
                            padding: '10px 20px', fontWeight: 700,
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                            cursor: 'pointer', zIndex: 10
                        }}
                        onClick={() => setShowAIBuilder(true)}
                    >
                        <Sparkles size={16} /> AI Resume Builder
                    </button>
                )}
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
                        {tab === 'Saved' && (savedItemsCount > 0) && (
                            <span style={{ fontSize: 11, background: '#e2e8f0', padding: '2px 6px', borderRadius: 10, color: '#475569' }}>
                                {savedItemsCount}
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
                                    {isOwnProfile && (!editingSection || editingSection === 'summary') && (
                                        editingSection === 'summary' ? (
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <button type="button" className="ln-btn-sm" style={{ background: '#e2e8f0', color: '#475569' }} onClick={() => handleCancelEdit(editingSection)} disabled={saving}>
                                                    <X size={14} /> Cancel
                                                </button>
                                                <button type="button" className="ln-btn-sm ln-btn-success" onClick={() => saveSection(editingSection)} disabled={saving}>
                                                    <CheckCircle size={14} /> Save
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="ln-menu-container" style={{ position: 'relative' }}>
                                                <button type="button" className="ln-link-btn" style={{ padding: 4 }} onClick={() => setActiveMenu(activeMenu === 'summary' ? null : 'summary')}>
                                                    <MoreVertical size={16} color="#64748b" />
                                                </button>
                                                {activeMenu === 'summary' && (
                                                    <div style={{ position: 'absolute', top: 28, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)', zIndex: 100, padding: 6, minWidth: 140, animation: 'fadeInScale 0.15s ease-out', transformOrigin: 'top right' }}>
                                                        <button type="button" style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#334155', textAlign: 'left' }} onClick={() => { setActiveMenu(null); setEditingSection('summary'); }}>
                                                            <Edit size={14} /> Edit
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    )}
                                </div>
                                <div style={{ padding: '0 20px 20px' }}>
                                    {(editingSection === 'summary') ? (
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
                                            {trainee?.bio || (isOwnProfile ? "No professional summary added yet. Use the ⋯ menu to add one." : "No professional summary provided.")}
                                        </div>
                                    )}
                                </div>
                            </div>


                            {/* Personal Information Section */}
                            <div className="ln-card">
                                <div className="ln-section-header"><h3>Personal Information</h3>
                                    {isOwnProfile && (!editingSection || editingSection === 'personalInfo') && (
                                        editingSection === 'personalInfo' ? (
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <button type="button" className="ln-btn-sm" style={{ background: '#e2e8f0', color: '#475569' }} onClick={() => handleCancelEdit(editingSection)} disabled={saving}>
                                                    <X size={14} /> Cancel
                                                </button>
                                                <button type="button" className="ln-btn-sm ln-btn-success" onClick={() => saveSection(editingSection)} disabled={saving}>
                                                    <CheckCircle size={14} /> Save
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="ln-menu-container" style={{ position: 'relative' }}>
                                                <button type="button" className="ln-link-btn" style={{ padding: 4 }} onClick={() => setActiveMenu(activeMenu === 'personalInfo' ? null : 'personalInfo')}>
                                                    <MoreVertical size={16} color="#64748b" />
                                                </button>
                                                {activeMenu === 'personalInfo' && (
                                                    <div style={{ position: 'absolute', top: 28, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)', zIndex: 100, padding: 6, minWidth: 140, animation: 'fadeInScale 0.15s ease-out', transformOrigin: 'top right' }}>
                                                        <button type="button" style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#334155', textAlign: 'left' }} onClick={() => { setActiveMenu(null); setEditingSection('personalInfo'); }}>
                                                            <Edit size={14} /> Edit
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    )}</div>
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
                                                        {f.label}{f.required && (editingSection === 'personalInfo') && <span style={{ color: '#cc1016', marginLeft: 4 }}>*</span>}
                                                    </label>
                                                    {(editingSection === 'personalInfo') ? (
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
                                                            <input type={f.type} className="form-input" maxLength={f.maxLength} max={f.max} placeholder={f.placeholder} value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                                                        )
                                                    ) : (
                                                        <div className="ln-info-value">{trainee?.[f.key] || '—'}</div>
                                                    )}
                                                    {editingSection === 'personalInfo' && f.required && !String(form[f.key] || '').trim() && (
                                                        <div style={{ fontSize: 12, color: '#cc1016', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={12} /> {f.label} is required</div>
                                                    )}
                                                    {editingSection === 'personalInfo' && f.key === 'birthday' && form.birthday && (function () {
                                                        const bd = new Date(form.birthday);
                                                        const today = new Date();
                                                        let age = today.getFullYear() - bd.getFullYear();
                                                        const m = today.getMonth() - bd.getMonth();
                                                        if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
                                                        if (age < 15) return <div style={{ fontSize: 12, color: '#cc1016', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={12} /> Must be 15 years or older</div>;
                                                        return null;
                                                    })()}
                                                    {isOwnProfile && (editingSection === 'personalInfo') && (
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



                            {/* Educational History Section */}
                            <div className="ln-card">
                                <div className="ln-section-header">
                                    <h3>Educational History</h3>
                                    {isOwnProfile && (!editingSection || editingSection === 'educHistory') && (
                                        editingSection === 'educHistory' ? (
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <button type="button" className="ln-btn-sm" style={{ background: '#e2e8f0', color: '#475569' }} onClick={() => handleCancelEdit(editingSection)} disabled={saving}>
                                                    <X size={14} /> Cancel
                                                </button>
                                                <button type="button" className="ln-btn-sm ln-btn-success" onClick={() => saveSection(editingSection)} disabled={saving}>
                                                    <CheckCircle size={14} /> Save
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="ln-menu-container" style={{ position: 'relative' }}>
                                                <button type="button" className="ln-link-btn" style={{ padding: 4 }} onClick={() => setActiveMenu(activeMenu === 'educHistory' ? null : 'educHistory')}>
                                                    <MoreVertical size={16} color="#64748b" />
                                                </button>
                                                {activeMenu === 'educHistory' && (
                                                    <div style={{ position: 'absolute', top: 28, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)', zIndex: 100, padding: 6, minWidth: 140, animation: 'fadeInScale 0.15s ease-out', transformOrigin: 'top right' }}>
                                                        <button type="button" style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#334155', textAlign: 'left' }} onClick={() => { setActiveMenu(null); setEditingSection('educHistory'); }}>
                                                            <Edit size={14} /> Edit
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    )}
                                    {(editingSection === 'educHistory') && <button type="button" className="ln-btn-sm ln-btn-primary" onClick={addEducObj}><Plus size={12} /> Add</button>}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '0 16px 20px' }}>
                                    {((editingSection === 'educHistory') ? educHistory : [...educHistory].sort((a, b) => (Number(b.to) || 0) - (Number(a.to) || 0)))
                                        .filter((_, i) => editing || showAllEduc || i === 0)
                                        .map((edu, i) => (
                                            <div key={i} style={{ padding: '20px', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                                                            <GraduationCap size={20} color="#64748b" />
                                                        </div>
                                                        <h4 style={{ margin: 0, fontSize: 13, color: '#475569', fontWeight: 600 }}>{(editingSection === 'educHistory') ? `Education Entry #${i + 1}` : 'Education Entry'}</h4>
                                                    </div>
                                                    {(editingSection === 'educHistory') && <button type="button" className="ln-link-btn" style={{ color: '#cc1016', fontSize: 12, padding: 0 }} onClick={(e) => { e.preventDefault(); showConfirm('Are you sure you want to remove this educational history?', () => removeEducIdx(i)); }}><Trash2 size={13} /> Remove</button>}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                                        <div className="ln-info-item" style={{ gridColumn: '1 / -1' }}>
                                                            <label className="ln-info-label" style={{ fontWeight: 700 }}>School / University{(editingSection === 'educHistory') && <span style={{ color: '#cc1016', marginLeft: 4 }}>*</span>}</label>
                                                            {(editingSection === 'educHistory') ? (
                                                                <>
                                                                    <input type="text" required className="form-input" placeholder="e.g. University of the Philippines" maxLength={100} value={edu.school || ''} onChange={e => updateEduc(i, 'school', e.target.value)} />
                                                                    {!String(edu.school || '').trim() && <div style={{ fontSize: 12, color: '#cc1016', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={12} /> School / University is required</div>}
                                                                </>
                                                            ) : <div className="ln-info-value" style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{edu.school || '—'}</div>}
                                                        </div>

                                                        {/* Education Level */}
                                                        <div className="ln-info-item" style={{ gridColumn: '1 / -1' }}>
                                                            <label className="ln-info-label" style={{ fontWeight: 700 }}>Education Level{(editingSection === 'educHistory') && <span style={{ color: '#cc1016', marginLeft: 4 }}>*</span>}</label>
                                                            {(editingSection === 'educHistory') ? (
                                                                <>
                                                                    <select className="form-select" value={edu.level || ''} onChange={e => {
                                                                        const newLevel = e.target.value;
                                                                        const updatedEduc = [...educHistory];
                                                                        updatedEduc[i] = {
                                                                            ...updatedEduc[i],
                                                                            level: newLevel,
                                                                            course: '', // Reset specific course
                                                                            strand: '',
                                                                            degreeLevel: ''
                                                                        };
                                                                        setEducHistory(updatedEduc);
                                                                    }}>
                                                                        <option value="" disabled>Select Level</option>
                                                                        {customEducationLevels.map(l => (
                                                                            <option key={l.id} value={l.name}>{l.name}</option>
                                                                        ))}
                                                                    </select>
                                                                    {!edu.level && <div style={{ fontSize: 12, color: '#cc1016', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={12} /> Education Level is required</div>}
                                                                </>
                                                            ) : (
                                                                <div className="ln-info-value" style={{ fontSize: 14, color: '#475569' }}>
                                                                    {edu.level ? edu.level : (edu.degree ? 'Legacy Entry' : '—')}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Dynamic: Program / Course dependent on chosen educational thresholds */}
                                                        {(() => {
                                                            const selectedLvl = customEducationLevels.find(l => l.name === edu.level);
                                                            if (!selectedLvl || !selectedLvl.requires_program) return null;

                                                            let availablePrograms = [];
                                                            if (edu.level === 'Senior High School') {
                                                                availablePrograms = pqfProgramsFull.filter(p => p.program_type === 'strand');
                                                            } else if (edu.level === 'College') {
                                                                availablePrograms = pqfProgramsFull.filter(p => ['degree', 'diploma'].includes(p.program_type));
                                                            } else if (edu.level === 'Vocational') {
                                                                availablePrograms = pqfProgramsFull.filter(p => ['nc_program', 'program'].includes(p.program_type));
                                                            }

                                                            if (availablePrograms.length === 0) return null;

                                                            return (
                                                                <div className="ln-info-item" style={{ gridColumn: '1 / -1' }}>
                                                                    <label className="ln-info-label" style={{ fontWeight: 700 }}>Program / Course Taken{(editingSection === 'educHistory') && <span style={{ color: '#cc1016', marginLeft: 4 }}>*</span>}</label>
                                                                    {(editingSection === 'educHistory') ? (
                                                                        <>
                                                                            <select className="form-select" value={edu.course || ''} onChange={e => updateEduc(i, 'course', e.target.value)}>
                                                                                <option value="" disabled>Select Program / Course</option>
                                                                                {Array.from(new Set(availablePrograms.map(p => p.program_name))).map(name => (
                                                                                    <option key={name} value={name}>{name}</option>
                                                                                ))}
                                                                            </select>
                                                                            {!edu.course && <div style={{ fontSize: 12, color: '#cc1016', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={12} /> Program / Course is required</div>}
                                                                        </>
                                                                    ) : <div className="ln-info-value" style={{ fontSize: 14, color: '#475569' }}>{edu.course || '—'}</div>}
                                                                </div>
                                                            );
                                                        })()}

                                                        {/* Fallback for legacy display where level is missing but degree has value */}
                                                        {(!editingSection && !edu.level && edu.degree) && (
                                                            <div className="ln-info-item" style={{ gridColumn: '1 / -1' }}>
                                                                <label className="ln-info-label" style={{ fontWeight: 700 }}>Degree / Program</label>
                                                                <div className="ln-info-value" style={{ fontSize: 14, color: '#475569' }}>{edu.degree}</div>
                                                            </div>
                                                        )}

                                                        <div className="ln-info-item">
                                                            <label className="ln-info-label" style={{ fontWeight: 700 }}>Year From{(editingSection === 'educHistory') && <span style={{ color: '#cc1016', marginLeft: 4 }}>*</span>}</label>
                                                            {(editingSection === 'educHistory') ? (
                                                                <>
                                                                    <input type="text" required className="form-input" placeholder="e.g. 2018" value={edu.from || ''} onChange={e => {
                                                                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                                                        updateEduc(i, 'from', val);
                                                                    }} />
                                                                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Enter a 4-digit year (1950–2099)</div>
                                                                    {!String(edu.from || '').trim() && <div style={{ fontSize: 12, color: '#cc1016', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={12} /> Year From is required</div>}
                                                                </>
                                                            ) : <div className="ln-info-value" style={{ fontSize: 13, color: '#64748b' }}>{edu.from ? `Started in ${edu.from}` : '—'}</div>}
                                                        </div>
                                                        <div className="ln-info-item">
                                                            <label className="ln-info-label" style={{ fontWeight: 700 }}>Year To (or expected){(editingSection === 'educHistory') && <span style={{ color: '#cc1016', marginLeft: 4 }}>*</span>}</label>
                                                            {(editingSection === 'educHistory') ? (
                                                                <>
                                                                    <input type="text" required className="form-input" placeholder="e.g. 2022" value={edu.to || ''} onChange={e => {
                                                                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                                                        updateEduc(i, 'to', val);
                                                                    }} />
                                                                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Enter a 4-digit year (1950–2099)</div>
                                                                    {!String(edu.to || '').trim() && <div style={{ fontSize: 12, color: '#cc1016', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={12} /> Year To is required</div>}
                                                                    {edu.from && edu.to && Number(edu.from) > Number(edu.to) && (
                                                                        <div style={{ fontSize: 12, color: '#cc1016', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={12} /> Year From must be before Year To</div>
                                                                    )}
                                                                </>
                                                            ) : <div className="ln-info-value" style={{ fontSize: 13, color: '#64748b' }}>{edu.to ? `Graduated in ${edu.to}` : '—'}</div>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                    {!(editingSection === 'educHistory') && educHistory.length > 1 && (
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
                                    {isOwnProfile && (!editingSection || editingSection === 'workExp') && (
                                        editingSection === 'workExp' ? (
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <button type="button" className="ln-btn-sm" style={{ background: '#e2e8f0', color: '#475569' }} onClick={() => handleCancelEdit(editingSection)} disabled={saving}>
                                                    <X size={14} /> Cancel
                                                </button>
                                                <button type="button" className="ln-btn-sm ln-btn-success" onClick={() => saveSection(editingSection)} disabled={saving}>
                                                    <CheckCircle size={14} /> Save
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="ln-menu-container" style={{ position: 'relative' }}>
                                                <button type="button" className="ln-link-btn" style={{ padding: 4 }} onClick={() => setActiveMenu(activeMenu === 'workExp' ? null : 'workExp')}>
                                                    <MoreVertical size={16} color="#64748b" />
                                                </button>
                                                {activeMenu === 'workExp' && (
                                                    <div style={{ position: 'absolute', top: 28, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)', zIndex: 100, padding: 6, minWidth: 140, animation: 'fadeInScale 0.15s ease-out', transformOrigin: 'top right' }}>
                                                        <button type="button" style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#334155', textAlign: 'left' }} onClick={() => { setActiveMenu(null); setEditingSection('workExp'); }}>
                                                            <Edit size={14} /> Edit
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    )}
                                    {(editingSection === 'workExp') && <button type="button" className="ln-btn-sm ln-btn-primary" onClick={addWorkObj}><Plus size={12} /> Add</button>}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '0 16px 20px' }}>
                                    {((editingSection === 'workExp') ? workExperience : [...workExperience].sort((a, b) => {
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
                                                        <h4 style={{ margin: 0, fontSize: 13, color: '#475569', fontWeight: 600 }}>{(editingSection === 'workExp') ? `Work Entry #${workExperience.length - i}` : 'Work Experience'}</h4>
                                                    </div>
                                                    {(editingSection === 'workExp') && <button type="button" className="ln-link-btn" style={{ color: '#cc1016', fontSize: 12, padding: 0 }} onClick={(e) => { e.preventDefault(); showConfirm('Are you sure you want to remove this work experience?', () => removeWorkIdx(i)); }}><Trash2 size={13} /> Remove</button>}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                                        <div className="ln-info-item" style={{ gridColumn: '1 / -1' }}>
                                                            <label className="ln-info-label" style={{ fontWeight: 700 }}>Company / Organization{(editingSection === 'workExp') && <span style={{ color: '#cc1016', marginLeft: 4 }}>*</span>}</label>
                                                            {(editingSection === 'workExp') ? (
                                                                <>
                                                                    <input type="text" required className="form-input" placeholder="e.g. Google, TESDA, Local Shop" maxLength={100} value={work.company || ''} onChange={e => updateWork(i, 'company', e.target.value)} />
                                                                    {!String(work.company || '').trim() && <div style={{ fontSize: 12, color: '#cc1016', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={12} /> Company name is required</div>}
                                                                </>
                                                            ) : <div className="ln-info-value" style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{work.company || '—'}</div>}
                                                        </div>
                                                        <div className="ln-info-item" style={{ gridColumn: '1 / -1' }}>
                                                            <label className="ln-info-label" style={{ fontWeight: 700 }}>Position / Role{(editingSection === 'workExp') && <span style={{ color: '#cc1016', marginLeft: 4 }}>*</span>}</label>
                                                            {(editingSection === 'workExp') ? (
                                                                <>
                                                                    <input type="text" required className="form-input" placeholder="e.g. IT Technician, Admin Assistant" maxLength={50} value={work.position || ''} onChange={e => updateWork(i, 'position', e.target.value)} />
                                                                    {!String(work.position || '').trim() && <div style={{ fontSize: 12, color: '#cc1016', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={12} /> Position is required</div>}
                                                                </>
                                                            ) : <div className="ln-info-value" style={{ fontSize: 14, color: '#475569' }}>{work.position || '—'}</div>}
                                                        </div>
                                                        <div className="ln-info-item" style={{ gridColumn: '1 / -1' }}>
                                                            <label className="ln-info-label" style={{ fontWeight: 700 }}>Company Website</label>
                                                            {(editingSection === 'workExp') ? (
                                                                <>
                                                                    <input
                                                                        type="text"
                                                                        className="form-input"
                                                                        placeholder="e.g. https://company.com (Optional)"
                                                                        value={work.website || ''}
                                                                        onChange={e => handleUrlChange(e.target.value, 'work', val => updateWork(i, 'website', val))}
                                                                        style={urlValidation.work === 'invalid' || urlValidation.work === 'error' || urlValidation.work === 'unreachable' ? { borderColor: '#ef4444' } : urlValidation.work === 'valid' ? { borderColor: '#10b981' } : {}}
                                                                    />
                                                                    {urlValidation.work === 'checking' && <div style={{ fontSize: 11, color: '#3b82f6', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={12} /> Verifying website...</div>}
                                                                    {urlValidation.work === 'invalid' && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={12} /> Please enter a valid URL (e.g. https://example.com)</div>}
                                                                    {urlValidation.work === 'unreachable' && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={12} /> Website is unreachable or does not exist.</div>}
                                                                    {urlValidation.work === 'error' && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={12} /> Could not verify website. Check connection.</div>}
                                                                    {urlValidation.work === 'valid' && <div style={{ fontSize: 11, color: '#10b981', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={12} /> Website verified successfully.</div>}
                                                                </>
                                                            ) : work.website ? (
                                                                <div className="ln-info-value" style={{ fontSize: 14, color: '#0369a1' }}>
                                                                    <a href={work.website.startsWith('http') ? work.website : `https://${work.website}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#0369a1', textDecoration: 'underline' }}>
                                                                        <ExternalLink size={14} /> {work.website}
                                                                    </a>
                                                                </div>
                                                            ) : <div className="ln-info-value" style={{ fontSize: 14, color: '#64748b' }}>—</div>}
                                                        </div>
                                                        <div className="ln-info-item">
                                                            <label className="ln-info-label" style={{ fontWeight: 700 }}>Start Date{(editingSection === 'workExp') && <span style={{ color: '#cc1016', marginLeft: 4 }}>*</span>}</label>
                                                            {(editingSection === 'workExp') ? (
                                                                <>
                                                                    <input type="date" required className="form-input" max={new Date().toISOString().split('T')[0]} value={work.from || ''} onChange={e => updateWork(i, 'from', e.target.value)} />
                                                                    {!String(work.from || '').trim() && <div style={{ fontSize: 12, color: '#cc1016', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={12} /> Start Date is required</div>}
                                                                </>
                                                            ) : <div className="ln-info-value" style={{ fontSize: 13, color: '#64748b' }}>{work.from || '—'}</div>}
                                                        </div>
                                                        <div className="ln-info-item">
                                                            <label className="ln-info-label" style={{ fontWeight: 700 }}>End Date{(editingSection === 'workExp') && <span style={{ color: '#cc1016', marginLeft: 4 }}>*</span>}</label>
                                                            {(editingSection === 'workExp') ? (
                                                                <>
                                                                    <input type="date" required className="form-input" max={new Date().toISOString().split('T')[0]} value={work.to || ''} onChange={e => updateWork(i, 'to', e.target.value)} />
                                                                    {!String(work.to || '').trim() && <div style={{ fontSize: 12, color: '#cc1016', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={12} /> End Date is required</div>}
                                                                    {work.from && work.to && new Date(work.from) > new Date(work.to) && (
                                                                        <div style={{ fontSize: 12, color: '#cc1016', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={12} /> Start Date must be before End Date</div>
                                                                    )}
                                                                </>
                                                            ) : <div className="ln-info-value" style={{ fontSize: 13, color: '#64748b' }}>{work.to || 'Present'}</div>}
                                                        </div>
                                                        <div className="ln-info-item" style={{ gridColumn: '1 / -1' }}>
                                                            <label className="ln-info-label" style={{ fontWeight: 700 }}>Description / Contributions</label>
                                                            {(editingSection === 'workExp') ? (
                                                                <>
                                                                    <textarea
                                                                        className="form-input"
                                                                        placeholder="Briefly describe your role, responsibilities, and achievements..."
                                                                        rows={3}
                                                                        maxLength={500}
                                                                        style={{ resize: 'vertical' }}
                                                                        value={work.description || ''}
                                                                        onChange={e => updateWork(i, 'description', e.target.value)}
                                                                    />
                                                                    <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'right', marginTop: 4 }}>{(work.description || '').length}/500</div>
                                                                </>
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

                                    {!(editingSection === 'workExp') && workExperience.length > 1 && (
                                        <button
                                            type="button"
                                            className="ln-link-btn"
                                            style={{ alignSelf: 'center', marginTop: -8, fontWeight: 600 }}
                                            onClick={() => setShowAllWork(!showAllWork)}
                                        >
                                            {showAllWork ? 'See Less' : `See More (${workExperience.length - 1} more)`}
                                        </button>
                                    )}
                                    {!(editingSection === 'workExp') && workExperience.length === 0 && (
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
                        <React.Fragment>
                            <div className="ln-card">
                                <div className="ln-section-header">
                                    <h3>TESDA Trainings and Certifications</h3>
                                    {isOwnProfile && (!editingSection || editingSection === 'training') && (
                                        editingSection === 'training' ? (
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <button type="button" className="ln-btn-sm" style={{ background: '#e2e8f0', color: '#475569' }} onClick={() => handleCancelEdit(editingSection)} disabled={saving}>
                                                    <X size={14} /> Cancel
                                                </button>
                                                <button type="button" className="ln-btn-sm ln-btn-success" onClick={() => saveSection(editingSection)} disabled={saving}>
                                                    <CheckCircle size={14} /> Save
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="ln-menu-container" style={{ position: 'relative' }}>
                                                <button type="button" className="ln-link-btn" style={{ padding: 4 }} onClick={() => setActiveMenu(activeMenu === 'training' ? null : 'training')}>
                                                    <MoreVertical size={16} color="#64748b" />
                                                </button>
                                                {activeMenu === 'training' && (
                                                    <div style={{ position: 'absolute', top: 28, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)', zIndex: 100, padding: 6, minWidth: 140, animation: 'fadeInScale 0.15s ease-out', transformOrigin: 'top right' }}>
                                                        <button type="button" style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#334155', textAlign: 'left' }} onClick={() => { setActiveMenu(null); setEditingSection('training'); }}>
                                                            <Edit size={14} /> Edit
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    )}
                                    {(editingSection === 'training') && <button type="button" className="ln-btn-sm ln-btn-primary" onClick={addTrainingObj}><Plus size={12} /> Add Program</button>}
                                </div>
                                <div style={{ padding: '0 20px 20px' }}>
                                    {/* Consolidated Programs List */}
                                    {trainings.map((t, i) => (
                                        <div key={i} style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, position: 'relative' }}>
                                            <div style={{ flex: 1, width: '100%' }}>
                                                {(editingSection === 'training') ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(160px, 2fr) 100px 130px 90px', gap: 12 }}>
                                                            <div>
                                                                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>Program Taken</label>
                                                                <select className="form-select" value={(programs || []).find(p => p.name === t.program)?.id || ''} onChange={e => {
                                                                    const p = (programs || []).find(p => String(p.id) === e.target.value);
                                                                    updateTraining(i, 'program', p?.name || '');
                                                                    updateTraining(i, 'ncLevel', p?.ncLevel || '');
                                                                }}>
                                                                    <option value="">Select Program</option>
                                                                    {(programs || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                                </select>
                                                                {!String(t.program || '').trim() && <div style={{ fontSize: 12, color: '#cc1016', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={12} /> Program is required</div>}
                                                            </div>
                                                            <div>
                                                                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>NC Level</label>
                                                                <select 
                                                                    className="form-select" 
                                                                    value={t.ncLevel || ''} 
                                                                    disabled 
                                                                    style={{ cursor: 'not-allowed', background: '#f1f5f9', opacity: 0.8 }}
                                                                >
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
                                                                <input type="text" className="form-input" placeholder="e.g. 2022" value={t.year || ''} onChange={e => {
                                                                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                                                    updateTraining(i, 'year', val);
                                                                }} />
                                                                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>4-digit year</div>
                                                                {(!String(t.year || '').trim() || String(t.year || '').trim().length !== 4) && <div style={{ fontSize: 12, color: '#cc1016', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={12} /> 4-digit year is required</div>}
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
                                            {(editingSection === 'training') && <button type="button" onClick={() => removeTrainingIdx(i)} style={{ marginLeft: 16, background: 'none', border: 'none', color: '#cc1016', cursor: 'pointer', marginTop: 4 }}><Trash2 size={16} /></button>}
                                        </div>
                                    ))}
                                    {!(editingSection === 'training') && trainings.length === 0 && (
                                        <EmptyState
                                            illustration={TrophyIllustration}
                                            title="No achievements yet"
                                            description="Start adding your TESDA trainings, certifications, and awards to showcase your expertise."
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="ln-card" style={{ marginTop: 16 }}>
                                <div className="ln-section-header">
                                    <h3>Learner Profile / Assessment Details</h3>
                                    {isOwnProfile && (!editingSection || editingSection === 'learner') && (
                                        editingSection === 'learner' ? (
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <button type="button" className="ln-btn-sm" style={{ background: '#e2e8f0', color: '#475569' }} onClick={() => handleCancelEdit(editingSection)} disabled={saving}>
                                                    <X size={14} /> Cancel
                                                </button>
                                                <button type="button" className="ln-btn-sm ln-btn-success" onClick={() => saveSection(editingSection)} disabled={saving}>
                                                    <CheckCircle size={14} /> Save
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="ln-menu-container" style={{ position: 'relative' }}>
                                                <button type="button" className="ln-link-btn" style={{ padding: 4 }} onClick={() => setActiveMenu(activeMenu === 'learner' ? null : 'learner')}>
                                                    <MoreVertical size={16} color="#64748b" />
                                                </button>
                                                {activeMenu === 'learner' && (
                                                    <div style={{ position: 'absolute', top: 28, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)', zIndex: 100, padding: 6, minWidth: 140, animation: 'fadeInScale 0.15s ease-out', transformOrigin: 'top right' }}>
                                                        <button type="button" style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#334155', textAlign: 'left' }} onClick={() => { setActiveMenu(null); setEditingSection('learner'); }}>
                                                            <Edit size={14} /> Edit
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    )}
                                </div>
                                <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div style={{ padding: 16, borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)' }}>
                                        <div style={{ fontSize: 15, fontWeight: 800, color: '#1e3a5f', marginBottom: 12 }}>Language, Literacy, and Numeracy (LL&amp;N)</div>
                                        {(editingSection === 'learner') ? (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                                                {LLN_FIELDS.map(field => (
                                                    <div key={field.key}>
                                                        <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>{field.label}</label>
                                                        <select
                                                            className="form-select"
                                                            style={learnerFieldStyle}
                                                            value={learnerProfile[field.key] || ''}
                                                            onChange={e => updateLearnerProfile(field.key, e.target.value)}
                                                        >
                                                            <option value="">Select rating</option>
                                                            {LLN_SCORE_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                                                        </select>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                                                {LLN_FIELDS.map(field => (
                                                    <LearnerSummaryCard key={field.key} label={field.label} value={learnerProfile[field.key]} />
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ padding: 16, borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)' }}>
                                        <div style={{ fontSize: 15, fontWeight: 800, color: '#1e3a5f', marginBottom: 12 }}>Cultural and Language Background</div>
                                        {(editingSection === 'learner') ? (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                                                <div>
                                                    <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>Ethnic Group</label>
                                                    <select className="form-select" style={learnerFieldStyle} value={learnerProfile.ethnicGroup || ''} onChange={e => updateLearnerProfile('ethnicGroup', e.target.value)}>
                                                        <option value="">Select ethnic group</option>
                                                        {ETHNIC_GROUP_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                                                    </select>
                                                    {learnerProfile.ethnicGroup === 'Others' && (
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            style={{ ...learnerFieldStyle, marginTop: 8 }}
                                                            placeholder="Specify ethnic group"
                                                            value={learnerProfile.ethnicGroupOther || ''}
                                                            onChange={e => updateLearnerProfile('ethnicGroupOther', e.target.value)}
                                                        />
                                                    )}
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>Language Spoken</label>
                                                    <select className="form-select" style={learnerFieldStyle} value={learnerProfile.languageSpoken || ''} onChange={e => updateLearnerProfile('languageSpoken', e.target.value)}>
                                                        <option value="">Select language</option>
                                                        {LANGUAGE_SPOKEN_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                                                    </select>
                                                    {learnerProfile.languageSpoken === 'Others' && (
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            style={{ ...learnerFieldStyle, marginTop: 8 }}
                                                            placeholder="Specify language"
                                                            value={learnerProfile.languageSpokenOther || ''}
                                                            onChange={e => updateLearnerProfile('languageSpokenOther', e.target.value)}
                                                        />
                                                    )}
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>Tribal Group</label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        style={learnerFieldStyle}
                                                        placeholder="If any"
                                                        value={learnerProfile.tribalGroup || ''}
                                                        onChange={e => updateLearnerProfile('tribalGroup', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                                                <LearnerSummaryCard label="Ethnic Group" value={formatOtherAwareValue(learnerProfile.ethnicGroup, learnerProfile.ethnicGroupOther)} />
                                                <LearnerSummaryCard label="Language Spoken" value={formatOtherAwareValue(learnerProfile.languageSpoken, learnerProfile.languageSpokenOther)} />
                                                <LearnerSummaryCard label="Tribal Group" value={learnerProfile.tribalGroup} />
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ padding: 16, borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)' }}>
                                        <div style={{ fontSize: 15, fontWeight: 800, color: '#1e3a5f', marginBottom: 12 }}>Education &amp; General Knowledge</div>
                                        {(editingSection === 'learner') ? (
                                            <div>
                                                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>Highest Educational Attainment</label>
                                                <select className="form-select" style={learnerFieldStyle} value={learnerProfile.highestEducation || ''} onChange={e => updateLearnerProfile('highestEducation', e.target.value)}>
                                                    <option value="">Select attainment</option>
                                                    {HIGHEST_EDUCATION_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                                                </select>
                                            </div>
                                        ) : (
                                            <LearnerSummaryCard label="Highest Educational Attainment" value={learnerProfile.highestEducation} />
                                        )}
                                    </div>

                                    <div style={{ padding: 16, borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)' }}>
                                        <div style={{ fontSize: 15, fontWeight: 800, color: '#1e3a5f', marginBottom: 12 }}>Demographics &amp; Health</div>
                                        {(editingSection === 'learner') ? (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                                                <LearnerSummaryCard label="Sex" value={form.gender || trainee?.gender || ''} />
                                                <div>
                                                    <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>Disabilities</label>
                                                    <select className="form-select" style={learnerFieldStyle} value={learnerProfile.disability || ''} onChange={e => updateLearnerProfile('disability', e.target.value)}>
                                                        <option value="">Select disability</option>
                                                        {DISABILITY_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                                                    </select>
                                                    {learnerProfile.disability === 'Others' && (
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            style={{ ...learnerFieldStyle, marginTop: 8 }}
                                                            placeholder="Specify disability"
                                                            value={learnerProfile.disabilityOther || ''}
                                                            onChange={e => updateLearnerProfile('disabilityOther', e.target.value)}
                                                        />
                                                    )}
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>Cause of Disability</label>
                                                    <select
                                                        className="form-select"
                                                        style={{ ...learnerFieldStyle, background: learnerProfile.disability && learnerProfile.disability !== 'None' ? '#ffffff' : '#f8fafc' }}
                                                        value={learnerProfile.causeOfDisability || ''}
                                                        onChange={e => updateLearnerProfile('causeOfDisability', e.target.value)}
                                                        disabled={!learnerProfile.disability || learnerProfile.disability === 'None'}
                                                    >
                                                        <option value="">Select cause</option>
                                                        {CAUSE_OF_DISABILITY_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>Existing Health Conditions</label>
                                                    <select className="form-select" style={learnerFieldStyle} value={learnerProfile.healthCondition || ''} onChange={e => updateLearnerProfile('healthCondition', e.target.value)}>
                                                        <option value="">Select condition</option>
                                                        {HEALTH_CONDITION_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                                                    </select>
                                                    {learnerProfile.healthCondition === 'Others' && (
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            style={{ ...learnerFieldStyle, marginTop: 8 }}
                                                            placeholder="Specify health condition"
                                                            value={learnerProfile.healthConditionOther || ''}
                                                            onChange={e => updateLearnerProfile('healthConditionOther', e.target.value)}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                                                <LearnerSummaryCard label="Sex" value={trainee?.gender} />
                                                <LearnerSummaryCard label="Disabilities" value={formatOtherAwareValue(learnerProfile.disability, learnerProfile.disabilityOther)} />
                                                <LearnerSummaryCard label="Cause of Disability" value={learnerProfile.disability && learnerProfile.disability !== 'None' ? learnerProfile.causeOfDisability : ''} />
                                                <LearnerSummaryCard label="Existing Health Conditions" value={formatOtherAwareValue(learnerProfile.healthCondition, learnerProfile.healthConditionOther)} />
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ padding: 16, borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)' }}>
                                        <div style={{ fontSize: 15, fontWeight: 800, color: '#1e3a5f', marginBottom: 12 }}>Learning &amp; Needs</div>
                                        {(editingSection === 'learner') ? (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                                                <div>
                                                    <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>Learning Style</label>
                                                    <select className="form-select" style={learnerFieldStyle} value={learnerProfile.learningStyle || ''} onChange={e => updateLearnerProfile('learningStyle', e.target.value)}>
                                                        <option value="">Select learning style</option>
                                                        {LEARNING_STYLE_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>Other Needs</label>
                                                    <select className="form-select" style={learnerFieldStyle} value={learnerProfile.otherNeeds || ''} onChange={e => updateLearnerProfile('otherNeeds', e.target.value)}>
                                                        <option value="">Select learner need</option>
                                                        {OTHER_NEEDS_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                                                    </select>
                                                    {learnerProfile.otherNeeds === 'Others' && (
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            style={{ ...learnerFieldStyle, marginTop: 8 }}
                                                            placeholder="Specify learner need"
                                                            value={learnerProfile.otherNeedsOther || ''}
                                                            onChange={e => updateLearnerProfile('otherNeedsOther', e.target.value)}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                                                <LearnerSummaryCard label="Learning Style" value={learnerProfile.learningStyle} />
                                                <LearnerSummaryCard label="Other Needs" value={formatOtherAwareValue(learnerProfile.otherNeeds, learnerProfile.otherNeedsOther)} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </React.Fragment>
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
                                    onViewDetail={onViewDetail || ((job) => alert('View job details from the Opportunities tab.'))}
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
                                <div className="ln-section-header">
                                    <h3>Skills</h3>
                                    {isOwnProfile && (!editingSection || editingSection === 'skills') && (
                                        editingSection === 'skills' ? (
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <button type="button" className="ln-btn-sm" style={{ background: '#e2e8f0', color: '#475569' }} onClick={() => handleCancelEdit(editingSection)} disabled={saving}>
                                                    <X size={14} /> Cancel
                                                </button>
                                                <button type="button" className="ln-btn-sm ln-btn-success" onClick={() => saveSection('skills')} disabled={saving}>
                                                    <CheckCircle size={14} /> Save
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="ln-menu-container" style={{ position: 'relative' }}>
                                                <button type="button" className="ln-link-btn" style={{ padding: 4 }} onClick={() => setActiveMenu(activeMenu === 'skills' ? null : 'skills')}>
                                                    <MoreVertical size={16} color="#64748b" />
                                                </button>
                                                {activeMenu === 'skills' && (
                                                    <div style={{ position: 'absolute', top: 28, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)', zIndex: 100, padding: 6, minWidth: 140, animation: 'fadeInScale 0.15s ease-out', transformOrigin: 'top right' }}>
                                                        <button type="button" style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#334155', textAlign: 'left' }} onClick={() => { setActiveMenu(null); setEditingSection('skills'); }}>
                                                            <Edit size={14} /> Edit
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12, padding: '0 16px' }}>
                                    {(form.skills || []).length > 0 ? (form.skills || []).map((skill, i) => (
                                        <span key={i} style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 6,
                                            padding: '6px 12px', background: '#dbeafe', color: '#1e3a5f',
                                            borderRadius: 20, fontSize: 13, fontWeight: 600
                                        }}>
                                            {typeof skill === 'string' ? skill : JSON.stringify(skill)}
                                            {isOwnProfile && (editingSection === 'skills') && <button type="button" onClick={() => removeSkill(skill)} style={{
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
                                {isOwnProfile && (editingSection === 'skills') && recommendationBubbles.skills.length > 0 && (
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
                                {isOwnProfile && (editingSection === 'skills') && (
                                    <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px' }}>
                                        <input type="text" className="form-input" placeholder="Add a skill..." value={newSkill} onChange={e => setNewSkill(e.target.value)} maxLength={30} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} style={{ flex: 1, fontSize: 13 }} />
                                        <button type="button" className="ln-btn-sm ln-btn-primary" onClick={addSkill} disabled={!newSkill.trim()}><Plus size={14} /></button>
                                    </div>
                                )}
                            </div>

                            {/* Interests */}
                            <div className="ln-card">
                                <div className="ln-section-header">
                                    <h3>Interests</h3>
                                    {isOwnProfile && (!editingSection || editingSection === 'interests') && (
                                        editingSection === 'interests' ? (
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <button type="button" className="ln-btn-sm" style={{ background: '#e2e8f0', color: '#475569' }} onClick={() => handleCancelEdit(editingSection)} disabled={saving}>
                                                    <X size={14} /> Cancel
                                                </button>
                                                <button type="button" className="ln-btn-sm ln-btn-success" onClick={() => saveSection('interests')} disabled={saving}>
                                                    <CheckCircle size={14} /> Save
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="ln-menu-container" style={{ position: 'relative' }}>
                                                <button type="button" className="ln-link-btn" style={{ padding: 4 }} onClick={() => setActiveMenu(activeMenu === 'interests' ? null : 'interests')}>
                                                    <MoreVertical size={16} color="#64748b" />
                                                </button>
                                                {activeMenu === 'interests' && (
                                                    <div style={{ position: 'absolute', top: 28, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)', zIndex: 100, padding: 6, minWidth: 140, animation: 'fadeInScale 0.15s ease-out', transformOrigin: 'top right' }}>
                                                        <button type="button" style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#334155', textAlign: 'left' }} onClick={() => { setActiveMenu(null); setEditingSection('interests'); }}>
                                                            <Edit size={14} /> Edit
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    )}
                                </div>
                                <div style={{
                                    display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', alignItems: 'center',
                                    padding: 20, margin: '0 16px 12px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', minHeight: 80
                                }}>
                                    {interestsList.length > 0 ? interestsList.map((interest, i) => {
                                        const sizes = [14, 17, 20, 15, 18];
                                        const colors = ['#0a66c2', '#7c3aed', '#057642', '#b24020', '#1e3a5f'];
                                        return (
                                            <span key={i} className="ln-interest-word" onClick={() => { if (isOwnProfile && editingSection === 'interests') removeInterest(interest); }} style={{
                                                display: 'inline-flex', alignItems: 'center',
                                                fontSize: sizes[i % sizes.length],
                                                fontWeight: 600 + (i % 3) * 100,
                                                color: colors[i % colors.length],
                                                padding: '4px 10px',
                                                cursor: (isOwnProfile && editingSection === 'interests') ? 'pointer' : 'default',
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
                                {isOwnProfile && (editingSection === 'interests') && recommendationBubbles.interests.length > 0 && (
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
                                {isOwnProfile && (editingSection === 'interests') && (
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
                                {isOwnProfile && (!editingSection || editingSection === 'documents') && (
                                    editingSection === 'documents' ? (
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            <button type="button" className="ln-btn-sm ln-btn-success" onClick={() => saveSection('documents')} disabled={saving}>
                                                <CheckCircle size={14} /> Done
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="ln-menu-container" style={{ position: 'relative' }}>
                                            <button type="button" className="ln-link-btn" style={{ padding: 4 }} onClick={() => setActiveMenu(activeMenu === 'documents' ? null : 'documents')}>
                                                <MoreVertical size={16} color="#64748b" />
                                            </button>
                                            {activeMenu === 'documents' && (
                                                <div style={{ position: 'absolute', top: 28, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)', zIndex: 100, padding: 6, minWidth: 140, animation: 'fadeInScale 0.15s ease-out', transformOrigin: 'top right' }}>
                                                    <button type="button" style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#334155', textAlign: 'left' }} onClick={() => { setActiveMenu(null); setEditingSection('documents'); }}>
                                                        <Edit size={14} /> Edit
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )
                                )}
                            </div>

                            {/* Document Upload Form - always visible in edit mode */}
                            {isOwnProfile && (editingSection === 'documents') && (
                                <div style={{ marginBottom: 16, padding: 16, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                                    <div style={{ marginBottom: 10 }}>
                                        <label className="ln-info-label" style={{ marginBottom: 4, display: 'block' }}>Document Label <span style={{ color: '#cc1016' }}>*</span></label>
                                        <input type="text" required className="form-input" placeholder="e.g. Resume, Diploma, TOR..." maxLength={40} value={docLabel} onChange={e => setDocLabel(e.target.value)} style={{ fontSize: 13 }} />
                                    </div>
                                    <div style={{ marginBottom: 10 }}>
                                        <label className="ln-info-label" style={{ marginBottom: 4, display: 'block' }}>File (PDF, DOC, DOCX only) <span style={{ color: '#cc1016' }}>*</span></label>
                                        <input ref={fileInputRef} type="file" required accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e => setDocFile(e.target.files[0] || null)} style={{ fontSize: 13 }} />
                                    </div>
                                    <button type="button" className="ln-btn-sm ln-btn-success" onClick={() => { if (!docLabel.trim() || !docFile) return; showConfirm('Do you want to save this document?', handleDocUpload); }} disabled={uploading || !docFile || !docLabel.trim()} style={{ width: 'fit-content' }}>
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
                                                {isOwnProfile && (editingSection === 'documents') && (
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
                                } else if (editingSection !== 'documents') {
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
                        </div>

                        {/* Social & Portfolio Links */}
                        <div className="ln-card">
                            <div className="ln-section-header">
                                <h3>Social &amp; Portfolio Links</h3>
                                {isOwnProfile && (!editingSection || editingSection === 'links') && (
                                    editingSection === 'links' ? (
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            <button type="button" className="ln-btn-sm ln-btn-success" onClick={() => saveSection('links')} disabled={saving}>
                                                <CheckCircle size={14} /> Done
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="ln-menu-container" style={{ position: 'relative' }}>
                                            <button type="button" className="ln-link-btn" style={{ padding: 4 }} onClick={() => setActiveMenu(activeMenu === 'links' ? null : 'links')}>
                                                <MoreVertical size={16} color="#64748b" />
                                            </button>
                                            {activeMenu === 'links' && (
                                                <div style={{ position: 'absolute', top: 28, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)', zIndex: 100, padding: 6, minWidth: 140, animation: 'fadeInScale 0.15s ease-out', transformOrigin: 'top right' }}>
                                                    <button type="button" style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#334155', textAlign: 'left' }} onClick={() => { setActiveMenu(null); setEditingSection('links'); }}>
                                                        <Edit size={14} /> Edit
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )
                                )}
                            </div>

                            {/* Social & Portfolio Links - add form ONLY in edit mode */}
                            {isOwnProfile && (editingSection === 'links') && (
                                <div className="ln-social-links-edit" style={{ border: 'none', marginTop: 0, paddingTop: 0 }}>
                                    <div className="ln-social-links-row">
                                        <div style={{ flex: 1, minWidth: 150 }}>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Title (e.g. Portfolio, GitHub...)"
                                                maxLength={50}
                                                value={linkTitle}
                                                onChange={e => setLinkTitle(e.target.value)}
                                                style={{ fontSize: 13, ...(Array.isArray(documents) && documents.some(d => d.file_type === 'link' && d.label?.toLowerCase() === linkTitle.trim().toLowerCase()) ? { borderColor: '#ef4444' } : {}) }}
                                            />
                                            {Array.isArray(documents) && documents.some(d => d.file_type === 'link' && d.label?.toLowerCase() === linkTitle.trim().toLowerCase()) && (
                                                <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>This title already exists.</div>
                                            )}
                                        </div>
                                        <div className="ln-social-input-group" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                                            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                                                <input
                                                    type="url"
                                                    className="form-input"
                                                    placeholder="URL (https://...)"
                                                    value={docLinkUrl}
                                                    onChange={e => handleUrlChange(e.target.value, 'social', val => setDocLinkUrl(val))}
                                                    style={{ fontSize: 13, flex: 1, ...(urlValidation.social === 'invalid' || urlValidation.social === 'error' || urlValidation.social === 'unreachable' ? { borderColor: '#ef4444' } : urlValidation.social === 'valid' ? { borderColor: '#10b981' } : {}) }}
                                                />
                                                <button
                                                    type="button"
                                                    className="ln-btn-sm ln-btn-primary"
                                                    onClick={() => { if (!linkTitle.trim() || !docLinkUrl.trim() || urlValidation.social !== 'valid') return; showConfirm('Do you want to save this link?', handleAddLink); }}
                                                    disabled={uploading || !linkTitle.trim() || !docLinkUrl.trim() || urlValidation.social !== 'valid' || (Array.isArray(documents) && documents.some(d => d.file_type === 'link' && d.label?.toLowerCase() === linkTitle.trim().toLowerCase()))}
                                                    style={{ width: 40, padding: 0, justifyContent: 'center', alignSelf: 'flex-start', height: 36 }}
                                                    title="Add Link"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                            </div>
                                            {urlValidation.social === 'checking' && <div style={{ fontSize: 11, color: '#3b82f6', marginTop: 4 }}>Verifying link...</div>}
                                            {urlValidation.social === 'invalid' && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>Please enter a valid URL</div>}
                                            {urlValidation.social === 'unreachable' && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>Link is unreachable or does not exist.</div>}
                                            {urlValidation.social === 'error' && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>Could not verify link. Check connection.</div>}
                                            {urlValidation.social === 'valid' && <div style={{ fontSize: 11, color: '#10b981', marginTop: 4 }}>Link verified successfully.</div>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Social & Portfolio Links list */}
                            {(Array.isArray(documents) ? documents : []).filter(d => d.file_type === 'link').length > 0 ? (
                                <div className="ln-social-links-edit" style={{ border: 'none', marginTop: 0 }}>
                                    {(Array.isArray(documents) ? documents : []).filter(d => d.file_type === 'link').map(link => (
                                        <div key={link.id} className="ln-doc-item" style={{ marginTop: 8 }}>
                                            <div className="ln-doc-info">
                                                <div style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <Link size={16} color="rgba(0,0,0,0.4)" />
                                                </div>
                                                <div className="ln-doc-text-wrap">
                                                    <span className="ln-doc-label-text">{link.label}</span>
                                                    <a href={/^https?:\/\//i.test(link.file_url) ? link.file_url : `https://${link.file_url}`} target="_blank" rel="noreferrer" className="ln-doc-filename-text" style={{ color: '#0a66c2', wordBreak: 'break-all', textDecoration: 'none' }}>{link.file_url}</a>
                                                </div>
                                            </div>
                                            <div className="ln-doc-actions">
                                                <a href={/^https?:\/\//i.test(link.file_url) ? link.file_url : `https://${link.file_url}`} target="_blank" rel="noreferrer" className="ln-btn-sm ln-btn-outline" title="Open Link">
                                                    <ExternalLink size={12} />
                                                    <span style={{ marginLeft: 4 }}>Open</span>
                                                </a>
                                                {isOwnProfile && (editingSection === 'links') && (
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
                            ) : (
                                (editingSection !== 'links') && (
                                    <EmptyState
                                        illustration={FolderIllustration}
                                        title="No links yet"
                                        description="Add your portfolio, GitHub, or social profiles to showcase your work online."
                                    />
                                )
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
                                    {applyJob.title} | {applyJob.companyName}
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
const Opportunities = ({ 
    openContactModal, openApplyModal, toggleBookmark, 
    handleEditPost, setConfirmDeleteId,
    editingPostId, setEditingPostId, editContent, setEditContent, handleSaveEdit,
    postMenuId, setPostMenuId, onViewDetail, applications = [],
    contactedJobIds = [], contactedPostIds = []
}) => {
    const { currentUser, getUserPostInteraction } = useApp();
    const { data: trainees = [] } = useTrainees();
    const { data: posts = [], isLoading: isLoadingPosts } = usePosts(50);
    const { data: jobPostings = [], isLoading: isLoadingJobPostings } = useJobPostings(50);
    const { data: partners = [] } = usePartners();
    const navigate = useNavigate();
    const trainee = currentUser || trainees[0];
    const myApps = applications.filter(a => a.traineeId === trainee?.id).map(a => a.jobId);

    const allJobs = useMemo(() => {
        const jobs = getTraineeRecommendedJobs(trainee, jobPostings) || [];
        const partnerPosts = (posts || []).filter(p => {
            return p.post_type === 'hiring_update';
        }).map(p => {
            const partner = partners.find(ptr => String(ptr.id) === String(p.author_id));
            return {
                ...p,
                feedType: 'job', // Standardize to job layout for UI consistency
                opportunityType: 'Partner Post',
                industry: 'General',
                location: normalizeLocation(p.location) || 'Various',
                companyName: partner?.company_name || partner?.profileName || 'Partner Company',
                partnerId: p.author_id,
                description: p.content || p.description || '',
                attachmentUrl: p.media_url || p.attachmentUrl || null,
                attachmentType: p.media_type || p.attachmentType || 'image/jpeg'
            };
        });

        const combined = [...jobs.map(j => ({ ...j, feedType: 'job' })), ...partnerPosts];

        // Deduplicate by ID to prevent React key collisions
        const uniqueJobsMap = new Map();
        combined.forEach(job => {
            if (!uniqueJobsMap.has(job.id)) {
                uniqueJobsMap.set(job.id, job);
            }
        });

        return Array.from(uniqueJobsMap.values())
            .sort((a, b) => new Date(b.created_at || b.createdAt || b.datePosted || 0) - new Date(a.created_at || a.createdAt || a.datePosted || 0));
    }, [getTraineeRecommendedJobs, trainee?.id, posts, jobPostings, partners]);

    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'
    const [filterIndustry, setFilterIndustry] = useState('All');
    const [filterType, setFilterType] = useState('All');
    const [filterLocation, setFilterLocation] = useState('All');
    const [filterOpType, setFilterOpType] = useState('All');

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 12;


    useEffect(() => {
        setCurrentPage(prev => prev === 1 ? prev : 1);
    }, [search, filterIndustry, filterType, filterLocation, filterOpType]);

    // Auto-fetch next pages logic removed as we set a higher initial limit for Opportunities tab
    // In a full implementation, we would use useInfiniteQuery
    const openProfile = (target) => {
        if (!target?.id || !target?.type) return;
        const profileType = normalizeProfileType(target.type);
        if (!profileType) return;
        navigate(`/trainee/profile-view/${profileType}/${target.id}`);
    };

    const hiringUpdates = allJobs;
    const industries = ['All', ...new Set(hiringUpdates.map(j => j.industry).filter(Boolean))].sort((a, b) => a === 'All' ? -1 : b === 'All' ? 1 : a.localeCompare(b));
    const types = ['All', 'Full-time', 'Part-time', 'Contract', 'Internship'];
    const locations = ['All', ...new Set(hiringUpdates.map(j => normalizeLocation(j.location)).filter(Boolean))].sort((a, b) => a === 'All' ? -1 : b === 'All' ? 1 : a.localeCompare(b));
    const opTypes = ['All', 'Job', 'OJT', 'Apprenticeship'];

    const filtered = allJobs.filter(j => {
        const q = search.toLowerCase();

        // for partner posts, search content/title/author
        const sTitle = (j.title || '').toLowerCase();
        const sCompany = (j.companyName || j.author?.company_name || j.profileName || '').toLowerCase();
        const sContent = (j.content || '').toLowerCase();
        const sAddress = (j.detailed_address || j.detailedAddress || '').toLowerCase();

        return (
            (sTitle.includes(q) || sCompany.includes(q) || sContent.includes(q) || sAddress.includes(q)) &&
            (filterIndustry === 'All' || j.industry === filterIndustry) &&
            (filterType === 'All' || j.employmentType === filterType || j.feedType === 'post') &&
            (filterLocation === 'All' || normalizeLocation(j.location) === filterLocation) &&
            (filterOpType === 'All' || j.opportunityType === filterOpType || (filterOpType === 'Partner Post' && j.feedType === 'post'))
        );
    });

    const totalPages = Math.ceil(filtered.length / pageSize);
    const displayedJobs = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const isLoading = isLoadingPosts || isLoadingJobPostings;

    if (isLoading) {
        return (
            <div className="ln-page-content">
                <div className="ln-page-header">
                    <div>
                        <h1 className="ln-page-title">Opportunities</h1>
                        <p className="ln-page-subtitle">Finding the best matches for your skills...</p>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', background: '#fff', borderRadius: 12, border: '1px solid #e0dfdc', marginTop: 16 }}>
                    <div className="ln-pulse-loader" style={{ width: 80, height: 80, borderRadius: '50%', background: '#eef3f8', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        <Briefcase size={32} color="#0a66c2" style={{ zIndex: 2 }} />
                        <div className="ln-pulse-ring" style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: '4px solid #0a66c2', animation: 'lnPulse 2s infinite' }}></div>
                    </div>
                    <div style={{ marginTop: 24, fontSize: 16, fontWeight: 600, color: '#475569' }}>Loading Opportunities...</div>
                    <div style={{ marginTop: 8, fontSize: 14, color: '#94a3b8' }}>Fetching the latest job postings and training sessions.</div>
                </div>
                <style>{`
                    @keyframes lnPulse {
                        0% { transform: scale(0.8); opacity: 0.8; }
                        70% { transform: scale(1.5); opacity: 0; }
                        100% { transform: scale(1.5); opacity: 0; }
                    }
                `}</style>
            </div>
        );
    }

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
                        { label: 'Type', val: filterOpType, set: setFilterOpType, opts: opTypes, allLabel: 'All Types' },
                        { label: 'Industry', val: filterIndustry, set: setFilterIndustry, opts: industries, allLabel: 'All Industries' },
                        { label: 'Location', val: filterLocation, set: setFilterLocation, opts: locations, allLabel: 'All Locations' },
                        { label: 'Employment', val: filterType, set: setFilterType, opts: types, allLabel: 'All Employment' },
                    ].map(f => (
                        <select key={f.label} className="ln-filter-select" value={f.val} onChange={e => f.set(e.target.value)}>
                            {f.opts.map(o => <option key={o} value={o}>{o === 'All' ? f.allLabel : o}</option>)}
                        </select>
                    ))}
                    <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', background: '#fff', height: '38px', flexShrink: 0 }}>
                        <button
                            style={{ padding: '0 12px', border: 'none', background: viewMode === 'grid' ? '#f1f5f9' : 'transparent', cursor: 'pointer', color: viewMode === 'grid' ? '#0f172a' : '#64748b', display: 'flex', alignItems: 'center' }}
                            onClick={() => setViewMode('grid')}
                            title="Grid View"
                        >
                            <LayoutDashboard size={16} />
                        </button>
                        <button
                            style={{ padding: '0 12px', border: 'none', borderLeft: '1px solid #e2e8f0', background: viewMode === 'list' ? '#f1f5f9' : 'transparent', cursor: 'pointer', color: viewMode === 'list' ? '#0f172a' : '#64748b', display: 'flex', alignItems: 'center' }}
                            onClick={() => setViewMode('list')}
                            title="List View"
                        >
                            <AlignLeft size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Job Cards - LinkedIn Style */}
            <div className={viewMode === 'list' ? "tt-feed-list" : "tt-feed-grid"} style={viewMode === 'list' ? { display: 'flex', flexDirection: 'column', gap: '16px' } : { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
                {displayedJobs.map(job => {
                    const applied = job.feedType === 'job'
                        ? myApps.includes(job.id)
                        : !!getUserPostInteraction(job.id, 'apply');
                    const contacted = job.feedType === 'job'
                        ? contactedJobIds.includes(job.id)
                        : contactedPostIds.includes(job.id);
                    if (viewMode === 'list' || job.feedType === 'post') {
                        if (editingPostId === job.id) {
                            return (
                                <div key={`edit-${job.id}`} className="ln-card ln-feed-card" style={{ padding: 20 }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Edit Opportunity Post</div>
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        style={{
                                            width: '100%', minHeight: 120, padding: 12, borderRadius: 8,
                                            border: '1px solid #4f46e5', fontSize: 14, outline: 'none', resize: 'vertical',
                                            fontFamily: 'inherit'
                                        }}
                                        placeholder="Edit the opportunity details..."
                                    />
                                    <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => { setEditingPostId(null); setEditContent(''); }}
                                            style={{ padding: '8px 20px', borderRadius: 20, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#475569' }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleSaveEdit(job.id)}
                                            style={{ padding: '8px 20px', borderRadius: 20, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            );
                        }
                        return (
                            <CompactFeedItem
                                key={`opp-compact-${job.id}`}
                                item={{ ...job }}
                                isOwnPost={job.author_id === currentUser?.id || job.partnerId === currentUser?.id}
                                postMenuId={postMenuId}
                                setPostMenuId={setPostMenuId}
                                // Note: In Opportunities tab, we use direct handlers if available, otherwise parent context
                                onEdit={(i) => typeof handleEditPost === 'function' ? handleEditPost(i) : console.warn('Edit handler not found')}
                                onDelete={(id) => typeof setConfirmDeleteId === 'function' ? setConfirmDeleteId(id) : console.warn('Delete handler not found')}
                                applied={applied}
                                contacted={contacted}
                                onInquire={(j) => openContactModal({
                                    recipientId: j.partnerId || j.author_id || j.authorId,
                                    recipientName: j.companyName || j.author?.company_name || j.profileName,
                                    recipientType: 'industry_partner',
                                    jobPostingId: j.feedType === 'job' ? j.id : null,
                                    postId: j.feedType === 'post' ? j.id : null,
                                    postTitle: j.title || 'Inquiry'
                                })}
                                onSave={toggleBookmark}
                                onApply={(i) => openApplyModal(i)}
                                onViewDetail={onViewDetail}
                                openProfile={(target) => {
                                    if (!target?.id || !target?.type) return;
                                    const profileType = normalizeProfileType(target.type);
                                    if (!profileType) return;
                                    navigate(`/trainee/profile-view/${profileType}/${target.id}`);
                                }}
                            />
                        );
                    }
                    const theme = POST_THEME['job'] || { color: '#0a66c2', bg: '#f0f7ff' };
                    const hasAttachment = job.attachmentUrl && isImageAttachment(job.attachmentUrl, job.attachmentType);
                    
                    const jobSkills = Array.isArray(job.skills) && job.skills.length > 0 ? job.skills : (Array.isArray(job.tags) && job.tags.length > 0 ? job.tags : []);
                    const displaySkills = jobSkills.length > 0 ? jobSkills.join(', ') : (job.ncLevel ? `${job.ncLevel}, Technical Skills, Professionalism` : 'Industry Skills, Professionalism, Teamwork');

                    if (editingPostId === job.id) {
                        return (
                            <div key={`edit-grid-${job.id}`} className="coursera-card" style={{ padding: 20, minHeight: 280, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Edit Opportunity</div>
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    style={{
                                        flex: 1, width: '100%', minHeight: 120, padding: 12, borderRadius: 8,
                                        border: '1px solid #4f46e5', fontSize: 14, outline: 'none', resize: 'none',
                                        fontFamily: 'inherit'
                                    }}
                                    placeholder="Edit details..."
                                />
                                <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={() => { setEditingPostId(null); setEditContent(''); }}
                                        style={{ padding: '6px 16px', borderRadius: 20, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleSaveEdit(job.id)}
                                        style={{ padding: '6px 16px', borderRadius: 20, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        );
                    }
                    return (
                        <div key={job.id} className="coursera-card" onClick={() => onViewDetail(job)} style={{ 
                            borderLeft: `4px solid ${theme.color}`,
                            width: '100%',
                            height: '407px',
                            flexShrink: 0
                        }}>
                            <div className="coursera-card-image" style={{ 
                                backgroundColor: hasAttachment ? '#f1f5f9' : theme.bg,
                                backgroundImage: hasAttachment ? `url(${job.attachmentUrl})` : 'none',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {!hasAttachment && <Building2 size={48} color="rgba(0,0,0,0.1)" />}
                                
                                {(job.author_id === currentUser?.id || job.partnerId === currentUser?.id) && (
                                    <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 20 }} onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPostMenuId(postMenuId === job.id ? null : job.id);
                                            }}
                                            style={{ 
                                                background: 'rgba(255,255,255,0.9)', 
                                                border: 'none', 
                                                cursor: 'pointer', 
                                                padding: 6, 
                                                borderRadius: '50%', 
                                                color: '#65676b',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                            }}
                                        >
                                            <MoreVertical size={18} />
                                        </button>
                                        {postMenuId === job.id && (
                                            <div style={{
                                                position: 'absolute', right: 0, top: 32, background: '#fff',
                                                borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                border: '1px solid #e4e6eb', zIndex: 100, minWidth: 150, overflow: 'hidden'
                                            }}>
                                                <button
                                                    onClick={() => {
                                                        if (typeof handleEditPost === 'function') handleEditPost(job);
                                                        setPostMenuId(null);
                                                    }}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                                                        padding: '10px 16px', border: 'none', background: 'none',
                                                        cursor: 'pointer', fontSize: 13, color: '#1c1e21', textAlign: 'left'
                                                    }}
                                                >
                                                    <Edit size={14} /> Edit post
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (typeof setConfirmDeleteId === 'function') setConfirmDeleteId(job.id);
                                                        setPostMenuId(null);
                                                    }}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                                                        padding: '10px 16px', border: 'none', background: 'none',
                                                        cursor: 'pointer', fontSize: 13, color: '#dc3545', textAlign: 'left'
                                                    }}
                                                >
                                                    <Trash2 size={14} /> Delete post
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="coursera-card-content">
                                <div className="coursera-card-provider">
                                    <div className="coursera-provider-logo"><Building2 size={12} color="#0a66c2" /></div>
                                    <span style={{fontWeight: 500, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 4}}>
                                        {job.companyName || job.author?.company_name || job.profileName || 'Partner Company'}
                                        {partners.find(p => p.id === job.partnerId)?.verificationStatus === 'Verified' && (
                                            <VerifiedBadge size={14} />
                                        )}
                                    </span>
                                </div>
                                <h3 className="coursera-card-title">{job.title}</h3>
                                <p className="coursera-card-skills">
                                    <strong>Skills required:</strong> {displaySkills}
                                </p>
                                <div className="coursera-card-meta">
                                    {job.ncLevel || 'Beginner'} • {job.opportunityType} • {job.employmentType || 'Flexible'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, color: '#64748b', fontSize: 12 }}>
                                    <MapPin size={14} color="#7c3aed" />
                                    <span style={{ fontWeight: 500 }}>{job.location || 'Remote/TBD'}</span>
                                    {job.detailed_address && (
                                        <span style={{ color: '#94a3b8' }}>• {job.detailed_address}</span>
                                    )}
                                </div>
                                <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '12px', paddingTop: '12px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                    <button 
                                        disabled={contacted}
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            openContactModal({
                                                recipientId: job.partnerId || job.author_id || job.authorId,
                                                recipientName: job.companyName || job.author?.company_name || job.profileName,
                                                recipientType: 'industry_partner',
                                                jobPostingId: job.feedType === 'job' ? job.id : null,
                                                postId: job.feedType === 'post' ? job.id : null,
                                                postTitle: job.title || 'Inquiry'
                                            });
                                        }}
                                        style={{ 
                                            padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, 
                                            border: contacted ? 'none' : '1px solid #cbd5e1', 
                                            backgroundColor: contacted ? '#f0fdf4' : 'transparent', 
                                            color: contacted ? '#057642' : '#475569', 
                                            cursor: contacted ? 'default' : 'pointer', 
                                            display: 'flex', alignItems: 'center', gap: 6 
                                        }}
                                    >
                                        {contacted ? <Check size={14} /> : <Mail size={14} />} {contacted ? 'Contacted' : 'Contact'}
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); toggleBookmark(job.id); }}
                                        style={{ padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, border: '1px solid #cbd5e1', backgroundColor: 'transparent', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                                    >
                                        <Bookmark size={14} fill={((trainee?.savedOpportunities || []).includes(job.id) || !!getUserPostInteraction(job.id, 'save')) ? 'currentColor' : 'none'} /> {((trainee?.savedOpportunities || []).includes(job.id) || !!getUserPostInteraction(job.id, 'save')) ? 'Saved' : 'Save'}
                                    </button>
                                    <button 
                                        disabled={applied || job.status !== 'Open'}
                                        onClick={(e) => { e.stopPropagation(); openApplyModal(job); }}
                                        style={{ padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, border: 'none', backgroundColor: applied ? '#818cf8' : '#4f46e5', color: '#fff', cursor: applied ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                                    >
                                        {applied ? <><CheckCircle size={14} /> Applied</> : <><Send size={14} /> Apply</>}
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


        </div>
    );
};

// ─── PAGE 5: MY APPLICATIONS ──────────────────────────────────────
const MyApplications = ({ openContactModal, applications = [] }) => {
    const { currentUser, updateApplicationStatus } = useApp();
    const { data: trainees = [] } = useTrainees();
    const { data: partners = [] } = usePartners();
    const { data: jobPostings = [] } = useJobPostings(100);
    const { data: contactRequests = [] } = useContactRequests(currentUser?.id, 'trainee');
    const { data: interviewBookings = [] } = useInterviewBookings(currentUser?.id, 'trainee');
    
    const updateApplicationStatusMutation = useUpdateApplicationStatus();
    const deleteApplicationMutation = useDeleteApplication();
    const saveInterviewBookingMutation = useSaveInterviewBooking();

    const navigate = useNavigate();
    const trainee = currentUser || trainees[0];

    const myApps = useMemo(() => {
        if (!trainee) return [];
        
        const applicationRecords = applications
          .filter(a => String(a.traineeId) === String(trainee.id))
          .map(a => {
            const job = jobPostings.find(j => String(j.id) === String(a.jobId));
            const partner = partners.find(p => String(p.id) === String(job?.partnerId));
            const booking = interviewBookings.find(b => String(b.application_id) === String(a.id) && b.status !== 'cancelled');
            
            return {
              ...a,
              rowKey: `application-${a.id}`,
              recordType: 'application',
              activityType: 'Job Application',
              directionLabel: 'You applied',
              eventDate: a.appliedAt,
              job,
              partner: partner || (job ? { id: job.partnerId, companyName: job.companyName || 'Industry Partner' } : null),
              outgoingMessage: a.applicationMessage || null,
              incomingMessage: a.recruitMessage || a.notes || null,
              attachmentName: a.resumeFileName || null,
              attachmentUrl: a.resumeUrl || null,
              attachmentKind: a.resumeUrl ? 'resume' : null,
              matchRate: trainee.id && job?.id ? getMatchRate(trainee, job) : null,
              interviewDate: booking?.start_time || a.proposedInterviewDate || null,
              sortAt: new Date(a.appliedAt || 0).getTime(),
            };
          });

        const contactRecords = contactRequests
          .filter(request => String(request.sender_id) === String(trainee.id) || String(request.recipient_id) === String(trainee.id))
          .map(request => {
            const isOutgoing = String(request.sender_id) === String(trainee.id);
            const partnerId = isOutgoing ? request.recipient_id : request.sender_id;
            const partner = partners.find(p => String(p.id) === String(partnerId));
            const jobId = request.jobPostingId || request.job_posting_id;
            const job = jobPostings.find(j => String(j.id) === String(jobId));
            const booking = interviewBookings.find(b => String(b.application_id) === String(request.id) && b.status !== 'cancelled');

            return {
              ...request,
              id: request.id,
              rowKey: `contact-${request.id}`,
              recordType: 'contact',
              activityType: isOutgoing ? (jobId ? 'Direct Apply Contact' : 'Direct Contact') : 'Partner Outreach',
              directionLabel: isOutgoing ? 'You contacted partner' : 'Partner contacted you',
              status: (() => {
                const rawStatus = String(request.status || '').toLowerCase();
                if (rawStatus === 'reviewed' || rawStatus === 'pending') {
                  if (request.proposed_interview_date) {
                    return isOutgoing ? 'Reschedule Requested' : 'Interview Requested';
                  }
                }
                return request.status;
              })(),
              eventDate: (request.created_at || '').split('T')[0],
              job,
              partner: partner || (job ? { id: job.partnerId, companyName: job.companyName || 'Industry Partner' } : null),
              outgoingMessage: isOutgoing ? request.message : null,
              incomingMessage: isOutgoing ? (request.notes || null) : request.message,
              attachmentName: request.attachment_name || null,
              attachmentUrl: request.attachment_url || null,
              attachmentKind: request.attachment_kind || null,
              matchRate: jobId ? getMatchRate(trainee, job) : null,
              interviewDate: booking?.start_time || request.proposed_interview_date || null,
              sortAt: new Date(request.created_at || 0).getTime(),
            };
          });

        return [...applicationRecords, ...contactRecords].sort((a, b) => b.sortAt - a.sortAt);
    }, [trainee, applications, contactRequests, interviewBookings, jobPostings, partners]);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const [messageModal, setMessageModal] = useState(null);
    const [bookingApp, setBookingApp] = useState(null);
    const [actionMenuId, setActionMenuId] = useState(null);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    const [proposedDate, setProposedDate] = useState('');
    const [proposedTime, setProposedTime] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleting, setDeleting] = useState(false);

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

    const getStatusPriority = (statusInput) => {
        const raw = String(statusInput || '').trim().toLowerCase();
        // Tier 1: Requires Immediate Action (Partner invited)
        if (raw === 'interview requested') return 1;
        // Tier 2: Waiting on Partner (Trainee proposed time)
        if (raw === 'reschedule requested') return 2;
        // Tier 3: Active / Scheduled
        if (raw === 'interview scheduled' || raw === 'interview confirmed' || raw === 'interview accepted' || raw === 'accepted interview') return 3;
        // Tier 4: Pending / Under Review
        if (raw === 'shortlisted' || raw === 'shortlist') return 4;
        if (raw === 'pending' || raw === 'received' || raw === 'sent') return 5;
        // Tier 5: Finalized Success
        if (raw === 'hired' || raw === 'accepted job' || raw === 'accepted') return 6;
        // Tier 6: Finalized Dead
        if (raw === 'rejected' || raw === 'declined' || raw === 'interview declined') return 7;
        return 8;
    };

    const sortedAndFiltered = [...filtered].sort((a, b) => {
        const priA = getStatusPriority(a.status);
        const priB = getStatusPriority(b.status);
        if (priA !== priB) return priA - priB;
        return new Date(b.applied_at || b.created_at || 0) - new Date(a.applied_at || a.created_at || 0);
    });

    const paginated = sortedAndFiltered.slice((currentPage - 1) * pageSize, currentPage * pageSize);


    const statusBadge = (s) => {
        const raw = String(s || '').toLowerCase();
        const map = {
            pending: 'ln-badge-yellow',
            shortlisted: 'ln-badge-blue',
            'interview requested': 'ln-badge-purple',
            'interview confirmed': 'ln-badge-green',
            'interview declined': 'ln-badge-red',
            'reschedule requested': 'ln-badge-yellow',
            'interview scheduled': 'ln-badge-purple',
            accepted: 'ln-badge-green',
            rejected: 'ln-badge-red',
            hired: 'ln-badge-green',
            // Keep capitalized versions for compatibility
            Pending: 'ln-badge-yellow',
            Shortlisted: 'ln-badge-blue',
            'Interview Requested': 'ln-badge-purple',
            'Interview Confirmed': 'ln-badge-green',
            'Interview Declined': 'ln-badge-red',
            'Reschedule Requested': 'ln-badge-yellow',
            'Interview Scheduled': 'ln-badge-purple',
            Accepted: 'ln-badge-green',
            Rejected: 'ln-badge-red',
            Hired: 'ln-badge-green',
        };
        const labelMap = {
            pending: 'Pending',
            shortlisted: 'Shortlisted',
            'interview requested': 'Interview Requested',
            'interview confirmed': 'Interview Confirmed',
            'interview declined': 'Interview Declined',
            'reschedule requested': 'Reschedule Requested',
            'interview scheduled': 'Interview Scheduled',
            accepted: 'Accepted',
            rejected: 'Rejected',
            hired: 'Hired',
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
                    if (s === 'interview scheduled' || s === 'interviewscheduled' || s.includes('interview')) return 'interview';
                    if (s === 'screened' || s === 'under review' || s === 'shortlisted') return 'review';
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
                            {paginated.map(a => {
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
                                                {(() => {
                                                    const dateVal = a.proposedInterviewDate || a.interviewDate;
                                                    const st = String(a.status).toLowerCase();
                                                    if (!dateVal) return null;
                                                    const labelMap = {
                                                        'interview scheduled': { label: 'Set:', color: '#7c3aed', bg: '#f5f3ff' },
                                                        'interview requested': { label: 'Requested:', color: '#0369a1', bg: '#f0f7ff' },
                                                        'interview confirmed': { label: 'Confirmed:', color: '#16a34a', bg: '#f0fdf4' },
                                                        'interview declined': { label: 'Declined:', color: '#dc2626', bg: '#fef2f2' },
                                                        'reschedule requested': { label: 'Rescheduling:', color: '#ea580c', bg: '#fff7ed' },
                                                    };
                                                    const info = labelMap[st] || { label: 'Scheduled:', color: '#0a66c2', bg: '#f0f7ff' };
                                                    return (
                                                        <div style={{ fontSize: 10, color: info.color, fontWeight: 700, marginTop: 2, background: info.bg, padding: '2px 6px', borderRadius: 4, whiteSpace: 'normal', lineHeight: 1.3 }}>
                                                            {info.label} {new Date(dateVal).toLocaleDateString()} @ {new Date(dateVal).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    );
                                                })()}
                                                {['interview requested', 'reschedule requested'].includes(String(a.status).toLowerCase()) && (
                                                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                        <button
                                                            className="ln-btn ln-btn-primary"
                                                            style={{ padding: '4px 8px', fontSize: 10, background: '#16a34a', height: 'auto', border: 'none' }}
                                                            onClick={(e) => { e.stopPropagation(); updateApplicationStatus(a.id, 'interview confirmed', 'Interview confirmed by trainee.', { sourceTable: a.sourceTable }); }}
                                                        >
                                                            Accept
                                                        </button>
                                                        <button
                                                            className="ln-btn ln-btn-outline"
                                                            style={{ padding: '4px 8px', fontSize: 10, borderColor: '#ef4444', color: '#ef4444', height: 'auto' }}
                                                            onClick={(e) => { e.stopPropagation(); updateApplicationStatus(a.id, 'interview declined', 'Interview declined by trainee.', { sourceTable: a.sourceTable }); }}
                                                        >
                                                            Decline
                                                        </button>
                                                        <button
                                                            className="ln-btn ln-btn-outline"
                                                            style={{ padding: '4px 8px', fontSize: 10, height: 'auto' }}
                                                            onClick={(e) => { e.stopPropagation(); setBookingApp(a); }}
                                                        >
                                                            Reschedule
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center', position: 'relative' }}>
                                            <button
                                                className="ln-btn-icon"
                                                style={{ background: actionMenuId === (a.rowKey || a.id) ? '#f1f5f9' : 'transparent' }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (actionMenuId === (a.rowKey || a.id)) {
                                                        setActionMenuId(null);
                                                    } else {
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        const spaceBelow = window.innerHeight - rect.bottom;
                                                        const spaceAbove = rect.top;
                                                        const showUpward = spaceBelow < 250 && spaceAbove > spaceBelow;

                                                        setMenuPos({
                                                            top: showUpward ? 'auto' : (rect.bottom + 4),
                                                            bottom: showUpward ? (window.innerHeight - rect.top + 4) : 'auto',
                                                            left: rect.right - 170
                                                        });
                                                        setActionMenuId(a.rowKey || a.id);
                                                    }
                                                }}
                                            >
                                                <MoreVertical size={16} />
                                            </button>

                                            {actionMenuId === (a.rowKey || a.id) && createPortal(
                                                <React.Fragment>
                                                    <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setActionMenuId(null)} />
                                                    <div style={{
                                                        position: 'fixed', top: menuPos.top, bottom: menuPos.bottom, left: menuPos.left,
                                                        background: 'white', border: '1px solid #e2e8f0', borderRadius: 8,
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 9999,
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
                                                        {['interview scheduled', 'interview confirmed'].includes(String(a.status).toLowerCase()) && (
                                                            <button className="ln-dropdown-item" onClick={() => { setActionMenuId(null); setBookingApp(a); }} style={{ color: '#7c3aed' }}>
                                                                <Calendar size={14} /> Reschedule Interview
                                                            </button>
                                                        )}
                                                        <div style={{ borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />
                                                        <button className="ln-dropdown-item" style={{ color: '#dc2626' }} onClick={() => { setActionMenuId(null); setDeleteConfirm(a); }}>
                                                            <Trash2 size={14} /> Delete
                                                        </button>
                                                    </div>
                                                </React.Fragment>,
                                                document.body
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {sortedAndFiltered.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: 20, padding: '16px 0', borderTop: '1px solid #e2e8f0', gap: 12 }}>
                        <div style={{ fontSize: 13, color: '#64748b' }}>
                            Showing <b>{Math.min(sortedAndFiltered.length, (currentPage - 1) * pageSize + 1)}</b> to <b>{Math.min(sortedAndFiltered.length, currentPage * pageSize)}</b> of <b>{sortedAndFiltered.length}</b> items
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button
                                disabled={currentPage === 1}
                                onClick={() => { setCurrentPage(prev => prev - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                                <ChevronLeft size={16} /> Previous
                            </button>

                            <div style={{ display: 'flex', gap: 4 }}>
                                {Array.from({ length: Math.ceil(sortedAndFiltered.length / pageSize) }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === Math.ceil(sortedAndFiltered.length / pageSize) || (p >= currentPage - 1 && p <= currentPage + 1))
                                    .map((p, i, arr) => (
                                        <React.Fragment key={p}>
                                            {i > 0 && arr[i - 1] !== p - 1 && <span style={{ color: '#64748b', alignSelf: 'center' }}>...</span>}
                                            <button
                                                style={{
                                                    padding: '6px 10px',
                                                    borderRadius: 8,
                                                    border: '1px solid',
                                                    borderColor: currentPage === p ? '#0a66c2' : '#cbd5e1',
                                                    background: currentPage === p ? '#0a66c2' : '#fff',
                                                    color: currentPage === p ? '#fff' : '#1e293b',
                                                    fontWeight: currentPage === p ? 700 : 500,
                                                    cursor: 'pointer',
                                                    fontSize: 13
                                                }}
                                                onClick={() => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                            >
                                                {p}
                                            </button>
                                        </React.Fragment>
                                    ))}
                            </div>

                            <button
                                disabled={currentPage === Math.ceil(sortedAndFiltered.length / pageSize) || Math.ceil(sortedAndFiltered.length / pageSize) === 0}
                                onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: (currentPage === Math.ceil(sortedAndFiltered.length / pageSize) || Math.ceil(sortedAndFiltered.length / pageSize) === 0) ? 'not-allowed' : 'pointer', opacity: (currentPage === Math.ceil(sortedAndFiltered.length / pageSize) || Math.ceil(sortedAndFiltered.length / pageSize) === 0) ? 0.5 : 1, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
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
                        <div style={{ padding: '16px 0' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div className="ln-info-item">
                                        <label className="ln-info-label" style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6, display: 'block' }}>Proposed Date</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }}
                                            value={proposedDate}
                                            onChange={e => setProposedDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                    <div className="ln-info-item">
                                        <label className="ln-info-label" style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6, display: 'block' }}>Proposed Time</label>
                                        <input
                                            type="time"
                                            className="form-input"
                                            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }}
                                            value={proposedTime}
                                            onChange={e => setProposedTime(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <button
                                    className="ln-btn ln-btn-primary"
                                    style={{ width: '100%', justifyContent: 'center', gap: 8, height: 44, fontSize: 15, fontWeight: 600, background: '#4f46e5', color: 'white', border: 'none', borderRadius: 8 }}
                                    disabled={!proposedDate || !proposedTime}
                                    onClick={async () => {
                                        const fullDateTime = `${proposedDate}T${proposedTime}`;
                                        await updateApplicationStatus(bookingApp.id, 'reschedule requested', `Trainee requested a reschedule for ${proposedDate} at ${proposedTime}.`, { proposedInterviewDate: fullDateTime, sourceTable: bookingApp.sourceTable });
                                        setBookingApp(null);
                                        setProposedDate('');
                                        setProposedTime('');
                                        toast.success('Reschedule request sent to partner');
                                    }}
                                >
                                    Request Schedule Interview
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => !deleting && setDeleteConfirm(null)}>
                    <div className="ln-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
                        <div className="ln-modal-header">
                            <div>
                                <h3 className="ln-modal-title" style={{ color: '#dc2626' }}>Delete Application</h3>
                                <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)', marginTop: 2 }}>This action cannot be undone.</p>
                            </div>
                            <button className="ln-btn-icon" onClick={() => setDeleteConfirm(null)} disabled={deleting}><X size={18} /></button>
                        </div>
                        <div style={{ padding: 20 }}>
                            <p style={{ fontSize: 14, color: '#334155', marginBottom: 8 }}>
                                Are you sure you want to delete this application?
                            </p>
                            <div style={{ padding: 12, background: '#fef2f2', borderRadius: 8, border: '1px solid #fee2e2', fontSize: 13, color: '#991b1b' }}>
                                <strong>{deleteConfirm.partner?.companyName || 'Partner'}</strong> — {deleteConfirm.job?.title || 'Direct Contact'}
                            </div>
                        </div>
                        <div className="ln-modal-footer">
                            <button className="ln-btn ln-btn-outline" onClick={() => setDeleteConfirm(null)} disabled={deleting}>Cancel</button>
                            <button
                                className="ln-btn"
                                style={{ background: '#dc2626', color: 'white', border: 'none' }}
                                disabled={deleting}
                                onClick={async () => {
                                    setDeleting(true);
                                    try {
                                        await deleteApplicationMutation.mutateAsync({ applicationId: deleteConfirm.id, sourceTable: deleteConfirm.sourceTable });
                                        toast.success('Application deleted.');
                                        setDeleteConfirm(null);
                                    } catch (err) {
                                        toast.error(err.message || 'Failed to delete.');
                                    } finally {
                                        setDeleting(false);
                                    }
                                }}
                            >
                                <Trash2 size={14} /> {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── SUBCOMPONENT: PICK TIME ──────────────────────────────────────
const PickTime = ({ partnerId, onBook }) => {
    const { data: availabilitySlots = [], isLoading: isLoadingSlots } = useAvailability(partnerId);
    const { data: interviewBookings = [], isLoading: isLoadingBookings } = useInterviewBookings(partnerId, 'partner');
    
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [weekOffset, setWeekOffset] = useState(0);

    const isLoading = isLoadingSlots || isLoadingBookings;

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

    if (isLoading) return <div style={{ padding: 40, textAlign: 'center' }}><Loader className="animate-spin" /></div>;

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

const TraineeProfileViewRoute = ({ openBulletinModal, onViewDetail }) => {
    const { profileType, profileId } = useParams();
    const navigate = useNavigate();
    const normalizedProfileType = normalizeProfileType(profileType);

    if (normalizedProfileType === 'trainee') {
        return (
            <ErrorBoundary>
                <TraineeProfileContent viewedProfileId={profileId} onBack={() => navigate(-1)} openBulletinModal={openBulletinModal} onViewDetail={onViewDetail} />
            </ErrorBoundary>
        );
    }

    if (normalizedProfileType === 'partner') {
        return (
            <React.Suspense fallback={<div className="ln-page-content"><div className="ln-empty-state"><p>Loading profile...</p></div></div>}>
                <CompanyProfile viewedPartnerId={profileId} onBack={() => navigate(-1)} />
            </React.Suspense>
        );
    }

    return <Navigate to="/trainee" replace />;
};

// ─── MAIN TRAINEE DASHBOARD ─────────────────────────────────────
export default function TraineeDashboard() {
    const { currentUser, createPostInteraction, fetchPostInteractions, updateTrainee, getUserPostInteraction, toggleBookmark } = useApp();
    const sendContactRequestMutation = useSendContactRequest();
    const applyToJobMutation = useApplyToJob();
    const navigate = useNavigate();
    const location = useLocation();

    const updatePostMutation = useUpdatePost();
    const deletePostMutation = useDeletePost();
    const { data: applications = [] } = useApplications(currentUser?.id, 'trainee');
    const { data: contactRequests = [] } = useContactRequests(currentUser?.id, currentUser?.user_type);
    const { data: jobPostings = [] } = useJobPostings();
    const { data: posts = [] } = usePosts();

    const contactedJobIds = useMemo(() => contactRequests.map(r => r.job_posting_id).filter(Boolean), [contactRequests]);
    const contactedPostIds = useMemo(() => contactRequests.map(r => r.post_id).filter(Boolean), [contactRequests]);
    const myAppJobIds = useMemo(() => applications.map(a => a.jobId), [applications]);
    const mySavedJobIds = useMemo(() => Array.isArray(currentUser?.savedOpportunities) ? currentUser.savedOpportunities : [], [currentUser?.savedOpportunities]);

    // ── Shared Action States ──
    const [editingPostId, setEditingPostId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [postMenuId, setPostMenuId] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [selectedJob, setSelectedJob] = useState(null);
    const [showAllCompetencies, setShowAllCompetencies] = useState(false);

    // ── Shared Post Handlers ──
    const handleEditPost = (post) => {
        setEditingPostId(post.id);
        setEditContent(post.content);
        setPostMenuId(null);
    };

    const handleSaveEdit = async (postId) => {
        if (!editContent.trim()) return;
        try {
            await updatePostMutation.mutateAsync({ postId, content: editContent });
            toast.success('Post updated!');
            setEditingPostId(null);
            setEditContent('');
        } catch (err) {
            toast.error('Failed to update post');
        }
    };

    const handleDeletePost = async (postId) => {
        try {
            await deletePostMutation.mutateAsync(postId);
            toast.success('Post deleted');
            setConfirmDeleteId(null);
        } catch (err) {
            toast.error('Failed to delete post');
        }
    };

    const [bulletinModal, setBulletinModal] = useState(null);
    const [bulletinMessage, setBulletinMessage] = useState('');
    const [bulletinSubmitting, setBulletinSubmitting] = useState(false);

    const [contactTarget, setContactTarget] = useState(null);
    const [contactMessage, setContactMessage] = useState('');
    const [contactAttachment, setContactAttachment] = useState(null);
    const [contactSubmitting, setContactSubmitting] = useState(false);

    const [applyJob, setApplyJob] = useState(null);
    const [applicationMessage, setApplicationMessage] = useState('');
    const [resumeInfo, setResumeInfo] = useState(null);
    const [submittingApp, setSubmittingApp] = useState(false);

    const contactFileInputRef = useRef(null);

    // ── Shared Handlers ──
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
            toast.success(
                bulletinModal.type === 'apply' ? 'Application submitted!' :
                    bulletinModal.type === 'register' ? 'Registered successfully!' :
                        'Inquiry sent!'
            );
            fetchPostInteractions();
        } else {
            toast.error(res.error || 'Failed to submit.');
        }
    };

    const openContactModal = (target) => {
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
        if (!trimmed) { toast.error('Message is required.'); return; }
        if (requiresResume && !contactAttachment) { toast.error('Resume upload is required when contacting a partner.'); return; }

        setContactSubmitting(true);
        let attachmentUrl = null;
        let attachmentName = null;

        try {
            if (contactAttachment) {
                const path = `contact-files/${currentUser.id}/${Date.now()}_${contactAttachment.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('registration-uploads')
                    .upload(path, contactAttachment, { contentType: contactAttachment.type, upsert: true });
                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage.from('registration-uploads').getPublicUrl(path);
                attachmentUrl = urlData?.publicUrl || null;
                attachmentName = contactAttachment.name;
            }

            await sendContactRequestMutation.mutateAsync({
                recipientId: contactTarget.recipientId,
                recipientType: contactTarget.recipientType,
                postId: contactTarget.postId || null,
                jobPostingId: contactTarget.jobPostingId || null,
                message: trimmed,
                attachmentName,
                attachmentUrl,
                attachmentKind: requiresResume ? 'resume' : 'document',
            });

            toast.success('Contact request sent successfully!');
            closeContactModal();
        } catch (err) {
            console.error('Contact submit error:', err);
            toast.error(err.message || 'Failed to send contact request.');
        } finally {
            setContactSubmitting(false);
        }
    };

    const loadResumeInfo = async () => {
        // Simple mock of resume loading logic
        const trainee = currentUser;
        if (!trainee) return;
        let resolvedResume = null;
        const { data: docs } = await supabase.from('student_documents').select('id, label, file_url, category').eq('student_id', trainee.id);
        const resumeDoc = docs?.find(d => d.label?.toLowerCase().includes('resume') || d.category?.toLowerCase() === 'resume');
        if (resumeDoc) {
            resolvedResume = { file_url: resumeDoc.file_url, file_name: resumeDoc.label };
        } else if (trainee.resumeUrl || trainee.registrationResumeUrl) {
            resolvedResume = { file_url: trainee.resumeUrl || trainee.registrationResumeUrl, file_name: 'Resume' };
        }
        setResumeInfo(resolvedResume);
    };

    const openApplyModal = async (job) => {
        setApplyJob(job);
        setApplicationMessage('');
        await loadResumeInfo();
    };

    const handleSubmitApplication = async () => {
        if (!applyJob) return;
        setSubmittingApp(true);
        try {
            await applyToJobMutation.mutateAsync({
                traineeId: currentUser?.id,
                jobId: applyJob.id,
                applicationMessage,
                resumeUrl: resumeInfo?.file_url,
                resumeFileName: resumeInfo?.file_name || 'Resume'
            });
            toast.success('Application submitted successfully!');
            setApplyJob(null);
            setApplicationMessage('');
        } catch (err) {
            toast.error(err.message || 'Failed to submit application.');
        } finally {
            setSubmittingApp(false);
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

    const openProfile = (target) => {
        if (!target?.id || !target?.type) return;
        const profileType = normalizeProfileType(target.type);
        if (!profileType) return;
        navigate(`/trainee/profile-view/${profileType}/${target.id}`);
    };

    if (!currentUser) return null;

    return (
        <TraineeLayout activePage={activePage} setActivePage={setActivePage}>
            <Routes>
                <Route path="/" element={<TraineeDashboardHome 
                    setActivePage={setActivePage} 
                    openBulletinModal={openBulletinModal} 
                    openContactModal={openContactModal} 
                    openApplyModal={openApplyModal} 
                    toggleBookmark={toggleBookmark}
                    onViewDetail={setSelectedJob}
                    editingPostId={editingPostId}
                    setEditingPostId={setEditingPostId}
                    editContent={editContent}
                    setEditContent={setEditContent}
                    postMenuId={postMenuId}
                    setPostMenuId={setPostMenuId}
                    handleEditPost={handleEditPost}
                    handleSaveEdit={handleSaveEdit}
                    setConfirmDeleteId={setConfirmDeleteId}
                    contactedJobIds={contactedJobIds}
                    contactedPostIds={contactedPostIds}
                />} />
                <Route path="/profile" element={<TraineeProfile openBulletinModal={openBulletinModal} openContactModal={openContactModal} openApplyModal={openApplyModal} toggleBookmark={toggleBookmark} onViewDetail={setSelectedJob} />} />
                <Route path="/recommendations" element={<Opportunities 
                    openContactModal={openContactModal} 
                    openApplyModal={openApplyModal} 
                    toggleBookmark={toggleBookmark} 
                    handleEditPost={handleEditPost} 
                    setConfirmDeleteId={setConfirmDeleteId}
                    editingPostId={editingPostId}
                    setEditingPostId={setEditingPostId}
                    editContent={editContent}
                    setEditContent={setEditContent}
                    handleSaveEdit={handleSaveEdit}
                    postMenuId={postMenuId}
                    setPostMenuId={setPostMenuId}
                    onViewDetail={setSelectedJob}
                    applications={applications}
                    contactedJobIds={contactedJobIds}
                    contactedPostIds={contactedPostIds}
                />} />
                <Route path="/applications" element={<MyApplications openContactModal={openContactModal} applications={applications} />} />
                <Route path="/profile-view/:profileType/:profileId" element={<TraineeProfileViewRoute openBulletinModal={openBulletinModal} openContactModal={openContactModal} openApplyModal={openApplyModal} toggleBookmark={toggleBookmark} onViewDetail={setSelectedJob} />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="*" element={<Navigate to="/trainee" replace />} />
            </Routes>

            {/* Unified Action Modals */}
            {contactTarget && (
                <div className="modal-overlay" onClick={closeContactModal} style={{ zIndex: 11000 }}>
                    <div className="ln-modal" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 520 }}>
                        <div className="ln-modal-header">
                            <div>
                                <h3 className="ln-modal-title">Contact {contactTarget.recipientName}</h3>
                                <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)', marginTop: 2 }}>
                                    {contactTarget.recipientType === 'industry_partner' ? 'Send a message and attach your resume.' : 'Send a message to this user.'}
                                </p>
                            </div>
                            <button className="ln-btn-icon" onClick={closeContactModal}><X size={18} /></button>
                        </div>
                        <div style={{ padding: 20 }}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>Your Message</label>
                                <textarea
                                    className="ln-search-input"
                                    style={{ width: '100%', minHeight: 120, resize: 'none', borderRadius: 8, padding: 12 }}
                                    placeholder="Type your message here..."
                                    value={contactMessage}
                                    onChange={e => setContactMessage(e.target.value)}
                                />
                            </div>
                            {contactTarget.recipientType === 'industry_partner' && (
                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>Attach Resume</label>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                        <button onClick={() => contactFileInputRef.current?.click()} className="ln-btn ln-btn-outline" style={{ flex: 1 }}>
                                            <Upload size={14} /> {contactAttachment ? contactAttachment.name : 'Choose File'}
                                        </button>
                                        <input ref={contactFileInputRef} type="file" onChange={handleContactAttachmentChange} style={{ display: 'none' }} />
                                    </div>
                                </div>
                            )}
                            <div className="ln-modal-footer" style={{ padding: 0 }}>
                                <button className="ln-btn ln-btn-outline" onClick={closeContactModal} disabled={contactSubmitting}>Cancel</button>
                                <button className="ln-btn ln-btn-primary" onClick={handleSubmitContact} disabled={contactSubmitting || !contactMessage.trim()}>
                                    {contactSubmitting ? 'Sending...' : 'Send Message'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {applyJob && (
                <div className="modal-overlay" onClick={() => setApplyJob(null)} style={{ zIndex: 11000 }}>
                    <div className="ln-modal" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 520 }}>
                        <div className="ln-modal-header">
                            <div>
                                <h3 className="ln-modal-title">Apply for {applyJob.title}</h3>
                                <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)', marginTop: 2 }}>{applyJob.companyName}</p>
                            </div>
                            <button className="ln-btn-icon" onClick={() => setApplyJob(null)}><X size={18} /></button>
                        </div>
                        <div style={{ padding: 20 }}>
                            <div className="ln-profile-summary-notice" style={{ marginBottom: 16, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: 12 }}>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <ShieldCheck size={18} color="#0369a1" />
                                    <p style={{ fontSize: 12, color: '#0c4a6e', margin: 0 }}>Your comprehensive profile will be shared with the recruiter as your official resume.</p>
                                </div>
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>Message to Recruiter (Optional)</label>
                                <textarea
                                    className="ln-search-input"
                                    style={{ width: '100%', minHeight: 100, resize: 'none', borderRadius: 8, padding: 12 }}
                                    placeholder="Introduce yourself..."
                                    value={applicationMessage}
                                    onChange={e => setApplicationMessage(e.target.value)}
                                />
                            </div>
                            <div className="ln-modal-footer" style={{ padding: 0 }}>
                                <button className="ln-btn ln-btn-outline" onClick={() => setApplyJob(null)} disabled={submittingApp}>Cancel</button>
                                <button className="ln-btn ln-btn-primary" onClick={handleSubmitApplication} disabled={submittingApp}>
                                    {submittingApp ? 'Submitting...' : 'Confirm Application'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Unified Feed Item Detail Modal */}
            {selectedJob && (
                <FeedItemDetailModal 
                    item={selectedJob} 
                    onClose={() => setSelectedJob(null)}
                    onApply={(i, type) => {
                        if (i.feedType === 'job') {
                            openApplyModal(i);
                        } else if (i.feedType === 'bulletin') {
                            openBulletinModal(i, type || 'apply');
                        }
                    }}
                    onSave={(id) => toggleBookmark(id)}
                    onInquire={(i) => {
                        openContactModal({
                            recipientId: i.partnerId || i.author_id,
                            recipientType: i.feedType === 'job' ? 'industry_partner' : (i.author_type === 'admin' ? 'admin' : (i.author_type || 'partner')),
                            recipientName: i.companyName || i.name || 'Recipient',
                            jobPostingId: i.feedType === 'job' ? i.id : undefined,
                            sourceLabel: i.title,
                        });
                    }}
                    openProfile={openProfile}
                    applied={selectedJob && (
                        selectedJob.feedType === 'job' 
                            ? applications.some(a => String(a.jobId) === String(selectedJob.id)) 
                            : !!getUserPostInteraction(selectedJob.id, 'apply')
                    )}
                    contacted={selectedJob && (
                        selectedJob.feedType === 'job' 
                            ? contactedJobIds.includes(selectedJob.id) 
                            : contactedPostIds.includes(selectedJob.id)
                    )}
                />
            )}

            {bulletinModal && (() => {
                const cfg = BULLETIN_CONFIG[bulletinModal.post.post_type] || BULLETIN_CONFIG.announcement;
                const isInquiry = bulletinModal.type === 'inquire';
                const title = isInquiry ? 'Send Inquiry' : cfg.traineeLabel;
                return (
                    <div className="modal-overlay" style={{ zIndex: 11000 }}>
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
            {/* Delete Confirmation Modal */}
            {confirmDeleteId && (
                <div className="ln-modal-overlay" style={{ zIndex: 11000 }}>
                    <div className="ln-modal-content" style={{ maxWidth: 400, textAlign: 'center', padding: '30px 20px' }}>
                        <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <Trash2 size={30} />
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Delete Post?</h3>
                        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24, lineHeight: 1.5 }}>
                            Are you sure you want to delete this post? This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                className="ln-btn"
                                style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: 'none' }}
                                onClick={() => setConfirmDeleteId(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="ln-btn"
                                style={{ flex: 1, background: '#dc2626', color: '#fff', border: 'none' }}
                                onClick={() => handleDeletePost(confirmDeleteId)}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </TraineeLayout>
    );
}


