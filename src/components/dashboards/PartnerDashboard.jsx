import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard, Briefcase, FileText, Users, Building2, LogOut,
  ChevronDown, Search, Plus, Eye, X, CheckCircle, XCircle,
  MapPin, Send, Award, ChevronRight, Trash2, Menu, Lock,
  Upload, AlertTriangle, Clock, ShieldCheck, FileCheck
} from 'lucide-react';

// ─── HELPERS ──────────────────────────────────────────────────────
const isVerified = (user) => user?.verificationStatus === 'Verified';

// ─── LAYOUT ───────────────────────────────────────────────────────
const AppLayout = ({ sidebar, children, pageTitle, pageSubtitle }) => {
  const { currentUser, logout } = useApp();
  const [showProfile, setShowProfile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const initials = currentUser?.companyName?.charAt(0) || 'P';
  return (
    <div className="app-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      {React.cloneElement(sidebar, { mobileOpen: sidebarOpen, closeSidebar: () => setSidebarOpen(false) })}
      <div className="main-content">
        <header className="top-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
            <div>
              <div className="header-title">{pageTitle}</div>
              {pageSubtitle && <div className="header-subtitle">{pageSubtitle}</div>}
            </div>
          </div>
          <div className="header-actions">
            <div style={{ position: 'relative' }}>
              <div className="header-profile" onClick={() => setShowProfile(!showProfile)}>
                <div className="profile-avatar" style={{ background: 'linear-gradient(135deg, #0ea5e9, #2563eb)' }}>{initials}</div>
                <div>
                  <div className="profile-name">{currentUser?.companyName || 'Partner'}</div>
                  <div className="profile-role">Industry Partner</div>
                </div>
                <ChevronDown size={14} color="#94a3b8" />
              </div>
              {showProfile && (
                <div className="dropdown-menu">
                  <div className="dropdown-item"><Building2 size={14} /> Company Profile</div>
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

// ─── SIDEBAR ──────────────────────────────────────────────────────
const PartnerSidebar = ({ activePage, setActivePage, mobileOpen, closeSidebar }) => {
  const { currentUser, logout } = useApp();
  const initials = currentUser?.companyName?.charAt(0) || 'P';
  const verified = isVerified(currentUser);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} />, locked: false },
    { id: 'profile', label: 'Company Profile', icon: <Building2 size={17} />, locked: false },
    { id: 'verification', label: 'Verification', icon: <ShieldCheck size={17} />, locked: false },
    { id: 'post-job', label: 'Post Job', icon: <Plus size={17} />, locked: !verified },
    { id: 'post-ojt', label: 'Post OJT Opportunity', icon: <Briefcase size={17} />, locked: !verified },
    { id: 'applicants', label: 'Applicants', icon: <Users size={17} />, locked: !verified },
  ];

  const handleNav = (item) => {
    if (item.locked) return;
    setActivePage(item.id);
    if (closeSidebar) closeSidebar();
  };

  return (
    <nav className={`sidebar ${mobileOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-logo" style={{ background: 'linear-gradient(135deg, #0ea5e9, #2563eb)' }}>TT</div>
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-name">TraineeTrack</div>
          <div className="sidebar-brand-sub">Partner Portal</div>
        </div>
      </div>
      <div className="sidebar-section-label">Navigation</div>
      <div className="sidebar-nav">
        {navItems.map(item => (
          <div
            key={item.id}
            className={`sidebar-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => handleNav(item)}
            style={{
              ...(item.locked ? { color: '#94a3b8', cursor: 'not-allowed', opacity: 0.55 } : {}),
            }}
            title={item.locked ? 'Verification required to access this feature' : ''}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
              {item.icon} {item.label}
            </div>
            {item.locked && <Lock size={13} color="#94a3b8" />}
          </div>
        ))}
      </div>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar" style={{ background: 'linear-gradient(135deg, #0ea5e9, #2563eb)' }}>{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{currentUser?.companyName}</div>
            <div className="sidebar-user-role">Industry Partner</div>
          </div>
        </div>
        <div className="sidebar-item" onClick={logout} style={{ color: '#f87171' }}><LogOut size={16} /> Sign Out</div>
      </div>
    </nav>
  );
};

// ─── STATUS BADGE HELPER ──────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    'Pending Verification': { bg: '#fef3c7', color: '#92400e', icon: <Clock size={12} /> },
    'Under Review': { bg: '#dbeafe', color: '#1e40af', icon: <FileCheck size={12} /> },
    'Verified': { bg: '#dcfce7', color: '#166534', icon: <CheckCircle size={12} /> },
    'Rejected': { bg: '#fee2e2', color: '#991b1b', icon: <XCircle size={12} /> },
  };
  const style = map[status] || map['Pending Verification'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 12px', borderRadius: 20,
      background: style.bg, color: style.color,
      fontSize: 12, fontWeight: 600
    }}>
      {style.icon} {status}
    </span>
  );
};

// ─── PAGE 1: PARTNER DASHBOARD ────────────────────────────────────
const PartnerHome = ({ setActivePage }) => {
  const { currentUser, jobPostings, getPartnerApplicants } = useApp();
  const verified = isVerified(currentUser);
  const myJobs = jobPostings.filter(j => j.partnerId === currentUser?.id);
  const myApplicants = getPartnerApplicants(currentUser?.id);

  const stats = [
    { label: 'Active Opportunities', value: myJobs.filter(j => j.status === 'Open').length, icon: <Briefcase size={22} color="#0ea5e9" />, bg: '#e0f2fe', sub: `${myJobs.length} total` },
    { label: 'Total Applicants', value: myApplicants.length, icon: <Users size={22} color="#7c3aed" />, bg: '#ede9fe', sub: `${myApplicants.filter(a => a.status === 'Pending').length} pending` },
    { label: 'Accepted', value: myApplicants.filter(a => a.status === 'Accepted').length, icon: <CheckCircle size={22} color="#16a34a" />, bg: '#dcfce7', sub: 'Candidates hired' },
    { label: 'Avg Match Rate', value: myApplicants.length > 0 ? `${Math.round(myApplicants.reduce((s, a) => s + a.matchRate, 0) / myApplicants.length)}%` : '0%', icon: <Award size={22} color="#d97706" />, bg: '#fef3c7', sub: 'Applicant compatibility' },
  ];

  return (
    <div>
      {/* Verification Banner */}
      {!verified && (
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fff7ed 100%)',
          border: '1px solid #fbbf24',
          borderRadius: 12, padding: '16px 22px', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <AlertTriangle size={22} color="#d97706" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#92400e', marginBottom: 2 }}>
                Your account is pending verification
              </div>
              <div style={{ fontSize: 13, color: '#a16207' }}>
                Please upload your Business Permit to activate job and OJT posting features.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <StatusBadge status={currentUser?.verificationStatus} />
            <button className="btn btn-primary btn-sm" onClick={() => setActivePage('verification')} style={{ whiteSpace: 'nowrap' }}>
              <Upload size={14} /> Upload Business Permit
            </button>
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0c4a6e 0%, #0ea5e9 100%)',
        borderRadius: 16, padding: '22px 28px', marginBottom: 24, color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
      }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Welcome, {currentUser?.companyName}! 🏢</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{currentUser?.industry} &bull; {currentUser?.address}</div>
        </div>
        {verified && (
          <button className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }} onClick={() => setActivePage('post-job')}>
            <Plus size={15} /> Post Opportunity
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div className="stat-info"><div className="stat-label">{s.label}</div><div className="stat-value">{s.value}</div><div className="stat-sub">{s.sub}</div></div>
          </div>
        ))}
      </div>

      {/* Recent Applicants */}
      <div className="card">
        <div className="section-header">
          <div><div className="section-title">Recent Applicants</div><div className="section-subtitle">Latest trainee applications to your opportunities</div></div>
          <button className="btn btn-outline btn-sm" onClick={() => { if (verified) setActivePage('applicants'); }}>View All <ChevronRight size={14} /></button>
        </div>
        <div style={{ overflowX: 'auto', marginTop: 8 }}>
          <table className="data-table">
            <thead><tr><th>Trainee</th><th>Opportunity</th><th>Type</th><th>Match</th><th>Status</th><th>Applied</th></tr></thead>
            <tbody>
              {myApplicants.slice(0, 5).map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.trainee?.name || '—'}</td>
                  <td style={{ color: '#64748b', fontSize: 13 }}>{a.job?.title || '—'}</td>
                  <td><span className="badge badge-cyan" style={{ fontSize: 10 }}>{a.job?.opportunityType}</span></td>
                  <td><span style={{ fontWeight: 700, color: a.matchRate >= 70 ? '#16a34a' : a.matchRate >= 40 ? '#d97706' : '#dc2626' }}>{a.matchRate}%</span></td>
                  <td><span className={`badge badge-${a.status.toLowerCase()}`}>{a.status}</span></td>
                  <td style={{ fontSize: 12.5, color: '#64748b' }}>{a.appliedAt}</td>
                </tr>
              ))}
              {myApplicants.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No applicants yet.</td></tr>}
            </tbody>
          </table>
        </div>
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
    <div>
      <div className="page-header"><div><div className="page-title">Account Verification</div><div className="page-subtitle">Upload required documents to verify your account</div></div></div>

      {/* Status Card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="section-title" style={{ marginBottom: 4 }}>Verification Status</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              {status === 'Verified'
                ? 'Your account is fully verified. You can post jobs and OJT opportunities.'
                : status === 'Under Review'
                  ? 'Your documents are being reviewed by our administrators. Please wait for approval.'
                  : 'Upload your Business Permit below to begin the verification process.'}
            </div>
          </div>
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Verification Steps */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title" style={{ marginBottom: 16 }}>Verification Steps</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { step: 1, label: 'Register your company account', done: true },
            { step: 2, label: 'Upload Business Permit', done: hasBusinessPermit || status === 'Under Review' || status === 'Verified' },
            { step: 3, label: 'Admin reviews your documents', done: status === 'Verified' },
            { step: 4, label: 'Account verified — start posting!', done: status === 'Verified' },
          ].map(s => (
            <div key={s.step} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
              background: s.done ? '#f0fdf4' : '#f8fafc',
              borderRadius: 10, border: `1px solid ${s.done ? '#bbf7d0' : '#e2e8f0'}`
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

      {/* Upload Section — only show if not yet verified */}
      {status !== 'Verified' && (
        <div className="card">
          <div className="section-title" style={{ marginBottom: 16 }}>Upload Business Permit</div>

          {(status === 'Under Review' || submitted) ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <FileCheck size={48} color="#2563eb" style={{ margin: '0 auto 12px' }} />
              <h4 style={{ fontSize: 16, fontWeight: 700, color: '#1e3a5f', marginBottom: 6 }}>Documents Submitted</h4>
              <p style={{ fontSize: 13, color: '#64748b' }}>Your Business Permit has been submitted and is under review by the administrators.</p>
            </div>
          ) : (
            <>
              <div style={{
                border: '2px dashed #cbd5e1', borderRadius: 12, padding: '28px 20px',
                textAlign: 'center', marginBottom: 16,
                background: selectedFile ? '#f0fdf4' : '#f8fafc',
                borderColor: selectedFile ? '#86efac' : '#cbd5e1',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
                onClick={() => setSelectedFile(!selectedFile)}
              >
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
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                disabled={!selectedFile}
                onClick={handleSubmit}
              >
                <Send size={16} /> Submit for Verification
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ─── PAGE 2: POST JOB ─────────────────────────────────────────────
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
      <div>
        <div className="page-header"><div><div className="page-title">Post {opportunityType === 'OJT' ? 'OJT Opportunity' : 'Job'}</div><div className="page-subtitle">Create a new posting</div></div></div>
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <AlertTriangle size={48} color="#d97706" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Account Verification Required</h3>
          <p style={{ fontSize: 14, color: '#64748b', maxWidth: 500, margin: '0 auto 24px' }}>
            Your account is currently <strong>{currentUser?.verificationStatus || 'Pending Verification'}</strong>.
            You must be fully verified before posting opportunities.
            Please upload your Business Permit on the Verification page.
          </p>
          <button className="btn btn-outline" onClick={() => setActivePage('verification')}>Go to Verification</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header"><div><div className="page-title">Post {opportunityType === 'OJT' ? 'OJT Opportunity' : 'New Job'}</div><div className="page-subtitle">Create a new {opportunityType === 'OJT' ? 'OJT' : 'job'} posting</div></div></div>
      <form onSubmit={handleSubmit}>
        <div className="two-col">
          <div className="card">
            <div className="section-title" style={{ marginBottom: 16 }}>Opportunity Details</div>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder={opportunityType === 'OJT' ? 'e.g. Web Dev OJT Trainee' : 'e.g. Junior IT Technician'} required />
            </div>
            <div className="form-group">
              <label className="form-label">Opportunity Type *</label>
              <select className="form-select" value={form.opportunityType} onChange={e => setForm({ ...form, opportunityType: e.target.value })}>
                <option>Job</option><option>OJT</option><option>Apprenticeship</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">NC Level Required *</label>
              <select className="form-select" value={form.ncLevel} onChange={e => setForm({ ...form, ncLevel: e.target.value, requiredCompetencies: [] })}>
                {Object.keys(NC_COMPETENCIES).map(nc => <option key={nc}>{nc}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the opportunity..." />
            </div>
            <div className="form-group">
              <label className="form-label">Employment Type</label>
              <select className="form-select" value={form.employmentType} onChange={e => setForm({ ...form, employmentType: e.target.value })}>
                <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option>
              </select>
            </div>
            <div className="two-col" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Location *</label>
                <input className="form-input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="City" required />
              </div>
              <div className="form-group">
                <label className="form-label">Salary Range</label>
                <input className="form-input" value={form.salaryRange} onChange={e => setForm({ ...form, salaryRange: e.target.value })} placeholder="₱15,000 – ₱20,000/month" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Available Slots</label>
              <input type="number" className="form-input" min={1} value={form.slots} onChange={e => setForm({ ...form, slots: Number(e.target.value) })} />
            </div>
          </div>
          <div className="card">
            <div className="section-title" style={{ marginBottom: 16 }}>Required Competencies</div>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>Select the competencies required for <strong>{form.ncLevel}</strong>:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {availableComps.map(comp => (
                <label key={comp} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: form.requiredCompetencies.includes(comp) ? '#dbeafe' : '#f8fafc', borderRadius: 8, cursor: 'pointer', border: `1.5px solid ${form.requiredCompetencies.includes(comp) ? '#3b82f6' : '#e2e8f0'}`, transition: 'all 0.15s' }}>
                  <input type="checkbox" checked={form.requiredCompetencies.includes(comp)} onChange={() => toggleComp(comp)} style={{ marginTop: 2 }} />
                  <span style={{ fontSize: 13.5, color: '#475569' }}>{comp}</span>
                </label>
              ))}
            </div>
            <div style={{ marginTop: 20 }}>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                <Send size={16} /> Post Opportunity
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

// ─── PAGE 3: MANAGE / VIEW JOBS ───────────────────────────────────
const ManageJobs = () => {
  const { currentUser, jobPostings, updateJobPosting, deleteJobPosting } = useApp();
  const myJobs = jobPostings.filter(j => j.partnerId === currentUser?.id);
  const [search, setSearch] = useState('');
  const filtered = myJobs.filter(j => j.title.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <div className="page-header"><div><div className="page-title">Manage Opportunities</div><div className="page-subtitle">View and manage your posted opportunities</div></div>
        <div className="badge badge-blue">{myJobs.length} postings</div>
      </div>
      <div className="card">
        <div style={{ marginBottom: 14 }}><div className="search-bar" style={{ maxWidth: 320 }}><Search size={14} color="#94a3b8" /><input placeholder="Search opportunities..." value={search} onChange={e => setSearch(e.target.value)} /></div></div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead><tr><th>Title</th><th>Type</th><th>NC Level</th><th>Location</th><th>Slots</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(j => (
                <tr key={j.id}>
                  <td style={{ fontWeight: 600, color: '#1e3a5f' }}>{j.title}</td>
                  <td><span className="badge badge-cyan">{j.opportunityType}</span></td>
                  <td><span className="badge badge-purple">{j.ncLevel}</span></td>
                  <td style={{ fontSize: 13, color: '#64748b' }}><div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} />{j.location}</div></td>
                  <td style={{ textAlign: 'center' }}>{j.slots}</td>
                  <td><span className={`badge badge-${j.status.toLowerCase()}`}>{j.status}</span></td>
                  <td><div style={{ display: 'flex', gap: 6 }}>
                    {j.status === 'Open' ? <button className="btn btn-outline btn-sm" onClick={() => updateJobPosting(j.id, { status: 'Closed' })}>Close</button> : <button className="btn btn-success btn-sm" onClick={() => updateJobPosting(j.id, { status: 'Open' })}>Re-open</button>}
                    <button className="btn btn-danger btn-sm" onClick={() => { if (window.confirm('Delete this opportunity?')) deleteJobPosting(j.id); }}><Trash2 size={12} /></button>
                  </div></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No opportunities found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── PAGE 4: VIEW APPLICANTS ──────────────────────────────────────
const ViewApplicants = ({ setActivePage }) => {
  const { currentUser, getPartnerApplicants, updateApplicationStatus } = useApp();

  if (!isVerified(currentUser)) {
    return (
      <div>
        <div className="page-header"><div><div className="page-title">Applicants</div><div className="page-subtitle">Review trainee applications</div></div></div>
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <AlertTriangle size={48} color="#d97706" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Account Verification Required</h3>
          <p style={{ fontSize: 14, color: '#64748b', maxWidth: 500, margin: '0 auto 24px' }}>
            You need to verify your account before viewing applicants.
          </p>
          <button className="btn btn-outline" onClick={() => setActivePage('verification')}>Go to Verification</button>
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
    <div>
      <div className="page-header"><div><div className="page-title">Applicants</div><div className="page-subtitle">Review trainee applications to your opportunities</div></div>
        <div className="badge badge-blue">{applicants.length} total</div>
      </div>
      <div className="card">
        <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 200 }}><Search size={14} color="#94a3b8" /><input placeholder="Search trainee or opportunity..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <select className="form-select" style={{ width: 'auto', minWidth: 140 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            {['All', 'Pending', 'Accepted', 'Rejected'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead><tr><th>Trainee</th><th>Opportunity</th><th>Type</th><th>Match Rate</th><th>Applied</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.trainee?.name || '—'}</td>
                  <td style={{ fontSize: 13, color: '#64748b' }}>{a.job?.title || '—'}</td>
                  <td><span className="badge badge-cyan" style={{ fontSize: 10 }}>{a.job?.opportunityType}</span></td>
                  <td><span style={{ fontWeight: 700, color: a.matchRate >= 70 ? '#16a34a' : a.matchRate >= 40 ? '#d97706' : '#dc2626' }}>{a.matchRate}%</span></td>
                  <td style={{ fontSize: 12.5, color: '#64748b' }}>{a.appliedAt}</td>
                  <td><span className={`badge badge-${a.status.toLowerCase()}`}>{a.status}</span></td>
                  <td><div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => setViewApp(a)}><Eye size={12} /> View</button>
                    {a.status === 'Pending' && <>
                      <button className="btn btn-success btn-sm" onClick={() => updateApplicationStatus(a.id, 'Accepted', 'Approved by partner.')}><CheckCircle size={12} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => updateApplicationStatus(a.id, 'Rejected', 'Not selected.')}><XCircle size={12} /></button>
                    </>}
                  </div></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No applicants found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {viewApp && (
        <div className="modal-overlay" onClick={() => setViewApp(null)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">Applicant Details</h3><button className="btn btn-outline btn-icon" onClick={() => setViewApp(null)}><X size={16} /></button></div>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #ede9fe, #dbeafe)', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#7c3aed' }}>{viewApp.trainee?.name?.charAt(0)}</div>
              <div style={{ fontWeight: 800, fontSize: 17 }}>{viewApp.trainee?.name}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{viewApp.trainee?.email}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              {[['Opportunity', viewApp.job?.title], ['Match Rate', `${viewApp.matchRate}%`], ['Applied', viewApp.appliedAt], ['Status', viewApp.status]].map(([k, v]) => (
                <div key={k} style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>{k}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: '#475569' }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Certifications</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {viewApp.trainee?.certifications?.map(c => <span key={c} className="badge badge-blue"><Award size={10} /> {c}</span>)}
              </div>
            </div>
            {viewApp.status === 'Pending' && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => { updateApplicationStatus(viewApp.id, 'Rejected', 'Not selected.'); setViewApp(null); }}><XCircle size={15} /> Reject</button>
                <button className="btn btn-success" style={{ flex: 1 }} onClick={() => { updateApplicationStatus(viewApp.id, 'Accepted', 'Approved by partner.'); setViewApp(null); }}><CheckCircle size={15} /> Accept</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── PAGE 5: COMPANY PROFILE ──────────────────────────────────────
const CompanyProfile = () => {
  const { currentUser, partners } = useApp();
  const partner = partners.find(p => p.id === currentUser?.id);
  if (!partner) return null;
  return (
    <div>
      <div className="page-header"><div><div className="page-title">Company Profile</div><div className="page-subtitle">Your company information</div></div></div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: 'linear-gradient(135deg, #e0f2fe, #ede9fe)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: '#0ea5e9' }}>{partner.companyName?.charAt(0)}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{partner.companyName}</div>
          <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>{partner.industry}</div>
          <div style={{ marginTop: 10 }}><StatusBadge status={partner.verificationStatus} /></div>
        </div>
      </div>
      <div className="two-col">
        <div className="card">
          <div className="section-title" style={{ marginBottom: 14 }}>Company Information</div>
          {[['Contact Person', partner.contactPerson], ['Email', partner.email], ['Phone', partner.phone], ['Address', partner.address], ['Company Size', partner.companySize], ['Website', partner.website]].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: 13.5, color: '#64748b' }}>{k}</span>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>{v || '—'}</span>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="section-title" style={{ marginBottom: 14 }}>Uploaded Documents</div>
          {[['businessPermit', 'Business Permit'], ['secRegistration', 'SEC Registration']].map(([key, label]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={15} color="#64748b" /><span style={{ fontSize: 13.5 }}>{label}</span></div>
              {partner.documents?.[key] ? <span className="badge badge-green"><CheckCircle size={11} /> Uploaded</span> : <span className="badge badge-red">Missing</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── MAIN EXPORT ──────────────────────────────────────────────────
export default function PartnerDashboard() {
  const [activePage, setActivePage] = useState('dashboard');
  const pageMap = {
    dashboard: { title: 'Partner Dashboard', sub: 'Overview of your recruitment activity' },
    'post-job': { title: 'Post Job', sub: 'Create a new job posting' },
    'post-ojt': { title: 'Post OJT Opportunity', sub: 'Create a new OJT posting' },
    applicants: { title: 'Applicants', sub: 'Review trainee applications' },
    profile: { title: 'Company Profile', sub: 'Your company information' },
    verification: { title: 'Verification', sub: 'Upload documents to verify your account' },
  };
  const current = pageMap[activePage] || pageMap.dashboard;
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
    <AppLayout sidebar={<PartnerSidebar activePage={activePage} setActivePage={setActivePage} />} pageTitle={current.title} pageSubtitle={current.sub}>
      {renderPage()}
    </AppLayout>
  );
}
