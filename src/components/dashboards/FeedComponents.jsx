import React, { useState, useRef, useEffect } from 'react';
import {
  Building2, MapPin, Clock, Briefcase, Users, CheckCircle,
  Target, ShieldCheck, Plus, X, Camera, FileText,
  MessageSquare, Bookmark, Send, Trash2, Edit, Mail, Info, ChevronRight, Eye
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

// --- HELPERS (Copied from dashboards) ---
export const timeAgo = (dateStr) => {
  const raw = String(dateStr || '').trim();
  if (!raw) return 'Just now';
  const now = new Date();
  const date = new Date(raw);
  if (!Number.isFinite(date.getTime())) return 'Just now';
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
  return `${Math.floor(months / 12)}y ago`;
};

export const isImageAttachment = (attachmentUrl, attachmentType) => {
  const mime = String(attachmentType || '').toLowerCase();
  if (mime.startsWith('image/')) return true;
  const cleanUrl = String(attachmentUrl || '').split('?')[0].toLowerCase();
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(cleanUrl);
};

export const formatSalaryDisplay = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const digitsOnly = raw.replace(/,/g, '');
  if (/^\d+$/.test(digitsOnly)) {
    return '₱' + Number(digitsOnly).toLocaleString('en-US');
  }
  return raw;
};

const isStudentAuthorType = (authorType = '') => {
  const normalized = String(authorType || '').toLowerCase();
  return normalized === 'student' || normalized === 'trainee';
};

const toProfileAuthorType = (authorType = '') => (isStudentAuthorType(authorType) ? 'trainee' : 'partner');

export const isVerified = (user) => user?.verificationStatus === 'Verified';

export const getLivePartner = (currentUser, partners = []) => {
  if (!currentUser) return null;
  // Look for partner record where user_id matches currentUser.id
  return partners.find(p => p.user_id === currentUser.id) || null;
};

export const resolvePartnerVisibility = (profile) => {
    if (!profile) return 'private';
    if (profile.verificationStatus === 'Verified') return 'public';
    return profile.visibility || 'private';
};

export const StatusBadge = ({ status }) => {
    const s = String(status || '').toLowerCase();
    const configs = {
        verified: { bg: '#dcfce7', color: '#166534', label: 'Verified' },
        pending: { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
        rejected: { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
        unverified: { bg: '#f1f5f9', color: '#475569', label: 'Unverified' }
    };
    const cfg = configs[s] || configs.unverified;
    return (
        <span style={{ 
            padding: '2px 8px', 
            borderRadius: 6, 
            fontSize: 11, 
            fontWeight: 700, 
            background: cfg.bg, 
            color: cfg.color 
        }}>
            {cfg.label}
        </span>
    );
};

// --- SHARED COMPONENTS ---

export const BULLETIN_CONFIG = {
  training: { label: 'Training Program', color: '#7c3aed', bg: '#ede9fe', emoji: '📚', traineeLabel: 'Apply', type: 'apply' },
  event: { label: 'Event', color: '#0ea5e9', bg: '#e0f2fe', emoji: '📅', traineeLabel: 'Register', type: 'register' },
  workshop: { label: 'Workshop', color: '#0ea5e9', bg: '#e0f2fe', emoji: '🛠️', traineeLabel: 'Register', type: 'register' },
  announcement: { label: 'Announcement', color: '#d97706', bg: '#fef3c7', emoji: '📢', traineeLabel: null, type: null },
  scholarship: { label: 'Scholarship', color: '#16a34a', bg: '#dcfce7', emoji: '🎓', traineeLabel: 'Apply', type: 'apply' },
  ojt_opportunity: { label: 'OJT Opportunity', color: '#ef4444', bg: '#fee2e2', emoji: '💼', traineeLabel: 'Apply', type: 'apply' },
  training_batch: { label: 'Training Batch', color: '#7c3aed', bg: '#ede9fe', emoji: '📚', traineeLabel: 'Apply', type: 'apply' },
  exam_schedule: { label: 'Exam Schedule', color: '#0ea5e9', bg: '#e0f2fe', emoji: '📝', traineeLabel: 'Register', type: 'register' },
  certification_assessment: { label: 'Certification Assessment', color: '#16a34a', bg: '#dcfce7', emoji: '🏆', traineeLabel: 'Register', type: 'register' }
};

/**
 * CreatePostTrigger: The bar that looks like an input but opens a modal
 */
export const CreatePostTrigger = ({ onClick, userAvatar, placeholder }) => (
  <div className="ln-card" style={{ padding: '12px 16px', marginBottom: 16, cursor: 'pointer' }} onClick={onClick}>
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <div className="ln-nav-avatar" style={{ flexShrink: 0, width: 40, height: 40, borderRadius: '50%', background: '#e4e6eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, overflow: 'hidden' }}>
        {userAvatar ? <img src={userAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'U'}
      </div>
      <div style={{ flex: 1, padding: '10px 16px', borderRadius: 24, border: '1px solid rgba(0,0,0,0.15)', background: '#f9fafb', color: 'rgba(0,0,0,0.5)', fontSize: 14 }}>
        {placeholder || "What's on your mind?"}
      </div>
    </div>
  </div>
);

// --- CONSTANTS ---

export const TRAINEE_POST_TYPES = [
  { value: 'general', label: 'Public', icon: '📝' },
  { value: 'achievement', label: 'Achievement', icon: '🏆' },
  { value: 'certification', label: 'Certification', icon: '📜' },
  { value: 'project', label: 'Project', icon: '🚀' }
];

export const PARTNER_POST_TYPES = [
  { value: 'announcement', label: 'Announcement', icon: '📢' },
  { value: 'hiring_update', label: 'Hiring Update', icon: '💼' },
  { value: 'achievement', label: 'Achievement', icon: '🏆' },
  { value: 'general', label: 'General', icon: '📝' }
];

/**
 * UniversalPostModal: A robust modal for creating and editing posts
 */
export const UniversalPostModal = ({
  isOpen,
  onClose,
  onSave,
  editingPost = null,
  userType = 'trainee',
  currentUser
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('general');
  const [expiryEnabled, setExpiryEnabled] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef(null);
  const postTypes = userType === 'partner' ? PARTNER_POST_TYPES : TRAINEE_POST_TYPES;

  // Sync state with editingPost
  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title || '');
      setContent(editingPost.content || editingPost.description || '');
      setType(editingPost.post_type || 'general');
      setExpiryEnabled(!!editingPost.expiry_date);
      setExpiryDate(editingPost.expiry_date || '');
      setFilePreview(editingPost.media_url || editingPost.attachmentUrl || null);
    } else {
      setTitle('');
      setContent('');
      setType('general');
      setExpiryEnabled(false);
      setExpiryDate('');
      setFilePreview(null);
    }
    setSelectedFile(null);
  }, [editingPost, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      await onSave({
        id: editingPost?.id,
        title,
        content,
        post_type: type,
        expiry_date: expiryEnabled ? expiryDate : null,
        file: selectedFile
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  // --- TRAINEE LAYOUT (INFORMAL SOCIAL DESIGN) ---
  const renderTraineeLayout = () => (
    <div className="ln-card ln-modal-content" style={{
      width: '100%', maxWidth: 500, padding: 0, borderRadius: 12,
      boxShadow: '0 12px 28px 0 rgba(0, 0, 0, 0.2), 0 2px 4px 0 rgba(0, 0, 0, 0.1)',
      overflow: 'hidden', animation: 'lnModalIn 0.2s ease-out'
    }} onClick={e => e.stopPropagation()}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f2f5', position: 'relative', textAlign: 'center' }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{editingPost ? 'Edit post' : 'Create post'}</h3>
        <button
          style={{
            position: 'absolute', right: 12, top: 12, background: '#e4e6eb',
            border: 'none', width: 32, height: 32, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>

      <div style={{ padding: '16px 16px' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div className="ln-feed-avatar" style={{ flexShrink: 0, width: 40, height: 40, borderRadius: '50%', background: '#e4e6eb', overflow: 'hidden' }}>
            {currentUser?.photo ? <img src={currentUser.photo} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : (currentUser?.name || 'U').charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{currentUser?.name || currentUser?.profileName}</div>
            <select
              style={{
                background: '#e4e6eb', border: 'none', borderRadius: 6,
                padding: '2px 8px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                marginTop: 4
              }}
              value={type}
              onChange={e => setType(e.target.value)}
            >
              {postTypes.map(pt => (
                <option key={pt.value} value={pt.value}>{pt.icon} {pt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <textarea
          autoFocus
          placeholder="What's on your mind?"
          style={{
            width: '100%', border: 'none', resize: 'none', fontSize: 18,
            minHeight: filePreview ? 80 : 150, padding: 0, outline: 'none', marginBottom: 20,
            color: '#1c1e21'
          }}
          value={content}
          onChange={e => setContent(e.target.value)}
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
            <X size={18} color="#65676b" cursor="pointer" onClick={() => setSelectedFile(null)} />
          </div>
        )}

        <div style={{
          border: '1px solid #e4e6eb', borderRadius: 8, padding: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 16
        }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Add to your post</span>
          <div style={{ display: 'flex', gap: 12, color: '#65676b' }}>
            <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx" />
            <Camera size={22} cursor="pointer" onClick={() => fileInputRef.current.click()} />
            <Plus size={22} cursor="pointer" onClick={() => fileInputRef.current.click()} />
          </div>
        </div>

        <button
          className="ln-btn-primary"
          style={{
            width: '100%', height: 36, borderRadius: 6, fontWeight: 600,
            opacity: (content.trim() || selectedFile) && !isSaving ? 1 : 0.5,
            cursor: (content.trim() || selectedFile) && !isSaving ? 'pointer' : 'not-allowed'
          }}
          disabled={(!content.trim() && !selectedFile) || isSaving}
          onClick={handleSubmit}
        >
          {isSaving ? 'Posting...' : (editingPost ? 'Save changes' : 'Post')}
        </button>
      </div>
    </div>
  );

  // --- PARTNER LAYOUT (STRUCTURED FORM DESIGN) ---
  const renderPartnerLayout = () => (
    <div className="ln-card ln-modal-content" style={{
      width: '100%', maxWidth: 560, padding: 0, borderRadius: 12,
      boxShadow: '0 12px 28px 0 rgba(0, 0, 0, 0.2), 0 2px 4px 0 rgba(0, 0, 0, 0.1)',
      overflow: 'hidden', animation: 'lnModalIn 0.2s ease-out'
    }} onClick={e => e.stopPropagation()}>

      {/* Header - Left Aligned */}
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f0f2f5', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#1e293b' }}>{editingPost ? 'Edit Post' : 'Create a Post'}</h3>
          <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)', margin: '2px 0 0' }}>Share with the community</p>
        </div>
        <button
          style={{ background: 'none', border: 'none', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>

      <div style={{ padding: '20px 24px', maxHeight: '75vh', overflowY: 'auto' }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, display: 'block', color: '#1e293b' }}>Title</label>
          <input
            type="text"
            placeholder="e.g., Company Open House 2026"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="form-input"
            style={{ width: '100%', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none' }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, display: 'block', color: '#1e293b' }}>Post Type</label>
          <select
            className="ln-filter-select"
            style={{ width: '100%', borderRadius: 10, padding: '10px 14px', fontSize: 14, height: 44, border: '1px solid rgba(0,0,0,0.1)', outline: 'none', background: '#fff' }}
            value={type}
            onChange={e => setType(e.target.value)}
          >
            {postTypes.map(pt => (
              <option key={pt.value} value={pt.value}>{pt.icon} {pt.label}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, display: 'block', color: '#1e293b' }}>Description</label>
          <textarea
            placeholder="Write your message..."
            style={{
              width: '100%', border: '1px solid rgba(0,0,0,0.1)', resize: 'none', fontSize: 14,
              minHeight: 140, padding: '12px 14px', outline: 'none', color: '#1e293b', borderRadius: 10
            }}
            value={content}
            onChange={e => setContent(e.target.value)}
            maxLength={1000}
          />
          <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'right', marginTop: 4 }}>{content.length}/1000</div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <label style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', margin: 0 }}>Set Expiry Date</label>
            <button
              type="button"
              onClick={() => setExpiryEnabled(!expiryEnabled)}
              style={{
                width: 40, height: 22, borderRadius: 11, border: 'none',
                background: expiryEnabled ? '#0a66c2' : '#cbd5e1',
                position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: '50%', background: '#fff',
                position: 'absolute', top: 2, left: expiryEnabled ? 20 : 2,
                transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }} />
            </button>
          </div>
          {expiryEnabled && (
            <input
              type="date"
              className="form-input"
              value={expiryDate}
              onChange={e => setExpiryDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              style={{ width: '100%', borderRadius: 10, padding: '10px 14px', fontSize: 14, border: '1px solid rgba(0,0,0,0.1)' }}
            />
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="ln-btn-sm ln-btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}
          >
            <Camera size={16} /> Attach Media
          </button>

          {filePreview && (
            <div style={{ position: 'relative', marginTop: 16, borderRadius: 10, overflow: 'hidden', border: '1px solid #f0f2f5' }}>
              <img src={filePreview} alt="Preview" style={{ width: '100%', display: 'block' }} />
              <button
                style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => { setSelectedFile(null); setFilePreview(null); }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {selectedFile && !filePreview && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={16} color="#65676b" />
                <span style={{ fontSize: 12, fontWeight: 500 }}>{selectedFile.name}</span>
              </div>
              <X size={14} color="#65676b" cursor="pointer" onClick={() => setSelectedFile(null)} />
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '16px 24px', borderTop: '1px solid #f0f2f5', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <button className="ln-btn ln-btn-outline" onClick={onClose} style={{ borderRadius: 8 }}>Cancel</button>
        <button
          className="ln-btn ln-btn-primary"
          onClick={handleSubmit}
          disabled={isSaving || (!content.trim() && !selectedFile)}
          style={{ borderRadius: 8, padding: '8px 24px' }}
        >
          {isSaving ? 'Publishing...' : (editingPost ? 'Save changes' : 'Publish Post')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="ln-modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }} onClick={onClose}>
      {userType === 'partner' ? renderPartnerLayout() : renderTraineeLayout()}
    </div>
  );
};

/**
 * FeedItemDetailModal: A premium modal to show the full details of a post, job, or bulletin.
 */
export const FeedItemDetailModal = ({ item, onClose, onApply, onSave, onInquire, openProfile }) => {
  const { currentUser, trainees, partners, getUserPostInteraction, getPostComments, getJobPostingComments, addPostComment, addJobPostingComment } = useApp();
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [imageOrientation, setImageOrientation] = useState('landscape'); // default

  useEffect(() => {
    const src = item?.media_url || item?.attachmentUrl;
    if (src) {
      const img = new window.Image();
      img.onload = () => {
        setImageOrientation(img.width > img.height ? 'landscape' : 'portrait');
      };
      img.src = src;
    }
  }, [item]);

  if (!item) return null;

  const isJob = item.feedType === 'job';
  const isBulletin = item.feedType === 'bulletin';
  const comments = isJob ? getJobPostingComments(item.id) : getPostComments(item.id);

  const getAuthor = () => {
    if (isBulletin) return { name: 'PSTDII Admin', photo: null };
    if (isJob) {
      const p = partners.find(p => p.id === item.partnerId);
      return { name: item.companyName, photo: p?.company_logo_url };
    }
    const author = isStudentAuthorType(item.author_type) ? trainees.find(t => t.id === item.author_id) : partners.find(p => p.id === item.author_id);
    return { name: author?.name || author?.companyName || 'Unknown User', photo: author?.photo || author?.company_logo_url };
  };

  const author = getAuthor();

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    setIsSubmittingComment(true);
    const res = isJob ? await addJobPostingComment(item.id, newComment) : await addPostComment(item.id, newComment);
    if (res.success) setNewComment('');
    else alert(res.error || 'Comment failed');
    setIsSubmittingComment(false);
  };

  return (
    <div className="ln-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div className="ln-modal-content" style={{ width: '100%', maxWidth: 960, maxHeight: '94vh', background: '#fff', borderRadius: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'lnModalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#e2e8f0', overflow: 'hidden' }}>
              {author.photo ? <img src={author.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{author.name.charAt(0)}</div>}
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 16 }}>{author.name}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{timeAgo(item.created_at || item.createdAt)}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
            <X size={20} color="#64748b" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {isBulletin && (
            <div style={{ marginBottom: 20 }}>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: BULLETIN_CONFIG[item.post_type]?.color, background: BULLETIN_CONFIG[item.post_type]?.bg, padding: '4px 10px', borderRadius: 20 }}>
                {BULLETIN_CONFIG[item.post_type]?.emoji} {BULLETIN_CONFIG[item.post_type]?.label}
              </span>
            </div>
          )}

          <h1 style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.2, color: '#0f172a', marginBottom: 16 }}>{item.title}</h1>

          <div style={{ fontSize: 16, lineHeight: 1.7, color: '#334155', whiteSpace: 'pre-wrap', marginBottom: 24 }}>
            {item.description || item.content}
          </div>

          {(item.media_url || item.attachmentUrl) && (
            <div style={{
              borderRadius: 16,
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
              marginBottom: 24,
              background: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ...(imageOrientation === 'portrait' 
                ? { width: '100%', maxWidth: 500, height: 600, margin: '0 auto 24px' } 
                : { width: '100%', height: 480 })
            }}>
              <img src={item.media_url || item.attachmentUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
            </div>
          )}

          {isJob && (
            <div style={{ background: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', marginBottom: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
                <div><div style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Location</div><div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{item.location}</div></div>
                <div><div style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Type</div><div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{item.opportunityType}</div></div>
                {item.ncLevel && <div><div style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Requirement</div><div style={{ fontWeight: 700, fontSize: 14, color: '#7c3aed' }}>{item.ncLevel}</div></div>}
                {item.salaryRange && <div><div style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Proposed Salary</div><div style={{ fontWeight: 700, fontSize: 14, color: '#16a34a' }}>{formatSalaryDisplay(item.salaryRange)}</div></div>}
              </div>
            </div>
          )}

          {/* Detailed Actions */}
          <div style={{ display: 'flex', gap: 12, borderTop: '1px solid #f1f5f9', paddingTop: 20, marginBottom: 30 }}>
            {isBulletin && BULLETIN_CONFIG[item.post_type]?.traineeLabel && (
              <button
                className="ln-btn ln-btn-primary"
                disabled={getUserPostInteraction(item.id, BULLETIN_CONFIG[item.post_type]?.type)}
                onClick={() => onApply(item, BULLETIN_CONFIG[item.post_type]?.type)}
                style={{ flex: 1, borderRadius: 12, height: 48 }}
              >
                {getUserPostInteraction(item.id, BULLETIN_CONFIG[item.post_type]?.type) ? 'Applied' : BULLETIN_CONFIG[item.post_type]?.traineeLabel}
              </button>
            )}
            {isJob && (
              <button className="ln-btn ln-btn-primary" onClick={() => onApply(item)} style={{ flex: 1, borderRadius: 12, height: 48 }}>Apply Now</button>
            )}
            <button className="ln-btn ln-btn-outline" onClick={() => onSave(item.id)} style={{ padding: '0 20px', borderRadius: 12, height: 48 }}>
              <Bookmark size={18} fill={getUserPostInteraction(item.id, 'save') ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Comments Section */}
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>Comments ({comments.length})</h3>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e2e8f0', flexShrink: 0, overflow: 'hidden' }}>
                {currentUser?.photo || currentUser?.company_logo_url ? <img src={currentUser.photo || currentUser.company_logo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{(currentUser?.name || 'U').charAt(0)}</div>}
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <textarea
                  placeholder="Share your thoughts..."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 16, padding: '12px 60px 12px 16px', fontSize: 14, minHeight: 48, outline: 'none', resize: 'none', background: '#f8fafc' }}
                />
                <button
                  disabled={!newComment.trim() || isSubmittingComment}
                  onClick={handleSendComment}
                  style={{ position: 'absolute', right: 10, top: 4, bottom: 4, background: newComment.trim() ? '#0a66c2' : 'transparent', color: newComment.trim() ? '#fff' : '#94a3b8', border: 'none', width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: newComment.trim() ? 'pointer' : 'default', transition: 'all 0.2s' }}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {comments.map(c => {
                let cAuthorName = 'Unknown User';
                let cAuthorPhoto = null;
                if (c.author_type === 'industry_partner') {
                  const p = partners.find(p => p.id === c.author_id);
                  cAuthorName = p?.companyName || 'Industry Partner';
                  cAuthorPhoto = p?.company_logo_url;
                } else {
                  const t = trainees.find(t => t.id === c.author_id);
                  cAuthorName = t?.name || 'Student';
                  cAuthorPhoto = t?.photo;
                }

                return (
                  <div key={c.id} style={{ display: 'flex', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f1f5f9', flexShrink: 0, overflow: 'hidden' }}>
                      {cAuthorPhoto ? <img src={cAuthorPhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{cAuthorName.charAt(0)}</div>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{cAuthorName}</span>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{timeAgo(c.created_at)}</span>
                      </div>
                      <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.5 }}>{c.content}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * FeedItem: Unified card for rendering posts, jobs, and bulletins
 */
export const FeedItem = ({
  item,
  isOwnPost,
  onEdit,
  onDelete,
  onInquire,
  onSave,
  onApply,
  openProfile,
  onOpenMediaModal,
  postMenuId,
  setPostMenuId,
  onComment,
  onViewDetail
}) => {
  const {
    currentUser, trainees, partners, getUserPostInteraction,
    getPostComments, getJobPostingComments, addPostComment, addJobPostingComment
  } = useApp();

  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const isJob = item.feedType === 'job';
  const comments = isJob ? getJobPostingComments(item.id) : getPostComments(item.id);
  const commentCount = comments?.length || 0;

  const handleToggleComments = () => {
    if (onComment) onComment(item);
    setShowComments(!showComments);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    setIsSubmittingComment(true);
    let res;
    if (isJob) {
      res = await addJobPostingComment(item.id, newComment);
    } else {
      res = await addPostComment(item.id, newComment);
    }
    if (res?.success) {
      setNewComment('');
    } else {
      alert(res?.error || 'Failed to post comment');
    }
    setIsSubmittingComment(false);
  };

  const renderCommentsSection = () => {
    if (!showComments) return null;
    return (
      <div className="ln-comments-section" style={{ padding: '12px 16px', borderTop: '1px solid #f3f3f3', background: '#f9fafb' }}>
        {comments.length === 0 ? (
          <p style={{ fontSize: 13, color: '#65676b', textAlign: 'center', margin: '10px 0' }}>No comments yet. Be the first to comment!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12, maxHeight: 300, overflowY: 'auto' }}>
            {comments.map(c => {
              let authorName = 'Unknown User';
              let authorPhoto = null;
              if (c.author_type === 'industry_partner') {
                const p = partners.find(p => p.id === c.author_id);
                authorName = p?.companyName || p?.profileName || 'Industry Partner';
                authorPhoto = p?.company_logo_url || p?.photo;
              } else {
                const t = trainees.find(t => t.id === c.author_id);
                authorName = t?.name || t?.profileName || 'Student';
                authorPhoto = t?.photo;
              }

              return (
                <div key={c.id} style={{ display: 'flex', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e4e6eb', flexShrink: 0, overflow: 'hidden' }}>
                    {authorPhoto ? <img src={authorPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 14, fontWeight: 600 }}>{authorName.charAt(0)}</span>}
                  </div>
                  <div style={{ background: '#fff', padding: '8px 12px', borderRadius: 12, border: '1px solid #e4e6eb', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: '#1c1e21' }}>{authorName}</span>
                      <span style={{ fontSize: 11, color: '#65676b' }}>{timeAgo(c.created_at)}</span>
                    </div>
                    <p style={{ fontSize: 13, margin: '4px 0 0', color: '#1c1e21', whiteSpace: 'pre-wrap' }}>{c.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e4e6eb', flexShrink: 0, overflow: 'hidden' }}>
            {currentUser?.photo || currentUser?.company_logo_url ? <img src={currentUser?.photo || currentUser?.company_logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 14, fontWeight: 600 }}>{(currentUser?.name || currentUser?.companyName || 'U').charAt(0)}</span>}
          </div>
          <input
            type="text"
            placeholder="Write a comment..."
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmitComment(); }}
            disabled={isSubmittingComment}
            style={{ flex: 1, padding: '8px 16px', borderRadius: 20, border: '1px solid #e4e6eb', fontSize: 13, outline: 'none' }}
          />
          <button
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || isSubmittingComment}
            style={{ background: newComment.trim() ? '#0a66c2' : '#e4e6eb', color: newComment.trim() ? '#fff' : '#a5a7ab', border: 'none', borderRadius: 20, padding: '6px 16px', fontSize: 13, fontWeight: 600, cursor: newComment.trim() ? 'pointer' : 'default', transition: 'all 0.2s' }}
          >
            {isSubmittingComment ? '...' : 'Send'}
          </button>
        </div>
      </div>
    );
  };

  // --- Shared helpers for tt-feed-card rendering ---
  const COVER_COLORS = [
    '#dcfce7', '#e0f2fe', '#ede9fe', '#fce7f3', '#fef3c7',
    '#dbeafe', '#f1f5f9', '#ecfdf5', '#fdf2f8', '#fff7ed'
  ];

  const getCoverColor = (id) => {
    const hash = String(id || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return COVER_COLORS[hash % COVER_COLORS.length];
  };

  // Determine card metadata for ALL feed types
  const getCardData = () => {
    if (item.feedType === 'bulletin') {
      const cfg = BULLETIN_CONFIG[item.post_type] || BULLETIN_CONFIG.announcement;
      const authorId = String(item.author_id || '');
      const ADMIN_ID = 'de305d54-75b4-431b-adb2-eb6b9e546014';
      let authorName = 'PSTDII Admin';
      let authorPhoto = null;
      if (item.author_type === 'industry_partner' || item.author_type === 'partner') {
        const p = partners.find(p => String(p.id) === authorId);
        authorName = p ? (p.companyName || p.profileName) : 'Industry Partner';
        authorPhoto = p?.company_logo_url || p?.photo;
      } else if (item.author_type === 'student' || item.author_type === 'trainee') {
        const t = trainees.find(t => String(t.id) === authorId);
        if (t && t.name !== 'Trainee' && t.profileName !== 'Trainee') {
          authorName = t.name || t.profileName;
          authorPhoto = t?.photo;
        }
      } else if (item.author_type !== 'admin' && authorId !== ADMIN_ID) {
        authorName = 'PSTDII Admin';
      }
      const sc = { Open: '#16a34a', Full: '#d97706', Closed: '#dc2626' };
      let targetType = 'trainee';
      if (item.author_type === 'industry_partner' || item.author_type === 'partner') {
        targetType = 'partner';
      } else if (item.author_type === 'admin' || authorId === ADMIN_ID) {
        targetType = 'admin';
      }

      return {
        coverColor: cfg.bg,
        coverImage: null,
        iconEmoji: cfg.emoji,
        iconPhoto: authorPhoto,
        title: authorName,
        subtitle: `${cfg.label} • ${item.status || 'Open'}`,
        subtitleColor: sc[item.status] || sc.Open,
        text: item.content || item.title || '',
        tags: item.slots_available ? [`${item.slots_available} Slots`] : [],
        tagExtra: cfg.emoji,
        profileTarget: { id: item.author_id, type: targetType }
      };
    }
    if (item.feedType === 'job') {
      const p = partners.find(p => String(p.id) === String(item.partnerId));
      return {
        coverColor: getCoverColor(item.id),
        coverImage: (item.attachmentUrl && isImageAttachment(item.attachmentUrl, item.attachmentType)) ? item.attachmentUrl : null,
        iconEmoji: null,
        iconPhoto: p?.company_logo_url || p?.photo,
        iconFallback: <Building2 size={20} />,
        title: item.companyName || 'Company',
        subtitle: `${item.opportunityType || 'Job'} • ${timeAgo(item.createdAt)}`,
        subtitleColor: '#475569',
        text: item.description || '',
        tags: [
          item.opportunityType,
          item.ncLevel,
          item.salaryRange ? formatSalaryDisplay(item.salaryRange) : null
        ].filter(Boolean),
        profileTarget: { id: item.partnerId, type: 'partner' }
      };
    }
    // Post
    const author = isOwnPost ? currentUser : (isStudentAuthorType(item.author_type) ? trainees.find(t => t.id === item.author_id) : partners.find(p => p.id === item.author_id));
    const authorName = author?.name || author?.profileName || author?.companyName || 'Unknown User';
    const authorPhoto = author?.photo || author?.company_logo_url;
    const allTypes = [...TRAINEE_POST_TYPES, ...PARTNER_POST_TYPES];
    const matchType = allTypes.find(t => t.value === item.post_type);
    return {
      coverColor: getCoverColor(item.id),
      coverImage: (item.media_url || item.attachmentUrl) && isImageAttachment(item.media_url || item.attachmentUrl) ? (item.media_url || item.attachmentUrl) : null,
      iconEmoji: null,
      iconPhoto: authorPhoto,
      iconFallback: authorName.charAt(0),
      title: authorName,
      subtitle: `${isStudentAuthorType(item.author_type) ? 'Trainee' : 'Partner'} • ${timeAgo(item.created_at || item.createdAt)} • ${matchType?.label || (item.post_type || 'general').replace('_', ' ')}`,
      subtitleColor: '#475569',
      text: item.content || '',
      tags: [],
      profileTarget: { id: item.author_id, type: toProfileAuthorType(item.author_type) }
    };
  };

  // Determine footer buttons for each feed type
  const getFooterButtons = () => {
    if (item.feedType === 'bulletin') {
      const cfg = BULLETIN_CONFIG[item.post_type] || BULLETIN_CONFIG.announcement;
      const alreadyInteracted = getUserPostInteraction(item.id, cfg.type);
      if (isOwnPost) {
        return [
          { label: 'Applicants', primary: true, onClick: (e) => { e.stopPropagation(); onApply?.(item, 'applicants'); } },
          { label: `Comment (${commentCount})`, onClick: (e) => { e.stopPropagation(); handleToggleComments(); } },
          { label: 'Save', onClick: (e) => { e.stopPropagation(); onSave(item.id); }, active: !!getUserPostInteraction(item.id, 'save') }
        ];
      }
      return [
        cfg.type ? {
          label: alreadyInteracted ? 'Applied' : (cfg.traineeLabel || 'Apply'),
          primary: !alreadyInteracted,
          disabled: !!alreadyInteracted || item.status === 'Closed' || item.status === 'Full',
          onClick: (e) => { e.stopPropagation(); onApply(item, cfg.type); }
        } : { label: `Comment (${commentCount})`, onClick: (e) => { e.stopPropagation(); handleToggleComments(); } },
        { label: 'Inquire', onClick: (e) => { e.stopPropagation(); onInquire(item); } },
        { label: getUserPostInteraction(item.id, 'save') ? 'Saved' : 'Save', onClick: (e) => { e.stopPropagation(); onSave(item.id); }, active: !!getUserPostInteraction(item.id, 'save') }
      ];
    }
    if (item.feedType === 'job') {
      const isSaved = Array.isArray(currentUser?.savedOpportunities) && currentUser.savedOpportunities.includes(item.id);
      if (isOwnPost) {
        return [
          { label: 'Applicants', primary: true, onClick: (e) => { e.stopPropagation(); onApply?.(item, 'applicants'); } },
          { label: `Comment (${commentCount})`, onClick: (e) => { e.stopPropagation(); handleToggleComments(); } },
          { label: 'Your Listing', disabled: true }
        ];
      }
      return [
        { label: 'Apply', primary: true, onClick: (e) => { e.stopPropagation(); onApply(item); } },
        { label: 'Contact', primary: false, onClick: (e) => { e.stopPropagation(); onInquire(item); }, border: true },
        { label: isSaved ? 'Saved' : 'Save', onClick: (e) => { e.stopPropagation(); onSave(item.id); }, active: isSaved }
      ];
    }
    // Post
    if (isOwnPost) {
      return [
        { label: `Comment (${commentCount})`, onClick: (e) => { e.stopPropagation(); handleToggleComments(); } },
        { label: 'Contact', primary: true, onClick: (e) => { e.stopPropagation(); onInquire?.(item); } },
        { label: 'Save', onClick: (e) => { e.stopPropagation(); onSave?.(item.id); } }
      ];
    }
    return [
      { label: `Comment (${commentCount})`, onClick: (e) => { e.stopPropagation(); handleToggleComments(); } },
      { label: 'Contact', primary: true, onClick: (e) => { e.stopPropagation(); onInquire?.(item); } },
      { label: getUserPostInteraction(item.id, 'save') ? 'Saved' : 'Save', onClick: (e) => { e.stopPropagation(); onSave?.(item.id); }, active: !!getUserPostInteraction(item.id, 'save') }
    ];
  };

  const card = getCardData();
  const buttons = getFooterButtons();

  return (
    <div
      className="tt-feed-card"
      style={{ cursor: 'pointer' }}
      onClick={() => onViewDetail?.(item)}
    >
      {/* Cover */}
      <div
        className="tt-feed-card-cover"
        style={card.coverImage
          ? { backgroundImage: `url(${card.coverImage})` }
          : { backgroundColor: card.coverColor }
        }
      />

      {/* Icon overlapping cover */}
      <div
        className="tt-feed-card-icon"
        onClick={(e) => { 
          e.stopPropagation(); 
          if (card.profileTarget?.type !== 'admin') {
            openProfile(card.profileTarget); 
          }
        }}
        style={{ cursor: card.profileTarget?.type === 'admin' ? 'default' : 'pointer' }}
      >
        {card.iconEmoji
          ? card.iconEmoji
          : card.iconPhoto
            ? <img src={card.iconPhoto} alt="" />
            : (card.iconFallback || <Building2 size={20} />)
        }
      </div>

      {/* Content */}
      <div className="tt-feed-card-content">
        <div className="tt-feed-card-title">{card.title}</div>
        <div className="tt-feed-card-subtitle" style={{ color: card.subtitleColor }}>{card.subtitle}</div>
        <div className="tt-feed-card-text">{card.text}</div>

        {card.tags && card.tags.length > 0 && (
          <div className="tt-feed-card-tags">
            {card.tags.map((tag, i) => (
              <span key={i} className="tt-feed-card-tag">{tag}</span>
            ))}
          </div>
        )}

        {/* Footer buttons */}
        <div className="tt-feed-card-footer">
          {buttons.map((btn, i) => (
            <button
              key={i}
              className={`tt-feed-card-btn${btn.primary ? ' tt-feed-card-btn-primary' : ''}`}
              onClick={btn.onClick}
              disabled={btn.disabled}
              style={btn.active ? { color: '#4f46e5', fontWeight: 700, borderColor: '#4f46e5' } : undefined}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Comment section (expands below the card) */}
      <div onClick={(e) => e.stopPropagation()}>
        {renderCommentsSection()}
      </div>
    </div>
  );
};
