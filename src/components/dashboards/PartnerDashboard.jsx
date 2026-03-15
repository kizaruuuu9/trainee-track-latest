import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard, Briefcase, FileText, Users, Building2, LogOut,
  ChevronDown, Search, Plus, Eye, X, CheckCircle, XCircle,
  MapPin, Send, Award, ChevronRight, Trash2, Menu, Lock,
  Upload, AlertTriangle, Clock, ShieldCheck, FileCheck,
  Bell, Home, Settings, TrendingUp, Bookmark, Target, Star,
  Camera, MessageSquare, Edit, Loader, ExternalLink
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Routes, Route, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import ProfilePage from '../ProfilePage';

const TraineeProfileContent = React.lazy(() =>
  import('./TraineeDashboard').then(module => ({ default: module.TraineeProfileContent }))
);

/* ═══════════════════════════════════════════════════════════════════
   LINKEDIN-STYLE PARTNER DASHBOARD
   ═══════════════════════════════════════════════════════════════════ */

// ─── HELPERS ──────────────────────────────────────────────────────
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
const DEFAULT_PARTNER_PUBLIC_INFO_FIELDS = ['companyName', 'contactPerson', 'industry'];
const resolvePartnerVisibility = (profile) => {
  const value = profile?.companyInfoVisibility ?? profile?.company_info_visibility;
  return Array.isArray(value) ? value : DEFAULT_PARTNER_PUBLIC_INFO_FIELDS;
};

const normalizePartnerProfile = (profile) => {
  if (!profile) return null;

  const address = profile.address
    || [profile.detailed_address, profile.city, profile.province, profile.region].filter(Boolean).join(', ')
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
    photo: profile.photo || profile.company_logo_url || null,
    company_logo_url: profile.company_logo_url || profile.photo || null,
    companyInfoVisibility: resolvePartnerVisibility(profile),
    verificationStatus,
  };
};

// ─── STATUS BADGE HELPER ──────────────────────────────────────────
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

// ─── TOP NAVIGATION BAR (LinkedIn-style for Partners) ─────────────
const PartnerTopNav = ({ activePage, setActivePage }) => {
  const { currentUser, partners, logout } = useApp();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const livePartner = getLivePartner(currentUser, partners);
  const verified = isVerified(livePartner);
  const initials = livePartner?.companyName?.charAt(0)?.toUpperCase() || 'P';

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: <Home size={20} /> },
    { id: 'profile', label: 'Company', icon: <Building2 size={20} /> },
    ...(!verified ? [{ id: 'verification', label: 'Verification', icon: <ShieldCheck size={20} /> }] : []),
    { id: 'post-job', label: 'Post Opportunities', icon: <Plus size={20} />, locked: !verified },
    { id: 'applicants', label: 'Recruit', icon: <Users size={20} />, locked: !verified },
  ];

  return (
    <header className="ln-topnav pn-topnav">
      <div className="ln-topnav-inner">
        {/* Left: Logo + Search */}
        <div className="ln-topnav-left">
          <div className="ln-logo">
            <span className="ln-logo-icon pn-logo-icon">TT</span>
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
              className={`ln-nav-item ${activePage === item.id ? 'active' : ''} ${item.locked ? 'pn-locked' : ''}`}
              onClick={() => { if (!item.locked) setActivePage(item.id); }}
              title={item.locked ? 'Verification required' : item.label}
              style={item.locked ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
            >
              {item.icon}
              <span className="ln-nav-label">{item.label}</span>
              {item.locked && <Lock size={9} style={{ position: 'absolute', top: 6, right: 8, color: '#94a3b8' }} />}
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
                  { text: 'New application received for Web Developer Trainee', time: '1h ago' },
                  { text: 'Your job posting was viewed 12 times today', time: '3h ago' },
                  { text: 'Trainee Juan Dela Cruz matched 70% for your OJT posting', time: '1d ago' },
                ].map((n, i) => (
                  <div key={i} className="ln-dropdown-item">
                    <div className="ln-notif-avatar"><Users size={16} /></div>
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
              <div className="ln-nav-avatar pn-nav-avatar">{initials}</div>
              <span className="ln-nav-label">
                Me <ChevronDown size={12} style={{ marginLeft: 2 }} />
              </span>
            </button>
            {showProfileMenu && (
              <div className="ln-dropdown" style={{ right: 0, minWidth: 260 }}>
                <div className="ln-dropdown-profile">
                  <div className="ln-dropdown-profile-avatar pn-dropdown-avatar">{initials}</div>
                  <div>
                    <div className="ln-dropdown-profile-name">{livePartner?.companyName || 'Partner'}</div>
                    <div className="ln-dropdown-profile-role">Industry Partner</div>
                  </div>
                </div>
                <button className="ln-dropdown-profile-btn" onClick={() => { setActivePage('profile'); setShowProfileMenu(false); }}>
                  View Company Profile
                </button>
                {!verified && (<>
                  <div className="ln-dropdown-divider" />
                  <div className="ln-dropdown-item" onClick={() => { setActivePage('verification'); setShowProfileMenu(false); }}>
                    <ShieldCheck size={16} /> Verification
                  </div>
                </>)}
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
              onClick={() => { if (!item.locked) { setActivePage(item.id); setMobileMenuOpen(false); } }}
              style={item.locked ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.locked && <Lock size={12} style={{ marginLeft: 'auto', color: '#94a3b8' }} />}
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
const PartnerLayout = ({ children, activePage, setActivePage }) => (
  <div className="ln-app">
    <PartnerTopNav activePage={activePage} setActivePage={setActivePage} />
    <main className="ln-main">
      {children}
    </main>
  </div>
);

// ─── LEFT: COMPANY PROFILE CARD ──────────────────────────────────
const CompanySideCard = ({ partner, setActivePage }) => {
  const initials = partner?.companyName?.charAt(0)?.toUpperCase() || 'P';
  const verified = isVerified(partner);
  return (
    <div className="ln-card ln-profile-card">
      <div className="ln-profile-banner pn-profile-banner" />
      <div className="ln-profile-card-body">
        <div className="ln-profile-avatar-wrap">
          <div className="ln-profile-avatar-lg pn-avatar-lg">{initials}</div>
        </div>
        <h2 className="ln-profile-name" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {partner?.companyName}
          {isVerified(partner) && <CheckCircle size={16} color="#0a66c2" title="Verified" style={{ flexShrink: 0 }} />}
        </h2>
        <p className="ln-profile-headline">{partner?.industry} &bull; Industry Partner</p>
        <p className="ln-profile-location"><MapPin size={13} /> {partner?.address || 'Philippines'}</p>

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
            <span className="ln-profile-stat-num pn-stat-num">{partner?.contactPerson ? '✓' : '—'}</span>
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

// ─── RIGHT: QUICK ACTIONS WIDGET ─────────────────────────────────
const QuickActionsWidget = ({ setActivePage, verified }) => (
  <div className="ln-card ln-widget">
    <div className="ln-widget-header"><span>Quick Actions</span></div>
    {[
      { label: 'Post Opportunities', icon: <Plus size={16} />, page: 'post-job', locked: !verified },
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
      { label: 'Open Positions', value: myJobs.filter(j => j.status === 'Open').length, color: '#0ea5e9' },
      { label: 'Total Applicants', value: myApplicants.length, color: '#7c3aed' },
      { label: 'Accepted', value: myApplicants.filter(a => a.status === 'Accepted').length, color: '#16a34a' },
      { label: 'Pending Review', value: myApplicants.filter(a => a.status === 'Pending').length, color: '#d97706' },
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

// ─── PAGE 1: PARTNER DASHBOARD HOME ──────────────────────────────
const PartnerHome = ({ setActivePage }) => {
  const { currentUser, partners, jobPostings, getPartnerApplicants, posts, createPost, trainees, addPostComment, getPostComments, addJobPostingComment, getJobPostingComments, updateJobPostingComment, deleteJobPostingComment, sendContactRequest } = useApp();
  const navigate = useNavigate();
  const partner = getLivePartner(currentUser, partners);
  const verified = isVerified(partner);
  const myJobs = jobPostings.filter(j => j.partnerId === partner?.id);
  const myApplicants = getPartnerApplicants(partner?.id);
  const initials = partner?.companyName?.charAt(0)?.toUpperCase() || 'P';

  // Create Post state
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
  const [jobMediaModal, setJobMediaModal] = useState(null);
  const [jobMediaCommentsOnly, setJobMediaCommentsOnly] = useState(false);
  const [jobMediaCommentInput, setJobMediaCommentInput] = useState('');
  const [editingJobMediaCommentId, setEditingJobMediaCommentId] = useState(null);
  const [jobMediaEditInput, setJobMediaEditInput] = useState('');
  const [jobMediaCommentSaving, setJobMediaCommentSaving] = useState(false);
  const [jobMediaCommentMenuId, setJobMediaCommentMenuId] = useState(null);
  const [isCompactCommentViewport, setIsCompactCommentViewport] = useState(() => (
    typeof window !== 'undefined' ? window.innerWidth <= 1024 : false
  ));
  const fileInputRef = useRef(null);
  const contactFileInputRef = useRef(null);
  const jobMediaCommentInputRef = useRef(null);
  const openProfile = (target) => {
    if (!target?.id || !target?.type) return;
    navigate(`/partner/profile-view/${target.type}/${target.id}`);
  };

  const openJobMediaModal = (job, focusComment = false) => {
    setJobMediaModal(job);
    setJobMediaCommentsOnly(Boolean(focusComment));
    setJobMediaCommentInput('');
    setEditingJobMediaCommentId(null);
    setJobMediaEditInput('');
    setJobMediaCommentMenuId(null);
    if (focusComment) {
      setTimeout(() => jobMediaCommentInputRef.current?.focus(), 0);
    }
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
        tags: [partner?.industry, 'Hiring', 'Announcement'].filter(Boolean)
      });

      if (res.success) {
        setPostContent('');
        setPostType('general');
        setSelectedFile(null);
        setFilePreview(null);
      } else {
        alert(res.error || 'Failed to post');
      }
    } catch (err) {
      console.error('Posting error:', err);
      alert('Failed to post: ' + err.message);
    } finally {
      setIsPosting(false);
    }
  };

  const handleCommentOnPost = (post) => {
    setCommentModalPost(post);
    setCommentInput('');
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
    if (!trimmed) {
      alert('Message is required.');
      return;
    }

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

      const result = await sendContactRequest({
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

  const handleSubmitComment = async () => {
    if (!commentModalPost) return;
    const trimmed = commentInput.trim();
    if (!trimmed) return;

    setCommentSubmitting(true);
    const res = await addPostComment(commentModalPost.id, trimmed);
    setCommentSubmitting(false);
    if (!res.success) {
      alert(res.error || 'Failed to add comment.');
      return;
    }
    setCommentInput('');
  };

  // Unified Feed logic: Mix Jobs and Posts, sort by date
  const unifiedFeed = [
    ...posts.map(p => ({ ...p, feedType: 'post' })),
    ...jobPostings.map(j => ({ ...j, feedType: 'job' }))
  ].sort((a, b) => new Date(b.created_at || b.createdAt || b.datePosted) - new Date(a.created_at || a.createdAt || a.datePosted));

  const stats = [
    { label: 'Active Postings', value: myJobs.filter(j => j.status === 'Open').length, icon: <Briefcase size={20} />, color: '#0ea5e9' },
    { label: 'Total Applicants', value: myApplicants.length, icon: <Users size={20} />, color: '#7c3aed' },
    { label: 'Accepted', value: myApplicants.filter(a => a.status === 'Accepted').length, icon: <CheckCircle size={20} />, color: '#16a34a' },
    { label: 'Avg Match', value: myApplicants.length > 0 ? `${Math.round(myApplicants.reduce((s, a) => s + a.matchRate, 0) / myApplicants.length)}%` : '0%', icon: <Target size={20} />, color: '#d97706' },
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
  const contactRecipientName = contactTarget?.recipientName || 'Recipient';
  const jobMediaComments = jobMediaModal ? getJobPostingComments(jobMediaModal.id) : [];
  const useCommentsOnlyJobModal = isCompactCommentViewport && jobMediaCommentsOnly;
  const useCompactPostCommentModal = isCompactCommentViewport;

  return (
    <div className="ln-three-col">
      {/* Left Column - Company Card */}
      <div className="ln-col-left">
        <CompanySideCard partner={partner || currentUser} setActivePage={setActivePage} />
      </div>

      {/* Center Column - Feed */}
      <div className="ln-col-center">
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

        {/* Create Post Card */}
        <div className="ln-card" style={{ padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="ln-nav-avatar pn-nav-avatar" style={{ flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ flex: 1 }}>
              <textarea
                className="ln-search-input"
                placeholder="Share a hiring update or company announcement..."
                maxLength={500}
                style={{
                  width: '100%', minHeight: postContent ? 80 : 45, padding: '12px 16px',
                  borderRadius: 24, border: '1px solid rgba(0,0,0,0.15)',
                  resize: 'none', transition: 'all 0.2s', fontSize: 14,
                  background: '#f9fafb'
                }}
                value={postContent}
                onChange={e => setPostContent(e.target.value)}
              />
              {(postContent || selectedFile) && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <select
                        className="ln-filter-select"
                        style={{ margin: 0, padding: '4px 8px', height: 32, fontSize: 12 }}
                        value={postType}
                        onChange={e => setPostType(e.target.value)}
                      >
                        <option value="general">General Update</option>
                        <option value="announcement">Announcement</option>
                        <option value="hiring_update">Hiring Update</option>
                      </select>
                      <input
                        type="file"
                        hidden
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*,.pdf,.doc,.docx"
                      />
                      <Camera
                        size={20}
                        color="#65676b"
                        cursor="pointer"
                        onClick={() => fileInputRef.current.click()}
                      />
                    </div>
                    <button
                      className="ln-btn-sm ln-btn-primary"
                      style={{ borderRadius: 16, padding: '6px 16px' }}
                      onClick={handleCreatePost}
                      disabled={isPosting || (!postContent.trim() && !selectedFile)}
                    >
                      {isPosting ? 'Posting...' : 'Post'}
                    </button>
                  </div>

                  {filePreview && (
                    <div className="ln-media-frame ln-media-frame-preview" style={{ position: 'relative', marginTop: 12 }}>
                      <img src={filePreview} alt="Preview" className="ln-media-image" />
                      <button
                        style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}

                  {selectedFile && !filePreview && (
                    <div style={{ marginTop: 12, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileText size={16} color="#65676b" />
                        <span style={{ fontSize: 12, fontWeight: 500 }}>{selectedFile.name}</span>
                      </div>
                      <X size={14} color="#65676b" cursor="pointer" onClick={() => setSelectedFile(null)} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Unified Community Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="ln-section-header" style={{ marginBottom: 0 }}>
            <h3 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(0,0,0,0.6)' }}>Community Activity</h3>
          </div>
          {unifiedFeed.map(item => {
            if (item.feedType === 'job') {
              const myJob = item.partnerId === currentUser?.id;
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
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', font: 'inherit', textAlign: 'left' }}
                        >
                          {item.companyName}
                        </button>
                        {myJob && <span className="ln-badge ln-badge-blue" style={{ fontSize: 10, marginLeft: 4 }}>Your Post</span>}
                      </div>
                      <div className="ln-feed-meta">
                        {[
                          (item.industry && String(item.industry).trim().toLowerCase() !== 'general') ? item.industry : '',
                          item.location,
                          item.salaryRange,
                          timeAgo(item.created_at || item.createdAt || item.datePosted),
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
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span className="ln-opp-type-badge">{item.opportunityType}</span>
                      {item.opportunityType !== 'OJT' && item.employmentType && (
                        <span className="ln-opp-type-badge" style={{ background: '#f8fafc', color: '#64748b' }}>{item.employmentType}</span>
                      )}
                      {item.ncLevel && (
                        <span className="ln-opp-type-badge" style={{ background: '#ede9fe', color: '#6d28d9' }}>{item.ncLevel}</span>
                      )}
                    </div>
                    {jobComments.length > 0 && (
                      <div style={{ marginTop: 10, fontSize: 12, color: '#64748b', display: 'flex', gap: 14 }}>
                        {jobComments.length > 0 && <span>{jobComments.length} comment{jobComments.length === 1 ? '' : 's'}</span>}
                      </div>
                    )}
                  </div>
                  <div className="ln-feed-actions" style={{ borderTop: '1px solid #f3f3f3', padding: '8px 12px' }}>
                    <button className="ln-feed-action-btn" onClick={() => setActivePage(myJob ? 'applicants' : 'dashboard')}>
                      {myJob ? <><Users size={14} /> View Applicants</> : <><Eye size={14} /> View Opportunity</>}
                    </button>
                    <button className="ln-feed-action-btn" onClick={() => openJobMediaModal(item, true)}>
                      <MessageSquare size={14} /> Comment ({jobComments.length})
                    </button>
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
              const author = isStudentAuthorType(item.author_type)
                ? trainees.find(t => t.id === item.author_id)
                : (partners.find(p => p.id === item.author_id) || (item.author_id === currentUser?.id ? currentUser : null));
              const authorProfileType = toProfileAuthorType(item.author_type);

              const authorInitial = author?.name?.charAt(0) || author?.companyName?.charAt(0) || '?';
              const isMe = item.author_id === currentUser?.id;
              const comments = getPostComments(item.id);
              const getCommentAuthorName = (comment) => {
                if (comment.author_id === currentUser?.id) return partner?.companyName || currentUser.companyName || currentUser.name || 'You';
                if (isStudentAuthorType(comment.author_type)) {
                  const student = trainees.find(t => t.id === comment.author_id);
                  return student?.name || 'Trainee';
                }
                const company = partners.find(p => p.id === comment.author_id);
                return company?.companyName || 'Industry Partner';
              };

              return (
                <div key={`post-${item.id}`} className="ln-card ln-feed-card" style={{ marginBottom: 0 }}>
                  <div className="ln-feed-card-header">
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
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', font: 'inherit', textAlign: 'left' }}
                        >
                          {author?.name || author?.profileName || author?.companyName || 'Unknown User'}
                        </button>
                        {isMe && <span className="ln-badge ln-badge-gray" style={{ fontSize: 10 }}>You</span>}
                        {item.post_type !== 'general' && (
                          <span className="ln-badge ln-badge-blue" style={{ fontSize: 10 }}>
                            {item.post_type.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <div className="ln-feed-meta">
                        {isStudentAuthorType(item.author_type) ? 'TESDA Trainee' : 'Industry Partner'} &bull; {timeAgo(item.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="ln-feed-content">
                    <p style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>{item.content}</p>
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
                        recipientName: author?.name || author?.profileName || author?.companyName || 'Community User',
                        postId: item.id,
                        sourceLabel: item.content,
                      })}
                      disabled={isMe}
                      style={isMe ? { opacity: 0.55, cursor: 'not-allowed' } : undefined}
                    >
                      <MessageSquare size={16} /> {isMe ? 'Your Post' : 'Contact'}
                    </button>
                    <button className="ln-feed-action-btn" onClick={() => handleCommentOnPost(item)}><MessageSquare size={16} /> Comment ({comments.length})</button>
                  </div>
                </div>
              );
            }
          })}
          {unifiedFeed.length === 0 && (
            <div className="ln-empty-state"><TrendingUp size={48} /><h3>No community activity</h3><p>Post an update to start the conversation.</p></div>
          )}
        </div>
      </div>

      {/* Right Column - Widgets */}
      <div className="ln-col-right">
        <QuickActionsWidget setActivePage={setActivePage} verified={verified} />
        <RecruitmentStatsWidget myJobs={myJobs} myApplicants={myApplicants} />
      </div>

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
              background: useCommentsOnlyJobModal ? '#ffffff' : '#0f172a'
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
                        jobMediaModal.salaryRange,
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
                    ? (partner?.companyName || currentUser?.companyName || currentUser?.name || 'You')
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
                  placeholder={`Comment as ${partner?.companyName || currentUser?.companyName || currentUser?.name || 'You'}`}
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
                  Send a message and optionally attach a document.
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
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Document Upload</label>
                <input ref={contactFileInputRef} type="file" onChange={handleContactAttachmentChange} style={{ display: 'none' }} />
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button type="button" className="ln-btn ln-btn-outline" onClick={() => contactFileInputRef.current?.click()}>
                    <Upload size={14} /> Choose File
                  </button>
                  <span style={{ fontSize: 13, color: contactAttachment ? '#0f172a' : '#64748b' }}>
                    {contactAttachment ? contactAttachment.name : 'No file selected.'}
                  </span>
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>Optional for partner-to-student or partner-to-partner contact.</div>
              </div>
            </div>

            <div style={{ padding: '16px 22px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#ffffff' }}>
              <button className="ln-btn ln-btn-outline" onClick={closeContactModal} disabled={contactSubmitting}>Cancel</button>
              <button className="ln-btn ln-btn-primary" onClick={handleSubmitContact} disabled={contactSubmitting || !contactMessage.trim()}>
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

            <div style={{ flex: '1 1 44%', minHeight: 0, display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', padding: 12, display: 'flex', flexDirection: 'column', gap: 10, background: '#ffffff' }}>
                {modalComments.length > 0 ? modalComments.map(comment => {
                  const commentAuthorName = comment.author_id === currentUser?.id
                    ? (partner?.companyName || currentUser.companyName || currentUser.name || 'You')
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
                    {(partner?.company_logo_url || partner?.photo)
                      ? <img src={partner.company_logo_url || partner.photo} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      : (partner?.companyName || currentUser?.companyName || currentUser?.name || 'P').charAt(0).toUpperCase()}
                  </div>

                    <div style={{ flex: 1, background: '#f8fafc', borderRadius: 20, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <textarea
                      placeholder={`Comment as ${partner?.companyName || currentUser?.companyName || currentUser?.name || 'Industry Partner'}`}
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
    </div>
  );
};

// ─── PAGE: VERIFICATION ───────────────────────────────────────────
const VerificationPage = () => {
  const { currentUser, partners, submitPartnerDocuments, withdrawPartnerSubmission } = useApp();
  const livePartner = getLivePartner(currentUser, partners);
  const status = livePartner?.verificationStatus || 'Pending';
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => { if (livePartner?.id) fetchDocs(); }, [livePartner?.id]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only PDF, JPG, and PNG files are allowed.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      alert('File size must be under 3MB.');
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
          alert(err.error || 'Upload failed.');
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload document.');
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
      alert('Please upload at least one document before submitting.');
      return;
    }
    submitPartnerDocuments(livePartner.id);
  };

  const handleWithdraw = () => {
    if (window.confirm('Are you sure you want to withdraw your submission? You can edit your documents and resubmit later.')) {
      withdrawPartnerSubmission(livePartner.id);
    }
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

      {/* Status Card */}
      <div className="ln-card" style={{ marginBottom: 16 }}>
        <div className="ln-section-header"><h3>Verification Status</h3></div>
        <div style={{ padding: '0 16px 16px' }}>
          <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', lineHeight: 1.6 }}>
            {status === 'Verified'
              ? 'Your account is fully verified. You can post jobs and OJT opportunities.'
              : status === 'Under Review'
                ? 'Your documents are being reviewed by our administrators. Please wait for approval.'
                : status === 'Rejected'
                  ? 'Your verification was rejected. You may re-upload documents and submit again.'
                  : 'Upload your company verification documents below to begin the verification process.'}
          </p>
        </div>
      </div>

      {status === 'Verified' && (
        <div className="ln-card" style={{ marginBottom: 16, borderLeft: '4px solid #16a34a', background: '#f0fdf4' }}>
          <div style={{ padding: 16, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <CheckCircle size={22} color="#16a34a" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#166534', marginBottom: 4 }}>Your company is already verified</div>
              <p style={{ fontSize: 13, color: '#166534', lineHeight: 1.6, margin: 0 }}>
                Your verification has been approved by the administrators. You now have access to posting opportunities and handling trainee applicants.
              </p>
            </div>
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

      {/* Upload Section */}
      {status !== 'Verified' && (
        <div className="ln-card" style={{ marginBottom: 16 }}>
          <div className="ln-section-header"><h3>Upload Verification Documents</h3></div>
          <div style={{ padding: '0 16px 16px' }}>

            {/* Uploaded docs list */}
            {documents.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                {documents.map(doc => (
                  <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 8 }}>
                    <FileCheck size={18} color="#16a34a" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{doc.label}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.file_name}</div>
                    </div>
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0ea5e9', flexShrink: 0 }} title="View">
                      <Eye size={16} />
                    </a>
                    {!isSubmitted && (
                      <button onClick={() => setConfirmDeleteId(doc.id)} style={{ padding: 4, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }} title="Remove">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add Document Row — only when not yet submitted */}
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
      )}


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

// ─── PAGE: POST OPPORTUNITIES ─────────────────────────────────────
const PostJob = ({ setActivePage, opportunityType = 'Job' }) => {
  const { addJobPosting, currentUser, partners, programs } = useApp();
  const livePartner = getLivePartner(currentUser, partners);
  const programOptions = Array.isArray(programs) ? programs : [];
  const firstProgram = programOptions[0] || null;
  const [posting, setPosting] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [form, setForm] = useState({
    title: '', opportunityType, programId: firstProgram?.id || '', ncLevel: firstProgram?.name || '', description: '',
    employmentType: opportunityType === 'OJT' ? '' : 'Full-time', location: '', salaryRange: '',
    requiredCompetencies: firstProgram?.competencies || [],
    attachmentName: '', attachmentType: '', attachmentUrl: '',
  });

  useEffect(() => {
    if (!form.ncLevel && programOptions.length > 0) {
      setForm(prev => ({
        ...prev,
        programId: programOptions[0].id,
        ncLevel: programOptions[0].name,
        requiredCompetencies: programOptions[0].competencies || [],
      }));
    }
  }, [form.ncLevel, programOptions]);

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
      alert('Only image files, PDF, DOC, and DOCX are allowed.');
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
    if (!form.title || !form.location) return alert('Title and location are required.');
    if (!form.ncLevel) return alert('Please select a TESDA program.');

    try {
      setPosting(true);

      let finalAttachmentUrl = '';
      let finalAttachmentName = '';
      let finalAttachmentType = '';

      if (attachmentFile && currentUser?.id) {
        const timestamp = Date.now();
        const safeName = attachmentFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `opportunity-attachments/${currentUser.id}/${timestamp}_${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from('registration-uploads')
          .upload(storagePath, attachmentFile, { contentType: attachmentFile.type, upsert: true });

        if (uploadError) {
          throw new Error(uploadError.message || 'Failed to upload attachment.');
        }

        const { data: urlData } = supabase.storage.from('registration-uploads').getPublicUrl(storagePath);
        finalAttachmentUrl = urlData?.publicUrl || '';
        finalAttachmentName = attachmentFile.name;
        finalAttachmentType = attachmentFile.type || '';
      }

      const result = await addJobPosting({
        ...form,
        salaryRange: form.salaryRange?.trim() || '',
        attachmentName: finalAttachmentName,
        attachmentType: finalAttachmentType,
        attachmentUrl: finalAttachmentUrl,
      });

      if (!result?.success) {
        alert(result?.error || 'Failed to post opportunity.');
        return;
      }

      alert('Opportunity posted successfully!');
      setActivePage('dashboard');
    } catch (error) {
      alert(error?.message || 'Failed to post opportunity.');
    } finally {
      setPosting(false);
    }
  };

  const previewTitle = form.title?.trim() || (form.opportunityType === 'OJT' ? 'Web Dev OJT Trainee' : 'Junior IT Technician');
  const previewLocation = form.location?.trim() || 'Location not set';
  const previewCompany = livePartner?.companyName || 'Your Company';
  const previewIndustry = livePartner?.industry || livePartner?.businessType || '';
  const previewSalary = form.salaryRange?.trim() || '';
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

  return (
    <div className="ln-page-content">
      <div className="ln-page-header">
        <div>
          <h1 className="ln-page-title">Post Opportunities</h1>
          <p className="ln-page-subtitle">Create a new opportunity posting</p>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="ln-profile-two-col">
          <div className="ln-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'rgba(0,0,0,0.9)', marginBottom: 16 }}>Opportunity Details</h3>
            <div className="form-group">
              <label className="ln-info-label">Title *</label>
              <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder={opportunityType === 'OJT' ? 'e.g. Web Dev OJT Trainee' : 'e.g. Junior IT Technician'} maxLength={100} required />
            </div>
            <div className="form-group">
              <label className="ln-info-label">Opportunity Type *</label>
              <select
                className="form-select"
                value={form.opportunityType}
                onChange={e => {
                  const nextType = e.target.value;
                  setForm(prev => ({
                    ...prev,
                    opportunityType: nextType,
                    employmentType: nextType === 'OJT' ? '' : (prev.employmentType || 'Full-time')
                  }));
                }}
              >
                <option>Job</option><option>OJT</option><option>Apprenticeship</option>
              </select>
            </div>
            <div className="form-group">
              <label className="ln-info-label">Program Required / NC Level Required *</label>
              <select
                className="form-select"
                value={form.programId || ''}
                onChange={e => {
                  const selected = programOptions.find(program => String(program.id) === e.target.value);
                  setForm({
                    ...form,
                    programId: selected?.id || '',
                    ncLevel: selected?.name || '',
                    requiredCompetencies: selected?.competencies || [],
                  });
                }}
              >
                {programOptions.length === 0 && <option value="">No programs available</option>}
                {programOptions.map(program => (
                  <option key={program.id} value={program.id}>{program.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="ln-info-label">Description</label>
              <textarea className="form-input" rows={4} maxLength={1000} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the opportunity..." />
            </div>
            {form.opportunityType !== 'OJT' && (
              <div className="form-group">
                <label className="ln-info-label">Employment Type</label>
                <select className="form-select" value={form.employmentType} onChange={e => setForm({ ...form, employmentType: e.target.value })}>
                  <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option>
                </select>
              </div>
            )}
            <div className="ln-info-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="ln-info-label">Location *</label>
                <input className="form-input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="City" maxLength={100} required />
              </div>
              <div className="form-group">
                <label className="ln-info-label">Salary Range (Optional)</label>
                <input className="form-input" value={form.salaryRange} onChange={e => setForm({ ...form, salaryRange: e.target.value })} placeholder="₱15,000 – ₱20,000/month" maxLength={50} />
              </div>
            </div>
            <div className="form-group">
              <label className="ln-info-label">Attachment (Image or Document)</label>
              <input type="file" className="form-input" accept="image/*,.pdf,.doc,.docx" onChange={handleAttachmentChange} />
              {form.attachmentName && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <FileText size={14} color="#64748b" />
                    <span style={{ fontSize: 12, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.attachmentName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {form.attachmentUrl && (
                      <a href={form.attachmentUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none' }}>
                        Preview
                      </a>
                    )}
                    <button type="button" className="ln-feed-action-btn" style={{ padding: '2px 6px', minHeight: 'auto' }} onClick={removeAttachment}>
                      <X size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="ln-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'rgba(0,0,0,0.9)', marginBottom: 16 }}>Required Competencies</h3>
            <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.55)', marginBottom: 12 }}>Select the competencies required for <strong>{form.ncLevel}</strong>:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {availableComps.map(comp => (
                <label key={comp} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: form.requiredCompetencies.includes(comp) ? '#dbeafe' : '#f8fafc', borderRadius: 10, cursor: 'pointer', border: `1.5px solid ${form.requiredCompetencies.includes(comp) ? '#3b82f6' : '#e8e8e8'}`, transition: 'all 0.15s' }}>
                  <input type="checkbox" checked={form.requiredCompetencies.includes(comp)} onChange={() => toggleComp(comp)} style={{ marginTop: 2 }} />
                  <span style={{ fontSize: 13.5, color: '#475569' }}>{comp}</span>
                </label>
              ))}
            </div>
            <div style={{ marginTop: 20 }}>
              <button type="submit" className="ln-btn ln-btn-primary" disabled={posting} style={{ width: '100%', padding: '10px 20px', fontSize: 14, opacity: posting ? 0.75 : 1, cursor: posting ? 'not-allowed' : 'pointer' }}>
                <Send size={16} /> {posting ? 'Posting...' : 'Post Opportunity'}
              </button>
            </div>
          </div>
        </div>

        <div className="ln-card ln-feed-card" style={{ marginTop: 16 }}>
          <div className="ln-section-header" style={{ marginBottom: 0 }}>
            <h3 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(0,0,0,0.6)' }}>Live Post Preview</h3>
            <span className="ln-badge ln-badge-blue" style={{ fontSize: 11 }}>How trainees will see it</span>
          </div>

          <div className="ln-feed-card-header">
            <button
              type="button"
              className="ln-feed-avatar"
              onClick={() => setActivePage('profile')}
              style={{ background: '#f0f7ff', color: '#0a66c2', border: 'none', cursor: 'pointer' }}
            >
              <Building2 size={20} />
            </button>
            <div>
              <div className="ln-feed-author">
                <button
                  type="button"
                  onClick={() => setActivePage('profile')}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', font: 'inherit', textAlign: 'left' }}
                >
                  {previewCompany}
                </button>
                <span className="ln-badge ln-badge-blue" style={{ fontSize: 10, marginLeft: 4 }}>Your Post</span>
              </div>
              <div className="ln-feed-meta">
                {[
                  (previewIndustry && String(previewIndustry).trim().toLowerCase() !== 'general') ? previewIndustry : '',
                  previewLocation,
                  previewSalary,
                  'Just now',
                ].filter(Boolean).join(' • ')}
              </div>
            </div>
          </div>

          <div className="ln-feed-content">
            <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{previewTitle}</h4>
            <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.6)', marginBottom: 8 }}>{previewDescription}</p>

            {form.attachmentUrl && isImageAttachment(form.attachmentUrl, form.attachmentType) && (
              <div style={{ marginBottom: 10 }}>
                <div className="ln-media-frame">
                  <img
                    src={form.attachmentUrl}
                    alt={form.attachmentName || 'Opportunity attachment'}
                    className="ln-media-image"
                  />
                </div>
              </div>
            )}

            {form.attachmentUrl && !isImageAttachment(form.attachmentUrl, form.attachmentType) && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#2563eb', marginBottom: 8 }}>
                <FileText size={13} /> {form.attachmentName || 'Attachment'}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <span className="ln-opp-type-badge">{form.opportunityType || 'Job'}</span>
              {form.opportunityType !== 'OJT' && form.employmentType && (
                <span className="ln-opp-type-badge" style={{ background: '#f8fafc', color: '#64748b' }}>{form.employmentType}</span>
              )}
              {form.ncLevel && (
                <span className="ln-opp-type-badge" style={{ background: '#ede9fe', color: '#6d28d9' }}>{form.ncLevel}</span>
              )}
            </div>
          </div>

          <div className="ln-feed-actions" style={{ borderTop: '1px solid #f3f3f3', padding: '8px 12px' }}>
            <button type="button" className="ln-feed-action-btn" disabled style={{ opacity: 0.65, cursor: 'not-allowed' }}>
              <Users size={14} /> View Applicants
            </button>
            <button type="button" className="ln-feed-action-btn" disabled style={{ opacity: 0.65, cursor: 'not-allowed' }}>
              <MessageSquare size={14} /> Comment (0)
            </button>
            <button type="button" className="ln-feed-action-btn" disabled style={{ opacity: 0.65, cursor: 'not-allowed' }}>
              <MessageSquare size={14} /> Your Listing
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

// ─── PAGE: VIEW APPLICANTS ────────────────────────────────────────
const ViewApplicants = ({ setActivePage }) => {
  const { currentUser, partners, getPartnerApplicants, updateApplicationStatus, sendRecruitMessage } = useApp();
  const navigate = useNavigate();
  const livePartner = getLivePartner(currentUser, partners);

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

  const applicants = getPartnerApplicants(livePartner?.id);
  const [search, setSearch] = useState('');
  const [activityFilter, setActivityFilter] = useState('All');
  const [viewApp, setViewApp] = useState(null);
  const [recruitApp, setRecruitApp] = useState(null);
  const [messageModal, setMessageModal] = useState(null);
  const [recruitMessage, setRecruitMessage] = useState('');
  const [recruitAttachment, setRecruitAttachment] = useState(null);
  const [sendingRecruit, setSendingRecruit] = useState(false);
  const recruitFileInputRef = useRef(null);
  const openProfile = (target) => {
    if (!target?.id || !target?.type) return;
    navigate(`/partner/profile-view/${target.type}/${target.id}`);
  };
  const filtered = applicants.filter(a => {
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
      alert(result.error || 'Failed to send recruit message.');
      return;
    }

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
              <tr><th>Activity</th><th>Trainee</th><th>Opportunity</th><th>Date</th><th>Direction</th><th>Msg By</th><th>View</th><th>Attachment</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.rowKey || a.id}>
                  <td><span className="ln-badge ln-badge-blue" style={{ fontSize: 11 }}>{a.activityType}</span></td>
                  <td style={{ fontWeight: 600 }}>
                    <button
                      type="button"
                      onClick={() => openProfile({ id: a.trainee?.id, type: 'trainee' })}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: a.trainee?.id ? 'pointer' : 'default', color: 'inherit', font: 'inherit' }}
                      disabled={!a.trainee?.id}
                    >
                      {a.trainee?.name || '—'}
                    </button>
                  </td>
                  <td style={{ fontSize: 13, color: 'rgba(0,0,0,0.55)' }}>{a.job?.title || 'Direct Contact'}</td>
                  <td style={{ fontSize: 12.5, color: 'rgba(0,0,0,0.5)' }}>{a.eventDate || '—'}</td>
                  <td style={{ fontSize: 12.5, color: 'rgba(0,0,0,0.65)' }}>{a.directionLabel}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {a.incomingMessage && <span className="ln-badge ln-badge-blue" style={{ fontSize: 10 }}>Student</span>}
                      {a.outgoingMessage && <span className="ln-badge ln-badge-green" style={{ fontSize: 10 }}>You</span>}
                      {!a.incomingMessage && !a.outgoingMessage && <span style={{ fontSize: 12.5, color: 'rgba(0,0,0,0.45)' }}>—</span>}
                    </div>
                  </td>
                  <td>
                    {(a.incomingMessage || a.outgoingMessage) ? (
                      <button type="button" className="ln-btn-sm ln-btn-outline" onClick={() => setMessageModal(a)}>
                        <Eye size={12} />
                      </button>
                    ) : (
                      <span style={{ fontSize: 12.5, color: 'rgba(0,0,0,0.45)' }}>—</span>
                    )}
                  </td>
                  <td>
                    {a.attachmentUrl ? (
                      <a href={a.attachmentUrl} target="_blank" rel="noreferrer" className="ln-btn-sm ln-btn-outline"><Eye size={12} /> View</a>
                    ) : a.attachmentName ? (
                      <span style={{ fontSize: 12.5, color: 'rgba(0,0,0,0.55)' }}>{a.attachmentName}</span>
                    ) : (
                      <span style={{ fontSize: 12.5, color: 'rgba(0,0,0,0.45)' }}>—</span>
                    )}
                  </td>
                  <td><span className={`ln-badge ${a.status === 'Pending' ? 'ln-badge-yellow' : a.status === 'Accepted' ? 'ln-badge-green' : a.status === 'Rejected' ? 'ln-badge-red' : 'ln-badge-blue'}`}>{a.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="ln-btn-sm ln-btn-outline" onClick={() => openProfile({ id: a.trainee?.id, type: 'trainee' })}><Eye size={12} /> Profile</button>
                      {a.recordType === 'application' && <button className="ln-btn-sm ln-btn-outline" onClick={() => setViewApp(a)}><Eye size={12} /> View</button>}
                      {a.recordType === 'application' && <button className="ln-btn-sm ln-btn-primary" style={{ background: '#0a66c2', borderColor: '#0a66c2' }} onClick={() => openRecruitModal(a)}><Send size={12} /> {a.outgoingMessage ? 'Update Recruit' : 'Recruit'}</button>}
                      {a.recordType === 'application' && a.status === 'Pending' && <>
                        <button className="ln-btn-sm ln-btn-primary" style={{ background: '#16a34a', borderColor: '#16a34a' }} onClick={() => updateApplicationStatus(a.id, 'Accepted', 'Approved by partner.')}><CheckCircle size={12} /></button>
                        <button className="ln-btn-sm ln-btn-primary" style={{ background: '#dc2626', borderColor: '#dc2626' }} onClick={() => updateApplicationStatus(a.id, 'Rejected', 'Not selected.')}><XCircle size={12} /></button>
                      </>}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: 'rgba(0,0,0,0.4)' }}>No recruit activity found.</td></tr>
              )}
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
              <span className={`ln-badge ${viewApp.status === 'Pending' ? 'ln-badge-yellow' : viewApp.status === 'Accepted' ? 'ln-badge-green' : 'ln-badge-red'}`}>{viewApp.status}</span>
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
            {viewApp.status === 'Pending' && (
              <div className="ln-modal-footer">
                <button className="ln-btn" style={{ flex: 1, background: '#dc2626', color: 'white', border: 'none' }} onClick={() => { updateApplicationStatus(viewApp.id, 'Rejected', 'Not selected.'); setViewApp(null); }}>
                  <XCircle size={15} /> Reject
                </button>
                <button className="ln-btn" style={{ flex: 1, background: '#16a34a', color: 'white', border: 'none' }} onClick={() => { updateApplicationStatus(viewApp.id, 'Accepted', 'Approved by partner.'); setViewApp(null); }}>
                  <CheckCircle size={15} /> Accept
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
                  {' '}• {recruitApp.job?.title}
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
    </div>
  );
};

// ─── PAGE: COMPANY PROFILE ────────────────────────────────────────
export const CompanyProfile = ({ viewedPartnerId = null, onBack = null }) => {
  const { currentUser, partners, updatePartner, jobPostings } = useApp();
  const navigate = useNavigate();
  const isOwnProfile = !viewedPartnerId || String(viewedPartnerId) === String(currentUser?.id);
  const [viewedPartner, setViewedPartner] = useState(null);
  const [loadingViewedProfile, setLoadingViewedProfile] = useState(false);
  const partner = isOwnProfile
    ? (partners.find(p => p.id === currentUser?.id) || currentUser)
    : (viewedPartner || partners.find(p => String(p.id) === String(viewedPartnerId)));

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    address: '',
    website: '',
    industry: '',
    achievements: [],
    benefits: []
  });
  const [companyInfoVisibility, setCompanyInfoVisibility] = useState(() => resolvePartnerVisibility(partner));

  const [newAchievement, setNewAchievement] = useState('');
  const [newBenefit, setNewBenefit] = useState('');

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({ open: false, message: '', onConfirm: null });
  const showConfirm = (message, onConfirm) => setConfirmDialog({ open: true, message, onConfirm });
  const closeConfirm = () => setConfirmDialog({ open: false, message: '', onConfirm: null });

  // Documents state
  const [documents, setDocuments] = useState([]);
  const [docLabel, setDocLabel] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const fileInputRef = useRef(null);

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
          .select('*')
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
        website: partner.website || '',
        industry: partner.industry || '',
        achievements: partner.achievements || [],
        benefits: partner.benefits || []
      });
      setCompanyInfoVisibility(resolvePartnerVisibility(partner));
      setEditing(false);
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
        setDocuments(prev => prev.filter(d => d.id !== docId));
      } else {
        alert(`Delete failed: ${result.error}`);
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete document.');
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

  const save = async () => {
    if (!isOwnProfile) return;
    if (form.email && !isEmailValid(form.email)) {
      alert('Please enter a valid email address.');
      return;
    }
    setSaving(true);
    await updatePartner(partner.id, { ...form, companyInfoVisibility });
    setSaving(false);
    setEditing(false);
  };

  const initials = partner.companyName?.charAt(0)?.toUpperCase() || 'P';
  const companyInfoFields = [
    { label: 'Company Name', key: 'companyName', type: 'text', maxLength: 100 },
    { label: 'Contact Person', key: 'contactPerson', type: 'text', maxLength: 100 },
    { label: 'Contact Email', key: 'email', type: 'email', maxLength: 100 },
    { label: 'Address', key: 'address', type: 'text', maxLength: 200 },
    { label: 'Industry', key: 'industry', type: 'text', maxLength: 80 },
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
        <div className="ln-profile-header-banner pn-header-banner" />
        <div className="ln-profile-header-body">
          <div className="ln-profile-header-avatar pn-header-avatar">{initials}</div>
          <div className="ln-profile-header-info">
            <div className="ln-profile-header-top">
              <div style={{ flex: 1 }}>
                <h1 className="ln-profile-header-name" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {showHeaderCompanyName ? partner.companyName : 'Industry Partner'}
                  {isVerified(partner) && <CheckCircle size={20} color="#0a66c2" title="Verified" style={{ flexShrink: 0 }} />}
                </h1>
                <p className="ln-profile-header-headline">{showHeaderIndustry && partner.industry ? `${partner.industry} • ` : ''}Industry Partner</p>
                {showHeaderAddress && partner.address && <p className="ln-profile-header-loc"><MapPin size={14} /> {partner.address}</p>}
                {showHeaderEmail && partner.email && <p className="ln-profile-header-contact">{partner.email}</p>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                <StatusBadge status={partner.verificationStatus} />
                {isOwnProfile && (
                  <button
                    className={`ln-btn ${editing ? 'ln-btn-success' : 'ln-btn-primary'}`}
                    onClick={editing ? save : () => {
                      setForm({
                        companyName: partner?.companyName || '',
                        contactPerson: partner?.contactPerson || '',
                        email: partner?.email || '',
                        address: partner?.address || '',
                        website: partner?.website || '',
                        industry: partner?.industry || '',
                        achievements: partner?.achievements || [],
                        benefits: partner?.benefits || []
                      });
                      setCompanyInfoVisibility(resolvePartnerVisibility(partner));
                      setEditing(true);
                    }}
                    disabled={saving || (editing && form.email && !isEmailValid(form.email))}
                  >
                    {saving ? <><Loader size={15} style={{ animation: 'ocr-spin 0.8s linear infinite' }} /> Saving...</> : editing ? <><CheckCircle size={15} /> Save Changes</> : <><Edit size={15} /> Edit Profile</>}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="ln-profile-two-col">
        <div className="ln-profile-main">
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
          <div className="ln-card">
            <div className="ln-section-header">
              <h3>Company Information</h3>
              {isOwnProfile && editing && (
                <button
                  className="ln-btn-sm ln-btn-outline"
                  onClick={() => {
                    setForm({
                      companyName: partner?.companyName || '',
                      contactPerson: partner?.contactPerson || '',
                      email: partner?.email || '',
                      address: partner?.address || '',
                      website: partner?.website || '',
                      industry: partner?.industry || '',
                      achievements: partner?.achievements || [],
                      benefits: partner?.benefits || []
                    });
                    setCompanyInfoVisibility(resolvePartnerVisibility(partner));
                    setEditing(false);
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
              )}
            </div>
            <div className="ln-info-grid">
              {(() => {
                const visibleSet = new Set(resolvePartnerVisibility(partner));
                const fieldsToRender = companyInfoFields.filter(field => isOwnProfile || visibleSet.has(field.key));

                if (fieldsToRender.length === 0) {
                  return <div style={{ gridColumn: '1 / -1', fontSize: 13, color: '#94a3b8' }}>This company chose to hide company information.</div>;
                }

                return fieldsToRender.map(field => {
                  const isVisible = companyInfoVisibility.includes(field.key);
                  const value = editing ? form[field.key] : partner[field.key];

                  return (
                    <div key={field.key} className="ln-info-item">
                      <label className="ln-info-label">{field.label}</label>
                      {editing ? (
                        <input
                          type={field.type}
                          className="form-input"
                          value={value || ''}
                          maxLength={field.maxLength}
                          placeholder={field.placeholder}
                          onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                          style={field.key === 'email' && form.email && !isEmailValid(form.email) ? { borderColor: '#cc1016' } : undefined}
                        />
                      ) : field.key === 'website' ? (
                        <div className="ln-info-value">
                          {partner.website
                            ? <a href={partner.website.startsWith('http') ? partner.website : `https://${partner.website}`} target="_blank" rel="noreferrer" style={{ color: '#0a66c2', display: 'flex', alignItems: 'center', gap: 4 }}>{partner.website} <ExternalLink size={12} /></a>
                            : '—'}
                        </div>
                      ) : (
                        <div className="ln-info-value">{value || '—'}</div>
                      )}

                      {isOwnProfile && editing && (
                        <label style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: isVisible ? '#166534' : '#64748b', fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={() => toggleCompanyInfoVisibility(field.key)}
                            style={{ width: 14, height: 14 }}
                          />
                          {isVisible ? 'Shown to others' : 'Hidden from others'}
                        </label>
                      )}
                    </div>
                  );
                });
              })()}

              {isOwnProfile && editing && form.email && !isEmailValid(form.email) && (
                <div style={{ gridColumn: '1 / -1', fontSize: 12, color: '#cc1016', marginTop: -8 }}>Please enter a valid email address</div>
              )}
            </div>
          </div>
        </div>

        {/* Active Openings (Automatic) */}
        <div className="ln-card" style={{ marginTop: 20 }}>
          <div className="ln-section-header">
            <h3>Active Openings</h3>
            <span className="ln-badge ln-badge-blue">{activeJobs.length} Positions</span>
          </div>
          <div style={{ padding: '0 16px 16px' }}>
            {activeJobs.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
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
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b' }}>
                <div style={{ marginBottom: 8 }}><Briefcase size={32} style={{ opacity: 0.2 }} /></div>
                <p style={{ fontSize: 14 }}>No active openings at this time.</p>
              </div>
            )}
          </div>
        </div>

        {/* Company Achievements */}
        <div className="ln-card" style={{ marginTop: 20 }}>
          <div className="ln-section-header">
            <h3>Company Achievements & Awards</h3>
            {isOwnProfile && editing && (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="form-input"
                  placeholder="Add award/achievement..."
                  style={{ margin: 0, height: 32, fontSize: 12 }}
                  maxLength={100}
                  value={newAchievement}
                  onChange={e => setNewAchievement(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newAchievement.trim()) {
                      setForm({ ...form, achievements: [...form.achievements, newAchievement.trim()] });
                      setNewAchievement('');
                    }
                  }}
                />
                <button className="ln-btn-sm ln-btn-primary" onClick={() => {
                  if (newAchievement.trim()) {
                    setForm({ ...form, achievements: [...form.achievements, newAchievement.trim()] });
                    setNewAchievement('');
                  }
                }}>Add</button>
              </div>
            )}
          </div>
          <div style={{ padding: '0 16px 16px' }}>
            {(editing ? form.achievements : partner.achievements)?.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(editing ? form.achievements : partner.achievements).map((ach, idx) => (
                  <div key={idx} style={{ padding: '6px 14px', background: '#fffbeb', border: '1px solid #fef3c7', color: '#92400e', borderRadius: 20, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Award size={14} /> {ach}
                    {isOwnProfile && editing && <X size={12} style={{ cursor: 'pointer' }} onClick={() => showConfirm('Are you sure you want to remove this achievement?', () => setForm({ ...form, achievements: form.achievements.filter((_, i) => i !== idx) }))} />}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center', padding: 12 }}>No achievements listed yet.</p>
            )}
          </div>
        </div>

        {/* Company Benefits */}
        <div className="ln-card" style={{ marginTop: 20 }}>
          <div className="ln-section-header">
            <h3>Company Benefits & Perks</h3>
            {isOwnProfile && editing && (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="form-input"
                  placeholder="Add benefit/perk..."
                  style={{ margin: 0, height: 32, fontSize: 12 }}
                  maxLength={100}
                  value={newBenefit}
                  onChange={e => setNewBenefit(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newBenefit.trim()) {
                      setForm({ ...form, benefits: [...form.benefits, newBenefit.trim()] });
                      setNewBenefit('');
                    }
                  }}
                />
                <button className="ln-btn-sm ln-btn-primary" onClick={() => {
                  if (newBenefit.trim()) {
                    setForm({ ...form, benefits: [...form.benefits, newBenefit.trim()] });
                    setNewBenefit('');
                  }
                }}>Add</button>
              </div>
            )}
          </div>
          <div style={{ padding: '0 16px 16px' }}>
            {(editing ? form.benefits : partner.benefits)?.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                {(editing ? form.benefits : partner.benefits).map((benefit, idx) => (
                  <div key={idx} style={{ padding: '10px 12px', background: '#f0fdf4', border: '1px solid #dcfce7', color: '#166534', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle size={14} /> {benefit}
                    {isOwnProfile && editing && <X size={12} style={{ cursor: 'pointer', marginLeft: 'auto' }} onClick={() => showConfirm('Are you sure you want to remove this benefit?', () => setForm({ ...form, benefits: form.benefits.filter((_, i) => i !== idx) }))} />}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center', padding: 12 }}>No benefits listed yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="ln-profile-sidebar">
        {/* Documents */}
        <div className="ln-card">
          <div className="ln-section-header">
            <h3>Documents</h3>
            {isOwnProfile && editing && (
              <button className="ln-btn-sm ln-btn-primary" onClick={() => setShowUploadForm(!showUploadForm)}>
                {showUploadForm ? <><X size={12} /> Cancel</> : <><Plus size={12} /> Add</>}
              </button>
            )}
          </div>

          {isOwnProfile && editing && showUploadForm && (
            <div style={{ marginBottom: 16, padding: 16, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ marginBottom: 10 }}>
                <label className="ln-info-label" style={{ marginBottom: 4, display: 'block' }}>Document Label <span style={{ color: '#cc1016' }}>*</span></label>
                <input type="text" className="form-input" placeholder="e.g. Business Permit, SEC Registration..." maxLength={40} value={docLabel} onChange={e => setDocLabel(e.target.value)} style={{ fontSize: 13 }} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label className="ln-info-label" style={{ marginBottom: 4, display: 'block' }}>File (PDF, DOC, DOCX only) <span style={{ color: '#cc1016' }}>*</span></label>
                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e => setDocFile(e.target.files[0] || null)} style={{ fontSize: 13 }} />
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
                {isOwnProfile && editing && <button className="ln-btn-sm ln-btn-outline" onClick={() => showConfirm('Are you sure you want to delete this document?', () => deleteDoc(doc.id))} style={{ color: '#cc1016' }}><Trash2 size={12} /></button>}
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
    </div>
  );
};

const PartnerProfileViewRoute = () => {
  const { profileType, profileId } = useParams();
  const navigate = useNavigate();
  const normalizedProfileType = normalizeProfileType(profileType);

  if (normalizedProfileType === 'partner') {
    return <CompanyProfile viewedPartnerId={profileId} onBack={() => navigate(-1)} />;
  }

  if (normalizedProfileType === 'trainee') {
    return (
      <React.Suspense fallback={<div className="ln-page-content"><div className="ln-empty-state"><p>Loading profile...</p></div></div>}>
        <TraineeProfileContent viewedProfileId={profileId} onBack={() => navigate(-1)} />
      </React.Suspense>
    );
  }

  return (
    <ProfilePage
      profileId={profileId}
      profileType={normalizedProfileType || profileType}
      onBack={() => navigate(-1)}
    />
  );
};

// ─── MAIN EXPORT ──────────────────────────────────────────────────
export default function PartnerDashboard() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

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

  if (!currentUser) return null;

  return (
    <PartnerLayout activePage={activePage} setActivePage={setActivePage}>
      <Routes>
        <Route path="/" element={<PartnerHome setActivePage={setActivePage} />} />
        <Route path="/post-job" element={<PostJob setActivePage={setActivePage} />} />
        <Route path="/applicants" element={<ViewApplicants setActivePage={setActivePage} />} />
        <Route path="/profile" element={<CompanyProfile />} />
        <Route path="/verification" element={<VerificationPage />} />
        <Route path="/profile-view/:profileType/:profileId" element={<PartnerProfileViewRoute />} />
        <Route path="*" element={<Navigate to="/partner" replace />} />
      </Routes>
    </PartnerLayout>
  );
}
