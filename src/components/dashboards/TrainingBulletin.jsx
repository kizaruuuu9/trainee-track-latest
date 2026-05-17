import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext';
import { usePosts, usePrograms, usePostInteractions } from '../../hooks';
import {
    Plus, Eye, Edit, Trash2, X, CheckCircle, XCircle, Clock,
    Calendar, Users, FileText, Award, Megaphone, ChevronDown,
    ChevronUp, Search, Filter, BookOpen, Send, Bookmark,
    MessageSquare, UserCheck, AlertCircle, RefreshCw, Download, Check
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

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
        traineeActions: ['View'],
        partnerActions: ['View'],
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
    attachments: [], // Array of { file, name, url, instruction }
    links: [], // Array of { url, label, instruction }
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

    // General announcements only have 'View' by default. No dynamic referral button.

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
                        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginBottom: 6 }}>Requirement Instructions</div>
                        <div style={{ 
                            fontSize: 13, 
                            color: '#475569', 
                            whiteSpace: 'pre-wrap', 
                            lineHeight: 1.5 
                        }}>
                            {form.requirements}
                        </div>
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
                            {action}
                        </button>
                    ))}

                    {/* Multiple Attachments Display */}
                    {(form.attachments && form.attachments.length > 0) && (
                        <div style={{ width: '100%', marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: 2 }}>Requirements Documents</div>
                            {form.attachments.map((at, idx) => (
                                <div key={idx} style={{ 
                                    padding: '8px 12px', 
                                    background: '#f8fafc', 
                                    borderRadius: 8, 
                                    border: '1px solid #e2e8f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 12
                                }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <FileText size={14} color={pt.color} />
                                            <span style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {at.name}
                                            </span>
                                        </div>
                                        {at.instruction && (
                                            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2, paddingLeft: 22 }}>
                                                Note: {at.instruction}
                                            </div>
                                        )}
                                    </div>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (at.url) window.open(at.url, '_blank');
                                        }}
                                        style={{ padding: '4px 10px', borderRadius: 4, border: `1px solid ${pt.color}`, background: 'transparent', color: pt.color, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                    >
                                        <Download size={11} /> {at.url ? 'Download' : 'Preview'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    {/* Multiple Links Display */}
                    {(form.links && form.links.length > 0) && (
                        <div style={{ width: '100%', marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: 2 }}>Relevant Links</div>
                            {form.links.map((ln, idx) => (
                                <div key={idx} style={{ 
                                    padding: '8px 12px', 
                                    background: '#f8fafc', 
                                    borderRadius: 8, 
                                    border: '1px solid #e2e8f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 12
                                }}>
                                    <div 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (ln.url) window.open(ln.url.startsWith('http') ? ln.url : `https://${ln.url}`, '_blank');
                                        }}
                                        style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, cursor: 'pointer' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Search size={14} color={pt.color} />
                                            <span style={{ 
                                                fontSize: 12, 
                                                fontWeight: 700, 
                                                color: pt.color,
                                                textDecoration: 'none',
                                                borderBottom: `1.5px solid transparent`,
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseOver={e => e.currentTarget.style.borderBottomColor = pt.color}
                                            onMouseOut={e => e.currentTarget.style.borderBottomColor = 'transparent'}
                                            >
                                                {ln.label || ln.url}
                                            </span>
                                        </div>
                                        {ln.instruction && (
                                            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2, paddingLeft: 22 }}>
                                                Note: {ln.instruction}
                                            </div>
                                        )}
                                    </div>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (ln.url) window.open(ln.url.startsWith('http') ? ln.url : `https://${ln.url}`, '_blank');
                                        }}
                                        style={{ padding: '4px 10px', borderRadius: 4, border: `1px solid ${pt.color}`, background: 'transparent', color: pt.color, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                    >
                                        <Eye size={11} /> Visit
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
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
        attachments: editPost.admin_metadata?.attachments || (editPost.attachment_url ? [{ name: editPost.attachment_name || 'Requirements', url: editPost.attachment_url }] : []),
        links: editPost.admin_metadata?.links || [],
    } : { ...emptyForm });
    const [previewAs, setPreviewAs] = useState('trainee');
    const [showPreview, setShowPreview] = useState(false);
    const [attachmentError, setAttachmentError] = useState('');
    const [programChecklist, setProgramChecklist] = useState([]);
    const [loadingChecklist, setLoadingChecklist] = useState(false);
    const pt = getPostType(form.post_type);
    const isAnnouncement = form.post_type === 'announcement';

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    // Fetch program requirements checklist templates when program name changes
    useEffect(() => {
        if (!form.title || isAnnouncement) {
            setProgramChecklist([]);
            return;
        }

        const matchingProgram = programs.find(p => p.name === form.title);
        if (!matchingProgram) {
            setProgramChecklist([]);
            return;
        }

        const fetchProgramChecklist = async () => {
            setLoadingChecklist(true);
            try {
                const { data, error } = await supabase
                    .from('program_requirements')
                    .select('*')
                    .eq('program_id', matchingProgram.id)
                    .order('created_at', { ascending: true });
                if (error) throw error;
                setProgramChecklist(data || []);
            } catch (err) {
                console.error('Error fetching program requirements checklist:', err);
            } finally {
                setLoadingChecklist(false);
            }
        };

        fetchProgramChecklist();
    }, [form.title, form.post_type, programs, isAnnouncement]);

    const isIncluded = (req) => {
        return (form.attachments || []).some(at => at.url === req.file_url);
    };

    const handleToggleChecklist = (req) => {
        if (isIncluded(req)) {
            // Remove from attachments list
            set('attachments', (form.attachments || []).filter(at => at.url !== req.file_url));
        } else {
            // Append to attachments list as standard template document attachment
            // Actual file name is the name, and the description of the file is the instruction/note
            set('attachments', [
                ...(form.attachments || []),
                { name: req.file_name, url: req.file_url, instruction: req.name }
            ]);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }}>
            <div style={{ 
                background: '#fff', 
                borderRadius: 16, 
                width: '95%', 
                maxWidth: showPreview ? 1300 : 1000, // Added 200px more per user request
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                position: 'relative'
            }} onClick={e => e.stopPropagation()}>
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

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: showPreview ? 'repeat(auto-fit, minmax(350px, 1fr))' : '1fr', 
                    gap: 0,
                    flex: 1,
                    overflow: 'hidden'
                }}>
                    {/* Form Side */}
                    <div style={{ padding: '20px 24px', borderRight: (showPreview && window.innerWidth > 768) ? '1px solid #e2e8f0' : 'none', overflowY: 'auto' }}>
                        {/* Post Type Selector */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Post Type *</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                {POST_TYPES.map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => {
                                            set('post_type', type.id);
                                            // Announcements don't accept referrals
                                            if (type.id === 'announcement') set('accept_referrals', false);
                                        }}
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
                            {!isAnnouncement && !form.title && (
                                <div style={{ fontSize: 11.5, color: '#ef4444', marginTop: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <AlertCircle size={12} />
                                    Program selection is required to publish a training batch or exam schedule.
                                </div>
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

                                {/* Requirement Instructions Text */}
                                <div style={{ marginBottom: 14 }}>
                                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Requirement Instructions</label>
                                    <textarea
                                        value={form.requirements}
                                        onChange={e => set('requirements', e.target.value)}
                                        placeholder={"e.g. Please bring original birth certificate\nWear formal attire during the exam"}
                                        rows={6}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                                    />
                                </div>

                                {/* Dedicated Program Checklist Templates Selector */}
                                {!isAnnouncement && form.title && (
                                    <div style={{ 
                                        marginBottom: 16, 
                                        padding: 16, 
                                        background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)', 
                                        border: '1.5px solid #e9d5ff', 
                                        borderRadius: 12,
                                        boxShadow: '0 4px 12px rgba(124, 58, 237, 0.04)' 
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                            <Award size={16} color="#7c3aed" />
                                            <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                                Dedicated Program Checklist Templates
                                            </h4>
                                        </div>
                                        <p style={{ margin: '0 0 12px', fontSize: 12, color: '#475569', lineHeight: 1.45 }}>
                                            Select default requirement templates configured for <strong>{form.title}</strong> to automatically attach them to this post.
                                        </p>

                                        {loadingChecklist ? (
                                            <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0' }}>
                                                <div style={{ width: 12, height: 12, border: '2px solid #cbd5e1', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                                Scanning program checklist requirements...
                                            </div>
                                        ) : programChecklist.length === 0 ? (
                                            <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', background: '#ffffff', padding: '10px 12px', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                                                No checklist requirement templates configured for this program. You can configure them in the TESDA Programs tab.
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                {programChecklist.map(req => {
                                                    const checked = isIncluded(req);
                                                    return (
                                                        <div 
                                                            key={req.id} 
                                                            onClick={() => handleToggleChecklist(req)}
                                                            style={{ 
                                                                padding: '10px 12px', 
                                                                background: '#ffffff', 
                                                                border: `1.5px solid ${checked ? '#7c3aed' : '#e2e8f0'}`, 
                                                                borderRadius: 8, 
                                                                display: 'flex', 
                                                                alignItems: 'center', 
                                                                justifyContent: 'space-between',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s',
                                                                boxShadow: checked ? '0 2px 8px rgba(124, 58, 237, 0.08)' : 'none'
                                                            }}
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                                                                <div style={{ 
                                                                    width: 18, 
                                                                    height: 18, 
                                                                    borderRadius: 4, 
                                                                    border: `1.5px solid ${checked ? '#7c3aed' : '#cbd5e1'}`, 
                                                                    background: checked ? '#7c3aed' : '#ffffff', 
                                                                    display: 'flex', 
                                                                    alignItems: 'center', 
                                                                    justifyContent: 'center',
                                                                    flexShrink: 0,
                                                                    transition: 'all 0.15s'
                                                                }}>
                                                                    {checked && <Check size={12} color="#ffffff" strokeWidth={3} />}
                                                                </div>
                                                                <div style={{ minWidth: 0 }}>
                                                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{req.name}</div>
                                                                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                        <FileText size={11} color="#64748b" />
                                                                        <span>File: <strong style={{ color: '#475569' }}>{req.file_name}</strong></span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {req.file_url && (
                                                                <a 
                                                                    href={req.file_url} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer" 
                                                                    onClick={e => e.stopPropagation()}
                                                                    style={{ 
                                                                        fontSize: 11.5, 
                                                                        color: '#0284c7', 
                                                                        fontWeight: 600, 
                                                                        textDecoration: 'underline',
                                                                        marginLeft: 8,
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: 4
                                                                    }}
                                                                >
                                                                    <FileText size={12} /> Template
                                                                </a>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Multiple Requirements Files Upload */}
                                <div style={{ marginBottom: 14 }}>
                                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Requirements Documents <span style={{ color: '#94a3b8', textTransform: 'none', fontWeight: 400 }}>(Optional - Multiple Files)</span></label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <input
                                            type="file"
                                            multiple
                                            onChange={e => {
                                                const files = Array.from(e.target.files);
                                                if (files.length > 0) {
                                                    const existingNames = form.attachments.map(a => a.name);
                                                    const filtered = files.filter(f => !existingNames.includes(f.name));
                                                    
                                                    if (filtered.length < files.length) {
                                                        setAttachmentError("This file is already in the requirements list.");
                                                    }

                                                    if (filtered.length > 0) {
                                                        setAttachmentError(''); // Clear error if at least one new file is added
                                                        const newAttachments = filtered.map(file => ({ file, name: file.name, url: null, instruction: '' }));
                                                        set('attachments', [...form.attachments, ...newAttachments]);
                                                    }
                                                    e.target.value = ''; // Clear the input so filename doesn't stick
                                                }
                                            }}
                                            style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1.5px dashed #cbd5e1', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#f8fafc', cursor: 'pointer' }}
                                        />

                                        {attachmentError && (
                                            <div style={{ fontSize: 10, color: '#ef4444', marginTop: 4, fontWeight: 500 }}>
                                                {attachmentError}
                                            </div>
                                        )}
                                        
                                        {form.attachments.length > 0 && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                {form.attachments.map((at, idx) => (
                                                    <div key={idx} style={{ padding: '10px 12px', background: '#f1f5f9', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                                                <FileText size={14} color="#64748b" />
                                                                <span style={{ fontSize: 13, color: '#334155', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                    {at.name}
                                                                </span>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <button
                                                                    onClick={() => {
                                                                        const updated = [...form.attachments];
                                                                        updated.splice(idx, 1);
                                                                        set('attachments', updated);
                                                                    }}
                                                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {(!at.showInstruction && !at.instruction) && (
                                                            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                                                <button
                                                                    onClick={() => {
                                                                        const updated = [...form.attachments];
                                                                        updated[idx].showInstruction = true;
                                                                        set('attachments', updated);
                                                                    }}
                                                                    style={{ background: 'transparent', border: 'none', color: '#7c3aed', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, padding: '2px 0' }}
                                                                >
                                                                    <Plus size={12} /> Add Note
                                                                </button>
                                                            </div>
                                                        )}

                                                        {(at.showInstruction || at.instruction) && (
                                                            <div style={{ position: 'relative' }}>
                                                                <input 
                                                                    type="text"
                                                                    value={at.instruction || ''}
                                                                    onChange={e => {
                                                                        const updated = [...form.attachments];
                                                                        updated[idx].instruction = e.target.value;
                                                                        set('attachments', updated);
                                                                    }}
                                                                    placeholder="Add specific instruction for this file (optional)..."
                                                                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 11, outline: 'none', background: '#fff' }}
                                                                />
                                                                {!at.instruction && (
                                                                    <button 
                                                                        onClick={() => {
                                                                            const updated = [...form.attachments];
                                                                            updated[idx].showInstruction = false;
                                                                            set('attachments', updated);
                                                                        }}
                                                                        style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                                                                    >
                                                                        <X size={12} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Requirement Links */}
                                <div style={{ marginBottom: 14 }}>
                                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Requirement Links <span style={{ color: '#94a3b8', textTransform: 'none', fontWeight: 400 }}>(Optional - Multiple URLs)</span></label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                set('links', [...form.links, { url: '', label: '', instruction: '', isValid: null, validating: false }]);
                                            }}
                                            style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px dashed #cbd5e1', fontSize: 13, color: '#64748b', fontWeight: 600, background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                        >
                                            <Plus size={14} /> Add Link
                                        </button>

                                        {form.links.length > 0 && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                {form.links.map((ln, idx) => (
                                                    <div key={idx} style={{ padding: '12px', background: '#f1f5f9', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid #e2e8f0' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <input 
                                                                type="text"
                                                                value={ln.label}
                                                                onChange={e => {
                                                                    const updated = [...form.links];
                                                                    updated[idx].label = e.target.value;
                                                                    set('links', updated);
                                                                }}
                                                                placeholder="Link Label (e.g., Application Form)"
                                                                style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12, outline: 'none' }}
                                                            />
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const updated = [...form.links];
                                                                        updated.splice(idx, 1);
                                                                        set('links', updated);
                                                                    }}
                                                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div style={{ position: 'relative' }}>
                                                            <input 
                                                                type="text"
                                                                value={ln.url}
                                                                onChange={e => {
                                                                    const val = e.target.value;
                                                                    const updated = [...form.links];
                                                                    updated[idx].url = val;
                                                                    updated[idx].isValid = null;
                                                                    updated[idx].validating = !!val;
                                                                    set('links', updated);

                                                                    // Debounced validation
                                                                    if (ln.validationTimeout) clearTimeout(ln.validationTimeout);
                                                                    updated[idx].validationTimeout = setTimeout(async () => {
                                                                        if (!val.trim()) {
                                                                            setForm(prev => {
                                                                                const next = [...prev.links];
                                                                                if (next[idx]) {
                                                                                    next[idx].isValid = null;
                                                                                    next[idx].validating = false;
                                                                                }
                                                                                return { ...prev, links: next };
                                                                            });
                                                                            return;
                                                                        }

                                                                        const urlPattern = /^(https?:\/\/)?([\w\d.-]+\.)+[\w\d.-]+(\/.*)?$/i;
                                                                        const isFormatOk = urlPattern.test(val);
                                                                        
                                                                        if (!isFormatOk) {
                                                                            setForm(prev => {
                                                                                const next = [...prev.links];
                                                                                if (next[idx]) {
                                                                                    next[idx].isValid = false;
                                                                                    next[idx].validating = false;
                                                                                }
                                                                                return { ...prev, links: next };
                                                                            });
                                                                            return;
                                                                        }

                                                                        // Reachability check
                                                                        try {
                                                                            const targetUrl = val.startsWith('http') ? val : `https://${val}`;
                                                                            // Using no-cors to check existence without being blocked by CORS
                                                                            // This is a "best effort" check.
                                                                            await fetch(targetUrl, { mode: 'no-cors' });
                                                                            
                                                                            setForm(prev => {
                                                                                const next = [...prev.links];
                                                                                if (next[idx]) {
                                                                                    next[idx].isValid = true;
                                                                                    next[idx].validating = false;
                                                                                }
                                                                                return { ...prev, links: next };
                                                                            });
                                                                        } catch (err) {
                                                                            setForm(prev => {
                                                                                const next = [...prev.links];
                                                                                if (next[idx]) {
                                                                                    next[idx].isValid = false;
                                                                                    next[idx].validating = false;
                                                                                }
                                                                                return { ...prev, links: next };
                                                                            });
                                                                        }
                                                                    }, 1000);
                                                                }}
                                                                placeholder="URL (e.g., https://example.com)"
                                                                style={{ width: '100%', padding: '6px 32px 6px 10px', borderRadius: 6, border: `1px solid ${ln.isValid === false ? '#ef4444' : ln.isValid === true ? '#22c55e' : '#cbd5e1'}`, fontSize: 12, outline: 'none', transition: 'border-color 0.2s' }}
                                                            />
                                                            <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                                                                {ln.validating && <div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid #cbd5e1', borderTopColor: '#7c3aed', borderRadius: '50%' }} />}
                                                                {!ln.validating && ln.isValid === true && <Check size={14} color="#22c55e" />}
                                                                {!ln.validating && ln.isValid === false && <AlertCircle size={14} color="#ef4444" />}
                                                            </div>
                                                        </div>

                                                        {!ln.validating && ln.isValid === false && (
                                                            <div style={{ fontSize: 10, color: '#ef4444', marginTop: -4, paddingLeft: 2, fontWeight: 500 }}>
                                                                Invalid or unreachable link
                                                            </div>
                                                        )}

                                                        {(!ln.showInstruction && !ln.instruction) && (
                                                            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const updated = [...form.links];
                                                                        updated[idx].showInstruction = true;
                                                                        set('links', updated);
                                                                    }}
                                                                    style={{ background: 'transparent', border: 'none', color: '#7c3aed', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, padding: '2px 0' }}
                                                                >
                                                                    <Plus size={12} /> Add Note
                                                                </button>
                                                            </div>
                                                        )}

                                                        {(ln.showInstruction || ln.instruction) && (
                                                            <div style={{ position: 'relative' }}>
                                                                <input 
                                                                    type="text"
                                                                    value={ln.instruction || ''}
                                                                    onChange={e => {
                                                                        const updated = [...form.links];
                                                                        updated[idx].instruction = e.target.value;
                                                                        set('links', updated);
                                                                    }}
                                                                    placeholder="Add specific instruction for this link (optional)..."
                                                                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 11, outline: 'none', background: '#fff' }}
                                                                />
                                                                {!ln.instruction && (
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const updated = [...form.links];
                                                                            updated[idx].showInstruction = false;
                                                                            set('links', updated);
                                                                        }}
                                                                        style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                                                                    >
                                                                        <X size={12} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </>
                        )}

                        {/* Accept Referrals Toggle (Hidden for announcements) */}
                        {!isAnnouncement && (
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
                        )}
                    </div>

                    {/* Preview Side */}
                    {showPreview && (
                        <div style={{ padding: '20px', background: '#f8fafc', overflowY: 'auto' }}>
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
    const { createPost, adminUpdatePost, adminDeletePost,
        fetchPostInteractions, updatePostInteractionStatus, getPostInteractions,
        currentUser, trainees, partners, confirmAction } = useApp();
        
    const { data: posts = [] } = usePosts();
    const { data: programsData } = usePrograms();
    const programs = programsData?.data || [];
    const { data: postInteractions = [] } = usePostInteractions();

    const [showForm, setShowForm] = useState(false);
    const [editPost, setEditPost] = useState(null);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [selectedPost, setSelectedPost] = useState(null);
    const [interactionTab, setInteractionTab] = useState('apply');
    // Using global toast from react-hot-toast imported at the top

    // Load interactions when a post is selected
    useEffect(() => {
        if (selectedPost) {
            fetchPostInteractions(selectedPost.id);
        }
    }, [selectedPost]);

    // Refresh data on mount
    useEffect(() => {
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

    // Prevent background scroll when modal is open
    useEffect(() => {
        if (showForm) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            document.documentElement.style.overflow = 'unset';
        }
        return () => { 
            document.body.style.overflow = 'unset'; 
            document.documentElement.style.overflow = 'unset';
        };
    }, [showForm]);

    const handleSave = async (form) => {
        // Enforce program selection validation for training batch and exam schedule posts
        if (form.post_type !== 'announcement' && !form.title) {
            toast.error("Please select a program before publishing.");
            return;
        }

        setSaving(true);
        try {
            // Filter out completely blank requirement link entries
            const activeLinks = (form.links || []).filter(ln => (ln.url || '').trim() !== '' || (ln.label || '').trim() !== '');

            // Validate active links
            if (activeLinks.length > 0) {
                const urlPattern = /^(https?:\/\/)?([\w\d.-]+\.)+[\w\d.-]+(\/.*)?$/i;
                for (const ln of activeLinks) {
                    if (!ln.url) {
                        toast.error("Please provide a URL for all links.");
                        setSaving(false);
                        return;
                    }
                    if (!urlPattern.test(ln.url)) {
                        toast.error(`Invalid URL format: ${ln.url}`);
                        setSaving(false);
                        return;
                    }
                }
            }

            let finalImageUrl = form.imagePreview;
            const finalAttachments = [];

            // Handle Image Upload
            if (form.image) {
                const path = `bulletin/images/${Date.now()}_${form.image.name}`;
                const { error: uploadErr } = await supabase.storage.from('registration-uploads').upload(path, form.image);
                if (uploadErr) throw uploadErr;
                const { data: { publicUrl } } = supabase.storage.from('registration-uploads').getPublicUrl(path);
                finalImageUrl = publicUrl;
            }

            // Handle Multiple Attachments Upload
            for (const at of form.attachments) {
                if (at.file) {
                    const path = `bulletin/attachments/${Date.now()}_${at.file.name}`;
                    const { error: uploadErr } = await supabase.storage.from('registration-uploads').upload(path, at.file);
                    if (uploadErr) throw uploadErr;
                    const { data: { publicUrl } } = supabase.storage.from('registration-uploads').getPublicUrl(path);
                    finalAttachments.push({ name: at.file.name, url: publicUrl, type: at.file.type, instruction: at.instruction });
                } else if (at.url) {
                    finalAttachments.push(at);
                }
            }

            const payload = {
                post_type: form.post_type,
                title: form.title,
                content: form.content,
                schedule: form.schedule || null,
                time_range: form.time_range || null,
                slots: form.slots ? parseInt(form.slots) : null,
                requirements: form.requirements.split('\n').filter(line => line.trim() !== ''),
                status: form.status || 'Open',
                accept_referrals: form.accept_referrals !== false,
                image_url: finalImageUrl,
                attachment_url: finalAttachments[0]?.url || null, // Keep for backward compatibility
                attachment_name: finalAttachments[0]?.name || null,
                attachment_type: finalAttachments[0]?.type || null,
                admin_metadata: {
                    ...editPost?.admin_metadata,
                    attachments: finalAttachments,
                    links: activeLinks
                },
                tags: [],
            };

            let res;
            if (editPost) {
                res = await adminUpdatePost(editPost.id, payload);
            } else {
                res = await createPost(payload);
            }

            if (res.success) {
                toast.success(editPost ? 'Post updated successfully!' : 'Post published successfully!');
                setShowForm(false);
                setEditPost(null);
            } else {
                throw new Error(res.error || 'Failed to save post.');
            }
        } catch (err) {
            console.error('Save error:', err);
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (postId) => {
        if (!window.confirm('Delete this post? This cannot be undone.')) return;
        const res = await adminDeletePost(postId);
        if (res.success) {
            toast.success('Post deleted successfully');
            if (selectedPost?.id === postId) setSelectedPost(null);
        } else {
            toast.error(res.error || 'Failed to delete post.');
        }
    };

    const handleStatusChange = async (postId, newStatus) => {
        const res = await adminUpdatePost(postId, { status: newStatus });
        if (res.success) toast.success(`Status changed to ${newStatus}`);
        else toast.error('Failed to change status');
    };

    const handleInteractionAction = async (interactionId, action) => {
        const res = await updatePostInteractionStatus(interactionId, action);
        if (res.success) toast.success(`Interaction ${action} successfully`);
        else toast.error(`Failed to ${action} interaction`);
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
            {false && (
                <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                    <CheckCircle size={14} style={{ marginRight: 8 }} />Toast
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

                                {/* Attachments row */}
                                {(() => {
                                    const attachments = post.admin_metadata?.attachments || (post.attachment_url ? [{ name: post.attachment_name || 'Requirements', url: post.attachment_url }] : []);
                                    if (attachments.length === 0) return null;

                                    return (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                                            {attachments.map((at, i) => (
                                                <div key={i} style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <FileText size={14} color={pt.color} />
                                                            <span style={{ fontSize: 12, fontWeight: 600, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {at.name}
                                                            </span>
                                                        </div>
                                                        {at.instruction && (
                                                            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2, paddingLeft: 22 }}>
                                                                Note: {at.instruction}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); window.open(at.url, '_blank'); }}
                                                        style={{ padding: '4px 8px', borderRadius: 4, border: `1px solid ${pt.color}`, background: 'transparent', color: pt.color, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                                    >
                                                        <Download size={12} /> Download
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}

                                {/* Links row */}
                                {(() => {
                                    const links = post.admin_metadata?.links || [];
                                    if (links.length === 0) return null;

                                    return (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                                            {links.map((ln, i) => (
                                                <div key={i} style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                                    <div 
                                                        onClick={(e) => { e.stopPropagation(); window.open(ln.url.startsWith('http') ? ln.url : `https://${ln.url}`, '_blank'); }}
                                                        style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, cursor: 'pointer' }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <Search size={14} color={pt.color} />
                                                            <span style={{ 
                                                                fontSize: 12, 
                                                                fontWeight: 700, 
                                                                color: pt.color,
                                                                textDecoration: 'none',
                                                                borderBottom: `1.5px solid transparent`,
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseOver={e => e.currentTarget.style.borderBottomColor = pt.color}
                                                            onMouseOut={e => e.currentTarget.style.borderBottomColor = 'transparent'}
                                                            >
                                                                {ln.label || ln.url}
                                                            </span>
                                                        </div>
                                                        {ln.instruction && (
                                                            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2, paddingLeft: 22 }}>
                                                                Note: {ln.instruction}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); window.open(ln.url.startsWith('http') ? ln.url : `https://${ln.url}`, '_blank'); }}
                                                        style={{ padding: '4px 8px', borderRadius: 4, border: `1px solid ${pt.color}`, background: 'transparent', color: pt.color, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                                    >
                                                        <Eye size={12} /> Visit
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
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
