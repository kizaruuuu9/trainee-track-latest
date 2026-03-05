import React, { useState, useEffect, useCallback } from 'react';
import {
    Calendar, MapPin, Mail, Lock, Eye, EyeOff, CheckCircle, XCircle,
    Loader, Send, ShieldCheck
} from 'lucide-react';

// ─── PSGC API Base ──────────────────────────────────────────
const PSGC_API = 'https://psgc.cloud/api';

// ─── Password strength rules ──────────────────────────────────
const PASSWORD_RULES = [
    { id: 'length', label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
    { id: 'upper', label: 'Uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
    { id: 'lower', label: 'Lowercase letter', test: (pw) => /[a-z]/.test(pw) },
    { id: 'number', label: 'Number', test: (pw) => /\d/.test(pw) },
    { id: 'special', label: 'Special character (!@#$...)', test: (pw) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw) },
];

export default function Step2PersonalInfo({ data, onChange, onValidChange, step1Address }) {
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // PSGC dropdown data
    const [regions, setRegions] = useState([]);
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [barangays, setBarangays] = useState([]);
    const [loadingPsgc, setLoadingPsgc] = useState({ regions: false, provinces: false, cities: false, barangays: false });

    // OTP state
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpVerifying, setOtpVerifying] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [otpCooldown, setOtpCooldown] = useState(0);

    // ─── Load Regions on mount ──────────────────────────────────
    useEffect(() => {
        const fetchRegions = async () => {
            setLoadingPsgc(prev => ({ ...prev, regions: true }));
            try {
                const res = await fetch(`${PSGC_API}/regions`);
                const data = await res.json();
                setRegions(data.sort((a, b) => a.name.localeCompare(b.name)));
            } catch (err) {
                console.error('Failed to load regions:', err);
            }
            setLoadingPsgc(prev => ({ ...prev, regions: false }));
        };
        fetchRegions();
    }, []);

    // ─── Load Provinces when Region changes ──────────────────────
    useEffect(() => {
        if (!data.regionCode) { setProvinces([]); setCities([]); setBarangays([]); return; }
        const fetchProvinces = async () => {
            setLoadingPsgc(prev => ({ ...prev, provinces: true }));
            try {
                // NCR doesn't have provinces, it has cities directly
                if (data.regionCode === '1300000000') {
                    setProvinces([]);
                    // Fetch cities directly for NCR
                    const res = await fetch(`${PSGC_API}/regions/${data.regionCode}/cities-municipalities`);
                    const citiesData = await res.json();
                    setCities(citiesData.sort((a, b) => a.name.localeCompare(b.name)));
                } else {
                    const res = await fetch(`${PSGC_API}/regions/${data.regionCode}/provinces`);
                    const data2 = await res.json();
                    setProvinces(data2.sort((a, b) => a.name.localeCompare(b.name)));
                    setCities([]);
                }
                setBarangays([]);
            } catch (err) {
                console.error('Failed to load provinces:', err);
            }
            setLoadingPsgc(prev => ({ ...prev, provinces: false }));
        };
        fetchProvinces();
    }, [data.regionCode]);

    // ─── Load Cities when Province changes ───────────────────────
    useEffect(() => {
        if (!data.provinceCode) { setCities([]); setBarangays([]); return; }
        const fetchCities = async () => {
            setLoadingPsgc(prev => ({ ...prev, cities: true }));
            try {
                const res = await fetch(`${PSGC_API}/provinces/${data.provinceCode}/cities-municipalities`);
                const citiesData = await res.json();
                setCities(citiesData.sort((a, b) => a.name.localeCompare(b.name)));
                setBarangays([]);
            } catch (err) {
                console.error('Failed to load cities:', err);
            }
            setLoadingPsgc(prev => ({ ...prev, cities: false }));
        };
        fetchCities();
    }, [data.provinceCode]);

    // ─── Load Barangays when City changes ────────────────────────
    useEffect(() => {
        if (!data.cityCode) { setBarangays([]); return; }
        const fetchBarangays = async () => {
            setLoadingPsgc(prev => ({ ...prev, barangays: true }));
            try {
                const res = await fetch(`${PSGC_API}/cities-municipalities/${data.cityCode}/barangays`);
                const brgyData = await res.json();
                setBarangays(brgyData.sort((a, b) => a.name.localeCompare(b.name)));
            } catch (err) {
                console.error('Failed to load barangays:', err);
            }
            setLoadingPsgc(prev => ({ ...prev, barangays: false }));
        };
        fetchBarangays();
    }, [data.cityCode]);

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

        // Address
        if (!values.regionCode) e.region = 'Region is required';
        if (!values.cityCode) e.city = 'City/Municipality is required';
        if (!values.barangayCode) e.barangay = 'Barangay is required';
        if (!values.detailedAddress?.trim()) e.detailedAddress = 'Detailed address is required';

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
        onValidChange(Object.keys(errs).length === 0);
    }, [data, validate, onValidChange]);

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
            setOtpError(err.message || 'Error connecting to OTP server.');
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
            setOtpError(err.message || 'Error verifying OTP.');
        } finally {
            setOtpVerifying(false);
        }
    };

    // ─── PSGC Change Handlers ────────────────────────────────────
    const handleRegionChange = (e) => {
        const code = e.target.value;
        const name = regions.find(r => r.code === code)?.name || '';
        onChange({
            regionCode: code, region: name,
            provinceCode: '', province: '',
            cityCode: '', city: '',
            barangayCode: '', barangay: ''
        });
    };

    const handleProvinceChange = (e) => {
        const code = e.target.value;
        const name = provinces.find(p => p.code === code)?.name || '';
        onChange({
            provinceCode: code, province: name,
            cityCode: '', city: '',
            barangayCode: '', barangay: ''
        });
    };

    const handleCityChange = (e) => {
        const code = e.target.value;
        const name = cities.find(c => c.code === code)?.name || '';
        onChange({
            cityCode: code, city: name,
            barangayCode: '', barangay: ''
        });
    };

    const handleBarangayChange = (e) => {
        const code = e.target.value;
        const name = barangays.find(b => b.code === code)?.name || '';
        onChange({ barangayCode: code, barangay: name });
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

            {/* ─── B. ADDRESS (PSGC) ──────────────────────────────── */}
            <div className="reg-form-section" style={{ animation: 'fadeSlideIn 0.35s ease 0.1s both' }}>
                <div className="step2-section-header">
                    <MapPin size={16} /> <span>Address</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {/* Region */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Region <span style={{ color: '#ef4444' }}>*</span></label>
                        <select
                            className={`form-select ${getFieldStatus('region')}`}
                            value={data.regionCode || ''}
                            onChange={handleRegionChange}
                            onBlur={() => handleBlur('region')}
                            disabled={loadingPsgc.regions}
                        >
                            <option value="">{loadingPsgc.regions ? 'Loading...' : 'Select Region'}</option>
                            {regions.map(r => <option key={r.code} value={r.code}>{r.name}</option>)}
                        </select>
                        {touched.region && errors.region && <div className="form-error">{errors.region}</div>}
                    </div>

                    {/* Province (not shown for NCR) */}
                    {data.regionCode !== '1300000000' && (
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Province</label>
                            <select
                                className={`form-select ${getFieldStatus('province')}`}
                                value={data.provinceCode || ''}
                                onChange={handleProvinceChange}
                                onBlur={() => handleBlur('province')}
                                disabled={!data.regionCode || loadingPsgc.provinces}
                            >
                                <option value="">{loadingPsgc.provinces ? 'Loading...' : 'Select Province'}</option>
                                {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                            </select>
                        </div>
                    )}

                    {/* City / Municipality */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">City / Municipality <span style={{ color: '#ef4444' }}>*</span></label>
                        <select
                            className={`form-select ${getFieldStatus('city')}`}
                            value={data.cityCode || ''}
                            onChange={handleCityChange}
                            onBlur={() => handleBlur('city')}
                            disabled={(!data.provinceCode && data.regionCode !== '1300000000') || loadingPsgc.cities}
                        >
                            <option value="">{loadingPsgc.cities ? 'Loading...' : 'Select City'}</option>
                            {cities.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                        </select>
                        {touched.city && errors.city && <div className="form-error">{errors.city}</div>}
                    </div>

                    {/* Barangay */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Barangay <span style={{ color: '#ef4444' }}>*</span></label>
                        <select
                            className={`form-select ${getFieldStatus('barangay')}`}
                            value={data.barangayCode || ''}
                            onChange={handleBarangayChange}
                            onBlur={() => handleBlur('barangay')}
                            disabled={!data.cityCode || loadingPsgc.barangays}
                        >
                            <option value="">{loadingPsgc.barangays ? 'Loading...' : 'Select Barangay'}</option>
                            {barangays.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                        </select>
                        {touched.barangay && errors.barangay && <div className="form-error">{errors.barangay}</div>}
                    </div>
                </div>

                {/* Detailed Address */}
                <div className="form-group" style={{ marginTop: 14, marginBottom: 0 }}>
                    <label className="form-label">Detailed Home Address <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                        className={`form-input ${getFieldStatus('detailedAddress')}`}
                        value={data.detailedAddress || ''}
                        onChange={(e) => onChange({ detailedAddress: e.target.value })}
                        onBlur={() => handleBlur('detailedAddress')}
                        placeholder="House/Unit No., Street, Subdivision, etc."
                    />
                    {touched.detailedAddress && errors.detailedAddress && <div className="form-error">{errors.detailedAddress}</div>}
                    {step1Address && (
                        <div className="step2-ocr-hint">
                            From ID: <strong>{step1Address}</strong>
                        </div>
                    )}
                </div>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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
