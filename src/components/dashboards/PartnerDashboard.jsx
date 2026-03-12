import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard, Briefcase, FileText, Users, Building2, LogOut,
  ChevronDown, Search, Plus, Eye, X, CheckCircle, XCircle,
  MapPin, Send, Award, ChevronRight, Trash2, Menu, Lock,
  Upload, AlertTriangle, Clock, ShieldCheck, FileCheck,
  Bell, Home, Settings, TrendingUp, Bookmark, Target, Star,
  Camera, ThumbsUp, MessageSquare, Share2, Edit, Loader, ExternalLink
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';

/* ═══════════════════════════════════════════════════════════════════
   LINKEDIN-STYLE PARTNER DASHBOARD
   ═══════════════════════════════════════════════════════════════════ */

// ─── HELPERS ──────────────────────────────────────────────────────
const isVerified = (user) => user?.verificationStatus === 'Verified';

const timeAgo = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
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
  const { currentUser, logout } = useApp();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const verified = isVerified(currentUser);
  const initials = currentUser?.companyName?.charAt(0)?.toUpperCase() || 'P';

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: <Home size={20} /> },
    { id: 'profile', label: 'Company', icon: <Building2 size={20} /> },
    ...(!verified ? [{ id: 'verification', label: 'Verification', icon: <ShieldCheck size={20} /> }] : []),
    { id: 'post-job', label: 'Post Opportunities', icon: <Plus size={20} />, locked: !verified },
    { id: 'applicants', label: 'Applicants', icon: <Users size={20} />, locked: !verified },
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
                    <div className="ln-dropdown-profile-name">{currentUser?.companyName || 'Partner'}</div>
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
      { label: 'View Applicants', icon: <Users size={16} />, page: 'applicants', locked: !verified },
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
  const { currentUser, partners, jobPostings, getPartnerApplicants, posts, createPost, trainees } = useApp();
  const partner = partners.find(p => p.id === currentUser?.id) || currentUser;
  const verified = isVerified(currentUser);
  const myJobs = jobPostings.filter(j => j.partnerId === currentUser?.id);
  const myApplicants = getPartnerApplicants(currentUser?.id);
  const initials = currentUser?.companyName?.charAt(0)?.toUpperCase() || 'P';

  // Create Post state
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

  // Unified Feed logic: Mix Jobs and Posts, sort by date
  const unifiedFeed = [
    ...posts.map(p => ({ ...p, feedType: 'post' })),
    ...jobPostings.map(j => ({ ...j, feedType: 'job' }))
  ].sort((a, b) => new Date(b.created_at || b.datePosted) - new Date(a.created_at || a.datePosted));

  const stats = [
    { label: 'Active Postings', value: myJobs.filter(j => j.status === 'Open').length, icon: <Briefcase size={20} />, color: '#0ea5e9' },
    { label: 'Total Applicants', value: myApplicants.length, icon: <Users size={20} />, color: '#7c3aed' },
    { label: 'Accepted', value: myApplicants.filter(a => a.status === 'Accepted').length, icon: <CheckCircle size={20} />, color: '#16a34a' },
    { label: 'Avg Match', value: myApplicants.length > 0 ? `${Math.round(myApplicants.reduce((s, a) => s + a.matchRate, 0) / myApplicants.length)}%` : '0%', icon: <Target size={20} />, color: '#d97706' },
  ];

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
          <div className="ln-card" style={{ borderLeft: '4px solid #d97706', marginBottom: 8 }}>
            <div style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <AlertTriangle size={20} color="#d97706" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#92400e', marginBottom: 2 }}>Account Pending Verification</div>
                  <div style={{ fontSize: 13, color: '#a16207' }}>Upload verification documents to unlock job & OJT posting features.</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                <StatusBadge status={currentUser?.verificationStatus} />
                <button className="ln-btn ln-btn-primary" style={{ fontSize: 13 }} onClick={() => setActivePage('verification')}>
                  <Upload size={14} /> Verify Now
                </button>
              </div>
            </div>
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
                    <div style={{ position: 'relative', marginTop: 12, borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                      <img src={filePreview} alt="Preview" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }} />
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

        {/* Activity / Welcome Feed Card */}
        <div className="ln-card ln-feed-card">
          <div className="ln-feed-card-header">
            <div className="ln-feed-avatar pn-feed-avatar">{initials}</div>
            <div>
              <div className="ln-feed-author">{currentUser?.companyName}</div>
              <div className="ln-feed-meta">{currentUser?.industry} &bull; Industry Partner</div>
            </div>
          </div>
          <div className="ln-feed-content">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'rgba(0,0,0,0.9)' }}>
              Welcome back! Here's your recruitment overview
            </h3>
            <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', lineHeight: 1.6, marginBottom: 12 }}>
              You have <strong>{myJobs.filter(j => j.status === 'Open').length}</strong> active postings
              and <strong>{myApplicants.filter(a => a.status === 'Pending').length}</strong> pending applications to review.
              {verified
                ? ' Your account is verified — you can post new opportunities anytime.'
                : ' Complete verification to start posting opportunities.'}
            </p>
          </div>
          <div className="ln-feed-actions">
            {verified && (
              <button className="ln-feed-action-btn" onClick={() => setActivePage('post-job')}>
                <Plus size={16} /> Post Opportunities
              </button>
            )}
            <button className="ln-feed-action-btn" onClick={() => setActivePage('applicants')}>
              <Users size={16} /> View Applicants
            </button>
            <button className="ln-feed-action-btn" onClick={() => setActivePage('profile')}>
              <Building2 size={16} /> Company Profile
            </button>
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
              return (
                <div key={`job-${item.id}`} className="ln-card ln-feed-card" style={{ marginBottom: 0 }}>
                  <div className="ln-feed-card-header">
                    <div className="ln-feed-avatar" style={{ background: '#f0f7ff', color: '#0a66c2' }}>
                      <Building2 size={20} />
                    </div>
                    <div>
                      <div className="ln-feed-author">
                        {item.companyName} {myJob && <span className="ln-badge ln-badge-blue" style={{ fontSize: 10, marginLeft: 4 }}>Your Post</span>}
                      </div>
                      <div className="ln-feed-meta">{item.industry} &bull; {item.location} &bull; {timeAgo(item.datePosted)}</div>
                    </div>
                  </div>
                  <div className="ln-feed-content">
                    <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{item.title}</h4>
                    <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.6)', marginBottom: 8 }}>{item.description.substring(0, 150)}...</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span className="ln-opp-type-badge">{item.opportunityType}</span>
                      <span className="ln-opp-type-badge" style={{ background: '#f8fafc', color: '#64748b' }}>{item.employmentType}</span>
                    </div>
                  </div>
                  <div className="ln-feed-actions" style={{ borderTop: '1px solid #f3f3f3', padding: '8px 12px' }}>
                    <button className="ln-feed-action-btn" onClick={() => setActivePage(myJob ? 'applicants' : 'dashboard')}>
                      {myJob ? <><Users size={14} /> View Applicants</> : <><Eye size={14} /> View Opportunity</>}
                    </button>
                    <button className="ln-feed-action-btn"><Share2 size={14} /> Share</button>
                  </div>
                </div>
              );
            } else {
              const author = item.author_type === 'student'
                ? trainees.find(t => t.id === item.author_id)
                : (partners.find(p => p.id === item.author_id) || (item.author_id === currentUser?.id ? currentUser : null));

              const authorInitial = author?.name?.charAt(0) || author?.companyName?.charAt(0) || '?';
              const isMe = item.author_id === currentUser?.id;

              return (
                <div key={`post-${item.id}`} className="ln-card ln-feed-card" style={{ marginBottom: 0 }}>
                  <div className="ln-feed-card-header">
                    <div className="ln-feed-avatar">
                      {author?.photo || author?.company_logo_url ? (
                        <img src={author.photo || author.company_logo_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (authorInitial)}
                    </div>
                    <div>
                      <div className="ln-feed-author" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {author?.name || author?.companyName || 'Unknown User'}
                        {isMe && <span className="ln-badge ln-badge-gray" style={{ fontSize: 10 }}>You</span>}
                        {item.post_type !== 'general' && (
                          <span className="ln-badge ln-badge-blue" style={{ fontSize: 10 }}>
                            {item.post_type.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <div className="ln-feed-meta">
                        {item.author_type === 'student' ? 'TESDA Trainee' : 'Industry Partner'} &bull; {timeAgo(item.created_at)}
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
            <div className="ln-empty-state"><TrendingUp size={48} /><h3>No community activity</h3><p>Post an update to start the conversation.</p></div>
          )}
        </div>
      </div>

      {/* Right Column - Widgets */}
      <div className="ln-col-right">
        <QuickActionsWidget setActivePage={setActivePage} verified={verified} />
        <RecruitmentStatsWidget myJobs={myJobs} myApplicants={myApplicants} />
      </div>
    </div>
  );
};

// ─── PAGE: VERIFICATION ───────────────────────────────────────────
const VerificationPage = () => {
  const { currentUser, submitPartnerDocuments } = useApp();
  const status = currentUser?.verificationStatus || 'Pending';
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [docLabel, setDocLabel] = useState('');
  const fileInputRef = useRef(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchDocs = async () => {
    try {
      const res = await fetch(`/api/partner-verification/${currentUser.id}`);
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

  useEffect(() => { if (currentUser?.id) fetchDocs(); }, [currentUser?.id]);

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
            partnerId: currentUser.id,
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
    submitPartnerDocuments(currentUser.id);
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
            {/* Uploaded Documents List */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8' }}>
                <Loader size={24} className="spin" style={{ margin: '0 auto 8px' }} /> Loading documents...
              </div>
            ) : documents.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                {documents.map(doc => (
                  <div key={doc.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: '#f0fdf4', borderRadius: 10,
                    border: '1px solid #bbf7d0', marginBottom: 8
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <FileCheck size={18} color="#16a34a" style={{ flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#166534', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {doc.label}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>
                          {doc.file_name} • {timeAgo(doc.uploaded_at)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                        style={{ padding: '4px 8px', fontSize: 12, color: '#0369a1', border: '1px solid #bae6fd', background: '#f0f9ff', borderRadius: 6, textDecoration: 'none', cursor: 'pointer' }}>
                        <Eye size={12} /> View
                      </a>
                      {status !== 'Under Review' && (
                        <button onClick={() => setConfirmDeleteId(doc.id)}
                          style={{ padding: '4px 8px', fontSize: 12, color: '#dc2626', border: '1px solid #fecaca', background: '#fef2f2', borderRadius: 6, cursor: 'pointer' }}>
                          <Trash2 size={12} /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload New Document */}
            {status !== 'Under Review' && (
              <>
                <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Document label (e.g. Business Permit, SEC Registration)"
                    value={docLabel} onChange={e => setDocLabel(e.target.value)}
                    maxLength={100}
                    style={{ flex: 1, minWidth: 180, padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, background: '#f8fafc' }}
                  />
                  <button
                    className="ln-btn"
                    style={{ padding: '8px 16px', fontSize: 13, background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0369a1' }}
                    onClick={() => {
                      if (!docLabel.trim()) { alert('Please enter a document label first.'); return; }
                      fileInputRef.current?.click();
                    }}
                    disabled={uploading}
                  >
                    {uploading ? <><Loader size={14} className="spin" /> Uploading...</> : <><Upload size={14} /> Choose File</>}
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>Accepted: PDF, JPG, PNG • Max 3MB per file</p>
              </>
            )}

            {/* Submit / Edit Button */}
            {status === 'Under Review' ? (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <FileCheck size={36} color="#0ea5e9" style={{ margin: '0 auto 8px' }} />
                <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.55)', marginBottom: 12 }}>Your documents are under review by the administrators.</p>
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
  const { addJobPosting, NC_COMPETENCIES, currentUser } = useApp();
  const ncKeys = Object.keys(NC_COMPETENCIES);
  const [form, setForm] = useState({
    title: '', opportunityType, ncLevel: ncKeys[0] || '', description: '',
    employmentType: opportunityType === 'OJT' ? 'Internship' : 'Full-time', location: '', salaryRange: '', slots: 1,
    requiredCompetencies: [],
  });
  const availableComps = NC_COMPETENCIES[form.ncLevel] || [];
  const toggleComp = (comp) => {
    setForm(prev => ({
      ...prev,
      requiredCompetencies: prev.requiredCompetencies.includes(comp)
        ? prev.requiredCompetencies.filter(c => c !== comp)
        : [...prev.requiredCompetencies, comp]
    }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.location) return alert('Title and location are required.');
    addJobPosting(form);
    alert('Opportunity posted successfully!');
    setActivePage('dashboard');
  };

  if (!isVerified(currentUser)) {
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
            Your account is currently <strong>{currentUser?.verificationStatus || 'Pending Verification'}</strong>.
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
              <select className="form-select" value={form.opportunityType} onChange={e => setForm({ ...form, opportunityType: e.target.value })}>
                <option>Job</option><option>OJT</option><option>Apprenticeship</option>
              </select>
            </div>
            <div className="form-group">
              <label className="ln-info-label">NC Level Required *</label>
              <select className="form-select" value={form.ncLevel} onChange={e => setForm({ ...form, ncLevel: e.target.value, requiredCompetencies: [] })}>
                {Object.keys(NC_COMPETENCIES).map(nc => <option key={nc}>{nc}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="ln-info-label">Description</label>
              <textarea className="form-input" rows={4} maxLength={1000} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the opportunity..." />
            </div>
            <div className="form-group">
              <label className="ln-info-label">Employment Type</label>
              <select className="form-select" value={form.employmentType} onChange={e => setForm({ ...form, employmentType: e.target.value })}>
                <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option>
              </select>
            </div>
            <div className="ln-info-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="ln-info-label">Location *</label>
                <input className="form-input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="City" maxLength={100} required />
              </div>
              <div className="form-group">
                <label className="ln-info-label">Salary Range</label>
                <input className="form-input" value={form.salaryRange} onChange={e => setForm({ ...form, salaryRange: e.target.value })} placeholder="₱15,000 – ₱20,000/month" maxLength={50} />
              </div>
            </div>
            <div className="form-group">
              <label className="ln-info-label">Available Slots</label>
              <input type="number" className="form-input" min={1} value={form.slots} onChange={e => setForm({ ...form, slots: Number(e.target.value) })} />
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
              <button type="submit" className="ln-btn ln-btn-primary" style={{ width: '100%', padding: '10px 20px', fontSize: 14 }}>
                <Send size={16} /> Post Opportunity
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

// ─── PAGE: VIEW APPLICANTS ────────────────────────────────────────
const ViewApplicants = ({ setActivePage }) => {
  const { currentUser, getPartnerApplicants, updateApplicationStatus } = useApp();

  if (!isVerified(currentUser)) {
    return (
      <div className="ln-page-content">
        <div className="ln-page-header">
          <div>
            <h1 className="ln-page-title">Applicants</h1>
            <p className="ln-page-subtitle">Review trainee applications</p>
          </div>
        </div>
        <div className="ln-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <AlertTriangle size={48} color="#d97706" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'rgba(0,0,0,0.9)', marginBottom: 8 }}>Account Verification Required</h3>
          <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.55)', maxWidth: 500, margin: '0 auto 24px' }}>
            You need to verify your account before viewing applicants.
          </p>
          <button className="ln-btn ln-btn-primary" onClick={() => setActivePage('verification')}>Go to Verification</button>
        </div>
      </div>
    );
  }

  const applicants = getPartnerApplicants(currentUser?.id);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [viewApp, setViewApp] = useState(null);
  const filtered = applicants.filter(a => {
    const q = search.toLowerCase();
    return (a.trainee?.name?.toLowerCase().includes(q) || a.job?.title?.toLowerCase().includes(q)) && (filterStatus === 'All' || a.status === filterStatus);
  });

  return (
    <div className="ln-page-content">
      <div className="ln-page-header">
        <div>
          <h1 className="ln-page-title">Applicants</h1>
          <p className="ln-page-subtitle">Review trainee applications to your opportunities</p>
        </div>
        <span className="ln-badge ln-badge-blue">{applicants.length} total</span>
      </div>

      {/* Summary Pills */}
      <div className="ln-pills-row" style={{ marginBottom: 16 }}>
        {[
          { label: 'Total', count: applicants.length, color: '#0ea5e9' },
          { label: 'Pending', count: applicants.filter(a => a.status === 'Pending').length, color: '#d97706' },
          { label: 'Accepted', count: applicants.filter(a => a.status === 'Accepted').length, color: '#16a34a' },
          { label: 'Rejected', count: applicants.filter(a => a.status === 'Rejected').length, color: '#dc2626' },
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
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="ln-search-wrap" style={{ width: 220 }}>
              <Search size={16} className="ln-search-icon" />
              <input className="ln-search-input" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="ln-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              {['All', 'Pending', 'Accepted', 'Rejected'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="ln-table">
            <thead>
              <tr><th>Trainee</th><th>Opportunity</th><th>Type</th><th>Match</th><th>Applied</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.trainee?.name || '—'}</td>
                  <td style={{ fontSize: 13, color: 'rgba(0,0,0,0.55)' }}>{a.job?.title || '—'}</td>
                  <td><span className="ln-badge ln-badge-blue" style={{ fontSize: 11 }}>{a.job?.opportunityType}</span></td>
                  <td><span style={{ fontWeight: 700, color: a.matchRate >= 70 ? '#16a34a' : a.matchRate >= 40 ? '#d97706' : '#dc2626' }}>{a.matchRate}%</span></td>
                  <td style={{ fontSize: 12.5, color: 'rgba(0,0,0,0.5)' }}>{a.appliedAt}</td>
                  <td><span className={`ln-badge ${a.status === 'Pending' ? 'ln-badge-yellow' : a.status === 'Accepted' ? 'ln-badge-green' : 'ln-badge-red'}`}>{a.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="ln-btn-sm ln-btn-outline" onClick={() => setViewApp(a)}><Eye size={12} /> View</button>
                      {a.status === 'Pending' && <>
                        <button className="ln-btn-sm ln-btn-primary" style={{ background: '#16a34a', borderColor: '#16a34a' }} onClick={() => updateApplicationStatus(a.id, 'Accepted', 'Approved by partner.')}><CheckCircle size={12} /></button>
                        <button className="ln-btn-sm ln-btn-primary" style={{ background: '#dc2626', borderColor: '#dc2626' }} onClick={() => updateApplicationStatus(a.id, 'Rejected', 'Not selected.')}><XCircle size={12} /></button>
                      </>}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'rgba(0,0,0,0.4)' }}>No applicants found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #ede9fe, #dbeafe)', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#7c3aed' }}>{viewApp.trainee?.name?.charAt(0)}</div>
              <div style={{ fontWeight: 800, fontSize: 17 }}>{viewApp.trainee?.name}</div>
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
          </div>
        </div>
      )}
    </div>
  );
};

// ─── PAGE: COMPANY PROFILE ────────────────────────────────────────
const CompanyProfile = () => {
  const { currentUser, partners, updatePartner, jobPostings } = useApp();
  const navigate = useNavigate();
  const partner = partners.find(p => p.id === currentUser?.id) || currentUser;

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

  if (!partner) {
    return (
      <div className="ln-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Loader size={40} style={{ animation: 'ocr-spin 1s linear infinite', opacity: 0.3 }} />
      </div>
    );
  }

  const activeJobs = jobPostings.filter(j => j.partnerId === partner.id && j.status === 'Open');

  const save = async () => {
    if (form.email && !isEmailValid(form.email)) {
      alert('Please enter a valid email address.');
      return;
    }
    setSaving(true);
    await updatePartner(partner.id, form);
    setSaving(false);
    setEditing(false);
  };

  const initials = partner.companyName?.charAt(0)?.toUpperCase() || 'P';

  return (
    <div className="ln-page-content">
      {/* Profile Header Card */}
      <div className="ln-card ln-profile-header-card">
        <div className="ln-profile-header-banner pn-header-banner" />
        <div className="ln-profile-header-body">
          <div className="ln-profile-header-avatar pn-header-avatar">{initials}</div>
          <div className="ln-profile-header-info">
            <div className="ln-profile-header-top">
              <div style={{ flex: 1 }}>
                <h1 className="ln-profile-header-name" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {partner.companyName}
                  {isVerified(partner) && <CheckCircle size={20} color="#0a66c2" title="Verified" style={{ flexShrink: 0 }} />}
                </h1>
                <p className="ln-profile-header-headline">{partner.industry} &bull; Industry Partner</p>
                <p className="ln-profile-header-loc"><MapPin size={14} /> {partner.address || 'Philippines'}</p>
                <p className="ln-profile-header-contact">{partner.email}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                <StatusBadge status={partner.verificationStatus} />
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
                    setEditing(true);
                  }}
                  disabled={saving || (editing && form.email && !isEmailValid(form.email))}
                >
                  {saving ? <><Loader size={15} style={{ animation: 'ocr-spin 0.8s linear infinite' }} /> Saving...</> : editing ? <><CheckCircle size={15} /> Save Changes</> : <><Edit size={15} /> Edit Profile</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="ln-profile-two-col">
        <div className="ln-profile-main">
          {/* Verification Status Indicator */}
          {!isVerified(partner) && (
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
              {editing && <button className="ln-btn-sm ln-btn-outline" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>}
            </div>
            <div className="ln-info-grid">
              <div className="ln-info-item">
                <label className="ln-info-label">Company Name</label>
                {editing ? <input className="form-input" value={form.companyName} maxLength={100} onChange={e => setForm({ ...form, companyName: e.target.value })} /> : <div className="ln-info-value">{partner.companyName || '—'}</div>}
              </div>
              <div className="ln-info-item">
                <label className="ln-info-label">Contact Person</label>
                {editing ? <input className="form-input" value={form.contactPerson} maxLength={100} onChange={e => setForm({ ...form, contactPerson: e.target.value })} /> : <div className="ln-info-value">{partner.contactPerson || '—'}</div>}
              </div>
              <div className="ln-info-item">
                <label className="ln-info-label">Contact Email</label>
                {editing ? <input type="email" className="form-input" value={form.email} maxLength={100} onChange={e => setForm({ ...form, email: e.target.value })} style={form.email && !isEmailValid(form.email) ? { borderColor: '#cc1016' } : {}} /> : <div className="ln-info-value">{partner.email || '—'}</div>}
              </div>
              {editing && form.email && !isEmailValid(form.email) && (
                <div style={{ gridColumn: '1 / -1', fontSize: 12, color: '#cc1016', marginTop: -8 }}>Please enter a valid email address</div>
              )}
              <div className="ln-info-item">
                <label className="ln-info-label">Address</label>
                {editing ? <input className="form-input" value={form.address} maxLength={200} onChange={e => setForm({ ...form, address: e.target.value })} /> : <div className="ln-info-value">{partner.address || '—'}</div>}
              </div>
              <div className="ln-info-item">
                <label className="ln-info-label">Industry</label>
                {editing ? <input className="form-input" value={form.industry} maxLength={80} onChange={e => setForm({ ...form, industry: e.target.value })} /> : <div className="ln-info-value">{partner.industry || '—'}</div>}
              </div>
              <div className="ln-info-item">
                <label className="ln-info-label">Website</label>
                {editing ? <input className="form-input" value={form.website} maxLength={200} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="e.g. https://example.com" /> : <div className="ln-info-value">
                  {partner.website ? <a href={partner.website.startsWith('http') ? partner.website : `https://${partner.website}`} target="_blank" rel="noreferrer" style={{ color: '#0a66c2', display: 'flex', alignItems: 'center', gap: 4 }}>{partner.website} <ExternalLink size={12} /></a> : '—'}
                </div>}
              </div>
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
                      <span style={{ fontSize: 10, padding: '2px 6px', background: '#f1f5f9', color: '#475569', borderRadius: 4 }}>{job.employmentType}</span>
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
            {editing && (
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
                    {editing && <X size={12} style={{ cursor: 'pointer' }} onClick={() => showConfirm('Are you sure you want to remove this achievement?', () => setForm({ ...form, achievements: form.achievements.filter((_, i) => i !== idx) }))} />}
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
            {editing && (
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
                    {editing && <X size={12} style={{ cursor: 'pointer', marginLeft: 'auto' }} onClick={() => showConfirm('Are you sure you want to remove this benefit?', () => setForm({ ...form, benefits: form.benefits.filter((_, i) => i !== idx) }))} />}
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
            {editing && (
              <button className="ln-btn-sm ln-btn-primary" onClick={() => setShowUploadForm(!showUploadForm)}>
                {showUploadForm ? <><X size={12} /> Cancel</> : <><Plus size={12} /> Add</>}
              </button>
            )}
          </div>

          {editing && showUploadForm && (
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
                {editing && <button className="ln-btn-sm ln-btn-outline" onClick={() => showConfirm('Are you sure you want to delete this document?', () => deleteDoc(doc.id))} style={{ color: '#cc1016' }}><Trash2 size={12} /></button>}
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

// ─── MAIN EXPORT ──────────────────────────────────────────────────
export default function PartnerDashboard() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // Deduce active page from URL for visual consistency in child components
  const path = location.pathname.split('/').pop();
  const activePage = (path === 'partner' || !path) ? 'dashboard' : path;

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
        <Route path="*" element={<Navigate to="/partner" replace />} />
      </Routes>
    </PartnerLayout>
  );
}
