import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    User, Briefcase, FileText, CheckCircle, MapPin, Clock, Building2,
    Award, Send, X, Eye, EyeOff, Plus, Trash2, Camera, Loader, 
    GraduationCap, ExternalLink, ShieldCheck, Mail, Calendar, 
    Users, ChevronRight, Edit, Upload, Star, Heart, Info, 
    CheckCircle2, UserPlus, Navigation, FileCheck, Bookmark, AlertTriangle, Target
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import SavedItemsView from './SavedItemsView';
import PhilAddressSelector from '../common/PhilAddressSelector';
import ProfileActivityTab from './ProfileActivityTab';
import EmptyState, {
    TrophyIllustration,
    BriefcaseIllustration,
    DocumentIllustration,
    StarIllustration,
    FolderIllustration
} from '../EmptyState';
import toast from 'react-hot-toast';
import { 
    isVerified,
    resolvePartnerVisibility,
    StatusBadge,
    timeAgo
} from './FeedComponents';

// ─── ERROR BOUNDARY ──────────────────────────────────────────────
export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }
    componentDidCatch(error, errorInfo) {
        console.error("Profile Error:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 40, textAlign: 'center', background: '#fff', borderRadius: 12, border: '1px solid #fee2e2' }}>
                    <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Profile Error</h3>
                    <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>Something went wrong while loading this profile.</p>
                    <button className="ln-btn ln-btn-primary" onClick={() => window.location.reload()}>Reload Page</button>
                </div>
            );
        }
        return this.props.children;
    }
}

// ─── HELPERS ─────────────────────────────────────────────────────
export const normalizeProfileType = (profileType = '') => {
    const normalized = String(profileType || '').toLowerCase();
    if (normalized === 'student' || normalized === 'trainee') return 'trainee';
    if (normalized === 'industry_partner' || normalized === 'partner') return 'partner';
    return '';
};

export const DEFAULT_TRAINEE_PUBLIC_INFO_FIELDS = ['name', 'birthday', 'gender', 'program'];

export const resolveTraineeVisibility = (profile) => {
    const value = profile?.personalInfoVisibility ?? profile?.personal_info_visibility;
    return Array.isArray(value) ? value : DEFAULT_TRAINEE_PUBLIC_INFO_FIELDS;
};

export const normalizeTraineeProfile = (profile) => {
    if (!profile) return null;

    const address = profile.address
        || [profile.detailed_address, profile.barangay, profile.city, profile.province, profile.region].filter(Boolean).join(', ')
        || '';

    const rawEmploymentStatus = String(profile.employmentStatus || profile.employment_status || '').toLowerCase();
    const employmentStatus = profile.employmentStatus
        || (rawEmploymentStatus === 'employed' || rawEmploymentStatus === 'hired'
            ? 'Employed'
            : rawEmploymentStatus === 'seeking_employment' || rawEmploymentStatus === 'open_to_work' || rawEmploymentStatus === 'not_employed' || rawEmploymentStatus === 'unemployed'
                ? 'Seeking Employment'
                : rawEmploymentStatus === 'certified'
                    ? 'Certified'
                    : rawEmploymentStatus === 'seeking_ojt'
                        ? 'Seeking OJT'
                        : rawEmploymentStatus === 'ojt_in_progress'
                            ? 'OJT In Progress'
                            : 'Seeking Employment');

    return {
        ...profile,
        name: profile.name || profile.full_name || profile.profile_name || 'Trainee',
        program: profile.program || profile.program_name || profile.programs?.name || '',
        ncLevel: profile.ncLevel || profile.nc_level || profile.programs?.nc_level || '',
        email: profile.email || profile.contact_email || '',
        address,
        birthday: profile.birthday || profile.birthdate || '',
        graduationYear: profile.graduationYear || profile.graduation_year || '',
        trainingStatus: profile.trainingStatus || profile.training_status || 'Student',
        trainings: Array.isArray(profile.trainings) ? profile.trainings : [],
        savedOpportunities: Array.isArray(profile.savedOpportunities) ? profile.savedOpportunities : [],
        certifications: Array.isArray(profile.certifications) ? profile.certifications : [],
        educHistory: Array.isArray(profile.educHistory) ? profile.educHistory : (Array.isArray(profile.educ_history) ? profile.educ_history : []),
        workExperience: Array.isArray(profile.workExperience) ? profile.workExperience : (Array.isArray(profile.work_experience) ? profile.work_experience : []),
        skills: Array.isArray(profile.skills) ? profile.skills : [],
        interests: Array.isArray(profile.interests) ? profile.interests : [],
        employmentStatus,
        employer: profile.employer || profile.employment_work || '',
        jobTitle: profile.jobTitle || profile.job_title || '',
        dateHired: profile.dateHired || profile.employment_start || '',
        photo: profile.photo || profile.profile_picture_url || null,
        bannerUrl: profile.bannerUrl || profile.banner_url || null,
        gender: (function () {
            const g = String(profile.gender || '').toLowerCase();
            if (g.startsWith('m')) return 'Male';
            if (g.startsWith('f')) return 'Female';
            if (g.trim()) return 'Other';
            return '';
        })(),
        personalInfoVisibility: resolveTraineeVisibility(profile),
    };
};

export const normalizePartnerProfile = (profile) => {
  if (!profile) return null;

  const address = profile.address
    || [profile.detailed_address, profile.city, profile.province, profile.region].filter(Boolean).join(', ')
    || '';

  const rawVerification = String(profile.verificationStatus || profile.verification_status || '').toLowerCase();
  const verificationStatus = profile.verificationStatus
    || (rawVerification === 'verified'
      ? 'Verified'
      : rawVerification === 'rejected'
        ? 'Rejected'
        : rawVerification === 'under_review'
          ? 'Under Review'
          : rawVerification === 'pending'
            ? 'Pending'
            : 'Pending');

  return {
    ...profile,
    companyName: profile.companyName || profile.company_name || profile.profileName || 'Industry Partner',
    contactPerson: profile.contactPerson || profile.contact_person || '',
    email: profile.email || profile.contact_email || '',
    address,
    website: profile.website || '',
    industry: profile.industry || profile.business_type || 'General',
    achievements: Array.isArray(profile.achievements) ? profile.achievements : [],
    benefits: Array.isArray(profile.benefits) ? profile.benefits : [],
    mission: profile.mission || '',
    vision: profile.vision || '',
    culture_tags: Array.isArray(profile.culture_tags) ? profile.culture_tags : [],
    perks_tags: Array.isArray(profile.perks_tags) ? profile.perks_tags : [],
    poc_name: profile.poc_name || '',
    poc_title: profile.poc_title || '',
    poc_photo_url: profile.poc_photo_url || '',
    office_location_url: profile.office_location_url || '',
    banner_url: profile.banner_url || ''
  };
};

export const PREDEFINED_CULTURE_TAGS = [
  'Hands-on Training', 'Mentorship-Focused', 'Fast-Paced',
  'Team-Oriented', 'Independent Work', 'Output-Based'
];

export const PREDEFINED_PERKS_TAGS = [
  'Allowance Provided', 'Free Meals / Staff Meal', 'Uniform Subsidized',
  'Flexible Hours', 'Remote / WFH Option', 'Shift-Based'
];

// ─── COMPONENTS ──────────────────────────────────────────────────

export const TraineeProfileContent = ({ viewedProfileId = null, onBack = null, openBulletinModal }) => {
    const { 
        currentUser, userRole, trainees, updateTrainee, 
        getSkillInterestRecommendations, programs, getSkillsDemand, 
        applyToJob, uploadOptimizedImage,
        pqfLevels, pqfPrograms
    } = useApp();
    const isOwnProfile = !viewedProfileId || String(viewedProfileId) === String(currentUser?.id);
    const isEmployer = userRole === 'partner';
    const [viewedTrainee, setViewedTrainee] = useState(null);
    const [loadingViewedProfile, setLoadingViewedProfile] = useState(false);
    const trainee = isOwnProfile
        ? (currentUser || trainees[0])
        : (viewedTrainee || trainees.find(t => String(t.id) === String(viewedProfileId)));

    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('About'); // About | Experience | Activity | Recommended | Saved
    const [form, setForm] = useState({
        name: '', program: '', ncLevel: '', email: '', birthday: '', address: '', graduationYear: '', trainingStatus: '',
        trainings: [], certifications: [], educHistory: [], workExperience: [], skills: [], interests: [],
        employmentStatus: '', employer: '', jobTitle: '', dateHired: '', gender: '',
        socialLinks: [],
        region: '', regionCode: '', province: '', provinceCode: '', city: '', cityCode: '', barangay: '', barangayCode: '', detailedAddress: ''
    });
    const [personalInfoVisibility, setPersonalInfoVisibility] = useState([]);

    const [newTraining, setNewTraining] = useState({ title: '', provider: '', year: '' });
    const [newCert, setNewCert] = useState({ title: '', provider: '', year: '', proof_url: '' });
    const [newSkill, setNewSkill] = useState('');
    const [newInterest, setNewInterest] = useState('');

    // Certificate upload state
    const [uploadingCert, setUploadingCert] = useState(false);
    const certFileInputRef = useRef(null);

    // Profile photo & banner upload
    const photoInputRef = useRef(null);
    const bannerInputRef = useRef(null);

    // Delete confirmation dialog
    const [confirmDialog, setConfirmDialog] = useState({ open: false, message: '', onConfirm: null });
    const showConfirm = (message, onConfirm) => setConfirmDialog({ open: true, message, onConfirm });
    const closeConfirm = () => setConfirmDialog({ open: false, message: '', onConfirm: null });

    // Certificate Preview
    const [previewImage, setPreviewImage] = useState(null);

    // Application Modal for Saved tab
    const [applyJob, setApplyJob] = useState(null);
    const [applicationMessage, setApplicationMessage] = useState('');
    const [resumeInfo, setResumeInfo] = useState(null);
    const [submittingApplication, setSubmittingApplication] = useState(false);

    const isEmailValid = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

    // ─── Validation Helpers ─────────────────────────────────
    const isValidUrl = (value) => {
        if (!value) return true;
        try { new URL(value); return /^https?:\/\//i.test(value); } catch { return false; }
    };
    
    // URL real-time validation state
    const [urlValidation, setUrlValidation] = useState({ work: null, social: null });
    const checkWebsiteReachability = async (url, section) => {
        if (!url?.trim()) {
            setUrlValidation(prev => ({ ...prev, [section]: null }));
            return;
        }
        if (!isValidUrl(url)) {
            setUrlValidation(prev => ({ ...prev, [section]: 'invalid' }));
            return;
        }
        setUrlValidation(prev => ({ ...prev, [section]: 'checking' }));
        try {
            const res = await fetch('http://localhost:3001/api/check-website', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url.trim() })
            });
            const data = await res.json();
            setUrlValidation(prev => ({ ...prev, [section]: data.exists ? 'valid' : 'unreachable' }));
        } catch {
            setUrlValidation(prev => ({ ...prev, [section]: 'error' }));
        }
    };

    const urlCheckTimeoutRef = useRef({ work: null, social: null });
    const handleUrlChange = (value, section, updateStateCallback) => {
        updateStateCallback(value);
        setUrlValidation(prev => ({ ...prev, [section]: value.trim() ? 'checking' : null }));
        
        if (urlCheckTimeoutRef.current[section]) {
            clearTimeout(urlCheckTimeoutRef.current[section]);
        }
        urlCheckTimeoutRef.current[section] = setTimeout(() => {
            checkWebsiteReachability(value, section);
        }, 1500);
    };

    const getAgeFromBirthday = (bd) => {
        if (!bd) return null;
        const today = new Date();
        const birth = new Date(bd);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    };

    // ─── New entry state for educ/work/social ────────────────
    const [newEduc, setNewEduc] = useState({ level: '', school: '', program: '', yearFrom: '', yearTo: '' });
    const [newWork, setNewWork] = useState({ company: '', role: '', yearFrom: '', yearTo: '', description: '', website: '' });
    const [newSocialLink, setNewSocialLink] = useState({ platform: '', url: '' });

    // Education level labels for dropdown
    const EDUCATION_LEVEL_LABELS = [
        'Elementary',
        'Junior High School',
        'Senior High School',
        'Vocational / TESDA',
        'Diploma / Associate',
        'College / Bachelor\'s',
        'Master\'s / Post-Graduate',
        'Doctoral / Post-Doctoral'
    ];

    // Map education label to PQF levels for program filtering
    const EDUC_LABEL_TO_PQF = {
        'Elementary': [],
        'Junior High School': [1],
        'Senior High School': [2],
        'Vocational / TESDA': [1, 2, 3, 4],
        'Diploma / Associate': [5],
        'College / Bachelor\'s': [6],
        'Master\'s / Post-Graduate': [7],
        'Doctoral / Post-Doctoral': [8]
    };

    // Check if selected education level should show program dropdown
    const educLevelShowsProgram = (level) => {
        return ['Senior High School', 'Vocational / TESDA', 'Diploma / Associate', "College / Bachelor's", "Master's / Post-Graduate", "Doctoral / Post-Doctoral"].includes(level);
    };

    // Get filtered PQF programs for an education level
    const getPqfProgramsForEducLevel = (level) => {
        const pqfNums = EDUC_LABEL_TO_PQF[level] || [];
        if (pqfNums.length === 0) return [];
        const levelIds = pqfLevels.filter(l => pqfNums.includes(l.pqf_level)).map(l => l.id);
        return pqfPrograms.filter(p => levelIds.includes(p.pqf_level_id));
    };

    useEffect(() => {
        if (isOwnProfile || !viewedProfileId) {
            setViewedTrainee(null);
            setLoadingViewedProfile(false);
            return;
        }

        let isMounted = true;
        const fetchViewedTrainee = async () => {
            setLoadingViewedProfile(true);
            try {
                const { data, error } = await supabase
                    .from('trainees')
                    .select('*, programs(*)')
                    .eq('id', viewedProfileId)
                    .single();

                if (error || !data) {
                    const response = await fetch(`/api/public-profile/trainee/${viewedProfileId}`);
                    if (!response.ok) throw error || new Error('Failed to load viewed profile');
                    const payload = await response.json();
                    if (isMounted) setViewedTrainee(normalizeTraineeProfile(payload?.profile || null));
                } else if (isMounted) {
                    setViewedTrainee(normalizeTraineeProfile(data || null));
                }
            } catch (err) {
                console.error('Fetch viewed profile error:', err);
                if (isMounted) setViewedTrainee(null);
            } finally {
                if (isMounted) setLoadingViewedProfile(false);
            }
        };

        fetchViewedTrainee();
        return () => { isMounted = false; };
    }, [isOwnProfile, viewedProfileId]);

    // Fetch resume for application form
    useEffect(() => {
        if (applyJob && trainee?.id) {
            fetch(`/api/documents/${trainee.id}`)
                .then(r => r.json())
                .then(data => {
                    const resume = data.documents?.find(d => d.label.toLowerCase().includes('resume'));
                    setResumeInfo(resume || null);
                })
                .catch(err => console.error('Error fetching resume:', err));
        }
    }, [applyJob, trainee?.id]);

    useEffect(() => {
        if (trainee) {
            setForm({
                name: trainee.name || '',
                program: trainee.program || '',
                ncLevel: trainee.ncLevel || '',
                email: trainee.email || '',
                birthday: trainee.birthday || '',
                address: trainee.address || '',
                graduationYear: trainee.graduationYear || '',
                trainingStatus: trainee.trainingStatus || '',
                trainings: Array.isArray(trainee.trainings) ? trainee.trainings : [],
                certifications: Array.isArray(trainee.certifications) ? trainee.certifications : [],
                educHistory: Array.isArray(trainee.educHistory) ? trainee.educHistory : [],
                workExperience: Array.isArray(trainee.workExperience) ? trainee.workExperience : [],
                skills: Array.isArray(trainee.skills) ? trainee.skills : [],
                interests: Array.isArray(trainee.interests) ? trainee.interests : [],
                employmentStatus: trainee.employmentStatus || '',
                employer: trainee.employer || '',
                jobTitle: trainee.jobTitle || '',
                dateHired: trainee.dateHired || '',
                gender: trainee.gender || '',
                socialLinks: Array.isArray(trainee.socialLinks || trainee.social_links) ? (trainee.socialLinks || trainee.social_links) : [],
                region: trainee.region || '', regionCode: trainee.regionCode || trainee.region_code || '',
                province: trainee.province || '', provinceCode: trainee.provinceCode || trainee.province_code || '',
                city: trainee.city || '', cityCode: trainee.cityCode || trainee.city_code || '',
                barangay: trainee.barangay || '', barangayCode: trainee.barangayCode || trainee.barangay_code || '',
                detailedAddress: trainee.detailedAddress || trainee.detailed_address || ''
            });
            setPersonalInfoVisibility(resolveTraineeVisibility(trainee));
            setEditing(false);
        }
    }, [trainee]);

    const save = async () => {
        if (!isOwnProfile) return;
        // ─── Validation ────────────────────────────────────────
        if (form.name && form.name.length > 100) {
            toast.error('Full name must be 100 characters or less.'); return;
        }
        if (form.email && form.email.length > 50) {
            toast.error('Email must be 50 characters or less.'); return;
        }
        if (form.email && !isEmailValid(form.email)) {
            toast.error('Please enter a valid email address.'); return;
        }
        if (form.birthday) {
            const age = getAgeFromBirthday(form.birthday);
            if (age !== null && age < 15) {
                toast.error('Trainee must be at least 15 years old.'); return;
            }
        }
        if (form.skills.length > 20) {
            toast.error('Maximum 20 skills allowed.'); return;
        }
        if (form.interests.length > 20) {
            toast.error('Maximum 20 interests allowed.'); return;
        }
        if (form.educHistory.length > 15) {
            toast.error('Maximum 15 education entries allowed.'); return;
        }
        if (form.workExperience.length > 15) {
            toast.error('Maximum 15 work experience entries allowed.'); return;
        }
        // Validate social links
        const invalidLinks = (form.socialLinks || []).filter(l => l.url && !isValidUrl(l.url));
        if (invalidLinks.length > 0) {
            toast.error('One or more social/portfolio links are invalid. Links must start with https:// or http://'); return;
        }
        setSaving(true);
        await updateTrainee(trainee.id, { ...form, personalInfoVisibility });
        setSaving(false);
        setEditing(false);
        toast.success('Profile saved successfully!');
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !isOwnProfile) return;
        setSaving(true);
        try {
            const path = `trainee-photos/${trainee.id}/${Date.now()}_${file.name}`;
            const res = await uploadOptimizedImage('registration-uploads', path, file, 600); // Small for profile pics
            if (!res.success) throw new Error(res.error);
            await updateTrainee(trainee.id, { photo: res.url });
        } catch (err) {
            console.error('Photo upload error:', err);
            toast.error('Failed to upload photo: ' + err.message);
        } finally { setSaving(false); }
    };

    const handleBannerUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !isOwnProfile) return;
        setSaving(true);
        try {
            const path = `trainee-banners/${trainee.id}/${Date.now()}_${file.name}`;
            const res = await uploadOptimizedImage('registration-uploads', path, file, 1200); // Wider for banners
            if (!res.success) throw new Error(res.error);
            await updateTrainee(trainee.id, { bannerUrl: res.url });
        } catch (err) {
            console.error('Banner upload error:', err);
            toast.error('Failed to upload banner: ' + err.message);
        } finally { setSaving(false); }
    };

    const handleCertFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !isOwnProfile) return;
        setUploadingCert(true);
        try {
            const path = `trainee-certs/${trainee.id}/${Date.now()}_${file.name}`;
            const res = await uploadOptimizedImage('registration-uploads', path, file, 1000);
            if (!res.success) throw new Error(res.error);
            setNewCert(prev => ({ ...prev, proof_url: res.url }));
        } catch (err) {
            console.error('Cert file upload error:', err);
            toast.error('Failed to upload proof: ' + err.message);
        } finally { setUploadingCert(false); }
    };

    const handleSubmitApplication = async () => {
        if (!applyJob) return;
        setSubmittingApplication(true);
        const res = await applyToJob(applyJob.id, trainee.id, applicationMessage);
        setSubmittingApplication(false);
        if (res.success) {
            setApplyJob(null);
            setApplicationMessage('');
            toast.success('Application submitted successfully!');
        } else {
            toast.error(res.error || 'Failed to submit application.');
        }
    };

    const deleteDoc = async (docId) => {
        if (!isOwnProfile) return;
        try {
            const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
                setForm(prev => ({
                    ...prev,
                    certifications: prev.certifications.filter(c => c.id !== docId)
                }));
            } else {
                toast.error(`Delete failed: ${result.error}`);
            }
        } catch (err) {
            console.error('Delete error:', err);
            toast.error('Failed to delete document.');
        }
    };

    if (loadingViewedProfile) {
        return (
            <div className="ln-page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 240 }}>
                <Loader size={30} style={{ animation: 'ocr-spin 1s linear infinite', opacity: 0.4 }} />
            </div>
        );
    }

    if (!trainee) {
        return (
            <div className="ln-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Loader size={40} style={{ animation: 'ocr-spin 1s linear infinite', opacity: 0.3 }} />
            </div>
        );
    }

    const { recommendedSkills, recommendedInterests } = getSkillInterestRecommendations(trainee.id);
    const skillsDemand = getSkillsDemand();
    const isVerifiedOfficial = isVerified(trainee);
    const initials = (trainee.name || '').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T';

    // Visibility mapping
    const publicFields = new Set(personalInfoVisibility);
    const showPublic = (key) => isOwnProfile || publicFields.has(key);
    const toggleVisibility = (key) => {
        setPersonalInfoVisibility(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    };

    const infoFields = [
        { label: 'Full Name', key: 'name', type: 'text', maxLength: 100 },
        { label: 'Birthdate', key: 'birthday', type: 'date' },
        { label: 'Gender', key: 'gender', type: 'select', options: ['Male', 'Female', 'Other', 'Prefer not to say'] },
        { label: 'Email', key: 'email', type: 'email', maxLength: 50 },
        { label: 'Training Program', key: 'program', type: 'select', options: programs.map(p => p.name) },
        { label: 'Qualification Level', key: 'ncLevel', type: 'select', options: ['NC I', 'NC II', 'NC III', 'NC IV', 'Certificate of Competency (COC)'] },
        { label: 'Graduation Year', key: 'graduationYear', type: 'text' },
    ];

    const experienceFields = [
        { label: 'Current Employer', key: 'employer', type: 'text' },
        { label: 'Job Title', key: 'jobTitle', type: 'text' },
        { label: 'Date Hired', key: 'dateHired', type: 'date' },
    ];

    return (
        <form className="ln-page-content" onSubmit={e => e.preventDefault()}>
            {!isOwnProfile && onBack && (
                <div style={{ marginBottom: 12 }}>
                    <button type="button" className="ln-btn ln-btn-outline" onClick={onBack}>
                        <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} /> Back
                    </button>
                </div>
            )}

            {/* Profile Header Card */}
            <div className="ln-card ln-profile-header-card">
                <div
                    className="ln-profile-header-banner"
                    style={{
                        backgroundImage: trainee.bannerUrl ? `url(${trainee.bannerUrl})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundColor: trainee.bannerUrl ? 'transparent' : '#e4e6eb'
                    }}
                >
                    {isOwnProfile && (
                        <div style={{ position: 'absolute', top: 12, right: 12 }}>
                            <input type="file" ref={bannerInputRef} onChange={handleBannerUpload} style={{ display: 'none' }} accept="image/*" />
                            <button type="button" onClick={() => bannerInputRef.current?.click()} className="ln-btn-sm" style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontWeight: 600 }}>
                                <Camera size={14} /> Change Banner
                            </button>
                        </div>
                    )}
                </div>
                <div className="ln-profile-header-body">
                    <div style={{ position: 'relative' }}>
                        <div className="ln-profile-header-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {trainee.photo ? (
                                <img src={trainee.photo} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : initials}
                        </div>
                        {isOwnProfile && (
                            <>
                                <input type="file" ref={photoInputRef} onChange={handlePhotoUpload} style={{ display: 'none' }} accept="image/*" />
                                <button
                                    type="button"
                                    onClick={() => photoInputRef.current?.click()}
                                    style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: '#0a66c2', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                                    title="Change Photo"
                                >
                                    <Camera size={14} color="white" />
                                </button>
                            </>
                        )}
                    </div>
                    <div className="ln-profile-header-info">
                        <div className="ln-profile-header-top">
                            <div style={{ flex: 1 }}>
                                <h1 className="ln-profile-header-name" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {showPublic('name') ? form.name || 'Trainee' : 'Private Profile'}
                                    {isVerifiedOfficial && <ShieldCheck size={20} color="#0a66c2" title="Verified Professional" />}
                                </h1>
                                <p className="ln-profile-header-headline">{showPublic('program') && form.program ? `${form.program} ${form.ncLevel ? `(${form.ncLevel})` : ''} | ` : ''}Trainee</p>
                                {showPublic('address') && form.address && (
                                    <p className="ln-profile-header-loc"><MapPin size={14} /> {form.address}</p>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                                {isOwnProfile && editing ? (
                                    <select
                                        className="form-input"
                                        value={form.employmentStatus}
                                        onChange={e => setForm({ ...form, employmentStatus: e.target.value })}
                                        style={{ padding: '4px 10px', fontSize: 12, fontWeight: 700, borderRadius: 20, height: 30, minWidth: 160 }}
                                    >
                                        <option value="">Select Status</option>
                                        <option value="Seeking Employment">Seeking Employment</option>
                                        <option value="Employed">Employed</option>
                                        <option value="Not Employed">Not Employed</option>
                                        <option value="Seeking OJT">Seeking OJT</option>
                                        <option value="OJT In Progress">OJT In Progress</option>
                                        <option value="Certified">Certified</option>
                                    </select>
                                ) : (
                                    <div className={`ln-badge ${(form.employmentStatus || trainee.employmentStatus) === 'Employed' ? 'ln-badge-green' : 'ln-badge-blue'}`}>
                                        {form.employmentStatus || trainee.employmentStatus || 'Seeking Employment'}
                                    </div>
                                )}
                                {isOwnProfile && (
                                    <button
                                        type="button"
                                        className={`ln-btn ${editing ? 'ln-btn-success' : 'ln-btn-primary'}`}
                                        onClick={editing ? save : () => setEditing(true)}
                                        disabled={saving || (editing && form.email && !isEmailValid(form.email))}
                                    >
                                        {saving ? <><Loader size={15} style={{ animation: 'ocr-spin 0.8s linear infinite' }} /> Saving...</> : editing ? <><CheckCircle size={15} /> Save Profile</> : <><Edit size={15} /> Edit Profile</>}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="ln-profile-single-col">
                <div className="ln-profile-main">
                    <div className="ln-card" style={{ marginBottom: 20, padding: '0 20px', borderRadius: 12 }}>
                        <div style={{ display: 'flex', gap: 24 }}>
                            {['About', 'Experience', 'Activity', 'Recommended', ...(isOwnProfile ? ['Saved'] : [])].map(tab => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setActiveTab(tab)}
                                    style={{
                                        padding: '14px 4px', background: 'none', border: 'none',
                                        borderBottom: activeTab === tab ? '2px solid #0a66c2' : '2px solid transparent',
                                        color: activeTab === tab ? '#0a66c2' : '#64748b', fontWeight: 600, fontSize: 14.5, cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {activeTab === 'About' && (
                        <React.Fragment>
                            <div className="ln-card">
                                <div className="ln-section-header">
                                    <h3>Personal Information</h3>
                                    {isOwnProfile && editing && (
                                        <button type="button" className="ln-btn-sm ln-btn-outline" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
                                    )}
                                </div>
                                <div className="ln-info-grid">
                                    {infoFields.map(field => {
                                        const isVisible = personalInfoVisibility.includes(field.key);
                                        const val = form[field.key];
                                        if (!isOwnProfile && !isVisible) return null;

                                        return (
                                            <div key={field.key} className="ln-info-item">
                                                <label className="ln-info-label">{field.label}</label>
                                                {editing ? (
                                                    field.type === 'select' ? (
                                                        <select className="form-input" value={val} onChange={e => setForm({ ...form, [field.key]: e.target.value })}>
                                                            <option value="">Select {field.label}</option>
                                                            {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                        </select>
                                                    ) : (
                                                        <>
                                                            <input type={field.type} className="form-input" value={val}
                                                                onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                                                                maxLength={field.maxLength || undefined}
                                                            />
                                                            {field.maxLength && editing && (
                                                                <div style={{ fontSize: 11, color: (val || '').length > field.maxLength * 0.9 ? '#dc2626' : '#94a3b8', marginTop: 4, textAlign: 'right' }}>
                                                                    {(val || '').length}/{field.maxLength}
                                                                </div>
                                                            )}
                                                            {field.key === 'birthday' && val && getAgeFromBirthday(val) !== null && getAgeFromBirthday(val) < 15 && (
                                                                <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>
                                                                    ⚠️ Trainee must be at least 15 years old
                                                                </div>
                                                            )}
                                                        </>
                                                    )
                                                ) : (
                                                    <div className="ln-info-value">{val || '—'}</div>
                                                )}
                                                {isOwnProfile && editing && (
                                                    <label style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: isVisible ? '#166534' : '#64748b', fontWeight: 600 }}>
                                                        <input type="checkbox" checked={isVisible} onChange={() => toggleVisibility(field.key)} style={{ width: 14, height: 14 }} />
                                                        {isVisible ? 'Shown to others' : 'Hidden from others'}
                                                    </label>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                {isOwnProfile && editing && form.email && !isEmailValid(form.email) && (
                                    <div style={{ fontSize: 12, color: '#cc1016', marginTop: 12, padding: '0 20px' }}>Please enter a valid email address</div>
                                )}
                                {isOwnProfile && editing && form.email && form.email.length > 50 && (
                                    <div style={{ fontSize: 12, color: '#cc1016', marginTop: 4, padding: '0 20px' }}>Email must be 50 characters or less</div>
                                )}
                            </div>

                            {/* Address Section */}
                            <div className="ln-card" style={{ marginTop: 20 }}>
                                <div className="ln-section-header">
                                    <h3>Address (PSGC)</h3>
                                </div>
                                <div style={{ padding: '0 20px 20px' }}>
                                    {editing ? (
                                        <PhilAddressSelector
                                            values={{
                                                region: form.region, regionCode: form.regionCode,
                                                province: form.province, provinceCode: form.provinceCode,
                                                city: form.city, cityCode: form.cityCode,
                                                barangay: form.barangay, barangayCode: form.barangayCode,
                                                detailedAddress: form.detailedAddress
                                            }}
                                            onChange={(updates) => setForm(prev => ({ ...prev, ...updates }))}
                                        />
                                    ) : (
                                        <div className="ln-info-value">
                                            {[form.detailedAddress, form.barangay, form.city, form.province, form.region].filter(Boolean).join(', ') || form.address || '—'}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="ln-card" style={{ marginTop: 20 }}>
                                <div className="ln-section-header">
                                    <h3>Employment Details</h3>
                                </div>
                                <div className="ln-info-grid">
                                    {experienceFields.map(field => {
                                        const val = form[field.key];
                                        return (
                                            <div key={field.key} className="ln-info-item">
                                                <label className="ln-info-label">{field.label}</label>
                                                {editing ? (
                                                    field.type === 'select' ? (
                                                        <select className="form-input" value={val} onChange={e => setForm({ ...form, [field.key]: e.target.value })}>
                                                            <option value="">Select Status</option>
                                                            {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                        </select>
                                                    ) : (
                                                        <input type={field.type} className="form-input" value={val} onChange={e => setForm({ ...form, [field.key]: e.target.value })} />
                                                    )
                                                ) : (
                                                    <div className="ln-info-value">{val || '—'}</div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </React.Fragment>
                    )}

                    {activeTab === 'Experience' && (
                        <React.Fragment>
                            <div className="ln-card">
                                <div className="ln-section-header">
                                    <h3>Skills & Expertise <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>({form.skills.length}/20)</span></h3>
                                    {isOwnProfile && editing && form.skills.length < 20 && (
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <input
                                                type="text" className="form-input" placeholder="Add skill..." style={{ margin: 0, height: 32, fontSize: 12 }}
                                                value={newSkill} onChange={e => setNewSkill(e.target.value.slice(0, 30))}
                                                maxLength={30}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter' && newSkill.trim()) {
                                                        if (form.skills.some(s => s.toLowerCase() === newSkill.trim().toLowerCase())) { toast.error('Skill already added'); return; }
                                                        setForm({ ...form, skills: [...form.skills, newSkill.trim()] }); setNewSkill('');
                                                    }
                                                }}
                                            />
                                        </div>
                                    )}
                                    {isOwnProfile && editing && form.skills.length >= 20 && (
                                        <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>Max 20 skills reached</span>
                                    )}
                                </div>
                                <div style={{ padding: '0 20px 20px' }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                        {form.skills.map((s, i) => (
                                            <div key={i} className="ln-skill-tag">
                                                {s}
                                                {isOwnProfile && editing && <X size={12} style={{ marginLeft: 6, cursor: 'pointer' }} onClick={() => setForm({ ...form, skills: form.skills.filter((_, idx) => idx !== i) })} />}
                                            </div>
                                        ))}
                                        {form.skills.length === 0 && <div style={{ fontSize: 14, color: '#94a3b8' }}>No skills added yet.</div>}
                                    </div>
                                </div>
                            </div>

                            {/* Interests */}
                            <div className="ln-card">
                                <div className="ln-section-header">
                                    <h3>Interests <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>({form.interests.length}/20)</span></h3>
                                    {isOwnProfile && editing && form.interests.length < 20 && (
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <input
                                                type="text" className="form-input" placeholder="Add interest..." style={{ margin: 0, height: 32, fontSize: 12 }}
                                                value={newInterest} onChange={e => setNewInterest(e.target.value.slice(0, 30))}
                                                maxLength={30}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter' && newInterest.trim()) {
                                                        if (form.interests.some(s => s.toLowerCase() === newInterest.trim().toLowerCase())) { toast.error('Interest already added'); return; }
                                                        setForm({ ...form, interests: [...form.interests, newInterest.trim()] }); setNewInterest('');
                                                    }
                                                }}
                                            />
                                        </div>
                                    )}
                                    {isOwnProfile && editing && form.interests.length >= 20 && (
                                        <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>Max 20 interests reached</span>
                                    )}
                                </div>
                                <div style={{ padding: '0 20px 20px' }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                        {form.interests.map((s, i) => (
                                            <div key={i} className="ln-skill-tag" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                                                {s}
                                                {isOwnProfile && editing && <X size={12} style={{ marginLeft: 6, cursor: 'pointer' }} onClick={() => setForm({ ...form, interests: form.interests.filter((_, idx) => idx !== i) })} />}
                                            </div>
                                        ))}
                                        {form.interests.length === 0 && <div style={{ fontSize: 14, color: '#94a3b8' }}>No interests added yet.</div>}
                                    </div>
                                </div>
                            </div>

                            <div className="ln-card">
                                <div className="ln-section-header">
                                    <h3>Training & Certifications</h3>
                                    {isOwnProfile && editing && (
                                        <button
                                            type="button" className="ln-btn-sm ln-btn-primary"
                                            onClick={() => showConfirm('Add new certification?', () => { })}
                                        >
                                            <Plus size={14} /> Add New
                                        </button>
                                    )}
                                </div>
                                <div style={{ padding: '0 20px 20px' }}>
                                    {form.certifications.length > 0 ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16 }}>
                                            {form.certifications.map((c, i) => (
                                                <div key={i} className="ln-cert-item">
                                                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                                        <div className="ln-cert-icon"><Award size={20} color="#0a66c2" /></div>
                                                        <div style={{ minWidth: 0, flex: 1 }}>
                                                            <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }} className="truncate">{c.title}</div>
                                                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}> {c.provider} | {c.year}</div>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                                                        {c.proof_url && (
                                                            <button
                                                                type="button"
                                                                className="ln-btn-sm ln-btn-outline"
                                                                onClick={(e) => { e.preventDefault(); setPreviewImage(c.proof_url); }}
                                                                title="View Proof"
                                                            >
                                                                <Eye size={12} /> <span style={{ marginLeft: 4 }}>Proof</span>
                                                            </button>
                                                        )}
                                                        <a href={c.proof_url} target="_blank" rel="noreferrer" className="ln-btn-sm ln-btn-outline" title="Open Link">
                                                            <ExternalLink size={12} />
                                                            <span style={{ marginLeft: 4 }}>Open</span>
                                                        </a>
                                                        {isOwnProfile && editing && (
                                                            <button
                                                                type="button"
                                                                className="ln-btn-sm ln-btn-outline"
                                                                onClick={(e) => { e.preventDefault(); showConfirm('Are you sure you want to delete this link?', () => deleteDoc(c.id)); }}
                                                                style={{ color: '#cc1016', padding: '6px' }}
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <EmptyState
                                            illustration={TrophyIllustration}
                                            title="No certifications yet"
                                            description="Showcase your professional certifications and training programs to stand out."
                                            style={{ padding: '24px 20px' }}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Educational History */}
                            <div className="ln-card">
                                <div className="ln-section-header">
                                    <h3>Educational History <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>({form.educHistory.length}/15)</span></h3>
                                </div>
                                <div style={{ padding: '0 20px 20px' }}>
                                    {form.educHistory.map((ed, i) => (
                                        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderBottom: i < form.educHistory.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                            <div className="ln-cert-icon"><GraduationCap size={20} color="#0a66c2" /></div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{ed.school || 'School'}</div>
                                                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{ed.level}{ed.program ? ` — ${ed.program}` : ''}</div>
                                                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{ed.yearFrom}{ed.yearTo ? ` – ${ed.yearTo}` : ''}</div>
                                            </div>
                                            {isOwnProfile && editing && (
                                                <button type="button" className="ln-btn-sm ln-btn-outline" style={{ color: '#cc1016', padding: '6px' }}
                                                    onClick={() => setForm({ ...form, educHistory: form.educHistory.filter((_, idx) => idx !== i) })}>
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {form.educHistory.length === 0 && !editing && (
                                        <EmptyState illustration={FolderIllustration} title="No education history" description="Add your educational background." style={{ padding: '24px 0' }} />
                                    )}
                                    {isOwnProfile && editing && form.educHistory.length < 15 && (
                                        <div style={{ marginTop: 16, padding: 16, border: '1px dashed #cbd5e1', borderRadius: 10, background: '#f8fafc' }}>
                                            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: '#475569' }}>Add Education</div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                <select className="form-input" value={newEduc.level} onChange={e => setNewEduc({ ...newEduc, level: e.target.value, program: '' })}>
                                                    <option value="">Education Level</option>
                                                    {EDUCATION_LEVEL_LABELS.map(l => <option key={l} value={l}>{l}</option>)}
                                                </select>
                                                <input type="text" className="form-input" placeholder="School / University" maxLength={100}
                                                    value={newEduc.school} onChange={e => setNewEduc({ ...newEduc, school: e.target.value })} />
                                                {educLevelShowsProgram(newEduc.level) && (
                                                    <select className="form-input" style={{ gridColumn: '1 / -1' }} value={newEduc.program}
                                                        onChange={e => setNewEduc({ ...newEduc, program: e.target.value })}>
                                                        <option value="">Degree / Program / Strand</option>
                                                        {(() => {
                                                            const progs = getPqfProgramsForEducLevel(newEduc.level);
                                                            const sectors = [...new Set(progs.map(p => p.sector))];
                                                            return sectors.map(sec => (
                                                                <optgroup key={sec} label={sec}>
                                                                    {progs.filter(p => p.sector === sec).map(p => (
                                                                        <option key={p.id} value={p.program_name}>{p.program_name}</option>
                                                                    ))}
                                                                </optgroup>
                                                            ));
                                                        })()}
                                                    </select>
                                                )}
                                                <input type="number" className="form-input" placeholder="Year From" min="1950" max={new Date().getFullYear()}
                                                    value={newEduc.yearFrom} onChange={e => setNewEduc({ ...newEduc, yearFrom: e.target.value })} />
                                                <input type="number" className="form-input" placeholder="Year To" min="1950" max={new Date().getFullYear() + 10}
                                                    value={newEduc.yearTo} onChange={e => setNewEduc({ ...newEduc, yearTo: e.target.value })} />
                                            </div>
                                            {newEduc.yearFrom && newEduc.yearTo && parseInt(newEduc.yearTo) < parseInt(newEduc.yearFrom) && (
                                                <div style={{ fontSize: 11, color: '#dc2626', marginTop: 6 }}>⚠️ "Year To" cannot be before "Year From"</div>
                                            )}
                                            <button type="button" className="ln-btn-sm ln-btn-primary" style={{ marginTop: 10 }}
                                                disabled={!newEduc.level || !newEduc.school.trim() || !newEduc.yearFrom || !newEduc.yearTo || (parseInt(newEduc.yearTo) < parseInt(newEduc.yearFrom)) || (educLevelShowsProgram(newEduc.level) && !newEduc.program)}
                                                onClick={() => {
                                                    setForm({ ...form, educHistory: [...form.educHistory, { ...newEduc }] });
                                                    setNewEduc({ level: '', school: '', program: '', yearFrom: '', yearTo: '' });
                                                }}>
                                                <Plus size={14} /> Add Education
                                            </button>
                                        </div>
                                    )}
                                    {isOwnProfile && editing && form.educHistory.length >= 15 && (
                                        <div style={{ fontSize: 12, color: '#dc2626', marginTop: 8 }}>Maximum 15 education entries reached.</div>
                                    )}
                                </div>
                            </div>

                            {/* Work Experience */}
                            <div className="ln-card">
                                <div className="ln-section-header">
                                    <h3>Work Experience <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>({form.workExperience.length}/15)</span></h3>
                                </div>
                                <div style={{ padding: '0 20px 20px' }}>
                                    {form.workExperience.map((w, i) => (
                                        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderBottom: i < form.workExperience.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                            <div className="ln-cert-icon"><Briefcase size={20} color="#0a66c2" /></div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{w.role || 'Position'}</div>
                                                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{w.company}{w.website ? <> · <a href={w.website.startsWith('http') ? w.website : `https://${w.website}`} target="_blank" rel="noreferrer" style={{ color: '#0a66c2' }}><ExternalLink size={10} /></a></> : ''}</div>
                                                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{w.yearFrom}{w.yearTo ? ` – ${w.yearTo}` : ''}</div>
                                                {w.description && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{w.description}</div>}
                                            </div>
                                            {isOwnProfile && editing && (
                                                <button type="button" className="ln-btn-sm ln-btn-outline" style={{ color: '#cc1016', padding: '6px' }}
                                                    onClick={() => setForm({ ...form, workExperience: form.workExperience.filter((_, idx) => idx !== i) })}>
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {form.workExperience.length === 0 && !editing && (
                                        <EmptyState illustration={BriefcaseIllustration} title="No work experience" description="Add your work history." style={{ padding: '24px 0' }} />
                                    )}
                                    {isOwnProfile && editing && form.workExperience.length < 15 && (
                                        <div style={{ marginTop: 16, padding: 16, border: '1px dashed #cbd5e1', borderRadius: 10, background: '#f8fafc' }}>
                                            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: '#475569' }}>Add Work Experience</div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                <input type="text" className="form-input" placeholder="Company / Organization" maxLength={100}
                                                    value={newWork.company} onChange={e => setNewWork({ ...newWork, company: e.target.value })} />
                                                <input type="text" className="form-input" placeholder="Position / Role" maxLength={30}
                                                    value={newWork.role} onChange={e => setNewWork({ ...newWork, role: e.target.value })} />
                                                <input type="number" className="form-input" placeholder="Year From" min="1950" max={new Date().getFullYear()}
                                                    value={newWork.yearFrom} onChange={e => setNewWork({ ...newWork, yearFrom: e.target.value })} />
                                                <input type="number" className="form-input" placeholder="Year To" min="1950" max={new Date().getFullYear() + 10}
                                                    value={newWork.yearTo} onChange={e => setNewWork({ ...newWork, yearTo: e.target.value })} />
                                                <textarea className="form-input" placeholder="Description / Contributions (optional)" maxLength={200}
                                                    value={newWork.description} onChange={e => setNewWork({ ...newWork, description: e.target.value })}
                                                    style={{ gridColumn: '1 / -1', minHeight: 60, resize: 'none' }} />
                                                <div style={{ gridColumn: '1 / -1' }}>
                                                    <input type="url" className="form-input" placeholder="Company Website (optional, e.g. https://example.com)"
                                                        value={newWork.website} 
                                                        onChange={e => handleUrlChange(e.target.value, 'work', val => setNewWork({ ...newWork, website: val }))}
                                                        style={urlValidation.work === 'invalid' || urlValidation.work === 'error' || urlValidation.work === 'unreachable' ? { borderColor: '#ef4444' } : urlValidation.work === 'valid' ? { borderColor: '#10b981' } : {}}
                                                    />
                                                    {urlValidation.work === 'checking' && <div style={{ fontSize: 11, color: '#3b82f6', marginTop: 4 }}>Verifying website...</div>}
                                                    {urlValidation.work === 'invalid' && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>Please enter a valid URL (e.g. https://example.com)</div>}
                                                    {urlValidation.work === 'unreachable' && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>Website is unreachable or does not exist.</div>}
                                                    {urlValidation.work === 'error' && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>Could not verify website. Check your connection.</div>}
                                                    {urlValidation.work === 'valid' && <div style={{ fontSize: 11, color: '#10b981', marginTop: 4 }}>Website verified successfully.</div>}
                                                </div>
                                            </div>
                                            {newWork.yearFrom && newWork.yearTo && parseInt(newWork.yearTo) < parseInt(newWork.yearFrom) && (
                                                <div style={{ fontSize: 11, color: '#dc2626', marginTop: 6 }}>⚠️ "Year To" cannot be before "Year From"</div>
                                            )}
                                            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                                <span style={{ fontSize: 11, color: '#94a3b8' }}>Company: {newWork.company.length}/100</span>
                                                <span style={{ fontSize: 11, color: '#94a3b8' }}>Role: {newWork.role.length}/30</span>
                                                <span style={{ fontSize: 11, color: '#94a3b8' }}>Desc: {newWork.description.length}/200</span>
                                            </div>
                                            <button type="button" className="ln-btn-sm ln-btn-primary" style={{ marginTop: 10 }}
                                                disabled={!newWork.company.trim() || !newWork.role.trim() || !newWork.yearFrom || !newWork.yearTo || (parseInt(newWork.yearTo) < parseInt(newWork.yearFrom)) || (newWork.website && urlValidation.work !== 'valid') || saving}
                                                onClick={() => {
                                                    setForm({ ...form, workExperience: [...form.workExperience, { ...newWork }] });
                                                    setNewWork({ company: '', role: '', yearFrom: '', yearTo: '', description: '', website: '' });
                                                }}>
                                                <Plus size={14} /> Add Work Experience
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Social & Portfolio Links */}
                            <div className="ln-card">
                                <div className="ln-section-header">
                                    <h3>Social & Portfolio Links</h3>
                                </div>
                                <div style={{ padding: '0 20px 20px' }}>
                                    {(form.socialLinks || []).map((link, i) => (
                                        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                                            <ExternalLink size={14} color="#0a66c2" />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: 12, color: '#475569', textTransform: 'capitalize' }}>{link.platform || 'Link'}</div>
                                                <a href={/^https?:\/\//i.test(link.url) ? link.url : `https://${link.url}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#0a66c2', wordBreak: 'break-all' }}>{link.url}</a>
                                            </div>
                                            {isOwnProfile && editing && (
                                                <button type="button" className="ln-btn-sm ln-btn-outline" style={{ color: '#cc1016', padding: '4px' }}
                                                    onClick={() => setForm({ ...form, socialLinks: form.socialLinks.filter((_, idx) => idx !== i) })}>
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {(form.socialLinks || []).length === 0 && !editing && (
                                        <div style={{ fontSize: 14, color: '#94a3b8', padding: '12px 0' }}>No social or portfolio links added.</div>
                                    )}
                                    {isOwnProfile && editing && (
                                        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                            <select className="form-input" style={{ width: 140, height: 36, fontSize: 12 }}
                                                value={newSocialLink.platform} onChange={e => setNewSocialLink({ ...newSocialLink, platform: e.target.value })}>
                                                <option value="">Platform</option>
                                                {['LinkedIn', 'GitHub', 'Portfolio', 'Facebook', 'Twitter/X', 'Instagram', 'YouTube', 'Behance', 'Dribbble', 'Other'].map(p => (
                                                    <option key={p} value={p}>{p}</option>
                                                ))}
                                            </select>
                                            <div style={{ flex: 1, minWidth: 200 }}>
                                                <input type="url" className="form-input" placeholder="https://..." style={{ height: 36, fontSize: 12, ...(urlValidation.social === 'invalid' || urlValidation.social === 'error' || urlValidation.social === 'unreachable' ? { borderColor: '#ef4444' } : urlValidation.social === 'valid' ? { borderColor: '#10b981' } : {}) }}
                                                    value={newSocialLink.url} 
                                                    onChange={e => handleUrlChange(e.target.value, 'social', val => setNewSocialLink({ ...newSocialLink, url: val }))}
                                                />
                                                {urlValidation.social === 'checking' && <div style={{ fontSize: 11, color: '#3b82f6', marginTop: 4 }}>Verifying link...</div>}
                                                {urlValidation.social === 'invalid' && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>Please enter a valid URL</div>}
                                                {urlValidation.social === 'unreachable' && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>Link is unreachable or does not exist.</div>}
                                                {urlValidation.social === 'error' && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>Could not verify link. Check connection.</div>}
                                                {urlValidation.social === 'valid' && <div style={{ fontSize: 11, color: '#10b981', marginTop: 4 }}>Link verified successfully.</div>}
                                            </div>
                                            <button type="button" className="ln-btn-sm ln-btn-primary" style={{ height: 36 }}
                                                disabled={!newSocialLink.platform || !newSocialLink.url || urlValidation.social !== 'valid'}
                                                onClick={() => {
                                                    setForm({ ...form, socialLinks: [...(form.socialLinks || []), { ...newSocialLink, url: /^https?:\/\//i.test(newSocialLink.url.trim()) ? newSocialLink.url.trim() : `https://${newSocialLink.url.trim()}` }] });
                                                    setNewSocialLink({ platform: '', url: '' });
                                                }}>
                                                <Plus size={14} /> Add
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </React.Fragment>
                    )}

                    {activeTab === 'Activity' && (
                        <ProfileActivityTab profileId={trainee.id} profileType="trainee" isOwnProfile={isOwnProfile} />
                    )}

                    {activeTab === 'Recommended' && (
                        <div className="ln-card">
                            <div className="ln-section-header"><h3>Recommended For You</h3></div>
                            <div style={{ padding: '0 20px 20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <div style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 12, background: '#f8fafc' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                            <Target size={18} color="#0a66c2" />
                                            <div style={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.025em', color: '#475569' }}>Top Demand Skills</div>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                            {skillsDemand.slice(0, 5).map(s => (
                                                <div key={s.skill} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}>
                                                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{s.skill}</span>
                                                    <span style={{ fontSize: 10, color: '#0a66c2', fontWeight: 700 }}>{s.count} Jobs</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 12, background: '#f8fafc' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                            <Star size={18} color="#d97706" />
                                            <div style={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.025em', color: '#475569' }}>Grow Your Profile</div>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                            {recommendedSkills.map(s => (
                                                <button key={s} type="button" className="ln-btn-sm ln-btn-outline" style={{ borderStyle: 'dashed', borderRadius: 8, fontSize: 12 }}>
                                                    + {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Saved' && isOwnProfile && (
                        <div className="ln-card">
                            <div className="ln-section-header"><h3>Saved Items</h3></div>
                            <div style={{ padding: '0 20px 20px' }}>
                                <SavedItemsView
                                    userId={trainee.id}
                                    userType="trainee"
                                    onOpenBulletin={(p) => openBulletinModal(p, 'inquire')}
                                    onApply={(job) => setApplyJob(job)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Application Modal for Saved tab */}
            {applyJob && (
                <div className="modal-overlay" onClick={() => setApplyJob(null)}>
                    <div className="ln-modal" onClick={e => e.stopPropagation()}>
                        <div className="ln-modal-header">
                            <div>
                                <h3 className="ln-modal-title">Application Form</h3>
                                <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', marginTop: 4 }}>
                                    {applyJob.title} | {applyJob.companyName}
                                </p>
                            </div>
                            <button type="button" className="ln-btn-icon" onClick={() => setApplyJob(null)}><X size={18} /></button>
                        </div>

                        <div className="ln-profile-summary-notice" style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: 12, marginBottom: 16 }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                <Info size={18} color="#0369a1" style={{ marginTop: 2 }} />
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0369a1' }}>Profile as Resume</div>
                                    <p style={{ fontSize: 12, color: '#0c4a6e', margin: '4px 0 0' }}>
                                        Your profile will be shared with the recruiter as your official resume.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {resumeInfo?.file_url && (
                            <div style={{ marginBottom: 12 }}>
                                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Attached Resume (Optional Backup)</div>
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 10, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{resumeInfo.file_name || 'Resume'}</div>
                                    </div>
                                    <a href={resumeInfo.file_url} target="_blank" rel="noreferrer" className="ln-btn-sm ln-btn-outline"><Eye size={12} /> View</a>
                                </div>
                            </div>
                        )}

                        <div style={{ marginBottom: 14 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Application Message</div>
                            <textarea
                                className="ln-search-input"
                                placeholder="Write a short message for the recruiter (optional)..."
                                value={applicationMessage}
                                onChange={e => setApplicationMessage(e.target.value)}
                                maxLength={1000}
                                style={{ width: '100%', minHeight: 110, resize: 'none', borderRadius: 10, padding: 12 }}
                            />
                        </div>

                        <div className="ln-modal-footer">
                            <button type="button" className="ln-btn ln-btn-outline" onClick={() => setApplyJob(null)}>Cancel</button>
                            <button type="button" className="ln-btn ln-btn-primary" disabled={submittingApplication} onClick={handleSubmitApplication}>
                                <Send size={15} /> {submittingApplication ? 'Submitting...' : 'Submit Application'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Certificate Proof Preview Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-75 p-4 transition-opacity"
                    onClick={() => setPreviewImage(null)}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}
                >
                    <div
                        className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden"
                        onClick={e => e.stopPropagation()}
                        style={{ maxHeight: '90vh', background: '#fff', borderRadius: 12 }}
                    >
                        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50" style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 className="font-bold text-gray-800 flex items-center gap-2" style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ShieldCheck size={20} color="#0284c7" />
                                Official Certificate Proof
                            </h3>
                            <button type="button" onClick={() => setPreviewImage(null)} style={{ background: '#e2e8f0', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer', display: 'flex' }}>
                                <X size={20} color="#64748b" />
                            </button>
                        </div>

                        <div className="p-6 bg-gray-100 flex-1 overflow-auto flex items-center justify-center" style={{ padding: '24px', background: '#f1f5f9', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {previewImage.toLowerCase().endsWith('.pdf') ? (
                                <div className="text-center" style={{ textAlign: 'center' }}>
                                    <FileText size={64} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
                                    <p style={{ color: '#475569', fontWeight: 500, marginBottom: '12px' }}>This proof is a PDF document.</p>
                                    <a href={previewImage} target="_blank" rel="noreferrer" style={{ background: '#0284c7', color: '#fff', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontWeight: 600, display: 'inline-block' }}>
                                        Open PDF to View
                                    </a>
                                </div>
                            ) : (
                                <img
                                    src={previewImage}
                                    alt="Certificate Proof"
                                    style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', background: '#fff' }}
                                />
                            )}
                        </div>

                        <div className="p-4 bg-white border-t border-gray-100 flex justify-between items-center" style={{ padding: '16px', background: '#fff', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: 500 }}>Industry Partners can scan this directly.</p>
                            <a href={previewImage} download target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#0284c7', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <ExternalLink size={14} /> Open Original
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Dialog */}
            {confirmDialog.open && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={closeConfirm}>
                    <div style={{ background: 'white', borderRadius: 14, padding: '28px 32px', minWidth: 340, maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                                <Trash2 size={22} color="#cc1016" />
                            </div>
                            <p style={{ fontSize: 15, color: '#1e293b', fontWeight: 500, margin: 0, lineHeight: 1.5 }}>{confirmDialog.message}</p>
                        </div>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                            <button type="button" onClick={closeConfirm} style={{ padding: '9px 24px', borderRadius: 8, border: '1px solid #d1d5db', background: 'white', color: '#475569', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                            <button type="button" onClick={() => { confirmDialog.onConfirm(); closeConfirm(); }} style={{ padding: '9px 24px', borderRadius: 8, border: 'none', background: '#cc1016', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </form>
    );
};

export const CompanyProfile = ({ viewedPartnerId = null, onBack = null }) => {
  const { currentUser, partners, updatePartner, jobPostings, createPostInteraction, fetchPostInteractions } = useApp();
  const navigate = useNavigate();
  const isOwnProfile = !viewedPartnerId || String(viewedPartnerId) === String(currentUser?.id);
  const [viewedPartner, setViewedPartner] = useState(null);
  const [loadingViewedProfile, setLoadingViewedProfile] = useState(false);
  const partner = isOwnProfile
    ? (partners.find(p => String(p.id) === String(currentUser?.id)) || currentUser)
    : (viewedPartner || partners.find(p => String(p.id) === String(viewedPartnerId)));

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('About'); // About | Saved
  const [form, setForm] = useState({
    companyName: '', contactPerson: '', email: '', address: '', website: '', industry: '',
    achievements: [], benefits: [], mission: '', vision: '',
    culture_tags: [], perks_tags: [], poc_name: '', poc_title: '',
    poc_photo_url: '', office_location_url: '', banner_url: ''
  });
  const [companyInfoVisibility, setCompanyInfoVisibility] = useState(() => resolvePartnerVisibility(partner));

  const [newAchievement, setNewAchievement] = useState('');
  const [newBenefit, setNewBenefit] = useState('');

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({ open: false, message: '', onConfirm: null });
  const showConfirm = (message, onConfirm) => setConfirmDialog({ open: true, message, onConfirm });
  const closeConfirm = () => setConfirmDialog({ open: false, message: '', onConfirm: null });

  // Bulletin modal state (for Saved tab View button)
  const [bulletinModal, setBulletinModal] = useState(null);
  const [bulletinMessage, setBulletinMessage] = useState('');
  const [bulletinSubmitting, setBulletinSubmitting] = useState(false);
  const [bulletinToast, setBulletinToast] = useState('');
  const showBulletinToast = (msg) => { setBulletinToast(msg); setTimeout(() => setBulletinToast(''), 3000); };
  const openBulletinModal = (post, type) => { setBulletinModal({ post, type }); setBulletinMessage(''); };
  const handleBulletinInteraction = async () => {
    if (!bulletinModal) return;
    setBulletinSubmitting(true);
    const details = { message: bulletinMessage, submitted_at: new Date().toISOString() };
    const res = await createPostInteraction(bulletinModal.post.id, bulletinModal.type, details);
    setBulletinSubmitting(false);
    if (res.success) {
      setBulletinModal(null);
      showBulletinToast(bulletinModal.type === 'inquire' ? 'Inquiry sent!' : 'Submitted!');
      fetchPostInteractions();
    } else {
      toast.error(res.error || 'Failed to submit.');
    }
  };

  // Documents state
  const [documents, setDocuments] = useState([]);
  const [docLabel, setDocLabel] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const fileInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const pocPhotoInputRef = useRef(null);

  // Email validation
  const isEmailValid = (email) => !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    if (isOwnProfile || !viewedPartnerId) {
      setViewedPartner(null);
      setLoadingViewedProfile(false);
      return;
    }

    let isMounted = true;
    const fetchViewedPartner = async () => {
      setLoadingViewedProfile(true);
      try {
        const { data, error } = await supabase
          .from('industry_partners')
          .select('*')
          .eq('id', viewedPartnerId)
          .single();

        if (error || !data) {
          const response = await fetch(`/api/public-profile/partner/${viewedPartnerId}`);
          if (!response.ok) throw error || new Error('Failed to load viewed partner profile');
          const payload = await response.json();
          if (isMounted) setViewedPartner(normalizePartnerProfile(payload?.profile || null));
        } else if (isMounted) {
          setViewedPartner(normalizePartnerProfile(data || null));
        }
      } catch (err) {
        console.error('Fetch viewed partner profile error:', err);
        if (isMounted) setViewedPartner(null);
      } finally {
        if (isMounted) setLoadingViewedProfile(false);
      }
    };

    fetchViewedPartner();
    return () => { isMounted = false; };
  }, [isOwnProfile, viewedPartnerId]);

  useEffect(() => {
    if (partner) {
      setForm({
        companyName: partner.companyName || '',
        contactPerson: partner.contactPerson || '',
        email: partner.email || '',
        address: partner.address || '',
        website: partner.website || '',
        industry: partner.industry || '',
        achievements: partner.achievements || [],
        benefits: partner.benefits || [],
        mission: partner.mission || '',
        vision: partner.vision || '',
        culture_tags: Array.isArray(partner.culture_tags) ? partner.culture_tags : [],
        perks_tags: Array.isArray(partner.perks_tags) ? partner.perks_tags : [],
        poc_name: partner.poc_name || '',
        poc_title: partner.poc_title || '',
        poc_photo_url: partner.poc_photo_url || '',
        office_location_url: partner.office_location_url || '',
        banner_url: partner.banner_url || ''
      });
      setCompanyInfoVisibility(resolvePartnerVisibility(partner));
      setEditing(false);
      setShowUploadForm(false);
    }
  }, [partner]);

  // Fetch documents on mount
  useEffect(() => {
    if (partner?.id) {
      fetch(`/api/documents/${partner.id}`)
        .then(r => r.json())
        .then(data => { if (data.success) setDocuments(data.documents || []); })
        .catch(err => console.error('Fetch partner docs error:', err));
    }
  }, [partner?.id]);

  const handleDocUpload = async () => {
    if (!isOwnProfile || !docFile || !docLabel.trim()) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1];
        const res = await fetch('/api/documents/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            traineeId: partner.id, label: docLabel.trim(),
            fileName: docFile.name, fileType: docFile.type, fileData: base64,
          }),
        });
        const result = await res.json();
        if (result.success) {
          setDocuments(prev => [result.document, ...prev]);
          setDocLabel(''); setDocFile(null); setShowUploadForm(false);
        } else { toast.error(result.error || 'Upload failed.'); }
        setUploading(false);
      };
      reader.readAsDataURL(docFile);
    } catch (err) { console.error('Upload error:', err); toast.error('Failed to upload document.'); setUploading(false); }
  };

  const deleteDoc = async (docId) => {
    if (!isOwnProfile) return;
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) { setDocuments(prev => prev.filter(d => d.id !== docId)); }
      else { toast.error(`Delete failed: ${result.error}`); }
    } catch (err) { console.error('Delete error:', err); toast.error('Failed to delete document.'); }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !isOwnProfile) return;
    setSaving(true);
    try {
      const path = `partner-banners/${partner.id}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage.from('registration-uploads').upload(path, file);
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from('registration-uploads').getPublicUrl(path);
      await updatePartner(partner.id, { banner_url: publicUrl });
      setForm(prev => ({ ...prev, banner_url: publicUrl }));
      showBulletinToast('Banner updated successfully!');
    } catch (err) { console.error('Banner upload error:', err); toast.error('Failed to upload banner: ' + err.message); }
    finally { setSaving(false); }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !isOwnProfile) return;
    setSaving(true);
    try {
      const path = `partner-logos/${partner.id}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage.from('registration-uploads').upload(path, file);
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from('registration-uploads').getPublicUrl(path);
      await updatePartner(partner.id, { company_logo_url: publicUrl });
      setForm(prev => ({ ...prev, company_logo_url: publicUrl }));
      showBulletinToast('Logo updated successfully!');
    } catch (err) { console.error('Logo upload error:', err); toast.error('Failed to upload logo: ' + err.message); }
    finally { setSaving(false); }
  };

  const handlePOCPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !isOwnProfile) return;
    setSaving(true);
    try {
      const path = `partner-poc/${partner.id}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage.from('registration-uploads').upload(path, file);
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from('registration-uploads').getPublicUrl(path);
      setForm(prev => ({ ...prev, poc_photo_url: publicUrl }));
      showBulletinToast('POC photo updated!');
    } catch (err) { console.error('POC photo upload error:', err); toast.error('Failed to upload photo: ' + err.message); }
    finally { setSaving(false); }
  };

  if (loadingViewedProfile) {
    return (
      <div className="ln-page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 240 }}>
        <Loader size={30} style={{ animation: 'ocr-spin 1s linear infinite', opacity: 0.4 }} />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="ln-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Loader size={40} style={{ animation: 'ocr-spin 1s linear infinite', opacity: 0.3 }} />
      </div>
    );
  }

  const activeJobs = jobPostings.filter(j => j.partnerId === partner.id && j.status === 'Open');

  const saveProfile = async () => {
    if (!isOwnProfile) return;
    if (form.email && !isEmailValid(form.email)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setSaving(true);
    await updatePartner(partner.id, { ...form, companyInfoVisibility });
    setSaving(false);
    setEditing(false);
  };

  const initials = partner.companyName?.charAt(0)?.toUpperCase() || 'P';
  const companyInfoFields = [
    { label: 'Company Name', key: 'companyName', type: 'text', maxLength: 100 },
    { label: 'Contact Person', key: 'contactPerson', type: 'text', maxLength: 100 },
    { label: 'Contact Email', key: 'email', type: 'email', maxLength: 100 },
    { label: 'Address', key: 'address', type: 'text', maxLength: 200 },
    { label: 'Industry', key: 'industry', type: 'text', maxLength: 80 },
    { label: 'Website', key: 'website', type: 'text', maxLength: 200, placeholder: 'e.g. https://example.com' },
  ];

  const toggleCompanyInfoVisibility = (fieldKey) => {
    setCompanyInfoVisibility(prev => (
      prev.includes(fieldKey)
        ? prev.filter(key => key !== fieldKey)
        : [...prev, fieldKey]
    ));
  };
  const visibleCompanyInfo = new Set(resolvePartnerVisibility(partner));
  const showHeaderCompanyName = isOwnProfile || visibleCompanyInfo.has('companyName');
  const showHeaderIndustry = isOwnProfile || visibleCompanyInfo.has('industry');
  const showHeaderAddress = isOwnProfile || visibleCompanyInfo.has('address');
  const showHeaderEmail = isOwnProfile || visibleCompanyInfo.has('email');
  const isHeaderAddressHiddenFromOthers = isOwnProfile && !visibleCompanyInfo.has('address');
  const isHeaderEmailHiddenFromOthers = isOwnProfile && !visibleCompanyInfo.has('email');

  return (
    <div className="ln-page-content">
      {!isOwnProfile && onBack && (
        <div style={{ marginBottom: 12 }}>
          <button type="button" className="ln-btn ln-btn-outline" onClick={onBack}>
            <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} /> Back
          </button>
        </div>
      )}
      {/* Profile Header Card */}
      <div className="ln-card ln-profile-header-card">
        <div
          className="ln-profile-header-banner pn-header-banner"
          style={{
            height: 160,
            backgroundImage: partner.banner_url ? `url(${partner.banner_url})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: partner.banner_url ? 'transparent' : undefined
          }}
        >
          {isOwnProfile && (
            <div style={{ position: 'absolute', top: 12, right: 12 }}>
              <input type="file" ref={bannerInputRef} onChange={handleBannerUpload} style={{ display: 'none' }} accept="image/*" />
              <button type="button" onClick={() => bannerInputRef.current?.click()} className="ln-btn-sm" style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontWeight: 600, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                <Camera size={14} /> Change Banner
              </button>
            </div>
          )}
        </div>
        <div className="ln-profile-header-body">
          <div style={{ position: 'relative' }}>
            <div className="ln-profile-header-avatar pn-header-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {partner.company_logo_url ? (
                <img src={partner.company_logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : initials}
            </div>
            {isOwnProfile && (
              <>
                <input type="file" ref={logoInputRef} onChange={handleLogoUpload} style={{ display: 'none' }} accept="image/*" />
                <button type="button" onClick={() => logoInputRef.current?.click()} style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: '#0a66c2', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', zIndex: 2 }} title="Change Logo">
                  <Camera size={14} color="white" />
                </button>
              </>
            )}
          </div>
          <div className="ln-profile-header-info">
            <div className="ln-profile-header-top">
              <div style={{ flex: 1 }}>
                <h1 className="ln-profile-header-name" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {showHeaderCompanyName ? partner.companyName : 'Industry Partner'}
                  {isVerified(partner) && <CheckCircle size={20} color="#0a66c2" title="Verified" style={{ flexShrink: 0 }} />}
                </h1>
                <p className="ln-profile-header-headline">{showHeaderIndustry && partner.industry ? `${partner.industry} | ` : ''}Industry Partner</p>
                {showHeaderAddress && partner.address && (
                  <p className="ln-profile-header-loc" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={14} />
                    <span>{partner.address}</span>
                    {isHeaderAddressHiddenFromOthers && <EyeOff size={14} color="#94a3b8" title="Hidden from others" />}
                  </p>
                )}
                {showHeaderEmail && partner.email && (
                  <p className="ln-profile-header-contact" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <span>{partner.email}</span>
                    {isHeaderEmailHiddenFromOthers && <EyeOff size={14} color="#94a3b8" title="Hidden from others" />}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                <StatusBadge status={partner.verificationStatus} />
                {isOwnProfile && (
                  <button className={`ln-btn ${editing ? 'ln-btn-success' : 'ln-btn-primary'}`} onClick={editing ? saveProfile : () => setEditing(true)} disabled={saving || (editing && form.email && !isEmailValid(form.email))}>
                    {saving ? <><Loader size={15} style={{ animation: 'ocr-spin 0.8s linear infinite' }} /> Saving...</> : editing ? <><CheckCircle size={15} /> Save Changes</> : <><Edit size={15} /> Edit Profile</>}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="ln-profile-single-col">
        <div className="ln-profile-main">
          <div className="ln-card" style={{ marginBottom: 20, padding: '0 20px', borderRadius: 12 }}>
            <div style={{ display: 'flex', gap: 24 }}>
              {(isOwnProfile ? ['About', 'Saved', 'Activity'] : ['About']).map(tab => (
                <button
                  key={tab} type="button" onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '14px 4px', background: 'none', border: 'none',
                    borderBottom: activeTab === tab ? '2px solid #0a66c2' : '2px solid transparent',
                    color: activeTab === tab ? '#0a66c2' : '#64748b', fontWeight: 600, fontSize: 14.5, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8
                  }}
                >
                  {tab === 'Saved' ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Bookmark size={14} /> Saved</div> : tab}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'About' && (
            <React.Fragment>
              {isOwnProfile && !isVerified(partner) && (
                <div className="ln-card" style={{ borderLeft: '4px solid #d97706', marginBottom: 16 }}>
                  <div style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <AlertTriangle size={20} color="#d97706" style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#92400e', marginBottom: 2 }}>{partner.verificationStatus === 'Under Review' ? 'Verification In Progress' : 'Account Not Verified'}</div>
                        <div style={{ fontSize: 13, color: '#a16207' }}>
                          {partner.verificationStatus === 'Under Review' ? 'Your documents are being reviewed.' : 'Verify your account to unlock job & OJT posting features.'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                      <StatusBadge status={partner.verificationStatus} />
                      <button className="ln-btn ln-btn-primary" style={{ fontSize: 13 }} onClick={() => navigate('/partner/verification')}><ShieldCheck size={14} /> Go to Verification</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="ln-card">
                <div className="ln-section-header">
                  <h3>Company Information</h3>
                  {isOwnProfile && editing && (<button className="ln-btn-sm ln-btn-outline" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>)}
                </div>
                <div className="ln-info-grid">
                  {companyInfoFields.filter(f => isOwnProfile || visibleCompanyInfo.has(f.key)).map(field => {
                    const isVisible = companyInfoVisibility.includes(field.key);
                    const value = editing ? form[field.key] : partner[field.key];
                    return (
                      <div key={field.key} className="ln-info-item">
                        <label className="ln-info-label">{field.label}</label>
                        {editing ? (
                          <input type={field.type} className="form-input" value={value || ''} maxLength={field.maxLength} placeholder={field.placeholder} onChange={e => setForm({ ...form, [field.key]: e.target.value })} />
                        ) : field.key === 'website' ? (
                          <div className="ln-info-value">
                            {partner.website ? <a href={partner.website.startsWith('http') ? partner.website : `https://${partner.website}`} target="_blank" rel="noreferrer" style={{ color: '#0a66c2', display: 'flex', alignItems: 'center', gap: 4 }}>{partner.website} <ExternalLink size={12} /></a> : '—'}
                          </div>
                        ) : (<div className="ln-info-value">{value || '—'}</div>)}
                        {isOwnProfile && editing && (
                          <label style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: isVisible ? '#166534' : '#64748b', fontWeight: 600 }}>
                            <input type="checkbox" checked={isVisible} onChange={() => toggleCompanyInfoVisibility(field.key)} style={{ width: 14, height: 14 }} />
                            {isVisible ? 'Shown to others' : 'Hidden from others'}
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
                <div className="ln-card">
                  <div className="ln-section-header"><h3>Our Mission</h3></div>
                  <div style={{ padding: '0 16px 16px' }}>{editing ? (<textarea className="form-input" style={{ minHeight: 120, resize: 'none' }} placeholder="Mission..." value={form.mission} onChange={e => setForm({ ...form, mission: e.target.value })} />) : (<p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6 }}>{partner.mission || 'No mission.'}</p>)}</div>
                </div>
                <div className="ln-card">
                  <div className="ln-section-header"><h3>Our Vision</h3></div>
                  <div style={{ padding: '0 16px 16px' }}>{editing ? (<textarea className="form-input" style={{ minHeight: 120, resize: 'none' }} placeholder="Vision..." value={form.vision} onChange={e => setForm({ ...form, vision: e.target.value })} />) : (<p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6 }}>{partner.vision || 'No vision.'}</p>)}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 20, marginTop: 20 }}>
                <div>
                  <div className="ln-card">
                    <div className="ln-section-header"><h3>Work Culture & Perks</h3></div>
                    <div style={{ padding: '0 16px 16px' }}>
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Work Culture</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {PREDEFINED_CULTURE_TAGS.map(tag => {
                            const isSelected = (editing ? form.culture_tags : partner.culture_tags)?.includes(tag);
                            return (
                                <button
                                    key={tag} type="button"
                                    onClick={() => { if (!editing) return; const current = form.culture_tags || []; setForm({ ...form, culture_tags: isSelected ? current.filter(t => t !== tag) : [...current, tag] }); }}
                                    style={{ padding: '6px 14px', background: isSelected ? '#eff6ff' : '#f8fafc', border: '1px solid', borderColor: isSelected ? '#3b82f6' : '#e2e8f0', color: isSelected ? '#1d4ed8' : '#64748b', borderRadius: 20, fontSize: 12, cursor: editing ? 'pointer' : 'default' }}
                                >
                                    {tag}
                                </button>
                            );
                          })}
                        </div>
                      </div>
                      <div style={{ marginTop: 24 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Perks & Benefits</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {PREDEFINED_PERKS_TAGS.map(tag => {
                            const isSelected = (editing ? form.perks_tags : partner.perks_tags)?.includes(tag);
                            return (
                                <button
                                    key={tag} type="button"
                                    onClick={() => { if (!editing) return; const current = form.perks_tags || []; setForm({ ...form, perks_tags: isSelected ? current.filter(t => t !== tag) : [...current, tag] }); }}
                                    style={{ padding: '6px 14px', background: isSelected ? '#fdf2f2' : '#f8fafc', border: '1px solid', borderColor: isSelected ? '#fecaca' : '#e2e8f0', color: isSelected ? '#991b1b' : '#64748b', borderRadius: 20, fontSize: 12, cursor: editing ? 'pointer' : 'default' }}
                                >
                                    {tag}
                                </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="ln-card">
                    <div className="ln-section-header"><h3>Point of Contact</h3></div>
                    <div style={{ padding: '0 16px 20px', textAlign: 'center' }}>
                      <div style={{ width: 100, height: 100, borderRadius: '50%', background: '#f1f5f9', margin: '0 auto 16px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {(editing ? form.poc_photo_url : partner.poc_photo_url) ? <img src={editing ? form.poc_photo_url : partner.poc_photo_url} alt="POC" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={40} color="#94a3b8" />}
                      </div>
                      {editing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <input className="form-input" style={{ textAlign: 'center', fontWeight: 700 }} placeholder="POC Name" value={form.poc_name} onChange={e => setForm({ ...form, poc_name: e.target.value })} />
                              <input className="form-input" style={{ textAlign: 'center', fontSize: 13 }} placeholder="POC Title" value={form.poc_title} onChange={e => setForm({ ...form, poc_title: e.target.value })} />
                          </div>
                      ) : (
                          <div>
                              <div style={{ fontWeight: 700 }}>{partner.poc_name || 'Name'}</div>
                              <div style={{ color: '#64748b', fontSize: 13 }}>{partner.poc_title || 'Designation'}</div>
                          </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="ln-card">
                <div className="ln-section-header"><h3>Company Achievements</h3></div>
                <div style={{ padding: '0 16px 16px' }}>
                    {(editing ? form.achievements : partner.achievements)?.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {(editing ? form.achievements : partner.achievements).map((ach, idx) => (
                                <div key={idx} className="ln-doc-item" style={{ padding: '6px 14px', borderRadius: 20, background: '#fffbeb' }}>
                                    <Award size={14} /> {ach}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState illustration={TrophyIllustration} title="No achievements" description="Add your awards." />
                    )}
                </div>
              </div>

              <div className="ln-card">
                <div className="ln-section-header"><h3>Documents</h3></div>
                <div style={{ padding: '0 16px 16px' }}>
                    {documents.length > 0 ? documents.map(doc => (
                        <div key={doc.id} className="ln-doc-item">
                            <div className="ln-doc-info"><FileText size={16} /> <div><div style={{ fontWeight: 600 }}>{doc.label}</div></div></div>
                            <a href={doc.file_url} target="_blank" rel="noreferrer" className="ln-btn-sm ln-btn-outline">View</a>
                        </div>
                    )) : <EmptyState illustration={DocumentIllustration} title="No documents" description="Add company documents." />}
                </div>
              </div>
            </React.Fragment>
          )}

          {activeTab === 'Saved' && isOwnProfile && (
            <div className="ln-card">
              <div className="ln-section-header"><h3>Saved Items</h3></div>
              <div style={{ padding: '0 20px 20px' }}><SavedItemsView userId={partner.id} userType="partner" onOpenBulletin={(p) => openBulletinModal(p, 'inquire')} /></div>
            </div>
          )}

          {activeTab === 'Activity' && isOwnProfile && (
            <ProfileActivityTab profileId={partner.id} profileType="partner" isOwnProfile={isOwnProfile} />
          )}
        </div>
      </div>

      {bulletinToast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={16} color="#4ade80" />{bulletinToast}
        </div>
      )}

      {bulletinModal && (
          <div className="modal-overlay">
              <div className="ln-modal">
                  <div className="ln-modal-header"><h3>{bulletinModal.type === 'inquire' ? 'Send Inquiry' : 'Response'}</h3></div>
                  <div style={{ padding: 20 }}>
                      <textarea className="form-input" value={bulletinMessage} onChange={e => setBulletinMessage(e.target.value)} rows={4} />
                      <div className="ln-modal-footer">
                          <button onClick={() => setBulletinModal(null)} className="ln-btn ln-btn-outline">Cancel</button>
                          <button onClick={handleBulletinInteraction} className="ln-btn ln-btn-primary">Send</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
