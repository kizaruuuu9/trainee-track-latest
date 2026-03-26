import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Loader, Users, Building2, ShieldCheck, Mail, MapPin, Building, Lock, Send, Eye, EyeOff } from 'lucide-react';
import Step1IDUpload from './Step1IDUpload';
import Step2PersonalInfo from './Step2PersonalInfo';
import { supabase } from '../../lib/supabase';

const STEPS = [
  { number: 1, label: 'Account Setup' },
  { number: 2, label: 'Verification' },
];

const REG_UPLOAD_MAX_DIMENSION = 1280;
const REG_UPLOAD_QUALITY = 0.75;

const isHttpUrl = (value = '') => /^https?:\/\//i.test(String(value || '').trim());

const dataUrlToBlob = async (dataUrl) => {
  const response = await fetch(dataUrl);
  return response.blob();
};

const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(blob);
});

const compressImageDataUrl = async (dataUrl) => {
  if (!String(dataUrl || '').startsWith('data:image/')) {
    return dataUrl;
  }

  const sourceBlob = await dataUrlToBlob(dataUrl);
  const sourceUrl = URL.createObjectURL(sourceBlob);

  try {
    const image = await new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = sourceUrl;
    });

    const ratio = Math.min(1, REG_UPLOAD_MAX_DIMENSION / Math.max(image.width || 1, image.height || 1));
    const width = Math.max(1, Math.round((image.width || 1) * ratio));
    const height = Math.max(1, Math.round((image.height || 1) * ratio));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, width, height);

    const compressedDataUrl = canvas.toDataURL('image/jpeg', REG_UPLOAD_QUALITY);
    return compressedDataUrl;
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
};

export default function RegistrationFlow({ onBackToLogin }) {
  const [selectedRole, setSelectedRole] = useState(null); // 'trainee' | 'partner'
  const [currentStep, setCurrentStep] = useState(1);
  const [traineeData, setTraineeData] = useState({
    step1: {
      frontID: null, backID: null, fullName: '', studentId: '', programId: '', program: '',
      address: '', gender: '', trainingStatus: '', graduationYear: '', ocrStatus: null,
    },
    step2: {
      birthdate: '', selfieUrl: null, email: '', emailVerified: false,
      password: '', confirmPassword: '',
    },
  });

  const [partnerData, setPartnerData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    address: '',
    password: '',
    confirmPassword: '',
  });

  // OTP State for Partner
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [showPartnerPassword, setShowPartnerPassword] = useState(false);
  const [showPartnerConfirmPassword, setShowPartnerConfirmPassword] = useState(false);

  const [step1Valid, setStep1Valid] = useState(false);
  const [step2Valid, setStep2Valid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const prepareRegistrationImage = async (rawValue, folder, suffix) => {
    const value = String(rawValue || '').trim();
    if (!value) return { uploadedUrl: null, fallbackBase64: null };

    if (isHttpUrl(value)) {
      return { uploadedUrl: value, fallbackBase64: null };
    }

    if (!value.startsWith('data:image/')) {
      return { uploadedUrl: null, fallbackBase64: value };
    }

    let optimizedDataUrl = value;
    try {
      optimizedDataUrl = await compressImageDataUrl(value);
    } catch (compressionError) {
      console.warn('Image compression failed, using original image payload.', compressionError);
    }

    try {
      const optimizedBlob = await dataUrlToBlob(optimizedDataUrl);
      const path = `${folder}/pre-register/${Date.now()}_${Math.random().toString(36).slice(2)}_${suffix}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('registration-uploads')
        .upload(path, optimizedBlob, { contentType: 'image/jpeg', upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage.from('registration-uploads').getPublicUrl(path);
      if (urlData?.publicUrl) {
        return { uploadedUrl: urlData.publicUrl, fallbackBase64: null };
      }
    } catch (uploadError) {
      console.warn('Direct image upload failed; falling back to compact base64 payload.', uploadError);
    }

    try {
      const optimizedBlob = await dataUrlToBlob(optimizedDataUrl);
      const fallbackDataUrl = await blobToDataUrl(optimizedBlob);
      return { uploadedUrl: null, fallbackBase64: fallbackDataUrl };
    } catch {
      return { uploadedUrl: null, fallbackBase64: optimizedDataUrl };
    }
  };

  // ─── OTP Cooldown Timer ──────────────────────────────────────
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setTimeout(() => setOtpCooldown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  // ─── Trainee Step Handlers ─────────────────────────────────────
  const updateTrainee1 = (data) => setTraineeData(prev => ({ ...prev, step1: { ...prev.step1, ...data } }));
  const updateTrainee2 = (data) => setTraineeData(prev => ({ ...prev, step2: { ...prev.step2, ...data } }));

  // ─── Partner OTP Logic ─────────────────────────────────────────
  const handleSendOTP = async () => {
    if (!partnerData.email || otpCooldown > 0) return;
    setOtpLoading(true);
    setOtpSent(false);
    setOtpError('');
    try {
      const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '');
      const res = await fetch(`${API_BASE}/api/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: partnerData.email })
      });
      const result = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          const retry = Number(result?.retryAfter || 60);
          if (Number.isFinite(retry) && retry > 0) setOtpCooldown(retry);
        }
        throw new Error(result.error || 'Failed to send OTP');
      }
      setOtpSent(true);
      setOtpCooldown(60);
    } catch (err) {
      setOtpError(err.message === 'Failed to fetch' ? 'Unable to connect to server.' : err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length < 6) return;
    setIsVerifyingOtp(true);
    setOtpError('');
    try {
      const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '');
      const res = await fetch(`${API_BASE}/api/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: partnerData.email, otp: otpCode })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Invalid OTP');
      if (result.verified) {
        setOtpVerified(true);
        setOtpSent(false);
      }
    } catch (err) {
      setOtpError(err.message === 'Failed to fetch' ? 'Unable to connect to server.' : err.message);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const isPartnerValid = partnerData.companyName && partnerData.contactPerson &&
    partnerData.email && partnerData.address &&
    partnerData.password && partnerData.password === partnerData.confirmPassword &&
    partnerData.password.length >= 8 && otpVerified;

  // ─── Final Submit ────────────────────────────────────────────
  const handleFinalSubmit = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '');

      let payload = {};
      let endpoint = '/api/register';

      if (selectedRole === 'trainee') {
        const { step1, step2 } = traineeData;

        const [frontPrepared, backPrepared, selfiePrepared] = await Promise.all([
          prepareRegistrationImage(step1.frontID?.url, 'ids', 'front'),
          prepareRegistrationImage(step1.backID?.url, 'ids', 'back'),
          prepareRegistrationImage(step2.selfieUrl, 'selfies', 'selfie'),
        ]);

        payload = {
          email: step2.email, password: step2.password, fullName: step1.fullName,
          studentId: step1.studentId, programId: step1.programId, program: step1.program, address: step1.address,
          gender: step1.gender, trainingStatus: step1.trainingStatus,
          graduationYear: step1.graduationYear, birthdate: step2.birthdate,
          frontIdUrl: frontPrepared.uploadedUrl,
          backIdUrl: backPrepared.uploadedUrl,
          selfieUrl: selfiePrepared.uploadedUrl,
          frontIdBase64: frontPrepared.fallbackBase64,
          backIdBase64: backPrepared.fallbackBase64,
          selfieBase64: selfiePrepared.fallbackBase64,
        };
      } else {
        endpoint = '/api/register-partner';
        payload = { ...partnerData };
      }

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Registration failed.');

      setSubmitted(true);
    } catch (err) {
      console.error('Registration error:', err);
      setSaveError(err.message === 'Failed to fetch' ? 'Server connection failed.' : err.message);
    } finally {
      setSaving(false);
    }
  };

  // ─── Renderers ──────────────────────────────────────────────

  const renderRoleSelection = () => (
    <div className="page-enter">
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>I Am Registering As</h3>
        <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Select your account type to continue</p>
      </div>
      <div className="role-selection-grid">
        <div className={`role-card ${selectedRole === 'trainee' ? 'selected' : ''}`} onClick={() => setSelectedRole('trainee')}>
          <div className="selection-check"><CheckCircle size={20} fill="#2563eb" color="white" /></div>
          <div className="role-icon-wrap"><Users size={32} /></div>
          <div className="role-title">Trainee</div>
          <p className="role-desc">For students and graduates looking for opportunities and competency analysis.</p>
        </div>
        <div className={`role-card ${selectedRole === 'partner' ? 'pn-selected' : ''}`} onClick={() => setSelectedRole('partner')}>
          <div className="selection-check"><CheckCircle size={20} fill={selectedRole === 'partner' ? "#10b981" : "#2563eb"} color="white" /></div>
          <div className="role-icon-wrap pn-role-icon-wrap"><Building2 size={32} /></div>
          <div className="role-title">Industry Partner</div>
          <p className="role-desc">For companies and organizations looking to hire or offer OJT slots to skilled trainees.</p>
        </div>
      </div>
    </div>
  );

  const renderPartnerRegistration = () => (
    <div className="page-enter">
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1e3a5f', borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: 16 }}>Company Information</div>
        <div className="reg-form-grid">
          <div className="form-group reg-full-width">
            <label className="form-label">Company Name</label>
            <div style={{ position: 'relative' }}>
              <input className="form-input" style={{ paddingLeft: 38 }} placeholder="e.g. Acme Corporation" value={partnerData.companyName} onChange={e => setPartnerData({ ...partnerData, companyName: e.target.value })} />
              <Building size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Contact Person</label>
            <div style={{ position: 'relative' }}>
              <input className="form-input" style={{ paddingLeft: 38 }} placeholder="Full Name" value={partnerData.contactPerson} onChange={e => setPartnerData({ ...partnerData, contactPerson: e.target.value })} />
              <Users size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>
          <div className="form-group reg-full-width">
            <label className="form-label">Company Address</label>
            <div style={{ position: 'relative' }}>
              <input className="form-input" style={{ paddingLeft: 38 }} placeholder="Full business address" value={partnerData.address} onChange={e => setPartnerData({ ...partnerData, address: e.target.value })} />
              <MapPin size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>

          <div className="reg-full-width" style={{ fontWeight: 700, fontSize: 14, color: selectedRole === 'partner' ? '#064e3b' : '#1e3a5f', borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginTop: 12, marginBottom: 16 }}>Account Security</div>

          <div className="form-group reg-full-width">
            <label className="form-label">Email Address</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: 38 }}
                  placeholder="company@email.com"
                  value={partnerData.email}
                  onChange={e => {
                    const nextEmail = e.target.value;
                    setPartnerData({ ...partnerData, email: nextEmail });
                    setOtpError('');
                    setOtpCooldown(0);
                    if (!otpVerified) {
                      setOtpSent(false);
                      setOtpCode('');
                    }
                  }}
                  disabled={otpVerified}
                />
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              </div>
              <button
                type="button"
                className={`btn ${otpVerified ? 'btn-success' : (selectedRole === 'partner' ? 'pn-btn-primary' : 'btn-primary')}`}
                style={{ height: 42, width: 120, ...(selectedRole === 'partner' && !otpVerified && !otpLoading && otpCooldown <= 0 ? { background: '#10b981', borderColor: '#10b981' } : {}) }}
                onClick={handleSendOTP}
                disabled={!partnerData.email || otpVerified || otpLoading || otpCooldown > 0}
              >
                {otpVerified ? (
                  <><ShieldCheck size={16} /> Verified</>
                ) : otpLoading ? (
                  <><Loader size={14} style={{ animation: 'ocr-spin 0.8s linear infinite' }} /> Sending...</>
                ) : otpCooldown > 0 ? (
                  `Resend (${otpCooldown}s)`
                ) : (
                  <><Send size={14} /> Send OTP</>
                )}
              </button>
            </div>
            {otpError && !otpSent && (
              <p style={{ color: '#ef4444', fontSize: 12, marginTop: 8, fontWeight: 500 }}>{otpError}</p>
            )}
            {otpSent && !otpVerified && (
              <div style={{ marginTop: 14 }}>
                <div style={{
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                  border: '1px solid #93c5fd',
                  borderRadius: 10,
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  animation: 'fadeSlideIn 0.3s ease',
                }}>
                  <Mail size={18} style={{ color: selectedRole === 'partner' ? '#059669' : '#2563eb', flexShrink: 0 }} />
                  <div style={{ fontSize: 13, color: selectedRole === 'partner' ? '#064e3b' : '#1e40af' }}>
                    A 6-digit OTP has been sent to <strong>{partnerData.email}</strong>
                  </div>
                </div>
                <label className="form-label">Enter 6-digit OTP</label>
                <div className="step2-email-row">
                  <input
                    className="form-input step2-otp-input"
                    placeholder="000000"
                    style={{ flex: 1, letterSpacing: '0.3em', fontWeight: 700, fontSize: 18, textAlign: 'center' }}
                    maxLength={6}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ minWidth: 110 }}
                    onClick={handleVerifyOTP}
                    disabled={isVerifyingOtp || otpCode.length < 6}
                  >
                    {isVerifyingOtp ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
                {otpError && <div className="form-error" style={{ marginTop: 6 }}>{otpError}</div>}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPartnerPassword ? 'text' : 'password'} className="form-input" style={{ paddingLeft: 38, paddingRight: 40 }} placeholder="••••••••" value={partnerData.password} onChange={e => setPartnerData({ ...partnerData, password: e.target.value })} />
              <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <button
                type="button"
                onClick={() => setShowPartnerPassword(prev => !prev)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', color: '#64748b', cursor: 'pointer', padding: 2, display: 'inline-flex', alignItems: 'center' }}
                aria-label={showPartnerPassword ? 'Hide password' : 'Show password'}
              >
                {showPartnerPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPartnerConfirmPassword ? 'text' : 'password'} className="form-input" style={{ paddingLeft: 38, paddingRight: 40 }} placeholder="••••••••" value={partnerData.confirmPassword} onChange={e => setPartnerData({ ...partnerData, confirmPassword: e.target.value })} />
              <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <button
                type="button"
                onClick={() => setShowPartnerConfirmPassword(prev => !prev)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', color: '#64748b', cursor: 'pointer', padding: 2, display: 'inline-flex', alignItems: 'center' }}
                aria-label={showPartnerConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showPartnerConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="login-page">
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

      <div className="reg-container">
        {/* Header */}
        {!submitted && (
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 50, height: 50,
              background: selectedRole === 'partner' 
                ? 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)' 
                : 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
              borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px', fontSize: 18, fontWeight: 800, color: 'white',
              boxShadow: selectedRole === 'partner'
                ? '0 6px 16px rgba(16,185,129,0.35)'
                : '0 6px 16px rgba(37,99,235,0.35)'
            }}>TT</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Registration</h2>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Complete the steps to join TraineeTrack</p>
          </div>
        )}

        {/* Content Area */}
        <div className="reg-step-content">
          {!selectedRole && renderRoleSelection()}

          {selectedRole === 'trainee' && !submitted && (
            <>
              {currentStep === 1 && (
                <Step1IDUpload data={traineeData.step1} onChange={updateTrainee1} onValidChange={setStep1Valid} />
              )}
              {currentStep === 2 && (
                <Step2PersonalInfo data={traineeData.step2} onChange={updateTrainee2} onValidChange={setStep2Valid} />
              )}
            </>
          )}

          {selectedRole === 'partner' && !submitted && renderPartnerRegistration()}

          {submitted && (
            <div style={{ textAlign: 'center', padding: '40px 20px', animation: 'fadeSlideIn 0.4s ease' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(34,197,94,0.3)',
              }}>
                <CheckCircle size={32} style={{ color: 'white' }} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Registration Successful!</h3>
              <p style={{ fontSize: 14, color: '#64748b', maxWidth: 360, margin: '0 auto 24px', lineHeight: 1.6 }}>
                Your {selectedRole} account has been created successfully. You can now log in to access your dashboard.
              </p>
              <button className="btn btn-primary" onClick={onBackToLogin}>Go to Login</button>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        {!submitted && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 20, borderTop: '1px solid #e2e8f0' }}>
            <button
              className="btn btn-outline"
              disabled={saving}
              onClick={() => {
                if (!selectedRole) onBackToLogin();
                else if (selectedRole === 'trainee' && currentStep > 1) setCurrentStep(prev => prev - 1);
                else setSelectedRole(null);
              }}
            >
              <ArrowLeft size={15} />
              {!selectedRole ? 'Back to Login' : 'Back'}
            </button>

            {selectedRole && (
              <button
                className="btn btn-primary"
                disabled={
                  (selectedRole === 'trainee' && currentStep === 1 && !step1Valid) ||
                  (selectedRole === 'trainee' && currentStep === 2 && !step2Valid) ||
                  (selectedRole === 'partner' && !isPartnerValid) ||
                  saving
                }
                onClick={() => {
                  if (selectedRole === 'trainee' && currentStep < 2) setCurrentStep(prev => prev + 1);
                  else handleFinalSubmit();
                }}
              >
                {saving ? (
                  <><Loader size={15} className="spin" /> Processing...</>
                ) : (
                  <>{(selectedRole === 'partner' || (selectedRole === 'trainee' && currentStep === 2)) ? 'Create Account' : 'Next Step'} <ArrowRight size={15} /></>
                )}
              </button>
            )}
          </div>
        )}

        {saveError && (
          <div className="alert alert-error" style={{ marginTop: 16 }}>
            {saveError}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

