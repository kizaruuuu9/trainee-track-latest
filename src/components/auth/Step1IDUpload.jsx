import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    Upload, X, CheckCircle, AlertTriangle, Image, Loader, Eye
} from 'lucide-react';
import Tesseract from 'tesseract.js';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

const PROGRAMS = [
    'CSS NC II',
    'Web Development NC III',
    'Automotive NC II',
    'Electrical Installation NC II',
    'Welding NC I',
    'Bookkeeping NC III',
    'Cookery NC II',
    'Food and Beverage Services NC II',
];

const GENDERS = ['Male', 'Female', 'Prefer not to say'];

// Helper for title casing ALL CAPS text
function formatTitleCase(str) {
    if (str === str.toUpperCase()) {
        return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
    return str;
}

// ─── OCR Text Parser ──────────────────────────────────────────
// Attempts to extract structured student info from raw OCR text
function parseOCRText(frontText, backText) {
    // Combine both sides for field parsing (name/ID from front, address from back)
    const combinedLines = [...frontText.split('\n'), ...backText.split('\n')]
        .map(l => l.trim()).filter(Boolean);
    const fullText = combinedLines.join(' ');
    const lowerFullText = fullText.toLowerCase();
    const result = { fullName: '', studentId: '', program: '', address: '', gender: '' };

    // 0. PSTDI Verification — uses data patterns & layout instead of unreadable logos
    const lowerFront = frontText.toLowerCase();
    const lowerBack = backText.toLowerCase();

    // Front ID checks:
    //  - Must have "ID No:" label (or "ID No" without colon due to OCR)
    //  - Must have a Student ID in 20XX-XXXX format
    //  - Must have a known TESDA program (CSS, Cookery, Welding, etc.)
    const hasFrontIDLabel = /id\s*no/i.test(frontText);
    const hasFrontStudentId = /\b20\d{2}[-–][A-Za-z0-9]{3,6}\b/.test(frontText);
    const hasFrontProgram = PROGRAMS.some(prog => {
        const keywords = prog.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        return keywords.some(kw => lowerFront.includes(kw));
    });

    // Back ID checks:
    //  - Must have "School Administrator" (unique to PSTDI back layout)
    const hasBackAdmin = lowerBack.includes('school administrator') || lowerBack.includes('administrator');

    const isPSTDI = hasFrontIDLabel && hasFrontStudentId && hasFrontProgram && hasBackAdmin;

    if (!isPSTDI) {
        return null; // Not a PSTDI ID
    }

    // 1. Student ID — look explicitly for 20XX-XXXX format
    const idMatch = fullText.match(/\b(20\d{2}[-–][A-Za-z0-9]{3,6})\b/);
    if (idMatch) {
        result.studentId = idMatch[1].replace('–', '-');
    }

    // 2. Gender — look for "Sex: Female" or "Gender: Male"
    const genderMatch = fullText.match(/\b(male|female|sex\s*[:\-]?\s*(?:female|male|[mf])|gender\s*[:\-]?\s*(?:female|male|[mf]))\b/i);
    if (genderMatch) {
        const g = genderMatch[0].toLowerCase();
        if (g.includes('f') || g === 'female') result.gender = 'Female';
        else if (g.includes('m') || g === 'male') result.gender = 'Male';
    }

    // 3. Program — fuzzy match against known programs (e.g. "CSS NC II")
    const lowerText = fullText.toLowerCase();
    for (const prog of PROGRAMS) {
        const ncPart = prog.match(/NC\s+[IV]+/i);
        const namePart = prog.replace(/NC\s+[IV]+/i, '').trim().toLowerCase();
        if (ncPart && lowerText.includes(ncPart[0].toLowerCase()) && lowerText.includes(namePart.split(' ')[0])) {
            result.program = prog;
            break;
        }
        const keywords = namePart.split(/\s+/).filter(w => w.length > 3);
        const matched = keywords.filter(kw => lowerText.includes(kw));
        if (matched.length >= 1) {
            result.program = prog;
            break;
        }
    }

    // 4. Name — On this specific ID, the name is usually the line directly above the ID number
    for (let i = 0; i < combinedLines.length; i++) {
        const line = combinedLines[i];
        if (/(?:ID\s*No\.?|ID\s*Number)/i.test(line) && i > 0) {
            const nameLine = combinedLines[i - 1].replace(/[^a-zA-ZÀ-ÿñÑ\s.-]/g, '').trim();
            if (nameLine.split(/\s+/).length >= 2) {
                result.fullName = formatTitleCase(nameLine);
                break;
            }
        }
    }

    // Fallback for Name if not found directly above ID No
    if (!result.fullName) {
        const namePatterns = [
            /(?:name|student\s*name|full\s*name|learner)\s*[:\-–]?\s*([A-Za-zÀ-ÿñÑ\s.-]{5,40})/i,
            /(?:^|\n)\s*([A-ZÑ][A-ZÑ\s.-]{2,}(?:,\s*[A-ZÑ][A-ZÑ\s.-]+)?)\s*(?:\n|$)/, // ALL CAPS NAME
        ];
        for (const pattern of namePatterns) {
            const match = fullText.match(pattern);
            if (match && match[1]) {
                const cleaned = match[1].replace(/[^a-zA-ZÀ-ÿñÑ\s.,-]/g, '').trim();
                if (cleaned.split(/\s+/).length >= 2 && cleaned.length > 4) {
                    result.fullName = formatTitleCase(cleaned);
                    break;
                }
            }
        }
    }

    // 5. Address — Extract multi-line address between "Home Address:" and "Sex:"
    let addressFound = false;
    let addressParts = [];
    for (let i = 0; i < combinedLines.length; i++) {
        const line = combinedLines[i];

        if (/(?:home\s*)?address\s*:/i.test(line)) {
            addressFound = true;
            // Capture anything on the same line after the colon
            const onSameLine = line.replace(/.*?(?:home\s*)?address\s*:/i, '').trim();
            if (onSameLine) addressParts.push(onSameLine);
            continue;
        }

        if (addressFound) {
            // Stop collecting when we hit the next section (Sex, Emergency, etc.)
            if (/sex\s*:|gender\s*:|in\s*case\s*of\s*emergency/i.test(line)) {
                break;
            }
            addressParts.push(line);
        }
    }

    if (addressParts.length > 0) {
        // Clean up noise: remove non-alphanumeric chars, trim spaces
        let cleanedAddr = addressParts.join(' ').replace(/[^a-zA-ZÀ-ÿñÑ0-9\s.,#-]/g, ' ').replace(/\s+/g, ' ').trim();

        // Correct common Tesseract hallucinations for "CITY"
        cleanedAddr = cleanedAddr.replace(/\s+E\s*ary\b/gi, ' CITY');
        cleanedAddr = cleanedAddr.replace(/\bC[lI1]TY\b/gi, 'CITY');

        // Remove trailing or leading single-letter noise (like "i 4219")
        cleanedAddr = cleanedAddr.replace(/^[a-zA-Z]\s+/, '').replace(/\s+[a-zA-Z]{1,2}$/, '').trim();

        // Ensure "VALENZUELA" is followed by "CITY" if the end was corrupted
        if (cleanedAddr.toUpperCase().includes('VALENZUELA') && !cleanedAddr.toUpperCase().includes('CITY')) {
            cleanedAddr = cleanedAddr.replace(/VALENZUELA.*/i, 'VALENZUELA CITY');
        }

        result.address = formatTitleCase(cleanedAddr);
    } else {
        // Fallback for Address
        const addressPatterns = [
            /(?:address|residence|location)\s*[:\-–]?\s*([^\\n]{10,80})/i,
            /([A-Za-z0-9\s.,#-]{5,50}(?:City|Province|Brgy|Barangay|St\.|Street|Avenue|Ave\.|Subd|Village)[A-Za-z0-9\s.,#-]{0,50})/i,
        ];
        for (const pattern of addressPatterns) {
            const match = fullText.match(pattern);
            if (match && match[1]) {
                const addr = match[1].replace(/[^a-zA-ZÀ-ÿñÑ0-9\s.,#-]/g, '').trim();
                if (addr.length > 10) {
                    result.address = formatTitleCase(addr);
                    break;
                }
            }
        }
    }

    return result;
}

export default function Step1IDUpload({ data, onChange, onValidChange }) {
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [previewModal, setPreviewModal] = useState(null);
    const [ocrProgress, setOcrProgress] = useState(0);
    const [rawOcrText, setRawOcrText] = useState('');
    const [idDuplicateError, setIdDuplicateError] = useState('');
    const [idChecking, setIdChecking] = useState(false);
    const [idVerified, setIdVerified] = useState(false);
    const lastCheckedId = useRef('');
    const debounceTimer = useRef(null);
    const frontRef = useRef(null);
    const backRef = useRef(null);

    // Auto-detect API base
    const API_BASE = window.location.hostname === 'localhost'
        ? 'http://localhost:3001'
        : '';

    // ─── Auto-trigger duplicate check while typing (debounced) ───
    useEffect(() => {
        const trimmed = data.studentId?.trim();
        // Only auto-check when format is valid
        if (!trimmed || !/^\d{2,4}-[A-Za-z0-9]{3,6}$/.test(trimmed)) return;
        if (trimmed === lastCheckedId.current) return;
        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            checkStudentIdDuplicate(trimmed);
        }, 800);
        return () => clearTimeout(debounceTimer.current);
    }, [data.studentId]);

    // ─── Check student ID duplicate ──────────────────────────────
    const checkStudentIdDuplicate = async (studentId) => {
        const trimmed = studentId?.trim();
        if (!trimmed || !/^\d{2,4}-[A-Za-z0-9]{3,6}$/.test(trimmed)) return;
        // Don't re-check the same value
        if (trimmed === lastCheckedId.current) return;
        lastCheckedId.current = trimmed;
        setIdChecking(true);
        setIdDuplicateError('');
        setIdVerified(false);
        try {
            // Run API call and minimum 1.5s delay in parallel so animation is always visible
            const [res] = await Promise.all([
                fetch(`${API_BASE}/api/check-duplicate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ field: 'student_id', value: trimmed }),
                }),
                new Promise(r => setTimeout(r, 1500)),
            ]);
            const result = await res.json();
            if (result.exists) {
                setIdDuplicateError(`Student ID "${trimmed}" is already registered. If this is your ID, please go back and log in instead.`);
                setIdVerified(false);
            } else {
                setIdVerified(true);
            }
        } catch (err) {
            console.warn('Duplicate check failed:', err);
            setIdVerified(true);
        } finally {
            setIdChecking(false);
        }
    };

    // ─── Validation ──────────────────────────────────────────────
    const validate = useCallback((values) => {
        const e = {};
        if (!values.fullName.trim()) e.fullName = 'Full Name is required';
        if (!values.studentId.trim()) {
            e.studentId = 'Student ID is required';
        } else if (!/^\d{2,4}-[A-Za-z0-9]{3,6}$/.test(values.studentId.trim())) {
            e.studentId = 'Format: 20XX-XXXX (e.g. 2024-B723)';
        }
        if (!values.program) e.program = 'Program is required';
        if (!values.address.trim()) e.address = 'Address is required';
        if (!values.gender) e.gender = 'Gender is required';
        return e;
    }, []);

    useEffect(() => {
        const errs = validate(data);
        setErrors(errs);
        const allFilled = data.frontID && data.backID && Object.keys(errs).length === 0;
        // Block proceeding if: duplicate found, check in progress, or ID not yet verified
        const idOk = idVerified && !idDuplicateError && !idChecking;
        onValidChange(allFilled && idOk);
    }, [data, validate, onValidChange, idVerified, idDuplicateError, idChecking]);

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    const getFieldStatus = (field) => {
        if (!touched[field]) return '';
        return errors[field] ? 'error' : 'valid';
    };

    // ─── File Upload Handlers ────────────────────────────────────
    const handleFile = (file, side) => {
        if (!file) return;
        if (!ACCEPTED_TYPES.includes(file.type)) {
            alert('Please upload PNG, JPG, or JPEG files only.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            onChange({ [side]: { name: file.name, url: e.target.result } });
            // If both IDs uploaded, trigger OCR
            const otherExists = side === 'frontID' ? data.backID : data.frontID;
            if (otherExists && data.ocrStatus !== 'success') {
                // Use the front ID image URL for OCR (pass the newly read one if it's the front)
                const frontUrl = side === 'frontID' ? e.target.result : data.frontID?.url;
                const backUrl = side === 'backID' ? e.target.result : data.backID?.url;
                triggerOCR(frontUrl, backUrl);
            }
        };
        reader.readAsDataURL(file);
    };

    // ─── Real OCR with Tesseract.js ──────────────────────────────
    const triggerOCR = async (frontUrl, backUrl) => {
        onChange({ ocrStatus: 'loading' });
        setOcrProgress(0);
        setRawOcrText('');

        try {
            // Recognize text from the front ID (primary info source)
            const frontResult = await Tesseract.recognize(frontUrl, 'eng', {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        setOcrProgress(Math.round(m.progress * 70)); // 0-70% for front
                    }
                },
            });

            let frontText = frontResult.data.text || '';

            // Also scan the back ID for additional info
            let backText = '';
            if (backUrl) {
                const backResult = await Tesseract.recognize(backUrl, 'eng', {
                    logger: (m) => {
                        if (m.status === 'recognizing text') {
                            setOcrProgress(70 + Math.round(m.progress * 30)); // 70-100% for back
                        }
                    },
                });
                backText = backResult.data.text || '';
            }

            setOcrProgress(100);

            setRawOcrText(frontText + '\n---BACK---\n' + backText);

            // Parse front and back for school verification + field extraction
            const parsed = parseOCRText(frontText, backText);
            if (!parsed) {
                onChange({ ocrStatus: 'fail' });
                return;
            }
            const hasAnyData = Object.values(parsed).some(v => v.trim().length > 0);

            if (hasAnyData) {
                onChange({
                    ocrStatus: 'success',
                    ...parsed,
                });
                // Mark filled fields as touched so green borders show
                const touchFields = {};
                Object.entries(parsed).forEach(([key, val]) => {
                    if (val.trim()) touchFields[key] = true;
                });
                setTouched(touchFields);
            } else {
                onChange({ ocrStatus: 'fail' });
            }
        } catch (err) {
            console.error('OCR Error:', err);
            onChange({ ocrStatus: 'fail' });
        }
    };

    const handleDrop = (e, side) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files[0];
        handleFile(file, side);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const removeFile = (side) => {
        onChange({ [side]: null, ocrStatus: null });
        setRawOcrText('');
        setOcrProgress(0);
    };

    // ─── Upload Zone Component ──────────────────────────────────
    const UploadZone = ({ side, label, fileData, inputRef }) => (
        <div className="upload-zone-wrapper">
            <label className="form-label" style={{ marginBottom: 8 }}>
                {label} <span style={{ color: '#ef4444' }}>*</span>
            </label>
            {fileData ? (
                <div className="upload-preview">
                    <div className="upload-preview-img-wrap">
                        <img src={fileData.url} alt={label} />
                        <button
                            className="upload-preview-eye"
                            onClick={() => setPreviewModal(fileData)}
                            title="View full image"
                        >
                            <Eye size={16} />
                        </button>
                    </div>
                    <div className="upload-preview-info">
                        <span className="upload-preview-name">{fileData.name}</span>
                        <button className="upload-preview-remove" onClick={() => removeFile(side)}>
                            <X size={14} /> Remove
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    className="upload-zone"
                    onClick={() => inputRef.current?.click()}
                    onDrop={(e) => handleDrop(e, side)}
                    onDragOver={handleDragOver}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".png,.jpg,.jpeg"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFile(e.target.files[0], side)}
                    />
                    <div className="upload-zone-icon">
                        <Upload size={24} />
                    </div>
                    <p className="upload-zone-text">
                        <span style={{ color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}>Click to upload</span>
                        {' '}or drag and drop
                    </p>
                    <p className="upload-zone-hint">PNG, JPG, JPEG only</p>
                </div>
            )}
        </div>
    );

    // ─── OCR Banner ──────────────────────────────────────────────
    const OCRBanner = () => {
        if (data.ocrStatus === 'loading') {
            return (
                <div className="ocr-banner ocr-loading">
                    <div className="ocr-spinner" />
                    <div style={{ flex: 1 }}>
                        <strong>Analyzing ID with OCR...</strong>
                        <p>Extracting student information — {ocrProgress}% complete</p>
                        <div className="progress-bar-wrap" style={{ marginTop: 8, height: 6 }}>
                            <div
                                className="progress-bar-fill progress-high"
                                style={{ width: `${ocrProgress}%`, background: 'linear-gradient(90deg, #2563eb, #3b82f6)' }}
                            />
                        </div>
                    </div>
                </div>
            );
        }
        if (data.ocrStatus === 'success') {
            return (
                <div className="ocr-banner ocr-success">
                    <CheckCircle size={20} />
                    <div>
                        <strong>ID Successfully Detected</strong>
                        <p>Fields have been auto-filled from your ID. Please review and edit if needed.</p>
                    </div>
                </div>
            );
        }
        if (data.ocrStatus === 'fail') {
            return (
                <div className="ocr-banner ocr-fail">
                    <AlertTriangle size={20} />
                    <div>
                        <strong>No ID Detected</strong>
                        <p>Please enter details manually.</p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                Step 1 — School ID Upload
            </h3>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
                Upload both sides of your School ID. We'll try to auto-detect your information.
            </p>

            {/* Upload Areas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <UploadZone side="frontID" label="Front of School ID" fileData={data.frontID} inputRef={frontRef} />
                <UploadZone side="backID" label="Back of School ID" fileData={data.backID} inputRef={backRef} />
            </div>

            {/* OCR Status */}
            <OCRBanner />

            {/* Auto-fill Form */}
            {(data.ocrStatus === 'success' || data.ocrStatus === 'fail') && (
                <div className="reg-form-section" style={{ animation: 'fadeSlideIn 0.35s ease' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Student Information
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        {/* Full Name */}
                        <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
                            <label className="form-label">Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                            <input
                                className={`form-input ${getFieldStatus('fullName')}`}
                                value={data.fullName}
                                onChange={(e) => onChange({ fullName: e.target.value })}
                                onBlur={() => handleBlur('fullName')}
                                placeholder="e.g. Juan Dela Cruz"
                            />
                            {touched.fullName && errors.fullName && <div className="form-error">{errors.fullName}</div>}
                        </div>

                        {/* Student ID */}
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Student ID Number <span style={{ color: '#ef4444' }}>*</span></label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    className={`form-input ${idDuplicateError ? 'error' : getFieldStatus('studentId')}`}
                                    value={data.studentId}
                                    onChange={(e) => { onChange({ studentId: e.target.value }); setIdDuplicateError(''); setIdVerified(false); lastCheckedId.current = ''; }}
                                    onBlur={() => handleBlur('studentId')}
                                    placeholder="e.g. 2024-00123"
                                />
                                {idChecking && (
                                    <Loader size={14} style={{
                                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                        color: '#94a3b8', animation: 'ocr-spin 0.8s linear infinite',
                                    }} />
                                )}
                            </div>
                            {touched.studentId && errors.studentId && <div className="form-error">{errors.studentId}</div>}

                            {/* Checking — OCR-style loading banner */}
                            {idChecking && (
                                <div className="ocr-banner ocr-loading" style={{ marginTop: 8, marginBottom: 0 }}>
                                    <div className="ocr-spinner" />
                                    <div style={{ flex: 1 }}>
                                        <strong>Verifying Student ID...</strong>
                                        <p>Checking if this ID is already registered</p>
                                        <div className="progress-bar-wrap" style={{ marginTop: 8, height: 6 }}>
                                            <div
                                                className="progress-bar-fill progress-high"
                                                style={{
                                                    width: '80%',
                                                    background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
                                                    animation: 'idCheckPulse 1.5s ease-in-out infinite',
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Verified — OCR-style success banner */}
                            {!idChecking && idVerified && !idDuplicateError && data.studentId?.trim() && (
                                <div className="ocr-banner ocr-success" style={{ marginTop: 8, marginBottom: 0 }}>
                                    <CheckCircle size={20} />
                                    <div>
                                        <strong>Student ID is Available</strong>
                                        <p>This ID number has not been registered yet.</p>
                                    </div>
                                </div>
                            )}

                            {/* Duplicate — OCR-style error banner */}
                            {idDuplicateError && (
                                <div className="ocr-banner" style={{
                                    marginTop: 8, marginBottom: 0,
                                    background: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5',
                                }}>
                                    <AlertTriangle size={20} />
                                    <div>
                                        <strong>Student ID Already Registered</strong>
                                        <p>{idDuplicateError}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Program */}
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Program Taken <span style={{ color: '#ef4444' }}>*</span></label>
                            <select
                                className={`form-select ${getFieldStatus('program')}`}
                                value={data.program}
                                onChange={(e) => onChange({ program: e.target.value })}
                                onBlur={() => handleBlur('program')}
                            >
                                <option value="">Select Program</option>
                                {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            {touched.program && errors.program && <div className="form-error">{errors.program}</div>}
                        </div>

                        {/* Address */}
                        <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
                            <label className="form-label">Address <span style={{ color: '#ef4444' }}>*</span></label>
                            <input
                                className={`form-input ${getFieldStatus('address')}`}
                                value={data.address}
                                onChange={(e) => onChange({ address: e.target.value })}
                                onBlur={() => handleBlur('address')}
                                placeholder="e.g. Caloocan City, Metro Manila"
                            />
                            {touched.address && errors.address && <div className="form-error">{errors.address}</div>}
                        </div>

                        {/* Gender */}
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Sex / Gender <span style={{ color: '#ef4444' }}>*</span></label>
                            <select
                                className={`form-select ${getFieldStatus('gender')}`}
                                value={data.gender}
                                onChange={(e) => onChange({ gender: e.target.value })}
                                onBlur={() => handleBlur('gender')}
                            >
                                <option value="">Select Gender</option>
                                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                            {touched.gender && errors.gender && <div className="form-error">{errors.gender}</div>}
                        </div>
                    </div>
                </div>
            )}

            {/* Image Preview Modal */}
            {previewModal && (
                <div className="modal-overlay" onClick={() => setPreviewModal(null)}>
                    <div className="modal" style={{ maxWidth: 600, padding: 16 }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{previewModal.name}</span>
                            <button className="btn btn-outline btn-icon" onClick={() => setPreviewModal(null)}><X size={16} /></button>
                        </div>
                        <img src={previewModal.url} alt="Preview" style={{ width: '100%', borderRadius: 8, maxHeight: '70vh', objectFit: 'contain' }} />
                    </div>
                </div>
            )}
        </div>
    );
}
