import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    Upload, X, CheckCircle, AlertTriangle, Image, Loader, Eye
} from 'lucide-react';
import Tesseract from 'tesseract.js';
import { supabase } from '../../lib/supabase';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

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
function parseOCRText(frontText, backText, programs) {
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
    const progNames = programs.map(p => typeof p === 'string' ? p : p.name);
    const hasFrontProgram = progNames.some(prog => {
        const keywords = prog.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        return keywords.some(kw => lowerFront.includes(kw));
    });

    // Back ID checks:
    //  - Must have "School Administrator" (unique to PSTDI back layout)
    const hasBackAdmin = lowerBack.includes('school administrator') || lowerBack.includes('administrator');

    // Relaxed verification: only the Student ID pattern is required.
    // Other factors are optional — users can edit extracted info manually.
    // The Student ID is critical because it's used for duplicate account prevention.
    const hasProgramsLoaded = programs.length > 0;
    const confidenceFactors = [hasFrontIDLabel, hasFrontStudentId, hasFrontProgram && hasProgramsLoaded, hasBackAdmin].filter(Boolean).length;

    // Debug: log each factor to help diagnose detection failures
    console.log('─── OCR PSTDI Verification ───');
    console.log('Programs loaded:', hasProgramsLoaded, `(${programs.length} programs)`);
    console.log('Factor 1 - ID Label ("ID No"):', hasFrontIDLabel);
    console.log('Factor 2 - Student ID (20XX-XXXX):', hasFrontStudentId);
    console.log('Factor 3 - Program keyword:', hasFrontProgram);
    console.log('Factor 4 - Back "administrator":', hasBackAdmin);
    console.log('Confidence:', confidenceFactors, '/ 4');
    console.log('Front text (first 300 chars):', frontText.substring(0, 300));
    console.log('Back text (first 300 chars):', backText.substring(0, 300));

    // Must have at least the Student ID pattern; reject only if nothing useful was found
    if (!hasFrontStudentId) {
        return null; // Can't find a student ID — not a valid school ID
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

    // 3. Program — fuzzy match against known programs
    // programs can be array of strings (from programsRef) or objects
    const lowerText = fullText.toLowerCase();
    for (const prog of progNames) {
        const ncPart = prog.match(/NC\s+[IV]+/i);
        const namePart = prog.replace(/NC\s+[IV]+/i, '').replace(/\s*\(.*\)$/, '').trim().toLowerCase();
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
    const [PROGRAMS, setPROGRAMS] = useState([]);
    const programsRef = useRef([]);

    const lastCheckedId = useRef('');
    const debounceTimer = useRef(null);
    const frontRef = useRef(null);
    const backRef = useRef(null);
    // Track uploaded file URLs via ref to avoid stale closure in handleFile
    const uploadedFiles = useRef({ frontID: null, backID: null });

    // Auto-detect API base


    // ─── Fetch programs from Supabase on mount ──────────────────
    useEffect(() => {
        const fetchPrograms = async () => {
            try {
                const { data: rows, error } = await supabase
                    .from('programs')
                    .select('id, name, duration_hours')
                    .eq('is_active', true)
                    .order('sort_order')
                    .order('name');
                if (!error && rows) {
                    // Build display labels — append hours when multiple programs share a base name
                    const baseNames = rows.map(r => r.name.replace(/\s*\(.*\)$/, ''));
                    const dupes = baseNames.filter((n, i) => baseNames.indexOf(n) !== i);
                    const programList = rows.map(r => ({
                        id: r.id,
                        name: r.name,
                        label: dupes.includes(r.name.replace(/\s*\(.*\)$/, '')) && r.duration_hours
                            ? `${r.name} (${r.duration_hours} Hours)`
                            : r.name,
                    }));
                    setPROGRAMS(programList);
                    programsRef.current = programList.map(p => p.name);
                }
            } catch (err) {
                console.error('Failed to load programs:', err);
            }
        };
        fetchPrograms();
    }, []);

    // ─── Auto-trigger duplicate check when studentId changes (from OCR) ───
    useEffect(() => {
        // Only run the duplicate check after OCR has successfully completed
        if (data.ocrStatus !== 'success') return;

        const trimmed = data.studentId?.trim();
        // Only auto-check when format is valid
        if (!trimmed || !/^\d{2,4}-[A-Za-z0-9]{3,6}$/.test(trimmed)) return;

        // Reset state for new check
        setIdDuplicateError('');
        setIdVerified(false);
        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            checkStudentIdDuplicate(trimmed);
        }, 500);
        return () => clearTimeout(debounceTimer.current);
    }, [data.studentId, data.ocrStatus]);

    // ─── Check student ID duplicate ──────────────────────────────
    const checkStudentIdDuplicate = async (studentId) => {
        const trimmed = studentId?.trim();
        if (!trimmed || !/^\d{2,4}-[A-Za-z0-9]{3,6}$/.test(trimmed)) return;

        lastCheckedId.current = trimmed;
        setIdChecking(true);
        setIdDuplicateError('');
        setIdVerified(false);
        try {
            // Check via backend endpoint to avoid permissions issues
            const [res] = await Promise.all([
                fetch(`/api/check-duplicate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ field: 'student_id', value: trimmed })
                }),
                new Promise(r => setTimeout(r, 1500)),
            ]);
            const json = await res.json();

            if (json.exists) {
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
        if (!values.trainingStatus) e.trainingStatus = 'Training Status is required';
        if (values.trainingStatus === 'Graduated' && !values.graduationYear) {
            e.graduationYear = 'Graduation Year is required';
        }
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
            const url = e.target.result;
            onChange({ [side]: { name: file.name, url } });
            // Store in ref so we always have the latest URL (avoids stale closure)
            uploadedFiles.current[side] = url;

            const frontUrl = uploadedFiles.current.frontID;
            const backUrl = uploadedFiles.current.backID;

            console.log('handleFile:', side, '| frontUrl:', !!frontUrl, '| backUrl:', !!backUrl);

            // If both IDs uploaded, trigger OCR
            if (frontUrl && backUrl && data.ocrStatus !== 'success') {
                triggerOCR(frontUrl, backUrl);
            }
        };
        reader.readAsDataURL(file);
    };

    // ─── Real OCR with Tesseract.js ──────────────────────────────
    const triggerOCR = async (frontUrl, backUrl) => {
        console.log('triggerOCR called — starting Tesseract recognition...');
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
            const parsed = parseOCRText(frontText, backText, programsRef.current);
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
        uploadedFiles.current[side] = null;
        setRawOcrText('');
        setOcrProgress(0);
        // Reset duplicate check state so re-upload triggers a fresh check
        lastCheckedId.current = '';
        setIdDuplicateError('');
        setIdVerified(false);
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
                <div className="ocr-banner ocr-fail" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <AlertTriangle size={20} />
                        <strong>No Valid School ID Detected</strong>
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                        <p style={{ margin: '0 0 8px 0' }}>We couldn't detect a valid <strong>PSTDI / TESDA School ID</strong> from the uploaded images.</p>
                        <p style={{ margin: '0 0 8px 0' }}>Please make sure:</p>
                        <ul style={{ margin: '0 0 8px 0', paddingLeft: 20 }}>
                            <li>You are uploading your <strong>TESDA School ID</strong> (front and back)</li>
                            <li>The photo is <strong>clear, well-lit, and not blurry</strong></li>
                            <li>The ID is <strong>not cropped</strong> — all text and edges should be visible</li>
                            <li>File format is <strong>PNG, JPG, or JPEG</strong></li>
                        </ul>
                        <p style={{ margin: 0, color: '#64748b' }}>Remove the uploaded images above and try again with a clearer photo.</p>
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
            <div className="reg-upload-grid">
                <UploadZone side="frontID" label="Front of School ID" fileData={data.frontID} inputRef={frontRef} />
                <UploadZone side="backID" label="Back of School ID" fileData={data.backID} inputRef={backRef} />
            </div>

            {/* OCR Status */}
            <OCRBanner />

            {/* Auto-fill Form — only shown when ID is successfully detected */}
            {data.ocrStatus === 'success' && (
                <div className="reg-form-section" style={{ animation: 'fadeSlideIn 0.35s ease' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Student Information
                    </div>

                    <div className="reg-form-grid">
                        {/* Full Name */}
                        <div className="form-group reg-full-width" style={{ marginBottom: 0 }}>
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
                                    readOnly
                                    tabIndex={-1}
                                    style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#475569' }}
                                    title="This field is auto-filled from your School ID and cannot be edited"
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
                                <option value="">— Select Program —</option>
                                {PROGRAMS.map((prog) => (
                                    <option key={prog.id || prog.name} value={prog.name}>{prog.label || prog.name}</option>
                                ))}
                            </select>
                            {touched.program && errors.program && <div className="form-error">{errors.program}</div>}
                        </div>

                        {/* Address */}
                        <div className="form-group reg-full-width" style={{ marginBottom: 0 }}>
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

                        {/* Training Status */}
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Training Status <span style={{ color: '#ef4444' }}>*</span></label>
                            <select
                                className={`form-select ${getFieldStatus('trainingStatus')}`}
                                value={data.trainingStatus || ''}
                                onChange={(e) => {
                                    onChange({ trainingStatus: e.target.value });
                                    if (e.target.value === 'Student') {
                                        onChange({ graduationYear: '' }); // Clear it if they switch back to student
                                    }
                                }}
                                onBlur={() => handleBlur('trainingStatus')}
                            >
                                <option value="">Select Status</option>
                                <option value="Student">Current Student</option>
                                <option value="Graduated">Graduated</option>
                            </select>
                            {touched.trainingStatus && errors.trainingStatus && <div className="form-error">{errors.trainingStatus}</div>}
                        </div>

                        {/* Graduation Year (Only if Graduated) */}
                        {data.trainingStatus === 'Graduated' && (
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Graduation Year <span style={{ color: '#ef4444' }}>*</span></label>
                                <input
                                    type="number"
                                    min="1990"
                                    max="2030"
                                    className={`form-input ${getFieldStatus('graduationYear')}`}
                                    value={data.graduationYear || ''}
                                    onChange={(e) => onChange({ graduationYear: e.target.value })}
                                    onBlur={() => handleBlur('graduationYear')}
                                    placeholder="e.g. 2024"
                                />
                                {touched.graduationYear && errors.graduationYear && <div className="form-error">{errors.graduationYear}</div>}
                            </div>
                        )}
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
