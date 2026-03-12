import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Eye, EyeOff, AlertCircle, ChevronRight, BookOpen, Users, Briefcase, BarChart2, X, CheckCircle, XCircle, Loader
} from 'lucide-react';

const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { id: 'upper', label: 'Uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { id: 'lower', label: 'Lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { id: 'number', label: 'Number', test: (pw) => /\d/.test(pw) },
  { id: 'special', label: 'Special character (!@#$...)', test: (pw) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw) },
];

export default function LoginScreen({ onShowRegistration }) {
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
    companyName: '', contactPerson: '', email: '', address: '',
    industry: '', website: '', password: '', confirmPassword: ''
  });
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Email check
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(null); // true = available, false = exists
  const [emailCheckError, setEmailCheckError] = useState('');

  const checkEmail = async (email) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailAvailable(null);
      return;
    }
    setEmailChecking(true);
    setEmailCheckError('');
    try {
      const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '';
      const res = await fetch(`${API_BASE}/api/check-duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'email', value: email })
      });
      const data = await res.json();
      if (res.ok) {
        setEmailAvailable(!data.exists);
      } else {
        setEmailCheckError(data.error || 'Failed to check email');
      }
    } catch (err) {
      setEmailCheckError('Unable to connect to server');
    } finally {
      setEmailChecking(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (showRegister && regForm.email) {
        checkEmail(regForm.email);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [regForm.email, showRegister]);

  // Password strength
  const passedRules = PASSWORD_RULES.filter(r => r.test(regForm.password || ''));
  const strengthPct = Math.round((passedRules.length / PASSWORD_RULES.length) * 100);
  const strengthColor = strengthPct <= 40 ? '#ef4444' : strengthPct <= 70 ? '#f59e0b' : '#10b981';


  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await login(username.trim(), password);
      if (!result.success) {
        setError(result.error || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('Unable to connect to server. Please try again.');
    }
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

      <div className="login-grid" style={{ width: '100%', maxWidth: 920, display: 'grid', gridTemplateColumns: '1fr 380px', gap: 48, alignItems: 'center', position: 'relative', zIndex: 1 }}>

        {/* Left side branding */}
        <div className="branding-section" style={{ color: 'white', padding: '0 20px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
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

          <h1 style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.15, marginBottom: 12, letterSpacing: '-0.02em' }}>
            Connecting<br />
            <span style={{ background: 'linear-gradient(90deg, #60a5fa, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Trainees
            </span>{' '}to<br />Opportunity
          </h1>

          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 24, maxWidth: 400 }}>
            A web-based analytics and competency-based matching platform for {appMetadata.orgName}
          </p>

          {/* Feature highlights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{
              width: 44, height: 44,
              background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
              borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 10px', fontSize: 16, fontWeight: 800, color: 'white',
              boxShadow: '0 6px 16px rgba(37,99,235,0.35)'
            }}>TT</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Welcome Back</h2>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 3 }}>Sign in to your TraineeTrack account</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="text"
                className={`form-input${error ? ' error' : ''}`}
                placeholder="Enter your email address"
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

          <div style={{ marginTop: 18, textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 18 }}>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>Don't have an account?</p>
            <button
              type="button"
              className="btn btn-outline"
              style={{ width: '100%', height: 40, borderRadius: 10, fontSize: 13.5, fontWeight: 700 }}
              onClick={() => onShowRegistration && onShowRegistration()}
            >
              Create an Account
            </button>
          </div>
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

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
