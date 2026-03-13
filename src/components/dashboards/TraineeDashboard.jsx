import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
    User, Briefcase, FileText, CheckCircle, Bell, ChevronDown, Search, Filter, MapPin, Clock, Building2,
    Award, Send, CheckSquare, X, Eye, Plus, Target, Menu, Home, Settings, LogOut, MessageSquare, Heart, Bookmark,
    Trash2, Camera, Loader, GraduationCap, MoveRight, ExternalLink, ShieldCheck, Mail, Calendar, AlignLeft, Users, ChevronRight, Edit, Upload
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';

/* ═══════════════════════════════════════════════════════════════════
   LINKEDIN-STYLE TRAINEE DASHBOARD
   ═══════════════════════════════════════════════════════════════ */

// ─── TIME AGO HELPER ──────────────────────────────────────────────
const timeAgo = (dateStr) => {
    const raw = String(dateStr || '').trim();
    if (!raw) return 'Just now';

    const hasTimeInfo = raw.includes('T') || /\d{1,2}:\d{2}/.test(raw);
    const now = new Date();
    const date = new Date(raw);
    if (!Number.isFinite(date.getTime())) return 'Just now';

    if (!hasTimeInfo) {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const postDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayDiff = Math.floor((today - postDay) / (24 * 60 * 60 * 1000));
        if (dayDiff <= 0) return 'Today';
        if (dayDiff === 1) return '1d ago';
        if (dayDiff < 30) return `${dayDiff}d ago`;
        const months = Math.floor(dayDiff / 30);
        if (months < 12) return `${months}mo ago`;
        const years = Math.floor(months / 12);
        return `${years}y ago`;
    }

    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(months / 12);
    return `${years}y ago`;
};

const isImageAttachment = (attachmentUrl, attachmentType) => {
    const mime = String(attachmentType || '').toLowerCase();
    if (mime.startsWith('image/')) return true;
    const cleanUrl = String(attachmentUrl || '').split('?')[0].toLowerCase();
    return /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(cleanUrl);
};

// ─── TOP NAVIGATION BAR (LinkedIn-style) ─────────────────────────
const LinkedInTopNav = ({ activePage, setActivePage }) => {
    const { currentUser, userRole, logout } = useApp();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotif, setShowNotif] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const initials = (currentUser?.name || '').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T';

    const navItems = [
        { id: 'dashboard', label: 'Home', icon: <Home size={20} /> },
        { id: 'profile', label: 'Profile', icon: <User size={20} /> },
        { id: 'recommendations', label: 'Opportunities', icon: <Briefcase size={20} /> },
        { id: 'applications', label: 'My Applications', icon: <FileText size={20} /> },
    ];

    return (
        <header className="ln-topnav">
            <div className="ln-topnav-inner">
                {/* Left: Logo + Search */}
                <div className="ln-topnav-left">
                    <div className="ln-logo">
                        <span className="ln-logo-icon">TT</span>
                    </div>
                    <div className="ln-search-wrap">
                        <Search size={16} className="ln-search-icon" />
                        <input
                            className="ln-search-input"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Center: Nav Items */}
                <nav className="ln-topnav-center">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            className={`ln-nav-item ${activePage === item.id ? 'active' : ''}`}
                            onClick={() => setActivePage(item.id)}
                            title={item.label}
                        >
                            {item.icon}
                            <span className="ln-nav-label">{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* Right: Notifications + Profile */}
                <div className="ln-topnav-right">
                    <div style={{ position: 'relative' }}>
                        <button className="ln-nav-item" onClick={() => { setShowNotif(!showNotif); setShowProfileMenu(false); }}>
                            <Bell size={20} />
                            <span className="ln-notif-dot" />
                            <span className="ln-nav-label">Alerts</span>
                        </button>
                        {showNotif && (
                            <div className="ln-dropdown" style={{ right: 0, minWidth: 300 }}>
                                <div className="ln-dropdown-header">Notifications</div>
                                {[
                                    { text: 'New opportunity match: Junior IT Technician', time: '2h ago' },
                                    { text: 'Your application was reviewed by TechSolutions', time: '5h ago' },
                                    { text: 'Profile viewed by 3 industry partners', time: '1d ago' },
                                ].map((n, i) => (
                                    <div key={i} className="ln-dropdown-item">
                                        <div className="ln-notif-avatar">
                                            <Building2 size={16} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div className="ln-notif-text">{n.text}</div>
                                            <div className="ln-notif-time">{n.time}</div>
                                        </div>
                                    </div>
                                ))}
                                <div className="ln-dropdown-footer">View all notifications</div>
                            </div>
                        )}
                    </div>

                    <div className="ln-topnav-divider" />

                    <div style={{ position: 'relative' }}>
                        <button className="ln-nav-item ln-profile-trigger" onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotif(false); }}>
                            <div className="ln-nav-avatar">{initials}</div>
                            <span className="ln-nav-label">
                                Me <ChevronDown size={12} style={{ marginLeft: 2 }} />
                            </span>
                        </button>
                        {showProfileMenu && (
                            <div className="ln-dropdown" style={{ right: 0, minWidth: 260 }}>
                                <div className="ln-dropdown-profile">
                                    <div className="ln-dropdown-profile-avatar">{initials}</div>
                                    <div>
                                        <div className="ln-dropdown-profile-name">{currentUser?.name || 'Trainee'}</div>
                                        <div className="ln-dropdown-profile-role">TESDA Trainee</div>
                                    </div>
                                </div>
                                <button className="ln-dropdown-profile-btn" onClick={() => { setActivePage('profile'); setShowProfileMenu(false); }}>
                                    View Profile
                                </button>
                                <div className="ln-dropdown-divider" />
                                <div className="ln-dropdown-item" onClick={() => { setActivePage('profile'); setShowProfileMenu(false); }}>
                                    <Settings size={16} /> Settings
                                </div>
                                <div className="ln-dropdown-divider" />
                                <div className="ln-dropdown-item ln-dropdown-danger" onClick={logout}>
                                    <LogOut size={16} /> Sign Out
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile hamburger */}
                <button className="ln-mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    <Menu size={22} />
                </button>
            </div>

            {/* Mobile nav dropdown */}
            {mobileMenuOpen && (
                <div className="ln-mobile-nav">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            className={`ln-mobile-nav-item ${activePage === item.id ? 'active' : ''}`}
                            onClick={() => { setActivePage(item.id); setMobileMenuOpen(false); }}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    ))}
                    <div className="ln-dropdown-divider" />
                    <button className="ln-mobile-nav-item ln-dropdown-danger" onClick={logout}>
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            )}
        </header>
    );
};

// ─── LAYOUT WRAPPER ──────────────────────────────────────────────
const LinkedInLayout = ({ children, activePage, setActivePage }) => (
    <div className="ln-app">
        <LinkedInTopNav activePage={activePage} setActivePage={setActivePage} />
        <main className="ln-main">
            {children}
        </main>
    </div>
);

// ─── LEFT PROFILE CARD (LinkedIn-style) ──────────────────────────
const ProfileSideCard = ({ trainee, setActivePage }) => {
    const initials = (trainee?.name || '').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T';
    return (
        <div className="ln-card ln-profile-card">
            <div className="ln-profile-banner" style={trainee?.bannerUrl ? {
                backgroundImage: `url(${trainee.bannerUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            } : {}} />
            <div className="ln-profile-card-body">
                <div className="ln-profile-avatar-wrap">
                    <div className="ln-profile-avatar-lg" style={trainee?.photo ? {
                        backgroundImage: `url(${trainee.photo})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        fontSize: 0,
                    } : {}}>{!trainee?.photo && initials}</div>
                </div>
                <h2 className="ln-profile-name">{trainee?.name}</h2>
                <p className="ln-profile-headline">TESDA Trainee &bull; Class of {trainee?.graduationYear}</p>
                <p className="ln-profile-location"><MapPin size={13} /> {trainee?.address || 'Philippines'}</p>

                <div className="ln-profile-stats">
                    <div className="ln-profile-stat" onClick={() => setActivePage('profile')}>
                        <span className="ln-profile-stat-num">{trainee?.certifications?.length || 0}</span>
                        <span className="ln-profile-stat-label">Certifications</span>
                    </div>
                    <div className="ln-profile-stat-divider" />
                    <div className="ln-profile-stat" onClick={() => setActivePage('profile')}>
                        <span className="ln-profile-stat-num">{trainee?.skills?.length || 0}</span>
                        <span className="ln-profile-stat-label">Skills</span>
                    </div>
                </div>

                <div className="ln-profile-certs">
                    {trainee?.certifications?.slice(0, 3).map((c, i) => (
                        <span key={i} className="ln-cert-tag"><Award size={12} /> {typeof c === 'string' ? c : c.name}</span>
                    ))}
                </div>

                <button className="ln-btn-profile-view" onClick={() => setActivePage('profile')}>
                    View full profile
                </button>
            </div>
        </div>
    );
};

// ─── RIGHT SIDEBAR WIDGET ────────────────────────────────────────
const SuggestedOpportunities = ({ recJobs, handleApply, setActivePage }) => (
    <div className="ln-card ln-widget">
        <div className="ln-widget-header">
            <span>Recommended for you</span>
            <button className="ln-link-btn" onClick={() => setActivePage('recommendations')}>See all</button>
        </div>
        {recJobs.slice(0, 3).map(job => (
            <div key={job.id} className="ln-suggested-item">
                <div className="ln-suggested-icon">
                    <Building2 size={18} />
                </div>
                <div className="ln-suggested-info">
                    <div className="ln-suggested-title">{job.title}</div>
                    <div className="ln-suggested-company">{job.companyName}</div>
                    <div className="ln-suggested-meta">
                        <MapPin size={11} /> {job.location} &bull; {job.opportunityType}
                    </div>
                    <div className="ln-match-row">
                        <div className="ln-match-bar">
                            <div
                                className={`ln - match - fill ${job.matchRate >= 70 ? 'high' : job.matchRate >= 40 ? 'mid' : 'low'} `}
                                style={{ width: `${job.matchRate}% ` }}
                            />
                        </div>
                        <span className="ln-match-pct">{job.matchRate}%</span>
                    </div>
                </div>
            </div>
        ))}
        {recJobs.length === 0 && (
            <div className="ln-empty-widget">No recommendations yet</div>
        )}
    </div>
);

const QuickLinksWidget = ({ setActivePage }) => (
    <div className="ln-card ln-widget">
        <div className="ln-widget-header"><span>Quick Links</span></div>
        {[
            { label: 'My Applications', icon: <FileText size={16} />, page: 'applications' },
            { label: 'My Profile', icon: <User size={16} />, page: 'profile' },
        ].map(link => (
            <button key={link.page} className="ln-quick-link" onClick={() => setActivePage(link.page)}>
                {link.icon} {link.label}
                <ChevronRight size={14} className="ln-quick-link-arrow" />
            </button>
        ))}
    </div>
);

// ─── PROGRESS BAR HELPER ─────────────────────────────────────────
const ProgressBar = ({ value, showLabel = true }) => {
    const cls = value >= 70 ? 'progress-high' : value >= 40 ? 'progress-mid' : 'progress-low';
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="progress-bar-wrap" style={{ flex: 1 }}>
                <div className={`progress - bar - fill ${cls} `} style={{ width: `${value}% ` }} />
            </div>
            {showLabel && <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', minWidth: 32, textAlign: 'right' }}>{value}%</span>}
        </div>
    );
};

// ─── PAGE 1: DASHBOARD HOME (LinkedIn Feed-style) ───────────────
const TraineeDashboardHome = ({ setActivePage }) => {
    const { currentUser, trainees, jobPostings, applications, getTraineeRecommendedJobs, applyToJob, posts, createPost, updatePost, deletePost, partners, addPostComment, getPostComments, addJobPostingComment, getJobPostingComments, updateJobPostingComment, deleteJobPostingComment, sendContactRequest } = useApp();
    const trainee = currentUser || trainees[0];
    const myApps = applications.filter(a => a.traineeId === trainee?.id);
    const recJobs = getTraineeRecommendedJobs(trainee?.id);

    // Edit/Delete post state
    const [editingPostId, setEditingPostId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [postMenuId, setPostMenuId] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [confirmSaveId, setConfirmSaveId] = useState(null);

    // Modal state
    const [showPostModal, setShowPostModal] = useState(false);
    const [postContent, setPostContent] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [postType, setPostType] = useState('general');
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [commentModalPost, setCommentModalPost] = useState(null);
    const [commentInput, setCommentInput] = useState('');
    const [commentSubmitting, setCommentSubmitting] = useState(false);
    const [contactTarget, setContactTarget] = useState(null);
    const [contactMessage, setContactMessage] = useState('');
    const [contactAttachment, setContactAttachment] = useState(null);
    const [contactSubmitting, setContactSubmitting] = useState(false);
    const [jobMediaModal, setJobMediaModal] = useState(null);
    const [jobMediaCommentInput, setJobMediaCommentInput] = useState('');
    const [editingJobMediaCommentId, setEditingJobMediaCommentId] = useState(null);
    const [jobMediaEditInput, setJobMediaEditInput] = useState('');
    const [jobMediaCommentSaving, setJobMediaCommentSaving] = useState(false);
    const [jobMediaCommentMenuId, setJobMediaCommentMenuId] = useState(null);
    const fileInputRef = useRef(null);
    const contactFileInputRef = useRef(null);
    const jobMediaCommentInputRef = useRef(null);

    const openJobMediaModal = (job, focusComment = false) => {
        setJobMediaModal(job);
        setJobMediaCommentInput('');
        setEditingJobMediaCommentId(null);
        setJobMediaEditInput('');
        setJobMediaCommentMenuId(null);
        if (focusComment) {
            setTimeout(() => jobMediaCommentInputRef.current?.focus(), 0);
        }
    };

    const closeJobMediaModal = () => {
        setJobMediaModal(null);
        setJobMediaCommentInput('');
        setEditingJobMediaCommentId(null);
        setJobMediaEditInput('');
        setJobMediaCommentMenuId(null);
    };

    const submitJobMediaComment = async () => {
        if (!jobMediaModal) return;
        const trimmed = jobMediaCommentInput.trim();
        if (!trimmed) return;

        const result = await addJobPostingComment(jobMediaModal.id, trimmed);
        if (!result.success) {
            alert(result.error || 'Failed to add comment.');
            return;
        }

        setJobMediaCommentInput('');
    };

    const startEditingJobMediaComment = (comment) => {
        if (!comment || comment.author_id !== currentUser?.id) return;
        setEditingJobMediaCommentId(comment.id);
        setJobMediaEditInput(comment.content || '');
    };

    const cancelEditingJobMediaComment = () => {
        setEditingJobMediaCommentId(null);
        setJobMediaEditInput('');
    };

    const saveEditedJobMediaComment = async () => {
        if (!editingJobMediaCommentId) return;
        const trimmed = jobMediaEditInput.trim();
        if (!trimmed) {
            alert('Comment cannot be empty.');
            return;
        }

        setJobMediaCommentSaving(true);
        const result = await updateJobPostingComment(editingJobMediaCommentId, trimmed);
        setJobMediaCommentSaving(false);
        if (!result.success) {
            alert(result.error || 'Failed to update comment.');
            return;
        }

        setEditingJobMediaCommentId(null);
        setJobMediaEditInput('');
    };

    const handleDeleteJobMediaComment = async (commentId) => {
        if (!commentId) return;
        const confirmed = window.confirm('Delete this comment?');
        if (!confirmed) return;

        const result = await deleteJobPostingComment(commentId);
        if (!result.success) {
            alert(result.error || 'Failed to delete comment.');
            return;
        }

        if (editingJobMediaCommentId === commentId) {
            setEditingJobMediaCommentId(null);
            setJobMediaEditInput('');
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSelectedFile(file);
        if (file.type.startsWith('image/')) {
            setFilePreview(URL.createObjectURL(file));
        } else {
            setFilePreview(null);
        }
    };

    const handleCreatePost = async () => {
        if (!postContent.trim() && !selectedFile) return;
        setIsPosting(true);
        let media_url = null;

        try {
            if (selectedFile) {
                const ext = selectedFile.name.split('.').pop();
                const path = `post-media/${trainee.id}/${Date.now()}_${selectedFile.name}`;
                const { error: uploadErr } = await supabase.storage
                    .from('registration-uploads')
                    .upload(path, selectedFile, { contentType: selectedFile.type });
                if (uploadErr) throw uploadErr;
                const { data: urlData } = supabase.storage.from('registration-uploads').getPublicUrl(path);
                media_url = urlData?.publicUrl;
            }

            const res = await createPost({
                content: postContent,
                post_type: postType,
                media_url: media_url,
                tags: [trainee?.program, ...(trainee?.skills || [])].filter(Boolean)
            });

            if (res.success) {
                setPostContent('');
                setPostType('general');
                setSelectedFile(null);
                setFilePreview(null);
                setShowPostModal(false);
            } else {
                alert(res.error);
            }
        } catch (err) {
            console.error('Posting error:', err);
            alert('Failed to post: ' + err.message);
        } finally {
            setIsPosting(false);
        }
    };

    // Unified Feed logic: Mix Jobs and Posts, sort by date
    const unifiedFeed = [
        ...posts.map(p => ({ ...p, feedType: 'post' })),
        ...recJobs.map(j => ({ ...j, feedType: 'job' }))
    ].sort((a, b) => new Date(b.created_at || b.createdAt || b.datePosted) - new Date(a.created_at || a.createdAt || a.datePosted));

    const handleApply = () => {
        setActivePage('recommendations');
    };

    const openContactModal = (target) => {
        if (!target || target.recipientId === currentUser?.id) return;
        setContactTarget(target);
        setContactMessage('');
        setContactAttachment(null);
        if (contactFileInputRef.current) contactFileInputRef.current.value = '';
    };

    const closeContactModal = () => {
        setContactTarget(null);
        setContactMessage('');
        setContactAttachment(null);
        if (contactFileInputRef.current) contactFileInputRef.current.value = '';
    };

    const handleContactAttachmentChange = (event) => {
        const file = event.target.files?.[0] || null;
        setContactAttachment(file);
    };

    const handleSubmitContact = async () => {
        if (!contactTarget) return;

        const trimmed = contactMessage.trim();
        const requiresResume = contactTarget.recipientType === 'industry_partner';

        if (!trimmed) {
            alert('Message is required.');
            return;
        }

        if (requiresResume && !contactAttachment) {
            alert('Resume upload is required when contacting a partner.');
            return;
        }

        setContactSubmitting(true);

        let attachmentUrl = null;
        let attachmentName = null;

        try {
            if (contactAttachment) {
                const path = `contact-files/${trainee.id}/${Date.now()}_${contactAttachment.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('registration-uploads')
                    .upload(path, contactAttachment, { contentType: contactAttachment.type, upsert: true });

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage.from('registration-uploads').getPublicUrl(path);
                attachmentUrl = urlData?.publicUrl || null;
                attachmentName = contactAttachment.name;
            }

            const result = await sendContactRequest({
                recipientId: contactTarget.recipientId,
                recipientType: contactTarget.recipientType,
                postId: contactTarget.postId || null,
                jobPostingId: contactTarget.jobPostingId || null,
                message: trimmed,
                attachmentName,
                attachmentUrl,
                attachmentKind: requiresResume ? 'resume' : 'document',
            });

            if (!result.success) {
                alert(result.error || 'Failed to send contact request.');
                return;
            }

            closeContactModal();
            alert('Contact request sent.');
        } catch (err) {
            console.error('Contact submit error:', err);
            alert(err.message || 'Failed to send contact request.');
        } finally {
            setContactSubmitting(false);
        }
    };

    const handleCommentOnPost = (post) => {
        setCommentModalPost(post);
        setCommentInput('');
    };

    const handleSubmitComment = async () => {
        if (!commentModalPost) return;
        const trimmed = commentInput.trim();
        if (!trimmed) return;

        setCommentSubmitting(true);
        const result = await addPostComment(commentModalPost.id, trimmed);
        setCommentSubmitting(false);

        if (!result.success) {
            alert(result.error || 'Failed to add comment.');
            return;
        }

        setCommentInput('');
    };

    const handleEditPost = (post) => {
        setEditingPostId(post.id);
        setEditContent(post.content);
        setPostMenuId(null);
    };

    const handleSaveEdit = async (postId) => {
        if (!editContent.trim()) return;
        const res = await updatePost(postId, { content: editContent });
        if (res.success) {
            setEditingPostId(null);
            setEditContent('');
            setConfirmSaveId(null);
        } else {
            alert(res.error || 'Failed to update post');
            setConfirmSaveId(null);
        }
    };

    const handleDeletePost = async (postId) => {
        const res = await deletePost(postId);
        if (res.success) {
            setConfirmDeleteId(null);
        } else {
            alert(res.error || 'Failed to delete post');
        }
    };

    const stats = [
        { label: 'Match Rate', value: recJobs.length > 0 ? `${Math.round(recJobs.reduce((s, j) => s + j.matchRate, 0) / recJobs.length)}%` : '0%', icon: <Target size={20} />, color: '#0a66c2' },
        { label: 'Applications', value: myApps.length, icon: <Send size={20} />, color: '#057642' },
        { label: 'Status', value: trainee?.employmentStatus || 'Unemployed', icon: <Briefcase size={20} />, color: '#b24020' },
        { label: 'Certifications', value: trainee?.certifications?.length || 0, icon: <Award size={20} />, color: '#7c3aed' },
    ];

    const modalComments = commentModalPost ? getPostComments(commentModalPost.id) : [];
    const modalAuthor = commentModalPost
        ? (commentModalPost.author_id === currentUser?.id
            ? currentUser
            : commentModalPost.author_type === 'student'
                ? trainees.find(t => t.id === commentModalPost.author_id)
                : partners.find(p => p.id === commentModalPost.author_id))
        : null;
    const modalAuthorName = modalAuthor?.name || modalAuthor?.companyName || 'Community User';
    const canContactModalAuthor = Boolean(commentModalPost && commentModalPost.author_id !== currentUser?.id);
    const contactRequiresResume = contactTarget?.recipientType === 'industry_partner';
    const contactRecipientName = contactTarget?.recipientName || 'Recipient';
    const jobMediaComments = jobMediaModal ? getJobPostingComments(jobMediaModal.id) : [];

    return (
        <div className="ln-three-col">
            {/* Left Column - Profile Card */}
            <div className="ln-col-left">
                <ProfileSideCard trainee={trainee} setActivePage={setActivePage} />
            </div>

            {/* Center Column - Feed */}
            <div className="ln-col-center">
                {/* Stats Row */}
                <div className="ln-card ln-stats-row">
                    {stats.map((s, i) => (
                        <div key={i} className="ln-stat-item">
                            <div className="ln-stat-icon" style={{ color: s.color }}>{s.icon}</div>
                            <div className="ln-stat-value">{s.value}</div>
                            <div className="ln-stat-label">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Create Post Card (Trigger) */}
                <div className="ln-card" style={{ padding: '12px 16px', marginBottom: 16 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div className="ln-feed-avatar" style={{ flexShrink: 0 }}>
                            {trainee?.photo ? <img src={trainee.photo} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : (trainee?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T')}
                        </div>
                        <button
                            className="ln-search-input"
                            style={{
                                flex: 1, height: 40, padding: '0 16px', textAlign: 'left',
                                borderRadius: 24, border: '1px solid rgba(0,0,0,0.1)',
                                background: '#f0f2f5', cursor: 'text', color: 'rgba(0,0,0,0.5)',
                                fontSize: 15, transition: 'all 0.2s'
                            }}
                            onClick={() => setShowPostModal(true)}
                        >
                            Create Post
                        </button>
                    </div>
                </div>

                {/* Create Post Modal */}
                {showPostModal && (
                    <div className="ln-modal-overlay" style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(4px)',
                        zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
                    }}>
                        <div className="ln-card ln-modal-content" style={{
                            width: '100%', maxWidth: 500, padding: 0, borderRadius: 12,
                            boxShadow: '0 12px 28px 0 rgba(0, 0, 0, 0.2), 0 2px 4px 0 rgba(0, 0, 0, 0.1)',
                            overflow: 'hidden', animation: 'lnModalIn 0.2s ease-out'
                        }}>
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f2f5', position: 'relative', textAlign: 'center' }}>
                                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Create post</h3>
                                <button
                                    style={{
                                        position: 'absolute', right: 12, top: 12, background: '#e4e6eb',
                                        border: 'none', width: 32, height: 32, borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                                    }}
                                    onClick={() => setShowPostModal(false)}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div style={{ padding: '16px 16px' }}>
                                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                                    <div className="ln-feed-avatar" style={{ flexShrink: 0, width: 40, height: 40 }}>
                                        {trainee?.photo ? <img src={trainee.photo} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : ((trainee?.name || '').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T')}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 15 }}>{trainee?.name}</div>
                                        <select
                                            style={{
                                                background: '#e4e6eb', border: 'none', borderRadius: 6,
                                                padding: '2px 8px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                                marginTop: 4
                                            }}
                                            value={postType}
                                            onChange={e => setPostType(e.target.value)}
                                        >
                                            <option value="general">Public</option>
                                            <option value="achievement">Achievement</option>
                                            <option value="certification">Certification</option>
                                            <option value="project">Project</option>
                                        </select>
                                    </div>
                                </div>

                                <textarea
                                    autoFocus
                                    placeholder="What's on your mind?"
                                    style={{
                                        width: '100%', border: 'none', resize: 'none', fontSize: 18,
                                        minHeight: filePreview ? 80 : 150, padding: 0, outline: 'none', marginBottom: 20
                                    }}
                                    value={postContent}
                                    onChange={e => setPostContent(e.target.value)}
                                />

                                {filePreview && (
                                    <div style={{ position: 'relative', marginBottom: 20, borderRadius: 8, overflow: 'hidden', border: '1px solid #e4e6eb' }}>
                                        <img src={filePreview} alt="Preview" style={{ width: '100%', display: 'block' }} />
                                        <button
                                            style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer' }}
                                            onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                )}

                                {selectedFile && !filePreview && (
                                    <div style={{ marginBottom: 20, padding: '12px', background: '#f0f2f5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <FileText size={20} color="#65676b" />
                                            <span style={{ fontSize: 14, fontWeight: 500 }}>{selectedFile.name}</span>
                                        </div>
                                        <button
                                            style={{ background: 'none', border: 'none', color: '#65676b', cursor: 'pointer' }}
                                            onClick={() => setSelectedFile(null)}
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                )}

                                <div style={{
                                    border: '1px solid #e4e6eb', borderRadius: 8, padding: '12px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    marginBottom: 16
                                }}>
                                    <span style={{ fontWeight: 600, fontSize: 14 }}>Add to your post</span>
                                    <div style={{ display: 'flex', gap: 12, color: '#65676b' }}>
                                        <input
                                            type="file"
                                            hidden
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            accept="image/*,.pdf,.doc,.docx"
                                        />
                                        <Camera size={22} cursor="pointer" onClick={() => fileInputRef.current.click()} />
                                        <Plus size={22} cursor="pointer" onClick={() => fileInputRef.current.click()} />
                                    </div>
                                </div>

                                <button
                                    className="ln-btn-primary"
                                    style={{
                                        width: '100%', height: 36, borderRadius: 6, fontWeight: 600,
                                        opacity: (postContent.trim() || selectedFile) && !isPosting ? 1 : 0.5,
                                        cursor: (postContent.trim() || selectedFile) && !isPosting ? 'pointer' : 'not-allowed'
                                    }}
                                    disabled={(!postContent.trim() && !selectedFile) || isPosting}
                                    onClick={handleCreatePost}
                                >
                                    {isPosting ? 'Posting...' : 'Post'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Unified Feed */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {unifiedFeed.map(item => {
                        if (item.feedType === 'job') {
                            const applied = myApps.some(a => a.jobId === item.id);
                            const jobComments = getJobPostingComments(item.id);
                            return (
                                <div key={`job-${item.id}`} className="ln-card ln-feed-card" style={{ marginBottom: 0 }}>
                                    <div className="ln-feed-card-header">
                                        <div className="ln-feed-avatar" style={{ background: '#f0f7ff', color: '#0a66c2' }}>
                                            <Building2 size={20} />
                                        </div>
                                        <div>
                                            <div className="ln-feed-author">{item.companyName} <span style={{ fontWeight: 400, color: 'rgba(0,0,0,0.45)', marginLeft: 4 }}>posted a new {item.opportunityType}</span></div>
                                            <div className="ln-feed-meta">{item.industry} &bull; {item.location}</div>
                                        </div>
                                    </div>
                                    <div className="ln-feed-content">
                                        <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{item.title}</h4>
                                        <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.6)', marginBottom: 8 }}>{item.description.substring(0, 150)}...</p>
                                        {item.attachmentUrl && isImageAttachment(item.attachmentUrl, item.attachmentType) && (
                                            <button type="button" onClick={() => openJobMediaModal(item)} style={{ display: 'block', marginBottom: 10, padding: 0, border: 'none', background: 'transparent', width: '100%', cursor: 'pointer' }}>
                                                <img
                                                    src={item.attachmentUrl}
                                                    alt={item.attachmentName || 'Opportunity attachment'}
                                                    style={{ width: '100%', maxHeight: 260, objectFit: 'cover', borderRadius: 10, border: '1px solid #e2e8f0' }}
                                                />
                                            </button>
                                        )}
                                        {item.attachmentUrl && !isImageAttachment(item.attachmentUrl, item.attachmentType) && (
                                            <a href={item.attachmentUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#2563eb', marginBottom: 8, textDecoration: 'none' }}>
                                                <FileText size={13} /> {item.attachmentName || decodeURIComponent(String(item.attachmentUrl).split('/').pop()?.split('?')[0] || 'Attachment')}
                                            </a>
                                        )}
                                        <div className="ln-match-row">
                                            <div className="ln-match-bar" style={{ flex: 1 }}>
                                                <div className={`ln-match-fill ${item.matchRate >= 70 ? 'high' : item.matchRate >= 40 ? 'mid' : 'low'}`} style={{ width: `${item.matchRate}%` }} />
                                            </div>
                                            <span className="ln-match-pct" style={{ fontSize: 12 }}>{item.matchRate}% match</span>
                                        </div>
                                        {jobComments.length > 0 && (
                                            <div style={{ marginTop: 10, fontSize: 12, color: '#64748b', display: 'flex', gap: 14 }}>
                                                {jobComments.length > 0 && <span>{jobComments.length} comment{jobComments.length === 1 ? '' : 's'}</span>}
                                            </div>
                                        )}
                                    </div>
                                    <div className="ln-feed-actions" style={{ borderTop: '1px solid #f3f3f3', padding: '8px 12px' }}>
                                        <button
                                            className="ln-feed-action-btn"
                                            onClick={() => openContactModal({
                                                recipientId: item.partnerId,
                                                recipientType: 'industry_partner',
                                                recipientName: item.companyName,
                                                jobPostingId: item.id,
                                                sourceLabel: item.title,
                                            })}
                                        >
                                            <MessageSquare size={14} /> {applied ? 'Contact Again' : 'Contact'}
                                        </button>
                                        <button className="ln-feed-action-btn" onClick={() => openJobMediaModal(item, true)}>
                                            <MessageSquare size={14} /> Comment ({jobComments.length})
                                        </button>
                                        <button className="ln-feed-action-btn" onClick={() => setActivePage('recommendations')}>
                                            <Eye size={14} /> View Details
                                        </button>
                                    </div>
                                </div>
                            );
                        } else {
                            const isOwnPost = item.author_id === currentUser?.id;
                            const author = isOwnPost
                                ? currentUser
                                : item.author_type === 'student'
                                    ? trainees.find(t => t.id === item.author_id)
                                    : partners.find(p => p.id === item.author_id);
                            const authorName = author?.name || author?.companyName || 'Unknown User';
                            const authorPhoto = author?.photo || author?.company_logo_url;
                            const authorInitial = authorName.charAt(0) || '?';
                            const comments = getPostComments(item.id);
                            const getCommentAuthorName = (comment) => {
                                if (comment.author_id === currentUser?.id) return currentUser.name || trainee?.name || 'You';
                                if (comment.author_type === 'student') {
                                    const student = trainees.find(t => t.id === comment.author_id);
                                    return student?.name || 'Trainee';
                                }
                                const company = partners.find(p => p.id === comment.author_id);
                                return company?.companyName || 'Industry Partner';
                            };

                            return (
                                <div key={`post-${item.id}`} className="ln-card ln-feed-card" style={{ marginBottom: 0 }}>
                                    <div className="ln-feed-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                            <div className="ln-feed-avatar">
                                                {authorPhoto ? (
                                                    <img src={authorPhoto} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                                ) : authorInitial}
                                            </div>
                                            <div>
                                                <div className="ln-feed-author" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    {authorName}
                                                    {item.post_type !== 'general' && (
                                                        <span className="ln-badge ln-badge-blue" style={{ fontSize: 10, padding: '2px 8px' }}>
                                                            {item.post_type.replace('_', ' ')}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="ln-feed-meta">
                                                    {item.author_type === 'student' ? (author?.program || 'Trainee') : (author?.companyName || 'Industry Partner')} &bull; {timeAgo(item.created_at)}
                                                    {item.updated_at && item.updated_at !== item.created_at && ' (edited)'}
                                                </div>
                                            </div>
                                        </div>
                                        {isOwnPost && (
                                            <div style={{ position: 'relative' }}>
                                                <button
                                                    onClick={() => setPostMenuId(postMenuId === item.id ? null : item.id)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: '50%', color: '#65676b' }}
                                                    title="More options"
                                                >
                                                    <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2, lineHeight: 1 }}>···</span>
                                                </button>
                                                {postMenuId === item.id && (
                                                    <div style={{
                                                        position: 'absolute', right: 0, top: 32, background: '#fff',
                                                        borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                                                        border: '1px solid #e4e6eb', zIndex: 10, minWidth: 150, overflow: 'hidden'
                                                    }}>
                                                        <button
                                                            onClick={() => handleEditPost(item)}
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                                                                padding: '10px 16px', border: 'none', background: 'none',
                                                                cursor: 'pointer', fontSize: 14, color: '#1c1e21'
                                                            }}
                                                            onMouseEnter={e => e.target.style.background = '#f2f3f5'}
                                                            onMouseLeave={e => e.target.style.background = 'none'}
                                                        >
                                                            <Edit size={16} /> Edit post
                                                        </button>
                                                        <button
                                                            onClick={() => { setConfirmDeleteId(item.id); setPostMenuId(null); }}
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                                                                padding: '10px 16px', border: 'none', background: 'none',
                                                                cursor: 'pointer', fontSize: 14, color: '#e74c3c'
                                                            }}
                                                            onMouseEnter={e => e.target.style.background = '#f2f3f5'}
                                                            onMouseLeave={e => e.target.style.background = 'none'}
                                                        >
                                                            <Trash2 size={16} /> Delete post
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="ln-feed-content">
                                        {editingPostId === item.id ? (
                                            <div>
                                                <textarea
                                                    value={editContent}
                                                    onChange={e => setEditContent(e.target.value)}
                                                    style={{
                                                        width: '100%', minHeight: 100, padding: 12, fontSize: 14,
                                                        border: '1px solid #0a66c2', borderRadius: 8, resize: 'none',
                                                        outline: 'none', fontFamily: 'inherit'
                                                    }}
                                                    maxLength={2000}
                                                />
                                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                                                    <button
                                                        onClick={() => { setEditingPostId(null); setEditContent(''); }}
                                                        className="ln-btn-sm"
                                                        style={{ padding: '6px 16px', borderRadius: 20, fontSize: 13 }}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmSaveId(item.id)}
                                                        className="ln-btn-sm ln-btn-primary"
                                                        style={{ padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}
                                                        disabled={!editContent.trim()}
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>{item.content}</p>
                                        )}
                                        {item.media_url && (
                                            <div style={{ marginTop: 12 }}>
                                                {item.media_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                    <img src={item.media_url} alt="Post media" style={{ width: '100%', borderRadius: 8, border: '1px solid #f3f3f3' }} />
                                                ) : (
                                                    <a
                                                        href={item.media_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                                                            background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0',
                                                            textDecoration: 'none', color: '#0a66c2', fontWeight: 600, fontSize: 13
                                                        }}
                                                    >
                                                        <FileText size={20} />
                                                        View Attached Document
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                                            {item.tags?.map(tag => (
                                                <span key={tag} style={{ color: '#0a66c2', fontSize: 12, fontWeight: 500 }}>#{tag.replace(/\s+/g, '')}</span>
                                            ))}
                                        </div>
                                        {comments.length > 0 && (
                                            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                {comments.slice(-3).map(comment => (
                                                    <div key={comment.id} style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.4 }}>
                                                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{getCommentAuthorName(comment)}:</span> {comment.content}
                                                    </div>
                                                ))}
                                                {comments.length > 3 && (
                                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>+{comments.length - 3} more comments</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="ln-feed-actions" style={{ borderTop: '1px solid #f3f3f3', padding: '4px 12px' }}>
                                        <button
                                            className="ln-feed-action-btn"
                                            onClick={() => openContactModal({
                                                recipientId: item.author_id,
                                                recipientType: item.author_type,
                                                recipientName: authorName,
                                                postId: item.id,
                                                sourceLabel: item.content,
                                            })}
                                            disabled={isOwnPost}
                                            style={isOwnPost ? { opacity: 0.55, cursor: 'not-allowed' } : undefined}
                                        >
                                            <MessageSquare size={16} /> {isOwnPost ? 'Your Post' : 'Contact'}
                                        </button>
                                        <button className="ln-feed-action-btn" onClick={() => handleCommentOnPost(item)}><MessageSquare size={16} /> Comment ({comments.length})</button>
                                    </div>
                                </div>
                            );
                        }
                    })}
                    {unifiedFeed.length === 0 && (
                        <div className="ln-empty-state"><Search size={48} /><h3>No posts yet</h3><p>Follow partners or update your profile to see relevant content.</p></div>
                    )}
                </div>
            </div>

            {/* Right Column - Widgets */}
            <div className="ln-col-right">
                <SuggestedOpportunities recJobs={recJobs} handleApply={handleApply} setActivePage={setActivePage} />
                <QuickLinksWidget setActivePage={setActivePage} />
            </div>

            {/* Delete Confirmation Dialog */}
            {confirmDeleteId && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
                    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="ln-card" style={{ padding: 24, maxWidth: 400, width: '90%', borderRadius: 12, textAlign: 'center' }}>
                        <Trash2 size={36} style={{ color: '#e74c3c', marginBottom: 12 }} />
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Delete Post?</h3>
                        <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', marginBottom: 20 }}>
                            This action cannot be undone. Are you sure you want to delete this post?
                        </p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                            <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="ln-btn-sm"
                                style={{ padding: '8px 24px', borderRadius: 20, fontSize: 14 }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeletePost(confirmDeleteId)}
                                style={{
                                    padding: '8px 24px', borderRadius: 20, fontSize: 14, fontWeight: 600,
                                    background: '#e74c3c', color: '#fff', border: 'none', cursor: 'pointer'
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Save Edit Confirmation Dialog */}
            {confirmSaveId && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
                    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="ln-card" style={{ padding: 24, maxWidth: 400, width: '90%', borderRadius: 12, textAlign: 'center' }}>
                        <Edit size={36} style={{ color: '#0a66c2', marginBottom: 12 }} />
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Save Changes?</h3>
                        <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', marginBottom: 20 }}>
                            Are you sure you want to save your changes to this post?
                        </p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                            <button
                                onClick={() => setConfirmSaveId(null)}
                                className="ln-btn-sm"
                                style={{ padding: '8px 24px', borderRadius: 20, fontSize: 14 }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleSaveEdit(confirmSaveId)}
                                className="ln-btn-sm ln-btn-primary"
                                style={{ padding: '8px 24px', borderRadius: 20, fontSize: 14, fontWeight: 600 }}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {jobMediaModal && (
                <div className="modal-overlay" style={{ background: 'rgba(0, 0, 0, 0.82)' }} onClick={closeJobMediaModal}>
                    <div
                        className="ln-modal"
                        onClick={e => e.stopPropagation()}
                        style={{ width: '96%', maxWidth: 1240, height: '90vh', maxHeight: 920, padding: 0, overflow: 'hidden', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', borderRadius: 14, background: '#0f172a' }}
                    >
                        <div style={{ background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                            <button
                                onClick={closeJobMediaModal}
                                style={{ position: 'absolute', top: 12, left: 12, width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'rgba(17,24,39,0.7)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <X size={18} />
                            </button>
                            {jobMediaModal.attachmentUrl && isImageAttachment(jobMediaModal.attachmentUrl, jobMediaModal.attachmentType) ? (
                                <img src={jobMediaModal.attachmentUrl} alt={jobMediaModal.attachmentName || 'Opportunity media'} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : jobMediaModal.attachmentUrl ? (
                                <a href={jobMediaModal.attachmentUrl} target="_blank" rel="noreferrer" style={{ color: '#93c5fd', textDecoration: 'none', display: 'inline-flex', gap: 8, alignItems: 'center', background: '#111827', border: '1px solid #334155', borderRadius: 10, padding: '12px 14px' }}>
                                    <FileText size={18} />
                                    {jobMediaModal.attachmentName || 'Open attachment'}
                                </a>
                            ) : (
                                <div style={{ color: '#94a3b8', fontSize: 13 }}>No media attachment for this opportunity.</div>
                            )}
                        </div>

                        <div style={{ background: '#ffffff', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                            <div style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{jobMediaModal.companyName}</div>
                                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{jobMediaModal.industry} • {jobMediaModal.location} • {timeAgo(jobMediaModal.created_at || jobMediaModal.createdAt || jobMediaModal.datePosted)}</div>
                                        <div style={{ marginTop: 8, fontSize: 16, fontWeight: 700, color: '#111827' }}>{jobMediaModal.title}</div>
                                        <div style={{ marginTop: 4, fontSize: 13, color: '#475569', whiteSpace: 'pre-wrap' }}>{jobMediaModal.description}</div>
                                    </div>
                                    <button
                                        onClick={closeJobMediaModal}
                                        style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #d1d5db', background: '#fff', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                                        aria-label="Close"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ padding: '10px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}>
                                <span>{jobMediaComments.length} comments</span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6, padding: 10, borderBottom: '1px solid #e5e7eb' }}>
                                <button className="ln-feed-action-btn" onClick={() => jobMediaCommentInputRef.current?.focus()} style={{ justifyContent: 'center' }}>
                                    <MessageSquare size={15} /> Comment
                                </button>
                            </div>

                            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {jobMediaComments.length > 0 ? jobMediaComments.map(comment => {
                                    const commentAuthorName = comment.author_id === currentUser?.id
                                        ? (currentUser?.name || trainee?.name || 'You')
                                        : comment.author_type === 'student'
                                            ? (trainees.find(t => t.id === comment.author_id)?.name || 'Trainee')
                                            : (partners.find(p => p.id === comment.author_id)?.companyName || 'Industry Partner');
                                    const isOwnComment = comment.author_id === currentUser?.id;
                                    const isEditing = editingJobMediaCommentId === comment.id;
                                    const isMenuOpen = jobMediaCommentMenuId === comment.id;

                                    return (
                                        <div key={comment.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 10px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{commentAuthorName}</div>
                                                {isOwnComment && !isEditing && (
                                                    <div style={{ position: 'relative' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setJobMediaCommentMenuId(isMenuOpen ? null : comment.id)}
                                                            style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', padding: '0 4px', fontSize: 18, lineHeight: 1, borderRadius: 4 }}
                                                            aria-label="Comment options"
                                                        >
                                                            ···
                                                        </button>
                                                        {isMenuOpen && (
                                                            <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 200, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 4px 14px rgba(0,0,0,0.13)', minWidth: 110, padding: '4px 0' }}>
                                                                <button type="button" onClick={() => { startEditingJobMediaComment(comment); setJobMediaCommentMenuId(null); }} style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: '8px 14px', fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                                                                    Edit
                                                                </button>
                                                                <button type="button" onClick={() => { handleDeleteJobMediaComment(comment.id); setJobMediaCommentMenuId(null); }} style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: '8px 14px', fontSize: 13, fontWeight: 600, color: '#b91c1c', cursor: 'pointer' }}>
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            {isEditing ? (
                                                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                    <textarea
                                                        value={jobMediaEditInput}
                                                        onChange={e => setJobMediaEditInput(e.target.value)}
                                                        maxLength={1000}
                                                        style={{ width: '100%', minHeight: 72, border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', color: '#334155' }}
                                                    />
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                                        <button type="button" onClick={cancelEditingJobMediaComment} disabled={jobMediaCommentSaving} style={{ border: '1px solid #cbd5e1', background: '#fff', color: '#334155', borderRadius: 9999, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                                            Cancel
                                                        </button>
                                                        <button type="button" onClick={saveEditedJobMediaComment} disabled={!jobMediaEditInput.trim() || jobMediaCommentSaving} style={{ border: 'none', background: '#0a66c2', color: '#fff', borderRadius: 9999, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: !jobMediaEditInput.trim() || jobMediaCommentSaving ? 'not-allowed' : 'pointer', opacity: !jobMediaEditInput.trim() || jobMediaCommentSaving ? 0.6 : 1 }}>
                                                            {jobMediaCommentSaving ? 'Saving...' : 'Save'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: 13, color: '#334155', whiteSpace: 'pre-wrap' }}>{comment.content}</div>
                                            )}
                                            <div style={{ marginTop: 3, fontSize: 11, color: '#94a3b8' }}>{timeAgo(comment.created_at || comment.createdAt)}</div>
                                        </div>
                                    );
                                }) : (
                                    <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 20 }}>No comments yet.</div>
                                )}
                            </div>

                            <div style={{ borderTop: '1px solid #e5e7eb', padding: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                                <input
                                    ref={jobMediaCommentInputRef}
                                    value={jobMediaCommentInput}
                                    onChange={e => setJobMediaCommentInput(e.target.value)}
                                    maxLength={1000}
                                    placeholder={`Comment as ${currentUser?.name || trainee?.name || 'You'}`}
                                    style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: 9999, padding: '10px 12px', fontSize: 13 }}
                                />
                                <button className="ln-btn ln-btn-primary" onClick={submitJobMediaComment} disabled={!jobMediaCommentInput.trim()}>
                                    <Send size={14} /> Send
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {contactTarget && (
                <div className="modal-overlay" onClick={closeContactModal}>
                    <div className="ln-modal" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, background: '#ffffff', color: '#0f172a', borderRadius: 18, padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '18px 22px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: 20, fontWeight: 800 }}>Contact {contactRecipientName}</div>
                                <div style={{ marginTop: 4, fontSize: 13, color: '#64748b' }}>
                                    {contactRequiresResume ? 'Send a message and attach your resume.' : 'Send a message and optionally attach a document.'}
                                </div>
                            </div>
                            <button className="ln-btn-icon" onClick={closeContactModal}><X size={18} /></button>
                        </div>

                        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase', color: '#64748b', marginBottom: 6 }}>Context</div>
                                <div style={{ fontSize: 14, color: '#0f172a', whiteSpace: 'pre-wrap' }}>{contactTarget.sourceLabel || 'Community post contact'}</div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Message</label>
                                <textarea
                                    value={contactMessage}
                                    onChange={e => setContactMessage(e.target.value)}
                                    maxLength={1000}
                                    placeholder={`Write your message to ${contactRecipientName}...`}
                                    style={{ width: '100%', minHeight: 130, borderRadius: 14, border: '1px solid #cbd5e1', padding: '14px 16px', resize: 'vertical', outline: 'none', fontFamily: 'inherit', fontSize: 14, lineHeight: 1.5, background: '#ffffff', color: '#0f172a' }}
                                />
                                <div style={{ marginTop: 6, fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>{contactMessage.length}/1000</div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                                    {contactRequiresResume ? 'Resume Upload' : 'Document Upload'}
                                </label>
                                <input ref={contactFileInputRef} type="file" onChange={handleContactAttachmentChange} style={{ display: 'none' }} />
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <button type="button" className="ln-btn ln-btn-outline" onClick={() => contactFileInputRef.current?.click()}>
                                        <Upload size={14} /> {contactRequiresResume ? 'Upload Resume' : 'Choose File'}
                                    </button>
                                    <span style={{ fontSize: 13, color: contactAttachment ? '#0f172a' : '#64748b' }}>
                                        {contactAttachment ? contactAttachment.name : (contactRequiresResume ? 'Resume is required.' : 'No file selected.')}
                                    </span>
                                </div>
                                <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
                                    {contactRequiresResume ? 'Required for student-to-partner contact.' : 'Optional for this contact type.'}
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '16px 22px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#ffffff' }}>
                            <button className="ln-btn ln-btn-outline" onClick={closeContactModal} disabled={contactSubmitting}>Cancel</button>
                            <button className="ln-btn ln-btn-primary" onClick={handleSubmitContact} disabled={contactSubmitting || !contactMessage.trim() || (contactRequiresResume && !contactAttachment)}>
                                <Send size={14} /> {contactSubmitting ? 'Sending...' : 'Send Contact'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {commentModalPost && (
                <div className="modal-overlay" style={{ background: 'rgba(0, 0, 0, 0.78)', backdropFilter: 'blur(2px)' }} onClick={() => setCommentModalPost(null)}>
                    <div
                        className="ln-modal"
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: '96%',
                            maxWidth: 740,
                            height: '92vh',
                            maxHeight: 940,
                            padding: 0,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            background: '#1f2329',
                            border: '1px solid #343a40',
                            borderRadius: 16,
                            color: '#e4e6eb'
                        }}
                    >
                        <div style={{ height: 60, borderBottom: '1px solid #343a40', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 700, color: '#f1f5f9' }}>
                            {modalAuthorName}'s Post
                            <button
                                onClick={() => setCommentModalPost(null)}
                                style={{ position: 'absolute', right: 12, top: 12, width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#3a3f45', color: '#e5e7eb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ flex: '0 0 56%', minHeight: 320, display: 'flex', flexDirection: 'column', borderBottom: '1px solid #343a40' }}>
                            <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div className="ln-feed-avatar" style={{ width: 34, height: 34 }}>
                                    {(modalAuthor?.photo || modalAuthor?.company_logo_url)
                                        ? <img src={modalAuthor.photo || modalAuthor.company_logo_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                        : (modalAuthorName?.charAt(0) || 'U')}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 13.5, color: '#f1f5f9' }}>{modalAuthorName}</div>
                                    <div style={{ fontSize: 11.5, color: '#9ca3af' }}>{timeAgo(commentModalPost.created_at)}</div>
                                </div>
                            </div>

                            <div style={{ padding: '0 12px 10px', color: '#e5e7eb', fontSize: 14.5, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                {commentModalPost.content}
                            </div>

                            <div style={{ flex: 1, minHeight: 0, background: '#111418', borderTop: '1px solid #343a40', borderBottom: '1px solid #343a40', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                {commentModalPost.media_url ? (
                                    commentModalPost.media_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                        <img src={commentModalPost.media_url} alt="Post media" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    ) : (
                                        <a
                                            href={commentModalPost.media_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ minWidth: 260, minHeight: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#dbeafe', background: '#2c3138', border: '1px solid #4b5563', borderRadius: 12, padding: '14px 18px', textDecoration: 'none', fontWeight: 600, fontSize: 13 }}
                                        >
                                            <FileText size={28} />
                                            Open attached document
                                        </a>
                                    )
                                ) : (
                                    <div style={{ width: '100%', height: '100%' }} />
                                )}
                            </div>

                            <div style={{ padding: '8px 12px', borderTop: '1px solid #343a40' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#b6bec9', fontSize: 12.5, marginBottom: 8 }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Heart size={14} fill="#ef4444" color="#ef4444" /> {modalComments.length} comment{modalComments.length === 1 ? '' : 's'}</span>
                                    <span>{commentModalPost.media_url ? '1 attachment' : 'No attachment'}</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
                                    <button
                                        onClick={() => canContactModalAuthor && openContactModal({
                                            recipientId: commentModalPost.author_id,
                                            recipientType: commentModalPost.author_type,
                                            recipientName: modalAuthorName,
                                            postId: commentModalPost.id,
                                            sourceLabel: commentModalPost.content,
                                        })}
                                        disabled={!canContactModalAuthor}
                                        style={{ background: canContactModalAuthor ? '#ffffff' : '#2d333b', border: 'none', color: canContactModalAuthor ? '#111827' : '#9ca3af', fontWeight: 700, padding: '9px 10px', borderRadius: 10, display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: 6, cursor: canContactModalAuthor ? 'pointer' : 'not-allowed' }}
                                    >
                                        <MessageSquare size={16} /> {canContactModalAuthor ? 'Contact' : 'Your Post'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div style={{ flex: '1 1 44%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {modalComments.length > 0 ? modalComments.map(comment => {
                                    const commentAuthorName = comment.author_id === currentUser?.id
                                        ? (currentUser.name || trainee?.name || 'You')
                                        : comment.author_type === 'student'
                                            ? (trainees.find(t => t.id === comment.author_id)?.name || 'Trainee')
                                            : (partners.find(p => p.id === comment.author_id)?.companyName || 'Industry Partner');

                                    return (
                                        <div key={comment.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                            <div className="ln-feed-avatar" style={{ width: 30, height: 30, flexShrink: 0 }}>{commentAuthorName?.charAt(0) || 'U'}</div>
                                            <div style={{ background: '#3a3b3c', borderRadius: 14, padding: '8px 11px', flex: 1 }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: '#f3f4f6', marginBottom: 2 }}>{commentAuthorName}</div>
                                                <div style={{ fontSize: 13.2, color: '#d1d5db', whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>{comment.content}</div>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#9ca3af' }}>
                                        <FileText size={56} color="#94a3b8" />
                                        <div style={{ fontSize: 34, fontWeight: 700, color: '#d1d5db' }}>No comments yet</div>
                                        <div style={{ fontSize: 17 }}>Be the first to comment.</div>
                                    </div>
                                )}
                            </div>

                            <div style={{ borderTop: '1px solid #343a40', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                    <div className="ln-feed-avatar" style={{ width: 32, height: 32, flexShrink: 0, fontSize: 13 }}>
                                        {(trainee?.photo)
                                            ? <img src={trainee.photo} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                            : (currentUser?.name || trainee?.name || 'T').charAt(0).toUpperCase()}
                                    </div>

                                    <div style={{ flex: 1, background: '#3a3b3c', borderRadius: 20, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <textarea
                                            placeholder={`Comment as ${currentUser?.name || trainee?.name || 'Trainee'}`}
                                            value={commentInput}
                                            onChange={e => setCommentInput(e.target.value)}
                                            maxLength={1000}
                                            style={{ width: '100%', minHeight: 24, maxHeight: 78, resize: 'none', border: 'none', outline: 'none', background: 'transparent', color: '#f3f4f6', fontSize: 16, lineHeight: 1.3, fontFamily: 'inherit' }}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: '#9ca3af' }}>
                                                <MessageSquare size={14} />
                                                <Camera size={14} />
                                                <FileText size={14} />
                                            </div>
                                            <button
                                                onClick={handleSubmitComment}
                                                disabled={commentSubmitting || !commentInput.trim()}
                                                style={{ background: 'transparent', border: 'none', color: (commentSubmitting || !commentInput.trim()) ? '#6b7280' : '#60a5fa', cursor: (commentSubmitting || !commentInput.trim()) ? 'not-allowed' : 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }}
                                            >
                                                <Send size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'left', marginLeft: 40 }}>{commentInput.length}/1000</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

class ErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { hasError: false, error: null }; }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    componentDidCatch(error, errorInfo) { console.error("ErrorBoundary caught:", error, errorInfo); }
    render() {
        if (this.state.hasError) {
            return <div style={{ padding: 20, color: 'red' }}><h1>Something went wrong.</h1><pre>{this.state.error.toString()}</pre></div>;
        }
        return this.props.children;
    }
}

// ─── PAGE 2: PROFILE ─────────────────────────────────────────────
const TraineeProfileContent = () => {
    const { currentUser, trainees, updateTrainee } = useApp();
    const trainee = currentUser || trainees[0];
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ ...trainee });
    const initials = (trainee?.name || '').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T';

    // Skills state
    const [newSkill, setNewSkill] = useState('');

    // Interests state
    const [newInterest, setNewInterest] = useState('');
    const [interestsList, setInterestsList] = useState(trainee?.interests || []);

    // Certification state
    const [certs, setCerts] = useState(trainee?.certifications?.map(c => typeof c === 'string' ? { name: c, org: '', issue: '', exp: '', credId: '', url: '' } : c) || []);
    const [savingCerts, setSavingCerts] = useState(false);

    // Education state
    const [educHistory, setEducHistory] = useState(trainee?.educHistory || []);
    const [savingEduc, setSavingEduc] = useState(false);

    // Work Experience state
    const [workExperience, setWorkExperience] = useState(trainee?.workExperience || []);
    const [savingWork, setSavingWork] = useState(false);

    // Training Status state
    const [editingTraining, setEditingTraining] = useState(false);
    const [trainingForm, setTrainingForm] = useState({
        trainingStatus: trainee?.trainingStatus || 'Student',
        graduationYear: trainee?.graduationYear || '',
    });

    // Employment state
    const [editingEmployment, setEditingEmployment] = useState(false);
    const [empForm, setEmpForm] = useState({
        employmentStatus: (trainee?.employmentStatus === 'Unemployed' ? 'Not Employed' : trainee?.employmentStatus) || 'Not Employed',
        employer: trainee?.employer || '',
        jobTitle: trainee?.jobTitle || '',
        dateHired: trainee?.dateHired || '',
    });

    // Profile photo & banner state
    const profilePicRef = useRef(null);
    const bannerInputRef = useRef(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);

    // Documents state
    const [documents, setDocuments] = useState([]);
    const [docLabel, setDocLabel] = useState('');
    const [docFile, setDocFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const fileInputRef = useRef(null);

    // Confirm dialog state
    const [confirmDialog, setConfirmDialog] = useState({ open: false, message: '', onConfirm: null });
    const showConfirm = (message, onConfirm) => setConfirmDialog({ open: true, message, onConfirm });
    const closeConfirm = () => setConfirmDialog({ open: false, message: '', onConfirm: null });
    const resumeInputRef = useRef(null);
    const [resume, setResume] = useState(null);
    const [uploadingResume, setUploadingResume] = useState(false);

    // ─── Photo upload handler ──────────────────────────────
    const handlePhotoUpload = async (file) => {
        if (!file || !trainee?.id) return;
        const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!allowed.includes(file.type)) { alert('Please upload PNG, JPG, or WEBP images only.'); return; }
        setUploadingPhoto(true);
        try {
            const ext = file.name.split('.').pop();
            const path = `avatars/${trainee.id}/${Date.now()}_profile.${ext}`;
            const { error: uploadErr } = await supabase.storage
                .from('registration-uploads')
                .upload(path, file, { contentType: file.type, upsert: true });
            if (uploadErr) throw uploadErr;
            const { data: urlData } = supabase.storage.from('registration-uploads').getPublicUrl(path);
            const publicUrl = urlData?.publicUrl;
            if (publicUrl) {
                await updateTrainee(trainee.id, { photo: publicUrl });
            }
        } catch (err) {
            console.error('Photo upload error:', err);
            alert('Failed to upload photo.');
        } finally {
            setUploadingPhoto(false);
        }
    };

    // ─── Banner upload handler ─────────────────────────────
    const handleBannerUpload = async (file) => {
        if (!file || !trainee?.id) return;
        const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!allowed.includes(file.type)) { alert('Please upload PNG, JPG, or WEBP images only.'); return; }
        setUploadingBanner(true);
        try {
            const ext = file.name.split('.').pop();
            const path = `banners/${trainee.id}/${Date.now()}_banner.${ext}`;
            const { error: uploadErr } = await supabase.storage
                .from('registration-uploads')
                .upload(path, file, { contentType: file.type, upsert: true });
            if (uploadErr) throw uploadErr;
            const { data: urlData } = supabase.storage.from('registration-uploads').getPublicUrl(path);
            const publicUrl = urlData?.publicUrl;
            if (publicUrl) {
                await updateTrainee(trainee.id, { bannerUrl: publicUrl });
            }
        } catch (err) {
            console.error('Banner upload error:', err);
            alert('Failed to upload banner.');
        } finally {
            setUploadingBanner(false);
        }
    };

    // ─── Dynamic Arrays Handlers ────────────────────────────
    const updateCert = (idx, field, val) => { const arr = [...certs]; arr[idx][field] = val; setCerts(arr); };
    const addCertObj = () => setCerts(prev => [...prev, { name: '', org: '', issue: '', exp: '', credId: '', url: '', noExp: false }]);
    const removeCertIdx = (idx) => { setCerts(prev => prev.filter((_, i) => i !== idx)); };
    const saveCerts = async () => { setSavingCerts(true); await updateTrainee(trainee.id, { certifications: certs }); setSavingCerts(false); };

    const updateEduc = (idx, field, val) => { const arr = [...educHistory]; arr[idx][field] = val; setEducHistory(arr); };
    const addEducObj = () => setEducHistory(prev => [...prev, { school: '', degree: '', from: '', to: '' }]);
    const removeEducIdx = (idx) => { setEducHistory(prev => prev.filter((_, i) => i !== idx)); };
    const saveEduc = async () => { setSavingEduc(true); await updateTrainee(trainee.id, { educHistory }); setSavingEduc(false); };

    const updateWork = (idx, field, val) => { const arr = [...workExperience]; arr[idx][field] = val; setWorkExperience(arr); };
    const addWorkObj = () => setWorkExperience(prev => [...prev, { company: '', position: '', from: '', to: '' }]);
    const removeWorkIdx = (idx) => { setWorkExperience(prev => prev.filter((_, i) => i !== idx)); };
    const saveWork = async () => { setSavingWork(true); await updateTrainee(trainee.id, { workExperience }); setSavingWork(false); };

    // Fetch documents on mount
    useEffect(() => {
        if (trainee?.id) {
            fetch(`/api/documents/${trainee.id}`)
                .then(r => {
                    if (!r.ok) throw new Error(`Server returned ${r.status}`);
                    return r.json();
                })
                .then(data => {
                    if (data.success) {
                        const resumeDoc = data.documents.find(d => d.category === 'document' && d.label === 'Resume');
                        if (resumeDoc) {
                            setResume(resumeDoc);
                        } else if (data.registrationResumeUrl) {
                            setResume({ file_url: data.registrationResumeUrl, file_name: 'Resume', label: 'Resume', category: 'document' });
                        }
                        setDocuments(data.documents.filter(d => d.label !== 'Resume'));
                    }
                })
                .catch(err => console.error('Fetch docs error:', err));
        }
    }, [trainee?.id]);

    const save = async () => {
        // --- VALIDATION ---
        const errors = [];

        // 1. Basic Info
        if (!form.name?.trim()) errors.push('Full Name is required.');
        if (!form.email?.trim()) errors.push('Contact Email is required.');

        // 2. Birthday validation
        if (form.birthday) {
            const bd = new Date(form.birthday);
            const today = new Date();
            let age = today.getFullYear() - bd.getFullYear();
            const m = today.getMonth() - bd.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
            if (age < 15) errors.push('You must be at least 15 years old.');
        }

        // 3. Employment Info
        if (empForm.employmentStatus === 'Employed') {
            if (!empForm.employer?.trim()) errors.push('Employer/Company is required when Employed.');
            if (!empForm.jobTitle?.trim()) errors.push('Job Title is required when Employed.');
            if (!empForm.dateHired) errors.push('Date Hired is required when Employed.');
        }

        // 4. Educational History
        educHistory.forEach((edu, i) => {
            if (!String(edu.school || '').trim() || !String(edu.degree || '').trim() || !String(edu.from || '').trim() || !String(edu.to || '').trim()) {
                errors.push(`Please fill all fields for Education #${i + 1}.`);
            }
        });

        // 5. Work Experience
        workExperience.forEach((work, i) => {
            if (!String(work.company || '').trim() || !String(work.position || '').trim() || !String(work.from || '').trim() || !String(work.to || '').trim()) {
                errors.push(`Please fill all fields for Work Experience #${i + 1}.`);
            }
        });

        // 6. Certifications
        certs.forEach((cert, i) => {
            if (!String(cert.name || '').trim() || !String(cert.org || '').trim() || !String(cert.issue || '').trim()) {
                errors.push(`Please fill Name, Org, and Issue Date for Certification #${i + 1}.`);
            }
            if (!cert.noExp && !cert.exp) {
                errors.push(`Expiration Date is required for Certification #${i + 1} (unless "Does not expire" is checked).`);
            }
        });

        if (errors.length > 0) {
            alert("Please fix the following issues before saving:\n\n• " + errors.join('\n• '));
            return;
        }

        setSaving(true);
        try {
            await updateTrainee(trainee.id, {
                ...form,
                trainingStatus: trainingForm.trainingStatus,
                graduationYear: trainingForm.trainingStatus === 'Graduated' ? trainingForm.graduationYear : '',
                ...empForm,
                educHistory,
                workExperience,
                certifications: certs,
                interests: interestsList,
            });
            console.log('Saved in supabase');
            setEditing(false);
        } catch (err) {
            console.error('Save error:', err);
            alert('Failed to save profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const saveEmployment = async () => {
        await updateTrainee(trainee.id, {
            ...empForm,
            monthsAfterGraduation: empForm.dateHired ? Math.round((new Date() - new Date(empForm.dateHired)) / (1000 * 60 * 60 * 24 * 30)) : null
        });
        setEditingEmployment(false);
    };

    const addSkill = () => {
        if (!newSkill.trim()) return;
        const currentSkills = form.skills || [];
        if (currentSkills.includes(newSkill.trim())) { setNewSkill(''); return; }
        const updatedSkills = [...currentSkills, newSkill.trim()];
        setForm({ ...form, skills: updatedSkills });
        setNewSkill('');
    };

    const removeSkill = (skill) => {
        const updatedSkills = (form.skills || []).filter(s => s !== skill);
        setForm({ ...form, skills: updatedSkills });
    };

    const addInterest = () => {
        if (!newInterest.trim()) return;
        if (interestsList.includes(newInterest.trim())) { setNewInterest(''); return; }
        const updated = [...interestsList, newInterest.trim()];
        setInterestsList(updated);
        setNewInterest('');
    };

    const removeInterest = (interest) => {
        const updated = interestsList.filter(i => i !== interest);
        setInterestsList(updated);
    };

    const handleDocUpload = async () => {
        if (!docFile || !docLabel.trim()) return;
        setUploading(true);
        try {
            const reader = new FileReader();
            reader.onload = async () => {
                const base64 = reader.result.split(',')[1];
                const res = await fetch(`/api/documents/upload`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        traineeId: trainee.id,
                        label: docLabel.trim(),
                        fileName: docFile.name,
                        fileType: docFile.type,
                        fileData: base64,
                    }),
                });
                const result = await res.json();
                if (result.success) {
                    setDocuments(prev => [result.document, ...prev]);
                    setDocLabel('');
                    setDocFile(null);
                    setShowUploadForm(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                } else {
                    alert(result.error || 'Upload failed.');
                }
                setUploading(false);
            };
            reader.readAsDataURL(docFile);
        } catch (err) {
            console.error('Upload error:', err);
            alert('Failed to upload document.');
            setUploading(false);
        }
    };

    const deleteDoc = async (docId) => {

        try {
            const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
                setDocuments(prev => prev.filter(d => d.id !== docId));
                alert('Document successfully deleted.');
            } else {
                alert(`Delete failed: ${result.error}`);
            }
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to connect to the server to delete document.');
        }
    };

    const statusColors = {
        'Employed': '#057642',
        'Not Employed': '#cc1016',
        'Seeking Employment': '#0a66c2'
    };

    const handleResumeUpload = async (file) => {
        if (!file) return;
        const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowed.includes(file.type)) { alert('Only PDF, DOC, DOCX files allowed.'); return; }
        setUploadingResume(true);
        try {
            // Delete old resume if exists
            if (resume?.id) {
                await fetch(`/api/documents/${resume.id}`, { method: 'DELETE' });
            }
            const reader = new FileReader();
            reader.onload = async () => {
                const base64 = reader.result.split(',')[1];
                const res = await fetch(`/api/documents/upload`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        traineeId: trainee.id,
                        label: 'Resume',
                        fileName: file.name,
                        fileType: file.type,
                        fileData: base64,
                    }),
                });
                const result = await res.json();
                if (result.success) {
                    setResume(result.document);
                } else { alert(result.error || 'Upload failed.'); }
                setUploadingResume(false);
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error('Resume upload error:', err);
            setUploadingResume(false);
        }
    };

    return (
        <form className="ln-profile-page" style={{ position: 'relative' }} onSubmit={(e) => { e.preventDefault(); if (editing) save(); }}>
            {/* Saving overlay */}
            {saving && (
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 50,
                    background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(2px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 12,
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <Loader size={32} color="#0a66c2" style={{ animation: 'ocr-spin 0.8s linear infinite' }} />
                        <span style={{ fontSize: 15, fontWeight: 600, color: '#1e3a5f' }}>Saving profile...</span>
                    </div>
                </div>
            )}
            {/* Hidden file inputs */}
            <input ref={profilePicRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { handlePhotoUpload(e.target.files[0]); e.target.value = ''; }} />
            <input ref={bannerInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { handleBannerUpload(e.target.files[0]); e.target.value = ''; }} />

            {/* Confirm Dialog */}
            {confirmDialog.open && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} onClick={closeConfirm}>
                    <div style={{
                        background: 'white', borderRadius: 14, padding: '28px 32px', minWidth: 340, maxWidth: 420,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.25)', textAlign: 'center',
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ marginBottom: 20 }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: '50%', background: '#fef2f2',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
                            }}>
                                <Trash2 size={22} color="#cc1016" />
                            </div>
                            <p style={{ fontSize: 15, color: '#1e293b', fontWeight: 500, margin: 0, lineHeight: 1.5 }}>{confirmDialog.message}</p>
                        </div>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                            <button type="button" onClick={closeConfirm} style={{
                                padding: '9px 24px', borderRadius: 8, border: '1px solid #d1d5db',
                                background: 'white', color: '#475569', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                            }}>Cancel</button>
                            <button type="button" onClick={() => { confirmDialog.onConfirm(); closeConfirm(); }} style={{
                                padding: '9px 24px', borderRadius: 8, border: 'none',
                                background: '#cc1016', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                            }}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Header Card */}
            <div className="ln-card ln-profile-header-card">
                <div className="ln-profile-header-banner" style={trainee?.bannerUrl ? {
                    backgroundImage: `url(${trainee.bannerUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                } : {}}>
                    <button type="button" className="ln-banner-change-btn" onClick={() => bannerInputRef.current?.click()} disabled={uploadingBanner}
                        style={{
                            position: 'absolute', top: 12, right: 12,
                            background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 8,
                            color: 'white', padding: '6px 12px', fontSize: 12, fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                            transition: 'background 0.2s',
                        }}>
                        <Camera size={14} /> {uploadingBanner ? 'Uploading...' : 'Change Banner'}
                    </button>
                </div>
                <div className="ln-profile-header-body">
                    <div className="ln-profile-header-avatar" style={{
                        position: 'relative', cursor: 'pointer',
                        ...(trainee?.photo ? {
                            backgroundImage: `url(${trainee.photo})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            fontSize: 0,
                        } : {})
                    }} onClick={() => profilePicRef.current?.click()}>
                        {!trainee?.photo && initials}
                        <div style={{
                            position: 'absolute', bottom: 0, right: 0,
                            width: 28, height: 28, borderRadius: '50%',
                            background: '#0a66c2', border: '2px solid white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Camera size={13} color="white" />
                        </div>
                        {uploadingPhoto && (
                            <div style={{
                                position: 'absolute', inset: 0, borderRadius: '50%',
                                background: 'rgba(0,0,0,0.5)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Loader size={20} color="white" style={{ animation: 'ocr-spin 0.8s linear infinite' }} />
                            </div>
                        )}
                    </div>
                    <div className="ln-profile-header-info">
                        <div className="ln-profile-header-top">
                            <div>
                                <h1 className="ln-profile-header-name">{trainee?.name}</h1>
                                <p className="ln-profile-header-headline">TESDA Trainee &bull; {(trainee?.certifications?.length > 0) ? trainee.certifications.map(c => typeof c === 'string' ? c : c.name).slice(0, 2).join(', ') : 'No certifications yet'}</p>
                                <p className="ln-profile-header-loc"><MapPin size={14} /> {trainee?.address || 'Philippines'} &bull; Class of {trainee?.graduationYear}</p>
                                <p className="ln-profile-header-contact">{trainee?.email}</p>
                            </div>
                            {!editing ? (
                                <button type="button" className="ln-btn ln-btn-primary" onClick={() => setEditing(true)} disabled={saving}>
                                    <Edit size={15} /> Edit Profile
                                </button>
                            ) : (
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button type="button" className="ln-btn" style={{ background: '#e2e8f0', color: '#475569' }} onClick={() => {
                                        setForm({ ...trainee });
                                        setTrainingForm({ trainingStatus: trainee?.trainingStatus || 'Student', graduationYear: trainee?.graduationYear || '' });
                                        setEmpForm({ employmentStatus: (trainee?.employmentStatus === 'Unemployed' ? 'Not Employed' : trainee?.employmentStatus) || 'Not Employed', employer: trainee?.employer || '', jobTitle: trainee?.jobTitle || '', dateHired: trainee?.dateHired || '' });
                                        setEducHistory(trainee?.educHistory || []);
                                        setWorkExperience(trainee?.workExperience || []);
                                        setCerts(trainee?.certifications?.map(c => typeof c === 'string' ? { name: c, org: '', issue: '', exp: '', credId: '', url: '' } : c) || []);
                                        setInterestsList(trainee?.interests || []);
                                        setEditing(false);
                                    }} disabled={saving}>
                                        <X size={15} /> Cancel
                                    </button>
                                    <button type="submit" className="ln-btn ln-btn-success" disabled={saving}>
                                        {saving ? <><Loader size={15} style={{ animation: 'ocr-spin 0.8s linear infinite' }} /> Saving...</> : <><CheckCircle size={15} /> Save Changes</>}
                                    </button>
                                </div>
                            )}
                        </div>
                        {/* Resume section — bottom right */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                            <input
                                ref={resumeInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx"
                                style={{ display: 'none' }}
                                onChange={e => { handleResumeUpload(e.target.files[0]); e.target.value = ''; }}
                            />
                            {resume ? (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '8px 14px', background: '#f0f7ff', borderRadius: 10,
                                    border: '1px solid #cce0f5', fontSize: 13
                                }}>
                                    <FileText size={16} color="#0a66c2" />
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, color: '#1e3a5f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>{resume.file_name}</div>
                                        <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)' }}>Resume / CV</div>
                                    </div>
                                    <a href={resume.file_url} target="_blank" rel="noreferrer" className="ln-btn-sm ln-btn-outline" style={{ flexShrink: 0 }}><Eye size={12} /></a>
                                    {editing && (
                                        <button type="button" className="ln-btn-sm ln-btn-outline" onClick={() => resumeInputRef.current?.click()} style={{ flexShrink: 0 }} disabled={uploadingResume}>
                                            <Upload size={12} /> {uploadingResume ? '...' : 'Update'}
                                        </button>
                                    )}
                                </div>
                            ) : editing ? (
                                <button
                                    type="button"
                                    className="ln-btn-sm ln-btn-outline"
                                    onClick={() => resumeInputRef.current?.click()}
                                    disabled={uploadingResume}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13 }}
                                >
                                    <Upload size={14} /> {uploadingResume ? 'Uploading...' : 'Upload Resume / CV'}
                                </button>
                            ) : (
                                <div style={{ fontSize: 13, color: '#94a3b8' }}>No resume uploaded</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="ln-profile-two-col">
                <div className="ln-profile-main">
                    {/* Personal Info */}
                    <div className="ln-card">
                        <div className="ln-section-header"><h3>Personal Information</h3></div>
                        <div className="ln-info-grid">
                            {[
                                { label: 'Full Name', key: 'name', type: 'text', required: true, maxLength: 100 },
                                { label: 'Contact Email', key: 'email', type: 'email', required: true },
                                { label: 'Address', key: 'address', type: 'text', maxLength: 150 },
                                { label: 'Birthday', key: 'birthday', type: 'date' },
                                { label: 'Gender', key: 'gender', type: 'select', options: ['Male', 'Female', 'Other'] },
                            ].map(f => (
                                <div key={f.key} className="ln-info-item">
                                    <label className="ln-info-label">
                                        {f.label}{f.required && editing && <span style={{ color: '#cc1016', marginLeft: 4 }}>*</span>}
                                    </label>
                                    {editing ? (
                                        f.type === 'select' ? (
                                            <select className="form-select" value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })}>
                                                {f.options.map(o => <option key={o}>{o}</option>)}
                                            </select>
                                        ) : (
                                            <input type={f.type} className="form-input" maxLength={f.maxLength} value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                                        )
                                    ) : (
                                        <div className="ln-info-value">{trainee?.[f.key] || '—'}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Training Status Section */}
                    <div className="ln-card">
                        <div className="ln-section-header">
                            <h3>Training Status</h3>
                        </div>
                        <div className="ln-info-grid">
                            <div className="ln-info-item">
                                <label className="ln-info-label">Status</label>
                                {editing ? (
                                    <select className="form-select" value={trainingForm.trainingStatus} onChange={e => {
                                        setTrainingForm({ ...trainingForm, trainingStatus: e.target.value, graduationYear: e.target.value === 'Student' ? '' : trainingForm.graduationYear });
                                    }}>
                                        <option value="Student">Current Student</option>
                                        <option value="Graduated">Graduated</option>
                                    </select>
                                ) : (
                                    <span className={`ln-badge ${trainee?.trainingStatus === 'Graduated' ? 'ln-badge-green' : 'ln-badge-blue'}`} style={{ fontSize: 13 }}>
                                        {trainee?.trainingStatus || 'Student'}
                                    </span>
                                )}
                            </div>
                            {(editing ? trainingForm.trainingStatus === 'Graduated' : trainee?.trainingStatus === 'Graduated') && (
                                <div className="ln-info-item">
                                    <label className="ln-info-label">Graduation Year</label>
                                    {editing ? (
                                        <input type="number" min="1990" max="2030" className="form-input" value={trainingForm.graduationYear || ''} onChange={e => setTrainingForm({ ...trainingForm, graduationYear: e.target.value })} placeholder="e.g. 2024" />
                                    ) : (
                                        <div className="ln-info-value">{trainee?.graduationYear || '—'}</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Employment Status Section */}
                    <div className="ln-card">
                        <div className="ln-section-header">
                            <h3>Employment Status</h3>
                        </div>
                        <div className="ln-info-grid">
                            <div className="ln-info-item">
                                <label className="ln-info-label">Status</label>
                                {editing ? (
                                    <select className="form-select" value={empForm.employmentStatus} onChange={e => setEmpForm({ ...empForm, employmentStatus: e.target.value })}>
                                        {['Employed', 'Not Employed', 'Seeking Employment'].map(s => <option key={s}>{s}</option>)}
                                    </select>
                                ) : (
                                    <span className={`ln-badge ${statusColors[trainee?.employmentStatus] === '#057642' ? 'ln-badge-green' : statusColors[trainee?.employmentStatus] === '#cc1016' ? 'ln-badge-red' : 'ln-badge-blue'}`} style={{ fontSize: 13 }}>
                                        {trainee?.employmentStatus || 'Unemployed'}
                                    </span>
                                )}
                            </div>
                            {(editing ? empForm.employmentStatus === 'Employed' : trainee?.employmentStatus === 'Employed') && (
                                <>
                                    <div className="ln-info-item">
                                        <label className="ln-info-label">Employer / Company{editing && <span style={{ color: '#cc1016', marginLeft: 4 }}>*</span>}</label>
                                        {editing ? <input type="text" required className="form-input" value={empForm.employer} onChange={e => setEmpForm({ ...empForm, employer: e.target.value })} placeholder="Company name" /> : <div className="ln-info-value">{trainee?.employer || '—'}</div>}
                                    </div>
                                    <div className="ln-info-item">
                                        <label className="ln-info-label">Job Title{editing && <span style={{ color: '#cc1016', marginLeft: 4 }}>*</span>}</label>
                                        {editing ? <input type="text" required className="form-input" value={empForm.jobTitle} onChange={e => setEmpForm({ ...empForm, jobTitle: e.target.value })} placeholder="Your position" /> : <div className="ln-info-value">{trainee?.jobTitle || '—'}</div>}
                                    </div>
                                    <div className="ln-info-item">
                                        <label className="ln-info-label">Date Hired{editing && <span style={{ color: '#cc1016', marginLeft: 4 }}>*</span>}</label>
                                        {editing ? <input type="date" required className="form-input" value={empForm.dateHired} onChange={e => setEmpForm({ ...empForm, dateHired: e.target.value })} /> : <div className="ln-info-value">{trainee?.dateHired || '—'}</div>}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Educational History Section */}
                    <div className="ln-card">
                        <div className="ln-section-header">
                            <h3>Educational History</h3>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {editing && (
                                    <button type="button" className="ln-btn-sm ln-btn-primary" onClick={addEducObj}>
                                        <Plus size={12} /> Add
                                    </button>
                                )}
                            </div>
                        </div>
                        {educHistory.map((edu, i) => (
                            <div key={i} style={{ padding: '16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', margin: '0 16px 16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <h4 style={{ margin: 0, fontSize: 13, color: '#475569' }}>Education #{i + 1}</h4>
                                    {editing && <button type="button" className="ln-link-btn" style={{ color: '#cc1016', fontSize: 12, padding: 0 }} onClick={(e) => { e.preventDefault(); showConfirm('Are you sure you want to remove this educational history?', () => removeEducIdx(i)); }}><Trash2 size={13} /> Remove</button>}
                                </div>
                                <div className="ln-info-grid" style={{ gap: 12 }}>
                                    <div className="ln-info-item" style={{ gridColumn: '1 / -1' }}>
                                        <label className="ln-info-label">School / University<span style={{ color: '#cc1016', marginLeft: 4 }}>*</span></label>
                                        <input type="text" required className="form-input" placeholder="School / University" maxLength={100} value={edu.school || ''} onChange={e => updateEduc(i, 'school', e.target.value)} />
                                    </div>
                                    <div className="ln-info-item" style={{ gridColumn: '1 / -1' }}>
                                        <label className="ln-info-label">Degree / Program<span style={{ color: '#cc1016', marginLeft: 4 }}>*</span></label>
                                        <input type="text" required className="form-input" placeholder="Degree / Program (e.g. BS Computer Science)" maxLength={100} value={edu.degree || ''} onChange={e => updateEduc(i, 'degree', e.target.value)} />
                                    </div>
                                    <div className="ln-info-item">
                                        <label className="ln-info-label">Year From<span style={{ color: '#cc1016', marginLeft: 4 }}>*</span></label>
                                        <input type="number" min="1950" max="2099" required className="form-input" placeholder="e.g. 2020" value={edu.from || ''} onChange={e => updateEduc(i, 'from', e.target.value)} />
                                    </div>
                                    <div className="ln-info-item">
                                        <label className="ln-info-label">Year To (or expected)<span style={{ color: '#cc1016', marginLeft: 4 }}>*</span></label>
                                        <input type="number" min="1950" max="2099" required className="form-input" placeholder="e.g. 2025" value={edu.to || ''} onChange={e => updateEduc(i, 'to', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Work Experience Section */}
                    <div className="ln-card">
                        <div className="ln-section-header">
                            <h3>Work Experience</h3>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {editing && (
                                    <button type="button" className="ln-btn-sm ln-btn-primary" onClick={addWorkObj}>
                                        <Plus size={12} /> Add
                                    </button>
                                )}
                            </div>
                        </div>
                        {workExperience.map((work, i) => (
                            <div key={i} style={{ padding: '16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', margin: '0 16px 16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <h4 style={{ margin: 0, fontSize: 13, color: '#475569' }}>Experience #{i + 1}</h4>
                                    {editing && <button type="button" className="ln-link-btn" style={{ color: '#cc1016', fontSize: 12, padding: 0 }} onClick={(e) => { e.preventDefault(); showConfirm('Are you sure you want to remove this work experience?', () => removeWorkIdx(i)); }}><Trash2 size={13} /> Remove</button>}
                                </div>
                                <div className="ln-info-grid" style={{ gap: 12 }}>
                                    <div className="ln-info-item" style={{ gridColumn: '1 / -1' }}>
                                        <label className="ln-info-label">Company / Organization<span style={{ color: '#cc1016', marginLeft: 4 }}>*</span></label>
                                        <input type="text" required className="form-input" placeholder="Company / Organization" maxLength={100} value={work.company || ''} onChange={e => updateWork(i, 'company', e.target.value)} />
                                    </div>
                                    <div className="ln-info-item" style={{ gridColumn: '1 / -1' }}>
                                        <label className="ln-info-label">Position / Role<span style={{ color: '#cc1016', marginLeft: 4 }}>*</span></label>
                                        <input type="text" required className="form-input" placeholder="Position / Role" maxLength={50} value={work.position || ''} onChange={e => updateWork(i, 'position', e.target.value)} />
                                    </div>
                                    <div className="ln-info-item">
                                        <label className="ln-info-label">Start Date<span style={{ color: '#cc1016', marginLeft: 4 }}>*</span></label>
                                        <input type="date" required className="form-input" title="Start Date" value={work.from || ''} onChange={e => updateWork(i, 'from', e.target.value)} />
                                    </div>
                                    <div className="ln-info-item">
                                        <label className="ln-info-label">End Date<span style={{ color: '#cc1016', marginLeft: 4 }}>*</span></label>
                                        <input type="date" required className="form-input" title="End Date" value={work.to || ''} onChange={e => updateWork(i, 'to', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Certifications Section */}
                    <div className="ln-card">
                        <div className="ln-section-header">
                            <h3>Licenses & Certifications</h3>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {editing && (
                                    <button type="button" className="ln-btn-sm ln-btn-primary" onClick={addCertObj}>
                                        <Plus size={12} /> Add
                                    </button>
                                )}
                            </div>
                        </div>
                        {certs.map((cert, i) => (
                            <div key={i} style={{ padding: '16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', margin: '0 16px 16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <h4 style={{ margin: 0, fontSize: 13, color: '#475569' }}>License/Cert #{i + 1}</h4>
                                    {editing && <button type="button" className="ln-link-btn" style={{ color: '#cc1016', fontSize: 12, padding: 0 }} onClick={(e) => { e.preventDefault(); showConfirm('Are you sure you want to remove this certification?', () => removeCertIdx(i)); }}><Trash2 size={13} /> Remove</button>}
                                </div>
                                <div className="ln-info-grid" style={{ gap: 12 }}>
                                    <div className="ln-info-item" style={{ gridColumn: '1 / -1' }}>
                                        <label className="ln-info-label" style={{ marginBottom: 4 }}>Certification / License Name<span style={{ color: '#cc1016', marginLeft: 4 }}>*</span></label>
                                        <input type="text" required className="form-input" placeholder="e.g. AWS Certified Solutions Architect" maxLength={100} value={cert.name || ''} onChange={e => updateCert(i, 'name', e.target.value)} />
                                    </div>
                                    <div className="ln-info-item" style={{ gridColumn: '1 / -1' }}>
                                        <label className="ln-info-label" style={{ marginBottom: 4 }}>Issuing Organization<span style={{ color: '#cc1016', marginLeft: 4 }}>*</span></label>
                                        <input type="text" required className="form-input" placeholder="e.g. Amazon Web Services, Google, PRC" maxLength={80} value={cert.org || ''} onChange={e => updateCert(i, 'org', e.target.value)} />
                                    </div>
                                    <div className="ln-info-item">
                                        <label className="ln-info-label" style={{ marginBottom: 4 }}>Issue Date<span style={{ color: '#cc1016', marginLeft: 4 }}>*</span></label>
                                        <input type="date" required className="form-input" value={cert.issue || ''} onChange={e => updateCert(i, 'issue', e.target.value)} />
                                    </div>
                                    <div className="ln-info-item">
                                        <label className="ln-info-label" style={{ marginBottom: 4 }}>Expiration Date{!cert.noExp && <span style={{ color: '#cc1016', marginLeft: 4 }}>*</span>}</label>
                                        <input type="date" required={!cert.noExp} className="form-input" disabled={cert.noExp} value={cert.exp || ''} onChange={e => updateCert(i, 'exp', e.target.value)} />
                                        <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, cursor: 'pointer', color: '#64748b' }}>
                                            <input type="checkbox" checked={cert.noExp || false} onChange={e => updateCert(i, 'noExp', e.target.checked)} /> Does not expire
                                        </label>
                                    </div>
                                    <div className="ln-info-item" style={{ gridColumn: '1 / -1' }}>
                                        <label className="ln-info-label" style={{ marginBottom: 4 }}>Credential ID (optional)</label>
                                        <input type="text" className="form-input" placeholder="e.g. AWS-12345" value={cert.credId || ''} onChange={e => updateCert(i, 'credId', e.target.value)} />
                                    </div>
                                    <div className="ln-info-item" style={{ gridColumn: '1 / -1' }}>
                                        <label className="ln-info-label" style={{ marginBottom: 4 }}>Credential URL (optional)</label>
                                        <input type="url" className="form-input" placeholder="https://credly.com/badges/abc123" value={cert.url || ''} onChange={e => updateCert(i, 'url', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div> {/* Closing for ln-profile-main */}

                <div className="ln-profile-sidebar">
                    {/* Skills Section (editable) */}
                    <div className="ln-card">
                        <div className="ln-section-header"><h3>Skills</h3></div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12, padding: '0 16px' }}>
                            {(form.skills || []).length > 0 ? (form.skills || []).map((skill, i) => (
                                <span key={i} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    padding: '6px 12px', background: '#dbeafe', color: '#1e3a5f',
                                    borderRadius: 20, fontSize: 13, fontWeight: 600
                                }}>
                                    {typeof skill === 'string' ? skill : JSON.stringify(skill)}
                                    {editing && <button type="button" onClick={() => removeSkill(skill)} style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        padding: 0, display: 'flex', color: '#64748b'
                                    }}><X size={14} /></button>}
                                </span>
                            )) : <div className="ln-empty-widget" style={{ padding: 16, width: '100%' }}><p style={{ margin: 0 }}>No skills added yet</p></div>}
                        </div>
                        {editing && (
                            <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px' }}>
                                <input
                                    type="text" className="form-input" placeholder="Add a skill..."
                                    value={newSkill} onChange={e => setNewSkill(e.target.value)}
                                    maxLength={30}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                                    style={{ flex: 1, fontSize: 13 }}
                                />
                                <button type="button" className="ln-btn-sm ln-btn-primary" onClick={addSkill} disabled={!newSkill.trim()}>
                                    <Plus size={14} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Interests Section (editable word cloud) */}
                    <div className="ln-card">
                        <div className="ln-section-header"><h3>Interests</h3></div>
                        <div style={{
                            display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', alignItems: 'center',
                            padding: 20, margin: '0 16px 12px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', minHeight: 80
                        }}>
                            {interestsList.length > 0 ? interestsList.map((interest, i) => {
                                const sizes = [14, 17, 20, 15, 18];
                                const colors = ['#0a66c2', '#7c3aed', '#057642', '#b24020', '#1e3a5f'];
                                return (
                                    <span key={i} className="ln-interest-word" onClick={() => { if (editing) removeInterest(interest); }} style={{
                                        display: 'inline-flex', alignItems: 'center',
                                        fontSize: sizes[i % sizes.length],
                                        fontWeight: 600 + (i % 3) * 100,
                                        color: colors[i % colors.length],
                                        padding: '4px 10px',
                                        cursor: editing ? 'pointer' : 'default',
                                    }}>
                                        {interest}
                                    </span>
                                );
                            }) : <div className="ln-empty-widget" style={{ padding: 16, width: '100%' }}><p style={{ margin: 0 }}>No interests added yet</p></div>}
                        </div>
                        {editing && (
                            <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px' }}>
                                <input
                                    type="text" className="form-input" placeholder="Add an interest..."
                                    value={newInterest} onChange={e => setNewInterest(e.target.value)}
                                    maxLength={30}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addInterest(); } }}
                                    style={{ flex: 1, fontSize: 13 }}
                                />
                                <button type="button" className="ln-btn-sm ln-btn-primary" onClick={addInterest} disabled={!newInterest.trim()}>
                                    <Plus size={14} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Documents Section (real uploads) */}
                    <div className="ln-card">
                        <div className="ln-section-header">
                            <h3>Documents</h3>
                            {editing && (
                                <button type="button" className="ln-btn-sm ln-btn-primary" onClick={() => setShowUploadForm(!showUploadForm)}>
                                    {showUploadForm ? <><X size={12} /> Cancel</> : <><Plus size={12} /> Add</>}
                                </button>
                            )}
                        </div>

                        {editing && showUploadForm && (
                            <div style={{ marginBottom: 16, padding: 16, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                                <div style={{ marginBottom: 10 }}>
                                    <label className="ln-info-label" style={{ marginBottom: 4, display: 'block' }}>Document Label <span style={{ color: '#cc1016' }}>*</span></label>
                                    <input type="text" required className="form-input" placeholder="e.g. Resume, Diploma, TOR..." maxLength={40} value={docLabel} onChange={e => setDocLabel(e.target.value)} style={{ fontSize: 13 }} />
                                </div>
                                <div style={{ marginBottom: 10 }}>
                                    <label className="ln-info-label" style={{ marginBottom: 4, display: 'block' }}>File (PDF, DOC, DOCX only) <span style={{ color: '#cc1016' }}>*</span></label>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        required accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                        onChange={e => setDocFile(e.target.files[0] || null)}
                                        style={{ fontSize: 13 }}
                                    />
                                </div>
                                <button type="button" className="ln-btn-sm ln-btn-success" onClick={handleDocUpload} disabled={uploading || !docFile || !docLabel.trim()} style={{ width: '100%' }}>
                                    {uploading ? 'Uploading...' : <><Upload size={12} /> Upload Document</>}
                                </button>
                            </div>
                        )}

                        {documents.length > 0 ? documents.map(doc => (
                            <div key={doc.id} className="ln-doc-item">
                                <div className="ln-doc-info">
                                    <FileText size={16} color="rgba(0,0,0,0.5)" />
                                    <div>
                                        <span style={{ fontWeight: 600, fontSize: 13 }}>{doc.label}</span>
                                        <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)' }}>{doc.file_name}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <a href={doc.file_url} target="_blank" rel="noreferrer" className="ln-btn-sm ln-btn-outline"><Eye size={12} /> View</a>
                                    {editing && <button type="button" className="ln-btn-sm ln-btn-outline" onClick={(e) => { e.preventDefault(); showConfirm('Are you sure you want to delete this document?', () => deleteDoc(doc.id)); }} style={{ color: '#cc1016' }}><Trash2 size={12} /></button>}
                                </div>
                            </div>
                        )) : !showUploadForm && (
                            <div className="ln-empty-widget" style={{ padding: 20 }}>
                                <FileText size={28} style={{ opacity: 0.3 }} />
                                <p>No documents uploaded yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </form>
    );
};

const TraineeProfile = () => (
    <ErrorBoundary>
        <TraineeProfileContent />
    </ErrorBoundary>
);

// ─── PAGE 4: OPPORTUNITIES ───────────────────────────────────────
const Opportunities = () => {
    const { currentUser, trainees, jobPostings, applications, getTraineeRecommendedJobs, applyToJob } = useApp();
    const trainee = currentUser || trainees[0];
    const myApps = applications.filter(a => a.traineeId === trainee?.id).map(a => a.jobId);
    const allJobs = getTraineeRecommendedJobs(trainee?.id);

    const [search, setSearch] = useState('');
    const [filterIndustry, setFilterIndustry] = useState('All');
    const [filterType, setFilterType] = useState('All');
    const [filterLocation, setFilterLocation] = useState('All');
    const [filterOpType, setFilterOpType] = useState('All');
    const [selectedJob, setSelectedJob] = useState(null);
    const [applyJob, setApplyJob] = useState(null);
    const [applicationMessage, setApplicationMessage] = useState('');
    const [resumeInfo, setResumeInfo] = useState(null);
    const [loadingResume, setLoadingResume] = useState(false);
    const [submittingApplication, setSubmittingApplication] = useState(false);

    const industries = ['All', ...new Set(jobPostings.map(j => j.industry))];
    const types = ['All', 'Full-time', 'Part-time', 'Contract', 'Internship'];
    const locations = ['All', ...new Set(jobPostings.map(j => j.location))];
    const opTypes = ['All', 'Job', 'OJT', 'Apprenticeship'];

    const filtered = allJobs.filter(j => {
        const q = search.toLowerCase();
        return (
            (j.title.toLowerCase().includes(q) || j.companyName.toLowerCase().includes(q)) &&
            (filterIndustry === 'All' || j.industry === filterIndustry) &&
            (filterType === 'All' || j.employmentType === filterType) &&
            (filterLocation === 'All' || j.location === filterLocation) &&
            (filterOpType === 'All' || j.opportunityType === filterOpType)
        );
    });

    const loadResumeInfo = async () => {
        if (!trainee?.id) return;
        setLoadingResume(true);
        setResumeInfo(null);

        let resolvedResume = null;
        const isSupabaseUser = typeof trainee.id === 'string' && trainee.id.includes('-');

        if (isSupabaseUser) {
            try {
                const { data, error } = await supabase
                    .from('student_documents')
                    .select('file_url, file_name, label, uploaded_at')
                    .eq('student_id', trainee.id)
                    .ilike('label', '%resume%')
                    .order('uploaded_at', { ascending: false })
                    .limit(1);

                if (error && error.code !== '42P01') {
                    console.warn('Resume fetch error:', error);
                }

                if (!error && data?.length) {
                    resolvedResume = {
                        file_url: data[0].file_url,
                        file_name: data[0].file_name || 'Resume',
                    };
                }
            } catch (err) {
                console.warn('Resume fetch exception:', err);
            }
        }

        if (!resolvedResume && (trainee?.resumeUrl || trainee?.registrationResumeUrl)) {
            resolvedResume = {
                file_url: trainee.resumeUrl || trainee.registrationResumeUrl,
                file_name: 'Resume',
            };
        }

        setResumeInfo(resolvedResume);
        setLoadingResume(false);
    };

    const openApplyModal = async (job) => {
        setApplyJob(job);
        setApplicationMessage('');
        await loadResumeInfo();
    };

    const handleSubmitApplication = async () => {
        if (!applyJob) return;
        if (!resumeInfo?.file_url) {
            alert('Resume is required before submitting your application.');
            return;
        }

        setSubmittingApplication(true);
        const r = await applyToJob(trainee?.id, applyJob.id, {
            applicationMessage,
            resumeUrl: resumeInfo.file_url,
            resumeFileName: resumeInfo.file_name || 'Resume',
        });
        setSubmittingApplication(false);

        if (!r.success) {
            alert(r.error || 'Failed to submit application.');
            return;
        }

        setApplyJob(null);
        setApplicationMessage('');
    };

    return (
        <div className="ln-page-content">
            <div className="ln-page-header">
                <div>
                    <h1 className="ln-page-title">Opportunities</h1>
                    <p className="ln-page-subtitle">Jobs, OJT, and apprenticeships matched to your qualifications</p>
                </div>
                <span className="ln-badge ln-badge-blue">{filtered.length} positions found</span>
            </div>

            {/* Filters */}
            <div className="ln-card" style={{ marginBottom: 16 }}>
                <div className="ln-filters-row">
                    <div className="ln-search-wrap ln-search-wide">
                        <Search size={16} className="ln-search-icon" />
                        <input className="ln-search-input" placeholder="Search title or company..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    {[
                        { label: 'Type', val: filterOpType, set: setFilterOpType, opts: opTypes },
                        { label: 'Industry', val: filterIndustry, set: setFilterIndustry, opts: industries },
                        { label: 'Location', val: filterLocation, set: setFilterLocation, opts: locations },
                        { label: 'Employment', val: filterType, set: setFilterType, opts: types },
                    ].map(f => (
                        <select key={f.label} className="ln-filter-select" value={f.val} onChange={e => f.set(e.target.value)}>
                            {f.opts.map(o => <option key={o}>{o}</option>)}
                        </select>
                    ))}
                </div>
            </div>

            {/* Job Cards - LinkedIn Style */}
            <div className="ln-jobs-list">
                {filtered.map(job => {
                    const applied = myApps.includes(job.id);
                    return (
                        <div key={job.id} className="ln-card ln-job-card-li">
                            <div className="ln-job-card-top">
                                <div className="ln-job-card-icon">
                                    <Building2 size={24} />
                                </div>
                                <div className="ln-job-card-info">
                                    <div className="ln-job-card-title">{job.title}</div>
                                    <div className="ln-job-card-company">{job.companyName}</div>
                                    <div className="ln-job-card-meta">
                                        <span><MapPin size={13} /> {job.location}</span>
                                        <span><Clock size={13} /> {job.employmentType}</span>
                                    </div>
                                </div>
                                <div className="ln-job-card-badges">
                                    <span className={`ln-badge ln-badge-${job.status === 'Open' ? 'green' : 'gray'}`}>{job.status}</span>
                                    <span className="ln-badge ln-badge-blue" style={{ fontSize: 11 }}>{job.opportunityType}</span>
                                </div>
                            </div>

                            <div className="ln-match-row" style={{ margin: '12px 0' }}>
                                <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.6)' }}>Match Rate</span>
                                <div className="ln-match-bar" style={{ flex: 1 }}>
                                    <div className={`ln-match-fill ${job.matchRate >= 70 ? 'high' : job.matchRate >= 40 ? 'mid' : 'low'}`} style={{ width: `${job.matchRate}%` }} />
                                </div>
                                <span className="ln-match-pct">{job.matchRate}%</span>
                            </div>

                            <div className="ln-job-card-footer">
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <span className="ln-badge ln-badge-purple">{job.ncLevel}</span>
                                    {job.salaryRange && <span style={{ fontSize: 13, color: '#057642', fontWeight: 600 }}>{job.salaryRange}</span>}
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="ln-btn-sm ln-btn-outline" onClick={() => setSelectedJob(job)}>
                                        <Eye size={13} /> Details
                                    </button>
                                    <button className="ln-btn-sm ln-btn-primary" disabled={applied || job.status !== 'Open'} onClick={() => openApplyModal(job)}>
                                        {applied ? <><CheckCircle size={13} /> Applied</> : <><Send size={13} /> Apply</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filtered.length === 0 && (
                <div className="ln-empty-state"><Briefcase size={48} /><h3>No opportunities found</h3><p>Try adjusting your filters.</p></div>
            )}

            {/* Detail Modal */}
            {selectedJob && (
                <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
                    <div className="ln-modal" onClick={e => e.stopPropagation()}>
                        <div className="ln-modal-header">
                            <div>
                                <h3 className="ln-modal-title">{selectedJob.title}</h3>
                                <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', marginTop: 4 }}>{selectedJob.companyName} &bull; {selectedJob.location}</p>
                            </div>
                            <button className="ln-btn-icon" onClick={() => setSelectedJob(null)}><X size={18} /></button>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                            <span className={`ln-badge ln-badge-${selectedJob.status === 'Open' ? 'green' : 'gray'}`}>{selectedJob.status}</span>
                            <span className="ln-badge ln-badge-blue">{selectedJob.opportunityType}</span>
                            <span className="ln-badge ln-badge-purple">{selectedJob.ncLevel}</span>
                            <span className="ln-badge ln-badge-gray">{selectedJob.employmentType}</span>
                            <span className="ln-badge ln-badge-blue">{selectedJob.matchRate}% Match</span>
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: 'rgba(0,0,0,0.9)' }}>Description</div>
                            <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', lineHeight: 1.7 }}>{selectedJob.description}</p>
                        </div>
                        {selectedJob.attachmentUrl && (
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: 'rgba(0,0,0,0.9)' }}>Attachment</div>
                                {isImageAttachment(selectedJob.attachmentUrl, selectedJob.attachmentType) ? (
                                    <a href={selectedJob.attachmentUrl} target="_blank" rel="noreferrer" style={{ display: 'block' }}>
                                        <img
                                            src={selectedJob.attachmentUrl}
                                            alt={selectedJob.attachmentName || 'Opportunity attachment'}
                                            style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 10, border: '1px solid #e2e8f0' }}
                                        />
                                    </a>
                                ) : (
                                    <a href={selectedJob.attachmentUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: '#2563eb', textDecoration: 'none', fontSize: 13 }}>
                                        <FileText size={15} />
                                        {selectedJob.attachmentName || decodeURIComponent(String(selectedJob.attachmentUrl).split('/').pop()?.split('?')[0] || 'Attachment')}
                                    </a>
                                )}
                            </div>
                        )}
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: 'rgba(0,0,0,0.9)' }}>Required Competencies</div>
                            {selectedJob.requiredCompetencies.map((c, i) => (
                                <div key={i} className="ln-skill-item" style={{ borderBottom: '1px solid #f3f2ef' }}>
                                    <div className="ln-skill-row">
                                        <CheckSquare size={14} color="#0a66c2" />
                                        <span className="ln-skill-name">{c}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="ln-modal-footer">
                            <span style={{ fontSize: 15, fontWeight: 700, color: '#057642' }}>{selectedJob.salaryRange}</span>
                            <button
                                className="ln-btn ln-btn-primary"
                                disabled={myApps.includes(selectedJob.id) || selectedJob.status !== 'Open'}
                                onClick={async () => {
                                    const jobToApply = selectedJob;
                                    setSelectedJob(null);
                                    await openApplyModal(jobToApply);
                                }}
                            >
                                {myApps.includes(selectedJob.id) ? <><CheckCircle size={15} /> Applied</> : <><Send size={15} /> Apply</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {applyJob && (
                <div className="modal-overlay" onClick={() => setApplyJob(null)}>
                    <div className="ln-modal" onClick={e => e.stopPropagation()}>
                        <div className="ln-modal-header">
                            <div>
                                <h3 className="ln-modal-title">Application Form</h3>
                                <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', marginTop: 4 }}>{applyJob.title} • {applyJob.companyName}</p>
                            </div>
                            <button className="ln-btn-icon" onClick={() => setApplyJob(null)}><X size={18} /></button>
                        </div>

                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Resume (Required)</div>
                            {loadingResume ? (
                                <div style={{ fontSize: 13, color: '#64748b' }}>Loading resume...</div>
                            ) : resumeInfo?.file_url ? (
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 10, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{resumeInfo.file_name || 'Resume'}</div>
                                        <div style={{ fontSize: 11.5, color: '#64748b' }}>This resume will be included in your application.</div>
                                    </div>
                                    <a href={resumeInfo.file_url} target="_blank" rel="noreferrer" className="ln-btn-sm ln-btn-outline"><Eye size={12} /> View</a>
                                </div>
                            ) : (
                                <div style={{ border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b', borderRadius: 8, padding: 10, fontSize: 13 }}>
                                    No resume found. Please upload your resume in Profile before applying.
                                </div>
                            )}
                        </div>

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
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, textAlign: 'right' }}>{applicationMessage.length}/1000</div>
                        </div>

                        <div className="ln-modal-footer">
                            <button className="ln-btn ln-btn-outline" onClick={() => setApplyJob(null)}>Cancel</button>
                            <button className="ln-btn ln-btn-primary" disabled={submittingApplication || !resumeInfo?.file_url} onClick={handleSubmitApplication}>
                                <Send size={15} /> {submittingApplication ? 'Submitting...' : 'Submit Application'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── PAGE 5: MY APPLICATIONS ──────────────────────────────────────
const MyApplications = () => {
    const { currentUser, trainees, getTraineeApplications } = useApp();
    const trainee = currentUser || trainees[0];
    const myApps = getTraineeApplications(trainee?.id);
    const [search, setSearch] = useState('');

    const filtered = myApps.filter(a =>
        a.job?.title?.toLowerCase().includes(search.toLowerCase()) ||
        a.job?.companyName?.toLowerCase().includes(search.toLowerCase())
    );

    const statusBadge = (s) => {
        const map = { Pending: 'ln-badge-yellow', Accepted: 'ln-badge-green', Rejected: 'ln-badge-red' };
        return <span className={`ln-badge ${map[s] || 'ln-badge-gray'}`}>{s}</span>;
    };

    return (
        <div className="ln-page-content">
            <div className="ln-page-header">
                <div>
                    <h1 className="ln-page-title">My Applications</h1>
                    <p className="ln-page-subtitle">Track all your opportunity applications</p>
                </div>
                <span className="ln-badge ln-badge-blue">{myApps.length} total</span>
            </div>

            {/* Summary pills */}
            <div className="ln-pills-row">
                {[
                    { label: 'Total', count: myApps.length, color: '#0a66c2' },
                    { label: 'Pending', count: myApps.filter(a => a.status === 'Pending').length, color: '#b24020' },
                    { label: 'Accepted', count: myApps.filter(a => a.status === 'Accepted').length, color: '#057642' },
                    { label: 'Rejected', count: myApps.filter(a => a.status === 'Rejected').length, color: '#cc1016' },
                ].map(s => (
                    <div key={s.label} className="ln-pill" style={{ borderLeft: `3px solid ${s.color}` }}>
                        <span className="ln-pill-count" style={{ color: s.color }}>{s.count}</span>
                        <span className="ln-pill-label">{s.label}</span>
                    </div>
                ))}
            </div>

            <div className="ln-card">
                <div className="ln-section-header" style={{ marginBottom: 16 }}>
                    <h3>Application History</h3>
                    <div className="ln-search-wrap" style={{ width: 240 }}>
                        <Search size={16} className="ln-search-icon" />
                        <input className="ln-search-input" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="ln-table">
                        <thead>
                            <tr><th>Title</th><th>Company</th><th>Type</th><th>Date Applied</th><th>Status</th><th>Your Application</th><th>Recruit Update</th></tr>
                        </thead>
                        <tbody>
                            {filtered.map(a => (
                                <tr key={a.id}>
                                    <td style={{ fontWeight: 600, color: '#0a66c2' }}>{a.job?.title || '—'}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Building2 size={14} color="rgba(0,0,0,0.4)" />
                                            {a.job?.companyName || '—'}
                                        </div>
                                    </td>
                                    <td><span className="ln-badge ln-badge-blue" style={{ fontSize: 11 }}>{a.job?.opportunityType || '—'}</span></td>
                                    <td style={{ color: 'rgba(0,0,0,0.5)', fontSize: 13 }}>{a.appliedAt}</td>
                                    <td>{statusBadge(a.status)}</td>
                                    <td style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)', maxWidth: 240 }}>{a.applicationMessage || '—'}</td>
                                    <td style={{ fontSize: 13, color: 'rgba(0,0,0,0.6)', maxWidth: 260 }}>
                                        {a.recruitMessage ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                <span>{a.recruitMessage}</span>
                                                {a.recruitDocumentName && <span style={{ fontSize: 11.5, color: '#64748b' }}>Attachment: {a.recruitDocumentName}</span>}
                                            </div>
                                        ) : (a.notes || '—')}
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'rgba(0,0,0,0.4)' }}>No applications yet. Start applying!</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ─── MAIN TRAINEE DASHBOARD ─────────────────────────────────────
export default function TraineeDashboard() {
    const { currentUser } = useApp();
    const navigate = useNavigate();
    const location = useLocation();

    // Deduce active page from URL for visual consistency in child components
    const path = location.pathname.split('/').pop();
    const activePage = (path === 'trainee' || !path) ? 'dashboard' : path;

    // Mock setActivePage to use navigate for smooth integration with existing buttons
    const setActivePage = (page) => {
        if (page === 'dashboard') {
            navigate('/trainee');
        } else {
            navigate(`/trainee/${page}`);
        }
    };

    if (!currentUser) return null;

    return (
        <LinkedInLayout activePage={activePage} setActivePage={setActivePage}>
            <Routes>
                <Route path="/" element={<TraineeDashboardHome setActivePage={setActivePage} />} />
                <Route path="/profile" element={<TraineeProfile />} />
                <Route path="/recommendations" element={<Opportunities />} />
                <Route path="/applications" element={<MyApplications />} />
                <Route path="*" element={<Navigate to="/trainee" replace />} />
            </Routes>
        </LinkedInLayout>
    );
}
