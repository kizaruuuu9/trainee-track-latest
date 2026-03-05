import React, { useState } from 'react';
import {
    User, CreditCard, GraduationCap, MapPin, Calendar,
    Mail, Lock, ShieldCheck, Image, CheckCircle, AlertTriangle, Eye, EyeOff,
    Briefcase, Award, Sparkles, Heart, FileText, ExternalLink
} from 'lucide-react';

export default function Step4Confirmation({ step1Data, step2Data, step3Data }) {
    const [showPassword, setShowPassword] = useState(false);

    // Build full address string
    const fullAddress = [
        step2Data.detailedAddress,
        step2Data.barangay,
        step2Data.city,
        step2Data.province,
        step2Data.region
    ].filter(Boolean).join(', ');

    // Format birthdate
    const formattedBirthdate = step2Data.birthdate
        ? new Date(step2Data.birthdate + 'T00:00:00').toLocaleDateString('en-PH', {
            year: 'numeric', month: 'long', day: 'numeric'
        })
        : '—';

    // Mask password for display
    const maskedPassword = step2Data.password
        ? showPassword ? step2Data.password : '•'.repeat(step2Data.password.length)
        : '—';

    const InfoRow = ({ icon: Icon, label, value, status }) => (
        <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '10px 0',
            borderBottom: '1px solid #f1f5f9',
        }}>
            <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
            }}>
                <Icon size={15} style={{ color: '#2563eb' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {label}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginTop: 2, wordBreak: 'break-word' }}>
                    {value || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>Not provided</span>}
                </div>
            </div>
            {status && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 11, fontWeight: 600,
                    color: status === 'verified' ? '#16a34a' : '#f59e0b',
                    background: status === 'verified' ? '#f0fdf4' : '#fffbeb',
                    border: `1px solid ${status === 'verified' ? '#bbf7d0' : '#fde68a'}`,
                    borderRadius: 6, padding: '3px 8px',
                    flexShrink: 0,
                }}>
                    {status === 'verified' ? <ShieldCheck size={12} /> : <AlertTriangle size={12} />}
                    {status === 'verified' ? 'Verified' : 'Pending'}
                </div>
            )}
        </div>
    );

    return (
        <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                Step 4 — Review & Confirm
            </h3>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
                Please review your information before submitting your registration.
            </p>

            {/* ─── ID Images Preview ─────────────────────────────── */}
            <div className="reg-form-section" style={{ animation: 'fadeSlideIn 0.35s ease' }}>
                <div className="step2-section-header">
                    <Image size={16} /> <span>School ID</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 12 }}>
                    {/* Front ID */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            fontSize: 11, fontWeight: 600, color: '#94a3b8',
                            textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8
                        }}>Front</div>
                        {step1Data.frontID ? (
                            <div style={{
                                borderRadius: 10, overflow: 'hidden',
                                border: '1px solid #e2e8f0',
                                background: '#f8fafc',
                            }}>
                                <img
                                    src={step1Data.frontID.url}
                                    alt="Front ID"
                                    style={{
                                        width: '100%', height: 120, objectFit: 'cover',
                                        display: 'block',
                                    }}
                                />
                            </div>
                        ) : (
                            <div style={{
                                height: 120, borderRadius: 10, border: '2px dashed #e2e8f0',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#cbd5e1', fontSize: 12,
                            }}>
                                No image
                            </div>
                        )}
                    </div>

                    {/* Back ID */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            fontSize: 11, fontWeight: 600, color: '#94a3b8',
                            textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8
                        }}>Back</div>
                        {step1Data.backID ? (
                            <div style={{
                                borderRadius: 10, overflow: 'hidden',
                                border: '1px solid #e2e8f0',
                                background: '#f8fafc',
                            }}>
                                <img
                                    src={step1Data.backID.url}
                                    alt="Back ID"
                                    style={{
                                        width: '100%', height: 120, objectFit: 'cover',
                                        display: 'block',
                                    }}
                                />
                            </div>
                        ) : (
                            <div style={{
                                height: 120, borderRadius: 10, border: '2px dashed #e2e8f0',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#cbd5e1', fontSize: 12,
                            }}>
                                No image
                            </div>
                        )}
                    </div>
                </div>

                {step1Data.ocrStatus === 'success' && (
                    <div style={{
                        marginTop: 10, padding: '6px 10px', borderRadius: 8,
                        background: '#f0fdf4', border: '1px solid #bbf7d0',
                        fontSize: 12, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        <CheckCircle size={13} /> OCR extraction successful
                    </div>
                )}
            </div>

            {/* ─── Personal Details ───────────────────────────────── */}
            <div className="reg-form-section" style={{ animation: 'fadeSlideIn 0.35s ease 0.1s both' }}>
                <div className="step2-section-header">
                    <User size={16} /> <span>Personal Details</span>
                </div>

                <InfoRow icon={User} label="Full Name" value={step1Data.fullName} />
                <InfoRow icon={CreditCard} label="Student ID" value={step1Data.studentId} />
                <InfoRow icon={GraduationCap} label="Program" value={step1Data.program} />
                <InfoRow icon={User} label="Gender" value={step1Data.gender} />
                <InfoRow icon={Calendar} label="Birthdate" value={formattedBirthdate} />
            </div>

            {/* ─── Address ────────────────────────────────────────── */}
            <div className="reg-form-section" style={{ animation: 'fadeSlideIn 0.35s ease 0.2s both' }}>
                <div className="step2-section-header">
                    <MapPin size={16} /> <span>Address</span>
                </div>

                <InfoRow icon={MapPin} label="Full Address" value={fullAddress} />
            </div>

            {/* ─── Account Credentials ────────────────────────────── */}
            <div className="reg-form-section" style={{ animation: 'fadeSlideIn 0.35s ease 0.3s both' }}>
                <div className="step2-section-header">
                    <Lock size={16} /> <span>Account Credentials</span>
                </div>

                <InfoRow
                    icon={Mail}
                    label="Email"
                    value={step2Data.email}
                    status={step2Data.emailVerified ? 'verified' : 'pending'}
                />

                <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '10px 0',
                }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <Lock size={15} style={{ color: '#2563eb' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Password
                        </div>
                        <div style={{
                            fontSize: 14, fontWeight: 600, color: '#0f172a', marginTop: 2,
                            display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                            <span style={{ fontFamily: showPassword ? 'inherit' : 'monospace', letterSpacing: showPassword ? 'normal' : '0.15em' }}>
                                {maskedPassword}
                            </span>
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: '#94a3b8', padding: 2, display: 'flex',
                                }}
                            >
                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Profile Summary ────────────────────────────────── */}
            <div className="reg-form-section" style={{ animation: 'fadeSlideIn 0.35s ease 0.35s both' }}>
                <div className="step2-section-header">
                    <GraduationCap size={16} /> <span>Profile</span>
                </div>

                <InfoRow icon={GraduationCap} label="Status" value={step3Data?.status ? step3Data.status.charAt(0).toUpperCase() + step3Data.status.slice(1) : null} />
                {step3Data?.status === 'graduate' && (
                    <InfoRow icon={GraduationCap} label="School Graduated From" value={step3Data.graduateSchool} />
                )}
                <InfoRow icon={Briefcase} label="Currently Employed" value={step3Data?.isEmployed === 'yes' ? 'Yes' : step3Data?.isEmployed === 'no' ? 'No' : null} />
                {step3Data?.isEmployed === 'yes' && (
                    <>
                        <InfoRow icon={Briefcase} label="Current Work" value={step3Data.employmentWork} />
                        <InfoRow icon={Calendar} label="Employment Start" value={step3Data.employmentStart} />
                    </>
                )}
            </div>

            {/* ─── Education ──────────────────────────────────────── */}
            {step3Data?.educHistory?.length > 0 && (
                <div className="reg-form-section" style={{ animation: 'fadeSlideIn 0.35s ease 0.4s both' }}>
                    <div className="step2-section-header">
                        <GraduationCap size={16} /> <span>Education ({step3Data.educHistory.length})</span>
                    </div>
                    {step3Data.educHistory.map((edu, i) => (
                        <div key={i} style={{ padding: '8px 0', borderBottom: i < step3Data.educHistory.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{edu.school || 'Untitled'}</div>
                            <div style={{ fontSize: 12.5, color: '#64748b' }}>{edu.degree}{edu.yearFrom || edu.yearTo ? ` (${edu.yearFrom}–${edu.yearTo})` : ''}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* ─── Work Experience ────────────────────────────────── */}
            {step3Data?.workExperience?.length > 0 && (
                <div className="reg-form-section" style={{ animation: 'fadeSlideIn 0.35s ease 0.45s both' }}>
                    <div className="step2-section-header">
                        <Briefcase size={16} /> <span>Work Experience ({step3Data.workExperience.length})</span>
                    </div>
                    {step3Data.workExperience.map((work, i) => (
                        <div key={i} style={{ padding: '8px 0', borderBottom: i < step3Data.workExperience.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{work.position || 'Untitled'}</div>
                            <div style={{ fontSize: 12.5, color: '#64748b' }}>{work.company}{work.yearFrom || work.yearTo ? ` (${work.yearFrom}–${work.yearTo})` : ''}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* ─── Licenses ──────────────────────────────────────── */}
            {step3Data?.licenses?.length > 0 && (
                <div className="reg-form-section" style={{ animation: 'fadeSlideIn 0.35s ease 0.5s both' }}>
                    <div className="step2-section-header">
                        <Award size={16} /> <span>Licenses & Certifications ({step3Data.licenses.length})</span>
                    </div>
                    {step3Data.licenses.map((lic, i) => (
                        <div key={i} style={{
                            padding: '12px 0',
                            borderBottom: i < step3Data.licenses.length - 1 ? '1px solid #f1f5f9' : 'none',
                            display: 'flex', alignItems: 'flex-start', gap: 12,
                        }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 8,
                                background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                                <Award size={16} style={{ color: '#2563eb' }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{lic.name || 'Untitled'}</div>
                                <div style={{ fontSize: 12.5, color: '#64748b' }}>{lic.issuer}</div>
                                <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>
                                    {lic.dateIssued ? `Issued ${lic.dateIssued}` : ''}
                                    {lic.dateIssued && (lic.expirationDate || lic.noExpiration) ? ' • ' : ''}
                                    {lic.noExpiration ? 'No expiration' : lic.expirationDate ? `Expires ${lic.expirationDate}` : ''}
                                </div>
                                {lic.credentialId && (
                                    <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 1 }}>Credential ID: {lic.credentialId}</div>
                                )}
                                {lic.credentialUrl && (
                                    <a href={lic.credentialUrl} target="_blank" rel="noopener noreferrer"
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 5,
                                            marginTop: 6, padding: '5px 12px', borderRadius: 6,
                                            fontSize: 12, fontWeight: 600, color: '#2563eb',
                                            background: '#eff6ff', border: '1px solid #93c5fd',
                                            textDecoration: 'none', transition: 'all 0.15s',
                                        }}>
                                        <ExternalLink size={12} /> Show Credential
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ─── Skills & Interests ────────────────────────────── */}
            {((step3Data?.skills?.length > 0) || (step3Data?.interests?.length > 0)) && (
                <div className="reg-form-section" style={{ animation: 'fadeSlideIn 0.35s ease 0.55s both' }}>
                    {step3Data?.skills?.length > 0 && (
                        <div style={{ marginBottom: step3Data?.interests?.length > 0 ? 16 : 0 }}>
                            <div className="step2-section-header">
                                <Sparkles size={16} /> <span>Skills ({step3Data.skills.length})</span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {step3Data.skills.map((skill, i) => {
                                    const isObj = typeof skill === 'object';
                                    const name = isObj ? skill.name : skill;
                                    const level = isObj ? skill.level : null;
                                    const levelColors = {
                                        Beginner: { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
                                        Intermediate: { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
                                        Advanced: { bg: '#dcfce7', color: '#166534', border: '#86efac' },
                                    };
                                    const lc = level ? levelColors[level] : null;
                                    return (
                                        <span key={i} className="profile-tag skill-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                            {name}
                                            {lc && (
                                                <span style={{
                                                    fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8,
                                                    background: lc.bg, color: lc.color, border: `1px solid ${lc.border}`,
                                                }}>{level}</span>
                                            )}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {step3Data?.interests?.length > 0 && (
                        <div>
                            <div className="step2-section-header">
                                <Heart size={16} /> <span>Interests ({step3Data.interests.length})</span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {step3Data.interests.map((interest, i) => (
                                    <span key={i} style={{
                                        display: 'inline-block', padding: '5px 12px', borderRadius: 20,
                                        fontSize: 12.5, fontWeight: 600,
                                        background: 'linear-gradient(135deg, #faf5ff, #ede9fe)',
                                        color: '#7c3aed', border: '1px solid #c4b5fd',
                                    }}>{interest}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ─── Resume ────────────────────────────────────────── */}
            {step3Data?.resume && (
                <div className="reg-form-section" style={{ animation: 'fadeSlideIn 0.35s ease 0.6s both' }}>
                    <div className="step2-section-header">
                        <FileText size={16} /> <span>Resume</span>
                    </div>
                    <InfoRow icon={FileText} label="Uploaded File" value={step3Data.resume.name} />
                </div>
            )}

            {/* ─── Confirmation Notice ────────────────────────────── */}
            <div style={{
                marginTop: 16, padding: '14px 16px',
                background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                border: '1px solid #93c5fd',
                borderRadius: 10,
                display: 'flex', alignItems: 'flex-start', gap: 10,
                animation: 'fadeSlideIn 0.35s ease 0.4s both',
            }}>
                <AlertTriangle size={18} style={{ color: '#2563eb', flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.5 }}>
                    Please make sure all information above is correct. Once submitted, your registration will be reviewed by an administrator. You can go back to previous steps to make changes.
                </div>
            </div>
        </div>
    );
}
