import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Calendar, Camera, Mail, Lock, Eye, EyeOff, CheckCircle, XCircle,
    Loader, Send, ShieldCheck, Upload, AlertTriangle, RotateCcw, X
} from 'lucide-react';
import * as faceapi from 'face-api.js';

const ACCEPTED_IMG_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

// ─── Password strength rules ──────────────────────────────────
const PASSWORD_RULES = [
    { id: 'length', label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
    { id: 'upper', label: 'Uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
    { id: 'lower', label: 'Lowercase letter', test: (pw) => /[a-z]/.test(pw) },
    { id: 'number', label: 'Number', test: (pw) => /\d/.test(pw) },
    { id: 'special', label: 'Special character (!@#$...)', test: (pw) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw) },
];

export default function Step2PersonalInfo({ data, onChange, onValidChange }) {
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Selfie state
    const [selfieMode, setSelfieMode] = useState(null); // null | 'camera' | 'upload'
    const [cameraReady, setCameraReady] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [modelsLoading, setModelsLoading] = useState(false);
    const [detecting, setDetecting] = useState(false);
    const [faceResult, setFaceResult] = useState(null); // null | 'success' | 'no-face' | 'multi-face'
    const [selfieError, setSelfieError] = useState('');
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const fileInputRef = useRef(null);

    // OTP state
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpVerifying, setOtpVerifying] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [otpCooldown, setOtpCooldown] = useState(0);

    // ─── Load face-api models on mount ───────────────────────────
    useEffect(() => {
        const loadModels = async () => {
            if (modelsLoaded || modelsLoading) return;
            setModelsLoading(true);
            try {
                await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
                setModelsLoaded(true);
            } catch (err) {
                console.error('Failed to load face detection models:', err);
                setSelfieError('Failed to load face detection. Please refresh the page.');
            } finally {
                setModelsLoading(false);
            }
        };
        loadModels();
        return () => stopCamera();
    }, []);
    // ─── Camera Functions ────────────────────────────────────────
    const startCamera = async () => {
        setSelfieMode('camera');
        setFaceResult(null);
        setSelfieError('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                    setCameraReady(true);
                };
            }
        } catch (err) {
            console.error('Camera access error:', err);
            setSelfieError('Could not access camera. Please allow camera permissions or upload a photo instead.');
            setSelfieMode(null);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setCameraReady(false);
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        stopCamera();
        setSelfieMode(null);
        processSelfie(dataUrl);
    };

    const handleSelfieUpload = (file) => {
        if (!file) return;
        if (!ACCEPTED_IMG_TYPES.includes(file.type)) {
            setSelfieError('Please upload PNG, JPG, or JPEG files only.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            setSelfieMode(null);
            processSelfie(e.target.result);
        };
        reader.readAsDataURL(file);
    };

    const processSelfie = async (imageDataUrl) => {
        onChange({ selfieUrl: imageDataUrl });
        setDetecting(true);
        setFaceResult(null);
        setSelfieError('');
        try {
            const img = new window.Image();
            img.src = imageDataUrl;
            await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
            const [detections] = await Promise.all([
                faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.1 })),
                new Promise(r => setTimeout(r, 1500)),
            ]);
            if (detections.length === 0) setFaceResult('no-face');
            else if (detections.length > 1) setFaceResult('multi-face');
            else setFaceResult('success');
        } catch (err) {
            console.error('Face detection error:', err);
            setSelfieError('Face detection failed. Please try again.');
            setFaceResult(null);
        } finally {
            setDetecting(false);
        }
    };

    const resetSelfie = () => {
        onChange({ selfieUrl: null });
        setFaceResult(null);
        setSelfieError('');
        setDetecting(false);
    };

    // ─── OTP Cooldown Timer ──────────────────────────────────────
    useEffect(() => {
        if (otpCooldown <= 0) return;
        const timer = setTimeout(() => setOtpCooldown(prev => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [otpCooldown]);

    // ─── Validation ──────────────────────────────────────────────
    const validate = useCallback((values) => {
        const e = {};

        // Birthdate
        if (!values.birthdate) {
            e.birthdate = 'Birthdate is required';
        } else {
            const bd = new Date(values.birthdate);
            const today = new Date();
            let age = today.getFullYear() - bd.getFullYear();
            const m = today.getMonth() - bd.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
            if (age < 15) e.birthdate = 'You must be at least 15 years old';
        }

        // Selfie
        if (!values.selfieUrl) {
            e.selfie = 'Selfie verification is required';
        }

        // Email
        if (!values.email?.trim()) {
            e.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
            e.email = 'Invalid email format';
        }
        if (!values.emailVerified) {
            e.emailVerified = 'Email must be verified';
        }

        // Password
        if (!values.password) {
            e.password = 'Password is required';
        } else {
            const failedRules = PASSWORD_RULES.filter(r => !r.test(values.password));
            if (failedRules.length > 0) e.password = 'Password does not meet all requirements';
        }
        if (!values.confirmPassword) {
            e.confirmPassword = 'Please confirm your password';
        } else if (values.password !== values.confirmPassword) {
            e.confirmPassword = 'Passwords do not match';
        }

        return e;
    }, []);

    useEffect(() => {
        const errs = validate(data);
        setErrors(errs);
        // Also require face detection success
        const selfieOk = !!data.selfieUrl && faceResult === 'success';
        onValidChange(Object.keys(errs).length === 0 && selfieOk);
    }, [data, validate, onValidChange, faceResult]);

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    const getFieldStatus = (field) => {
        if (!touched[field]) return '';
        return errors[field] ? 'error' : 'valid';
    };

    // ─── OTP Handlers (Nodemailer Backend) ─────────────────────────
    // Auto-detect: use localhost for dev, relative path for Vercel production
    const API_BASE = window.location.hostname === 'localhost'
        ? 'http://localhost:3001'
        : '';

    const sendOTP = async () => {
        if (!data.email || errors.email) return;
        setOtpLoading(true);
        setOtpError('');

        try {
            const res = await fetch(`${API_BASE}/api/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: data.email })
            });
            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || 'Failed to send OTP');
            }

            setOtpSent(true);
            setOtpCooldown(60);
        } catch (err) {
            if (err.message === 'Failed to fetch') {
                setOtpError('Unable to connect to the server. Please check your connection.');
            } else {
                setOtpError(err.message || 'Error connecting to OTP server.');
            }
        } finally {
            setOtpLoading(false);
        }
    };

    const verifyOTP = async () => {
        setOtpVerifying(true);
        setOtpError('');

        try {
            const res = await fetch(`${API_BASE}/api/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: data.email, otp: otpCode })
            });
            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || 'Invalid OTP');
            }

            if (result.verified) {
                onChange({ emailVerified: true });
            }
        } catch (err) {
            console.error('OTP verify error:', err);
            if (err.message === 'Failed to fetch') {
                setOtpError('Unable to connect to the server. Please check your connection.');
            } else {
                setOtpError(err.message || 'Error verifying OTP.');
            }
        } finally {
            setOtpVerifying(false);
        }
    };

    // Password strength percentage
    const passedRules = PASSWORD_RULES.filter(r => r.test(data.password || ''));
    const strengthPct = Math.round((passedRules.length / PASSWORD_RULES.length) * 100);
    const strengthColor = strengthPct <= 40 ? '#ef4444' : strengthPct <= 70 ? '#f59e0b' : '#10b981';

    return (
        <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                Step 2 — Personal Information & Account Setup
            </h3>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
                Fill in your details to complete your registration.
            </p>

            {/* ─── A. BIRTHDATE ────────────────────────────────────── */}
            <div className="reg-form-section" style={{ animation: 'fadeSlideIn 0.35s ease' }}>
                <div className="step2-section-header">
                    <Calendar size={16} /> <span>Birthdate</span>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Date of Birth <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                        type="date"
                        className={`form-input ${getFieldStatus('birthdate')}`}
                        value={data.birthdate || ''}
                        onChange={(e) => onChange({ birthdate: e.target.value })}
                        onBlur={() => handleBlur('birthdate')}
                        max={new Date().toISOString().split('T')[0]}
                    />
                    {touched.birthdate && errors.birthdate && <div className="form-error">{errors.birthdate}</div>}
                </div>
            </div>

            {/* ─── B. SELFIE VERIFICATION ──────────────────────── */}
            <div className="reg-form-section" style={{ animation: 'fadeSlideIn 0.35s ease 0.1s both' }}>
                <div className="step2-section-header">
                    <Camera size={16} /> <span>Selfie Verification</span>
                </div>

                {/* Info Banner */}
                <div className="ocr-banner ocr-success" style={{ marginBottom: 16, background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>
                    <Camera size={18} />
                    <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                        <strong>Why do we need a selfie?</strong> This verifies you are the rightful owner of the School ID you uploaded. An admin will review it alongside your ID.
                    </div>
                </div>

                {/* Models Loading */}
                {modelsLoading && (
                    <div className="ocr-banner ocr-loading" style={{ marginBottom: 12 }}>
                        <div className="ocr-spinner" />
                        <div><strong>Loading face detection...</strong></div>
                    </div>
                )}

                {/* Selfie Error */}
                {selfieError && (
                    <div className="ocr-banner ocr-fail" style={{ marginBottom: 12 }}>
                        <AlertTriangle size={18} />
                        <div><strong>Error</strong><p>{selfieError}</p></div>
                    </div>
                )}

                {/* Capture Options */}
                {!data.selfieUrl && selfieMode !== 'camera' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                        <button
                            onClick={startCamera}
                            disabled={!modelsLoaded}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                gap: 10, padding: '28px 16px',
                                border: '2px dashed #cbd5e1', borderRadius: 12,
                                background: modelsLoaded ? '#f8fafc' : '#f1f5f9',
                                cursor: modelsLoaded ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s', opacity: modelsLoaded ? 1 : 0.5,
                            }}
                            onMouseEnter={(e) => { if (modelsLoaded) { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.background = '#eff6ff'; } }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = modelsLoaded ? '#f8fafc' : '#f1f5f9'; }}
                        >
                            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Camera size={20} style={{ color: 'white' }} />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Take a Selfie</div>
                                <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>Use your camera</div>
                            </div>
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={!modelsLoaded}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                gap: 10, padding: '28px 16px',
                                border: '2px dashed #cbd5e1', borderRadius: 12,
                                background: modelsLoaded ? '#f8fafc' : '#f1f5f9',
                                cursor: modelsLoaded ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s', opacity: modelsLoaded ? 1 : 0.5,
                            }}
                            onMouseEnter={(e) => { if (modelsLoaded) { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.background = '#eff6ff'; } }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = modelsLoaded ? '#f8fafc' : '#f1f5f9'; }}
                        >
                            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Upload size={20} style={{ color: 'white' }} />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Upload Photo</div>
                                <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>From your device</div>
                            </div>
                        </button>
                        <input ref={fileInputRef} type="file" accept=".png,.jpg,.jpeg" style={{ display: 'none' }} onChange={(e) => handleSelfieUpload(e.target.files[0])} />
                    </div>
                )}

                {/* Camera View */}
                {selfieMode === 'camera' && (
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '2px solid #2563eb', background: '#000', maxWidth: 480, margin: '0 auto' }}>
                            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', display: 'block', transform: 'scaleX(-1)' }} />
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '55%', height: '70%', border: '3px dashed rgba(255,255,255,0.5)', borderRadius: '50%', pointerEvents: 'none' }} />
                            {!cameraReady && (
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white' }}>
                                    <Loader size={24} style={{ animation: 'ocr-spin 0.8s linear infinite' }} />
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 14 }}>
                            <button className="btn btn-outline" onClick={() => { stopCamera(); setSelfieMode(null); }}><X size={15} /> Cancel</button>
                            <button className="btn btn-primary" onClick={capturePhoto} disabled={!cameraReady}><Camera size={15} /> Capture</button>
                        </div>
                        <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 6 }}>Position your face inside the oval guide, then click Capture</p>
                    </div>
                )}

                <canvas ref={canvasRef} style={{ display: 'none' }} />

                {/* Selfie Preview + Detection */}
                {data.selfieUrl && (
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: `2px solid ${faceResult === 'success' ? '#22c55e' : faceResult ? '#ef4444' : '#cbd5e1'}`, maxWidth: 320, margin: '0 auto', transition: 'border-color 0.3s' }}>
                            <img src={data.selfieUrl} alt="Selfie preview" style={{ width: '100%', display: 'block' }} />
                            {detecting && (
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                    <Loader size={28} style={{ color: 'white', animation: 'ocr-spin 0.8s linear infinite' }} />
                                    <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>Detecting face...</span>
                                </div>
                            )}
                        </div>

                        {detecting && (
                            <div className="ocr-banner ocr-loading" style={{ marginTop: 10 }}>
                                <div className="ocr-spinner" />
                                <div style={{ flex: 1 }}>
                                    <strong>Verifying your selfie...</strong>
                                    <div className="progress-bar-wrap" style={{ marginTop: 6, height: 5 }}>
                                        <div className="progress-bar-fill progress-high" style={{ width: '80%', background: 'linear-gradient(90deg, #2563eb, #3b82f6)', animation: 'idCheckPulse 1.5s ease-in-out infinite' }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {faceResult === 'success' && (
                            <div className="ocr-banner ocr-success" style={{ marginTop: 10 }}>
                                <CheckCircle size={18} />
                                <div><strong>Face Detected Successfully</strong><p>Your selfie has been verified.</p></div>
                            </div>
                        )}
                        {faceResult === 'no-face' && (
                            <div className="ocr-banner ocr-fail" style={{ marginTop: 10 }}>
                                <AlertTriangle size={18} />
                                <div><strong>No Face Detected</strong><p>Please make sure your face is clearly visible and well-lit.</p></div>
                            </div>
                        )}
                        {faceResult === 'multi-face' && (
                            <div className="ocr-banner ocr-fail" style={{ marginTop: 10 }}>
                                <AlertTriangle size={18} />
                                <div><strong>Multiple Faces Detected</strong><p>Please take a selfie with only your face visible.</p></div>
                            </div>
                        )}

                        <div style={{ textAlign: 'center', marginTop: 12 }}>
                            <button className="btn btn-outline" onClick={resetSelfie}><RotateCcw size={14} /> Retake Selfie</button>
                        </div>
                    </div>
                )}

                {/* Tips */}
                {!data.selfieUrl && selfieMode !== 'camera' && (
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, fontSize: 12.5, color: '#475569', lineHeight: 1.7 }}>
                        <div style={{ fontWeight: 700, marginBottom: 6, color: '#0f172a' }}>Tips for a good selfie:</div>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                            <li>Make sure your <strong>face is clearly visible</strong> and centered</li>
                            <li>Use <strong>good lighting</strong> — avoid backlighting</li>
                            <li>Remove <strong>sunglasses or face coverings</strong></li>
                            <li>Look directly at the camera</li>
                        </ul>
                    </div>
                )}
            </div>

            {/* ─── C. EMAIL & OTP ─────────────────────────────────── */}
            <div className="reg-form-section" style={{ animation: 'fadeSlideIn 0.35s ease 0.2s both' }}>
                <div className="step2-section-header">
                    <Mail size={16} /> <span>Email Verification</span>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                    <div className="step2-email-row">
                        <input
                            type="email"
                            className={`form-input ${data.emailVerified ? 'valid' : getFieldStatus('email')}`}
                            value={data.email || ''}
                            onChange={(e) => {
                                onChange({ email: e.target.value, emailVerified: false });
                                setOtpSent(false);
                                setOtpCode('');
                                setOtpError('');
                            }}
                            onBlur={() => handleBlur('email')}
                            placeholder="your.email@gmail.com"
                            disabled={data.emailVerified}
                            style={{ flex: 1 }}
                        />
                        {!data.emailVerified && (
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={sendOTP}
                                disabled={!data.email || !!errors.email || otpLoading || otpCooldown > 0}
                                style={{ whiteSpace: 'nowrap', minWidth: 110 }}
                            >
                                {otpLoading ? (
                                    <><Loader size={14} style={{ animation: 'ocr-spin 0.8s linear infinite' }} /> Sending...</>
                                ) : otpCooldown > 0 ? (
                                    `Resend (${otpCooldown}s)`
                                ) : (
                                    <><Send size={14} /> Send OTP</>
                                )}
                            </button>
                        )}
                    </div>
                    {touched.email && errors.email && <div className="form-error">{errors.email}</div>}
                    {/* Email duplicate error — shown even before OTP sent */}
                    {otpError && !otpSent && (
                        <div style={{
                            marginTop: 8, padding: '10px 14px', borderRadius: 10,
                            background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
                            border: '1px solid #fca5a5',
                            display: 'flex', alignItems: 'flex-start', gap: 8,
                            animation: 'fadeSlideIn 0.3s ease',
                        }}>
                            <span style={{ fontSize: 15, flexShrink: 0, marginTop: 0 }}>⚠️</span>
                            <span style={{ fontSize: 12.5, color: '#991b1b', lineHeight: 1.5 }}>
                                {otpError}
                            </span>
                        </div>
                    )}
                </div>

                {/* OTP Input */}
                {otpSent && !data.emailVerified && (
                    <div className="step2-otp-section" style={{ marginTop: 14 }}>
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
                            <Mail size={18} style={{ color: '#2563eb', flexShrink: 0 }} />
                            <div style={{ fontSize: 13, color: '#1e40af' }}>
                                A 6-digit OTP has been sent to <strong>{data.email}</strong>
                            </div>
                        </div>
                        <label className="form-label">Enter 6-digit OTP</label>
                        <div className="step2-email-row">
                            <input
                                className="form-input step2-otp-input"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                maxLength={6}
                                style={{ flex: 1, letterSpacing: '0.3em', fontWeight: 700, fontSize: 18, textAlign: 'center' }}
                            />
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={verifyOTP}
                                disabled={otpCode.length !== 6 || otpVerifying}
                                style={{ minWidth: 110 }}
                            >
                                {otpVerifying ? 'Verifying...' : 'Verify'}
                            </button>
                        </div>
                        {otpError && <div className="form-error" style={{ marginTop: 6 }}>{otpError}</div>}
                    </div>
                )}

                {/* Verified badge */}
                {data.emailVerified && (
                    <div className="step2-verified-badge">
                        <ShieldCheck size={16} /> Email verified successfully
                    </div>
                )}
            </div>

            {/* ─── D. PASSWORD ────────────────────────────────────── */}
            <div className="reg-form-section" style={{ animation: 'fadeSlideIn 0.35s ease 0.3s both' }}>
                <div className="step2-section-header">
                    <Lock size={16} /> <span>Create Password</span>
                </div>

                <div className="reg-form-grid">
                    {/* Password */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Password <span style={{ color: '#ef4444' }}>*</span></label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className={`form-input ${getFieldStatus('password')}`}
                                value={data.password || ''}
                                onChange={(e) => onChange({ password: e.target.value })}
                                onBlur={() => handleBlur('password')}
                                placeholder="Create a strong password"
                                style={{ paddingRight: 40 }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="step2-pw-toggle"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Confirm Password <span style={{ color: '#ef4444' }}>*</span></label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                className={`form-input ${getFieldStatus('confirmPassword')}`}
                                value={data.confirmPassword || ''}
                                onChange={(e) => onChange({ confirmPassword: e.target.value })}
                                onBlur={() => handleBlur('confirmPassword')}
                                placeholder="Confirm your password"
                                style={{ paddingRight: 40 }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="step2-pw-toggle"
                            >
                                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {touched.confirmPassword && errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
                    </div>
                </div>

                {/* Password Strength Indicators */}
                {(data.password || '').length > 0 && (
                    <div className="step2-pw-strength" style={{ marginTop: 14 }}>
                        {/* Strength bar */}
                        <div className="progress-bar-wrap" style={{ height: 6, marginBottom: 10 }}>
                            <div className="progress-bar-fill" style={{
                                width: `${strengthPct}%`,
                                background: strengthColor,
                                transition: 'all 0.3s ease'
                            }} />
                        </div>

                        {/* Rule checklist */}
                        <div className="step2-pw-rules">
                            {PASSWORD_RULES.map(rule => {
                                const passed = rule.test(data.password || '');
                                return (
                                    <div key={rule.id} className={`step2-pw-rule ${passed ? 'passed' : 'failed'}`}>
                                        {passed ? <CheckCircle size={13} /> : <XCircle size={13} />}
                                        <span>{rule.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
