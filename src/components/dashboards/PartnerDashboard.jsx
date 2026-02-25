import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard, Briefcase, List, Users, Building2, LogOut,
  Bell, ChevronDown, Plus, Edit, X, CheckCircle, Search, Eye,
  TrendingUp, FileText, Clock, MapPin, CheckSquare, AlertCircle,
  XCircle, Send, Star, MoreVertical
} from 'lucide-react';

// ─── REUSABLE LAYOUT ──────────────────────────────────────────────
const AppLayout = ({ sidebar, children, pageTitle, pageSubtitle }) => {
  const { currentUser, userRole, logout } = useApp();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const initials = currentUser?.contactPerson?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'IP';
  return (
    <div className="app-layout">
      {sidebar}
      <div className="main-content">
        <header className="top-header">
          <div>
            <div className="header-title">{pageTitle}</div>
            {pageSubtitle && <div className="header-subtitle">{pageSubtitle}</div>}
          </div>
          <div className="header-actions">
            <div style={{ position: 'relative' }}>
              <button className="header-icon-btn" onClick={() => setShowNotif(!showNotif)}>
                <Bell size={17} />
                <span className="notif-badge">2</span>
              </button>
              {showNotif && (
                <div className="dropdown-menu" style={{ minWidth: 240 }}>
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: 13 }}>Notifications</div>
                  {['New applicant for Junior IT Technician', 'Job posting approved by Admin'].map((n, i) => (
                    <div key={i} className="dropdown-item" style={{ fontSize: 12.5, alignItems: 'flex-start' }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6', marginTop: 4, flexShrink: 0, marginRight: 8 }} />{n}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <div className="header-profile" onClick={() => setShowProfile(!showProfile)}>
                <div className="profile-avatar" style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>{initials}</div>
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
const PartnerSidebar = ({ activePage, setActivePage }) => {
  const { currentUser, logout } = useApp();
  const initials = currentUser?.companyName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'IP';
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} /> },
    { id: 'post-job', label: 'Post a Job', icon: <Plus size={17} /> },
    { id: 'manage-jobs', label: 'Manage Jobs', icon: <List size={17} /> },
    { id: 'applicants', label: 'Applicants', icon: <Users size={17} /> },
    { id: 'company', label: 'Company Profile', icon: <Building2 size={17} /> },
  ];
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo" style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>TT</div>
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-name">TraineeTrack</div>
          <div className="sidebar-brand-sub">Partner Portal</div>
        </div>
      </div>
      <div className="sidebar-section-label">Navigation</div>
      <div className="sidebar-nav">
        {navItems.map(item => (
          <div key={item.id} className={`sidebar-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => setActivePage(item.id)}>
            {item.icon} {item.label}
          </div>
        ))}
      </div>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar" style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{currentUser?.companyName}</div>
            <div className="sidebar-user-role">Industry Partner</div>
          </div>
        </div>
        <div className="sidebar-item" onClick={logout} style={{ color: '#f87171' }}>
          <LogOut size={16} /> Sign Out
        </div>
      </div>
    </nav>
  );
};

// ─── PROGRESS BAR ──────────────────────────────────────────────────
const ProgressBar = ({ value }) => {
  const cls = value >= 70 ? 'progress-high' : value >= 40 ? 'progress-mid' : 'progress-low';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div className="progress-bar-wrap" style={{ flex: 1 }}>
        <div className={`progress-bar-fill ${cls}`} style={{ width: `${value}%` }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', minWidth: 32, textAlign: 'right' }}>{value}%</span>
    </div>
  );
};

// ─── PAGE 1: PARTNER DASHBOARD ────────────────────────────────────
const PartnerHome = ({ setActivePage }) => {
  const { currentUser, jobPostings, getPartnerApplicants } = useApp();
  const myJobs = jobPostings.filter(j => j.partnerId === currentUser?.id);
  const allApplicants = getPartnerApplicants(currentUser?.id);

  const stats = [
    { label: 'Active Jobs', value: myJobs.filter(j => j.status === 'Open').length, icon: <Briefcase size={22} color="#2563eb" />, bg: '#dbeafe', sub: `${myJobs.length} total postings` },
    { label: 'Total Applicants', value: allApplicants.length, icon: <Users size={22} color="#7c3aed" />, bg: '#ede9fe', sub: `${allApplicants.filter(a => a.status === 'Pending').length} awaiting review` },
    { label: 'Filled Positions', value: myJobs.filter(j => j.status === 'Filled').length, icon: <CheckCircle size={22} color="#16a34a" />, bg: '#dcfce7', sub: 'Successfully hired' },
  ];

  const recentApplicants = allApplicants.slice(0, 5);

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0c4a6e 0%, #0ea5e9 100%)',
        borderRadius: 16, padding: '22px 28px', marginBottom: 24, color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Welcome, {currentUser?.companyName}!</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{currentUser?.industry} &bull; {currentUser?.address}</div>
        </div>
        <button className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }} onClick={() => setActivePage('post-job')}>
          <Plus size={15} /> Post a Job
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div className="stat-info">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Applicants */}
      <div className="card">
        <div className="section-header">
          <div>
            <div className="section-title">Recent Applicants</div>
            <div className="section-subtitle">Latest applications across all your job postings</div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => setActivePage('applicants')}>View All</button>
        </div>
        <div style={{ overflowX: 'auto', marginTop: 8 }}>
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Position Applied</th><th>Match %</th><th>Certifications</th><th>Status</th></tr>
            </thead>
            <tbody>
              {recentApplicants.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.graduate?.name}</td>
                  <td style={{ fontSize: 13, color: '#64748b' }}>{a.job?.title}</td>
                  <td><ProgressBar value={a.matchRate} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {a.graduate?.certifications?.slice(0, 2).map(c => <span key={c} className="badge badge-blue" style={{ fontSize: 10 }}>{c}</span>)}
                    </div>
                  </td>
                  <td><span className={`badge badge-${a.status.toLowerCase()}`}>{a.status}</span></td>
                </tr>
              ))}
              {recentApplicants.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No applicants yet. Post a job to attract graduates!</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── PAGE 2: POST JOB ──────────────────────────────────────────────
const PostJob = ({ setActivePage }) => {
  const { addJobPosting, NC_COMPETENCIES } = useApp();
  const [form, setForm] = useState({
    title: '', ncLevel: 'CSS NC II', description: '', employmentType: 'Full-time',
    location: '', salaryRange: '', slots: 1, industry: '', selectedCompetencies: [],
  });
  const [success, setSuccess] = useState(false);

  const ncLevels = Object.keys(NC_COMPETENCIES);
  const availableComps = NC_COMPETENCIES[form.ncLevel] || [];

  const toggleComp = (comp) => {
    const sel = form.selectedCompetencies;
    setForm({ ...form, selectedCompetencies: sel.includes(comp) ? sel.filter(c => c !== comp) : [...sel, comp] });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.description) return alert('Please fill in all required fields.');
    addJobPosting({
      title: form.title, ncLevel: form.ncLevel, description: form.description,
      employmentType: form.employmentType, location: form.location, salaryRange: form.salaryRange,
      slots: form.slots, industry: form.industry,
      requiredCompetencies: form.selectedCompetencies,
    });
    setSuccess(true);
    setTimeout(() => { setSuccess(false); setActivePage('manage-jobs'); }, 2000);
  };

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Post a Job</div><div className="page-subtitle">Create a new job posting for PSTDII graduates</div></div>
      </div>

      {success && <div className="alert alert-success"><CheckCircle size={16} /> Job posted successfully! Redirecting...</div>}

      <form onSubmit={handleSubmit}>
        <div className="two-col" style={{ marginBottom: 16 }}>
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: '#0f172a' }}>Basic Information</div>
            <div className="form-group"><label className="form-label">Job Title *</label><input type="text" className="form-input" placeholder="e.g., Junior IT Technician" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">Industry</label><input type="text" className="form-input" placeholder="e.g., Information Technology" value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} /></div>
            <div className="two-col">
              <div className="form-group"><label className="form-label">Employment Type</label><select className="form-select" value={form.employmentType} onChange={e => setForm({ ...form, employmentType: e.target.value })}><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option></select></div>
              <div className="form-group"><label className="form-label">Available Slots</label><input type="number" className="form-input" min={1} value={form.slots} onChange={e => setForm({ ...form, slots: Number(e.target.value) })} /></div>
            </div>
            <div className="form-group"><label className="form-label">Location</label><input type="text" className="form-input" placeholder="e.g., Makati City" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Salary Range</label><input type="text" className="form-input" placeholder="e.g., ₱18,000 – ₱22,000/month" value={form.salaryRange} onChange={e => setForm({ ...form, salaryRange: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Job Description *</label><textarea className="form-textarea" placeholder="Describe the role, responsibilities, and qualifications..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required /></div>
          </div>

          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: '#0f172a' }}>TESDA Qualifications</div>
            <div className="form-group">
              <label className="form-label">Required NC Level</label>
              <select className="form-select" value={form.ncLevel} onChange={e => setForm({ ...form, ncLevel: e.target.value, selectedCompetencies: [] })}>
                {ncLevels.map(nc => <option key={nc}>{nc}</option>)}
              </select>
            </div>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#475569', marginBottom: 10 }}>
              Select Required Competencies <span style={{ color: '#94a3b8', fontWeight: 400 }}>({form.selectedCompetencies.length} selected)</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {availableComps.map(comp => (
                <label key={comp} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${form.selectedCompetencies.includes(comp) ? '#3b82f6' : '#e2e8f0'}`, background: form.selectedCompetencies.includes(comp) ? '#dbeafe' : 'white', transition: 'all 0.15s' }}>
                  <input type="checkbox" checked={form.selectedCompetencies.includes(comp)} onChange={() => toggleComp(comp)} style={{ marginTop: 2, accentColor: '#2563eb' }} />
                  <span style={{ fontSize: 13, color: '#475569' }}>{comp}</span>
                </label>
              ))}
            </div>
            {form.selectedCompetencies.length === 0 && (
              <div className="alert alert-info" style={{ marginTop: 12 }}><AlertCircle size={14} /> Select at least one required competency for better matching.</div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="btn btn-outline" onClick={() => setActivePage('manage-jobs')}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-lg"><Send size={15} /> Post Job</button>
        </div>
      </form>
    </div>
  );
};

// ─── PAGE 3: MANAGE JOBS ───────────────────────────────────────────
const ManageJobs = ({ setActivePage }) => {
  const { currentUser, jobPostings, updateJobPosting, deleteJobPosting } = useApp();
  const myJobs = jobPostings.filter(j => j.partnerId === currentUser?.id);
  const [search, setSearch] = useState('');
  const [editJob, setEditJob] = useState(null);

  const filtered = myJobs.filter(j => j.title.toLowerCase().includes(search.toLowerCase()));

  const statusBadge = (s) => {
    const map = { Open: 'badge-open', Closed: 'badge-closed', Filled: 'badge-filled' };
    return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Manage Jobs</div><div className="page-subtitle">Review and manage your job postings</div></div>
        <button className="btn btn-primary" onClick={() => setActivePage('post-job')}><Plus size={15} /> Post New Job</button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {['All', 'Open', 'Closed', 'Filled'].map(s => (
              <span key={s} className={`badge ${s === 'Open' ? 'badge-open' : s === 'Closed' ? 'badge-closed' : s === 'Filled' ? 'badge-filled' : 'badge-gray'}`}
                style={{ cursor: 'pointer', padding: '4px 12px' }}>
                {s} ({s === 'All' ? myJobs.length : myJobs.filter(j => j.status === s).length})
              </span>
            ))}
          </div>
          <div className="search-bar" style={{ width: 220 }}>
            <Search size={14} color="#94a3b8" />
            <input placeholder="Search jobs..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Job Title</th><th>NC Level</th><th>Type</th><th>Date Posted</th><th>Slots</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(job => (
                <tr key={job.id}>
                  <td style={{ fontWeight: 600, color: '#1e3a5f' }}>{job.title}</td>
                  <td><span className="badge badge-purple">{job.ncLevel}</span></td>
                  <td><span className="badge badge-gray">{job.employmentType}</span></td>
                  <td style={{ fontSize: 13, color: '#64748b' }}>{job.datePosted}</td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{job.slots}</td>
                  <td>{statusBadge(job.status)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {job.status === 'Open' && (
                        <>
                          <button className="btn btn-outline btn-sm" onClick={() => setEditJob(job)}><Edit size={12} /></button>
                          <button className="btn btn-outline btn-sm" style={{ color: '#d97706', borderColor: '#fde68a' }} onClick={() => updateJobPosting(job.id, { status: 'Closed' })}>Close</button>
                          <button className="btn btn-success btn-sm" onClick={() => updateJobPosting(job.id, { status: 'Filled' })}>Filled</button>
                        </>
                      )}
                      {job.status !== 'Open' && (
                        <button className="btn btn-outline btn-sm" style={{ color: '#16a34a', borderColor: '#bbf7d0' }} onClick={() => updateJobPosting(job.id, { status: 'Open' })}>Re-open</button>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={() => { if (window.confirm('Delete this job?')) deleteJobPosting(job.id); }}><X size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No jobs found. <button className="btn btn-primary btn-sm" onClick={() => setActivePage('post-job')}>Post a Job</button></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Job Modal */}
      {editJob && (
        <div className="modal-overlay" onClick={() => setEditJob(null)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Job: {editJob.title}</h3>
              <button className="btn btn-outline btn-icon" onClick={() => setEditJob(null)}><X size={16} /></button>
            </div>
            <div className="form-group"><label className="form-label">Job Title</label><input type="text" className="form-input" value={editJob.title} onChange={e => setEditJob({ ...editJob, title: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Location</label><input type="text" className="form-input" value={editJob.location} onChange={e => setEditJob({ ...editJob, location: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Salary Range</label><input type="text" className="form-input" value={editJob.salaryRange} onChange={e => setEditJob({ ...editJob, salaryRange: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={editJob.description} onChange={e => setEditJob({ ...editJob, description: e.target.value })} /></div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setEditJob(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { updateJobPosting(editJob.id, editJob); setEditJob(null); }}><CheckCircle size={15} /> Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── PAGE 4: APPLICANTS ──────────────────────────────────────────
const Applicants = () => {
  const { currentUser, jobPostings, getPartnerApplicants, updateApplicationStatus } = useApp();
  const myJobs = jobPostings.filter(j => j.partnerId === currentUser?.id);
  const allApplicants = getPartnerApplicants(currentUser?.id);
  const [selectedJobId, setSelectedJobId] = useState('all');
  const [search, setSearch] = useState('');
  const [viewGrad, setViewGrad] = useState(null);

  const filtered = allApplicants.filter(a => {
    const matchJob = selectedJobId === 'all' || a.jobId === Number(selectedJobId);
    const q = search.toLowerCase();
    return matchJob && (a.graduate?.name?.toLowerCase().includes(q) || a.job?.title?.toLowerCase().includes(q));
  });

  const ProgressBar = ({ value }) => {
    const cls = value >= 70 ? 'progress-high' : value >= 40 ? 'progress-mid' : 'progress-low';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div className="progress-bar-wrap" style={{ width: 80 }}>
          <div className={`progress-bar-fill ${cls}`} style={{ width: `${value}%` }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: value >= 70 ? '#16a34a' : value >= 40 ? '#d97706' : '#dc2626' }}>{value}%</span>
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Applicants</div><div className="page-subtitle">Review graduate applications to your job postings</div></div>
        <div className="badge badge-blue">{allApplicants.length} total applicants</div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="form-select" style={{ width: 'auto', minWidth: 180 }} value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)}>
            <option value="all">All Positions</option>
            {myJobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
          <div className="search-bar" style={{ flex: 1, minWidth: 180 }}>
            <Search size={14} color="#94a3b8" /><input placeholder="Search applicant name..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Applicant</th><th>Position</th><th>Match %</th><th>Certifications</th><th>Applied</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #dbeafe, #ede9fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#2563eb' }}>
                        {a.graduate?.name?.charAt(0)}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.graduate?.name}</div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: '#64748b' }}>{a.job?.title}</td>
                  <td><ProgressBar value={a.matchRate} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {a.graduate?.certifications?.slice(0, 2).map(c => <span key={c} className="badge badge-blue" style={{ fontSize: 10 }}>{c}</span>)}
                    </div>
                  </td>
                  <td style={{ fontSize: 12.5, color: '#64748b' }}>{a.appliedAt}</td>
                  <td><span className={`badge badge-${a.status.toLowerCase()}`}>{a.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => setViewGrad(a)}><Eye size={12} /> Profile</button>
                      {a.status === 'Pending' && (
                        <>
                          <button className="btn btn-success btn-sm" onClick={() => updateApplicationStatus(a.id, 'Accepted', 'Qualified candidate.')}><CheckCircle size={12} /></button>
                          <button className="btn btn-danger btn-sm" onClick={() => updateApplicationStatus(a.id, 'Rejected', 'Not a fit at this time.')}><XCircle size={12} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No applicants found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Graduate Modal */}
      {viewGrad && (
        <div className="modal-overlay" onClick={() => setViewGrad(null)}>
          <div className="modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Graduate Profile</h3>
              <button className="btn btn-outline btn-icon" onClick={() => setViewGrad(null)}><X size={16} /></button>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: 'white' }}>
                {viewGrad.graduate?.name?.charAt(0)}
              </div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{viewGrad.graduate?.name}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{viewGrad.graduate?.email} &bull; Grad Year: {viewGrad.graduate?.graduationYear}</div>
              <div style={{ marginTop: 8, display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                {viewGrad.graduate?.certifications?.map(c => <span key={c} className="badge badge-blue"><Star size={10} />{c}</span>)}
              </div>
              <div style={{ marginTop: 8 }}>
                <span className={`badge badge-${viewGrad.matchRate >= 70 ? 'green' : viewGrad.matchRate >= 40 ? 'yellow' : 'red'}`}>
                  {viewGrad.matchRate}% Match for {viewGrad.job?.title}
                </span>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Competencies</div>
              {viewGrad.graduate?.competencies?.map(c => (
                <div key={c} className="competency-item"><CheckSquare size={14} color="#16a34a" /><span style={{ fontSize: 13, color: '#475569' }}>{c}</span></div>
              ))}
            </div>
            {viewGrad.status === 'Pending' && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => { updateApplicationStatus(viewGrad.id, 'Rejected', 'Not a fit at this time.'); setViewGrad(null); }}><XCircle size={15} /> Reject</button>
                <button className="btn btn-success" style={{ flex: 1 }} onClick={() => { updateApplicationStatus(viewGrad.id, 'Accepted', 'Qualified candidate.'); setViewGrad(null); }}><CheckCircle size={15} /> Accept</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── PAGE 5: COMPANY PROFILE ───────────────────────────────────────
const CompanyProfile = () => {
  const { currentUser, partners } = useApp();
  const partner = partners.find(p => p.id === currentUser?.id) || currentUser;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...partner });
  const initials = partner?.companyName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CO';

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Company Profile</div><div className="page-subtitle">Your company information and verification status</div></div>
        <button className={`btn ${editing ? 'btn-success' : 'btn-primary'}`} onClick={() => setEditing(!editing)}>
          {editing ? <><CheckCircle size={15} /> Save</> : <><Edit size={15} /> Edit Profile</>}
        </button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="profile-bg-header" style={{ background: 'linear-gradient(135deg, #0c4a6e 0%, #0ea5e9 100%)' }} />
        <div style={{ padding: '48px 24px 24px' }}>
          <div className="profile-avatar-large" style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', fontSize: 22 }}>{initials}</div>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>{partner?.companyName}</h2>
          <p style={{ fontSize: 13, color: '#64748b' }}>{partner?.industry} &bull; {partner?.address}</p>
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className={`badge badge-${partner?.verificationStatus?.toLowerCase()}`}>{partner?.verificationStatus}</span>
            {partner?.website && <span style={{ fontSize: 12, color: '#2563eb' }}>🌐 {partner.website}</span>}
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="section-title" style={{ marginBottom: 14 }}>Company Details</div>
          {[
            { label: 'Company Name', key: 'companyName' },
            { label: 'Contact Person', key: 'contactPerson' },
            { label: 'Email', key: 'email' },
            { label: 'Phone', key: 'phone' },
            { label: 'Address', key: 'address' },
            { label: 'Industry', key: 'industry' },
            { label: 'Company Size', key: 'companySize' },
            { label: 'Website', key: 'website' },
          ].map(f => (
            <div key={f.key} className="form-group" style={{ marginBottom: 10 }}>
              <label className="form-label">{f.label}</label>
              {editing ? <input type="text" className="form-input" value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                : <div style={{ fontSize: 13.5, color: '#475569', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>{partner?.[f.key] || '—'}</div>}
            </div>
          ))}
        </div>
        <div className="card">
          <div className="section-title" style={{ marginBottom: 14 }}>Verification Documents</div>
          {[
            { key: 'businessPermit', label: 'Business Permit' },
            { key: 'secRegistration', label: 'SEC Registration' },
          ].map(doc => (
            <div key={doc.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={15} color="#64748b" />
                <span style={{ fontSize: 13.5, color: '#475569' }}>{doc.label}</span>
              </div>
              {partner?.documents?.[doc.key] ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="badge badge-accepted"><CheckCircle size={11} /> Uploaded</span>
                </div>
              ) : (
                <button className="btn btn-outline btn-sm">Upload</button>
              )}
            </div>
          ))}
          <div style={{ marginTop: 16, padding: 14, background: '#f8fafc', borderRadius: 10, border: '1px dashed #e2e8f0' }}>
            <div style={{ fontSize: 12.5, color: '#64748b', textAlign: 'center' }}>
              <AlertCircle size={16} style={{ display: 'block', margin: '0 auto 6px', color: '#94a3b8' }} />
              Upload required documents to complete verification. Your account status is currently: <span style={{ fontWeight: 700 }}>{partner?.verificationStatus}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN INDUSTRY PARTNER DASHBOARD ─────────────────────────────
export default function PartnerDashboard() {
  const [activePage, setActivePage] = useState('dashboard');

  const pageMap = {
    dashboard: { title: 'Dashboard', sub: 'Overview of your job postings and applicants' },
    'post-job': { title: 'Post a Job', sub: 'Create a new job posting for PSTDII graduates' },
    'manage-jobs': { title: 'Manage Jobs', sub: 'Review and manage your job postings' },
    applicants: { title: 'Applicants', sub: 'Review applications from PSTDII graduates' },
    company: { title: 'Company Profile', sub: 'Your company information and verification' },
  };

  const current = pageMap[activePage] || pageMap.dashboard;

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <PartnerHome setActivePage={setActivePage} />;
      case 'post-job': return <PostJob setActivePage={setActivePage} />;
      case 'manage-jobs': return <ManageJobs setActivePage={setActivePage} />;
      case 'applicants': return <Applicants />;
      case 'company': return <CompanyProfile />;
      default: return <PartnerHome setActivePage={setActivePage} />;
    }
  };

  return (
    <AppLayout sidebar={<PartnerSidebar activePage={activePage} setActivePage={setActivePage} />} pageTitle={current.title} pageSubtitle={current.sub}>
      {renderPage()}
    </AppLayout>
  );
}
