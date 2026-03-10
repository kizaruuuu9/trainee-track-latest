import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Loader } from 'lucide-react';
import Step1IDUpload from './Step1IDUpload';
import Step2PersonalInfo from './Step2PersonalInfo';

const STEPS = [
  { number: 1, label: 'School ID' },
  { number: 2, label: 'Account Setup' },
];

export default function RegistrationFlow({ onBackToLogin }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [stepData, setStepData] = useState({
    step1: {
      frontID: null,
      backID: null,
      fullName: '',
      studentId: '',
      program: '',
      address: '',
      gender: '',
      ocrStatus: null,
    },
    step2: {
      birthdate: '',
      selfieUrl: null,
      email: '',
      emailVerified: false,
      password: '',
      confirmPassword: '',
    },
  });
  const [step1Valid, setStep1Valid] = useState(false);
  const [step2Valid, setStep2Valid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const updateStep1 = (data) => {
    setStepData(prev => ({ ...prev, step1: { ...prev.step1, ...data } }));
  };

  const updateStep2 = (data) => {
    setStepData(prev => ({ ...prev, step2: { ...prev.step2, ...data } }));
  };

  // ─── Final Submit — Call server API for atomic registration ────
  const handleFinalSubmit = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const { step1, step2 } = stepData;

      // Determine API base URL
      const API_BASE = import.meta.env.VITE_API_URL
        || (import.meta.env.DEV ? 'http://localhost:3001' : '');

      const res = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: step2.email,
          password: step2.password,
          fullName: step1.fullName,
          studentId: step1.studentId,
          program: step1.program,
          address: step1.address,
          gender: step1.gender,
          birthdate: step2.birthdate,
          frontIdBase64: step1.frontID?.url || null,
          backIdBase64: step1.backID?.url || null,
          selfieBase64: step2.selfieUrl || null,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Registration failed. Please try again.');
      }

      console.log('✅ SUCCESS: Your registration data has been successfully saved to the database!');
      setSubmitted(true);
    } catch (err) {
      console.error('Registration error:', err);
      if (err.message === 'Failed to fetch') {
        setSaveError('Unable to connect to the server. Please check your internet connection or try again later.');
      } else {
        setSaveError(err.message || 'Failed to register. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="login-page">
      {/* Decorative backgrounds */}
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
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 50, height: 50,
            background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
            borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', fontSize: 18, fontWeight: 800, color: 'white',
            boxShadow: '0 6px 16px rgba(37,99,235,0.35)'
          }}>TT</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Trainee Registration</h2>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Create your TraineeTrack account</p>
        </div>

        {/* Progress Indicator */}
        <div className="reg-progress">
          {STEPS.map((step, i) => (
            <React.Fragment key={step.number}>
              <div className={`reg-step ${currentStep === step.number ? 'active' : ''} ${currentStep > step.number ? 'completed' : ''}`}>
                <div className="reg-step-circle">
                  {currentStep > step.number ? <CheckCircle size={18} /> : step.number}
                </div>
                <span className="reg-step-label">{step.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`reg-step-line ${currentStep > step.number ? 'completed' : ''}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div className="reg-step-content">
          {currentStep === 1 && (
            <Step1IDUpload
              data={stepData.step1}
              onChange={updateStep1}
              onValidChange={setStep1Valid}
            />
          )}
          {currentStep === 2 && !submitted && (
            <Step2PersonalInfo
              data={stepData.step2}
              onChange={updateStep2}
              onValidChange={setStep2Valid}
            />
          )}
          {submitted && (
            <div style={{
              textAlign: 'center', padding: '40px 20px',
              animation: 'fadeSlideIn 0.4s ease',
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 8px 24px rgba(34,197,94,0.3)',
              }}>
                <CheckCircle size={32} style={{ color: 'white' }} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
                Registration Successful!
              </h3>
              <p style={{ fontSize: 14, color: '#64748b', maxWidth: 360, margin: '0 auto 24px', lineHeight: 1.6 }}>
                Your account has been created. You can now log in with your email <strong>{stepData.step2.email}</strong> and password.
              </p>
              <button className="btn btn-primary" onClick={onBackToLogin}>
                Go to Login
              </button>
            </div>
          )}
        </div>

        {/* Save Error Banner */}
        {saveError && (
          <div className="alert alert-error" style={{ marginTop: 16 }}>
            <strong>Error:</strong> {saveError}
          </div>
        )}

        {/* Navigation Buttons */}
        {!submitted && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 20, borderTop: '1px solid #e2e8f0' }}>
            <button
              className="btn btn-outline"
              disabled={saving}
              onClick={() => {
                if (currentStep === 1) {
                  onBackToLogin();
                } else {
                  setCurrentStep(prev => prev - 1);
                }
              }}
            >
              <ArrowLeft size={15} />
              {currentStep === 1 ? 'Back to Login' : 'Previous'}
            </button>

            <button
              className="btn btn-primary"
              disabled={(currentStep === 1 && !step1Valid) || (currentStep === 2 && !step2Valid) || saving || submitted}
              onClick={() => {
                if (currentStep === STEPS.length) {
                  handleFinalSubmit();
                } else {
                  setCurrentStep(prev => prev + 1);
                }
              }}
            >
              {saving ? (
                <><Loader size={15} style={{ animation: 'ocr-spin 0.8s linear infinite' }} /> Creating Account...</>
              ) : (
                <>{currentStep === STEPS.length ? 'Create Account' : 'Next Step'} <ArrowRight size={15} /></>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
