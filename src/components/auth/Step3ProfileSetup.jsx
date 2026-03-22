import React, { useState, useEffect, useCallback } from 'react';
import {
    GraduationCap, Briefcase, Award, Sparkles, Heart,
    FileText, Plus, X, ChevronDown, Upload, Trash2, ExternalLink, Link2
} from 'lucide-react';

// ─── Predefined suggestions ────────────────────────────────────
const SKILL_SUGGESTIONS = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'Excel',
    'Communication', 'Leadership', 'Project Management', 'Data Analysis',
    'Graphic Design', 'UI/UX Design', 'Marketing', 'Public Speaking',
    'Problem Solving', 'Teamwork', 'Critical Thinking', 'Time Management',
    'Customer Service', 'Accounting', 'Research', 'Writing', 'AutoCAD',
    'Photoshop', 'Video Editing', 'Social Media', 'SEO', 'Sales',
];

const MAX_INTERESTS = 10;

// ─── Word Cloud Style Generator ─────────────────────────────────
const getWordCloudStyle = (word) => {
    let hash = 0;
    for (let i = 0; i < word.length; i++) hash = word.charCodeAt(i) + ((hash << 5) - hash);
    hash = Math.abs(hash);

    // Text colors suitable for a light gradient background
    const colors = [
        '#ef4444', // red
        '#f59e0b', // amber
        '#10b981', // emerald
        '#3b82f6', // blue
        '#8b5cf6', // violet
        '#ec4899', // pink
        '#06b6d4', // cyan
        '#6366f1', // indigo
    ];

    // Vary size between 16px to 28px based on hash for more dramatic effect
    const sizes = [16, 18, 20, 22, 24, 26, 28];

    const color = colors[hash % colors.length];
    const fontSize = sizes[hash % sizes.length];

    // Add slight rotation for true "word cloud" feel
    const rotations = [-12, -8, -4, 0, 4, 8, 12];
    const rotate = rotations[hash % rotations.length];

    // Margin variance for scattered look
    const margins = ['2px 10px', '8px 14px', '0px 16px', '12px 8px', '4px 20px'];
    const margin = margins[hash % margins.length];

    return {
        color,
        fontSize,
        rotate: `${rotate}deg`,
        margin
    };
};



export default function Step3ProfileSetup({ data, onChange, onValidChange }) {
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [newSkill, setNewSkill] = useState('');
    const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
    const [newInterest, setNewInterest] = useState('');

    // Auto-detect API base
    const API_BASE = window.location.hostname === 'localhost'
        ? 'http://localhost:3001'
        : '';

    // ─── Validation ─────────────────────────────────────────────
    const validate = useCallback((d) => {
        const errs = {};
        if (!d.status) errs.status = 'Please select your current status';
        if (d.status === 'graduate' && !d.graduateSchool?.trim()) errs.graduateSchool = 'Please enter your school';
        if (d.isEmployed === 'yes') {
            if (!d.employmentWork?.trim()) errs.employmentWork = 'Please enter your current work/position';
            if (!d.employmentStart) errs.employmentStart = 'Please enter when you started';
        }
        if (!d.educHistory || d.educHistory.length === 0) errs.educHistory = 'Add at least one education entry';
        if (!d.skills || d.skills.length === 0) errs.skills = 'Add at least one skill';
        if (!d.interests || d.interests.length === 0) errs.interests = 'Add at least one interest';
        return errs;
    }, []);

    useEffect(() => {
        const errs = validate(data);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setErrors(errs);
        const isValid = Object.keys(errs).length === 0;
        onValidChange(isValid);
    }, [data, validate, onValidChange]);

    const handleChange = (field, value) => {
        onChange({ [field]: value });
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    const fieldClass = (field) => {
        if (!touched[field]) return 'form-input';
        return `form-input ${errors[field] ? 'error' : 'valid'}`;
    };

    const selectClass = (field) => {
        if (!touched[field]) return 'form-select';
        return `form-select ${errors[field] ? 'error' : 'valid'}`;
    };

    // ─── Education History Helpers ──────────────────────────────
    const addEducation = () => {
        const current = data.educHistory || [];
        handleChange('educHistory', [...current, { school: '', degree: '', yearFrom: '', yearTo: '' }]);
    };

    const updateEducation = (index, field, value) => {
        const updated = [...(data.educHistory || [])];
        updated[index] = { ...updated[index], [field]: value };
        handleChange('educHistory', updated);
    };

    const removeEducation = (index) => {
        const updated = [...(data.educHistory || [])];
        updated.splice(index, 1);
        handleChange('educHistory', updated);
    };

    // ─── Work Experience Helpers ────────────────────────────────
    const addWorkExperience = () => {
        const current = data.workExperience || [];
        handleChange('workExperience', [...current, { company: '', position: '', yearFrom: '', yearTo: '' }]);
    };

    const updateWorkExperience = (index, field, value) => {
        const updated = [...(data.workExperience || [])];
        updated[index] = { ...updated[index], [field]: value };
        handleChange('workExperience', updated);
    };

    const removeWorkExperience = (index) => {
        const updated = [...(data.workExperience || [])];
        updated.splice(index, 1);
        handleChange('workExperience', updated);
    };

    // ─── Licenses Helpers ───────────────────────────────────────
    const addLicense = () => {
        const current = data.licenses || [];
        handleChange('licenses', [...current, {
            name: '', issuer: '', dateIssued: '', expirationDate: '',
            credentialId: '', credentialUrl: '', noExpiration: false
        }]);
    };

    const updateLicense = (index, field, value) => {
        const updated = [...(data.licenses || [])];
        updated[index] = { ...updated[index], [field]: value };
        handleChange('licenses', updated);
    };

    const removeLicense = (index) => {
        const updated = [...(data.licenses || [])];
        updated.splice(index, 1);
        handleChange('licenses', updated);
    };

    // ─── Skills Helpers ─────────────────────────────────────────
    const PROFICIENCY_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
    const PROFICIENCY_COLORS = {
        Beginner: { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
        Intermediate: { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
        Advanced: { bg: '#dcfce7', color: '#166534', border: '#86efac' },
    };

    const addSkill = (skill, level = 'Beginner') => {
        const trimmed = skill.trim();
        if (!trimmed) return;
        const current = data.skills || [];
        if (current.find(s => s.name === trimmed)) return;
        handleChange('skills', [...current, { name: trimmed, level }]);
        setNewSkill('');
        setShowSkillSuggestions(false);
    };

    const updateSkillLevel = (index, level) => {
        const updated = [...(data.skills || [])];
        updated[index] = { ...updated[index], level };
        handleChange('skills', updated);
    };

    const removeSkill = (index) => {
        const updated = [...(data.skills || [])];
        updated.splice(index, 1);
        handleChange('skills', updated);
    };

    // ─── Interest Helpers ───────────────────────────────────────
    const addInterest = (interest) => {
        const trimmed = interest.trim();
        if (!trimmed) return;
        const current = data.interests || [];
        if (current.length >= MAX_INTERESTS) return;
        if (current.includes(trimmed)) return;
        handleChange('interests', [...current, trimmed]);
        setNewInterest('');
    };

    const removeInterest = (index) => {
        const updated = [...(data.interests || [])];
        updated.splice(index, 1);
        handleChange('interests', updated);
    };

    // ─── Resume Upload ──────────────────────────────────────────
    const handleResumeUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            setErrors(prev => ({ ...prev, resume: 'File must be under 5MB' }));
            return;
        }
        const allowed = ['application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain', 'application/rtf', 'text/rtf'];
        if (!allowed.includes(file.type)) {
            setErrors(prev => ({ ...prev, resume: 'Only PDF, DOC, DOCX, TXT, and RTF files are allowed' }));
            return;
        }
        const url = URL.createObjectURL(file);
        handleChange('resume', { name: file.name, size: file.size, type: file.type, url, file });
        setErrors(prev => { const { resume: _resume, ...rest } = prev; return rest; });
    };


    const existingSkillNames = (data.skills || []).map(s => s.name);
    const filteredSkillSuggestions = SKILL_SUGGESTIONS.filter(
        s => s.toLowerCase().includes(newSkill.toLowerCase()) && !existingSkillNames.includes(s)
    ).slice(0, 6);

    return (
        <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                Step 3 — Profile Setup
            </h3>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>
                Set up your profile to help us match you with the best opportunities.
            </p>

            {/* Required fields reminder */}
            <div style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                border: '1px solid #93c5fd',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
            }}>
                <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>ℹ️</span>
                <div style={{ fontSize: 12.5, color: '#1e40af', lineHeight: 1.5 }}>
                    <strong>Required fields:</strong> Current Status, Educational History, Skills, and Interests are required to proceed.
                    <br />
                    <span style={{ color: '#3b82f6' }}>Other sections (Work Experience, Licenses, Resume) are optional and can be added later from your profile.</span>
                </div>
            </div>

            {/* ─── Status ────────────────────────────────────────── */}
            <div className="reg-form-section" style={{ animation: 'fadeSlideIn 0.35s ease' }}>
                <div className="step2-section-header">
                    <GraduationCap size={16} /> <span>Current Status <span className="required">*</span></span>
                </div>

                <div className="form-group">
                    <label className="form-label">What is your current status? <span className="required">*</span></label>
                    <select
                        className={selectClass('status')}
                        value={data.status || ''}
                        onChange={(e) => {
                            handleChange('status', e.target.value);
                            // Reset conditional fields
                            if (e.target.value !== 'graduate') handleChange('graduateSchool', '');
                        }}
                    >
                        <option value="">Select status...</option>
                        <option value="student">Student</option>
                        <option value="alumni">Alumni</option>
                        <option value="graduate">Graduate</option>
                    </select>
                    {touched.status && errors.status && <div className="field-error">{errors.status}</div>}
                </div>

                {data.status === 'graduate' && (
                    <div className="form-group" style={{ animation: 'fadeSlideIn 0.3s ease' }}>
                        <label className="form-label">What school did you graduate from? <span className="required">*</span></label>
                        <input
                            type="text"
                            className={fieldClass('graduateSchool')}
                            placeholder="e.g. University of the Philippines"
                            value={data.graduateSchool || ''}
                            onChange={(e) => handleChange('graduateSchool', e.target.value)}
                        />
                        {touched.graduateSchool && errors.graduateSchool && <div className="field-error">{errors.graduateSchool}</div>}
                    </div>
                )}

                {/* Employment */}
                <div className="form-group" style={{ marginTop: 16 }}>
                    <label className="form-label">Are you currently employed?</label>
                    <div style={{ display: 'flex', gap: 12 }}>
                        {['yes', 'no'].map((val) => (
                            <button
                                key={val}
                                type="button"
                                onClick={() => {
                                    handleChange('isEmployed', val);
                                    if (val === 'no') {
                                        handleChange('employmentWork', '');
                                        handleChange('employmentStart', '');
                                    }
                                }}
                                style={{
                                    flex: 1,
                                    padding: '10px 16px',
                                    borderRadius: 10,
                                    border: `2px solid ${data.isEmployed === val ? '#2563eb' : '#e2e8f0'}`,
                                    background: data.isEmployed === val
                                        ? 'linear-gradient(135deg, #eff6ff, #dbeafe)'
                                        : '#fff',
                                    color: data.isEmployed === val ? '#2563eb' : '#64748b',
                                    fontWeight: 600,
                                    fontSize: 14,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    textTransform: 'capitalize',
                                    fontFamily: 'inherit',
                                }}
                            >
                                {val === 'yes' ? 'Yes' : 'No'}
                            </button>
                        ))}
                    </div>
                </div>

                {data.isEmployed === 'yes' && (
                    <div style={{ animation: 'fadeSlideIn 0.3s ease' }}>
                        <div className="form-group">
                            <label className="form-label">What is your current work/position? <span className="required">*</span></label>
                            <input
                                type="text"
                                className={fieldClass('employmentWork')}
                                placeholder="e.g. Software Developer at ABC Corp"
                                value={data.employmentWork || ''}
                                onChange={(e) => handleChange('employmentWork', e.target.value)}
                            />
                            {touched.employmentWork && errors.employmentWork && <div className="field-error">{errors.employmentWork}</div>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">When did you start? <span className="required">*</span></label>
                            <input
                                type="month"
                                className={fieldClass('employmentStart')}
                                value={data.employmentStart || ''}
                                onChange={(e) => handleChange('employmentStart', e.target.value)}
                            />
                            {touched.employmentStart && errors.employmentStart && <div className="field-error">{errors.employmentStart}</div>}
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Educational History ───────────────────────────── */}
            <div className="reg-form-section" style={{ animation: 'fadeSlideIn 0.35s ease 0.1s both' }}>
                <div className="step2-section-header">
                    <GraduationCap size={16} /> <span>Educational History <span className="required">*</span></span>
                </div>

                {(data.educHistory || []).map((edu, i) => (
                    <div key={i} className="profile-entry-card" style={{ animation: 'fadeSlideIn 0.3s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Education #{i + 1}</span>
                            <button type="button" onClick={() => removeEducation(i)} className="profile-entry-remove">
                                <Trash2 size={13} /> Remove
                            </button>
                        </div>
                        <div className="form-group">
                            <input type="text" className="form-input" placeholder="School / University"
                                value={edu.school} onChange={(e) => updateEducation(i, 'school', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <input type="text" className="form-input" placeholder="Degree / Program (e.g. BS Computer Science)"
                                value={edu.degree} onChange={(e) => updateEducation(i, 'degree', e.target.value)} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div className="form-group">
                                <input type="number" className="form-input" placeholder="Year From"
                                    min="1950" max="2030"
                                    value={edu.yearFrom} onChange={(e) => updateEducation(i, 'yearFrom', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <input type="number" className="form-input" placeholder="Year To (or expected)"
                                    min="1950" max="2035"
                                    value={edu.yearTo} onChange={(e) => updateEducation(i, 'yearTo', e.target.value)} />
                            </div>
                        </div>
                    </div>
                ))}

                <button type="button" onClick={addEducation} className="profile-add-btn">
                    <Plus size={15} /> Add Education
                </button>
                {touched.educHistory && errors.educHistory && <div className="field-error" style={{ marginTop: 6 }}>{errors.educHistory}</div>}
            </div>

            {/* ─── Work Experience ────────────────────────────────── */}
            <div className="reg-form-section" style={{ animation: 'fadeSlideIn 0.35s ease 0.15s both' }}>
                <div className="step2-section-header">
                    <Briefcase size={16} /> <span>Work Experience <span style={{ fontSize: 11, fontWeight: 400, color: '#94a3b8' }}>(Optional)</span></span>
                </div>

                {(data.workExperience || []).map((work, i) => (
                    <div key={i} className="profile-entry-card" style={{ animation: 'fadeSlideIn 0.3s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Experience #{i + 1}</span>
                            <button type="button" onClick={() => removeWorkExperience(i)} className="profile-entry-remove">
                                <Trash2 size={13} /> Remove
                            </button>
                        </div>
                        <div className="form-group">
                            <input type="text" className="form-input" placeholder="Company / Organization"
                                value={work.company} onChange={(e) => updateWorkExperience(i, 'company', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <input type="text" className="form-input" placeholder="Position / Role"
                                value={work.position} onChange={(e) => updateWorkExperience(i, 'position', e.target.value)} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div className="form-group">
                                <input type="month" className="form-input"
                                    value={work.yearFrom} onChange={(e) => updateWorkExperience(i, 'yearFrom', e.target.value)} />
                                <span style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2, display: 'block' }}>Start Date</span>
                            </div>
                            <div className="form-group">
                                <input type="month" className="form-input"
                                    value={work.yearTo} onChange={(e) => updateWorkExperience(i, 'yearTo', e.target.value)} />
                                <span style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2, display: 'block' }}>End Date</span>
                            </div>
                        </div>
                    </div>
                ))}

                <button type="button" onClick={addWorkExperience} className="profile-add-btn">
                    <Plus size={15} /> Add Work Experience
                </button>
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Optional — skip if you have no work experience yet.</p>
            </div>

            {/* ─── Licenses & Certifications ─────────────────────── */}
            <div className="reg-form-section" style={{ animation: 'fadeSlideIn 0.35s ease 0.2s both' }}>
                <div className="step2-section-header">
                    <Award size={16} /> <span>Licenses & Certifications <span style={{ fontSize: 11, fontWeight: 400, color: '#94a3b8' }}>(Optional)</span></span>
                </div>

                {(data.licenses || []).map((lic, i) => (
                    <div key={i} className="profile-entry-card" style={{ animation: 'fadeSlideIn 0.3s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>License/Cert #{i + 1}</span>
                            <button type="button" onClick={() => removeLicense(i)} className="profile-entry-remove">
                                <Trash2 size={13} /> Remove
                            </button>
                        </div>

                        {/* Certification Name */}
                        <div className="form-group">
                            <label className="form-label">Certification / License Name</label>
                            <input type="text" className="form-input" placeholder="e.g. AWS Certified Solutions Architect"
                                value={lic.name} onChange={(e) => updateLicense(i, 'name', e.target.value)} />
                        </div>

                        {/* Issuing Organization */}
                        <div className="form-group">
                            <label className="form-label">Issuing Organization</label>
                            <input type="text" className="form-input" placeholder="e.g. Amazon Web Services, Google, PRC"
                                value={lic.issuer} onChange={(e) => updateLicense(i, 'issuer', e.target.value)} />
                        </div>

                        {/* Issue Date & Expiration Date */}
                        <div className="license-date-grid">
                            <div className="form-group">
                                <label className="form-label">Issue Date</label>
                                <input type="month" className="form-input"
                                    value={lic.dateIssued} onChange={(e) => updateLicense(i, 'dateIssued', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Expiration Date</label>
                                <input type="month" className="form-input"
                                    value={lic.expirationDate || ''}
                                    disabled={lic.noExpiration}
                                    style={lic.noExpiration ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                    onChange={(e) => updateLicense(i, 'expirationDate', e.target.value)} />
                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: 6, marginTop: 6,
                                    fontSize: 12, color: '#64748b', cursor: 'pointer', userSelect: 'none',
                                }}>
                                    <input type="checkbox" checked={lic.noExpiration || false}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            const updated = [...(data.licenses || [])];
                                            updated[i] = { ...updated[i], noExpiration: checked, ...(checked ? { expirationDate: '' } : {}) };
                                            handleChange('licenses', updated);
                                        }}
                                        style={{ accentColor: '#2563eb' }} />
                                    Does not expire
                                </label>
                            </div>
                        </div>

                        {/* Credential ID */}
                        <div className="form-group">
                            <label className="form-label">Credential ID <span style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
                            <input type="text" className="form-input" placeholder="e.g. AWS-12345"
                                value={lic.credentialId || ''} onChange={(e) => updateLicense(i, 'credentialId', e.target.value)} />
                        </div>

                        {/* Credential URL */}
                        <div className="form-group">
                            <label className="form-label">
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    Credential URL <span style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
                                </span>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input type="url" className="form-input" style={{ paddingLeft: 34 }}
                                    placeholder="https://credly.com/badges/abc123"
                                    value={lic.credentialUrl || ''} onChange={(e) => updateLicense(i, 'credentialUrl', e.target.value)} />
                                <Link2 size={14} style={{
                                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                                    color: '#94a3b8', pointerEvents: 'none',
                                }} />
                            </div>
                            {lic.credentialUrl && (
                                <a href={lic.credentialUrl} target="_blank" rel="noopener noreferrer"
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6,
                                        fontSize: 12, fontWeight: 600, color: '#2563eb', textDecoration: 'none',
                                    }}>
                                    <ExternalLink size={12} /> Preview credential link
                                </a>
                            )}
                        </div>

                        {/* Valid credential preview badge */}
                        {lic.name && lic.issuer && (
                            <div style={{
                                marginTop: 8, padding: '10px 14px', borderRadius: 10,
                                background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                                border: '1px solid #bbf7d0',
                                display: 'flex', alignItems: 'center', gap: 10,
                            }}>
                                <Award size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>{lic.name}</div>
                                    <div style={{ fontSize: 11.5, color: '#15803d' }}>{lic.issuer}{lic.credentialId ? ` • ID: ${lic.credentialId}` : ''}</div>
                                </div>
                                {lic.credentialUrl && (
                                    <span style={{
                                        fontSize: 11, fontWeight: 600, color: '#2563eb',
                                        background: '#eff6ff', border: '1px solid #93c5fd',
                                        borderRadius: 6, padding: '3px 8px',
                                        display: 'flex', alignItems: 'center', gap: 3,
                                    }}>
                                        <ExternalLink size={10} /> Verifiable
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                <button type="button" onClick={addLicense} className="profile-add-btn">
                    <Plus size={15} /> Add License / Certification
                </button>
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Optional — add any relevant licenses or certifications.</p>
            </div>

            {/* ─── Skills ────────────────────────────────────────── */}
            <div className="reg-form-section" style={{ animation: 'fadeSlideIn 0.35s ease 0.25s both' }}>
                <div className="step2-section-header">
                    <Sparkles size={16} /> <span>Skills <span className="required">*</span></span>
                </div>

                {/* Skill cards with proficiency */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(data.skills || []).map((skill, i) => {
                        const pColor = PROFICIENCY_COLORS[skill.level] || PROFICIENCY_COLORS.Beginner;
                        return (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '8px 12px', borderRadius: 10,
                                background: '#f8fafc', border: '1px solid #e2e8f0',
                                gap: 10, animation: 'fadeSlideIn 0.25s ease',
                            }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', flex: 1 }}>
                                    {skill.name}
                                </span>
                                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                    {PROFICIENCY_LEVELS.map((lvl) => (
                                        <button
                                            key={lvl}
                                            type="button"
                                            onClick={() => updateSkillLevel(i, lvl)}
                                            style={{
                                                padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                                                border: `1.5px solid ${skill.level === lvl ? pColor.border : '#e2e8f0'}`,
                                                background: skill.level === lvl ? pColor.bg : '#fff',
                                                color: skill.level === lvl ? pColor.color : '#94a3b8',
                                                cursor: 'pointer', transition: 'all 0.15s ease',
                                                fontFamily: 'inherit',
                                            }}
                                        >
                                            {lvl}
                                        </button>
                                    ))}
                                    <button type="button" onClick={() => removeSkill(i)}
                                        style={{
                                            marginLeft: 4, background: 'none', border: 'none',
                                            color: '#94a3b8', cursor: 'pointer', padding: 2, display: 'flex',
                                        }}>
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Input with suggestions */}
                <div style={{ position: 'relative', marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Type a skill and press Enter..."
                            value={newSkill}
                            onChange={(e) => { setNewSkill(e.target.value); setShowSkillSuggestions(true); }}
                            onFocus={() => setShowSkillSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSkillSuggestions(false), 200)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(newSkill); } }}
                        />
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => addSkill(newSkill)}
                            disabled={!newSkill.trim()}>
                            <Plus size={14} />
                        </button>
                    </div>
                    {showSkillSuggestions && newSkill && filteredSkillSuggestions.length > 0 && (
                        <div className="profile-suggestions-dropdown">
                            {filteredSkillSuggestions.map((s) => (
                                <button key={s} type="button" className="profile-suggestion-item"
                                    onMouseDown={() => addSkill(s)}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                {touched.skills && errors.skills && <div className="field-error" style={{ marginTop: 6 }}>{errors.skills}</div>}
            </div>

            {/* ─── Interests ──────────────────────────────────────────────── */}
            <div className="reg-form-section" style={{ animation: 'fadeSlideIn 0.35s ease 0.3s both' }}>
                <div className="step2-section-header">
                    <Heart size={16} /> <span>Interests <span className="required">*</span></span>
                </div>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16, marginTop: -4 }}>
                    {(data.interests?.length || 0)}/10 interests selected
                </div>

                {data.interests?.length > 0 && (
                    <>
                        <div style={{
                            display: 'flex', flexWrap: 'wrap', marginBottom: 12,
                            padding: '30px', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #f8fafc 100%)',
                            borderRadius: 16, border: '1px solid #e2e8f0',
                            alignItems: 'center', justifyContent: 'center',
                            minHeight: 180, position: 'relative', overflow: 'hidden',
                            boxShadow: 'inset 0 4px 6px -1px rgba(0, 0, 0, 0.02)',
                        }}>
                            {/* Subtle glowing orb in background for depth */}
                            <div style={{
                                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, rgba(255,255,255,0) 70%)',
                                pointerEvents: 'none', borderRadius: '50%'
                            }} />

                            {(data.interests || []).map((interest, i) => {
                                const wcStyle = getWordCloudStyle(interest);
                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => removeInterest(i)}
                                        className="word-cloud-text-tag"
                                        style={{
                                            background: 'none', border: 'none', padding: 0,
                                            color: wcStyle.color,
                                            fontSize: wcStyle.fontSize,
                                            fontWeight: 800,
                                            transform: `rotate(${wcStyle.rotate})`,
                                            margin: wcStyle.margin,
                                            transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                            cursor: 'pointer',
                                            userSelect: 'none',
                                            position: 'relative',
                                            zIndex: 2,
                                            lineHeight: 1
                                        }}
                                        title="Click to remove"
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = `rotate(0deg) scale(1.15)`;
                                            e.currentTarget.style.zIndex = 10;
                                            e.currentTarget.style.textDecoration = 'line-through';
                                            e.currentTarget.style.textDecorationColor = '#ef4444';
                                            e.currentTarget.style.textDecorationThickness = '3px';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = `rotate(${wcStyle.rotate}) scale(1)`;
                                            e.currentTarget.style.zIndex = 2;
                                            e.currentTarget.style.textDecoration = 'none';
                                        }}
                                    >
                                        {interest}
                                    </button>
                                );
                            })}
                        </div>
                        <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 16 }}>
                            {(data.interests?.length || 0)}/10 interests selected — click a word to remove it
                        </div>
                    </>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Type an interest and press Enter..."
                        value={newInterest}
                        onChange={(e) => setNewInterest(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                addInterest(newInterest);
                            }
                        }}
                        disabled={(data.interests?.length || 0) >= MAX_INTERESTS}
                    />
                    <button type="button" className="btn btn-outline btn-sm"
                        onClick={() => addInterest(newInterest)}
                        disabled={!newInterest.trim() || (data.interests?.length || 0) >= MAX_INTERESTS}>
                        <Plus size={14} />
                    </button>
                </div>
                {touched.interests && errors.interests && <div className="field-error" style={{ marginTop: 6 }}>{errors.interests}</div>}
            </div>

            {/* ─── Resume Upload ──────────────────────────────────── */}
            <div className="reg-form-section" style={{ animation: 'fadeSlideIn 0.35s ease 0.35s both' }}>
                <div className="step2-section-header">
                    <FileText size={16} /> <span>Upload Resume <span style={{ fontSize: 11, fontWeight: 400, color: '#94a3b8' }}>(Optional)</span></span>
                </div>

                {!data.resume ? (
                    <label className="resume-upload-zone">
                        <input type="file" accept=".pdf,.doc,.docx,.txt,.rtf" onChange={handleResumeUpload}
                            style={{ display: 'none' }} />
                        <Upload size={28} style={{ color: '#3b82f6', marginBottom: 8 }} />
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>
                            Click to upload your resume
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                            PDF, DOC, DOCX, TXT, or RTF — max 5MB
                        </div>
                    </label>
                ) : (
                    <div className="resume-preview">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <FileText size={20} style={{ color: '#2563eb', flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {data.resume.name}
                                </div>
                                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                                    {(data.resume.size / 1024).toFixed(1)} KB
                                </div>
                            </div>
                            <button type="button" onClick={() => handleChange('resume', null)} className="profile-entry-remove">
                                <Trash2 size={13} /> Remove
                            </button>
                        </div>
                    </div>
                )}
                {errors.resume && <div className="field-error" style={{ marginTop: 6 }}>{errors.resume}</div>}
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Optional — you can upload this later from your profile.</p>
            </div>
        </div>
    );
}
