import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Loader } from 'lucide-react';
import Step1IDUpload from './Step1IDUpload';
import Step2SelfieVerification from './Step2SelfieVerification';
import Step3PersonalInfo from './Step2PersonalInfo';
import Step4ProfileSetup from './Step3ProfileSetup';
import Step5Confirmation from './Step4Confirmation';
import { supabase } from '../../lib/supabase';

const STEPS = [
  { number: 1, label: 'School ID' },
  { number: 2, label: 'Selfie' },
  { number: 3, label: 'Personal Info' },
  { number: 4, label: 'Profile Setup' },
  { number: 5, label: 'Review' },
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
      ocrStatus: null, // null | 'loading' | 'success' | 'fail'
    },
    step2: {
      selfieUrl: null,
    },
    step3: {
      birthdate: '',
      regionCode: '', region: '',
      provinceCode: '', province: '',
      cityCode: '', city: '',
      barangayCode: '', barangay: '',
      detailedAddress: '',
      email: '',
      emailVerified: false,
      password: '',
      confirmPassword: '',
    },
    step4: {
      status: '',           // student | alumni | graduate
      graduateSchool: '',
      isEmployed: '',       // yes | no
      employmentWork: '',
      employmentStart: '',
      educHistory: [],
      workExperience: [],
      licenses: [],
      skills: [],
      interests: [],
      resume: null,
    },
  });
  const [step1Valid, setStep1Valid] = useState(false);
  const [step2Valid, setStep2Valid] = useState(false);
  const [step3Valid, setStep3Valid] = useState(false);
  const [step4Valid, setStep4Valid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const updateStep1 = (data) => {
    setStepData(prev => ({ ...prev, step1: { ...prev.step1, ...data } }));
  };

  const updateStep2 = (data) => {
    setStepData(prev => ({ ...prev, step2: { ...prev.step2, ...data } }));
  };

  const updateStep3 = (data) => {
    setStepData(prev => ({ ...prev, step3: { ...prev.step3, ...data } }));
  };

  const updateStep4 = (data) => {
    setStepData(prev => ({ ...prev, step4: { ...prev.step4, ...data } }));
  };

  const [submitted, setSubmitted] = useState(false);

  // Auto-detect: use localhost for dev, relative path for Vercel production
  const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : '';

  // ─── Final Submit — Save everything via secure server API ────
  const handleFinalSubmit = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const { step1, step2, step3, step4 } = stepData;
      const timestamp = Date.now();

      // Upload front ID image to Supabase Storage (storage is fine client-side)
      let frontIdUrl = null;
      if (step1.frontID) {
        const frontBlob = await fetch(step1.frontID.url).then(r => r.blob());
        const frontPath = `ids/${timestamp}_front_${step1.frontID.name}`;
        const { data: frontData, error: frontErr } = await supabase.storage
          .from('registration-uploads')
          .upload(frontPath, frontBlob, { contentType: frontBlob.type });
        if (frontErr) console.warn('Front ID upload warning:', frontErr.message);
        if (frontData) {
          const { data: urlData } = supabase.storage.from('registration-uploads').getPublicUrl(frontPath);
          frontIdUrl = urlData?.publicUrl || null;
        }
      }

      // Upload back ID image to Supabase Storage
      let backIdUrl = null;
      if (step1.backID) {
        const backBlob = await fetch(step1.backID.url).then(r => r.blob());
        const backPath = `ids/${timestamp}_back_${step1.backID.name}`;
        const { data: backData, error: backErr } = await supabase.storage
          .from('registration-uploads')
          .upload(backPath, backBlob, { contentType: backBlob.type });
        if (backErr) console.warn('Back ID upload warning:', backErr.message);
        if (backData) {
          const { data: urlData } = supabase.storage.from('registration-uploads').getPublicUrl(backPath);
          backIdUrl = urlData?.publicUrl || null;
        }
      }

      // Upload selfie image to Supabase Storage
      let selfieUrl = null;
      if (step2.selfieUrl) {
        const selfieBlob = await fetch(step2.selfieUrl).then(r => r.blob());
        const selfiePath = `selfies/${timestamp}_selfie.jpg`;
        const { data: selfieData, error: selfieErr } = await supabase.storage
          .from('registration-uploads')
          .upload(selfiePath, selfieBlob, { contentType: 'image/jpeg' });
        if (selfieErr) console.warn('Selfie upload warning:', selfieErr.message);
        if (selfieData) {
          const { data: urlData } = supabase.storage.from('registration-uploads').getPublicUrl(selfiePath);
          selfieUrl = urlData?.publicUrl || null;
        }
      }

      // Upload resume to Supabase Storage
      let resumeUrl = null;
      if (step4.resume?.file) {
        const resumeBlob = await fetch(step4.resume.url).then(r => r.blob());
        const resumePath = `resumes/${timestamp}_${step4.resume.name}`;
        const { data: resumeData, error: resumeErr } = await supabase.storage
          .from('registration-uploads')
          .upload(resumePath, resumeBlob, { contentType: step4.resume.type });
        if (resumeErr) console.warn('Resume upload warning:', resumeErr.message);
        if (resumeData) {
          const { data: urlData } = supabase.storage.from('registration-uploads').getPublicUrl(resumePath);
          resumeUrl = urlData?.publicUrl || null;
        }
      }

      // Build full address
      const fullAddress = [
        step3.detailedAddress, step3.barangay, step3.city, step3.province, step3.region
      ].filter(Boolean).join(', ');

      // Send to server API (password is hashed server-side, never stored in plain text)
      const response = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: step3.password,
          registrationData: {
            // Step 1
            full_name: step1.fullName,
            student_id: step1.studentId,
            program: step1.program,
            gender: step1.gender,
            front_id_url: frontIdUrl,
            back_id_url: backIdUrl,
            ocr_status: step1.ocrStatus,
            // Step 2 — Selfie
            selfie_url: selfieUrl,
            // Step 3 — Personal Info
            birthdate: step3.birthdate || null,
            email: step3.email,
            email_verified: step3.emailVerified,
            region: step3.region,
            province: step3.province,
            city: step3.city,
            barangay: step3.barangay,
            detailed_address: step3.detailedAddress,
            address: fullAddress || step1.address,
            // Step 4 — Profile
            trainee_status: step4.status || null,
            graduate_school: step4.graduateSchool || null,
            is_employed: step4.isEmployed || null,
            employment_work: step4.employmentWork || null,
            employment_start: step4.employmentStart || null,
            educ_history: step4.educHistory || [],
            work_experience: step4.workExperience || [],
            licenses: step4.licenses || [],
            skills: step4.skills || [],
            interests: step4.interests || [],
            resume_url: resumeUrl,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      console.log('Registration saved successfully:', result.registration);
      setSubmitted(true);
    } catch (err) {
      console.error('Registration error:', err);
      setSaveError(err.message || 'Failed to save. Please try again.');
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
          {currentStep === 2 && (
            <Step2SelfieVerification
              data={stepData.step2}
              onChange={updateStep2}
              onValidChange={setStep2Valid}
            />
          )}
          {currentStep === 3 && (
            <Step3PersonalInfo
              data={stepData.step3}
              onChange={updateStep3}
              onValidChange={setStep3Valid}
              step1Address={stepData.step1.address}
            />
          )}
          {currentStep === 4 && (
            <Step4ProfileSetup
              data={stepData.step4}
              onChange={updateStep4}
              onValidChange={setStep4Valid}
              userProgram={stepData.step1.program}
            />
          )}
          {currentStep === 5 && !submitted && (
            <Step5Confirmation
              step1Data={stepData.step1}
              step2Data={stepData.step2}
              step3Data={stepData.step3}
              step4Data={stepData.step4}
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
                Registration Submitted!
              </h3>
              <p style={{ fontSize: 14, color: '#64748b', maxWidth: 360, margin: '0 auto 24px', lineHeight: 1.6 }}>
                Your registration has been submitted successfully. An administrator will review your application. You will be notified via email at <strong>{stepData.step2.email}</strong>.
              </p>
              <button className="btn btn-primary" onClick={onBackToLogin}>
                Back to Login
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
              disabled={(currentStep === 1 && !step1Valid) || (currentStep === 2 && !step2Valid) || (currentStep === 3 && !step3Valid) || (currentStep === 4 && !step4Valid) || saving || submitted}
              onClick={() => {
                if (currentStep === STEPS.length) {
                  handleFinalSubmit();
                } else {
                  setCurrentStep(prev => prev + 1);
                }
              }}
            >
              {saving ? (
                <><Loader size={15} style={{ animation: 'ocr-spin 0.8s linear infinite' }} /> Submitting...</>
              ) : (
                <>{currentStep === STEPS.length ? 'Submit Registration' : 'Next Step'} <ArrowRight size={15} /></>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
