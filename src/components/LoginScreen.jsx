import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Eye, EyeOff, AlertCircle, ChevronRight, BookOpen, Users, Briefcase, BarChart2, X, CheckCircle
} from 'lucide-react';

const DEMO_ACCOUNTS = [
  { role: 'admin', username: 'admin', password: 'admin123', label: 'Administrator', color: '#7c3aed' },
  { role: 'trainee', username: 'juan.delacruz', password: 'grad123', label: 'Trainee', color: '#2563eb' },
  { role: 'partner', username: 'techsolutions', password: 'partner123', label: 'Industry Partner', color: '#0ea5e9' },
];

export default function LoginScreen() {
  const { login, appMetadata, registerPartner } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const [showRegister, setShowRegister] = useState(false);
  const [regForm, setRegForm] = useState({
    companyName: '', contactPerson: '', email: '', phone: '', address: '',
    industry: '', companySize: '', website: '', username: '', password: ''
  });
  const [regSuccess, setRegSuccess] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter your username and password.');
      return;
    }
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 600));
    const result = login(username.trim(), password);
    if (!result.success) {
      setError(result.error || 'Invalid credentials. Please try again.');
    }
    setLoading(false);
  };

  const handleQuickLogin = async (account) => {
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 400));
    login(account.username, account.password);
    setLoading(false);
  };

  const handleForgot = (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotSent(true);
  };

  return (
    <div className="login-page">
      {/* Decorative background elements */}
      <div style={{
        position: 'absolute', top: '10%', left: '5%',
        width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
        borderRadius: '50%'
      }} />
      <div style={{
        position: 'absolute', bottom: '5%', right: '8%',
        width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)',
        borderRadius: '50%'
      }} />

      <div style={{ width: '100%', maxWidth: 960, display: 'grid', gridTemplateColumns: '1fr 420px', gap: 48, alignItems: 'center', position: 'relative', zIndex: 1 }}>

        {/* Left side branding */}
        <div style={{ color: 'white', padding: '0 20px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
            <div style={{
              width: 60, height: 60,
              background: 'linear-gradient(135deg, #3b82f6 0%, #0ea5e9 100%)',
              borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800, color: 'white',
              boxShadow: '0 8px 24px rgba(59,130,246,0.5)'
            }}>TT</div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>TraineeTrack</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Competency & Certification Platform</div>
            </div>
          </div>

          <h1 style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.15, marginBottom: 16, letterSpacing: '-0.02em' }}>
            Connecting<br />
            <span style={{ background: 'linear-gradient(90deg, #60a5fa, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Trainees
            </span>{' '}to<br />Opportunity
          </h1>

          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: 36, maxWidth: 400 }}>
            A web-based analytics and competency-based matching platform for {appMetadata.orgName}
          </p>

          {/* Feature highlights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: <BarChart2 size={16} />, text: 'Employment analytics & tracking' },
              { icon: <Briefcase size={16} />, text: 'Competency-based opportunity matching' },
              { icon: <Users size={16} />, text: 'Direct industry partner connections' },
              { icon: <BookOpen size={16} />, text: 'Certification progress & gap analysis' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>
                <div style={{ color: '#60a5fa' }}>{f.icon}</div>
                {f.text}
              </div>
            ))}
          </div>
        </div>

        {/* Login Card */}
        <div className="login-card">
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 50, height: 50,
              background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
              borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px', fontSize: 18, fontWeight: 800, color: 'white',
              boxShadow: '0 6px 16px rgba(37,99,235,0.35)'
            }}>TT</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Welcome Back</h2>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Sign in to your TraineeTrack account</p>
          </div>

          {/* Quick login chips */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, textAlign: 'center' }}>Quick Demo Login</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {DEMO_ACCOUNTS.map(a => (
                <button key={a.role} onClick={() => handleQuickLogin(a)}
                  style={{
                    flex: 1, padding: '7px 4px', borderRadius: 8, border: `1.5px solid ${a.color}20`,
                    background: `${a.color}08`, cursor: 'pointer', fontSize: 11.5,
                    fontWeight: 600, color: a.color, transition: 'all 0.15s', fontFamily: 'inherit'
                  }}
                  onMouseEnter={e => { e.target.style.background = `${a.color}18`; }}
                  onMouseLeave={e => { e.target.style.background = `${a.color}08`; }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>or sign in manually</span>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          </div>

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Username or Email</label>
              <input
                type="text"
                className={`form-input${error ? ' error' : ''}`}
                placeholder="Enter your username or email"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input${error ? ' error' : ''}`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <div style={{ textAlign: 'right', marginTop: 6 }}>
                <button type="button" onClick={() => setShowForgot(true)}
                  style={{ background: 'none', border: 'none', fontSize: 12.5, color: '#2563eb', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>
                  Forgot Password?
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}
              style={{ width: '100%', marginTop: 4 }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  Sign In <ChevronRight size={16} />
                </span>
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 11.5, color: '#94a3b8', marginTop: 24 }}>
            New industry partner?{' '}
            <button type="button" onClick={() => setShowRegister(true)} style={{ color: '#2563eb', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>Register your company</button>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="modal-overlay" onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(''); }}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Reset Password</h3>
              <button className="btn btn-outline btn-icon" onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(''); }}>
                <X size={16} />
              </button>
            </div>
            {forgotSent ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <CheckCircle size={48} color="#16a34a" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Email Sent!</h4>
                <p style={{ fontSize: 13, color: '#64748b' }}>
                  Password reset instructions have been sent to <strong>{forgotEmail}</strong>.
                </p>
                <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(''); }}>
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgot}>
                <p style={{ fontSize: 13.5, color: '#64748b', marginBottom: 20 }}>
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" className="form-input" placeholder="your@email.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowForgot(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Send Reset Link</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Partner Registration Modal */}
      {showRegister && (
        <div className="modal-overlay" onClick={() => { if (!regSuccess) setShowRegister(false); }}>
          <div className="modal" style={{ maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Partner Registration</h3>
              <button className="btn btn-outline btn-icon" onClick={() => setShowRegister(false)}>
                <X size={16} />
              </button>
            </div>

            {regSuccess ? (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <CheckCircle size={56} color="#16a34a" style={{ margin: '0 auto 16px' }} />
                <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Registration Submitted</h4>
                <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
                  Thank you for registering! You can now log in and upload your Business Permit on your dashboard to begin the verification process.
                </p>
                <button className="btn btn-primary" onClick={() => {
                  setShowRegister(false);
                  setRegSuccess(false);
                  setRegForm({
                    companyName: '', contactPerson: '', email: '', phone: '', address: '',
                    industry: '', companySize: '', website: '', username: '', password: ''
                  });
                }}>
                  Return to Login
                </button>
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                registerPartner(regForm);
                setRegSuccess(true);
              }}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: '#1e3a5f', borderBottom: '1px solid #e2e8f0', paddingBottom: 6 }}>Company Details</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: 12, marginBottom: 4 }}>Company Name *</label>
                      <input className="form-input" required value={regForm.companyName} onChange={e => setRegForm({ ...regForm, companyName: e.target.value })} style={{ padding: '8px 12px' }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: 12, marginBottom: 4 }}>Contact Person *</label>
                      <input className="form-input" required value={regForm.contactPerson} onChange={e => setRegForm({ ...regForm, contactPerson: e.target.value })} style={{ padding: '8px 12px' }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: 12, marginBottom: 4 }}>Email Address *</label>
                      <input type="email" className="form-input" required value={regForm.email} onChange={e => setRegForm({ ...regForm, email: e.target.value })} style={{ padding: '8px 12px' }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: 12, marginBottom: 4 }}>Phone Number *</label>
                      <input className="form-input" required value={regForm.phone} onChange={e => setRegForm({ ...regForm, phone: e.target.value })} style={{ padding: '8px 12px' }} />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: 12, marginBottom: 4 }}>Company Address *</label>
                      <input className="form-input" required value={regForm.address} onChange={e => setRegForm({ ...regForm, address: e.target.value })} style={{ padding: '8px 12px' }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: 12, marginBottom: 4 }}>Industry *</label>
                      <input className="form-input" required value={regForm.industry} onChange={e => setRegForm({ ...regForm, industry: e.target.value })} placeholder="e.g. Information Technology" style={{ padding: '8px 12px' }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: 12, marginBottom: 4 }}>Company Size</label>
                      <select className="form-select" value={regForm.companySize} onChange={e => setRegForm({ ...regForm, companySize: e.target.value })} style={{ padding: '8px 12px' }}>
                        <option value="">Select Size</option>
                        <option>1-10</option>
                        <option>11-50</option>
                        <option>51-200</option>
                        <option>201-500</option>
                        <option>500+</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: '#1e3a5f', borderBottom: '1px solid #e2e8f0', paddingBottom: 6 }}>Account Credentials</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: 12, marginBottom: 4 }}>Username *</label>
                      <input className="form-input" required value={regForm.username} onChange={e => setRegForm({ ...regForm, username: e.target.value })} style={{ padding: '8px 12px' }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: 12, marginBottom: 4 }}>Password *</label>
                      <input type="password" className="form-input" required value={regForm.password} onChange={e => setRegForm({ ...regForm, password: e.target.value })} style={{ padding: '8px 12px' }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowRegister(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Submit Registration</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
