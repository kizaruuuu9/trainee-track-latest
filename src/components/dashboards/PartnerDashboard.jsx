import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard, Briefcase, FileText, Users, Building2, LogOut,
  ChevronDown, Search, Plus, Eye, X, CheckCircle, XCircle,
  MapPin, Send, Award, ChevronRight, Trash2, Menu, Lock,
  Upload, AlertTriangle, Clock, ShieldCheck, FileCheck,
  Bell, Home, Settings, TrendingUp, Bookmark, Target, Star
} from 'lucide-react'; 

/* ═══════════════════════════════════════════════════════════════════
   LINKEDIN-STYLE PARTNER DASHBOARD
   ═══════════════════════════════════════════════════════════════════ */

// ─── HELPERS ──────────────────────────────────────────────────────
const isVerified = (user) => user?.verificationStatus === 'Verified';

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
    { id: 'verification', label: 'Verification', icon: <ShieldCheck size={20} /> },
    { id: 'post-job', label: 'Post Job', icon: <Plus size={20} />, locked: !verified },
    { id: 'post-ojt', label: 'Post OJT', icon: <Briefcase size={20} />, locked: !verified },
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
                <div className="ln-dropdown-divider" />
                <div className="ln-dropdown-item" onClick={() => { setActivePage('verification'); setShowProfileMenu(false); }}>
                  <ShieldCheck size={16} /> Verification
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
        <h2 className="ln-profile-name">{partner?.companyName}</h2>
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
      { label: 'Post a Job', icon: <Plus size={16} />, page: 'post-job', locked: !verified },
      { label: 'Post OJT Opportunity', icon: <Briefcase size={16} />, page: 'post-ojt', locked: !verified },
      { label: 'View Applicants', icon: <Users size={16} />, page: 'applicants', locked: !verified },
      { label: 'Verification', icon: <ShieldCheck size={16} />, page: 'verification', locked: false },
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
  const { currentUser, partners, jobPostings, getPartnerApplicants } = useApp();
  const partner = partners.find(p => p.id === currentUser?.id);
  const verified = isVerified(currentUser);
  const myJobs = jobPostings.filter(j => j.partnerId === currentUser?.id);
  const myApplicants = getPartnerApplicants(currentUser?.id);
  const initials = currentUser?.companyName?.charAt(0)?.toUpperCase() || 'P';

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
                  <div style={{ fontSize: 13, color: '#a16207' }}>Upload your Business Permit to unlock job & OJT posting features.</div>
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
                <Plus size={16} /> Post Job
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

        {/* Recent Applicants as Feed */}
        <div className="ln-card">
          <div className="ln-section-header">
            <h3>Recent Applicants</h3>
            <button className="ln-link-btn" onClick={() => { if (verified) setActivePage('applicants'); }}>
              View all <ChevronRight size={14} />
            </button>
          </div>
          <div className="ln-opportunities-list">
            {myApplicants.slice(0, 5).map(a => (
              <div key={a.id} className="ln-opportunity-item">
                <div className="ln-opportunity-icon" style={{ background: '#ede9fe', color: '#7c3aed', borderRadius: '50%' }}>
                  {a.trainee?.name?.charAt(0)?.toUpperCase() || 'T'}
                </div>
                <div className="ln-opportunity-info">
                  <div className="ln-opportunity-title">{a.trainee?.name || '—'}</div>
                  <div className="ln-opportunity-company">Applied for: {a.job?.title || '—'}</div>
                  <div className="ln-opportunity-details">
                    <span><Clock size={12} /> {a.appliedAt}</span>
                    <span className="ln-opp-type-badge">{a.job?.opportunityType}</span>
                  </div>
                  <div className="ln-match-row" style={{ marginTop: 8 }}>
                    <div className="ln-match-bar" style={{ flex: 1 }}>
                      <div
                        className={`ln-match-fill ${a.matchRate >= 70 ? 'high' : a.matchRate >= 40 ? 'mid' : 'low'}`}
                        style={{ width: `${a.matchRate}%` }}
                      />
                    </div>
                    <span className="ln-match-pct">{a.matchRate}% match</span>
                  </div>
                </div>
                <div className="ln-opportunity-actions">
                  <span className={`ln-badge ${a.status === 'Pending' ? 'ln-badge-yellow' : a.status === 'Accepted' ? 'ln-badge-green' : 'ln-badge-red'}`}>
                    {a.status}
                  </span>
                </div>
              </div>
            ))}
            {myApplicants.length === 0 && (
              <div className="ln-empty-widget" style={{ padding: 40 }}>
                <Users size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p>No applicants yet. Post opportunities to start receiving applications!</p>
              </div>
            )}
          </div>
        </div>

        {/* My Posted Opportunities */}
        {myJobs.length > 0 && (
          <div className="ln-card">
            <div className="ln-section-header">
              <h3>Your Posted Opportunities</h3>
              <span className="ln-badge ln-badge-blue">{myJobs.length} total</span>
            </div>
            <div className="ln-opportunities-list">
              {myJobs.slice(0, 4).map(job => (
                <div key={job.id} className="ln-opportunity-item">
                  <div className="ln-opportunity-icon">
                    <Briefcase size={20} />
                  </div>
                  <div className="ln-opportunity-info">
                    <div className="ln-opportunity-title">{job.title}</div>
                    <div className="ln-opportunity-details">
                      <span><MapPin size={12} /> {job.location}</span>
                      <span><Clock size={12} /> {job.employmentType}</span>
                      <span className="ln-opp-type-badge">{job.opportunityType}</span>
                    </div>
                  </div>
                  <div className="ln-opportunity-actions">
                    <span className={`ln-badge ${job.status === 'Open' ? 'ln-badge-green' : 'ln-badge-gray'}`}>{job.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
  const status = currentUser?.verificationStatus || 'Pending Verification';
  const hasBusinessPermit = currentUser?.documents?.businessPermit === 'uploaded';
  const [selectedFile, setSelectedFile] = useState(hasBusinessPermit);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!selectedFile) return;
    submitPartnerDocuments(currentUser.id, { businessPermit: 'uploaded' });
    setSubmitted(true);
  };

  return (
    <div className="ln-page-content">
      <div className="ln-page-header">
        <div>
          <h1 className="ln-page-title">Account Verification</h1>
          <p className="ln-page-subtitle">Upload required documents to verify your account</p>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Status Card */}
      <div className="ln-card" style={{ marginBottom: 16 }}>
        <div className="ln-section-header">
          <h3>Verification Status</h3>
        </div>
        <div style={{ padding: '0 16px 16px' }}>
          <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', lineHeight: 1.6 }}>
            {status === 'Verified'
              ? 'Your account is fully verified. You can post jobs and OJT opportunities.'
              : status === 'Under Review'
                ? 'Your documents are being reviewed by our administrators. Please wait for approval.'
                : 'Upload your Business Permit below to begin the verification process.'}
          </p>
        </div>
      </div>

      {/* Verification Steps */}
      <div className="ln-card" style={{ marginBottom: 16 }}>
        <div className="ln-section-header"><h3>Verification Steps</h3></div>
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { step: 1, label: 'Register your company account', done: true },
            { step: 2, label: 'Upload Business Permit', done: hasBusinessPermit || status === 'Under Review' || status === 'Verified' },
            { step: 3, label: 'Admin reviews your documents', done: status === 'Verified' },
            { step: 4, label: 'Account verified — start posting!', done: status === 'Verified' },
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
        <div className="ln-card">
          <div className="ln-section-header"><h3>Upload Business Permit</h3></div>
          <div style={{ padding: '0 16px 16px' }}>
            {(status === 'Under Review' || submitted) ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <FileCheck size={48} color="#0ea5e9" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: 16, fontWeight: 700, color: 'rgba(0,0,0,0.9)', marginBottom: 6 }}>Documents Submitted</h4>
                <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.55)' }}>Your Business Permit has been submitted and is under review by the administrators.</p>
              </div>
            ) : (
              <>
                <div style={{
                  border: '2px dashed #cbd5e1', borderRadius: 12, padding: '28px 20px',
                  textAlign: 'center', marginBottom: 16,
                  background: selectedFile ? '#f0fdf4' : '#f8fafc',
                  borderColor: selectedFile ? '#86efac' : '#cbd5e1',
                  cursor: 'pointer', transition: 'all 0.2s'
                }} onClick={() => setSelectedFile(!selectedFile)}>
                  <Upload size={32} color={selectedFile ? '#16a34a' : '#94a3b8'} style={{ margin: '0 auto 10px' }} />
                  {selectedFile ? (
                    <>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#166534' }}>Business_Permit.pdf</div>
                      <div style={{ fontSize: 12, color: '#16a34a', marginTop: 4 }}>File selected • Click to remove</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#475569' }}>Click to select your Business Permit</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>PDF, JPG, or PNG • Max 10MB</div>
                    </>
                  )}
                </div>
                <button
                  className="ln-btn ln-btn-primary"
                  style={{ width: '100%', padding: '10px 20px', fontSize: 14 }}
                  disabled={!selectedFile}
                  onClick={handleSubmit}
                >
                  <Send size={16} /> Submit for Verification
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── PAGE: POST JOB ───────────────────────────────────────────────
const PostJob = ({ setActivePage, opportunityType = 'Job' }) => {
  const { addJobPosting, NC_COMPETENCIES, currentUser } = useApp();
  const [form, setForm] = useState({
    title: '', opportunityType, ncLevel: 'CSS NC II', description: '',
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
            <h1 className="ln-page-title">Post {opportunityType === 'OJT' ? 'OJT Opportunity' : 'Job'}</h1>
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
          <h1 className="ln-page-title">Post {opportunityType === 'OJT' ? 'OJT Opportunity' : 'New Job'}</h1>
          <p className="ln-page-subtitle">Create a new {opportunityType === 'OJT' ? 'OJT' : 'job'} posting</p>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="ln-profile-two-col">
          <div className="ln-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'rgba(0,0,0,0.9)', marginBottom: 16 }}>Opportunity Details</h3>
            <div className="form-group">
              <label className="ln-info-label">Title *</label>
              <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder={opportunityType === 'OJT' ? 'e.g. Web Dev OJT Trainee' : 'e.g. Junior IT Technician'} required />
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
              <textarea className="form-input" rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the opportunity..." />
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
                <input className="form-input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="City" required />
              </div>
              <div className="form-group">
                <label className="ln-info-label">Salary Range</label>
                <input className="form-input" value={form.salaryRange} onChange={e => setForm({ ...form, salaryRange: e.target.value })} placeholder="₱15,000 – ₱20,000/month" />
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
  const { currentUser, partners } = useApp();
  const partner = partners.find(p => p.id === currentUser?.id);
  if (!partner) return null;
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
              <div>
                <h1 className="ln-profile-header-name">{partner.companyName}</h1>
                <p className="ln-profile-header-headline">{partner.industry} &bull; Industry Partner</p>
                <p className="ln-profile-header-loc"><MapPin size={14} /> {partner.address || 'Philippines'}</p>
                <p className="ln-profile-header-contact">{partner.email}</p>
              </div>
              <StatusBadge status={partner.verificationStatus} />
            </div>
          </div>
        </div>
      </div>

      <div className="ln-profile-two-col">
        <div className="ln-profile-main">
          {/* Company Information */}
          <div className="ln-card">
            <div className="ln-section-header"><h3>Company Information</h3></div>
            <div className="ln-info-grid">
              {[
                { label: 'Contact Person', key: 'contactPerson' },
                { label: 'Email', key: 'email' },
                { label: 'Phone', key: 'phone' },
                { label: 'Address', key: 'address' },
                { label: 'Company Size', key: 'companySize' },
                { label: 'Website', key: 'website' },
              ].map(f => (
                <div key={f.key} className="ln-info-item">
                  <label className="ln-info-label">{f.label}</label>
                  <div className="ln-info-value">{partner[f.key] || '—'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="ln-profile-sidebar">
          {/* Documents */}
          <div className="ln-card">
            <div className="ln-section-header"><h3>Documents</h3></div>
            {[
              { key: 'businessPermit', label: 'Business Permit' },
              { key: 'secRegistration', label: 'SEC Registration' },
            ].map(doc => (
              <div key={doc.key} className="ln-doc-item">
                <div className="ln-doc-info">
                  <FileText size={16} color="rgba(0,0,0,0.5)" />
                  <span>{doc.label}</span>
                </div>
                {partner.documents?.[doc.key]
                  ? <span className="ln-badge ln-badge-green" style={{ fontSize: 11 }}><CheckCircle size={11} /> Uploaded</span>
                  : <span className="ln-badge ln-badge-red" style={{ fontSize: 11 }}>Missing</span>
                }
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN EXPORT ──────────────────────────────────────────────────
export default function PartnerDashboard() {
  const [activePage, setActivePage] = useState('dashboard');

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <PartnerHome setActivePage={setActivePage} />;
      case 'post-job': return <PostJob setActivePage={setActivePage} opportunityType="Job" />;
      case 'post-ojt': return <PostJob setActivePage={setActivePage} opportunityType="OJT" />;
      case 'applicants': return <ViewApplicants setActivePage={setActivePage} />;
      case 'profile': return <CompanyProfile />;
      case 'verification': return <VerificationPage />;
      default: return <PartnerHome setActivePage={setActivePage} />;
    }
  };

  return (
    <PartnerLayout activePage={activePage} setActivePage={setActivePage}>
      {renderPage()}
    </PartnerLayout>
  );
}
