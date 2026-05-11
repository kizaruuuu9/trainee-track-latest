import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { usePosts, useJobPostings, useApplications, usePrograms, useDeleteApplication, useTrainees, usePartners, useContactRequests, useInterviewBookings, useAvailability, useSaveAvailabilitySlot, useDeleteAvailabilitySlot, useSaveInterviewBooking, useSendContactRequest } from '../../hooks';

import SavedItemsView from './SavedItemsView';
import ProfileActivityTab from './ProfileActivityTab';
import SettingsPage from './SettingsPage';
import {
  LayoutDashboard, Briefcase, FileText, Users, Building2, LogOut,
  ChevronDown, Search, Plus, Eye, X, CheckCircle, XCircle,
  MapPin, Send, Award, ChevronRight, Trash2, Menu, Lock,
  Upload, AlertTriangle, Clock, ShieldCheck, FileCheck,
  Bell, Home, Settings, TrendingUp, Bookmark, Target, Star,
  Camera, MessageSquare, MessageCircle, Edit, Loader, ExternalLink, EyeOff, MoreVertical,
  RefreshCw, MousePointerClick, CheckCircle2, UserPlus, Info, Share2,
  Calendar, ChevronLeft, Heart, Download, Navigation, User, Check, AlignLeft, Mail
} from 'lucide-react';
import EmptyState, {
  TrophyIllustration,
  BriefcaseIllustration,
  DocumentIllustration,
  StarIllustration,
  FolderIllustration
} from '../EmptyState';
import BrandLogo from '../common/BrandLogo';
import { supabase } from '../../lib/supabase';
import { CompactFeedItem, POST_THEME, VerifiedBadge } from './FeedComponents';
import { Routes, Route, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import PhilAddressSelector from '../common/PhilAddressSelector';
import ProfilePage from '../ProfilePage';
import TopNavBar from '../common/TopNavBar';
import ImageCropModal from '../common/ImageCropModal';
import toast from 'react-hot-toast';
import NotificationsPage from './NotificationsPage';
import LocationPicker from '../common/LocationPicker';
import { normalizeLocation } from '../../lib/psgc';

const TraineeProfileContent = React.lazy(() =>
  import('./TraineeDashboard').then(module => ({ default: module.TraineeProfileContent }))
);

/* -------------------------------------------------------------------
   LINKEDIN-STYLE PARTNER DASHBOARD
   ------------------------------------------------------------------- */

// --- HELPERS ------------------------------------------------------
const isVerified = (user) => user?.verificationStatus === 'Verified';
const getLivePartner = (currentUser, partners = []) => {
  const livePartner = partners.find(p => p.id === currentUser?.id);
  return livePartner ? { ...currentUser, ...livePartner } : currentUser;
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

const SALARY_CURRENCY_OPTIONS = [
  { code: 'PHP', label: 'PHP (\u20B1)' },
  { code: 'USD', label: 'USD ($)' },
  { code: 'EUR', label: 'EUR (\u20AC)' },
  { code: 'GBP', label: 'GBP (\u00A3)' },
  { code: 'JPY', label: 'JPY (\u00A5)' },
];

// --- SHARED: TABLE PAGINATION (LinkedIn Style) ---------------------
const TablePagination = ({ currentPage, totalItems, pageSize, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / pageSize);
  if (totalPages <= 1) return null;

  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(totalItems, currentPage * pageSize);

  return (
    <div className="ln-pagination" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid #f1f5f9' }}>
      <div style={{ fontSize: 13, color: '#64748b' }}>
        Showing <b>{startIdx}</b> to <b>{endIdx}</b> of <b>{totalItems}</b> items
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <ChevronLeft size={16} /> Previous
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1))
            .map((p, i, arr) => (
              <React.Fragment key={p}>
                {i > 0 && arr[i - 1] !== p - 1 && <span style={{ color: '#94a3b8', padding: '0 4px' }}>...</span>}
                <button
                  onClick={() => onPageChange(p)}
                  style={{
                    minWidth: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    border: '1px solid',
                    borderColor: currentPage === p ? '#2563eb' : '#cbd5e1',
                    background: currentPage === p ? '#2563eb' : '#fff',
                    color: currentPage === p ? '#fff' : '#1e293b',
                    fontWeight: currentPage === p ? 700 : 500,
                    cursor: 'pointer',
                    fontSize: 13
                  }}
                >
                  {p}
                </button>
              </React.Fragment>
            ))}
        </div>

        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};


const DEFAULT_SALARY_CURRENCY = 'PHP';

const sanitizeNumericSalaryInput = (value = '') => String(value || '').replace(/\D/g, '');

const getCurrencySymbol = (currency = DEFAULT_SALARY_CURRENCY) => {
  const code = String(currency || DEFAULT_SALARY_CURRENCY).toUpperCase();
  const symbols = {
    PHP: '\u20B1',
    USD: '$',
    EUR: '\u20AC',
    GBP: '\u00A3',
    JPY: '\u00A5',
  };
  return symbols[code] || '\u20B1';
};

const formatSalaryAmount = (value = '', currency = DEFAULT_SALARY_CURRENCY) => {
  const digits = sanitizeNumericSalaryInput(value);
  if (!digits) return '';
  return `${getCurrencySymbol(currency)}${Number(digits).toLocaleString('en-US')}`;
};

const formatSalaryRangeValue = (minimum = '', maximum = '', currency = DEFAULT_SALARY_CURRENCY) => {
  const minDigits = sanitizeNumericSalaryInput(minimum);
  const maxDigits = sanitizeNumericSalaryInput(maximum);

  if (minDigits && maxDigits) {
    return `${formatSalaryAmount(minDigits, currency)} - ${formatSalaryAmount(maxDigits, currency)}`;
  }
  if (minDigits) return `${formatSalaryAmount(minDigits, currency)}+`;
  if (maxDigits) return `Up to ${formatSalaryAmount(maxDigits, currency)}`;
  return '';
};

const inferSalaryCurrency = (salaryText = '', fallback = DEFAULT_SALARY_CURRENCY) => {
  const raw = String(salaryText || '').trim().toUpperCase();
  if (!raw) return fallback;
  if (raw.includes('\u20B1') || raw.includes('PHP')) return 'PHP';
  if (raw.includes('$') || raw.includes('USD')) return 'USD';
  if (raw.includes('\u20AC') || raw.includes('EUR')) return 'EUR';
  if (raw.includes('\u00A3') || raw.includes('GBP')) return 'GBP';
  if (raw.includes('\u00A5') || raw.includes('JPY')) return 'JPY';
  return fallback;
};

const parseSalaryRangeInputValues = (salaryText = '', fallbackCurrency = DEFAULT_SALARY_CURRENCY) => {
  const raw = String(salaryText || '').trim();
  if (!raw) {
    return { salaryCurrency: fallbackCurrency, salaryMin: '', salaryMax: '' };
  }

  const currency = inferSalaryCurrency(raw, fallbackCurrency);
  const numbers = raw
    .match(/\d[\d,]*/g)
    ?.map(value => sanitizeNumericSalaryInput(value))
    .filter(Boolean) || [];

  return {
    salaryCurrency: currency,
    salaryMin: numbers[0] || '',
    salaryMax: numbers[1] || '',
  };
};

const normalizeNcLevelValue = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const upper = raw.toUpperCase();
  if (upper.includes('NC IV') || /\bNC\s*4\b/.test(upper)) return 'NC IV';
  if (upper.includes('NC III') || /\bNC\s*3\b/.test(upper)) return 'NC III';
  if (upper.includes('NC II') || /\bNC\s*2\b/.test(upper)) return 'NC II';
  if (upper.includes('NC I') || /\bNC\s*1\b/.test(upper)) return 'NC I';

  return raw;
};

const formatSalaryDisplay = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw === 'Confidential') return 'To Be Discussed';
  const digitsOnly = raw.replace(/,/g, '');
  if (/^\d+$/.test(digitsOnly)) {
    return formatSalaryAmount(digitsOnly, DEFAULT_SALARY_CURRENCY);
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

const toProfileAuthorType = (authorType = '') => {
  const norm = String(authorType || '').toLowerCase();
  if (norm === 'admin') return 'admin';
  return isStudentAuthorType(authorType) ? 'trainee' : 'partner';
};
const toRecipientAuthorType = (authorType = '') => {
  const norm = String(authorType || '').toLowerCase();
  if (norm === 'admin') return 'admin';
  return isStudentAuthorType(authorType) ? 'student' : 'industry_partner';
};
const DEFAULT_PARTNER_PUBLIC_INFO_FIELDS = ['companyName', 'contactPerson', 'industry'];
const resolvePartnerVisibility = (profile) => {
  const value = profile?.companyInfoVisibility ?? profile?.company_info_visibility;
  return Array.isArray(value) ? value : DEFAULT_PARTNER_PUBLIC_INFO_FIELDS;
};

const normalizePartnerProfile = (profile) => {
  if (!profile) return null;

  const address = profile.address
    || [profile.detailed_address, profile.barangay, profile.city, profile.province, profile.region].filter(Boolean).join(', ')
    || '';

  const rawVerification = String(profile.verificationStatus || profile.verification_status || '').toLowerCase();
  const verificationStatus = profile.verificationStatus
    || (rawVerification === 'verified'
      ? 'Verified'
      : rawVerification === 'rejected'
        ? 'Rejected'
        : rawVerification === 'under_review'
          ? 'Under Review'
          : rawVerification === 'pending'
            ? 'Pending'
            : 'Pending');

  return {
    ...profile,
    companyName: profile.companyName || profile.company_name || profile.profileName || 'Industry Partner',
    contactPerson: profile.contactPerson || profile.contact_person || '',
    email: profile.email || profile.contact_email || '',
    address,
    website: profile.website || '',
    industry: profile.industry || profile.business_type || 'General',
    achievements: Array.isArray(profile.achievements) ? profile.achievements : [],
    benefits: Array.isArray(profile.benefits) ? profile.benefits : [],
    mission: profile.mission || '',
    vision: profile.vision || '',
    culture_tags: Array.isArray(profile.culture_tags) ? profile.culture_tags : [],
    perks_tags: Array.isArray(profile.perks_tags) ? profile.perks_tags : [],
    poc_name: profile.poc_name || '',
    poc_title: profile.poc_title || '',
    poc_photo_url: profile.poc_photo_url || '',
    office_location_url: profile.office_location_url || '',
    banner_url: profile.banner_url || '',
    photo: profile.photo || profile.company_logo_url || null,
    company_logo_url: profile.company_logo_url || profile.photo || null,
    companyInfoVisibility: resolvePartnerVisibility(profile),
    verificationStatus,
    region: profile.region || '',
    province: profile.province || '',
    city: profile.city || '',
    barangay: profile.barangay || '',
    detailed_address: profile.detailed_address || '',
    regionCode: profile.regionCode || '',
    provinceCode: profile.provinceCode || '',
    cityCode: profile.cityCode || '',
    barangayCode: profile.barangayCode || '',
  };
};

// --- STATUS BADGE HELPER ------------------------------------------
const StatusBadge = ({ status }) => {
  const map = {
    'Pending Verification': 'ln-badge-yellow',
    'Under Review': 'ln-badge-blue',
    'Verified': 'ln-badge-green',
    'Rejected': 'ln-badge-red',
  };
  const iconMap = {
    'Pending Verification': <Clock size={12} />,
    'Under Review': <FileCheck size={12} />,
    'Verified': <CheckCircle size={12} />,
    'Rejected': <XCircle size={12} />,
  };
  return (
    <span className={`ln-badge ${map[status] || 'ln-badge-gray'}`} style={{ gap: 4 }}>
      {iconMap[status]} {status}
    </span>
  );
};

// --- TOP NAVIGATION BAR (LinkedIn-style for Partners) -------------
// --- LEFT NAVIGATION BAR -------------
const PartnerSideNav = ({ activePage, setActivePage }) => {
    const { currentUser, confirmAction } = useApp();
    const { data: partners = [] } = usePartners();

    // Partner-specific data
    const livePartner = getLivePartner(currentUser, partners);
    const verified = isVerified(livePartner);
    const initials = livePartner?.companyName?.charAt(0)?.toUpperCase() || 'P';

    const navItems = [
        { id: 'dashboard', label: 'Home', icon: <Home size={18} /> },
        ...(!verified ? [{ id: 'verification', label: 'Verification', icon: <ShieldCheck size={18} /> }] : []),
        { id: 'post-job', label: 'Post Opportunities', icon: <Plus size={18} />, locked: !verified },
        { id: 'calendar', label: 'Calendar', icon: <Calendar size={18} />, locked: !verified },
        { id: 'applicants', label: 'Recruit', icon: <Users size={18} />, locked: !verified },
    ];

    return (
        <aside className="tt-sidenav">
            {/* Profile mini card */}
            <div
                className="tt-sidenav-profile"
                onClick={() => setActivePage('profile')}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setActivePage('profile')}
            >
                <div className="tt-sidenav-avatar">
                    {livePartner?.company_logo_url || livePartner?.photo
                        ? <img src={livePartner.company_logo_url || livePartner.photo} alt={livePartner?.companyName || 'Profile'} />
                        : initials
                    }
                </div>
                <div className="tt-sidenav-profile-info">
                    <div className="tt-sidenav-profile-name">{livePartner?.companyName || 'Partner'}</div>
                    <div className="tt-sidenav-profile-role">Industry Partner</div>
                </div>
                <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
            </div>

            {/* Nav Items */}
            <div className="tt-sidenav-section-label">Navigation</div>
            <nav className="tt-sidenav-nav">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        className={`tt-sidenav-item ${activePage === item.id ? 'active' : ''}`}
                        onClick={() => {
                            if (item.locked && !verified) {
                                confirmAction({ message: "Verification Required. Go to Verification page?", type: 'warning', onConfirm: () => {
                                    setActivePage('verification');
                                } })
                            } else {
                                setActivePage(item.id);
                            }
                        }}
                        title={item.label}
                    >
                        <span className={`tt-sidenav-item-icon ${item.locked ? 'text-gray-400' : ''}`}>
                            {item.locked ? <Lock size={18} /> : item.icon}
                        </span>
                        <span className={`tt-sidenav-item-label ${item.locked ? 'text-gray-400 opacity-60' : ''}`}>{item.label}</span>
                    </button>
                ))}
            </nav>
        </aside>
    );
};

// --- LAYOUT WRAPPER ----------------------------------------------
const PartnerLayout = ({ children, activePage, setActivePage }) => (
    <div className="ln-app partner-theme">
        <TopNavBar activePage={activePage} setActivePage={setActivePage} />
        <PartnerSideNav activePage={activePage} setActivePage={setActivePage} />
        <main className="ln-main">
            {children}
        </main>
    </div>
);

// --- LEFT: COMPANY PROFILE CARD ----------------------------------
const CompanySideCard = ({ partner, setActivePage }) => {
  const initials = partner?.companyName?.charAt(0)?.toUpperCase() || 'P';
  const visibleCompanyInfo = new Set(resolvePartnerVisibility(partner));
  const showSideAddress = visibleCompanyInfo.has('address');
  return (
    <div className="ln-card ln-profile-card">
      <div
        className="ln-profile-banner pn-profile-banner"
        style={partner?.banner_url ? { backgroundImage: `url(${partner.banner_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      />
      <div className="ln-profile-card-body">
        <div className="ln-profile-avatar-wrap" style={{ overflow: 'hidden' }}>
          <div className="ln-profile-avatar-lg pn-avatar-lg" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {partner?.company_logo_url ? (
              <img src={partner.company_logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : initials}
          </div>
        </div>
        <h2 className="ln-profile-name" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {partner?.companyName}
          {isVerified(partner) && <CheckCircle size={16} color="#059669" title="Verified" style={{ flexShrink: 0 }} />}
        </h2>
        <p className="ln-profile-headline">{partner?.industry} &bull; Industry Partner</p>
        {showSideAddress && partner?.address && (
          <p className="ln-profile-location"><MapPin size={13} /> {partner.address}</p>
        )}

        <div style={{ margin: '12px 0 8px', display: 'flex', justifyContent: 'center' }}>
          <StatusBadge status={partner?.verificationStatus || 'Pending Verification'} />
        </div>

        <div className="ln-profile-stats">
          <div className="ln-profile-stat" onClick={() => setActivePage('applicants')}>
            <span className="ln-profile-stat-num pn-stat-num">{partner?.companySize || '—'}</span>
            <span className="ln-profile-stat-label">Company Size</span>
          </div>
          <div className="ln-profile-stat-divider" />
          <div className="ln-profile-stat" onClick={() => setActivePage('profile')}>
            <span className="ln-profile-stat-num pn-stat-num">{partner?.contactPerson ? '?' : '—'}</span>
            <span className="ln-profile-stat-label">Contact Info</span>
          </div>
        </div>

        <button className="ln-btn-profile-view pn-btn-profile" onClick={() => setActivePage('profile')}>
          View company profile
        </button>
      </div>
    </div>
  );
};

// --- RIGHT: QUICK ACTIONS WIDGET ---------------------------------
const QuickActionsWidget = ({ setActivePage, verified }) => (
  <div className="ln-card ln-widget">
    <div className="ln-widget-header"><span>Quick Actions</span></div>
    {[
      { label: 'Post Opportunities', icon: <Plus size={16} />, page: 'post-job', locked: !verified },
      { label: 'Calendar', icon: <Calendar size={16} />, page: 'calendar', locked: !verified },
      { label: 'Recruit', icon: <Users size={16} />, page: 'applicants', locked: !verified },
      ...(!verified ? [{ label: 'Verification', icon: <ShieldCheck size={16} />, page: 'verification', locked: false }] : []),
    ].map(link => (
      <button
        key={link.page}
        className="ln-quick-link"
        onClick={() => { if (!link.locked) setActivePage(link.page); }}
        style={link.locked ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
      >
        {link.icon} {link.label}
        {link.locked ? <Lock size={12} className="ln-quick-link-arrow" /> : <ChevronRight size={14} className="ln-quick-link-arrow" />}
      </button>
    ))}
  </div>
);

const RecruitmentStatsWidget = ({ myJobs, myApplicants }) => (
  <div className="ln-card ln-widget">
    <div className="ln-widget-header"><span>Recruitment Overview</span></div>
    {[
      { label: 'New Applicants', value: myApplicants.filter(a => ['pending', 'received', 'sent'].includes(String(a.status || '').toLowerCase())).length, color: '#10b981' },
      { label: 'Interviews Scheduled', value: myApplicants.filter(a => String(a.status || '').toLowerCase() === 'interview scheduled').length, color: '#059669' },
      { label: 'Pending Decisions', value: myApplicants.filter(a => ['under review', 'screened'].includes(String(a.status || '').toLowerCase())).length, color: '#047857' },
      { label: 'Hired / Placed', value: myApplicants.filter(a => ['accepted', 'hired', 'offered'].includes(String(a.status || '').toLowerCase())).length, color: '#10b981' },
    ].map(stat => (
      <div key={stat.label} className="ln-suggested-item" style={{ cursor: 'default' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: stat.color, fontWeight: 800, fontSize: 15, flexShrink: 0
        }}>{stat.value}</div>
        <div className="ln-suggested-info">
          <div className="ln-suggested-title">{stat.label}</div>
        </div>
      </div>
    ))}
  </div>
);

// --- PAGE 1: PARTNER DASHBOARD HOME ------------------------------
const PartnerHome = ({ setActivePage, openContactModal }) => {
  const { 
    currentUser, updatePartnerJobPosting, 
    getPartnerApplicants, createPost, updatePost, deletePost, 
    deleteJobPosting, 
    createPostInteraction, 
    getUserPostInteraction, fetchPostInteractions, fetchPosts, fetchJobPostings, 
    uploadOptimizedImage, confirmAction, loadMoreFeeds
  } = useApp();
  const sendContactMutation = useSendContactRequest();

  const { data: partners = [] } = usePartners();
  const { data: trainees = [] } = useTrainees();
  const { data: posts = [] } = usePosts();
  const { data: jobPostings = [] } = useJobPostings();
  const { data: programsData } = usePrograms();
  const programs = programsData?.data || [];

  useEffect(() => {
    // fetchPosts(); // Managed by TanStack Query
    // fetchJobPostings(); // Managed by TanStack Query
    fetchPostInteractions();
  }, [currentUser?.id]);
  const [feedViewMode, setFeedViewMode] = useState('list'); // 'grid' or 'list'
  const [feedFilter, setFeedFilter] = useState('All');
  const [feedSearchText, setFeedSearchText] = useState('');
  const [visibleFeedCount, setVisibleFeedCount] = useState(20);
  const [feedCurrentPage, setFeedCurrentPage] = useState(1);
  const feedPageSize = 20;


  const navigate = useNavigate();
  const partner = getLivePartner(currentUser, partners);
  const verified = isVerified(partner);
  const myJobs = jobPostings.filter(j => j.partnerId === partner?.id);
  const myApplicants = getPartnerApplicants(partner?.id);
  const initials = partner?.companyName?.charAt(0)?.toUpperCase() || 'P';
  const programOptions = Array.isArray(programs) ? programs : [];
  const ncLevelOptions = ['NC I', 'NC II', 'NC III', 'NC IV'];

  const buildEditJobForm = (job = null) => {
    if (!job) {
      return {
        title: '',
        opportunityType: 'Job',
        programId: '',
        ncLevel: '',
        description: '',
        employmentType: 'Full-time',
        location: '',
        salaryCurrency: DEFAULT_SALARY_CURRENCY,
        salaryMin: '',
        salaryMax: '',
        requiredCompetencies: [],
        attachmentName: '',
        attachmentType: '',
        attachmentUrl: '',
      };
    }

    const parsedSalary = parseSalaryRangeInputValues(
      job.salaryRange,
      job.salaryCurrency || DEFAULT_SALARY_CURRENCY,
    );

    const matchedProgram = programOptions.find(program => String(program.id) === String(job.programId))
      || programOptions.find(program => String(program.name || '').trim() === String(job.ncLevel || '').trim())
      || null;

    const normalizedNcLevel = normalizeNcLevelValue(job.ncLevel || matchedProgram?.ncLevel || '');

    return {
      title: job.title || '',
      opportunityType: job.opportunityType || 'Job',
      programId: matchedProgram?.id || job.programId || '',
      ncLevel: ncLevelOptions.includes(normalizedNcLevel) ? normalizedNcLevel : '',
      description: job.description || '',
      employmentType: (job.opportunityType || 'Job') === 'OJT' ? '' : (job.employmentType || 'Full-time'),
      location: job.location || '',
      salaryCurrency: job.salaryCurrency || parsedSalary.salaryCurrency || DEFAULT_SALARY_CURRENCY,
      salaryMin: job.salaryMin ? sanitizeNumericSalaryInput(job.salaryMin) : parsedSalary.salaryMin,
      salaryMax: job.salaryMax ? sanitizeNumericSalaryInput(job.salaryMax) : parsedSalary.salaryMax,
      requiredCompetencies: Array.isArray(job.requiredCompetencies) ? job.requiredCompetencies : [],
      attachmentName: job.attachmentName || '',
      attachmentType: job.attachmentType || '',
      attachmentUrl: job.attachmentUrl || '',
      detailedAddress: job.detailed_address || job.detailedAddress || '',
    };
  };

  // Create Post state
  const [postContent, setPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [postType, setPostType] = useState('general');
  const [showPostModal, setShowPostModal] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postExpiryEnabled, setPostExpiryEnabled] = useState(false);
  const [postExpiryDate, setPostExpiryDate] = useState('');
  const [postLocation, setPostLocation] = useState('');
  const [postDetailedAddress, setPostDetailedAddress] = useState('');
  const [editingPostId, setEditingPostId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [postMenuId, setPostMenuId] = useState(null);
  const [jobPostMenuId, setJobPostMenuId] = useState(null);
  const [editJobModal, setEditJobModal] = useState(null);
  const [editJobForm, setEditJobForm] = useState(() => buildEditJobForm());
  const [editJobAttachmentFile, setEditJobAttachmentFile] = useState(null);
  const [editJobSaving, setEditJobSaving] = useState(false);
  const [showAllEditComps, setShowAllEditComps] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const [isCompactCommentViewport, setIsCompactCommentViewport] = useState(() => (
    typeof window !== 'undefined' ? window.innerWidth <= 1024 : false
  ));
  const fileInputRef = useRef(null);
  const openProfile = (target) => {
    if (!target?.id || !target?.type) return;
    navigate(`/partner/profile-view/${target.type}/${target.id}`);
  };

  const closeEditJobModal = () => {
    if (editJobForm.attachmentUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(editJobForm.attachmentUrl);
    }
    setEditJobModal(null);
    setEditJobAttachmentFile(null);
    setEditJobSaving(false);
    setEditJobForm(buildEditJobForm());
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
    const activeFeedModal = editJobModal;
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
  }, [editJobModal]);



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
    let attachmentType = 'general';

    try {
      if (selectedFile) {
        const path = `post-media/${currentUser.id}/${Date.now()}_${selectedFile.name}`;
        const res = await uploadOptimizedImage('registration-uploads', path, selectedFile);
        if (!res.success) throw new Error(res.error);
        media_url = res.url;
        attachmentType = `${selectedFile.type || 'image/jpeg'} (${res.sizeLabel})`;
      }

      const res = await createPost({
        title: postTitle || null,
        content: postContent,
        post_type: postType,
        media_url: media_url,
        attachment_type: attachmentType || null,
        expires_at: postExpiryEnabled && postExpiryDate ? new Date(postExpiryDate + 'T23:59:59').toISOString() : null,
        location: postLocation || null,
        detailed_address: postDetailedAddress || null,
        tags: []
      });

      if (res.success) {
        toast.success('Post created successfully!');
        setPostContent('');
        setPostType('general');
        setPostTitle('');
        setPostExpiryEnabled(false);
        setPostExpiryDate('');
        setPostLocation('');
        setPostDetailedAddress('');
        setSelectedFile(null);
        setFilePreview(null);
        setShowPostModal(false);
      } else {
        toast.error(res.error || 'Failed to post');
      }
    } catch (err) {
      console.error('Posting error:', err);
      toast.error('Failed to post: ' + err.message);
    } finally {
      setIsPosting(false);
    }
  };


  const handleEditPost = (post) => {
    setEditingPostId(post.id);
    setEditContent(post.content || '');
    setPostMenuId(null);
  };

  const handleSaveEdit = async (postId) => {
    if (!editContent.trim()) return;
    const res = await updatePost(postId, { content: editContent.trim() });
    if (res.success) {
      setEditingPostId(null);
      setEditContent('');
      toast.success('Post updated!');
    } else {
      toast.error(res.error || 'Failed to update post');
    }
  };

  const handleDeletePost = async (postId) => {
    confirmAction({ 
            message: 'Delete this post?', 
            type: 'danger',
            onConfirm: async () => {
                const res = await deletePost(postId);
                if (!res.success) {
                    toast.error(res.error || 'Failed to delete post');
                }
                setPostMenuId(null);
            } 
        })
  };

  const handleDeleteOpportunity = async (jobId) => {
    confirmAction({ 
            message: 'Delete this post?', 
            type: 'danger',
            onConfirm: async () => {
                const res = await deleteJobPosting(jobId);
                if (!res.success) {
                    toast.error(res.error || 'Failed to delete post');
                }
                setJobPostMenuId(null);
            } 
        })
  };

  const handleEditJobAttachmentChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isDocument = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ].includes(file.type);

    if (!isImage && !isDocument) {
      toast.error('Only image files, PDF, DOC, and DOCX are allowed.');
      event.target.value = '';
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setEditJobAttachmentFile(file);
    setEditJobForm(prev => {
      if (prev.attachmentUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(prev.attachmentUrl);
      }
      return {
        ...prev,
        attachmentName: file.name,
        attachmentType: file.type || 'application/octet-stream',
        attachmentUrl: objectUrl,
      };
    });
  };

  const removeEditJobAttachment = () => {
    setEditJobAttachmentFile(null);
    setEditJobForm(prev => {
      if (prev.attachmentUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(prev.attachmentUrl);
      }
      return {
        ...prev,
        attachmentName: '',
        attachmentType: '',
        attachmentUrl: '',
      };
    });
  };

  const toggleEditJobCompetency = (competency) => {
    setEditJobForm(prev => ({
      ...prev,
      requiredCompetencies: prev.requiredCompetencies.includes(competency)
        ? prev.requiredCompetencies.filter(item => item !== competency)
        : [...prev.requiredCompetencies, competency],
    }));
  };

  const handleEditSalaryMinInput = (event) => {
    const digits = sanitizeNumericSalaryInput(event.target.value);
    setEditJobForm(prev => ({ ...prev, salaryMin: digits }));
  };

  const handleEditSalaryMaxInput = (event) => {
    const digits = sanitizeNumericSalaryInput(event.target.value);
    setEditJobForm(prev => ({ ...prev, salaryMax: digits }));
  };

  const handleEditOpportunity = (job) => {
    if (!job?.id || !myJobIds.has(job.id)) return;
    setJobPostMenuId(null);
    setEditJobAttachmentFile(null);
    setEditJobForm(buildEditJobForm(job));
    setEditJobModal(job);
    setShowAllEditComps(false);
  };

  const handleSaveEditedOpportunity = async (event) => {
    event.preventDefault();
    if (!editJobModal?.id) return;

    if (!editJobForm.title.trim() || !editJobForm.location.trim()) {
      toast.error('Title and location are required.');
      return;
    }
    if (!editJobForm.ncLevel) {
      toast.error('Please select an NC level.');
      return;
    }

    const hasSalaryInput = Boolean(editJobForm.salaryMin || editJobForm.salaryMax);
    if (hasSalaryInput && (!editJobForm.salaryMin || !editJobForm.salaryMax)) {
      toast.error('Please provide both minimum and maximum salary.');
      return;
    }

    const salaryMinNumber = Number(editJobForm.salaryMin || 0);
    const salaryMaxNumber = Number(editJobForm.salaryMax || 0);
    if (hasSalaryInput && salaryMinNumber > salaryMaxNumber) {
      toast.success('Minimum salary cannot be greater than maximum salary.');
      return;
    }

    setEditJobSaving(true);

    try {
      let finalAttachmentUrl = editJobForm.attachmentUrl || '';
      let finalAttachmentName = editJobForm.attachmentName || '';
      let finalAttachmentType = editJobForm.attachmentType || '';

      if (editJobAttachmentFile && currentUser?.id) {
        const timestamp = Date.now();
        const safeName = editJobAttachmentFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `opportunity-attachments/${currentUser.id}/${timestamp}_${safeName}`;

        const res = await uploadOptimizedImage('registration-uploads', storagePath, editJobAttachmentFile);
        if (!res.success) throw new Error(res.error);
        finalAttachmentUrl = res.url;
        finalAttachmentName = editJobAttachmentFile.name;
        finalAttachmentType = editJobAttachmentFile.type || '';
      }

      const payload = {
        ...editJobForm,
        title: editJobForm.title.trim(),
        location: editJobForm.location.trim(),
        description: editJobForm.description.trim(),
        employmentType: editJobForm.opportunityType === 'OJT' ? '' : editJobForm.employmentType,
        salaryRange: formatSalaryRangeValue(editJobForm.salaryMin, editJobForm.salaryMax, editJobForm.salaryCurrency),
        salaryCurrency: editJobForm.salaryCurrency,
        salaryMin: editJobForm.salaryMin ? Number(editJobForm.salaryMin) : null,
        salaryMax: editJobForm.salaryMax ? Number(editJobForm.salaryMax) : null,
        attachmentName: finalAttachmentName,
        attachmentType: finalAttachmentType,
        attachmentUrl: finalAttachmentUrl,
        detailed_address: editJobForm.detailedAddress || null,
      };

      const result = await updatePartnerJobPosting(editJobModal.id, payload);
      if (!result?.success) {
        toast.error(result?.error || 'Failed to update opportunity.');
        return;
      }

      toast.success('Opportunity updated successfully!');
      closeEditJobModal();
    } catch (error) {
      toast.error(error?.message || 'Failed to update opportunity.');
    } finally {
      setEditJobSaving(false);
    }
  };

  const myJobIds = new Set(myJobs.map(job => job.id));

  const formatBulletinDate = (dateStr) => {
    if (!dateStr) return '';
    if (dateStr.includes('—') || (dateStr.includes('-') && dateStr.split('-').length !== 3)) return dateStr;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Unified Feed: tag bulletin posts - NO job postings in community feed (they belong in Opportunities tab)
  const BULLETIN_TYPES = ['training_batch', 'exam_schedule', 'certification_assessment', 'announcement'];
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
      const isPartner = authorType === 'industry_partner' || authorType === 'partner';
      const isOwnPost = String(p.author_id) === String(partner?.id || currentUser?.id);

      // Hide job posts (they belong in Opportunities tab)
      if (p.post_type === 'hiring_update' || p.feedType === 'job') return false;

      // Partner should not see other partner posts
      if (isPartner && !isOwnPost) return false;

      return true;
    })
    .sort((a, b) => new Date(b.created_at || b.createdAt || b.datePosted) - new Date(a.created_at || a.createdAt || a.datePosted));
  }, [posts, partner?.id, currentUser?.id]);
    const filteredFeed = React.useMemo(() => {
        let list = unifiedFeed;
        if (feedFilter === "All" || feedFilter === "Recommended") {
        } else if (feedFilter === "Announcement") {
            list = list.filter(item => item.post_type === "announcement");
        } else if (feedFilter === "Achievement") {
            list = list.filter(item => item.post_type === "achievement");
        } else if (feedFilter === "General") {
            list = list.filter(item => item.post_type === "general" || (!item.post_type && item.feedType === "post"));
        } else if (feedFilter === "Public") {
            list = list.filter(item => item.post_type === "public");
        } else if (feedFilter === "Certification") {
            list = list.filter(item => item.post_type === "certification");
        } else if (feedFilter === "Project") {
            list = list.filter(item => item.post_type === "project");
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



    // Auto-fetch next pages from DB as we approach the end of the loaded array
    useEffect(() => {
        const totalPages = Math.ceil((filteredFeed?.length || 0) / feedPageSize);
        if (feedCurrentPage >= totalPages - 1 && (filteredFeed?.length || 0) >= 20) {
            try { loadMoreFeeds(); } catch (e) {}
        }
    }, [feedCurrentPage, filteredFeed.length]);

  // Bulletin interaction state
  const [bulletinModal, setBulletinModal] = useState(null); // { post, type }
  const [bulletinMsg, setBulletinMsg] = useState('');
  const [bulletinSubmitting, setBulletinSubmitting] = useState(false);
  const [bulletinToast, setBulletinToast] = useState('');

  useEffect(() => {
    fetchPostInteractions();
  }, []);
  // Referral form fields
  const [referralName, setReferralName] = useState('');
  const [referralContact, setReferralContact] = useState('');
  const [referralNotes, setReferralNotes] = useState('');

  const showBulletinToast = (msg) => { setBulletinToast(msg); setTimeout(() => setBulletinToast(''), 3000); };

  const openBulletinModal = (post, type) => {
    setBulletinModal({ post, type });
    setBulletinMsg('');
    setReferralName('');
    setReferralContact('');
    setReferralNotes('');
  };

  const handleBulletinSubmit = async () => {
    if (!bulletinModal) return;
    setBulletinSubmitting(true);
    const isRefer = bulletinModal.type === 'refer';
    const details = isRefer
      ? { apprentice_name: referralName, apprentice_contact: referralContact, notes: referralNotes, company: partner?.companyName, referred_at: new Date().toISOString() }
      : { message: bulletinMsg, submitted_at: new Date().toISOString() };
    const res = await createPostInteraction(bulletinModal.post.id, bulletinModal.type, details);
    setBulletinSubmitting(false);
    if (res.success) {
      setBulletinModal(null);
      showBulletinToast(isRefer ? 'Referral submitted!' : bulletinModal.type === 'register' ? 'Registration submitted!' : 'Inquiry sent!');
      fetchPostInteractions();
    } else {
      toast.error(res.error || 'Failed to submit.');
    }
  };

  const BULLETIN_CONFIG = {
    training_batch: { label: 'Training Batch', color: '#7c3aed', bg: '#ede9fe', emoji: '🎓', partnerLabel: 'Refer Apprentice', type: 'refer' },
    exam_schedule: { label: 'Exam Schedule', color: '#0ea5e9', bg: '#e0f2fe', emoji: '📅', partnerLabel: 'Register Apprentice', type: 'register' },
    certification_assessment: { label: 'Certification Assessment', color: '#16a34a', bg: '#dcfce7', emoji: '📜', partnerLabel: 'Register Apprentice', type: 'register' },
    announcement: { label: 'Announcement', color: '#d97706', bg: '#fef3c7', emoji: '📢', partnerLabel: null, type: null },
  };

  const stats = [
    { label: 'Active Postings', value: myJobs.filter(j => j.status === 'Open').length, icon: <Briefcase size={20} />, color: '#0ea5e9' },
    { label: 'Total Applicants', value: myApplicants.length, icon: <Users size={20} />, color: '#7c3aed' },
    { label: 'Hired', value: myApplicants.filter(a => ['Accepted', 'Hired'].includes(a.status)).length, icon: <CheckCircle size={20} />, color: '#16a34a' },
    { label: 'Avg Match', value: myApplicants.length > 0 ? `${Math.round(myApplicants.reduce((s, a) => s + a.matchRate, 0) / myApplicants.length)}%` : '0%', icon: <Target size={20} />, color: '#d97706' },
  ];

  const selectedEditProgram = programOptions.find(program => String(program.id) === String(editJobForm.programId))
    || programOptions.find(program => String(program.name || '').trim() === String(editJobForm.ncLevel || '').trim())
    || null;
  const editProgramCompetencies = selectedEditProgram?.competencies || [];

  return (
    <>
      <div className="ln-col-main" style={{ width: '100%' }}>
        {/* Verification Banner */}
        {!verified && (
          <div className="verification-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: '#fef3c7',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0
              }}>
                <ShieldCheck size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#92400e' }}>Verify your company</div>
                <div style={{ fontSize: 13, color: '#a16207', marginTop: 2 }}>Unlock job posting and all opportunity features by verifying your business.</div>
              </div>
            </div>
            <button className="btn btn-primary" style={{ padding: '8px 20px', fontSize: 13, borderRadius: 10 }} onClick={() => setActivePage('verification')}>
              Verify Now
            </button>
          </div>
        )}

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

        {/* Create Post Entry Block */}
        <div className="ln-card" style={{ marginBottom: 20, padding: 16, cursor: 'pointer', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff' }} onClick={() => setShowPostModal(true)}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', flexShrink: 0, fontWeight: 700, fontSize: 16 }}>
              {partner?.company_name?.charAt(0) || partner?.profileName?.charAt(0) || 'P'}
            </div>
            <div style={{ flex: 1, padding: '12px 16px', background: '#f1f5f9', borderRadius: 24, color: '#64748b', fontSize: 14 }}>
              Share an announcement, event, or hiring update...
            </div>
            {/* Removed Image and Event buttons */}
          </div>
        </div>

        {/* Unified Community Feed Grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: 16 }}>
            <div style={{ flexShrink: 0 }}>
                <h3 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(0,0,0,0.6)', margin: 0, whiteSpace: 'nowrap' }}>Community Activity</h3>
            </div>
            
            <div style={{ display: 'flex', flex: '1 1 min-content', justifyContent: 'center', minWidth: '150px' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', maxWidth: '600px' }}>
                    <Search size={16} color="#64748b" style={{ position: 'absolute', left: '10px' }} />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={feedSearchText}
                        onChange={(e) => { setFeedSearchText(e.target.value); setVisibleFeedCount(20); }}
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
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <select
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', fontSize: 13, color: '#1e293b', cursor: 'pointer', outline: 'none', fontWeight: 500 }}
                value={feedFilter}
                onChange={(e) => { setFeedFilter(e.target.value); setFeedCurrentPage(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            >
              <option value="All">All</option>
              <option value="Trainee Finding Job">Trainee Finding Job</option>
            </select>

            <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: 6, overflow: 'hidden', background: '#fff', height: '31px' }}>
                <button 
                    style={{ padding: '0 10px', border: 'none', background: feedViewMode === 'grid' ? '#f1f5f9' : 'transparent', cursor: 'pointer', color: feedViewMode === 'grid' ? '#0f172a' : '#64748b', display: 'flex', alignItems: 'center' }} 
                    onClick={() => setFeedViewMode('grid')}
                    title="Grid View"
                >
                    <LayoutDashboard size={14} />
                </button>
                <button 
                    style={{ padding: '0 10px', border: 'none', borderLeft: '1px solid #e2e8f0', background: feedViewMode === 'list' ? '#f1f5f9' : 'transparent', cursor: 'pointer', color: feedViewMode === 'list' ? '#0f172a' : '#64748b', display: 'flex', alignItems: 'center' }} 
                    onClick={() => setFeedViewMode('list')}
                    title="List View"
                >
                    <AlignLeft size={14} />
                </button>
            </div>
          </div>
        </div>
        <div className={feedViewMode === 'list' ? "tt-feed-list" : "tt-feed-grid"} style={feedViewMode === 'list' ? { display: 'flex', flexDirection: 'column', gap: '16px' } : {}}>
          {filteredFeed.slice((feedCurrentPage - 1) * feedPageSize, feedCurrentPage * feedPageSize).map(item => {
            if (feedViewMode === 'list') {
              return <CompactFeedItem 
                  key={`compact-${item.id}`} 
                  item={item}
                  isOwnPost={item.author_id === currentUser?.id || item.partnerId === currentUser?.id}
                  onInquire={(i) => {
                      openContactModal({
                          recipientId: i.partnerId || i.author_id,
                          recipientType: i.feedType === 'job' ? 'industry_partner' : i.author_type,
                          recipientName: i.companyName || i.name || 'Recipient',
                          jobPostingId: i.feedType === 'job' ? i.id : undefined,
                          sourceLabel: i.title,
                      });
                  }}
                  onSave={(id) => createPostInteraction(id, 'save')}
                  onApply={(i, type) => {
                     if (i.feedType !== 'job') {
                         openBulletinModal(i, type);
                     }
                  }}
                  openProfile={openProfile}
                  onViewDetail={(i) => {
                     if (i.feedType === 'bulletin') openBulletinModal(i, 'view');
                  }}
                  hideApply={true}
              />;
            }
            if (item.feedType === 'bulletin') {
              let cfg = { ...(BULLETIN_CONFIG[item.post_type] || BULLETIN_CONFIG.announcement) };
              if (item.post_type === 'announcement' && item.accept_referrals) {
                cfg.type = 'refer';
                cfg.partnerLabel = 'Refer Apprentice';
              }
              const alreadyInteracted = getUserPostInteraction(item.id, cfg.type);
              const sc = { Open: { bg: '#dcfce7', color: '#16a34a' }, Full: { bg: '#fef3c7', color: '#d97706' }, Closed: { bg: '#fee2e2', color: '#dc2626' } }[item.status] || { bg: '#dcfce7', color: '#16a34a' };
              const reqs = Array.isArray(item.requirements) ? item.requirements : [];
              return (
                <div key={`bulletin-${item.id}`} className="ln-card ln-feed-card" style={{ marginBottom: 0, borderLeft: `4px solid ${cfg.color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px 10px' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{cfg.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: cfg.color }}>{cfg.label}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.color }}>{item.status || 'Open'}</span>
                        {item.accept_referrals && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#ede9fe', color: '#7c3aed', fontWeight: 600 }}>Accepts Referrals</span>}
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
                            return t?.name || t?.profileName || 'PSTDII Admin';
                          }

                          return 'PSTDII Admin';
                        })()} - {timeAgo(item.created_at)}
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
                                confirmAction({ message: 'Delete this post?', type: 'danger', onConfirm: () => {
                                  deletePost(item.id);
                                } })
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
                  <div style={{ padding: '0 16px 12px' }}>
                    <h4 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>{item.title}</h4>
                    <p style={{ fontSize: 14.5, color: '#475569', lineHeight: 1.6 }}>{item.content}</p>
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
                        {reqs.map((r, i) => <div key={i} style={{ fontSize: 12.5, color: '#475569', display: 'flex', gap: 6, marginBottom: 3 }}><span style={{ color: cfg.color }}>—</span>{r}</div>)}
                      </div>
                    )}
                  </div>
                  <div className="ln-feed-actions" style={{ borderTop: '1px solid #f3f3f3', padding: '8px 12px', display: 'flex', gap: 8 }}>
                    {cfg.type && item.accept_referrals !== false && (
                      <button
                        className="ln-feed-action-btn"
                        disabled={!!alreadyInteracted || item.status === 'Closed' || item.status === 'Full'}
                        onClick={() => openBulletinModal(item, cfg.type)}
                        style={alreadyInteracted ? { color: cfg.color, fontWeight: 700 } : {}}
                      >
                        {alreadyInteracted ? <><CheckCircle size={14} /> Submitted</> : <><Users size={14} /> {cfg.partnerLabel}</>}
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
              const myJob = item.partnerId === currentUser?.id;
              const tColor = POST_THEME['job']?.color || '#0a66c2';
              return (
                <div key={`job-${item.id}`} className="ln-card ln-feed-card" style={{ marginBottom: 0, borderLeft: `4px solid ${tColor}` }}>
                  <div className="ln-feed-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
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
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', font: 'inherit', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}
                          >
                            {item.companyName}
                            {partners.find(p => String(p.id) === String(item.partnerId))?.verificationStatus === 'Verified' && (
                              <VerifiedBadge size={14} />
                            )}
                          </button>
                          {myJob && <span className="ln-badge ln-badge-blue" style={{ fontSize: 10, marginLeft: 4 }}>Your Post</span>}
                        </div>
                        <div className="ln-feed-meta">
                          {[
                            (item.industry && String(item.industry).trim().toLowerCase() !== 'general') ? item.industry : '',
                            item.location,
                            timeAgo(item.created_at || item.createdAt || item.datePosted),
                          ].filter(Boolean).join(' - ')}
                        </div>
                      </div>
                    </div>
                    {myJob && (
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={() => setJobPostMenuId(jobPostMenuId === item.id ? null : item.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: '50%', color: '#65676b' }}
                          title="More options"
                        >
                          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2, lineHeight: 1 }}>...</span>
                        </button>
                        {jobPostMenuId === item.id && (
                          <div style={{
                            position: 'absolute', right: 0, top: 32, background: '#fff',
                            borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                            border: '1px solid #e4e6eb', zIndex: 10, minWidth: 170, overflow: 'hidden'
                          }}>
                            <button
                              onClick={() => handleEditOpportunity(item)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                                padding: '10px 16px', border: 'none', background: 'none',
                                cursor: 'pointer', fontSize: 14, color: '#1c1e21'
                              }}
                              onMouseEnter={e => e.target.style.background = '#f2f3f5'}
                              onMouseLeave={e => e.target.style.background = 'none'}
                            >
                              <Edit size={16} /> Edit opportunity
                            </button>
                            <button
                              onClick={() => handleDeleteOpportunity(item.id)}
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
                    <h4 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 8, lineHeight: 1.3 }}>{item.title}</h4>
                    <p style={{ fontSize: 14.5, color: '#475569', lineHeight: 1.6, marginBottom: 8 }}>{item.description.substring(0, 150)}...</p>
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
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: item.salaryRange ? 8 : 0 }}>
                      <span className="ln-opp-type-badge">{item.opportunityType}</span>
                      {item.opportunityType !== 'OJT' && item.employmentType && (
                        <span className="ln-opp-type-badge" style={{ background: '#f8fafc', color: '#64748b' }}>{item.employmentType}</span>
                      )}
                      {item.ncLevel && (
                        <span className="ln-opp-type-badge" style={{ background: '#ede9fe', color: '#6d28d9' }}>{item.ncLevel}</span>
                      )}
                    </div>
                    {item.salaryRange && (
                      <div style={{ marginBottom: 0 }}>
                        <span style={{ fontSize: 15, color: '#057642', fontWeight: 700 }}>{formatSalaryDisplay(item.salaryRange)}</span>
                      </div>
                    )}
                  </div>
                  <div className="ln-feed-actions" style={{ borderTop: '1px solid #f3f3f3', padding: '8px 12px' }}>
                    {myJob && (
                      <button className="ln-feed-action-btn" onClick={() => setActivePage('applicants')}>
                        <Users size={14} /> View Applicants
                      </button>
                    )}
                    <button
                      className="ln-feed-action-btn"
                      onClick={() => !myJob && openContactModal({
                        recipientId: item.partnerId,
                        recipientType: 'industry_partner',
                        recipientName: item.companyName,
                        jobPostingId: item.id,
                        sourceLabel: item.title,
                      })}
                      disabled={myJob}
                      style={myJob ? { opacity: 0.55, cursor: 'not-allowed' } : undefined}
                    >
                      <MessageSquare size={14} /> {myJob ? 'Your Listing' : 'Contact'}
                    </button>
                  </div>
                </div>
              );
            } else {
              const authorId = String(item.author_id || '');
              const ADMIN_ID = 'de305d54-75b4-431b-adb2-eb6b9e546014';
              const isAdminItem = item.author_type === 'admin' || authorId === ADMIN_ID;

              const author = (item.author_id === currentUser?.id)
                ? currentUser
                : (isAdminItem
                  ? { name: 'PSTDII Admin' }
                  : (isStudentAuthorType(item.author_type)
                    ? trainees.find(t => t.id === authorId)
                    : partners.find(p => p.id === authorId)));
              const authorProfileType = toProfileAuthorType(item.author_type);

              const authorInitial = author?.name?.charAt(0) || author?.companyName?.charAt(0) || '?';
              const isMe = item.author_id === currentUser?.id;


              const tColor = POST_THEME[item.post_type]?.color || POST_THEME['general'].color;

              return (
                <div key={`post-${item.id}`} className="ln-card ln-feed-card" style={{ marginBottom: 0, borderLeft: `4px solid ${tColor}` }}>
                  <div className="ln-feed-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <button
                        type="button"
                        className="ln-feed-avatar"
                        onClick={() => openProfile({ id: item.author_id, type: authorProfileType })}
                        style={{ border: 'none', cursor: 'pointer' }}
                      >
                        {author?.photo || author?.company_logo_url ? (
                          <img src={author.photo || author.company_logo_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (authorInitial)}
                      </button>
                      <div>
                        <div className="ln-feed-author" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => openProfile({ id: item.author_id, type: authorProfileType })}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', font: 'inherit', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}
                          >
                            {author?.name || author?.profileName || author?.companyName || 'Unknown User'}
                            {author?.verificationStatus === 'Verified' && (
                              <VerifiedBadge size={14} />
                            )}
                          </button>
                          {isMe && <span className="ln-badge ln-badge-gray" style={{ fontSize: 10 }}>You</span>}
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
                          {isAdminItem ? 'Official Account' : (isStudentAuthorType(item.author_type) ? 'TESDA Trainee' : 'Industry Partner')} &bull; {timeAgo(item.created_at)}
                          {item.updated_at && item.updated_at !== item.created_at && ' (edited)'}
                        </div>
                      </div>
                    </div>
                    {isMe && (
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={() => setPostMenuId(postMenuId === item.id ? null : item.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: '50%', color: '#65676b' }}
                          title="More options"
                        >
                          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2, lineHeight: 1 }}>...</span>
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
                              onClick={() => handleDeletePost(item.id)}
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
                            width: '100%', minHeight: 100, padding: 12, fontSize: 14.5,
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
                        <h4 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 8, lineHeight: 1.3 }}>{item.title}</h4>
                        <p style={{ whiteSpace: 'pre-wrap', fontSize: 14.5, color: '#475569', lineHeight: 1.6 }}>{item.content}</p>
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
                      onClick={() => openContactModal({
                        recipientId: item.author_id,
                        recipientType: toRecipientAuthorType(item.author_type),
                        recipientName: author?.name || author?.profileName || author?.companyName || 'Community User',
                        postId: item.id,
                        sourceLabel: item.content,
                      })}
                      disabled={isMe}
                      style={isMe ? { opacity: 0.55, cursor: 'not-allowed' } : undefined}
                    >
                      <MessageSquare size={16} /> {isMe ? 'Your Post' : 'Contact'}
                    </button>
                  </div>
                </div>
              );
            }
          })}
          {filteredFeed.length === 0 && (
            <div className="ln-empty-state"><TrendingUp size={48} /><h3>No community activity</h3><p>Try changing your filter or post an update.</p></div>
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

      {/* Bulletin Toast */}
      {bulletinToast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={16} color="#4ade80" />{bulletinToast}
        </div>
      )}

      {/* Bulletin Interaction Modals */}
      {bulletinModal && (() => {
        const cfg = BULLETIN_CONFIG[bulletinModal.post.post_type] || BULLETIN_CONFIG.announcement;
        const isRefer = bulletinModal.type === 'refer';
        const isInquiry = bulletinModal.type === 'inquire';
        const title = isRefer ? 'Refer an Apprentice' : isInquiry ? 'Send Inquiry' : 'Register Apprentice';
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
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
                {isRefer ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Apprentice Name *</label>
                        <input value={referralName} onChange={e => setReferralName(e.target.value)} placeholder="Full name" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Contact / Email</label>
                        <input value={referralContact} onChange={e => setReferralContact(e.target.value)} placeholder="email or phone" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Notes (optional)</label>
                      <textarea value={referralNotes} onChange={e => setReferralNotes(e.target.value)} placeholder="Add any relevant notes about the apprentice..." rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
                    </div>
                  </>
                ) : (
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                      {isInquiry ? 'Your Inquiry *' : 'Message (optional)'}
                    </label>
                    <textarea value={bulletinMsg} onChange={e => setBulletinMsg(e.target.value)} placeholder={isInquiry ? 'Type your inquiry here...' : 'Add a note...'} rows={4} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={() => setBulletinModal(null)} style={{ padding: '10px 18px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button
                    onClick={handleBulletinSubmit}
                    disabled={bulletinSubmitting || (isRefer && !referralName.trim()) || (isInquiry && !bulletinMsg.trim())}
                    style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: cfg.color, color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: bulletinSubmitting ? 0.6 : 1 }}
                  >
                    {bulletinSubmitting ? 'Submitting...' : isRefer ? 'Submit Referral' : isInquiry ? 'Send Inquiry' : 'Confirm'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {editJobModal && (

        <div className="modal-overlay" onClick={closeEditJobModal}>
          <div className="ln-modal" onClick={e => e.stopPropagation()} style={{ width: '95%', maxWidth: 860, maxHeight: '92vh', overflow: 'hidden', padding: 0, background: '#fff' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>Edit Opportunity</h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>Update your posting without leaving this page.</p>
              </div>
              <button className="ln-btn-icon" onClick={closeEditJobModal} aria-label="Close edit opportunity modal"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveEditedOpportunity} style={{ padding: 20, overflowY: 'auto', maxHeight: 'calc(92vh - 74px)' }}>
              <div className="ln-info-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="ln-info-label">Title *</label>
                  <input
                    className="form-input"
                    value={editJobForm.title}
                    onChange={e => setEditJobForm(prev => ({ ...prev, title: e.target.value }))}
                    maxLength={100}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="ln-info-label">Opportunity Type *</label>
                  <select
                    className="form-select"
                    value={editJobForm.opportunityType}
                    onChange={e => {
                      const nextType = e.target.value;
                      setEditJobForm(prev => ({
                        ...prev,
                        opportunityType: nextType,
                        employmentType: nextType === 'OJT' ? '' : (prev.employmentType || 'Full-time'),
                      }));
                    }}
                  >
                    <option>Job</option>
                    <option>OJT</option>
                    <option>Apprenticeship</option>
                  </select>
                </div>

                {editJobForm.opportunityType !== 'OJT' && (
                  <div className="form-group">
                    <label className="ln-info-label">Employment Type</label>
                    <select
                      className="form-select"
                      value={editJobForm.employmentType}
                      onChange={e => setEditJobForm(prev => ({ ...prev, employmentType: e.target.value }))}
                    >
                      <option>Full-time</option>
                      <option>Part-time</option>
                      <option>Contract</option>
                      <option>Internship</option>
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="ln-info-label">Program Required</label>
                  <select
                    className="form-select"
                    value={editJobForm.programId || ''}
                    onChange={e => {
                      const selected = programOptions.find(program => String(program.id) === e.target.value);
                      const normalizedNcLevel = normalizeNcLevelValue(selected?.ncLevel || selected?.name || '');
                      setEditJobForm(prev => ({
                        ...prev,
                        programId: selected?.id || '',
                        ncLevel: ncLevelOptions.includes(normalizedNcLevel) ? normalizedNcLevel : prev.ncLevel,
                        requiredCompetencies: selected?.competencies || [],
                      }));
                    }}
                  >
                    {programOptions.length === 0 && <option value="">No programs available</option>}
                    {programOptions.map(program => (
                      <option key={program.id} value={program.id}>{program.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="ln-info-label">NC Level Required *</label>
                  <input
                    className="form-input"
                    style={{ background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'not-allowed' }}
                    value={editJobForm.ncLevel || 'N/A'}
                    readOnly
                    placeholder="Select a program first"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="ln-info-label">Description</label>
                  <textarea
                    className="form-input"
                    rows={4}
                    maxLength={1000}
                    value={editJobForm.description}
                    onChange={e => setEditJobForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="ln-info-label">Location (City/Municipality) *</label>
                  <LocationPicker 
                    value={editJobForm.location}
                    onChange={val => setEditJobForm(prev => ({ ...prev, location: val }))}
                    required
                  />
                  <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Standardized for filtering.</p>
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: 8 }}>
                  <label className="ln-info-label">Specific Address (Building/Street)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-input"
                      style={{ paddingLeft: 38 }}
                      value={editJobForm.detailedAddress || ''}
                      onChange={e => setEditJobForm(prev => ({ ...prev, detailedAddress: e.target.value.slice(0, 100) }))}
                      maxLength={100}
                      placeholder="e.g. 456 Ayala Ave, Makati"
                    />
                    <MapPin size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <p style={{ fontSize: 11, color: '#64748b' }}>Limit to 100 characters.</p>
                    <p style={{ fontSize: 11, color: (editJobForm.detailedAddress?.length || 0) >= 100 ? '#ef4444' : '#94a3b8' }}>
                      {editJobForm.detailedAddress?.length || 0}/100
                    </p>
                  </div>
                </div>

                <div className="form-group">
                  <label className="ln-info-label">Currency</label>
                  <select
                    className="form-select"
                    value={editJobForm.salaryCurrency}
                    onChange={e => setEditJobForm(prev => ({ ...prev, salaryCurrency: e.target.value }))}
                  >
                    {SALARY_CURRENCY_OPTIONS.map(option => (
                      <option key={option.code} value={option.code}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="ln-info-label">Salary Min (Optional)</label>
                  <input
                    className="form-input"
                    value={editJobForm.salaryMin}
                    onChange={handleEditSalaryMinInput}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={12}
                    placeholder="e.g. 25000"
                  />
                </div>

                <div className="form-group">
                  <label className="ln-info-label">Salary Max (Optional)</label>
                  <input
                    className="form-input"
                    value={editJobForm.salaryMax}
                    onChange={handleEditSalaryMaxInput}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={12}
                    placeholder="e.g. 30000"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="ln-info-label">Required Competencies</label>
                  {editProgramCompetencies.length === 0 ? (
                    <div style={{ fontSize: 12, color: '#64748b', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc' }}>
                      No competencies available for the selected program.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {editProgramCompetencies.slice(0, showAllEditComps ? editProgramCompetencies.length : 3).map(competency => (
                        <label key={competency} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 10px', borderRadius: 10, border: `1.5px solid ${editJobForm.requiredCompetencies.includes(competency) ? '#3b82f6' : '#e8e8e8'}`, background: editJobForm.requiredCompetencies.includes(competency) ? '#dbeafe' : '#f8fafc', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={editJobForm.requiredCompetencies.includes(competency)}
                            onChange={() => toggleEditJobCompetency(competency)}
                            style={{ marginTop: 2 }}
                          />
                          <span style={{ fontSize: 13.5, color: '#475569' }}>{competency}</span>
                        </label>
                      ))}
                      {editProgramCompetencies.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setShowAllEditComps(!showAllEditComps)}
                          style={{
                            background: 'none', border: 'none', color: '#0a66c2', fontWeight: 600, fontSize: 13,
                            cursor: 'pointer', textAlign: 'left', padding: '4px 0', display: 'inline-block', width: 'fit-content'
                          }}
                        >
                          {showAllEditComps ? 'See Less' : `+ ${editProgramCompetencies.length - 3} more`}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="ln-info-label">Attachment (Image or Document)</label>
                  <input type="file" className="form-input" accept="image/*,.pdf,.doc,.docx" onChange={handleEditJobAttachmentChange} />
                  {editJobForm.attachmentName && (
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        <FileText size={14} color="#64748b" />
                        <span style={{ fontSize: 12, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{editJobForm.attachmentName}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {editJobForm.attachmentUrl && (
                          <a href={editJobForm.attachmentUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none' }}>
                            Preview
                          </a>
                        )}
                        <button type="button" className="ln-feed-action-btn" style={{ padding: '2px 6px', minHeight: 'auto' }} onClick={removeEditJobAttachment}>
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18, paddingTop: 14, borderTop: '1px solid #e5e7eb' }}>
                <button type="button" className="ln-btn ln-btn-outline" onClick={closeEditJobModal} disabled={editJobSaving}>Cancel</button>
                <button type="submit" className="ln-btn ln-btn-primary" disabled={editJobSaving}>
                  <Send size={14} /> {editJobSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPostModal && (
        <div className="ln-modal-bg" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="ln-modal-content" style={{ background: '#fff', width: '100%', maxWidth: 540, borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', margin: '0 20px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 18, color: '#1e293b', fontWeight: 700 }}>Create Post</h3>
              <button onClick={() => setShowPostModal(false)} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}><X size={20} /></button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', flexShrink: 0, fontWeight: 700, fontSize: 16 }}>
                  {partner?.company_name?.charAt(0) || partner?.profileName?.charAt(0) || 'P'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{partner?.company_name || partner?.profileName || 'Industry Partner'}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Post to Community Feed</div>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <input value={postTitle} onChange={e => setPostTitle(e.target.value)} placeholder="Title (e.g. General Update or Announcement)" style={{ width: '100%', padding: '10px 0', border: 'none', borderBottom: '1px solid #e2e8f0', fontSize: 16, fontWeight: 600, color: '#1e293b', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <textarea value={postContent} onChange={e => setPostContent(e.target.value)} placeholder="What do you want to announce to the community?" rows={4} style={{ width: '100%', padding: '10px 0', border: 'none', fontSize: 15, color: '#1e293b', outline: 'none', resize: 'vertical', minHeight: 80, boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Location (City/Municipality)</div>
                <LocationPicker 
                  value={postLocation}
                  onChange={setPostLocation}
                  placeholder="Tag a location (Optional)"
                />
              </div>

              {postLocation && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Specific Address</div>
                  <div style={{ position: 'relative' }}>
                    <input 
                      className="form-input" 
                      style={{ paddingLeft: 38, fontSize: 13, borderRadius: 8 }} 
                      value={postDetailedAddress} 
                      onChange={e => setPostDetailedAddress(e.target.value.slice(0, 100))} 
                      placeholder="Street, Building, etc." 
                      maxLength={100} 
                    />
                    <MapPin size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  </div>
                </div>
              )}
              {(true) && (
                <div style={{ marginBottom: 16, background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={postExpiryEnabled} onChange={e => setPostExpiryEnabled(e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                    Set Event Date / Scheduled Day
                  </label>
                  {postExpiryEnabled && (
                    <input type="date" value={postExpiryDate} onChange={e => setPostExpiryDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, color: '#1e293b', outline: 'none', boxSizing: 'border-box' }} />
                  )}
                </div>
              )}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 12 }}>Add to your post</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <input type="file" accept="image/*" onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                        setSelectedFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => setFilePreview(reader.result);
                        reader.readAsDataURL(file);
                    }
                  }} style={{ display: 'none' }} ref={fileInputRef} id="feed-post-image-upload" />
                  <button type="button" onClick={() => document.getElementById('feed-post-image-upload').click()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#0ea5e9', fontWeight: 600, fontSize: 13 }}>
                    <Camera size={18} /> {selectedFile ? 'Change Image' : 'Photo'}
                  </button>
                </div>
                {filePreview && (
                   <div style={{ position: 'relative', marginTop: 12 }}>
                     <button type="button" onClick={() => { setFilePreview(null); setSelectedFile(null); if(fileInputRef.current) fileInputRef.current.value = ''; }} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}><X size={16} /></button>
                     <img src={filePreview} alt="Preview" style={{ width: '100%', borderRadius: 8, maxHeight: 300, objectFit: 'contain', background: '#000' }} />
                   </div>
                )}
              </div>
            </div>
            <div style={{ padding: '16px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setShowPostModal(false)} style={{ padding: '10px 20px', border: 'none', background: 'none', fontWeight: 600, cursor: 'pointer', color: '#475569', fontSize: 14 }}>Cancel</button>
              <button onClick={handleCreatePost} disabled={isPosting || (!postContent.trim() && !postTitle.trim() && !filePreview)} style={{ padding: '10px 24px', background: '#0a66c2', color: '#fff', border: 'none', borderRadius: 20, fontWeight: 600, cursor: isPosting || (!postContent.trim() && !postTitle.trim() && !filePreview) ? 'not-allowed' : 'pointer', fontSize: 14, opacity: isPosting || (!postContent.trim() && !postTitle.trim() && !filePreview) ? 0.6 : 1 }}>
                {isPosting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}
 </>
  );
};

// --- PAGE: VERIFICATION -------------------------------------------
const VerificationPage = ({ setActivePage }) => {
  const { currentUser, submitPartnerDocuments, withdrawPartnerSubmission } = useApp();
  const { data: partners = [] } = usePartners();
  const livePartner = getLivePartner(currentUser, partners);
  const status = livePartner?.verificationStatus || 'Pending';
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [_loading, setLoading] = useState(true);
  const [docLabel, setDocLabel] = useState('');
  const fileInputRef = useRef(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchDocs = async () => {
    try {
      const res = await fetch(`/api/partner-verification/${livePartner.id}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error('Failed to fetch verification docs:', err);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (livePartner?.id) fetchDocs(); }, [livePartner?.id]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF, JPG, and PNG files are allowed.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.success('File size must be under 3MB.');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1];
        const res = await fetch('/api/partner-verification/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            partnerId: livePartner.id,
            documentType: 'custom',
            label: docLabel.trim(),
            fileName: file.name,
            fileType: file.type,
            fileData: base64,
          }),
        });
        if (res.ok) {
          await fetchDocs();
          setDocLabel('');
        } else {
          const err = await res.json();
          toast.error(err.error || 'Upload failed.');
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload document.');
      setUploading(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (docId) => {
    try {
      const res = await fetch(`/api/partner-verification/${docId}`, { method: 'DELETE' });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== docId));
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
    setConfirmDeleteId(null);
  };

  const handleSubmitForReview = () => {
    if (documents.length === 0) {
      toast.error('Please upload at least one document before submitting.');
      return;
    }
    submitPartnerDocuments(livePartner.id);
  };

  const handleWithdraw = () => {
    confirmAction({ message: 'Are you sure you want to withdraw your submission? You can edit your documents and resubmit later.', type: 'warning', onConfirm: () => {
      withdrawPartnerSubmission(livePartner.id);
    } })
  };

  const hasUploaded = documents.length > 0;
  const isSubmitted = status === 'Under Review' || status === 'Verified';

  return (
    <div className="ln-page-content">
      <div className="ln-page-header">
        <div>
          <h1 className="ln-page-title">Account Verification</h1>
          <p className="ln-page-subtitle">Upload required company documents to verify your account</p>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Premium Verified Success State */}
      {status === 'Verified' && (
        <div className="ln-card" style={{ marginBottom: 24, padding: '40px 20px', textAlign: 'center', background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)', border: '1px solid #bbf7d0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{
            width: 84, height: 84, borderRadius: '50%', background: '#f0fdf4',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
            border: '8px solid #ffffff', boxShadow: '0 0 0 1px #bbf7d0'
          }}>
            <ShieldCheck size={42} color="#16a34a" />
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#166534', marginBottom: 12 }}>Your Company is Verified!</h2>
          <p style={{ fontSize: 15, color: '#15803d', maxWidth: 540, margin: '0 auto 32px', lineHeight: 1.6 }}>
            Congratulations! Your account has been reviewed and approved. You can now post job opportunities, access the interview calendar, and connect with top trainees.
          </p>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16, maxWidth: 650, margin: '0 auto'
          }}>
            <button className="ln-btn ln-btn-primary" onClick={() => setActivePage('post-job')} style={{ padding: '14px 20px', justifyContent: 'center', fontSize: 15 }}>
              <Plus size={18} /> Post an Opportunity
            </button>
            <button className="ln-btn ln-btn-outline" onClick={() => setActivePage('calendar')} style={{ padding: '14px 20px', justifyContent: 'center', fontSize: 15, background: 'white' }}>
              <Calendar size={18} /> Setup Interview Calendar
            </button>
            <button className="ln-btn ln-btn-outline" onClick={() => setActivePage('applicants')} style={{ padding: '14px 20px', justifyContent: 'center', fontSize: 15, background: 'white' }}>
              <Users size={18} /> Recruitment Center
            </button>
          </div>
        </div>
      )}

      {/* Status Card (Only for non-verified or secondary info) */}
      {status !== 'Verified' && (
        <div className="ln-card" style={{ marginBottom: 16 }}>
          <div className="ln-section-header"><h3>Verification Status</h3></div>
          <div style={{ padding: '0 16px 16px' }}>
            <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', lineHeight: 1.6 }}>
              {status === 'Under Review'
                ? 'Your documents are being reviewed by our administrators. Please wait for approval.'
                : status === 'Rejected'
                  ? 'Your verification was rejected. You may re-upload documents and submit again.'
                  : 'Upload your company verification documents below to begin the verification process.'}
            </p>
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="ln-card" style={{ marginBottom: 16, borderLeft: '4px solid #0ea5e9' }}>
        <div style={{ padding: 16, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <ShieldCheck size={20} color="#0ea5e9" style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#0c4a6e', marginBottom: 4 }}>Document Privacy</div>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: 0 }}>
              Your uploaded documents will only be visible to the <strong>school principal/administrator</strong> and the <strong>system administrator</strong> of this platform. No other users, trainees, or partners will have access to your verification documents.
            </p>
          </div>
        </div>
      </div>

      {/* Verification Steps */}
      <div className="ln-card" style={{ marginBottom: 16 }}>
        <div className="ln-section-header"><h3>Verification Steps</h3></div>
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { step: 1, label: 'Register your company account', done: true },
            { step: 2, label: 'Upload your verification documents', done: hasUploaded || isSubmitted },
            { step: 3, label: 'Submit for admin review', done: isSubmitted },
          ].map(s => (
            <div key={s.step} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
              background: s.done ? '#f0fdf4' : '#f8fafc',
              borderRadius: 10, border: `1px solid ${s.done ? '#bbf7d0' : '#e8e8e8'}`
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: s.done ? '#16a34a' : '#e2e8f0',
                color: s.done ? 'white' : '#94a3b8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, flexShrink: 0
              }}>
                {s.done ? <CheckCircle size={14} /> : s.step}
              </div>
              <span style={{ fontSize: 14, color: s.done ? '#166534' : '#475569', fontWeight: s.done ? 600 : 400 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upload/Verified Documents Section */}
      <div className="ln-card" style={{ marginBottom: 16 }}>
        <div className="ln-section-header"><h3>{status === 'Verified' ? 'Verified Documents' : 'Upload Verification Documents'}</h3></div>
        <div style={{ padding: '0 16px 16px' }}>

          {/* Uploaded docs list */}
          {documents.length > 0 && (
            <div style={{ marginBottom: status === 'Verified' ? 0 : 20 }}>
              {documents.map(doc => (
                <div key={doc.id} className="ln-doc-info" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 8 }}>
                  <div className="ln-doc-icon-wrap" style={{ width: 36, height: 36, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', border: '1px solid #e2e8f0' }}><FileText size={18} /></div>
                  <div className="ln-doc-text" style={{ flex: 1, minWidth: 0 }}>
                    <div className="ln-doc-label" style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{doc.label}</div>
                    <div className="ln-doc-meta" style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {doc.file_name}
                      {doc.file_type && doc.file_type.includes('(') && (
                        <span style={{ color: '#16a34a', fontWeight: 600 }}>
                          ({doc.file_type.split('(').pop().replace(')', '')})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ln-doc-actions" style={{ display: 'flex', gap: 8 }}>
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" style={{ padding: 6, color: '#0ea5e9', background: 'none', border: 'none', cursor: 'pointer' }} title="View"><Eye size={16} /></a>
                    {!isSubmitted && (
                      <button onClick={() => setConfirmDeleteId(doc.id)} style={{ padding: 6, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }} title="Delete"><Trash2 size={16} /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Document Row - only when not yet submitted */}
          {!isSubmitted && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
                Type a label for the document first, then click <strong>Choose File</strong> to upload.
              </p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  className="form-input"
                  style={{ flex: 1, minWidth: 160 }}
                  placeholder="Document label (e.g. Business Permit)"
                  value={docLabel}
                  onChange={e => setDocLabel(e.target.value)}
                  disabled={uploading}
                />
                <button
                  className="ln-btn ln-btn-outline"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', whiteSpace: 'nowrap', opacity: docLabel.trim() ? 1 : 0.45, cursor: docLabel.trim() ? 'pointer' : 'not-allowed' }}
                  disabled={!docLabel.trim() || uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? <Loader size={15} className="spin" /> : <Upload size={15} />}
                  {uploading ? 'Uploading...' : 'Choose File'}
                </button>
              </div>
              {!docLabel.trim() && (
                <p style={{ fontSize: 11, color: '#f59e0b', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertTriangle size={12} /> Enter a label before uploading a file.
                </p>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />

          {/* Submit / Edit Buttons */}
          {status === 'Under Review' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '8px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#eff6ff', borderRadius: 10, border: '1px solid #bfdbfe' }}>
                <FileCheck size={20} color="#2563eb" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: '#1e40af', margin: 0 }}>Your documents are under review by the administrators.</p>
              </div>
              <button
                className="ln-btn"
                style={{ width: '100%', padding: '10px 20px', fontSize: 13, color: '#dc2626', border: '1px solid #fecaca', background: '#fef2f2', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                onClick={handleWithdraw}
              >
                <XCircle size={15} /> Edit &amp; Resubmit (Undo Submission)
              </button>
              <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', margin: 0 }}>This will let you remove or re-upload documents before submitting again.</p>
            </div>
          ) : (
            <button
              className="ln-btn ln-btn-primary"
              style={{ width: '100%', padding: '10px 20px', fontSize: 14 }}
              disabled={documents.length === 0}
              onClick={handleSubmitForReview}
            >
              <Send size={16} /> Submit for Verification
            </button>
          )}
        </div>
      </div>

      {/* Benefits of Verified Account */}
      <div className="ln-card" style={{ marginBottom: 16 }}>
        <div className="ln-section-header"><h3>Benefits of a Verified Account</h3></div>
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { icon: <Briefcase size={18} color="#0ea5e9" />, title: 'Post Opportunities', desc: 'Publish job listings and OJT postings visible to all qualified trainees.' },
            { icon: <CheckCircle size={18} color="#16a34a" />, title: 'Verified Badge', desc: 'A verified badge appears next to your company name, building trust with trainees.' },
            { icon: <Users size={18} color="#8b5cf6" />, title: 'Access Trainee Applications', desc: 'View and manage applications from trainees who apply to your postings.' },
            { icon: <ShieldCheck size={18} color="#f59e0b" />, title: 'Trusted Partner Status', desc: 'Your company is recognized as a trusted industry partner by the institution.' },
            { icon: <TrendingUp size={18} color="#ec4899" />, title: 'Priority Visibility', desc: 'Verified partners appear more prominently to trainees browsing opportunities.' },
          ].map((b, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px',
              background: status === 'Verified' ? '#f0fdf4' : '#f8fafc',
              borderRadius: 10, border: `1px solid ${status === 'Verified' ? '#bbf7d0' : '#e8e8e8'}`
            }}>
              <div style={{ marginTop: 2, flexShrink: 0 }}>{b.icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 2 }}>{b.title}</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirm Delete Modal */}
      {confirmDeleteId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={() => setConfirmDeleteId(null)}>
          <div style={{ background: 'white', borderRadius: 12, padding: 24, maxWidth: 400, width: '90%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Remove Document?</h3>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>This document will be permanently deleted. You can upload a new one afterwards.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="ln-btn" style={{ flex: 1, padding: '8px 16px' }} onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button className="ln-btn" style={{ flex: 1, padding: '8px 16px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }} onClick={() => handleDelete(confirmDeleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- PAGE: POST OPPORTUNITIES -------------------------------------
const ncLevelOptions = ['NC I', 'NC II', 'NC III', 'NC IV'];
const PostJob = ({ setActivePage, opportunityType = 'Job' }) => {
  const location = useLocation();
  const { addJobPosting, updatePartnerJobPosting, currentUser, uploadOptimizedImage, formatFileSize } = useApp();
  const { data: partners = [] } = usePartners();
  const { data: jobPostings = [] } = useJobPostings();
  const { data: programsData } = usePrograms();
  const programs = programsData?.data || [];
  const livePartner = getLivePartner(currentUser, partners);
  const programOptions = React.useMemo(() => Array.isArray(programs) ? programs : [], [programs]);
  const firstProgram = programOptions[0] || null;
  const editingJobId = location?.state?.editJobId || null;
  const editingJob = jobPostings.find(job =>
    String(job.id) === String(editingJobId) && String(job.partnerId) === String(currentUser?.id)
  ) || null;
  const isEditMode = Boolean(editingJob);
  const [posting, setPosting] = useState(false);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'list'
  const [showAllComps, setShowAllComps] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [skillInput, setSkillInput] = useState('');
  const [form, setForm] = useState({
    title: '', opportunityType, programId: firstProgram?.id || '', ncLevel: normalizeNcLevelValue(firstProgram?.ncLevel || firstProgram?.name || ''), description: '',
    employmentType: opportunityType === 'OJT' ? 'OJT' : 'Full-time', 
    location: livePartner?.city ? normalizeLocation(`${livePartner.city}${livePartner.province ? `, ${livePartner.province}` : ''}`) : '', 
    detailedAddress: livePartner?.detailed_address || '', 
    salaryRange: '', salaryCurrency: DEFAULT_SALARY_CURRENCY, salaryMin: '', salaryMax: '',
    hideSalary: false,
    requiredCompetencies: [],
    requiredSkills: '', requirements: '', companyName: livePartner?.companyName || '',
    attachmentName: '', attachmentType: '', attachmentUrl: '',
  });

  useEffect(() => {
    if (!form.ncLevel && programOptions.length > 0) {
      setForm(prev => ({
        ...prev,
        programId: programOptions[0].id,
        ncLevel: normalizeNcLevelValue(programOptions[0].ncLevel || programOptions[0].name || ''),
        requiredCompetencies: [],
      }));
    }
  }, [form.ncLevel, programOptions]);

  useEffect(() => {
    if (!isEditMode || !editingJob) return;

    const parsedSalary = parseSalaryRangeInputValues(
      editingJob.salaryRange,
      editingJob.salaryCurrency || DEFAULT_SALARY_CURRENCY,
    );

    // Only set ncLevel if it's a valid NC level
    const normalizedNcLevel = normalizeNcLevelValue(editingJob.ncLevel || '');
    const validNcLevel = ncLevelOptions.includes(normalizedNcLevel) ? normalizedNcLevel : '';

    setForm(prev => ({
      ...prev,
      title: editingJob.title || '',
      opportunityType: editingJob.opportunityType || opportunityType,
      programId: editingJob.programId || prev.programId || '',
      ncLevel: validNcLevel,
      description: editingJob.description || '',
      employmentType: (editingJob.opportunityType || opportunityType) === 'OJT'
        ? 'OJT'
        : (editingJob.employmentType || 'Full-time'),
      location: editingJob.location || '',
      salaryRange: editingJob.salaryRange || '',
      salaryCurrency: editingJob.salaryCurrency || parsedSalary.salaryCurrency,
      salaryMin: editingJob.salaryMin ? sanitizeNumericSalaryInput(editingJob.salaryMin) : parsedSalary.salaryMin,
      salaryMax: editingJob.salaryMax ? sanitizeNumericSalaryInput(editingJob.salaryMax) : parsedSalary.salaryMax,
      hideSalary: editingJob.salaryRange === 'To Be Discussed' || editingJob.salaryRange === 'Confidential',
      requiredCompetencies: Array.isArray(editingJob.requiredCompetencies) ? editingJob.requiredCompetencies : [],
      requiredSkills: Array.isArray(editingJob.requiredSkills) ? editingJob.requiredSkills.join(', ') : (editingJob.required_skills ? (Array.isArray(editingJob.required_skills) ? editingJob.required_skills.join(', ') : editingJob.required_skills) : ''),
      requirements: Array.isArray(editingJob.requirements) ? editingJob.requirements.join('\n') : (editingJob.requirements || ''),
      companyName: editingJob.companyName || livePartner?.companyName || '',
      attachmentName: editingJob.attachmentName || '',
      attachmentType: editingJob.attachmentType || '',
      attachmentUrl: editingJob.attachmentUrl || '',
    }));
    setAttachmentFile(null);
  }, [isEditMode, editingJob, opportunityType]);

  const selectedProgram = programOptions.find(program => program.id === form.programId)
    || programOptions.find(program => program.name === form.ncLevel)
    || null;

  const availableComps = selectedProgram?.competencies || [];
  const toggleComp = (comp) => {
    setForm(prev => ({
      ...prev,
      requiredCompetencies: prev.requiredCompetencies.includes(comp)
        ? prev.requiredCompetencies.filter(c => c !== comp)
        : [...prev.requiredCompetencies, comp]
    }));
  };

  const handleSalaryMinInput = (event) => {
    const digits = sanitizeNumericSalaryInput(event.target.value);
    setForm(prev => ({ ...prev, salaryMin: digits }));
  };

  const handleSalaryMaxInput = (event) => {
    const digits = sanitizeNumericSalaryInput(event.target.value);
    setForm(prev => ({ ...prev, salaryMax: digits }));
  };

  const handleAttachmentChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isDocument = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ].includes(file.type);

    if (!isImage && !isDocument) {
      toast.error('Only image files, PDF, DOC, and DOCX are allowed.');
      e.target.value = '';
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setAttachmentFile(file);
    setForm(prev => {
      if (prev.attachmentUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(prev.attachmentUrl);
      }
      return {
        ...prev,
        attachmentName: file.name,
        attachmentType: file.type || 'application/octet-stream',
        attachmentUrl: objectUrl,
      };
    });
  };

  const removeAttachment = () => {
    setAttachmentFile(null);
    setForm(prev => {
      if (prev.attachmentUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(prev.attachmentUrl);
      }
      return { ...prev, attachmentName: '', attachmentType: '', attachmentUrl: '' };
    });
  };

  useEffect(() => {
    return () => {
      if (form.attachmentUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(form.attachmentUrl);
      }
    };
  }, [form.attachmentUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.location) return toast.error('Title and standardized location are required.');
    if (!form.ncLevel) return toast.error('Please select a TESDA program.');

    const hasSalaryInput = !form.hideSalary && Boolean(form.salaryMin || form.salaryMax);
    if (hasSalaryInput && (!form.salaryMin || !form.salaryMax)) {
      return toast.error('Please provide both minimum and maximum salary.');
    }

    const salaryMinNumber = Number(form.salaryMin || 0);
    const salaryMaxNumber = Number(form.salaryMax || 0);
    if (hasSalaryInput && salaryMinNumber > salaryMaxNumber) {
      return toast.error('Minimum salary cannot be greater than maximum salary.');
    }

    const formattedSalaryRange = formatSalaryRangeValue(form.salaryMin, form.salaryMax, form.salaryCurrency);

    try {
      setPosting(true);

      let finalAttachmentUrl = '';
      let finalAttachmentName = '';
      let finalAttachmentType = '';

      if (attachmentFile && currentUser?.id) {
        const timestamp = Date.now();
        const safeName = attachmentFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `opportunity-attachments/${currentUser.id}/${timestamp}_${safeName}`;

        const res = await uploadOptimizedImage('registration-uploads', storagePath, attachmentFile);

        if (!res.success) {
          throw new Error(res.error || 'Failed to upload attachment.');
        }

        finalAttachmentUrl = res.url || '';
        finalAttachmentName = attachmentFile.name;
        finalAttachmentType = `${attachmentFile.type || ''} (${res.sizeLabel})`;
      }

      const payload = {
        ...form,
        salaryRange: form.hideSalary ? 'To Be Discussed' : formattedSalaryRange,
        salaryCurrency: form.salaryCurrency,
        salaryMin: form.hideSalary ? null : (form.salaryMin ? Number(form.salaryMin) : null),
        salaryMax: form.hideSalary ? null : (form.salaryMax ? Number(form.salaryMax) : null),
        attachmentName: finalAttachmentName || form.attachmentName || '',
        attachmentType: finalAttachmentType || form.attachmentType || '',
        attachmentUrl: finalAttachmentUrl || form.attachmentUrl || '',
        detailed_address: form.detailedAddress || null,
        requiredSkills: form.requiredSkills ? form.requiredSkills.split(',').map(s => s.trim()).filter(Boolean) : [],
        requirements: form.requirements ? form.requirements.split('\n').map(r => r.trim()).filter(Boolean) : [],
        companyName: form.companyName || livePartner?.companyName || '',
      };

      const result = isEditMode
        ? await updatePartnerJobPosting(editingJob.id, payload)
        : await addJobPosting(payload);

      if (!result?.success) {
        toast.error(result?.error || `Failed to ${isEditMode ? 'update' : 'post'} opportunity.`);
        return;
      }

      toast.success(isEditMode ? 'Opportunity updated successfully!' : 'Opportunity posted successfully!');
      setActivePage('dashboard');
    } catch (error) {
      toast.error(error?.message || `Failed to ${isEditMode ? 'update' : 'post'} opportunity.`);
    } finally {
      setPosting(false);
    }
  };

  const previewTitle = form.title?.trim() || (form.opportunityType === 'OJT' ? 'Web Dev OJT Trainee' : 'Junior IT Technician');
  const previewLocation = form.location?.trim() || 'Location not set';
  const previewCompany = livePartner?.companyName || 'Your Company';
  const previewIndustry = livePartner?.industry || livePartner?.businessType || '';
  const previewSalary = formatSalaryRangeValue(form.salaryMin, form.salaryMax, form.salaryCurrency);
  const previewDescriptionRaw = form.description?.trim() || 'Your opportunity description will appear here once you add details.';
  const previewDescription = previewDescriptionRaw.length > 150
    ? `${previewDescriptionRaw.substring(0, 150)}...`
    : previewDescriptionRaw;

  if (!isVerified(livePartner)) {
    return (
      <div className="ln-page-content">
        <div className="ln-page-header">
          <div>
            <h1 className="ln-page-title">Post Opportunities</h1>
            <p className="ln-page-subtitle">Create a new posting</p>
          </div>
        </div>
        <div className="ln-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <AlertTriangle size={48} color="#d97706" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'rgba(0,0,0,0.9)', marginBottom: 8 }}>Account Verification Required</h3>
          <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.55)', maxWidth: 500, margin: '0 auto 24px' }}>
            Your account is currently <strong>{livePartner?.verificationStatus || 'Pending Verification'}</strong>.
            You must be fully verified before posting opportunities.
          </p>
          <button className="ln-btn ln-btn-primary" onClick={() => setActivePage('verification')}>Go to Verification</button>
        </div>
      </div>
    );
  }

  // --- Tag-based skill helpers ---
  const skillTags = (form.requiredSkills || '').split(',').map(s => s.trim()).filter(Boolean);
  const addSkillTag = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const existing = skillTags.map(s => s.toLowerCase());
    if (existing.includes(trimmed.toLowerCase())) { setSkillInput(''); return; }
    const updated = [...skillTags, trimmed].join(', ');
    setForm(prev => ({ ...prev, requiredSkills: updated }));
    setSkillInput('');
  };
  const removeSkillTag = (index) => {
    const updated = skillTags.filter((_, i) => i !== index).join(', ');
    setForm(prev => ({ ...prev, requiredSkills: updated }));
  };
  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkillTag(skillInput.replace(/,/g, ''));
    }
    if (e.key === 'Backspace' && !skillInput && skillTags.length > 0) {
      removeSkillTag(skillTags.length - 1);
    }
  };

  // --- Section card style ---
  const sectionCard = { borderRadius: 14, border: '1px solid #e2e8f0', background: '#fff', marginBottom: 16, overflow: 'hidden' };
  const sectionHeader = (icon, title) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>{title}</h3>
    </div>
  );
  const fieldLabel = (text, required) => (
    <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: 'block', color: '#334155' }}>{text}{required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}</label>
  );
  const inputStyle = { fontSize: 14, borderRadius: 10, padding: '10px 14px', width: '100%', border: '1px solid #e2e8f0', background: '#fff', outline: 'none', transition: 'border-color 0.15s' };

  return (
    <div className="ln-page-content">
      <div className="ln-page-header">
        <div>
          <h1 className="ln-page-title">{isEditMode ? 'Edit Opportunity' : 'Post Opportunities'}</h1>
          <p className="ln-page-subtitle">{isEditMode ? 'Update your opportunity posting' : 'Create a new opportunity posting'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>

        {/* ═══ Section 1: Basic Information ═══ */}
        <div style={sectionCard}>
          {sectionHeader(<Briefcase size={16} color="#0284c7" />, 'Basic Information')}
          <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              {fieldLabel('Job Title', true)}
              <input className="form-input" style={inputStyle} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder={opportunityType === 'OJT' ? 'e.g. Web Dev OJT Trainee' : 'e.g. Junior IT Technician'} maxLength={100} required />
            </div>
            <div>
              {fieldLabel('Company Name', false)}
              <input className="form-input" style={{ ...inputStyle, background: '#f8fafc' }} value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} placeholder="Company Name" />
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, margin: '4px 0 0' }}>Auto-filled from your profile. You may edit if needed.</p>
            </div>
            <div>
              {fieldLabel('Employment Type', true)}
              <select className="form-select" style={inputStyle} value={form.employmentType} onChange={e => setForm({ ...form, employmentType: e.target.value })}>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Full-time or Part-time">Full-time or Part-time</option>
                <option value="Contract">Contract</option>
                <option value="OJT">OJT</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
          </div>
        </div>

        <div style={sectionCard}>
          {sectionHeader(<TrendingUp size={16} color="#16a34a" />, 'Salary')}
          <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input 
                type="checkbox" 
                id="hideSalary" 
                checked={form.hideSalary || false} 
                onChange={e => setForm({ ...form, hideSalary: e.target.checked })} 
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <label htmlFor="hideSalary" style={{ fontSize: 14, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                Hide salary in public posting (Show as To Be Discussed)
              </label>
            </div>

            {!form.hideSalary && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div>
                  {fieldLabel('Currency', false)}
                  <select className="form-select" style={inputStyle} value={form.salaryCurrency} onChange={e => setForm({ ...form, salaryCurrency: e.target.value })}>
                    {SALARY_CURRENCY_OPTIONS.map(option => (
                      <option key={option.code} value={option.code}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  {fieldLabel('Min Salary', false)}
                  <input className="form-input" style={inputStyle} value={form.salaryMin} onChange={handleSalaryMinInput} placeholder="e.g. 25,000" inputMode="numeric" pattern="[0-9]*" maxLength={12} />
                </div>
                <div>
                  {fieldLabel('Max Salary', false)}
                  <input className="form-input" style={inputStyle} value={form.salaryMax} onChange={handleSalaryMaxInput} placeholder="e.g. 35,000" inputMode="numeric" pattern="[0-9]*" maxLength={12} />
                </div>
                {(form.salaryMin || form.salaryMax) && (
                  <div style={{ gridColumn: 'span 3' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                      <span style={{ fontSize: 13, color: '#166534', fontWeight: 600 }}>Preview: {previewSalary || 'N/A'}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ═══ Section 3: Location ═══ */}
        <div style={sectionCard}>
          {sectionHeader(<MapPin size={16} color="#dc2626" />, 'Location')}
          <div style={{ padding: 20 }}>
          <div className="form-group">
            {fieldLabel('Location (City/Municipality)', true)}
            <LocationPicker 
              value={form.location} 
              onChange={val => setForm({ ...form, location: val })} 
              required 
            />
            <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Used for standardized filtering and search.</p>
          </div>

          <div className="form-group" style={{ marginTop: 16 }}>
            {fieldLabel('Specific Address', false)}
            <div style={{ position: 'relative' }}>
              <input 
                className="form-input" 
                style={{ ...inputStyle, paddingLeft: 38 }} 
                value={form.detailedAddress || ''} 
                onChange={e => setForm({ ...form, detailedAddress: e.target.value.slice(0, 100) })} 
                placeholder="e.g. 123 Rizal St., BGC" 
                maxLength={100} 
              />
              <MapPin size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <p style={{ fontSize: 11, color: '#64748b' }}>Specific location details for candidates.</p>
              <p style={{ fontSize: 11, color: (form.detailedAddress?.length || 0) >= 100 ? '#ef4444' : '#94a3b8' }}>
                {form.detailedAddress?.length || 0}/100
              </p>
            </div>
          </div>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, margin: '4px 0 0' }}>Enter a city, province, or full address.</p>
          </div>
        </div>

        {/* ═══ Section 4: Skills & Competencies ═══ */}
        <div style={sectionCard}>
          {sectionHeader(<Award size={16} color="#7c3aed" />, 'Skills & Competencies')}
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Tag-based skills input */}
            <div>
              {fieldLabel('Required Skills', false)}
              <div style={{
                display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6,
                border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px',
                minHeight: 44, background: '#fff', cursor: 'text',
              }}
                onClick={() => document.getElementById('skill-tag-input')?.focus()}
              >
                {skillTags.map((tag, i) => (
                  <span key={`${tag}-${i}`} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '4px 10px', background: '#e0f2fe', color: '#0369a1',
                    borderRadius: 20, fontSize: 12, fontWeight: 600,
                    border: '1px solid #bae6fd', lineHeight: 1.4,
                  }}>
                    {tag}
                    <button type="button" onClick={(e) => { e.stopPropagation(); removeSkillTag(i); }} style={{
                      background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                      color: '#0369a1', display: 'flex', alignItems: 'center',
                    }}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <input
                  id="skill-tag-input"
                  type="text"
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  onBlur={() => { if (skillInput.trim()) addSkillTag(skillInput); }}
                  placeholder={skillTags.length === 0 ? 'Type a skill and press Enter...' : ''}
                  style={{
                    border: 'none', outline: 'none', background: 'transparent',
                    fontSize: 13, flex: 1, minWidth: 120, padding: '2px 0',
                  }}
                />
              </div>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, margin: '4px 0 0' }}>Press <kbd style={{ padding: '1px 5px', background: '#f1f5f9', borderRadius: 4, fontSize: 10, border: '1px solid #e2e8f0' }}>Enter</kbd> or <kbd style={{ padding: '1px 5px', background: '#f1f5f9', borderRadius: 4, fontSize: 10, border: '1px solid #e2e8f0' }}>,</kbd> to add a skill.</p>
            </div>

            {/* TESDA Program & NC Level */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                {fieldLabel('Program Required', true)}
                <select
                  className="form-select" style={inputStyle}
                  value={form.programId || ''}
                  onChange={e => {
                    const selected = programOptions.find(program => String(program.id) === e.target.value);
                    setForm({
                      ...form,
                      programId: selected?.id || '',
                      ncLevel: normalizeNcLevelValue(selected?.ncLevel || selected?.name || ''),
                      requiredCompetencies: [],
                    });
                  }}
                >
                  {programOptions.length === 0 && <option value="">No programs available</option>}
                  {programOptions.map(program => (
                    <option key={program.id} value={program.id}>{program.name}</option>
                  ))}
                </select>
              </div>
              <div>
                {fieldLabel('NC Level Required', true)}
                <input
                  className="form-input"
                  style={{ ...inputStyle, background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'not-allowed' }}
                  value={form.ncLevel || 'N/A'}
                  readOnly
                  placeholder="Select a program first"
                />
              </div>
            </div>

            {/* Competency checkboxes */}
            {availableComps.length > 0 && (
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 10 }}>Required Competencies for <strong style={{ color: '#6d28d9' }}>{form.ncLevel || 'selected program'}</strong></p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {availableComps.slice(0, showAllComps ? availableComps.length : 3).map(comp => (
                    <label key={comp} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px',
                      background: form.requiredCompetencies.includes(comp) ? '#ede9fe' : '#f8fafc',
                      borderRadius: 10, cursor: 'pointer',
                      border: `1.5px solid ${form.requiredCompetencies.includes(comp) ? '#8b5cf6' : '#e8e8e8'}`,
                      transition: 'all 0.15s',
                    }}>
                      <input type="checkbox" checked={form.requiredCompetencies.includes(comp)} onChange={() => toggleComp(comp)} style={{ marginTop: 2 }} />
                      <span style={{ fontSize: 13.5, color: '#475569' }}>{comp}</span>
                    </label>
                  ))}
                  {availableComps.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setShowAllComps(!showAllComps)}
                      style={{
                        background: 'none', border: 'none', color: '#7c3aed', fontWeight: 600, fontSize: 13,
                        cursor: 'pointer', textAlign: 'left', padding: '4px 0', marginTop: '4px', display: 'inline-block', width: 'fit-content'
                      }}
                    >
                      {showAllComps ? 'See Less' : `+ ${availableComps.length - 3} more`}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══ Section 5: Job Details ═══ */}
        <div style={sectionCard}>
          {sectionHeader(<FileText size={16} color="#ea580c" />, 'Job Details')}
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              {fieldLabel('Job Description', false)}
              <textarea className="form-input" style={{ ...inputStyle, resize: 'vertical' }} rows={5} maxLength={2000} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe roles, responsibilities, and what the position entails..." />
            </div>
            <div>
              {fieldLabel('Requirements', false)}
              <textarea className="form-input" style={{ ...inputStyle, resize: 'vertical' }} rows={4} maxLength={1000} value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })} placeholder={"Enter one requirement per line, e.g.\nMust be a graduate of BS Computer Science\nAt least 1 year of experience"} />
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, margin: '4px 0 0' }}>One requirement per line.</p>
            </div>
            <div>
              {fieldLabel('Attachment', false)}
              <input type="file" className="form-input" style={inputStyle} accept="image/*,.pdf,.doc,.docx" onChange={handleAttachmentChange} />
              {form.attachmentName && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <FileText size={14} color="#64748b" />
                    <span style={{ fontSize: 12, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.attachmentName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {form.attachmentUrl && (
                      <a href={form.attachmentUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none' }}>Preview</a>
                    )}
                    <button type="button" className="ln-feed-action-btn" style={{ padding: '2px 6px', minHeight: 'auto' }} onClick={removeAttachment}>
                      <X size={12} />
                    </button>
                  </div>
                </div>
              )}
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, margin: '4px 0 0' }}>Supported: Images, PDF, DOC, DOCX.</p>
            </div>
          </div>
        </div>

        {/* ═══ Submit Button ═══ */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
          <button type="submit" disabled={posting} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg, #0369a1, #0284c7)', color: '#fff',
            border: 'none', padding: '12px 32px', fontSize: 14, fontWeight: 700,
            borderRadius: 12, cursor: posting ? 'not-allowed' : 'pointer',
            opacity: posting ? 0.7 : 1, boxShadow: '0 2px 8px rgba(3,105,161,0.18)',
            transition: 'all 0.2s',
          }}>
            <Send size={16} /> {posting ? (isEditMode ? 'Updating...' : 'Posting...') : (isEditMode ? 'Update Opportunity' : 'Post Opportunity')}
          </button>
        </div>

        {/* ═══ Live Post Preview ═══ */}
        <div className="ln-card" style={{ marginTop: 0, overflow: 'visible' }}>
          <div className="ln-section-header" style={{ marginBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h3 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(0,0,0,0.6)', margin: 0 }}>Live Post Preview</h3>
              <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', background: '#fff', height: '32px' }}>
                <button
                  type="button"
                  style={{ padding: '0 10px', border: 'none', background: viewMode === 'card' ? '#f1f5f9' : 'transparent', cursor: 'pointer', color: viewMode === 'card' ? '#0f172a' : '#64748b', display: 'flex', alignItems: 'center' }}
                  onClick={() => setViewMode('card')}
                  title="Card View"
                >
                  <LayoutDashboard size={14} />
                </button>
                <button
                  type="button"
                  style={{ padding: '0 10px', border: 'none', borderLeft: '1px solid #e2e8f0', background: viewMode === 'list' ? '#f1f5f9' : 'transparent', cursor: 'pointer', color: viewMode === 'list' ? '#0f172a' : '#64748b', display: 'flex', alignItems: 'center' }}
                  onClick={() => setViewMode('list')}
                  title="List View"
                >
                  <AlignLeft size={14} />
                </button>
              </div>
            </div>
            <span className="ln-badge ln-badge-blue" style={{ fontSize: 11 }}>How trainees will see it</span>
          </div>
          <div style={{ padding: 20 }}>
            {viewMode === 'list' ? (
              <CompactFeedItem
                item={{
                  id: 'preview',
                  feedType: 'job',
                  title: previewTitle,
                  companyName: previewCompany,
                  location: previewLocation,
                  detailed_address: form.detailedAddress,
                  opportunityType: form.opportunityType,
                  employmentType: form.employmentType,
                  ncLevel: form.ncLevel,
                  salaryRange: previewSalary,
                  description: previewDescription,
                  createdAt: new Date().toISOString(),
                  partnerId: currentUser?.id,
                }}
                isOwnPost={false} // To show trainee-facing buttons
                onInquire={() => {}}
                onSave={() => {}}
                onApply={() => {}}
                openProfile={() => {}}
                onViewDetail={() => {}}
              />
            ) : (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div className="coursera-card" style={{ 
                  borderLeft: `4px solid ${POST_THEME.job.color}`, 
                  width: '100%',
                  maxWidth: '360px',
                  height: '407px',
                  margin: 0,
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div className="coursera-card-image" style={{ 
                    backgroundColor: form.attachmentUrl && isImageAttachment(form.attachmentUrl, form.attachmentType) ? '#f1f5f9' : POST_THEME.job.bg,
                    backgroundImage: form.attachmentUrl && isImageAttachment(form.attachmentUrl, form.attachmentType) ? `url(${form.attachmentUrl})` : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    minHeight: 160, position: 'relative'
                  }}>
                    {!(form.attachmentUrl && isImageAttachment(form.attachmentUrl, form.attachmentType)) && <Building2 size={48} color="rgba(0,0,0,0.1)" />}
                  </div>
                  <div className="coursera-card-content">
                    <div className="coursera-card-provider">
                      <div className="coursera-provider-logo"><Building2 size={12} color="#0a66c2" /></div>
                      <span style={{ fontWeight: 500, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {previewCompany}
                        {livePartner?.verificationStatus === 'Verified' && <VerifiedBadge size={14} />}
                      </span>
                    </div>
                    <h3 className="coursera-card-title">{previewTitle}</h3>
                    <p className="coursera-card-skills">
                      <strong>Skills required:</strong> {skillTags.length > 0 ? skillTags.join(', ') : (form.ncLevel ? `${form.ncLevel}, Technical Skills, Professionalism` : 'Industry Skills, Professionalism, Teamwork')}
                    </p>
                    <div className="coursera-card-meta">
                      {form.ncLevel || 'Beginner'} • {form.opportunityType} • {form.employmentType || 'Flexible'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, color: '#64748b', fontSize: 12 }}>
                      <MapPin size={14} color="#7c3aed" />
                      <span style={{ fontWeight: 500 }}>{previewLocation}</span>
                      {form.detailedAddress && (
                        <span style={{ color: '#94a3b8' }}>• {form.detailedAddress}</span>
                      )}
                    </div>
                    <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '12px', paddingTop: '12px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button type="button" disabled style={{ padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: '1px solid #cbd5e1', backgroundColor: 'transparent', color: '#475569', cursor: 'default', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Mail size={12} /> Contact
                      </button>
                      <button type="button" disabled style={{ padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: '1px solid #cbd5e1', backgroundColor: 'transparent', color: '#475569', cursor: 'default', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Bookmark size={12} /> Save
                      </button>
                      <button type="button" disabled style={{ padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: 'none', backgroundColor: '#4f46e5', color: '#fff', cursor: 'default', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Send size={12} /> Apply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </form>
    </div>
  );
};

// --- PAGE: VIEW APPLICANTS ----------------------------------------
const ViewApplicants = ({ setActivePage }) => {
  const { 
    currentUser, updateApplicationStatus, 
    sendRecruitMessage, 
    getPartnerAvailability
  } = useApp();
  const saveInterviewMutation = useSaveInterviewBooking();
  const deleteApplicationMutation = useDeleteApplication();
  const navigate = useNavigate();
  const { data: partners = [] } = usePartners();
  const { data: jobPostings = [] } = useJobPostings();
  const { data: trainees = [] } = useTrainees();
  const livePartner = getLivePartner(currentUser, partners);

  // TanStack Query for applicants data
  const { data: rawApps = [] } = useApplications(currentUser?.id, 'partner', jobPostings);
  const { data: rawContacts = [] } = useContactRequests(currentUser?.id, 'partner');
  const { data: interviewBookings = [] } = useInterviewBookings(currentUser?.id, 'partner');

  const applicants = React.useMemo(() => {
    if (!livePartner) return [];
    
    const partnerJobs = jobPostings.filter(j => String(j.partnerId) === String(livePartner.id));
    
    const applicationRecords = partnerJobs.flatMap(job =>
      rawApps
        .filter(a => String(a.jobId) === String(job.id))
        .map(a => {
          const trainee = trainees.find(t => String(t.id) === String(a.traineeId));
          const booking = interviewBookings.find(b => String(b.application_id) === String(a.id) && b.status !== 'cancelled');

          return {
            ...a,
            rowKey: `application-${a.id}`,
            recordType: 'application',
            activityType: 'Job Application',
            directionLabel: 'Student applied',
            eventDate: a.appliedAt,
            trainee,
            job,
            outgoingMessage: a.recruitMessage || null,
            incomingMessage: a.applicationMessage || null,
            attachmentName: a.resumeFileName || null,
            attachmentUrl: a.resumeUrl || null,
            attachmentKind: a.resumeUrl ? 'resume' : null,
            matchRate: a.matchRate || 0,
            interviewDate: booking?.start_time || null,
            sortAt: new Date(a.appliedAt || 0).getTime(),
          };
        })
    );

    const contactRecords = rawContacts
      .filter(request => String(request.sender_id) === String(livePartner.id) || String(request.recipient_id) === String(livePartner.id))
      .map(request => {
        const isOutgoing = String(request.sender_id) === String(livePartner.id);
        const traineeId = isOutgoing ? request.recipient_id : request.sender_id;
        const trainee = trainees.find(t => String(t.id) === String(traineeId));
        const jobId = request.jobPostingId || request.job_posting_id;
        const job = jobPostings.find(j => String(j.id) === String(jobId));

        return {
          id: request.id,
          rowKey: `contact-${request.id}`,
          recordType: 'contact',
          sourceTable: request.sourceTable || 'contact_requests',
          activityType: isOutgoing ? 'Partner Outreach' : 'Student Contact',
          directionLabel: isOutgoing ? 'You contacted student' : 'Student contacted you',
          status: request.status ? (request.status.charAt(0).toUpperCase() + request.status.slice(1)) : (isOutgoing ? 'Sent' : 'Pending'),
          trainee,
          job,
          outgoingMessage: isOutgoing ? request.message : null,
          incomingMessage: isOutgoing ? null : request.message,
          attachmentName: request.attachment_name || null,
          attachmentUrl: request.attachment_url || null,
          attachmentKind: request.attachment_kind || null,
          matchRate: 0,
          sortAt: new Date(request.created_at || 0).getTime(),
        };
      });

    return [...applicationRecords, ...contactRecords].sort((a, b) => b.sortAt - a.sortAt);
  }, [livePartner, jobPostings, rawApps, rawContacts, trainees, interviewBookings]);
  const [search, setSearch] = useState('');
  const [activityFilter, setActivityFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, activityFilter]);

  const [viewApp, setViewApp] = useState(null);
  const [recruitApp, setRecruitApp] = useState(null);
  const [messageModal, setMessageModal] = useState(null);
  const [recruitMessage, setRecruitMessage] = useState('');
  const [recruitAttachment, setRecruitAttachment] = useState(null);
  const [sendingRecruit, setSendingRecruit] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [inviteApp, setInviteApp] = useState(null);
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const recruitFileInputRef = useRef(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  if (!isVerified(livePartner)) {
    return (
      <div className="ln-page-content">
        <div className="ln-page-header">
          <div>
            <h1 className="ln-page-title">Recruit</h1>
            <p className="ln-page-subtitle">Review trainee applications</p>
          </div>
        </div>
        <div className="ln-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <AlertTriangle size={48} color="#d97706" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'rgba(0,0,0,0.9)', marginBottom: 8 }}>Account Verification Required</h3>
          <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.55)', maxWidth: 500, margin: '0 auto 24px' }}>
            You need to verify your account before using Recruit.
          </p>
          <button className="ln-btn ln-btn-primary" onClick={() => setActivePage('verification')}>Go to Verification</button>
        </div>
      </div>
    );
  }
  const openProfile = (target) => {
    if (!target?.id || !target?.type) return;
    navigate(`/partner/profile-view/${target.type}/${target.id}`);
  };
  const getStatusPriority = (statusInput) => {
    const raw = String(statusInput || '').trim().toLowerCase();
    // Tier 1: Action Required
    if (raw === 'reschedule requested' || raw === 'interview requested') return 1;
    // Tier 2: New / Pending
    if (raw === 'pending' || raw === 'received' || raw === 'sent') return 2;
    // Tier 3: Active / Scheduled pipeline
    if (raw === 'interview scheduled' || raw === 'interview confirmed' || raw === 'interview requested') return 3;
    // Tier 4: Success Finalized
    if (raw === 'hired' || raw === 'accepted job' || raw === 'accepted') return 5;
    // Tier 5: Dead Finalized
    if (raw === 'rejected' || raw === 'declined' || raw === 'interview declined') return 6;
    return 7;
  };

  const filtered = [...applicants].filter(a => {
    const q = search.toLowerCase();
    const matchesSearch = [
      a.trainee?.name,
      a.job?.title,
      a.activityType,
      a.directionLabel,
      a.incomingMessage,
      a.outgoingMessage,
    ].some(value => String(value || '').toLowerCase().includes(q));

    const matchesFilter = activityFilter === 'All' || a.activityType === activityFilter;
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    const priA = getStatusPriority(a.status);
    const priB = getStatusPriority(b.status);
    if (priA !== priB) return priA - priB;
    return (b.sortAt || 0) - (a.sortAt || 0);
  });

  const openRecruitModal = (application) => {
    setRecruitApp(application);
    setRecruitMessage(application.recruitMessage || '');
    setRecruitAttachment(application.recruitDocumentName ? { name: application.recruitDocumentName } : null);
  };

  const handleSendRecruit = async () => {
    if (!recruitApp) return;
    setSendingRecruit(true);
    const result = await sendRecruitMessage(recruitApp.id, {
      recruitMessage,
      recruitDocumentName: recruitAttachment?.name || null,
      recruitDocumentUrl: null,
    });
    setSendingRecruit(false);

    if (!result.success) {
      toast.error(result.error || 'Failed to send recruit message.');
      return;
    }

    toast.success('Recruitment message sent successfully!');
    setRecruitApp(null);
  };

  return (
    <div className="ln-page-content">
      <div className="ln-page-header">
        <div>
          <h1 className="ln-page-title">Recruit</h1>
          <p className="ln-page-subtitle">Review trainee applications to your opportunities</p>
        </div>
        <span className="ln-badge ln-badge-blue">{applicants.length} total</span>
      </div>

      {/* Summary Pills */}
      <div className="ln-pills-row" style={{ marginBottom: 16 }}>
        {[
          { label: 'Total', count: applicants.length, color: '#0ea5e9' },
          { label: 'Applications', count: applicants.filter(a => a.recordType === 'application').length, color: '#d97706' },
          { label: 'Student Contact', count: applicants.filter(a => a.recordType === 'contact' && a.activityType === 'Student Contact').length, color: '#16a34a' },
          { label: 'Partner Outreach', count: applicants.filter(a => a.recordType === 'contact' && a.activityType === 'Partner Outreach').length, color: '#dc2626' },
        ].map(s => (
          <div key={s.label} className="ln-pill" style={{ borderLeft: `3px solid ${s.color}` }}>
            <span className="ln-pill-count" style={{ color: s.color }}>{s.count}</span>
            <span className="ln-pill-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="ln-card">
        <div className="ln-section-header" style={{ marginBottom: 16 }}>
          <h3>Applications and Contact Activity</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="ln-search-wrap" style={{ width: 220 }}>
              <Search size={16} className="ln-search-icon" />
              <input className="ln-search-input" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="ln-filter-select" value={activityFilter} onChange={e => setActivityFilter(e.target.value)}>
              {['All', 'Job Application', 'Student Contact', 'Partner Outreach'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="ln-table">
            <thead>
              <tr><th>Trainee</th><th>Match %</th><th>Opportunity</th><th>Date</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(a => (
                <tr key={a.rowKey || a.id}>
                  <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => openProfile({ id: a.trainee?.id, type: 'trainee' })}
                        style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: `${(a.matchRate || 50) > 80 ? '#16a34a' : (a.matchRate || 50) > 60 ? '#d97706' : '#7c3aed'}15`,
                          color: (a.matchRate || 50) > 80 ? '#16a34a' : (a.matchRate || 50) > 60 ? '#d97706' : '#7c3aed',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, flexShrink: 0, border: 'none', padding: 0, cursor: 'pointer'
                        }}
                      >
                        {a.trainee?.name?.charAt(0) || 'T'}
                      </button>
                      <button
                        type="button"
                        onClick={() => openProfile({ id: a.trainee?.id, type: 'trainee' })}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: a.trainee?.id ? 'pointer' : 'default', color: 'inherit', font: 'inherit' }}
                        disabled={!a.trainee?.id}
                      >
                        {a.trainee?.name || '—'}
                      </button>
                    </div>
                  </td>
                  <td>
                    <div style={{
                      fontWeight: 800,
                      color: (a.matchRate || 50) >= 90 ? '#16a34a' : (a.matchRate || 50) >= 70 ? '#d97706' : '#64748b',
                      fontSize: 14
                    }}>
                      {a.matchRate ? `${Math.round(a.matchRate)}%` : '—'}
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: 'rgba(0,0,0,0.55)' }}>{a.job?.title || 'Direct Contact'}</td>
                  <td style={{ fontSize: 12.5, color: 'rgba(0,0,0,0.5)' }}>{a.eventDate || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
                      <span className={`ln-badge ${a.status === 'Pending' ? 'ln-badge-yellow' : (a.status === 'Accepted' || a.status === 'Hired') ? 'ln-badge-green' : a.status === 'Rejected' ? 'ln-badge-red' : a.status === 'Interview Scheduled' ? 'ln-badge-purple' : ['reschedule requested', 'interview requested'].includes(String(a.status).toLowerCase()) ? 'ln-badge-yellow' : 'ln-badge-blue'}`}>{a.status}</span>
                      {String(a.status).toLowerCase() === 'interview scheduled' && (a.interviewDate || a.proposedInterviewDate || a.proposed_interview_date) && (
                        <div style={{ fontSize: 10, color: '#7c3aed', fontWeight: 700, marginTop: 2, whiteSpace: 'normal', lineHeight: 1.3 }}>
                          Set: {new Date(a.interviewDate || a.proposedInterviewDate || a.proposed_interview_date).toLocaleDateString()} @ {new Date(a.interviewDate || a.proposedInterviewDate || a.proposed_interview_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                      {String(a.status).toLowerCase() === 'interview requested' && (a.proposedInterviewDate || a.proposed_interview_date) && (
                        <div style={{ fontSize: 10, color: '#0369a1', fontWeight: 700, marginTop: 2, whiteSpace: 'normal', lineHeight: 1.3 }}>
                          Requested: {new Date(a.proposedInterviewDate || a.proposed_interview_date).toLocaleDateString()} @ {new Date(a.proposedInterviewDate || a.proposed_interview_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                      {(a.proposedInterviewDate || a.proposed_interview_date) && String(a.status).toLowerCase() === 'reschedule requested' && (
                        <div style={{ fontSize: 10, color: '#ea580c', fontWeight: 700, marginTop: 2, whiteSpace: 'normal', lineHeight: 1.3 }}>
                          Requested: {new Date(a.proposedInterviewDate || a.proposed_interview_date).toLocaleDateString()} @ {new Date(a.proposedInterviewDate || a.proposed_interview_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                      {['interview requested', 'reschedule requested'].includes(String(a.status).toLowerCase()) && (
                        <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          <button 
                            className="ln-btn ln-btn-primary" 
                            style={{ padding: '4px 8px', fontSize: 10, background: '#16a34a', height: 'auto', border: 'none' }}
                            onClick={async (e) => { 
                              e.stopPropagation(); 
                              const proposed = a.proposedInterviewDate || a.proposed_interview_date;
                              if (proposed) {
                                const start = new Date(proposed);
                                const end = new Date(start.getTime() + 60 * 60 * 1000);
                                await saveInterviewMutation.mutateAsync({
                                  application_id: a.id,
                                  trainee_id: a.traineeId || a.student_id || a.sender_id || a.trainee?.id,
                                  partner_id: a.job?.partnerId || a.partnerId || a.recipient_id || livePartner?.id,
                                  start_time: start.toISOString(),
                                  end_time: end.toISOString(),
                                  status: 'scheduled'
                                });
                              }
                              await updateApplicationStatus(a.id, 'interview scheduled', 'Partner accepted the requested interview schedule.', { proposedInterviewDate: proposed, sourceTable: a.sourceTable }); 
                              toast.success('Interview schedule accepted.');
                            }}
                          >
                            Accept
                          </button>
                          <button 
                            className="ln-btn ln-btn-outline" 
                            style={{ padding: '4px 8px', fontSize: 10, borderColor: '#ef4444', color: '#ef4444', height: 'auto' }}
                            onClick={async (e) => { 
                              e.stopPropagation(); 
                              await updateApplicationStatus(a.id, 'interview scheduled', 'Partner declined the requested interview schedule.', { sourceTable: a.sourceTable }); 
                              toast.success('Reschedule declined.');
                            }}
                          >
                            Decline
                          </button>
                          <button 
                            className="ln-btn ln-btn-outline" 
                            style={{ padding: '4px 8px', fontSize: 10, height: 'auto' }}
                            onClick={(e) => { e.stopPropagation(); setInviteApp(a); }}
                          >
                            New Schedule
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <div style={{ position: 'relative' }}>
                        <button
                          className="ln-btn-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (openMenuId === a.id) {
                              setOpenMenuId(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const spaceBelow = window.innerHeight - rect.bottom;
                              const spaceAbove = rect.top;
                              const showUpward = spaceBelow < 250 && spaceAbove > spaceBelow;

                              setMenuPos({
                                top: showUpward ? 'auto' : (rect.bottom + 4),
                                bottom: showUpward ? (window.innerHeight - rect.top + 4) : 'auto',
                                left: rect.right - 180 // Align right edge of menu to right edge of button
                              });
                              setOpenMenuId(a.id);
                            }
                          }}
                        >
                          <MoreVertical size={16} />
                        </button>

                        {openMenuId === a.id && createPortal(
                          <>
                            <div
                              style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div
                              className="ln-dropdown"
                              style={{
                                position: 'fixed',
                                top: menuPos.top,
                                bottom: menuPos.bottom,
                                left: menuPos.left,
                                zIndex: 9999,
                                minWidth: 180,
                                display: 'block',
                                margin: 0,
                                boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                              }}
                            >
                              {['Pending', 'Interview Requested', 'Interview Confirmed', 'Reschedule Requested', 'Interview Scheduled'].includes(a.status) && (
                                <>
                                  {['Pending', 'Reschedule Requested', 'Interview Scheduled', 'Interview Requested', 'Interview Confirmed'].includes(a.status) && (
                                    <button className="ln-dropdown-item" style={{ color: '#059669' }} onClick={() => { setOpenMenuId(null); setInviteApp(a); }}>
                                      <Calendar size={14} /> {a.status === 'Pending' ? 'Schedule Interview' : 'Reschedule Interview'}
                                    </button>
                                  )}


                                  
                                  <button className="ln-dropdown-item" style={{ color: '#16a34a' }} onClick={async () => { setOpenMenuId(null); const res = await updateApplicationStatus(a.id, 'Hired', 'Hired by partner.', { sourceTable: a.sourceTable }); if (res?.success) toast.success('Trainee hired successfully!'); }}>
                                    <CheckCircle size={14} /> Hire Trainee
                                  </button>
                                  <button className="ln-dropdown-item" style={{ color: '#dc2626' }} onClick={async () => { setOpenMenuId(null); const res = await updateApplicationStatus(a.id, 'Rejected', 'Not selected.', { sourceTable: a.sourceTable }); if (res?.success) toast.success('Trainee rejected.'); }}>
                                    <XCircle size={14} /> Reject Trainee
                                  </button>
                                  <div className="ln-dropdown-divider" />
                                </>
                              )}

                              <button className="ln-dropdown-item" onClick={() => { setOpenMenuId(null); openProfile({ id: a.trainee?.id, type: 'trainee' }); }}>
                                <Eye size={14} /> View Profile
                              </button>

                              {a.recordType === 'application' && (
                                <button className="ln-dropdown-item" onClick={() => { setOpenMenuId(null); setViewApp(a); }}>
                                  <Eye size={14} /> View Details
                                </button>
                              )}

                              {a.recordType === 'application' && (
                                <button className="ln-dropdown-item" onClick={() => { setOpenMenuId(null); openRecruitModal(a); }}>
                                  <Send size={14} /> {a.outgoingMessage ? 'Update Recruit' : 'Recruit'}
                                </button>
                              )}

                              {(a.incomingMessage || a.outgoingMessage) && (
                                <button className="ln-dropdown-item" onClick={() => { setOpenMenuId(null); setMessageModal(a); }}>
                                  <MessageSquare size={14} /> View Messages
                                </button>
                              )}

                              {a.attachmentUrl && (
                                <a href={a.attachmentUrl} target="_blank" rel="noreferrer" className="ln-dropdown-item" onClick={() => setOpenMenuId(null)} style={{ textDecoration: 'none', color: 'inherit' }}>
                                  <Download size={14} /> Download Resume
                                </a>
                              )}
                              <div style={{ borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />
                              <button className="ln-dropdown-item" style={{ color: '#dc2626' }} onClick={() => { setOpenMenuId(null); setDeleteConfirm(a); }}>
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          </>,
                          document.body
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'rgba(0,0,0,0.4)' }}>No recruit activity found.</td></tr>
              )}
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
              {messageModal.incomingMessage && (
                <div style={{ padding: 12, borderRadius: 10, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (messageModal.trainee?.id) {
                          setMessageModal(null);
                          openProfile({ id: messageModal.trainee.id, type: 'trainee' });
                        }
                      }}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: messageModal.trainee?.photo ? 'transparent' : '#dbeafe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        color: '#1e40af',
                        overflow: 'hidden',
                        flexShrink: 0,
                        border: 'none',
                        padding: 0,
                        cursor: messageModal.trainee?.id ? 'pointer' : 'default',
                      }}
                      disabled={!messageModal.trainee?.id}
                    >
                      {messageModal.trainee?.photo ? (
                        <img src={messageModal.trainee.photo} alt={messageModal.trainee?.name || 'Trainee'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        ((messageModal.trainee?.name || 'T').charAt(0) || 'T').toUpperCase()
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (messageModal.trainee?.id) {
                          setMessageModal(null);
                          openProfile({ id: messageModal.trainee.id, type: 'trainee' });
                        }
                      }}
                      style={{ background: 'none', border: 'none', padding: 0, fontWeight: 700, fontSize: 14, cursor: messageModal.trainee?.id ? 'pointer' : 'default', color: '#1e40af', textAlign: 'left' }}
                      disabled={!messageModal.trainee?.id}
                    >
                      {messageModal.trainee?.name || 'Trainee'}
                    </button>
                  </div>
                  <div style={{ fontSize: 13, color: '#1e3a8a', lineHeight: 1.5 }}>{messageModal.incomingMessage}</div>
                </div>
              )}

              {messageModal.outgoingMessage && (
                <div style={{ padding: 12, borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (livePartner?.id) {
                          setMessageModal(null);
                          openProfile({ id: livePartner.id, type: 'partner' });
                        }
                      }}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: livePartner?.company_logo_url ? 'transparent' : '#dcfce7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        color: '#166534',
                        overflow: 'hidden',
                        flexShrink: 0,
                        border: 'none',
                        padding: 0,
                        cursor: livePartner?.id ? 'pointer' : 'default',
                      }}
                      disabled={!livePartner?.id}
                    >
                      {livePartner?.company_logo_url ? (
                        <img src={livePartner.company_logo_url} alt={livePartner?.companyName || 'You'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        ((livePartner?.companyName || 'Y').charAt(0) || 'Y').toUpperCase()
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (livePartner?.id) {
                          setMessageModal(null);
                          openProfile({ id: livePartner.id, type: 'partner' });
                        }
                      }}
                      style={{ background: 'none', border: 'none', padding: 0, fontWeight: 700, fontSize: 14, cursor: livePartner?.id ? 'pointer' : 'default', color: '#166534', textAlign: 'left' }}
                      disabled={!livePartner?.id}
                    >
                      You
                    </button>
                  </div>
                  <div style={{ fontSize: 13, color: '#14532d', lineHeight: 1.5 }}>{messageModal.outgoingMessage}</div>
                </div>
              )}
            </div>

            <div className="ln-modal-footer">
              <button className="ln-btn ln-btn-outline" onClick={() => setMessageModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Applicant Detail Modal */}
      {viewApp && (
        <div className="modal-overlay" onClick={() => setViewApp(null)}>
          <div className="ln-modal" onClick={e => e.stopPropagation()}>
            <div className="ln-modal-header">
              <div>
                <h3 className="ln-modal-title">Applicant Details</h3>
                <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', marginTop: 4 }}>{viewApp.trainee?.email}</p>
              </div>
              <button className="ln-btn-icon" onClick={() => setViewApp(null)}><X size={18} /></button>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => { setViewApp(null); openProfile({ id: viewApp.trainee?.id, type: 'trainee' }); }}
                style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #ede9fe, #dbeafe)', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#7c3aed', border: 'none', padding: 0, cursor: viewApp.trainee?.id ? 'pointer' : 'default' }}
                disabled={!viewApp.trainee?.id}
              >
                {viewApp.trainee?.name?.charAt(0)}
              </button>
              <button
                type="button"
                onClick={() => { setViewApp(null); openProfile({ id: viewApp.trainee?.id, type: 'trainee' }); }}
                style={{ fontWeight: 800, fontSize: 17, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit' }}
              >
                {viewApp.trainee?.name}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <span className={`ln-badge ${viewApp.status === 'Pending' ? 'ln-badge-yellow' : (viewApp.status === 'Accepted' || viewApp.status === 'Hired') ? 'ln-badge-green' : viewApp.status === 'Interview Scheduled' ? 'ln-badge-purple' : 'ln-badge-red'}`}>{viewApp.status}</span>
              <span className="ln-badge ln-badge-blue">{viewApp.job?.opportunityType}</span>
              <span className="ln-badge ln-badge-blue">{viewApp.matchRate}% Match</span>
            </div>
            <div className="ln-info-grid" style={{ marginBottom: 14 }}>
              {[['Opportunity', viewApp.job?.title], ['Match Rate', `${viewApp.matchRate}%`], ['Applied', viewApp.appliedAt], ['Status', viewApp.status]].map(([k, v]) => (
                <div key={k} className="ln-info-item">
                  <label className="ln-info-label">{k}</label>
                  <div className="ln-info-value">{v}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Student Application Message</div>
              <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>{viewApp.applicationMessage || '—'}</div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Resume</div>
              {viewApp.resumeUrl ? (
                <a href={viewApp.resumeUrl} target="_blank" rel="noreferrer" className="ln-btn-sm ln-btn-outline"><Eye size={12} /> View Resume</a>
              ) : (
                <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>No resume attached.</div>
              )}
            </div>
            {viewApp.recruitMessage && (
              <div style={{ marginBottom: 14, padding: 10, borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: '#1e40af' }}>Latest Recruit Message</div>
                <div style={{ fontSize: 13, color: '#1e3a8a' }}>{viewApp.recruitMessage}</div>
                {viewApp.recruitDocumentName && <div style={{ marginTop: 6, fontSize: 12, color: '#1e40af' }}>Attachment: {viewApp.recruitDocumentName}</div>}
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Certifications</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {viewApp.trainee?.certifications?.map(c => <span key={c} className="ln-cert-tag"><Award size={10} /> {c}</span>)}
              </div>
            </div>
            {(viewApp.status === 'Pending' || viewApp.status === 'Interview Scheduled') && (
              <div className="ln-modal-footer">
                <button className="ln-btn" style={{ flex: 1, background: '#059669', color: 'white', border: 'none' }} onClick={() => { setInviteApp(viewApp); setViewApp(null); }}>
                  <Calendar size={15} /> Interview
                </button>
                <button className="ln-btn" style={{ flex: 1, background: '#16a34a', color: 'white', border: 'none' }} onClick={async () => { const res = await updateApplicationStatus(viewApp.id, 'Hired', 'Hired by partner.', { sourceTable: viewApp.sourceTable }); if (res?.success) toast.success('Trainee hired successfully!'); setViewApp(null); }}>
                  <CheckCircle size={15} /> Hire
                </button>
                <button className="ln-btn" style={{ flex: 1, background: '#dc2626', color: 'white', border: 'none' }} onClick={async () => { const res = await updateApplicationStatus(viewApp.id, 'Rejected', 'Not selected.', { sourceTable: viewApp.sourceTable }); if (res?.success) toast.success('Trainee rejected.'); setViewApp(null); }}>
                  <XCircle size={15} /> Reject
                </button>
              </div>
            )}
            <div style={{ marginTop: 10 }}>
              <button className="ln-btn ln-btn-primary" style={{ width: '100%', background: '#0a66c2', borderColor: '#0a66c2' }} onClick={() => openRecruitModal(viewApp)}>
                <Send size={15} /> {viewApp.recruitMessage ? 'Update Recruit Message' : 'Send Recruit Message'}
              </button>
            </div>
            <div style={{ marginTop: 8 }}>
              <button className="ln-btn ln-btn-outline" style={{ width: '100%' }} onClick={() => { setViewApp(null); openProfile({ id: viewApp.trainee?.id, type: 'trainee' }); }}>
                <Eye size={15} /> View Full Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {recruitApp && (
        <div className="modal-overlay" onClick={() => setRecruitApp(null)}>
          <div className="ln-modal" onClick={e => e.stopPropagation()}>
            <div className="ln-modal-header">
              <div>
                <h3 className="ln-modal-title">Recruit Form</h3>
                <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => { setRecruitApp(null); openProfile({ id: recruitApp.trainee?.id, type: 'trainee' }); }}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#0a66c2', font: 'inherit' }}
                  >
                    {recruitApp.trainee?.name}
                  </button>
                  {' '}— {recruitApp.job?.title}
                </p>
              </div>
              <button className="ln-btn-icon" onClick={() => setRecruitApp(null)}><X size={18} /></button>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Recruit Message</div>
              <textarea
                className="ln-search-input"
                placeholder="Type your message to the trainee..."
                value={recruitMessage}
                onChange={e => setRecruitMessage(e.target.value)}
                maxLength={1000}
                style={{ width: '100%', minHeight: 120, resize: 'none', borderRadius: 10, padding: 12 }}
              />
              <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>{recruitMessage.length}/1000</div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Attachment (Optional)</div>
              <input
                type="file"
                hidden
                ref={recruitFileInputRef}
                onChange={e => {
                  const file = e.target.files?.[0] || null;
                  setRecruitAttachment(file ? { name: file.name } : null);
                }}
              />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button type="button" className="ln-btn-sm ln-btn-outline" onClick={() => recruitFileInputRef.current?.click()}>
                  <Upload size={12} /> Choose File
                </button>
                <span style={{ fontSize: 12.5, color: 'rgba(0,0,0,0.55)' }}>{recruitAttachment?.name || 'No file selected'}</span>
              </div>
              <div style={{ marginTop: 6, fontSize: 11.5, color: '#94a3b8' }}>Attachment name is saved with the recruit message. File upload is optional.</div>
            </div>

            <div className="ln-modal-footer">
              <button className="ln-btn ln-btn-outline" onClick={() => setRecruitApp(null)}>Cancel</button>
              <button className="ln-btn ln-btn-primary" disabled={sendingRecruit || !recruitMessage.trim()} onClick={handleSendRecruit}>
                <Send size={15} /> {sendingRecruit ? 'Sending...' : 'Send Recruit Message'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Interview Modal */}
      {inviteApp && (
        <div className="modal-overlay" onClick={() => setInviteApp(null)}>
          <div className="ln-modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="ln-modal-header">
              <div>
                <h3 className="ln-modal-title">Schedule Interview</h3>
                <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)', marginTop: 2 }}>Invite {inviteApp.trainee?.name} for an interview</p>
              </div>
              <button className="ln-btn-icon" onClick={() => setInviteApp(null)}><X size={18} /></button>
            </div>

            <div style={{ padding: '0 0 16px' }}>
              <div style={{ padding: 16, background: '#f0f7ff', borderRadius: 12, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1e40af', fontSize: 16 }}>
                    {(inviteApp.trainee?.name || 'T').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{inviteApp.trainee?.name || 'Trainee'}</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>Applied for: {inviteApp.job?.title || 'Position'}</div>
                  </div>
                </div>
              </div>

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
                  style={{ width: '100%', justifyContent: 'center', gap: 8, height: 44, fontSize: 15, fontWeight: 600 }}
                  disabled={!proposedDate || !proposedTime}
                  onClick={() => { 
                    const fullDateTime = `${proposedDate}T${proposedTime}`;
                    updateApplicationStatus(inviteApp.id, 'interview requested', `Interview requested for ${proposedDate} at ${proposedTime}.`, { proposedInterviewDate: fullDateTime }); 
                    setInviteApp(null); 
                    setProposedDate('');
                    setProposedTime('');
                    toast.success('Interview request sent to trainee');
                  }}
                >
                  <Send size={16} /> Send Interview Request
                </button>
                <p style={{ fontSize: 12, color: '#64748b', textAlign: 'center', margin: 0, padding: '0 20px' }}>
                  The trainee will be notified and can choose to <b>Accept</b>, <b>Decline</b>, or <b>Request a Reschedule</b>.
                </p>
              </div>
            </div>

            <div className="ln-modal-footer">
              <button className="ln-btn ln-btn-outline" style={{ width: '100%' }} onClick={() => setInviteApp(null)}>Cancel</button>
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
                <h3 className="ln-modal-title" style={{ color: '#dc2626' }}>Delete Record</h3>
                <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)', marginTop: 2 }}>This action cannot be undone.</p>
              </div>
              <button className="ln-btn-icon" onClick={() => setDeleteConfirm(null)} disabled={deleting}><X size={18} /></button>
            </div>
            <div style={{ padding: 20 }}>
              <p style={{ fontSize: 14, color: '#334155', marginBottom: 8 }}>
                Are you sure you want to delete this application record?
              </p>
              <div style={{ padding: 12, background: '#fef2f2', borderRadius: 8, border: '1px solid #fee2e2', fontSize: 13, color: '#991b1b' }}>
                <strong>{deleteConfirm.trainee?.name || 'Trainee'}</strong> — {deleteConfirm.job?.title || 'Direct Contact'}
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
                    toast.success('Record deleted.');
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

// --- PAGE: COMPANY PROFILE ----------------------------------------
const INDUSTRY_OPTIONS = [
  'Agriculture & Forestry',
  'Architecture & Engineering',
  'Arts, Design & Entertainment',
  'Automotive',
  'Banking & Finance',
  'Business Process Outsourcing (BPO)',
  'Construction & Real Estate',
  'Education & Training',
  'Energy & Utilities',
  'Food & Beverage',
  'Government & Public Sector',
  'Healthcare & Medical',
  'Hospitality & Tourism',
  'Information Technology',
  'Legal & Compliance',
  'Logistics & Supply Chain',
  'Manufacturing',
  'Maritime',
  'Media & Communications',
  'Non-Profit & NGO',
  'Retail & E-Commerce',
  'Telecommunications',
  'Transportation',
  'Other',
];

const PREDEFINED_CULTURE_TAGS = [
  'Hands-on Training', 'Mentorship-Focused', 'Fast-Paced',
  'Team-Oriented', 'Independent Work', 'Output-Based'
];

const PREDEFINED_PERKS_TAGS = [
  'Allowance Provided', 'Free Meals / Staff Meal', 'Uniform Subsidized',
  'Flexible Hours', 'Remote / WFH Option', 'Shift-Based'
];

export const CompanyProfile = ({ viewedPartnerId = null, onBack = null }) => {
  const { currentUser, updatePartner, createPostInteraction, fetchPostInteractions, uploadOptimizedImage } = useApp();
  const { data: partners = [] } = usePartners();
  const { data: jobPostings = [] } = useJobPostings();
  const navigate = useNavigate();
  const isOwnProfile = !viewedPartnerId || String(viewedPartnerId) === String(currentUser?.id);
  const [viewedPartner, setViewedPartner] = useState(null);
  const [loadingViewedProfile, setLoadingViewedProfile] = useState(false);
  const partner = isOwnProfile
    ? currentUser
    : (viewedPartner || partners.find(p => String(p.id) === String(viewedPartnerId)));

  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [activeTab, setActiveTab] = useState('About'); // About | Saved
  const [form, setForm] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    address: '',
    detailed_address: '',
    region: '',
    province: '',
    city: '',
    barangay: '',
    website: '',
    industry: '',
    achievements: [],
    benefits: [],
    mission: '',
    vision: '',
    culture_tags: [],
    perks_tags: [],
    poc_name: '',
    poc_title: '',
    poc_photo_url: '',
    office_location_url: '',
    banner_url: '',
    company_logo_url: ''
  });
  const [companyInfoVisibility, setCompanyInfoVisibility] = useState(() => resolvePartnerVisibility(partner));

  const [newAchievement, setNewAchievement] = useState('');
  const [newBenefit, setNewBenefit] = useState('');

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({ open: false, message: '', onConfirm: null });
  const showConfirm = (message, onConfirm) => setConfirmDialog({ open: true, message, onConfirm });
  const closeConfirm = () => setConfirmDialog({ open: false, message: '', onConfirm: null });

  // URL real-time validation state
  const [urlValidation, setUrlValidation] = useState({ companyInfo: null, location: null });
  const checkWebsiteReachability = async (url, section) => {
    if (!url?.trim()) {
      setUrlValidation(prev => ({ ...prev, [section]: null }));
      return;
    }
    const pattern = new RegExp('^(https?:\\/\\/)?([\\w.-]+)(:[0-9]+)?(\\/[\\w .!@#$%^&*()_+-=\\[\\]{};:\'",.<>?~\\\\|]*)*$', 'i');
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

  const urlCheckTimeoutRef = useRef({ companyInfo: null, location: null });
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

  // Crop modal state
  const [cropModal, setCropModal] = useState({ open: false, image: null, aspect: 1, type: null });

  // Bulletin modal state (for Saved tab View button)
  const [bulletinModal, setBulletinModal] = useState(null);
  const [bulletinMessage, setBulletinMessage] = useState('');
  const [bulletinSubmitting, setBulletinSubmitting] = useState(false);
  const [bulletinToast, setBulletinToast] = useState('');
  const showBulletinToast = (msg) => { setBulletinToast(msg); setTimeout(() => setBulletinToast(''), 3000); };
  const openBulletinModal = (post, type) => { setBulletinModal({ post, type }); setBulletinMessage(''); };
  const handleBulletinInteraction = async () => {
    if (!bulletinModal) return;
    setBulletinSubmitting(true);
    const details = { message: bulletinMessage, submitted_at: new Date().toISOString() };
    const res = await createPostInteraction(bulletinModal.post.id, bulletinModal.type, details);
    setBulletinSubmitting(false);
    if (res.success) {
      setBulletinModal(null);
      showBulletinToast(bulletinModal.type === 'inquire' ? 'Inquiry sent!' : 'Submitted!');
      fetchPostInteractions();
    } else {
      toast.error(res.error || 'Failed to submit.');
    }
  };

  // Documents state
  const [documents, setDocuments] = useState([]);
  const [docLabel, setDocLabel] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const fileInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const pocPhotoInputRef = useRef(null);

  // Email validation
  const isEmailValid = (email) => !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    if (isOwnProfile || !viewedPartnerId) {
      setViewedPartner(null);
      setLoadingViewedProfile(false);
      return;
    }

    let isMounted = true;
    const fetchViewedPartner = async () => {
      setLoadingViewedProfile(true);
      try {
        const { data, error } = await supabase
          .from('industry_partners')
          .select('id, company_name, business_type, company_size, website, contact_person, contact_email, contact_phone, company_logo_url, region, province, city, barangay, detailed_address, verification_status, achievements, benefits, company_info_visibility, mission, vision, culture_tags, perks_tags, poc_name, poc_title, poc_photo_url, office_location_url, banner_url, regionCode, provinceCode, cityCode, barangayCode')
          .eq('id', viewedPartnerId)
          .single();

        if (error || !data) {
          const response = await fetch(`/api/public-profile/partner/${viewedPartnerId}`);
          if (!response.ok) throw error || new Error('Failed to load viewed partner profile');
          const payload = await response.json();
          if (isMounted) setViewedPartner(normalizePartnerProfile(payload?.profile || null));
        } else if (isMounted) {
          setViewedPartner(normalizePartnerProfile(data || null));
        }
      } catch (err) {
        console.error('Fetch viewed partner profile error:', err);
        if (isMounted) setViewedPartner(null);
      } finally {
        if (isMounted) setLoadingViewedProfile(false);
      }
    };

    fetchViewedPartner();
    return () => {
      isMounted = false;
    };
  }, [isOwnProfile, viewedPartnerId]);

  // Sync form when partner data arrives or when editing starts
  useEffect(() => {
    if (partner) {
      setForm({
        companyName: partner.companyName || '',
        contactPerson: partner.contactPerson || '',
        email: partner.email || '',
        address: partner.address || '',
        detailed_address: partner.detailed_address || '',
        region: partner.region || '',
        province: partner.province || '',
        city: partner.city || '',
        barangay: partner.barangay || '',
        regionCode: partner.regionCode || '',
        provinceCode: partner.provinceCode || '',
        cityCode: partner.cityCode || '',
        barangayCode: partner.barangayCode || '',
        website: partner.website || '',
        industry: partner.industry || '',
        achievements: partner.achievements || [],
        benefits: partner.benefits || [],
        mission: partner.mission || '',
        vision: partner.vision || '',
        culture_tags: Array.isArray(partner.culture_tags) ? partner.culture_tags : [],
        perks_tags: Array.isArray(partner.perks_tags) ? partner.perks_tags : [],
        poc_name: partner.poc_name || '',
        poc_title: partner.poc_title || '',
        poc_photo_url: partner.poc_photo_url || '',
        office_location_url: partner.office_location_url || '',
        banner_url: partner.banner_url || '',
        company_logo_url: partner.company_logo_url || partner.photo || ''
      });
      setCompanyInfoVisibility(resolvePartnerVisibility(partner));
      setUrlValidation({
        companyInfo: partner.website ? 'valid' : null,
        location: partner.office_location_url ? 'valid' : null
      });
      setEditingSection(null);
      setActiveMenu(null);
      setShowUploadForm(false);
    }
  }, [partner]);

  // Fetch documents on mount
  useEffect(() => {
    if (partner?.id) {
      fetch(`/api/documents/${partner.id}`)
        .then(r => { if (!r.ok) throw new Error(`Server returned ${r.status}`); return r.json(); })
        .then(data => { if (data.success) setDocuments(data.documents || []); })
        .catch(err => console.error('Fetch partner docs error:', err));
    }
  }, [partner?.id]);

  const handleDocUpload = async () => {
    if (!isOwnProfile) return;
    if (!docFile || !docLabel.trim()) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1];
        const res = await fetch('/api/documents/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            traineeId: partner.id,
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

  const deleteDoc = async (docId) => {
    if (!isOwnProfile) return;
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        setDocuments(prev => prev.filter(d => d.id !== docId));
      } else {
        toast.error(`Delete failed: ${result.error}`);
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete document.');
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !isOwnProfile) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, etc.)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCropModal({ open: true, image: reader.result, aspect: 3, type: 'banner' });
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !isOwnProfile) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, etc.)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCropModal({ open: true, image: reader.result, aspect: 1, type: 'logo' });
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const handlePOCPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !isOwnProfile) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, etc.)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCropModal({ open: true, image: reader.result, aspect: 1, type: 'poc' });
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const onCropComplete = async (croppedBlob) => {
    const type = cropModal.type;
    setCropModal({ open: false, image: null, aspect: 1, type: null });
    setSaving(true);
    try {
      let path = '';
      if (type === 'banner') path = `partner-banners/${partner.id}/${Date.now()}_banner.jpg`;
      else if (type === 'logo') path = `partner-logos/${partner.id}/${Date.now()}_logo.jpg`;
      else if (type === 'poc') path = `partner-poc/${partner.id}/${Date.now()}_poc.jpg`;

      const res = await uploadOptimizedImage('registration-uploads', path, croppedBlob);
      if (!res.success) throw new Error(res.error);
      const publicUrl = res.url;

      if (type === 'banner') {
        await updatePartner(partner.id, { banner_url: publicUrl });
        setForm(prev => ({ ...prev, banner_url: publicUrl }));
        showBulletinToast('Banner updated!');
      } else if (type === 'logo') {
        await updatePartner(partner.id, { company_logo_url: publicUrl });
        setForm(prev => ({ ...prev, company_logo_url: publicUrl }));
        showBulletinToast('Logo updated!');
      } else if (type === 'poc') {
        setForm(prev => ({ ...prev, poc_photo_url: publicUrl }));
        showBulletinToast('POC photo prepared!');
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loadingViewedProfile) {
    return (
      <div className="ln-page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 240 }}>
        <Loader size={30} style={{ animation: 'ocr-spin 1s linear infinite', opacity: 0.4 }} />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="ln-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Loader size={40} style={{ animation: 'ocr-spin 1s linear infinite', opacity: 0.3 }} />
      </div>
    );
  }

  const activeJobs = jobPostings.filter(j => j.partnerId === partner.id && j.status === 'Open');

  // URL validation (gibberish check)
  const isValidUrl = (url) => {
    if (!url) return true;
    try {
      const pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
        '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
      return !!pattern.test(url);
    } catch (e) {
      return false;
    }
  };

  const validateSection = async (section) => {
    if (section === 'companyInfo') {
      if (!form.companyName?.trim()) { toast.error('Company Name is required'); return false; }
      if (form.companyName.length > 50) { toast.error('Company Name must be 50 characters or less'); return false; }
      if (!form.email?.trim()) { toast.error('Contact Email is required'); return false; }
      if (form.email.length > 40) { toast.error('Contact Email must be 40 characters or less'); return false; }
      if (!isEmailValid(form.email)) { toast.error('Please enter a valid email address'); return false; }
      if (!form.industry) { toast.error('Please select an Industry'); return false; }
      if (form.contactPerson && form.contactPerson.length > 40) { toast.error('Contact Person must be 40 characters or less'); return false; }
      
      if (form.website && urlValidation.companyInfo !== 'valid') {
        if (urlValidation.companyInfo === 'unreachable' || urlValidation.companyInfo === 'error' || urlValidation.companyInfo === 'invalid') {
          toast.error('Cannot save. Website is unreachable or invalid.');
        } else {
          toast.error('Please wait for website verification to complete.');
        }
        return false;
      }
    }
    if (section === 'location') {
      if (form.office_location_url && urlValidation.location !== 'valid') {
        if (urlValidation.location === 'unreachable' || urlValidation.location === 'error' || urlValidation.location === 'invalid') {
          toast.error('Cannot save. Location URL is unreachable or invalid.');
        } else {
          toast.error('Please wait for location verification to complete.');
        }
        return false;
      }
    }
    return true;
  };

  const handleCancelEdit = (section) => {
    if (partner) {
      setForm({
        ...form,
        companyName: partner.companyName || '',
        contactPerson: partner.contactPerson || '',
        email: partner.email || '',
        address: partner.address || '',
        detailed_address: partner.detailed_address || '',
        region: partner.region || '',
        province: partner.province || '',
        city: partner.city || '',
        barangay: partner.barangay || '',
        regionCode: partner.regionCode || '',
        provinceCode: partner.provinceCode || '',
        cityCode: partner.cityCode || '',
        barangayCode: partner.barangayCode || '',
        website: partner.website || '',
        industry: partner.industry || '',
        mission: partner.mission || '',
        vision: partner.vision || '',
        achievements: partner.achievements || [],
        benefits: partner.benefits || [],
        poc_name: partner.poc_name || '',
        poc_title: partner.poc_title || '',
        office_location_url: partner.office_location_url || ''
      });
      setUrlValidation({
        companyInfo: partner.website ? 'valid' : null,
        location: partner.office_location_url ? 'valid' : null
      });
    }
    setEditingSection(null);
  };

  const saveSection = async (section) => {
    if (!(await validateSection(section))) return;
    setSaving(true);
    try {
      let payload = {};
      if (section === 'companyInfo') {
        payload = {
          companyName: form.companyName.trim(),
          contactPerson: form.contactPerson?.trim(),
          email: form.email.trim(),
          industry: form.industry,
          website: form.website?.trim(),
          region: form.region,
          province: form.province,
          city: form.city,
          barangay: form.barangay,
          detailed_address: form.detailed_address?.trim(),
          address: [form.detailed_address, form.barangay, form.city, form.province, form.region].filter(Boolean).join(', '),
          regionCode: form.regionCode,
          provinceCode: form.provinceCode,
          cityCode: form.cityCode,
          barangayCode: form.barangayCode,
          company_info_visibility: companyInfoVisibility
        };
      } else if (section === 'mission') {
        payload = { mission: form.mission.trim() };
      } else if (section === 'vision') {
        payload = { vision: form.vision.trim() };
      } else if (section === 'benefits') {
        payload = { benefits: form.benefits };
      } else if (section === 'poc') {
        payload = { 
          poc_name: form.poc_name.trim(), 
          poc_title: form.poc_title.trim(),
          poc_photo_url: form.poc_photo_url
        };
      } else if (section === 'achievements') {
        payload = { achievements: form.achievements };
      } else if (section === 'location') {
        payload = { office_location_url: form.office_location_url.trim() };
      } else if (section === 'culture') {
          payload = { culture_tags: form.culture_tags, perks_tags: form.perks_tags };
      }

      console.log('>>> [saveSection] Payload prepared for', section, ':', payload);
      const res = await updatePartner(partner.id, payload);
      if (res.success) {
        toast.success('Section updated successfully');
        setEditingSection(null);
      } else {
        toast.error(res.error || 'Failed to update section');
      }
    } catch (err) {
      toast.error('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const initials = partner.companyName?.charAt(0)?.toUpperCase() || 'P';
  const companyInfoFields = [
    { label: 'Company Name', key: 'companyName', type: 'text', maxLength: 100 },
    { label: 'Contact Person', key: 'contactPerson', type: 'text', maxLength: 100 },
    { label: 'Contact Email', key: 'email', type: 'email', maxLength: 100 },
    { label: 'Address', key: 'address', type: 'text', maxLength: 200 },
    { label: 'Industry', key: 'industry', type: 'select', options: INDUSTRY_OPTIONS },
    { label: 'Website', key: 'website', type: 'text', maxLength: 200, placeholder: 'e.g. https://example.com' },
  ];

  const toggleCompanyInfoVisibility = (fieldKey) => {
    setCompanyInfoVisibility(prev => (
      prev.includes(fieldKey)
        ? prev.filter(key => key !== fieldKey)
        : [...prev, fieldKey]
    ));
  };
  const visibleCompanyInfo = new Set(resolvePartnerVisibility(partner));
  const showHeaderCompanyName = isOwnProfile || visibleCompanyInfo.has('companyName');
  const showHeaderIndustry = isOwnProfile || visibleCompanyInfo.has('industry');
  const showHeaderAddress = isOwnProfile || visibleCompanyInfo.has('address');
  const showHeaderEmail = isOwnProfile || visibleCompanyInfo.has('email');
  const isHeaderAddressHiddenFromOthers = isOwnProfile && !visibleCompanyInfo.has('address');
  const isHeaderEmailHiddenFromOthers = isOwnProfile && !visibleCompanyInfo.has('email');

  return (
    <div className="ln-page-content">
      {!isOwnProfile && onBack && (
        <div style={{ marginBottom: 12 }}>
          <button type="button" className="ln-btn ln-btn-outline" onClick={onBack}>
            <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} /> Back
          </button>
        </div>
      )}
      {/* Profile Header Card */}
      <div className="ln-card ln-profile-header-card">
        <div
          className="ln-profile-header-banner pn-header-banner"
          style={{
            height: 160,
            backgroundImage: partner.banner_url ? `url(${partner.banner_url})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: partner.banner_url ? 'transparent' : undefined
          }}
        >
          {isOwnProfile && (
            <div style={{ position: 'absolute', top: 12, right: 12 }}>
              <input
                type="file"
                ref={bannerInputRef}
                onChange={handleBannerUpload}
                style={{ display: 'none' }}
                accept="image/*"
              />
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                className="ln-btn-sm"
                style={{
                  background: 'rgba(255,255,255,0.9)',
                  border: 'none',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
              >
                <Camera size={14} /> Change Banner
              </button>
            </div>
          )}
        </div>
        <div className="ln-profile-header-body">
          <div style={{ position: 'relative' }}>
            <div className="ln-profile-header-avatar pn-header-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {partner.company_logo_url ? (
                <img src={partner.company_logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : initials}
            </div>
            {isOwnProfile && (
              <>
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                  accept="image/*"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#0a66c2',
                    border: '2px solid white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    zIndex: 2
                  }}
                  title="Change Logo"
                >
                  <Camera size={14} color="white" />
                </button>
              </>
            )}
          </div>
          <div className="ln-profile-header-info">
            <div className="ln-profile-header-top">
              <div style={{ flex: 1 }}>
                <h1 className="ln-profile-header-name" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {showHeaderCompanyName ? partner.companyName : 'Industry Partner'}
                  {isVerified(partner) && <CheckCircle size={20} color="#0a66c2" title="Verified" style={{ flexShrink: 0 }} />}
                </h1>
                <p className="ln-profile-header-headline">{showHeaderIndustry && partner.industry ? `${partner.industry} - ` : ''}Industry Partner</p>
                {showHeaderAddress && partner.address && (
                  <p className="ln-profile-header-loc" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={14} />
                    <span>{partner.address}</span>
                    {isHeaderAddressHiddenFromOthers && <EyeOff size={14} color="#94a3b8" title="Hidden from others" />}
                  </p>
                )}
                {showHeaderEmail && partner.email && (
                  <p className="ln-profile-header-contact" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <span>{partner.email}</span>
                    {isHeaderEmailHiddenFromOthers && <EyeOff size={14} color="#94a3b8" title="Hidden from others" />}
                  </p>
                )}
                <StatusBadge status={partner.verificationStatus} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="ln-profile-single-col">
        <div className="ln-profile-main">
          {/* Tab Navigation Card */}
          <div className="ln-card" style={{ marginBottom: 20, padding: '0 20px', borderRadius: 12 }}>
            <div style={{ display: 'flex', gap: 24 }}>
              {(isOwnProfile ? ['About', 'Saved', 'Activity'] : ['About']).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '14px 4px',
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
                  {tab === 'Saved' ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Bookmark size={14} /> Saved</div> : tab}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'About' && (
            <React.Fragment>
              {/* Verification Status Indicator */}
              {isOwnProfile && !isVerified(partner) && (
                <div className="ln-card" style={{ borderLeft: '4px solid #d97706', marginBottom: 16 }}>
                  <div style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <AlertTriangle size={20} color="#d97706" style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#92400e', marginBottom: 2 }}>
                          {partner.verificationStatus === 'Under Review' ? 'Verification In Progress' : 'Account Not Verified'}
                        </div>
                        <div style={{ fontSize: 13, color: '#a16207' }}>
                          {partner.verificationStatus === 'Under Review'
                            ? 'Your documents are being reviewed. You will be notified once verified.'
                            : 'Verify your account to unlock job & OJT posting features and get a verified badge.'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                      <StatusBadge status={partner.verificationStatus} />
                      <button className="ln-btn ln-btn-primary" style={{ fontSize: 13 }} onClick={() => navigate('/partner/verification')}>
                        <ShieldCheck size={14} /> Go to Verification
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Company Information */}
              <div className="ln-card" style={{ position: 'relative' }}>
                <div className="ln-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Company Information</h3>
                  {isOwnProfile && (
                    editingSection === 'companyInfo' ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="ln-btn-sm ln-btn-outline" onClick={() => handleCancelEdit('companyInfo')} disabled={saving}>Cancel</button>
                        <button className="ln-btn-sm ln-btn-primary" onClick={() => saveSection('companyInfo')} disabled={saving}>
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    ) : (
                      <div style={{ position: 'relative' }}>
                        <button 
                          className="ln-btn-icon" 
                          onClick={() => setActiveMenu(activeMenu === 'companyInfo' ? null : 'companyInfo')}
                        >
                          <MoreVertical size={18} />
                        </button>
                        {activeMenu === 'companyInfo' && (
                          <div className="ln-popover-menu" style={{ 
                            position: 'absolute', right: 0, top: '100%', zIndex: 10,
                            background: '#fff', border: '1px solid #e2e8f0', 
                            borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                            padding: '4px', minWidth: 160, marginTop: 8
                          }}>
                            <button 
                              onClick={() => { setEditingSection('companyInfo'); setActiveMenu(null); }}
                              style={{ 
                                width: '100%', textAlign: 'left', padding: '8px 12px',
                                background: 'none', border: 'none', borderRadius: 6,
                                display: 'flex', alignItems: 'center', gap: 8,
                                fontSize: 13, color: '#334155', cursor: 'pointer'
                              }}
                              className="ln-popover-item"
                            >
                              <Edit size={14} /> Edit Information
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>

                <div className="ln-info-grid">
                  {editingSection === 'companyInfo' ? (
                    <>
                      <div className="ln-info-item">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <label className="ln-info-label" style={{ marginBottom: 0 }}>Company Name</label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer', color: '#64748b', fontWeight: 500 }}>
                            <input type="checkbox" checked={companyInfoVisibility.includes('companyName')} onChange={() => toggleCompanyInfoVisibility('companyName')} style={{ width: 13, height: 13 }} />
                            Show
                          </label>
                        </div>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={form.companyName} 
                          onChange={e => setForm({...form, companyName: e.target.value.slice(0, 50)})} 
                          placeholder="Enter company name"
                          style={!form.companyName?.trim() ? { borderColor: '#ef4444' } : form.companyName.length >= 50 ? { borderColor: '#f59e0b' } : {}}
                        />
                        {!form.companyName?.trim() && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>Company name is required</div>}
                        {form.companyName.length >= 50 && <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4 }}>Maximum 50 characters reached</div>}
                      </div>
                      <div className="ln-info-item">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <label className="ln-info-label" style={{ marginBottom: 0 }}>Contact Email</label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer', color: '#64748b', fontWeight: 500 }}>
                            <input type="checkbox" checked={companyInfoVisibility.includes('email')} onChange={() => toggleCompanyInfoVisibility('email')} style={{ width: 13, height: 13 }} />
                            Show
                          </label>
                        </div>
                        <input 
                          type="email" 
                          className="form-input" 
                          value={form.email} 
                          onChange={e => setForm({...form, email: e.target.value.slice(0, 40)})} 
                          placeholder="Enter contact email"
                          style={(!form.email?.trim() || (form.email && !isEmailValid(form.email))) ? { borderColor: '#ef4444' } : form.email.length >= 40 ? { borderColor: '#f59e0b' } : {}}
                        />
                        {!form.email?.trim() && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>Contact email is required</div>}
                        {form.email?.trim() && !isEmailValid(form.email) && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>Please enter a valid email address</div>}
                        {form.email.length >= 40 && <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4 }}>Maximum 40 characters reached</div>}
                      </div>
                      <div className="ln-info-item">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <label className="ln-info-label" style={{ marginBottom: 0 }}>Industry</label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer', color: '#64748b', fontWeight: 500 }}>
                            <input type="checkbox" checked={companyInfoVisibility.includes('industry')} onChange={() => toggleCompanyInfoVisibility('industry')} style={{ width: 13, height: 13 }} />
                            Show
                          </label>
                        </div>
                        <select 
                          className="form-input" 
                          value={form.industry} 
                          onChange={e => setForm({...form, industry: e.target.value})}
                        >
                          <option value="">Select Industry</option>
                          {INDUSTRY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                      <div className="ln-info-item">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <label className="ln-info-label" style={{ marginBottom: 0 }}>Contact Person</label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer', color: '#64748b', fontWeight: 500 }}>
                            <input type="checkbox" checked={companyInfoVisibility.includes('contactPerson')} onChange={() => toggleCompanyInfoVisibility('contactPerson')} style={{ width: 13, height: 13 }} />
                            Show
                          </label>
                        </div>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={form.contactPerson} 
                          onChange={e => setForm({...form, contactPerson: e.target.value.slice(0, 40)})} 
                          placeholder="Enter contact person"
                          style={form.contactPerson.length >= 40 ? { borderColor: '#f59e0b' } : {}}
                        />
                        {form.contactPerson.length >= 40 && <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4 }}>Maximum 40 characters reached</div>}
                      </div>
                      <div className="ln-info-item">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <label className="ln-info-label" style={{ marginBottom: 0 }}>Website</label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer', color: '#64748b', fontWeight: 500 }}>
                            <input type="checkbox" checked={companyInfoVisibility.includes('website')} onChange={() => toggleCompanyInfoVisibility('website')} style={{ width: 13, height: 13 }} />
                            Show
                          </label>
                        </div>
                        <input 
                          type="url" 
                          className="form-input" 
                          value={form.website} 
                          onChange={e => handleUrlChange(e.target.value, 'companyInfo', val => setForm({...form, website: val}))} 
                          placeholder="https://example.com"
                          style={urlValidation.companyInfo === 'invalid' || urlValidation.companyInfo === 'error' || urlValidation.companyInfo === 'unreachable' ? { borderColor: '#ef4444' } : urlValidation.companyInfo === 'valid' ? { borderColor: '#10b981' } : {}}
                        />
                        {urlValidation.companyInfo === 'checking' && <div style={{ fontSize: 11, color: '#3b82f6', marginTop: 4 }}>Verifying website reachability...</div>}
                        {urlValidation.companyInfo === 'invalid' && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>Please enter a valid URL (e.g. https://example.com)</div>}
                        {urlValidation.companyInfo === 'unreachable' && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>Website is unreachable or does not exist.</div>}
                        {urlValidation.companyInfo === 'error' && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>Could not verify website. Check your connection.</div>}
                        {urlValidation.companyInfo === 'valid' && <div style={{ fontSize: 11, color: '#10b981', marginTop: 4 }}>Website verified successfully.</div>}
                      </div>
                      
                      <div className="ln-info-item" style={{ gridColumn: '1 / -1', marginTop: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <label className="ln-info-label" style={{ marginBottom: 0, fontSize: 14, fontWeight: 700 }}>Office Address</label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer', color: '#64748b', fontWeight: 500 }}>
                            <input type="checkbox" checked={companyInfoVisibility.includes('address')} onChange={() => toggleCompanyInfoVisibility('address')} style={{ width: 13, height: 13 }} />
                            Show on profile
                          </label>
                        </div>
                        <PhilAddressSelector 
                          values={{
                            region: form.region,
                            province: form.province,
                            city: form.city,
                            barangay: form.barangay,
                            detailedAddress: form.detailed_address,
                            regionCode: form.regionCode,
                            provinceCode: form.provinceCode,
                            cityCode: form.cityCode,
                            barangayCode: form.barangayCode
                          }}
                          onChange={(vals) => setForm({
                            ...form,
                            ...vals,
                            detailed_address: vals.detailedAddress !== undefined ? vals.detailedAddress : form.detailed_address
                          })}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {(isOwnProfile || companyInfoVisibility.includes('companyName')) && (
                        <div className="ln-info-item">
                          <label className="ln-info-label">Company Name</label>
                          <div className="ln-info-value">{partner.companyName}</div>
                        </div>
                      )}
                      {(isOwnProfile || companyInfoVisibility.includes('industry')) && (
                        <div className="ln-info-item">
                          <label className="ln-info-label">Industry</label>
                          <div className="ln-info-value">{partner.industry}</div>
                        </div>
                      )}
                      {(isOwnProfile || companyInfoVisibility.includes('contactPerson')) && (
                        <div className="ln-info-item">
                          <label className="ln-info-label">Contact Person</label>
                          <div className="ln-info-value">{partner.contactPerson || '—'}</div>
                        </div>
                      )}
                      {(isOwnProfile || companyInfoVisibility.includes('email')) && (
                        <div className="ln-info-item">
                          <label className="ln-info-label">Contact Email</label>
                          <div className="ln-info-value">{partner.email || '—'}</div>
                        </div>
                      )}
                      {(isOwnProfile || companyInfoVisibility.includes('website')) && (
                        <div className="ln-info-item">
                          <label className="ln-info-label">Website</label>
                          <div className="ln-info-value">
                            {partner.website ? (
                              <a href={partner.website.startsWith('http') ? partner.website : `https://${partner.website}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0a66c2', textDecoration: 'none' }}>
                                {partner.website} <ExternalLink size={12} />
                              </a>
                            ) : '—'}
                          </div>
                        </div>
                      )}
                      {(isOwnProfile || companyInfoVisibility.includes('address')) && (
                        <div className="ln-info-item" style={{ gridColumn: '1 / -1' }}>
                          <label className="ln-info-label">Address</label>
                          <div className="ln-info-value">{partner.address || '—'}</div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Mission & Vision Section */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
                <div className="ln-card no-scrollbar" style={{ position: 'relative', overflow: 'hidden' }}>
                  <div className="ln-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>Our Mission</h3>
                    {isOwnProfile && (
                      editingSection === 'mission' ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="ln-btn-sm ln-btn-outline" onClick={() => handleCancelEdit('mission')} disabled={saving}>Cancel</button>
                          <button className="ln-btn-sm ln-btn-primary" onClick={() => saveSection('mission')} disabled={saving}>
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      ) : (
                        <div style={{ position: 'relative' }}>
                          <button className="ln-btn-icon" onClick={() => setActiveMenu(activeMenu === 'mission' ? null : 'mission')}>
                            <MoreVertical size={18} />
                          </button>
                          {activeMenu === 'mission' && (
                            <div className="ln-popover-menu" style={{ 
                              position: 'absolute', right: 0, top: '100%', zIndex: 10,
                              background: '#fff', border: '1px solid #e2e8f0', 
                              borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                              padding: '4px', minWidth: 160, marginTop: 8
                            }}>
                              <button 
                                onClick={() => { setEditingSection('mission'); setActiveMenu(null); }}
                                style={{ 
                                  width: '100%', textAlign: 'left', padding: '8px 12px',
                                  background: 'none', border: 'none', borderRadius: 6,
                                  display: 'flex', alignItems: 'center', gap: 8,
                                  fontSize: 13, color: '#334155', cursor: 'pointer'
                                }}
                                className="ln-popover-item"
                              >
                                <Edit size={14} /> Edit Mission
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                  <div style={{ padding: '0 16px 16px' }}>
                    {editingSection === 'mission' ? (
                      <>
                        <textarea
                          className="form-input no-scrollbar"
                          style={{ minHeight: 120, width: '100%', resize: 'none', display: 'block', height: 'auto' }}
                          placeholder="Define your company's core mission..."
                          value={form.mission}
                          onChange={e => {
                            setForm({ ...form, mission: e.target.value.slice(0, 500) });
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                          }}
                          onFocus={e => {
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                          }}
                          maxLength={500}
                        />
                        {form.mission.length >= 500 && <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4 }}>Maximum 500 characters reached</div>}
                      </>
                    ) : (
                      <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {partner.mission || 'No mission statement provided yet.'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="ln-card no-scrollbar" style={{ position: 'relative', overflow: 'hidden' }}>
                  <div className="ln-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>Our Vision</h3>
                    {isOwnProfile && (
                      editingSection === 'vision' ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="ln-btn-sm ln-btn-outline" onClick={() => handleCancelEdit('vision')} disabled={saving}>Cancel</button>
                          <button className="ln-btn-sm ln-btn-primary" onClick={() => saveSection('vision')} disabled={saving}>
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      ) : (
                        <div style={{ position: 'relative' }}>
                          <button className="ln-btn-icon" onClick={() => setActiveMenu(activeMenu === 'vision' ? null : 'vision')}>
                            <MoreVertical size={18} />
                          </button>
                          {activeMenu === 'vision' && (
                            <div className="ln-popover-menu" style={{ 
                              position: 'absolute', right: 0, top: '100%', zIndex: 10,
                              background: '#fff', border: '1px solid #e2e8f0', 
                              borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                              padding: '4px', minWidth: 160, marginTop: 8
                            }}>
                              <button 
                                onClick={() => { setEditingSection('vision'); setActiveMenu(null); }}
                                style={{ 
                                  width: '100%', textAlign: 'left', padding: '8px 12px',
                                  background: 'none', border: 'none', borderRadius: 6,
                                  display: 'flex', alignItems: 'center', gap: 8,
                                  fontSize: 13, color: '#334155', cursor: 'pointer'
                                }}
                                className="ln-popover-item"
                              >
                                <Edit size={14} /> Edit Vision
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                  <div style={{ padding: '0 16px 16px' }}>
                    {editingSection === 'vision' ? (
                      <>
                        <textarea
                          className="form-input no-scrollbar"
                          style={{ minHeight: 120, width: '100%', resize: 'none', display: 'block', height: 'auto' }}
                          placeholder="Share your long-term goal for the company..."
                          value={form.vision}
                          onChange={e => {
                            setForm({ ...form, vision: e.target.value.slice(0, 500) });
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                          }}
                          onFocus={e => {
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                          }}
                          maxLength={500}
                        />
                        {form.vision.length >= 500 && <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4 }}>Maximum 500 characters reached</div>}
                      </>
                    ) : (
                      <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {partner.vision || 'No vision statement provided yet.'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Unified Work Environment & Benefits Section */}
              <div className="ln-card" style={{ position: 'relative', marginTop: 20 }}>
                <div className="ln-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Work Environment & Benefits</h3>
                  {isOwnProfile && (
                    editingSection === 'culture' ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="ln-btn-sm ln-btn-outline" onClick={() => handleCancelEdit('culture')} disabled={saving}>Cancel</button>
                        <button className="ln-btn-sm ln-btn-primary" onClick={() => saveSection('culture')} disabled={saving}>
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    ) : (
                      <div style={{ position: 'relative' }}>
                        <button className="ln-btn-icon" onClick={() => setActiveMenu(activeMenu === 'culture' ? null : 'culture')}>
                          <MoreVertical size={18} />
                        </button>
                        {activeMenu === 'culture' && (
                          <div className="ln-popover-menu" style={{ 
                            position: 'absolute', right: 0, top: '100%', zIndex: 10,
                            background: '#fff', border: '1px solid #e2e8f0', 
                            borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                            padding: '4px', minWidth: 160, marginTop: 8
                          }}>
                            <button 
                              onClick={() => { setEditingSection('culture'); setActiveMenu(null); }}
                              style={{ 
                                width: '100%', textAlign: 'left', padding: '8px 12px',
                                background: 'none', border: 'none', borderRadius: 6,
                                display: 'flex', alignItems: 'center', gap: 8,
                                fontSize: 13, color: '#334155', cursor: 'pointer'
                              }}
                              className="ln-popover-item"
                            >
                              <Edit size={14} /> Edit Environment
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
                <div style={{ padding: '0 16px 16px' }}>
                  {/* Culture Tags Subsection */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.025em' }}>Work Culture</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {PREDEFINED_CULTURE_TAGS.map(tag => {
                        const isSelected = (editingSection === 'culture' ? form.culture_tags : partner.culture_tags)?.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              if (editingSection !== 'culture') return;
                              const current = form.culture_tags || [];
                              setForm({
                                ...form,
                                culture_tags: isSelected
                                  ? current.filter(t => t !== tag)
                                  : current.length < 20 
                                    ? [...current, tag]
                                    : (toast.error('Maximum 20 culture tags allowed'), current)
                              });
                            }}
                            style={{
                              padding: '6px 14px',
                              background: isSelected ? '#eff6ff' : '#f8fafc',
                              border: '1px solid',
                              borderColor: isSelected ? '#3b82f6' : '#e2e8f0',
                              color: isSelected ? '#1d4ed8' : '#64748b',
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: isSelected ? 600 : 500,
                              cursor: editingSection === 'culture' ? 'pointer' : 'default',
                              transition: 'all 0.2s'
                            }}
                          >
                            {tag}
                          </button>
                        );
                      })}
                      {/* Custom Culture Tags */}
                      {(editingSection === 'culture' ? form.culture_tags : partner.culture_tags)?.filter(t => !PREDEFINED_CULTURE_TAGS.includes(t)).map(tag => (
                        <div key={tag} style={{ padding: '6px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: 20, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {tag}
                          {editingSection === 'culture' && <X size={12} style={{ cursor: 'pointer' }} onClick={() => setForm({ ...form, culture_tags: form.culture_tags.filter(t => t !== tag) })} />}
                        </div>
                      ))}
                    </div>
                    {editingSection === 'culture' && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <input
                          className="form-input"
                          style={{ margin: 0, height: 32, fontSize: 12, maxWidth: 200 }}
                          placeholder="Add custom culture tag..."
                          id="custom-culture-tag"
                          onKeyDown={e => {
                            if (e.key === 'Enter' && e.target.value.trim()) {
                              const val = e.target.value.trim();
                              if (val.length > 30) { toast.error('Tag must be 30 characters or less'); return; }
                              if (form.culture_tags?.length >= 20) { toast.error('Maximum 20 culture tags allowed'); return; }
                              if (!form.culture_tags.includes(val)) {
                                setForm({ ...form, culture_tags: [...form.culture_tags, val] });
                              }
                              e.target.value = '';
                              e.preventDefault();
                            }
                          }}
                          maxLength={30}
                        />
                      </div>
                    )}
                  </div>

                  {/* Perks & Setup Subsection */}
                  <div style={{ marginTop: 24 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.025em' }}>Perks & Benefits</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {PREDEFINED_PERKS_TAGS.map(tag => {
                        const isSelected = (editingSection === 'culture' ? form.perks_tags : partner.perks_tags)?.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              if (editingSection !== 'culture') return;
                              const current = form.perks_tags || [];
                              setForm({
                                ...form,
                                perks_tags: isSelected
                                  ? current.filter(t => t !== tag)
                                  : current.length < 20 
                                    ? [...current, tag]
                                    : (toast.error('Maximum 20 perks tags allowed'), current)
                              });
                            }}
                            style={{
                              padding: '6px 14px',
                              background: isSelected ? '#fdf2f2' : '#f8fafc',
                              border: '1px solid',
                              borderColor: isSelected ? '#fecaca' : '#e2e8f0',
                              color: isSelected ? '#991b1b' : '#64748b',
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: isSelected ? 600 : 500,
                              cursor: editingSection === 'culture' ? 'pointer' : 'default',
                              transition: 'all 0.2s'
                            }}
                          >
                            {tag}
                          </button>
                        );
                      })}
                      {/* Custom Perks Tags */}
                      {(editingSection === 'culture' ? form.perks_tags : partner.perks_tags)?.filter(t => !PREDEFINED_PERKS_TAGS.includes(t)).map(tag => (
                        <div key={tag} style={{ padding: '6px 14px', background: '#fdf2f8', border: '1px solid #fbcfe8', color: '#9d174d', borderRadius: 20, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {tag}
                          {editingSection === 'culture' && <X size={12} style={{ cursor: 'pointer' }} onClick={() => setForm({ ...form, perks_tags: form.perks_tags.filter(t => t !== tag) })} />}
                        </div>
                      ))}
                    </div>
                    {editingSection === 'culture' && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <input
                          className="form-input"
                          style={{ margin: 0, height: 32, fontSize: 12, maxWidth: 200 }}
                          placeholder="Add custom perk..."
                          id="custom-perk-tag"
                          onKeyDown={e => {
                            if (e.key === 'Enter' && e.target.value.trim()) {
                              const val = e.target.value.trim();
                              if (val.length > 30) { toast.error('Tag must be 30 characters or less'); return; }
                              if (form.perks_tags?.length >= 20) { toast.error('Maximum 20 perks tags allowed'); return; }
                              if (!form.perks_tags.includes(val)) {
                                setForm({ ...form, perks_tags: [...form.perks_tags, val] });
                              }
                              e.target.value = '';
                              e.preventDefault();
                            }
                          }}
                          maxLength={30}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Company Achievements */}
              <div className="ln-card" style={{ marginTop: 20, position: 'relative' }}>
                <div className="ln-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Company Achievements & Awards</h3>
                  {isOwnProfile && (
                    editingSection === 'achievements' ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="ln-btn-sm ln-btn-outline" onClick={() => handleCancelEdit('achievements')} disabled={saving}>Cancel</button>
                        <button className="ln-btn-sm ln-btn-primary" onClick={() => saveSection('achievements')} disabled={saving}>
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    ) : (
                      <div style={{ position: 'relative' }}>
                        <button className="ln-btn-icon" onClick={() => setActiveMenu(activeMenu === 'achievements' ? null : 'achievements')}>
                          <MoreVertical size={18} />
                        </button>
                        {activeMenu === 'achievements' && (
                          <div className="ln-popover-menu" style={{ 
                            position: 'absolute', right: 0, top: '100%', zIndex: 10,
                            background: '#fff', border: '1px solid #e2e8f0', 
                            borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                            padding: '4px', minWidth: 160, marginTop: 8
                          }}>
                            <button 
                              onClick={() => { setEditingSection('achievements'); setActiveMenu(null); }}
                              style={{ 
                                width: '100%', textAlign: 'left', padding: '8px 12px',
                                background: 'none', border: 'none', borderRadius: 6,
                                display: 'flex', alignItems: 'center', gap: 8,
                                fontSize: 13, color: '#334155', cursor: 'pointer'
                              }}
                              className="ln-popover-item"
                            >
                              <Edit size={14} /> Edit Achievements
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
                <div style={{ padding: '0 16px 16px' }}>
                  {isOwnProfile && editingSection === 'achievements' && (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                      <input
                        className="form-input"
                        placeholder="Add award/achievement..."
                        style={{ margin: 0, height: 38, fontSize: 13 }}
                        maxLength={100}
                        value={newAchievement}
                        onChange={e => setNewAchievement(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && newAchievement.trim()) {
                            setForm({ ...form, achievements: [...form.achievements, newAchievement.trim()] });
                            setNewAchievement('');
                            e.preventDefault();
                          }
                        }}
                      />
                      <button className="ln-btn-sm ln-btn-primary" style={{ height: 38, padding: '0 16px' }} onClick={() => {
                        if (newAchievement.trim()) {
                          setForm({ ...form, achievements: [...form.achievements, newAchievement.trim()] });
                          setNewAchievement('');
                        }
                      }}>Add</button>
                    </div>
                  )}
                </div>
                <div style={{ padding: '0 16px 16px' }}>
                  {(editingSection === 'achievements' ? form.achievements : partner.achievements)?.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {(editingSection === 'achievements' ? form.achievements : partner.achievements).map((ach, idx) => (
                        <div key={idx} style={{ padding: '6px 14px', background: '#fffbeb', border: '1px solid #fef3c7', color: '#92400e', borderRadius: 20, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Award size={14} /> {ach}
                          {isOwnProfile && editingSection === 'achievements' && <X size={12} style={{ cursor: 'pointer' }} onClick={() => showConfirm('Are you sure you want to remove this achievement?', () => setForm({ ...form, achievements: form.achievements.filter((_, i) => i !== idx) }))} />}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      illustration={TrophyIllustration}
                      title="No achievements yet"
                      description="Showcase your company's awards, recognitions, and major milestones to attract top talent."
                      style={{ padding: '24px 20px' }}
                    />
                  )}
                </div>
              </div>

              {/* Office Location & Point of Contact Section (Same row) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
                {/* Office Location Card */}
                <div className="ln-card" style={{ position: 'relative' }}>
                  <div className="ln-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>Office Location</h3>
                    {isOwnProfile && (
                      editingSection === 'location' ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="ln-btn-sm ln-btn-outline" onClick={() => handleCancelEdit('location')} disabled={saving}>Cancel</button>
                          <button className="ln-btn-sm ln-btn-primary" onClick={() => saveSection('location')} disabled={saving}>
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      ) : (
                        <div style={{ position: 'relative' }}>
                          <button className="ln-btn-icon" onClick={() => setActiveMenu(activeMenu === 'location' ? null : 'location')}>
                            <MoreVertical size={18} />
                          </button>
                          {activeMenu === 'location' && (
                            <div className="ln-popover-menu" style={{ 
                              position: 'absolute', right: 0, top: '100%', zIndex: 10,
                              background: '#fff', border: '1px solid #e2e8f0', 
                              borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                              padding: '4px', minWidth: 160, marginTop: 8
                            }}>
                              <button 
                                onClick={() => { setEditingSection('location'); setActiveMenu(null); }}
                                style={{ 
                                  width: '100%', textAlign: 'left', padding: '8px 12px',
                                  background: 'none', border: 'none', borderRadius: 6,
                                  display: 'flex', alignItems: 'center', gap: 8,
                                  fontSize: 13, color: '#334155', cursor: 'pointer'
                                }}
                                className="ln-popover-item"
                              >
                                <Edit size={14} /> Edit Location
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                  <div style={{ padding: '0 16px 16px' }}>
                    {editingSection === 'location' ? (
                      <div>
                        <input
                          className="form-input"
                          placeholder="Google Maps URL..."
                          value={form.office_location_url}
                          onChange={e => handleUrlChange(e.target.value, 'location', val => setForm({ ...form, office_location_url: val }))}
                          style={urlValidation.location === 'invalid' || urlValidation.location === 'error' || urlValidation.location === 'unreachable' ? { borderColor: '#ef4444' } : urlValidation.location === 'valid' ? { borderColor: '#10b981' } : {}}
                        />
                        {urlValidation.location === 'checking' && <div style={{ fontSize: 11, color: '#3b82f6', marginTop: 4 }}>Verifying location link...</div>}
                        {urlValidation.location === 'invalid' && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>Please enter a valid Google Maps URL</div>}
                        {urlValidation.location === 'unreachable' && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>Link is unreachable or does not exist.</div>}
                        {urlValidation.location === 'error' && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>Could not verify link. Check your connection.</div>}
                        {urlValidation.location === 'valid' && <div style={{ fontSize: 11, color: '#10b981', marginTop: 4 }}>Link verified successfully.</div>}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <p style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <MapPin size={14} /> {partner.address || 'Address not listed'}
                        </p>
                        {partner.office_location_url && (
                          <a
                            href={partner.office_location_url}
                            target="_blank"
                            rel="noreferrer"
                            className="ln-btn ln-btn-primary"
                            style={{ width: '100%', textAlign: 'center', fontSize: 13, textDecoration: 'none' }}
                          >
                            <Navigation size={14} /> View on Map
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Point of Contact Card */}
                <div className="ln-card" style={{ height: 'fit-content', position: 'relative' }}>
                  <div className="ln-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>Point of Contact</h3>
                    {isOwnProfile && (
                      editingSection === 'poc' ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="ln-btn-sm ln-btn-outline" onClick={() => handleCancelEdit('poc')} disabled={saving}>Cancel</button>
                          <button className="ln-btn-sm ln-btn-primary" onClick={() => saveSection('poc')} disabled={saving}>
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      ) : (
                        <div style={{ position: 'relative' }}>
                          <button className="ln-btn-icon" onClick={() => setActiveMenu(activeMenu === 'poc' ? null : 'poc')}>
                            <MoreVertical size={18} />
                          </button>
                          {activeMenu === 'poc' && (
                            <div className="ln-popover-menu" style={{ 
                              position: 'absolute', right: 0, top: '100%', zIndex: 10,
                              background: '#fff', border: '1px solid #e2e8f0', 
                              borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                              padding: '4px', minWidth: 160, marginTop: 8
                            }}>
                              <button 
                                onClick={() => { setEditingSection('poc'); setActiveMenu(null); }}
                                style={{ 
                                  width: '100%', textAlign: 'left', padding: '8px 12px',
                                  background: 'none', border: 'none', borderRadius: 6,
                                  display: 'flex', alignItems: 'center', gap: 8,
                                  fontSize: 13, color: '#334155', cursor: 'pointer'
                                }}
                                className="ln-popover-item"
                              >
                                <Edit size={14} /> Edit POC
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                  <div style={{ padding: '0 16px 20px', textAlign: 'center' }}>
                    <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 16px' }}>
                      <div style={{
                        width: '100%', height: '100%', borderRadius: '50%',
                        background: '#f1f5f9', border: '1px solid #e2e8f0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden'
                      }}>
                        {(editingSection === 'poc' ? form.poc_photo_url : partner.poc_photo_url) ? (
                          <img src={editingSection === 'poc' ? form.poc_photo_url : partner.poc_photo_url} alt="POC" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <User size={40} color="#94a3b8" />
                        )}
                      </div>
                      {editingSection === 'poc' && (
                        <button
                          onClick={() => pocPhotoInputRef.current?.click()}
                          style={{
                            position: 'absolute', bottom: 0, right: 0,
                            background: '#fff', border: '1px solid #e2e8f0',
                            borderRadius: '50%', width: 28, height: 28,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                        >
                          <Camera size={14} />
                        </button>
                      )}
                      <input type="file" ref={pocPhotoInputRef} onChange={handlePOCPhotoUpload} style={{ display: 'none' }} accept="image/*" />
                    </div>

                    {editingSection === 'poc' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div>
                          <input
                            className="form-input"
                            style={{ textAlign: 'center', fontWeight: 700, ...(form.poc_name.length >= 50 ? { borderColor: '#f59e0b' } : {}) }}
                            placeholder="Full Name"
                            maxLength={50}
                            value={form.poc_name}
                            onChange={e => setForm({ ...form, poc_name: e.target.value.slice(0, 50) })}
                          />
                          {form.poc_name.length >= 50 && <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4, textAlign: 'center' }}>Maximum 50 characters reached</div>}
                        </div>
                        <div>
                          <input
                            className="form-input"
                            style={{ textAlign: 'center', fontSize: 13, ...(form.poc_title.length >= 50 ? { borderColor: '#f59e0b' } : {}) }}
                            placeholder="Designation / Title"
                            maxLength={50}
                            value={form.poc_title}
                            onChange={e => setForm({ ...form, poc_title: e.target.value.slice(0, 50) })}
                          />
                          {form.poc_title.length >= 50 && <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4, textAlign: 'center' }}>Maximum 50 characters reached</div>}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 15 }}>{partner.poc_name || 'Name not provided'}</div>
                        <div style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>{partner.poc_title || 'Designation'}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Documents (Moved from Sidebar) */}
              <div className="ln-card" style={{ marginTop: 20, position: 'relative' }}>
                <div className="ln-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Documents</h3>
                  {isOwnProfile && (
                    editingSection === 'documents' ? (
                      <button className="ln-btn-sm ln-btn-outline" onClick={() => setEditingSection(null)}>Done</button>
                    ) : (
                      <div style={{ position: 'relative' }}>
                        <button className="ln-btn-icon" onClick={() => setActiveMenu(activeMenu === 'documents' ? null : 'documents')}>
                          <MoreVertical size={18} />
                        </button>
                        {activeMenu === 'documents' && (
                          <div className="ln-popover-menu" style={{ 
                            position: 'absolute', right: 0, top: '100%', zIndex: 10,
                            background: '#fff', border: '1px solid #e2e8f0', 
                            borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                            padding: '4px', minWidth: 160, marginTop: 8
                          }}>
                            <button 
                              onClick={() => { setEditingSection('documents'); setActiveMenu(null); }}
                              style={{ 
                                width: '100%', textAlign: 'left', padding: '8px 12px',
                                background: 'none', border: 'none', borderRadius: 6,
                                display: 'flex', alignItems: 'center', gap: 8,
                                fontSize: 13, color: '#334155', cursor: 'pointer'
                              }}
                              className="ln-popover-item"
                            >
                              <Edit size={14} /> Manage Documents
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>

                <div style={{ padding: '0 16px 16px' }}>
                  {isOwnProfile && editingSection === 'documents' && (
                    <div style={{ marginBottom: 16, padding: 16, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                      <div style={{ marginBottom: 10 }}>
                        <label className="ln-info-label" style={{ marginBottom: 4, display: 'block' }}>Document Label <span style={{ color: '#cc1016' }}>*</span></label>
                        <input type="text" className="form-input" placeholder="e.g. Business Permit, SEC Registration..." maxLength={40} value={docLabel} onChange={e => setDocLabel(e.target.value)} style={{ fontSize: 13 }} />
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label className="ln-info-label" style={{ marginBottom: 4, display: 'block' }}>File (PDF, DOC, DOCX only) <span style={{ color: '#cc1016' }}>*</span></label>
                        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e => setDocFile(e.target.files[0] || null)} style={{ fontSize: 13 }} />
                      </div>
                      <button className="ln-btn-sm ln-btn-primary" onClick={() => { if (!docLabel.trim() || !docFile) return; showConfirm('Do you want to save this document?', handleDocUpload); }} disabled={uploading || !docFile || !docLabel.trim()} style={{ width: 'fit-content', height: 38 }}>
                        {uploading ? 'Uploading...' : <><Upload size={12} /> Upload Document</>}
                      </button>
                    </div>
                  )}

                  {(documents.length > 0 || partner.business_permit_url) ? (
                    <>
                      {partner.business_permit_url && (
                        <div className="ln-doc-item" style={{ borderLeft: '3px solid #0a66c2' }}>
                          <div className="ln-doc-info">
                            <ShieldCheck size={16} color="#0a66c2" />
                            <div>
                              <span style={{ fontWeight: 600, fontSize: 13 }}>Business Permit / Registration</span>
                              <div style={{ fontSize: 11, color: '#64748b' }}>Primary verification document</div>
                            </div>
                          </div>
                          <a href={partner.business_permit_url} target="_blank" rel="noreferrer" className="ln-btn-sm ln-btn-outline">
                            <Eye size={12} /> View
                          </a>
                        </div>
                      )}
                      {documents.map(doc => (
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
                            {isOwnProfile && editingSection === 'documents' && (
                              <button className="ln-btn-sm ln-btn-outline" onClick={() => showConfirm('Are you sure you want to delete this document?', () => deleteDoc(doc.id))} style={{ color: '#cc1016' }}>
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  ) : editingSection !== 'documents' && (
                    <EmptyState
                      illustration={DocumentIllustration}
                      title="No documents yet"
                      description="Upload company brochures, policies, or registration documents for verification and profile completeness."
                      style={{ padding: '24px 20px' }}
                    />
                  )}
                </div>
              </div>

              {/* Active Openings (Moved from Sidebar) */}
              <div className="ln-card" style={{ marginTop: 20 }}>
                <div className="ln-section-header">
                  <h3>Active Openings</h3>
                  <span className="ln-badge ln-badge-blue">{activeJobs.length} Positions</span>
                </div>
                <div style={{ padding: '0 16px 16px' }}>
                  {activeJobs.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                      {activeJobs.map(job => (
                        <div key={job.id} style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc' }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', marginBottom: 4 }}>{job.title}</div>
                          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                            <span style={{ fontSize: 10, padding: '2px 6px', background: job.opportunityType === 'Job' ? '#dcfce7' : '#fef9c3', color: job.opportunityType === 'Job' ? '#166534' : '#854d0e', borderRadius: 4, fontWeight: 600 }}>{job.opportunityType}</span>
                            {job.opportunityType !== 'OJT' && job.employmentType && (
                              <span style={{ fontSize: 10, padding: '2px 6px', background: '#f1f5f9', color: '#475569', borderRadius: 4 }}>{job.employmentType}</span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MapPin size={12} /> {job.location || 'Philippines'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      illustration={BriefcaseIllustration}
                      title="No active openings"
                      description="You haven't posted any job or OJT opportunities yet. Start posting to find the best trainees."
                      style={{ padding: '24px 20px' }}
                    />
                  )}
                </div>
              </div>
            </React.Fragment>
          )}

          {activeTab === 'Saved' && isOwnProfile && (
            <div className="ln-card">
              <div className="ln-section-header"><h3>Saved Items</h3></div>
              <div style={{ padding: '0 20px 20px' }}>
                <SavedItemsView
                  userId={partner.id}
                  userType="partner"
                  onOpenBulletin={(p) => openBulletinModal(p, 'inquire')}
                />
              </div>
            </div>
          )}

          {activeTab === 'Activity' && isOwnProfile && (
            <ProfileActivityTab profileId={partner.id} profileType="partner" isOwnProfile={isOwnProfile} />
          )}
        </div>
      </div>

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
              <button onClick={closeConfirm} style={{
                padding: '9px 24px', borderRadius: 8, border: '1px solid #d1d5db',
                background: 'white', color: '#475569', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={() => { confirmDialog.onConfirm(); closeConfirm(); }} style={{
                padding: '9px 24px', borderRadius: 8, border: 'none',
                background: '#cc1016', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
      {/* Bulletin Toast */}
      {bulletinToast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={16} color="#4ade80" />{bulletinToast}
        </div>
      )}

      {/* Bulletin Interaction Modal */}
      {bulletinModal && (() => {
        const BCFG = { training_batch: { color: '#7c3aed', emoji: '🎓' }, exam_schedule: { color: '#0ea5e9', emoji: '📅' }, certification_assessment: { color: '#16a34a', emoji: '📜' }, announcement: { color: '#d97706', emoji: '📢' } };
        const cfg = BCFG[bulletinModal.post?.post_type] || BCFG.announcement;
        const isInquiry = bulletinModal.type === 'inquire';
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
              <div style={{ background: cfg.color, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 20 }}>{cfg.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>{isInquiry ? 'Send Inquiry' : 'Submit'}</div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>{bulletinModal.post?.title}</div>
                </div>
                <button onClick={() => setBulletinModal(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={14} color="#fff" />
                </button>
              </div>
              <div style={{ padding: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                  {isInquiry ? 'Your Message *' : 'Note (optional)'}
                </label>
                <textarea
                  value={bulletinMessage}
                  onChange={e => setBulletinMessage(e.target.value)}
                  placeholder={isInquiry ? 'Type your inquiry...' : 'Add a note...'}
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

      {/* Image Crop Modal */}
      {cropModal.open && (
        <ImageCropModal 
          image={cropModal.image}
          aspect={cropModal.aspect}
          onCropComplete={onCropComplete}
          onCancel={() => setCropModal({ open: false, image: null, aspect: 1, type: null })}
        />
      )}
    </div>
  );
};

// --- PAGE: INTERVIEW CALENDAR -------------------------------------
const CalendarView = ({ setActivePage }) => {
  const { currentUser, getMatchRate } = useApp();
  const { data: partners = [] } = usePartners();
  const { data: trainees = [] } = useTrainees();
  const { data: applications = [] } = useApplications();
  const { data: jobPostings = [] } = useJobPostings();
  const livePartner = getLivePartner(currentUser, partners);

  // TanStack Query Hooks
  const { data: availabilitySlots = [] } = useAvailability(livePartner?.id);
  const { data: interviewBookings = [] } = useInterviewBookings(livePartner?.id, 'partner');
  const saveAvailabilityMutation = useSaveAvailabilitySlot();
  const deleteAvailabilityMutation = useDeleteAvailabilitySlot();
  const saveInterviewMutation = useSaveInterviewBooking();
  const sendContactMutation = useSendContactRequest();

  const verified = isVerified(livePartner);
  const navigate = useNavigate();

  const [monthOffset, setMonthOffset] = useState(0);
  const [saving, setSaving] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [calView, setCalView] = useState('month'); // 'month' or 'week'

  // Drag, Drop, and Invite State
  const [draggedTrainee, setDraggedTrainee] = useState(null);
  const [dropHoverSlot, setDropHoverSlot] = useState(null);
  const [inviteModal, setInviteModal] = useState(null);
  const [inviteMessage, setInviteMessage] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];



  const getMonthData = () => {
    const now = new Date();
    const targetMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const year = targetMonth.getFullYear();
    const month = targetMonth.getMonth();
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const weeks = [];
    let currentWeek = [];
    
    for (let i = 0; i < firstDay; i++) currentWeek.push(null);
    
    for (let i = 1; i <= daysInMonth; i++) {
      currentWeek.push(new Date(year, month, i));
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeks.push(currentWeek);
    }
    
    return { targetMonth, weeks };
  };

  const { targetMonth, weeks } = getMonthData();

  // Combine applications with interview statuses into unified bookings
  const unifiedBookings = React.useMemo(() => {
    const combined = [];
    
    // 1. From applications table (using proposedInterviewDate or interviewDate)
    applications.forEach(a => {
      const st = String(a.status || '').toLowerCase();
      const isInterviewStatus = ['interview requested', 'interview scheduled', 'reschedule requested', 'interview confirmed'].includes(st);
      if (!isInterviewStatus) return;
      
      const dateVal = a.proposedInterviewDate || a.interviewDate;
      if (!dateVal) return;

      const job = jobPostings.find(j => j.id === a.jobId);
      if (job?.partnerId !== livePartner?.id) return; // Only for this partner

      const trainee = trainees.find(t => t.id === a.traineeId);

      combined.push({
        id: `app-${a.id}`,
        type: 'application',
        originalId: a.id,
        date: new Date(dateVal),
        status: a.status,
        trainee,
        job,
        application: a
      });
    });

    // 2. From interviewBookings table (if any exist that aren't cancelled)
    interviewBookings.forEach(b => {
      if (b.status === 'cancelled') return;
      const app = applications.find(a => String(a.id) === String(b.application_id));
      const job = app ? jobPostings.find(j => String(j.id) === String(app.jobId)) : null;
      if (job?.partnerId !== livePartner?.id && b.partner_id !== livePartner?.id) return;

      // Deduplicate if we already added it via application
      if (combined.some(c => c.application?.id === app?.id)) return;

      const trainee = trainees.find(t => String(t.id) === String(b.trainee_id));

      combined.push({
        id: `booking-${b.id}`,
        type: 'booking',
        originalId: b.id,
        date: new Date(b.start_time),
        status: b.status,
        trainee,
        job,
        booking: b
      });
    });

    return combined.sort((a, b) => a.date - b.date);
  }, [applications, interviewBookings, trainees, jobPostings, livePartner?.id]);

  const today = new Date();
  const todayBookings = unifiedBookings.filter(b => b.date.toDateString() === today.toDateString());

  const currentMonthBookings = interviewBookings.filter(b => {
    if (b.status === 'cancelled') return false;
    const bDate = new Date(b.start_time);
    return bDate.getMonth() === today.getMonth() && bDate.getFullYear() === today.getFullYear();
  }).length;

  const ojtAccepted = applications.filter(a => {
    const job = jobPostings.find(j => j.id === a.jobId);
    return job?.partnerId === livePartner?.id && job?.opportunityType === 'OJT' && (a.status === 'Accepted' || a.status === 'Hired');
  }).length;

  const totalActiveSlots = availabilitySlots.length;

  const getTopMatches = () => {
    if (!livePartner?.id) return [];
    const myOpenJobs = jobPostings.filter(j => j.partnerId === livePartner.id && j.status === 'Open');
    if (myOpenJobs.length === 0) return [];

    let allMatches = [];
    trainees.forEach(trainee => {
      const theirApps = applications.filter(a => String(a.traineeId) === String(trainee.id));
      const isHired = theirApps.some(a => ['accepted', 'hired'].includes(String(a.status || '').toLowerCase()));
      if (isHired) return;

      let bestMatchJob = null;
      let bestMatchRate = 0;

      myOpenJobs.forEach(job => {
        if (theirApps.some(a => String(a.jobId) === String(job.id))) return;
        const rate = getMatchRate(trainee.id, job.id);
        if (rate > bestMatchRate) {
          bestMatchRate = rate;
          bestMatchJob = job;
        }
      });

      if (bestMatchRate >= 65 && bestMatchJob) {
        allMatches.push({ trainee, job: bestMatchJob, matchRate: bestMatchRate });
      }
    });

    return allMatches.sort((a, b) => b.matchRate - a.matchRate).slice(0, 5);
  };

  const topMatches = getTopMatches();

  // Drag and Drop Handlers
  const handleDragStart = (e, match) => {
    setDraggedTrainee(match);
    e.dataTransfer.effectAllowed = 'copy';
    setTimeout(() => { if (e.target) e.target.style.opacity = '0.5'; }, 0);
  };

  const handleDragEnd = (e) => {
    setDraggedTrainee(null);
    setDropHoverSlot(null);
    if (e.target) e.target.style.opacity = '1';
  };

  const handleDragOver = (e, dayIdx, hour, isAvail, isFull) => {
    e.preventDefault();
    if (isAvail && !isFull) {
      e.dataTransfer.dropEffect = 'copy';
      setDropHoverSlot(`${dayIdx}-${hour}`);
    } else {
      e.dataTransfer.dropEffect = 'none';
      setDropHoverSlot(null);
    }
  };

  const handleDragLeave = () => setDropHoverSlot(null);

  const handleDrop = (e, dayIdx, hour, isAvail, isFull) => {
    e.preventDefault();
    setDropHoverSlot(null);
    if (!isAvail || isFull || !draggedTrainee) return;

    const dropDate = new Date(weekDates[dayIdx]);
    dropDate.setHours(hour, 0, 0, 0);

    const timeString = hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? '12:00 PM' : `${hour}:00 AM`;

    setInviteMessage(`Hi ${draggedTrainee.trainee.name},

Your profile is a top match for our ${draggedTrainee.job.title} role! I'd love to invite you for an interview on ${dropDate.toLocaleDateString()} at ${timeString}.

If this time works, please let me know. Alternatively, you can book another available slot on my calendar.

Best,
${livePartner?.companyName}`);

    setInviteModal({
      trainee: draggedTrainee.trainee,
      job: draggedTrainee.job,
      date: dropDate,
      hour,
      isGeneral: false
    });
  };

  const handleGeneralInvite = (match) => {
    setInviteMessage(`Hi ${match.trainee.name},

Your profile stood out to us for our ${match.job.title} role! We'd love to invite you to an interview.

Please check our calendar and book a time slot that works best for you.

Best,
${livePartner?.companyName}`);
    setInviteModal({ trainee: match.trainee, job: match.job, isGeneral: true });
  };

  const submitInvite = async () => {
    if (!inviteModal) return;
    setSendingInvite(true);

    const result = await sendContactMutation.mutateAsync({
      recipientId: inviteModal.trainee.id,
      recipientType: 'student',
      jobPostingId: inviteModal.job.id,
      message: inviteMessage,
    });


    setSendingInvite(false);
    if (result.success) {
      toast.success(inviteModal.isGeneral ? 'Calendar link and invitation sent!' : 'Specific time invitation sent!');
      setInviteModal(null);
    } else {
      toast.error(result.error || 'Failed to send invitation.');
    }
  };

  const openProfile = (target) => {
    if (!target?.id || !target?.type) return;
    navigate(`/partner/profile-view/${target.type}/${target.id}`);
  };

  if (!verified) {
    return (
      <div className="ln-page-content">
        <div className="ln-page-header"><div><h1 className="ln-page-title">Interview Calendar</h1><p className="ln-page-subtitle">Manage your interview schedule</p></div></div>
        <div className="ln-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <AlertTriangle size={48} color="#d97706" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Account Verification Required</h3>
          <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.55)', maxWidth: 500, margin: '0 auto 24px' }}>Verify your account to access the interview calendar.</p>
          <button className="ln-btn ln-btn-primary" onClick={() => setActivePage('verification')}>Go to Verification</button>
        </div>
      </div>
    );
  }

  return (
    <div className="ln-page-content">
      {/* FOMO Banner */}
      {topMatches.length > 0 && (
        <div style={{
          background: 'linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%)',
          border: '1px solid #fde68a',
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 2px 8px rgba(245, 158, 11, 0.1)'
        }}>
          <div style={{ fontSize: 20 }}>📢</div>
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 700, color: '#92400e', fontSize: 14 }}>
              {topMatches.length} highly-rated trainees are looking for opportunities in your field right now.
            </span>
            <span style={{ color: '#b45309', fontSize: 13, marginLeft: 6 }}>
              Set your availability below to grab them!
            </span>
          </div>
        </div>
      )}

      <div className="ln-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="ln-page-title">Interview Calendar</h1>
          <p className="ln-page-subtitle">Set your availability to let applicants book, or drag VIP candidates to propose specific times.</p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="ln-btn ln-btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff' }} onClick={() => toast.success("Calendar link copied to clipboard!")}>
            <Share2 size={14} color="#475569" />
            <span style={{ fontWeight: 600, color: '#475569' }}>Copy Booking Link</span>
          </button>
          <button className="ln-btn ln-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0a66c2' }}>
            <RefreshCw size={14} />
            <span>Sync Outlook/Google</span>
          </button>
        </div>
      </div>

      {/* Smart Insights Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div className="ln-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
            <Calendar size={20} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{currentMonthBookings}</div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Interviews This Month</div>
          </div>
        </div>
        <div className="ln-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{ojtAccepted}</div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>OJT Trainees Accepted</div>
          </div>
        </div>
        <div className="ln-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{totalActiveSlots}</div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Active Available Slots</div>
          </div>
        </div>
      </div>

      <div className="ln-calendar-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
        {/* Calendar Grid */}
        <div className="ln-card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Calendar Color Legend */}
          <div style={{ display: 'flex', gap: 12, padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#d97706' }} /> 
              <span style={{ color: '#475569' }}>Pending Decision</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6' }} /> 
              <span style={{ color: '#475569' }}>Confirmed Interview</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#16a34a' }} /> 
              <span style={{ color: '#475569' }}>Completed</span>
            </div>
          </div>
          {/* Month Nav */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #e5e7eb' }}>
            <button className="ln-btn-sm ln-btn-outline" onClick={() => setMonthOffset(w => w - 1)}><ChevronLeft size={16} /> Prev</button>
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              {targetMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            <button className="ln-btn-sm ln-btn-outline" onClick={() => setMonthOffset(w => w + 1)}>Next <ChevronRight size={16} /></button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {dayLabels.map((d) => (
                    <th key={d} style={{ padding: '8px 4px', textAlign: 'center', background: '#f9fafb', borderRight: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', fontWeight: 700, color: '#334155', width: `${100/7}%` }}>
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeks.map((week, wIdx) => (
                  <tr key={wIdx}>
                    {week.map((date, dIdx) => {
                      if (!date) {
                        return <td key={dIdx} style={{ padding: '6px', borderRight: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }} />;
                      }

                      const isToday = date.toDateString() === today.toDateString();
                      
                      const dayBookings = unifiedBookings.filter(b => b.date.toDateString() === date.toDateString());
                      
                      const isHovered = dropHoverSlot === date.toISOString();

                      return (
                        <td
                          key={dIdx}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (draggedTrainee) {
                              e.dataTransfer.dropEffect = 'copy';
                              setDropHoverSlot(date.toISOString());
                            }
                          }}
                          onDragLeave={() => setDropHoverSlot(null)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDropHoverSlot(null);
                            if (!draggedTrainee) return;
                            
                            const timeStr = '10:00 AM'; // Default time to propose on month view
                            setInviteMessage(`Hi ${draggedTrainee.trainee.name},\n\nYour profile is a top match for our ${draggedTrainee.job.title} role! I'd love to invite you for an interview on ${date.toLocaleDateString()}.\n\nIf this date works, please let me know what time works best for you. Alternatively, you can book another available slot on my calendar.\n\nBest,\n${livePartner?.companyName}`);

                            setInviteModal({
                              trainee: draggedTrainee.trainee,
                              job: draggedTrainee.job,
                              date: date,
                              hour: 10,
                              isGeneral: false
                            });
                          }}
                          style={{
                            height: 100, verticalAlign: 'top', padding: 4,
                            borderRight: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb',
                            background: isHovered ? '#f0fdf4' : (isToday ? '#eff6ff' : '#fff'),
                            position: 'relative',
                            transition: 'background 0.2s',
                            boxShadow: isHovered ? 'inset 0 0 0 2px #22c55e' : 'none'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, padding: '2px 4px' }}>
                            <span style={{ fontWeight: 600, color: isToday ? '#2563eb' : '#64748b', fontSize: 13, background: isToday ? '#dbeafe' : 'transparent', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                              {date.getDate()}
                            </span>
                            {dayBookings.length > 0 && (
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6' }}>{dayBookings.length} appts</span>
                            )}
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', maxHeight: 68 }}>
                            {dayBookings.slice(0, 3).map((b, i) => {
                              const st = String(b.status || '').toLowerCase();
                              const isCompleted = st === 'completed';
                              const isReq = st === 'interview requested' || st === 'reschedule requested';
                              let color = '#3b82f6';
                              let bg = '#eff6ff';
                              if (isCompleted) { color = '#16a34a'; bg = '#f0fdf4'; }
                              if (isReq) { color = '#d97706'; bg = '#fef3c7'; }
                              let statusLabel = 'Confirmed';
                              if (st === 'interview requested') statusLabel = 'You Invited';
                              if (st === 'reschedule requested') statusLabel = 'Trainee Req';

                              return (
                                <div key={b.id} title={`${b.job?.title || 'Job'} - ${b.trainee?.name || 'Trainee'} (${statusLabel})`} style={{ padding: '2px 4px', borderRadius: 4, background: bg, borderLeft: `3px solid ${color}`, fontSize: 10, display: 'flex', flexDirection: 'column', gap: 1, cursor: 'pointer' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 700, color }}>{b.date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                                    {isReq && <span style={{ fontSize: 8, fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '1px 3px', borderRadius: 3 }}>{statusLabel}</span>}
                                  </div>
                                  <span style={{ color: '#1e293b', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.trainee?.name || 'Trainee'}</span>
                                </div>
                              )
                            })}
                            {dayBookings.length > 3 && (
                              <div style={{ fontSize: 10, color: '#64748b', textAlign: 'center', fontWeight: 600 }}>+{dayBookings.length - 3} more</div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Top Trainee Matches (Drag and Drop / Headhunting) */}
          <div className="ln-card">
            <div className="ln-widget-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Target size={16} color="#0a66c2" /> VIP Headhunting Matches
              </span>
            </div>

            <div style={{ padding: '10px 16px 16px' }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12, lineHeight: 1.4 }}>
                Drag these top matches to an open slot to propose a specific time, or just click to send your calendar link.
              </div>

              {topMatches.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {topMatches.map((match) => (
                    <div
                      key={`match-${match.trainee.id}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, match)}
                      onDragEnd={handleDragEnd}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: 10,
                        padding: '10px',
                        background: '#fff',
                        cursor: 'grab',
                        display: 'flex',
                        gap: 10,
                        alignItems: 'center',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        transition: 'transform 0.1s, box-shadow 0.1s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
                    >
                      <div
                        style={{ width: 36, height: 36, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', fontWeight: 700, flexShrink: 0, overflow: 'hidden', cursor: 'pointer' }}
                        onClick={() => openProfile({ id: match.trainee.id, type: 'trainee' })}
                      >
                        {match.trainee.photo ? <img src={match.trainee.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : match.trainee.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div
                            style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                            onClick={() => openProfile({ id: match.trainee.id, type: 'trainee' })}
                          >
                            {match.trainee.name}
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 800, color: '#d97706', background: '#fef3c7', padding: '2px 6px', borderRadius: 4 }}>{match.matchRate}% Match</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.job.title}</div>
                      </div>
                      {/* Quick Invite Button */}
                      <button
                        onClick={() => handleGeneralInvite(match)}
                        className="ln-btn-icon"
                        style={{ color: '#0a66c2', background: '#f0f7ff', width: 28, height: 28 }}
                        title="Send General Invite"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '20px 10px', textAlign: 'center', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1' }}>
                  <Info size={20} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>No strong matches right now</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Post more opportunities or check back later.</div>
                </div>
              )}
            </div>
          </div>

          {/* Today's Interviews Widget */}
          <div className="ln-card">
            <div className="ln-widget-header"><span>Upcoming Interviews Today</span></div>
            {todayBookings.length > 0 ? todayBookings.map(b => {
              const { trainee, job } = b;
              const bStart = b.date;
              return (
                <div key={b.id} style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', fontWeight: 700, flexShrink: 0 }}>
                    {(trainee?.name || 'T').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      onClick={() => openProfile({ id: trainee?.id, type: 'trainee' })}
                      style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
                    >
                      {trainee?.name || 'Trainee'}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{job?.title || 'Position'}</div>
                    <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600 }}>{bStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
                  </div>
                  <span className={`ln-badge ${b.status === 'scheduled' ? 'ln-badge-blue' : b.status === 'completed' ? 'ln-badge-green' : 'ln-badge-red'}`} style={{ fontSize: 10 }}>{b.status}</span>
                </div>
              );
            }) : (
              <div className="ln-empty-widget" style={{ padding: 24 }}>
                <Calendar size={28} style={{ opacity: 0.3 }} />
                <p style={{ fontSize: 13 }}>No interviews scheduled today</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trainee Invite Modal */}
      {inviteModal && (
        <div className="modal-overlay" onClick={() => setInviteModal(null)}>
          <div className="ln-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="ln-modal-header">
              <div>
                <h3 className="ln-modal-title">{inviteModal.isGeneral ? 'Send General Invite' : 'Propose Interview Time'}</h3>
                <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)', marginTop: 2 }}>
                  {inviteModal.isGeneral
                    ? `Invite ${inviteModal.trainee.name} to book an interview slot.`
                    : `Propose ${inviteModal.date.toLocaleDateString()} at ${inviteModal.hour > 12 ? inviteModal.hour - 12 : (inviteModal.hour === 12 ? 12 : inviteModal.hour)}${inviteModal.hour >= 12 ? ' PM' : ' AM'}`}
                </p>
              </div>
              <button className="ln-btn-icon" onClick={() => setInviteModal(null)}><X size={18} /></button>
            </div>

            <div style={{ padding: '0 0 16px' }}>
              <div style={{ padding: 16, background: '#f0f7ff', borderRadius: 12, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1e40af', fontSize: 16 }}>
                    {(inviteModal.trainee?.name || 'T').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{inviteModal.trainee?.name || 'Trainee'}</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>Top Match for: {inviteModal.job?.title}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Message</label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  style={{ width: '100%', minHeight: 140, padding: 12, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, resize: 'vertical' }}
                />
              </div>
            </div>

            <div className="ln-modal-footer">
              <button className="ln-btn ln-btn-outline" onClick={() => setInviteModal(null)}>Cancel</button>
              <button className="ln-btn ln-btn-primary" disabled={sendingInvite} onClick={submitInvite}>
                <Send size={15} /> {sendingInvite ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PartnerProfileViewRoute = (props) => {
  const { profileType, profileId } = useParams();
  const navigate = useNavigate();
  const normalizedProfileType = normalizeProfileType(profileType);

  if (normalizedProfileType === 'partner') {
    return <CompanyProfile viewedPartnerId={profileId} onBack={() => navigate(-1)} />;
  }

  if (normalizedProfileType === 'trainee') {
    return (
      <React.Suspense fallback={<div className="ln-page-content"><div className="ln-empty-state"><p>Loading profile...</p></div></div>}>
        <TraineeProfileContent viewedProfileId={profileId} onBack={() => navigate(-1)} {...props} />
      </React.Suspense>
    );
  }

  return (
    <TraineeProfileContent
      profileId={profileId}
      profileType={normalizedProfileType || profileType}
      onBack={() => navigate(-1)}
      {...props}
    />
  );
};

// --- VERIFICATION ROUTE GUARD ------------------------------------
const VerificationRouteGuard = ({ setActivePage }) => {
  const { currentUser } = useApp();
  const { data: partners = [] } = usePartners();
  const livePartner = getLivePartner(currentUser, partners);
  if (isVerified(livePartner)) {
    return <Navigate to="/partner" replace />;
  }
  return <VerificationPage setActivePage={setActivePage} />;
};

// --- MAIN EXPORT --------------------------------------------------
export default function PartnerDashboard() {
  const { currentUser } = useApp();
  const sendContactMutation = useSendContactRequest();

  const navigate = useNavigate();
  const location = useLocation();

  // Unified Action States
  const [contactTarget, setContactTarget] = useState(null);
  const [contactMessage, setContactMessage] = useState('');
  const [contactAttachment, setContactAttachment] = useState(null);
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const contactFileInputRef = useRef(null);

  // Deduce active page from URL for visual consistency in child components
  const path = location.pathname.split('/').pop();
  const activePage = location.pathname.includes('/profile-view/') ? 'dashboard' : ((path === 'partner' || !path) ? 'dashboard' : path);

  // Mock setActivePage to use navigate for smooth integration with existing buttons
  const setActivePage = (page) => {
    if (page === 'dashboard') {
      navigate('/partner');
    } else {
      navigate(`/partner/${page}`);
    }
  };

  const openContactModal = (target) => {
    setContactTarget(target);
    setContactMessage('');
    setContactAttachment(null);
  };

  const handleSubmitContact = async () => {
    if (!contactTarget) return;
    const trimmed = contactMessage.trim();
    if (!trimmed) { toast.error('Message is required.'); return; }

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

      const result = await sendContactMutation.mutateAsync({
        recipientId: contactTarget.recipientId,
        recipientType: contactTarget.recipientType,
        postId: contactTarget.postId || null,
        jobPostingId: contactTarget.jobPostingId || null,
        message: trimmed,
        attachmentName,
        attachmentUrl,
        attachmentKind: 'document',
      });


      if (!result.success) {
        toast.error(result.error || 'Failed to send contact request.');
        return;
      }

      setContactTarget(null);
      toast.success('Contact request sent.');
    } catch (err) {
      console.error('Contact submit error:', err);
      toast.error(err.message || 'Failed to send contact request.');
    } finally {
      setContactSubmitting(false);
    }
  };

  if (!currentUser) return null;

  return (
    <>
      

      <PartnerLayout activePage={activePage} setActivePage={setActivePage}>
        <Routes>
          <Route path="/" element={<PartnerHome setActivePage={setActivePage} openContactModal={openContactModal} />} />
          <Route path="/post-job" element={<PostJob setActivePage={setActivePage} />} />
          <Route path="/calendar" element={<CalendarView setActivePage={setActivePage} />} />
          <Route path="/applicants" element={<ViewApplicants setActivePage={setActivePage} />} />
          <Route path="/profile" element={<CompanyProfile />} />
          <Route path="/verification" element={<VerificationRouteGuard setActivePage={setActivePage} />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile-view/:profileType/:profileId" element={<PartnerProfileViewRoute openContactModal={openContactModal} />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="*" element={<Navigate to="/partner" replace />} />
        </Routes>
      </PartnerLayout>

      {/* Unified Contact Modal */}
      {contactTarget && (
        <div className="modal-overlay" onClick={() => setContactTarget(null)}>
          <div className="ln-modal" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 520 }}>
            <div className="ln-modal-header">
              <div>
                <h3 className="ln-modal-title">Contact {contactTarget.recipientName}</h3>
                <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)', marginTop: 2 }}>Send a message to this user.</p>
              </div>
              <button className="ln-btn-icon" onClick={() => setContactTarget(null)}><X size={18} /></button>
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
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>Attachment (Optional)</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button onClick={() => contactFileInputRef.current?.click()} className="ln-btn ln-btn-outline" style={{ flex: 1 }}>
                    <Upload size={14} /> {contactAttachment ? contactAttachment.name : 'Choose File'}
                  </button>
                  <input ref={contactFileInputRef} type="file" onChange={e => setContactAttachment(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                </div>
              </div>
              <div className="ln-modal-footer" style={{ padding: 0 }}>
                <button className="ln-btn ln-btn-outline" onClick={() => setContactTarget(null)} disabled={contactSubmitting}>Cancel</button>
                <button className="ln-btn ln-btn-primary" onClick={handleSubmitContact} disabled={contactSubmitting || !contactMessage.trim()}>
                  {contactSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}








