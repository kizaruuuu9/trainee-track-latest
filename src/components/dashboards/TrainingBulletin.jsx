import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import {
    Plus, Eye, Edit, Trash2, X, CheckCircle, XCircle, Clock,
    Calendar, Users, FileText, Award, Megaphone, ChevronDown,
    ChevronUp, Search, Filter, BookOpen, Send, Bookmark,
    MessageSquare, UserCheck, AlertCircle, RefreshCw
} from 'lucide-react';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const POST_TYPES = [
    {
        id: 'training_batch',
        label: 'New Training Batch',
        icon: <BookOpen size={16} />,
        color: '#7c3aed',
        bg: '#ede9fe',
        traineeActions: ['Apply', 'Inquire', 'Save'],
        partnerActions: ['Refer Apprentice', 'Inquire', 'Save'],
    },
    {
        id: 'exam_schedule',
        label: 'Exam Schedule',
        icon: <Award size={16} />,
        color: '#0ea5e9',
        bg: '#e0f2fe',
        traineeActions: ['Register for Exam', 'Inquire', 'Save'],
        partnerActions: ['Register Apprentice', 'Inquire', 'Save'],
    },
    {
        id: 'announcement',
        label: 'General Announcement',
        icon: <Megaphone size={16} />,
        color: '#d97706',
        bg: '#fef3c7',
        traineeActions: ['View', 'Comment'],
        partnerActions: ['View', 'Comment'],
    },
];

const STATUSES = ['Open', 'Full', 'Closed'];

const statusColors = {
    Open: { bg: '#dcfce7', color: '#16a34a' },
    Full: { bg: '#fef3c7', color: '#d97706' },
    Closed: { bg: '#fee2e2', color: '#dc2626' },
    pending: { bg: '#fef3c7', color: '#d97706' },
    approved: { bg: '#dcfce7', color: '#16a34a' },
    rejected: { bg: '#fee2e2', color: '#dc2626' },
};

const interactionLabels = {
    apply: 'Application',
    register: 'Registration',
    refer: 'Referral',
    inquire: 'Inquiry',
    save: 'Saved',
};

const getPostType = (id) => POST_TYPES.find(t => t.id === id) || POST_TYPES[3];

const emptyForm = {
    post_type: 'training_batch',
    title: '',
    content: '',
    schedule: '',
    time_range: '',
    slots: '',
    requirements: '',
    status: 'Open',
    accept_referrals: true,
    image: null,
    imagePreview: null,
};

const formatBulletinDate = (dateStr) => {
    if (!dateStr) return '';
    // If it's already a nice format (not ISO date-only), return as is
    if (dateStr.includes('–') || dateStr.includes('-') && dateStr.split('-').length !== 3) return dateStr;

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
};

// ─── PREVIEW CARD ─────────────────────────────────────────────────────────────
const PreviewCard = ({ form, viewAs }) => {
    const pt = getPostType(form.post_type);
    const isAnnouncement = form.post_type === 'announcement';
    let actions = viewAs === 'trainee' ? pt.traineeActions : pt.partnerActions;

    // Dynamically add Refer Apprentice if enabled for announcements
    if (viewAs === 'partner' && form.accept_referrals && isAnnouncement && !actions.includes('Refer Apprentice')) {
        actions = ['Refer Apprentice', ...actions];
    }

    const reqs = form.requirements ? form.requirements.split('\n').filter(Boolean) : [];

    const actionBtnStyle = (label) => {
        const primary = ['Apply', 'Register for Exam', 'Register', 'Refer Apprentice', 'Register Apprentice'];
        const isPrimary = primary.includes(label);
        return {
            padding: '8px 14px',
            borderRadius: 8,
            border: isPrimary ? 'none' : `1.5px solid ${pt.color}`,
            background: isPrimary ? pt.color : 'transparent',
            color: isPrimary ? '#fff' : pt.color,
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
        };
    };

    return (
        <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #e2e8f0', overflow: 'hidden' }}>
            {/* Header bar */}
            <div style={{ background: pt.color, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#fff' }}>{pt.icon}</span>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{pt.label}</span>
                {form.status && (
                    <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                        {form.status}
                    </span>
                )}
            </div>

            {/* Body */}
            <div style={{ padding: '16px' }}>
                {form.imagePreview && (
                    <div style={{ width: '100%', height: 180, marginBottom: 14, borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                        <img src={form.imagePreview} alt="Post Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                )}
                <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', marginBottom: 4 }}>
                    {form.title || <span style={{ color: '#94a3b8' }}>Post Title</span>}
                </div>

                {!isAnnouncement && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                        {form.schedule && (
                            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 12px' }}>
                                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Schedule</div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{formatBulletinDate(form.schedule)}</div>
                            </div>
                        )}
                        {form.time_range && (
                            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 12px' }}>
                                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Time</div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{form.time_range}</div>
                            </div>
                        )}
                        {form.slots && (
                            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 12px' }}>
                                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Available Slots</div>
                                <div style={{ fontSize: 15, fontWeight: 800, color: pt.color }}>{form.slots}</div>
                            </div>
                        )}
                    </div>
                )}

                {reqs.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginBottom: 6 }}>Requirements</div>
                        {reqs.map((r, i) => (
                            <div key={i} style={{ fontSize: 13, color: '#475569', display: 'flex', gap: 6, marginBottom: 3 }}>
                                <span style={{ color: pt.color }}>•</span> {r}
                            </div>
                        ))}
                    </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                    {actions.map(action => (
                        <button key={action} style={actionBtnStyle(action)}>
                            {action === 'Save' && <Bookmark size={13} />}
                            {action === 'Inquire' && <MessageSquare size={13} />}
                            {action === 'Refer Apprentice' && <UserCheck size={13} />}
                            {action === 'Register Apprentice' && <UserCheck size={13} />}
                            {action === 'Apply' && <Send size={13} />}
                            {action === 'Register' && <CheckCircle size={13} />}
                            {action === 'Register for Exam' && <CheckCircle size={13} />}
                            {action === 'Comment' && <MessageSquare size={13} />}
                            {action}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ─── POST FORM MODAL ──────────────────────────────────────────────────────────
const PostFormModal = ({ editPost, onClose, onSave, saving, programs }) => {
    const [form, setForm] = useState(editPost ? {
        post_type: editPost.post_type || 'training_batch',
        title: editPost.title || '',
        content: editPost.content || '',
        schedule: editPost.schedule || '',
        time_range: editPost.time_range || '',
        slots: editPost.slots || '',
        requirements: Array.isArray(editPost.requirements) ? editPost.requirements.join('\n') : (editPost.requirements || ''),
        status: editPost.status || 'Open',
        accept_referrals: editPost.accept_referrals !== false,
        image: null,
        imagePreview: editPost.image_url || null,
    } : { ...emptyForm });
    const [previewAs, setPreviewAs] = useState('trainee');
    const [showPreview, setShowPreview] = useState(false);
    const pt = getPostType(form.post_type);
    const isAnnouncement = form.post_type === 'announcement';

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }}>
            <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: showPreview ? 900 : 600, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
                {/* Modal Header */}
                <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{editPost ? 'Edit Post' : 'Create New Post'}</h2>
                        <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Training Opportunities Bulletin</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button
                            onClick={() => setShowPreview(p => !p)}
                            style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid #7c3aed', background: showPreview ? '#7c3aed' : 'transparent', color: showPreview ? '#fff' : '#7c3aed', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                            <Eye size={14} /> {showPreview ? 'Hide' : 'Preview'}
                        </button>
                        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={16} color="#64748b" />
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: showPreview ? '1fr 1fr' : '1fr', gap: 0 }}>
                    {/* Form Side */}
                    <div style={{ padding: '20px 24px', borderRight: showPreview ? '1px solid #e2e8f0' : 'none', maxHeight: '75vh', overflowY: 'auto' }}>
                        {/* Post Type Selector */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Post Type *</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                {POST_TYPES.map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => set('post_type', type.id)}
                                        style={{
                                            padding: '10px 12px',
                                            borderRadius: 10,
                                            border: `2px solid ${form.post_type === type.id ? type.color : '#e2e8f0'}`,
                                            background: form.post_type === type.id ? type.bg : '#f8fafc',
                                            color: form.post_type === type.id ? type.color : '#64748b',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            fontWeight: 600,
                                            fontSize: 12,
                                            textAlign: 'left',
                                        }}
                                    >
                                        {type.icon} {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Title / Program Select */}
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                                {isAnnouncement ? 'Title *' : 'Program *'}
                            </label>
                            {isAnnouncement ? (
                                <input
                                    value={form.title}
                                    onChange={e => set('title', e.target.value)}
                                    placeholder="e.g. Campus Holiday Closure"
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                                />
                            ) : (
                                <select
                                    value={form.title}
                                    onChange={e => set('title', e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fff' }}
                                >
                                    <option value="" disabled>Select a Program</option>
                                    {programs && programs.map(p => (
                                        <option key={p.id} value={p.name}>
                                            {p.name}{p.ncLevel ? ` - ${p.ncLevel}` : ''}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Image Upload */}
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Feature Image <span style={{ color: '#94a3b8', textTransform: 'none', fontWeight: 400 }}>(Optional)</span></label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={e => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        set('image', file);
                                        set('imagePreview', URL.createObjectURL(file));
                                    }
                                }}
                                style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1.5px dashed #cbd5e1', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#f8fafc', cursor: 'pointer' }}
                            />
                            {form.imagePreview && (
                                <div style={{ marginTop: 8, position: 'relative', width: '100%', height: 140, borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                    <img src={form.imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <button
                                        onClick={() => { set('image', null); set('imagePreview', null); }}
                                        style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Description *</label>
                            <textarea
                                value={form.content}
                                onChange={e => set('content', e.target.value)}
                                placeholder="Describe the training program, exam, or announcement..."
                                rows={4}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                            />
                        </div>

                        {!isAnnouncement && (
                            <>
                                {/* Schedule & Time */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                                    <div>
                                        <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Schedule</label>
                                        <input
                                            type="date"
                                            value={form.schedule}
                                            onChange={e => set('schedule', e.target.value)}
                                            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Time</label>
                                        <input
                                            value={form.time_range}
                                            onChange={e => set('time_range', e.target.value)}
                                            placeholder="e.g. Mon–Fri | 8AM–4PM"
                                            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                </div>

                                {/* Slots & Status */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                                    <div>
                                        <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Available Slots</label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={form.slots}
                                            onChange={e => set('slots', e.target.value)}
                                            placeholder="e.g. 20"
                                            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Status</label>
                                        <select
                                            value={form.status}
                                            onChange={e => set('status', e.target.value)}
                                            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff' }}
                                        >
                                            {STATUSES.map(s => <option key={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Requirements */}
                                <div style={{ marginBottom: 14 }}>
                                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Requirements <span style={{ color: '#94a3b8', textTransform: 'none', fontWeight: 400 }}>(one per line)</span></label>
                                    <textarea
                                        value={form.requirements}
                                        onChange={e => set('requirements', e.target.value)}
                                        placeholder={"High school graduate\nBasic computer knowledge"}
                                        rows={3}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                                    />
                                </div>

                            </>
                        )}

                        {/* Accept Referrals Toggle (Always visible for all types) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, padding: '10px 14px', background: '#f8fafc', borderRadius: 10 }}>
                            <div
                                onClick={() => set('accept_referrals', !form.accept_referrals)}
                                style={{
                                    width: 40, height: 22, borderRadius: 11,
                                    background: form.accept_referrals ? '#7c3aed' : '#e2e8f0',
                                    cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s'
                                }}
                            >
                                <div style={{
                                    width: 16, height: 16, borderRadius: '50%', background: '#fff',
                                    position: 'absolute', top: 3, left: form.accept_referrals ? 21 : 3,
                                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                }} />
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Accept Industry Partner Referrals</div>
                                <div style={{ fontSize: 11, color: '#94a3b8' }}>Allow companies to refer apprentices for this post</div>
                            </div>
                        </div>
                    </div>

                    {/* Preview Side */}
                    {showPreview && (
                        <div style={{ padding: '20px', background: '#f8fafc', maxHeight: '75vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                                {['trainee', 'partner'].map(v => (
                                    <button
                                        key={v}
                                        onClick={() => setPreviewAs(v)}
                                        style={{ flex: 1, padding: '7px', borderRadius: 8, border: `1.5px solid ${previewAs === v ? pt.color : '#e2e8f0'}`, background: previewAs === v ? pt.bg : '#fff', color: previewAs === v ? pt.color : '#64748b', fontWeight: 600, fontSize: 12, cursor: 'pointer', textTransform: 'capitalize' }}
                                    >
                                        {v === 'trainee' ? '👨‍🎓 Trainee View' : '🏢 Partner View'}
                                    </button>
                                ))}
                            </div>
                            <PreviewCard form={form} viewAs={previewAs} />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                    <button
                        onClick={() => onSave(form)}
                        disabled={saving || !form.title || !form.content}
                        style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving || !form.title || !form.content ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                        {saving ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
                        {editPost ? 'Save Changes' : 'Publish Post'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── INTERACTION BADGE ─────────────────────────────────────────────────────────
const InteractionBadge = ({ status }) => {
    const s = statusColors[status] || { bg: '#f1f5f9', color: '#64748b' };
    return (
        <span style={{ padding: '3px 10px', borderRadius: 20, background: s.bg, color: s.color, fontSize: 11, fontWeight: 700 }}>
            {status}
        </span>
    );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function TrainingBulletin() {
    const {
        posts, createPost, adminUpdatePost, adminDeletePost,
        postInteractions, fetchPostInteractions, updatePostInteractionStatus, getPostInteractions,
        currentUser, fetchPosts, trainees, partners, programs
    } = useApp();

    const [showForm, setShowForm] = useState(false);
    const [editPost, setEditPost] = useState(null);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [selectedPost, setSelectedPost] = useState(null);
    const [interactionTab, setInteractionTab] = useState('apply');
    const [toast, setToast] = useState('');

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    // Load interactions when a post is selected
    useEffect(() => {
        if (selectedPost) {
            fetchPostInteractions(selectedPost.id);
        }
    }, [selectedPost]);

    // Refresh data on mount
    useEffect(() => {
        fetchPosts();
        fetchPostInteractions();
    }, []);

    // Filter to only admin/bulletin posts
    const bulletinPosts = posts.filter(p =>
        ['training_batch', 'exam_schedule', 'announcement'].includes(p.post_type)
    );

    const filtered = bulletinPosts.filter(p => {
        const q = search.toLowerCase();
        const matchSearch = !q || (p.title || '').toLowerCase().includes(q) || (p.content || '').toLowerCase().includes(q);
        const matchType = filterType === 'All' || p.post_type === filterType;
        const matchStatus = filterStatus === 'All' || p.status === filterStatus;
        return matchSearch && matchType && matchStatus;
    });

    const handleSave = async (form) => {
        setSaving(true);
        const payload = {
            post_type: form.post_type,
            title: form.title,
            content: form.content,
            schedule: form.schedule || null,
            time_range: form.time_range || null,
            slots: form.slots ? parseInt(form.slots) : null,
            requirements: form.requirements ? form.requirements.split('\n').filter(Boolean) : [],
            status: form.status || 'Open',
            accept_referrals: form.accept_referrals !== false,
            author_type: 'student',
            image_url: form.imagePreview || null,
            tags: [],
        };

        let res;
        if (editPost) {
            res = await adminUpdatePost(editPost.id, payload);
        } else {
            res = await createPost(payload);
        }

        setSaving(false);
        if (res.success) {
            showToast(editPost ? 'Post updated successfully!' : 'Post published successfully!');
            setShowForm(false);
            setEditPost(null);
        } else {
            alert(res.error || 'Failed to save post.');
        }
    };

    const handleDelete = async (postId) => {
        if (!window.confirm('Delete this post? This cannot be undone.')) return;
        const res = await adminDeletePost(postId);
        if (res.success) {
            showToast('Post deleted.');
            if (selectedPost?.id === postId) setSelectedPost(null);
        } else {
            alert(res.error || 'Failed to delete post.');
        }
    };

    const handleStatusChange = async (postId, newStatus) => {
        const res = await adminUpdatePost(postId, { status: newStatus });
        if (res.success) showToast(`Status changed to ${newStatus}`);
    };

    const handleInteractionAction = async (interactionId, action) => {
        const res = await updatePostInteractionStatus(interactionId, action);
        if (res.success) showToast(`Interaction ${action}.`);
    };

    const selectedInteractions = selectedPost ? getPostInteractions(selectedPost.id) : [];
    const tabInteractions = selectedInteractions.filter(i => i.interaction_type === interactionTab);

    // Summary counts
    const countsForPost = (postId) => {
        const all = getPostInteractions(postId);
        return {
            apply: all.filter(i => i.interaction_type === 'apply' && i.status === 'pending').length,
            register: all.filter(i => i.interaction_type === 'register' && i.status === 'pending').length,
            refer: all.filter(i => i.interaction_type === 'refer' && i.status === 'pending').length,
            inquire: all.filter(i => i.interaction_type === 'inquire' && i.status === 'pending').length,
        };
    };

    return (
        <div>
            {/* Toast */}
            {toast && (
                <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                    <CheckCircle size={14} style={{ marginRight: 8 }} />{toast}
                </div>
            )}

            {/* Page Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Training Bulletin</h1>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>Manage training opportunities visible to trainees and industry partners</div>
                </div>
                <button
                    onClick={() => { setEditPost(null); setShowForm(true); }}
                    style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #7c3aed, #db2777)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                    <Plus size={16} /> Create Post
                </button>
            </div>

            {/* Stats Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                {POST_TYPES.map(pt => {
                    const count = bulletinPosts.filter(p => p.post_type === pt.id).length;
                    return (
                        <div key={pt.id} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '1px solid #e2e8f0', display: 'flex', gap: 12, alignItems: 'center' }}>
                            <div style={{ width: 38, height: 38, borderRadius: 10, background: pt.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: pt.color, flexShrink: 0 }}>
                                {pt.icon}
                            </div>
                            <div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{count}</div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>{pt.label}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Filters */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '1px solid #e2e8f0', marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200, background: '#f8fafc', borderRadius: 8, padding: '8px 12px', border: '1px solid #e2e8f0' }}>
                    <Search size={14} color="#94a3b8" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search posts..."
                        style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, width: '100%' }}
                    />
                </div>
                <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, color: '#475569', background: '#fff', outline: 'none' }}>
                    <option value="All">All Types</option>
                    {POST_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, color: '#475569', background: '#fff', outline: 'none' }}>
                    <option value="All">All Statuses</option>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedPost ? '1fr 1fr' : '1fr', gap: 16 }}>
                {/* Posts List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filtered.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '48px 24px', color: '#94a3b8', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                            <Megaphone size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                            <div style={{ fontWeight: 600 }}>No posts found</div>
                            <div style={{ fontSize: 13, marginTop: 4 }}>Create your first bulletin post to get started</div>
                        </div>
                    )}
                    {filtered.map(post => {
                        const pt = getPostType(post.post_type);
                        const counts = countsForPost(post.id);
                        const totalPending = counts.apply + counts.register + counts.refer + counts.inquire;
                        const isSelected = selectedPost?.id === post.id;
                        return (
                            <div
                                key={post.id}
                                onClick={() => setSelectedPost(isSelected ? null : post)}
                                style={{
                                    background: '#fff', borderRadius: 12, border: `2px solid ${isSelected ? pt.color : '#e2e8f0'}`,
                                    padding: '16px', cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s',
                                    boxShadow: isSelected ? `0 0 0 4px ${pt.bg}` : 'none',
                                }}
                            >
                                {/* Post card top */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 10, background: pt.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: pt.color, flexShrink: 0 }}>
                                        {pt.icon}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 2 }}>{post.title}</div>
                                        <div style={{ fontSize: 12, color: '#64748b' }}> {pt.label} | {new Date(post.created_at).toLocaleDateString()}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                        {post.status && (
                                            <span style={{ padding: '3px 10px', borderRadius: 20, background: statusColors[post.status]?.bg || '#f1f5f9', color: statusColors[post.status]?.color || '#64748b', fontSize: 11, fontWeight: 700 }}>
                                                {post.status}
                                            </span>
                                        )}
                                        {totalPending > 0 && (
                                            <span style={{ padding: '3px 10px', borderRadius: 20, background: '#fef3c7', color: '#d97706', fontSize: 11, fontWeight: 700 }}>
                                                {totalPending} pending
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Post details */}
                                {(post.schedule || post.slots) && (
                                    <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                                        {post.schedule && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#475569', background: '#f1f5f9', padding: '3px 8px', borderRadius: 6 }}>
                                                <Calendar size={11} /> {formatBulletinDate(post.schedule)}
                                            </span>
                                        )}
                                        {post.slots && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#475569', background: '#f1f5f9', padding: '3px 8px', borderRadius: 6 }}>
                                                <Users size={11} /> {post.slots} slots
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Actions row */}
                                <div style={{ display: 'flex', gap: 6, borderTop: '1px solid #f1f5f9', paddingTop: 10, flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                                    {/* Status change */}
                                    {STATUSES.filter(s => s !== post.status).map(s => (
                                        <button
                                            key={s}
                                            onClick={() => handleStatusChange(post.id, s)}
                                            style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${statusColors[s]?.color || '#e2e8f0'}`, background: '#fff', color: statusColors[s]?.color || '#64748b', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                                        >
                                            Set {s}
                                        </button>
                                    ))}
                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                                        <button onClick={() => { setEditPost(post); setShowForm(true); }} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Edit size={12} /> Edit
                                        </button>
                                        <button onClick={() => handleDelete(post.id)} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #fee2e2', background: '#fff', color: '#dc2626', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Trash2 size={12} /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Interactions Panel */}
                {selectedPost && (() => {
                    const pt = getPostType(selectedPost.post_type);
                    const allTabs = selectedPost.post_type === 'announcement'
                        ? (selectedPost.accept_referrals ? ['refer', 'inquire'] : ['inquire'])
                        : selectedPost.post_type === 'training_batch'
                            ? ['apply', 'refer', 'inquire']
                            : ['register', 'refer', 'inquire'];

                    return (
                        <div style={{ background: '#fff', borderRadius: 12, border: `2px solid ${pt.color}`, overflow: 'hidden', alignSelf: 'flex-start', position: 'sticky', top: 20 }}>
                            {/* Panel header */}
                            <div style={{ background: pt.bg, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: pt.color }}>{selectedPost.title}</div>
                                    <div style={{ fontSize: 12, color: pt.color, opacity: 0.7 }}>Engagement & Responses</div>
                                </div>
                                <button onClick={() => setSelectedPost(null)} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'rgba(0,0,0,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <X size={14} color={pt.color} />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
                                {allTabs.map(tab => {
                                    const tabItems = getPostInteractions(selectedPost.id, tab);
                                    const pendingCount = tabItems.filter(i => i.status === 'pending').length;
                                    return (
                                        <button
                                            key={tab}
                                            onClick={() => setInteractionTab(tab)}
                                            style={{
                                                flex: 1, padding: '10px 12px', border: 'none', borderBottom: `3px solid ${interactionTab === tab ? pt.color : 'transparent'}`,
                                                background: 'transparent', cursor: 'pointer', color: interactionTab === tab ? pt.color : '#64748b',
                                                fontWeight: interactionTab === tab ? 700 : 500, fontSize: 12, textTransform: 'capitalize', whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {interactionLabels[tab]}
                                            {pendingCount > 0 && (
                                                <span style={{ marginLeft: 6, background: '#fef3c7', color: '#d97706', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>
                                                    {pendingCount}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Interaction List */}
                            <div style={{ maxHeight: 420, overflowY: 'auto', padding: '12px' }}>
                                {tabInteractions.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94a3b8' }}>
                                        <Users size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                                        <div style={{ fontSize: 13 }}>No {interactionLabels[interactionTab]?.toLowerCase()}s yet</div>
                                    </div>
                                ) : (
                                    tabInteractions.map(interaction => {
                                        const d = interaction.details || {};
                                        const userName = d.user_name || (interaction.user_type === 'student'
                                            ? trainees.find(t => t.id === interaction.user_id)?.full_name
                                            : partners.find(p => p.id === interaction.user_id)?.company_name)
                                            || `User ${interaction.user_id?.slice(0, 8)}`;

                                        return (
                                            <div key={interaction.id} style={{ borderRadius: 10, border: '1px solid #e2e8f0', padding: '12px', marginBottom: 10 }}>
                                                {/* Interaction header */}
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: pt.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: pt.color }}>
                                                            {userName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>
                                                                {userName}
                                                            </div>
                                                            <div style={{ fontSize: 11, color: '#94a3b8' }}>
                                                                {interaction.user_type === 'industry_partner' ? 'Industry Partner' : 'Trainee'} | {new Date(interaction.created_at).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <InteractionBadge status={interaction.status} />
                                                </div>

                                                {/* Details */}
                                                {interaction.interaction_type === 'inquire' && d.message && (
                                                    <div style={{ fontSize: 12.5, color: '#475569', background: '#f8fafc', borderRadius: 8, padding: '8px 12px', marginBottom: 8 }}>
                                                        <span style={{ fontWeight: 600, color: '#94a3b8', fontSize: 11 }}>Message: </span>{d.message}
                                                    </div>
                                                )}
                                                {interaction.interaction_type === 'refer' && (
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                                                        {[['Apprentice', d.apprentice_name], ['Contact', d.apprentice_contact], ['Notes', d.notes]].filter(([, v]) => v).map(([k, v]) => (
                                                            <div key={k} style={{ background: '#f8fafc', borderRadius: 6, padding: '6px 10px' }}>
                                                                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>{k}</div>
                                                                <div style={{ fontSize: 12, color: '#334155', fontWeight: 500 }}>{v}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Approve/Reject buttons */}
                                                {interaction.status === 'pending' && (
                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        <button
                                                            onClick={() => handleInteractionAction(interaction.id, 'approved')}
                                                            style={{ flex: 1, padding: '7px', borderRadius: 8, border: 'none', background: '#dcfce7', color: '#16a34a', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                                                        >
                                                            <CheckCircle size={12} /> Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleInteractionAction(interaction.id, 'rejected')}
                                                            style={{ flex: 1, padding: '7px', borderRadius: 8, border: 'none', background: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                                                        >
                                                            <XCircle size={12} /> Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* Post Form Modal */}
            {showForm && (
                <PostFormModal
                    editPost={editPost}
                    onClose={() => { setShowForm(false); setEditPost(null); }}
                    onSave={handleSave}
                    saving={saving}
                    programs={programs}
                />
            )}
        </div>
    );
}
