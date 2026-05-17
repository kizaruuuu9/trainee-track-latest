import React, { useState, useRef, useEffect } from 'react';
import {
  Building2, MapPin, Clock, Briefcase, Users, CheckCircle,
  Target, ShieldCheck, Plus, X, Camera, FileText,
  MessageSquare, Bookmark, Send, Trash2, Edit, Mail, Info, ChevronRight, Eye, MoreVertical, Check,
  Download, Link
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTrainees, usePartners } from '../../hooks';
import toast from 'react-hot-toast';

/**
 * RealtimeStatus: A small badge that shows the current sync status
 */
export const RealtimeStatus = ({ isFetching }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px',
      borderRadius: 20,
      background: isFetching ? '#f0f9ff' : '#f8fafc',
      border: '1px solid',
      borderColor: isFetching ? '#bae6fd' : '#e2e8f0',
      fontSize: 11,
      fontWeight: 700,
      color: isFetching ? '#0369a1' : '#64748b',
      transition: 'all 0.3s ease'
    }}>
      <div 
        className={isFetching ? "pulse-dot" : ""}
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: isFetching ? '#0ea5e9' : '#94a3b8',
          animation: isFetching ? 'lnPulse 2s infinite' : 'none'
        }} 
      />
      {isFetching ? 'Syncing...' : 'Live'}
    </div>
  );
};

/**
 * FeedSkeleton: Loading state for the feed
 */
export const FeedSkeleton = ({ count = 3, viewMode = 'list' }) => {
  const items = Array.from({ length: count });
  
  if (viewMode === 'grid') {
    return (
      <div className="tt-feed-grid">
        {items.map((_, i) => (
          <div key={i} className="ln-card" style={{ height: 380, background: '#fff', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <div className="skeleton-shimmer" style={{ height: 160, width: '100%', background: '#f1f5f9' }} />
            <div style={{ padding: 20 }}>
              <div className="skeleton-shimmer" style={{ height: 24, width: '80%', marginBottom: 12, background: '#f1f5f9', borderRadius: 4 }} />
              <div className="skeleton-shimmer" style={{ height: 16, width: '100%', marginBottom: 8, background: '#f1f5f9', borderRadius: 4 }} />
              <div className="skeleton-shimmer" style={{ height: 16, width: '60%', marginBottom: 20, background: '#f1f5f9', borderRadius: 4 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <div className="skeleton-shimmer" style={{ height: 36, flex: 1, background: '#f1f5f9', borderRadius: 8 }} />
                <div className="skeleton-shimmer" style={{ height: 36, width: 36, background: '#f1f5f9', borderRadius: 8 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {items.map((_, i) => (
        <div key={i} className="ln-card" style={{ padding: 20, background: '#fff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div className="skeleton-shimmer" style={{ width: 48, height: 48, borderRadius: '50%', background: '#f1f5f9' }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton-shimmer" style={{ height: 16, width: '150px', marginBottom: 8, background: '#f1f5f9', borderRadius: 4 }} />
              <div className="skeleton-shimmer" style={{ height: 12, width: '80px', background: '#f1f5f9', borderRadius: 4 }} />
            </div>
          </div>
          <div className="skeleton-shimmer" style={{ height: 20, width: '90%', marginBottom: 12, background: '#f1f5f9', borderRadius: 4 }} />
          <div className="skeleton-shimmer" style={{ height: 16, width: '100%', marginBottom: 8, background: '#f1f5f9', borderRadius: 4 }} />
          <div className="skeleton-shimmer" style={{ height: 16, width: '70%', background: '#f1f5f9', borderRadius: 4 }} />
        </div>
      ))}
    </div>
  );
};

// --- FILE SIZE HELPER ---
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

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
  if (raw === 'Confidential') return 'To Be Discussed';
  const digitsOnly = raw.replace(/,/g, '');
  if (/^\d+$/.test(digitsOnly)) {
    return '₱' + Number(digitsOnly).toLocaleString('en-US');
  }
  return raw;
};

export const formatBulletinDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const ensureAbsoluteUrl = (url) => {
  if (!url) return '#';
  const trimmed = String(url).trim();
  if (!trimmed || trimmed === '#') return '#';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  return `https://${trimmed}`;
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

export const VerifiedBadge = ({ size = 14 }) => (
  <div style={{
    width: size,
    height: size,
    borderRadius: '50%',
    backgroundColor: '#0ea5e9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
  }} title="Verified Partner">
    <Check size={size * 0.7} color="white" strokeWidth={4} />
  </div>
);

// --- SHARED COMPONENTS ---

export const BULLETIN_CONFIG = {
  training: { label: 'Training Program', color: '#7c3aed', bg: '#ede9fe', emoji: '📚', traineeLabel: 'Apply', partnerLabel: 'Refer Apprentice', type: 'apply' },
  event: { label: 'Event', color: '#0ea5e9', bg: '#e0f2fe', emoji: '📅', traineeLabel: 'Register', partnerLabel: 'Register Apprentice', type: 'register' },
  workshop: { label: 'Workshop', color: '#0ea5e9', bg: '#e0f2fe', emoji: '🛠️', traineeLabel: 'Register', partnerLabel: 'Register Apprentice', type: 'register' },
  announcement: { label: 'Announcement', color: '#d97706', bg: '#fef3c7', emoji: '📢', traineeLabel: null, partnerLabel: null, type: null },
  scholarship: { label: 'Scholarship', color: '#16a34a', bg: '#dcfce7', emoji: '🎓', traineeLabel: 'Apply', partnerLabel: 'Refer Apprentice', type: 'apply' },
  ojt_opportunity: { label: 'OJT Opportunity', color: '#ef4444', bg: '#fee2e2', emoji: '💼', traineeLabel: 'Apply', partnerLabel: 'Refer Apprentice', type: 'apply' },
  training_batch: { label: 'Training Batch', color: '#7c3aed', bg: '#ede9fe', emoji: '📚', traineeLabel: 'Apply', partnerLabel: 'Refer Apprentice', type: 'apply' },
  exam_schedule: { label: 'Exam Schedule', color: '#0ea5e9', bg: '#e0f2fe', emoji: '📝', traineeLabel: 'Register', partnerLabel: 'Register Apprentice', type: 'register' },
  certification_assessment: { label: 'Certification Assessment', color: '#16a34a', bg: '#dcfce7', emoji: '🏆', traineeLabel: 'Register', partnerLabel: 'Register Apprentice', type: 'register' }
};

export const POST_THEME = {
  // Common Types
  general: { color: '#64748b', bg: '#f1f5f9', emoji: '📝' },
  achievement: { color: '#d97706', bg: '#fff7ed', emoji: '🏆' },
  certification: { color: '#16a34a', bg: '#f0fdf4', emoji: '📜' },
  project: { color: '#7c3aed', bg: '#f5f3ff', emoji: '🚀' },
  hiring_update: { color: '#0a66c2', bg: '#f0f7ff', emoji: '💼' },
  announcement: { color: '#d97706', bg: '#fef3c7', emoji: '📢' },
  
  // Special categories
  job: { color: '#0a66c2', bg: '#f0f7ff', emoji: '💼' },
  
  // Fallbacks mapped from Bulletin Config (Internal)
  training: { color: '#7c3aed', bg: '#ede9fe', emoji: '📚' },
  event: { color: '#0ea5e9', bg: '#e0f2fe', emoji: '📅' },
  scholarship: { color: '#16a34a', bg: '#dcfce7', emoji: '🎓' },
  ojt_opportunity: { color: '#ef4444', bg: '#fee2e2', emoji: '💼' },
  exam_schedule: { color: '#0ea5e9', bg: '#e0f2fe', emoji: '📝' },
  certification_assessment: { color: '#16a34a', bg: '#dcfce7', emoji: '🏆' }
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
  { value: 'general', label: 'Public', icon: '📝' }
];

export const PARTNER_POST_TYPES = [
  { value: 'announcement', label: 'Announcement', icon: '📢' },
  { value: 'hiring_update', label: 'Job Hiring', icon: '💼' },
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
            <span style={{ fontSize: 12, color: '#65676b', marginTop: 2, display: 'inline-block' }}>📝 Public Post</span>
          </div>
        </div>

        <input
          type="text"
          placeholder="Title (optional)"
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={100}
          style={{
            width: '100%', border: 'none', borderBottom: '1px solid #f0f2f5', fontSize: 16,
            fontWeight: 600, padding: '0 0 8px', outline: 'none', marginBottom: 12,
            color: '#1c1e21', background: 'transparent'
          }}
        />

        <textarea
          autoFocus
          placeholder="What's on your mind?"
          style={{
            width: '100%', border: 'none', resize: 'none', fontSize: 15,
            minHeight: filePreview ? 80 : 120, padding: 0, outline: 'none', marginBottom: 4,
            color: '#1c1e21'
          }}
          value={content}
          onChange={e => { if (e.target.value.length <= 500) setContent(e.target.value); }}
          maxLength={500}
        />
        <div style={{ fontSize: 12, color: content.length >= 450 ? '#dc2626' : '#94a3b8', textAlign: 'right', marginBottom: 16 }}>
          {content.length}/500
        </div>

        {filePreview && (
          <div style={{ position: 'relative', marginBottom: 20, borderRadius: 8, overflow: 'hidden', border: '1px solid #e4e6eb' }}>
            <img src={filePreview} alt="Preview" style={{ width: '100%', display: 'block' }} />
            <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
              {selectedFile ? formatFileSize(selectedFile.size) : 'Uploaded'}
            </div>
            <button
              style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer' }}
              onClick={() => { setSelectedFile(null); setFilePreview(null); }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div style={{
          border: '1px solid #e4e6eb', borderRadius: 8, padding: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 16
        }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Add a photo</span>
          <div style={{ display: 'flex', gap: 12, color: '#65676b' }}>
            <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
            <Camera size={22} cursor="pointer" onClick={() => fileInputRef.current.click()} />
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
              <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                {selectedFile ? formatFileSize(selectedFile.size) : 'Uploaded'}
              </div>
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
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{selectedFile.name}</div>
                  <div style={{ fontSize: 10, color: '#65676b' }}>{formatFileSize(selectedFile.size)}</div>
                </div>
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
 * FilePreviewModal: A simple modal to preview images or PDFs
 */
export const FilePreviewModal = ({ file, onClose }) => {
  if (!file) return null;
  const isImg = isImageAttachment(file.url, file.type);
  const isPdf = String(file.name || file.url).toLowerCase().endsWith('.pdf') || String(file.type).toLowerCase().includes('pdf');

  return (
    <div className="ln-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={onClose}>
      <div className="ln-modal-content" style={{ width: '95%', maxWidth: 1200, height: '90vh', background: '#fff', borderRadius: 24, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              {isPdf ? <FileText size={18} /> : <Camera size={18} />}
            </div>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {file.name || 'File Preview'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>
            <X size={20} color="#64748b" />
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'hidden', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {isImg ? (
            <div style={{ width: '100%', height: '100%', padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <img src={file.url} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }} />
            </div>
          ) : isPdf ? (
            <iframe src={`${file.url}#view=FitH`} title="PDF Preview" style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }} />
          ) : (
            <div style={{ padding: 60, textAlign: 'center', color: '#fff' }}>
              <FileText size={80} color="#94a3b8" style={{ marginBottom: 24, opacity: 0.5 }} />
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Preview not available</div>
              <div style={{ color: '#94a3b8', marginBottom: 32 }}>We can't preview this file type directly, but you can still view it in a new tab.</div>
              <a href={file.url} target="_blank" rel="noopener noreferrer" className="ln-btn ln-btn-primary" style={{ padding: '12px 32px', borderRadius: 12, fontSize: 16, fontWeight: 700 }}>Open in New Tab</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * FeedItemDetailModal: A premium modal to show the full details of a post, job, or bulletin.
 */
export const FeedItemDetailModal = ({ item, onClose, onApply, onSave, onInquire, openProfile, applied, contacted }) => {
  const { currentUser, trainees, partners, getUserPostInteraction, userRole } = useApp();
  const [imageOrientation, setImageOrientation] = useState('landscape'); // default
  const [optimisticSaved, setOptimisticSaved] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed:', err);
      // Fallback
      window.open(url, '_blank');
    }
  };

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
  const isApplied = applied || (isJob 
    ? (Array.isArray(currentUser?.appliedOpportunities) && currentUser.appliedOpportunities.includes(item.id)) 
    : !!getUserPostInteraction(item.id, 'apply'));

  const isOwnPost = item.author_id === currentUser?.id || item.partnerId === currentUser?.id;


  return (
    <div className="ln-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div className="ln-modal-content" style={{ width: '100%', maxWidth: 1100, maxHeight: '94vh', background: '#fff', borderRadius: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'lnModalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }} onClick={e => e.stopPropagation()}>

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
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          {isBulletin && (
            <div style={{ marginBottom: 20 }}>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: BULLETIN_CONFIG[item.post_type]?.color, background: BULLETIN_CONFIG[item.post_type]?.bg, padding: '4px 10px', borderRadius: 20 }}>
                {BULLETIN_CONFIG[item.post_type]?.emoji} {BULLETIN_CONFIG[item.post_type]?.label}
              </span>
            </div>
          )}

          <h1 style={{ fontSize: 32, fontWeight: 900, lineHeight: 1.2, color: '#0f172a', marginBottom: 20 }}>{item.title}</h1>

          <div style={{ fontSize: 17, lineHeight: 1.7, color: '#334155', whiteSpace: 'pre-wrap', marginBottom: 32 }}>
            {item.description || item.content}
          </div>

          {(item.media_url || item.attachmentUrl) && (
            <div style={{
              borderRadius: 20,
              overflow: 'hidden',
              border: '1px solid #000',
              marginBottom: 32,
              background: '#000', // Pitch black for cinema bars effect
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              width: '100%',
              height: imageOrientation === 'portrait' ? 700 : 540
            }}>
              <img 
                src={item.media_url || item.attachmentUrl} 
                alt="" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%', 
                  objectFit: 'contain', 
                  display: 'block' 
                }} 
              />
              {item.attachmentType && item.attachmentType.includes('(') && (
                <div style={{
                  position: 'absolute', bottom: 16, right: 16,
                  background: 'rgba(15, 23, 42, 0.7)', color: '#fff',
                  fontSize: 12, padding: '4px 12px', borderRadius: 20,
                  fontWeight: 600, backdropFilter: 'blur(4px)',
                  display: 'flex', alignItems: 'center', gap: 6,
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <ShieldCheck size={14} color="#22c55e" />
                  Optimized: {item.attachmentType.split('(').pop().replace(')', '')}
                </div>
              )}
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

              {Array.isArray(item.requiredCompetencies) && item.requiredCompetencies.length > 0 && (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>Required Competencies</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {item.requiredCompetencies.map((comp, idx) => (
                      <span key={idx} style={{ padding: '6px 14px', borderRadius: 20, background: '#fff', border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600, color: '#475569' }}>
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {isBulletin && (
            <div style={{ background: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', marginBottom: 24 }}>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
                  {item.schedule && <div><div style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Schedule</div><div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{formatBulletinDate(item.schedule)}</div></div>}
                  {item.time_range && <div><div style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Time</div><div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{item.time_range}</div></div>}
                  {item.slots && <div><div style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Available Slots</div><div style={{ fontWeight: 800, fontSize: 16, color: BULLETIN_CONFIG[item.post_type]?.color || '#7c3aed' }}>{item.slots}</div></div>}
               </div>

               {Array.isArray(item.requirements) && item.requirements.length > 0 && (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>Requirement Instructions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {item.requirements.map((req, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 8, fontSize: 14, color: '#475569', lineHeight: 1.5 }}>
                        <span style={{ color: BULLETIN_CONFIG[item.post_type]?.color || '#7c3aed', fontWeight: 900 }}>•</span>
                        {req}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments Section */}
              {item.admin_metadata?.attachments && item.admin_metadata.attachments.length > 0 && (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>Requirement Documents</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {item.admin_metadata.attachments.map((file, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, transition: 'all 0.2s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0 }}>
                            <FileText size={16} />
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', wordBreak: 'break-word', lineHeight: 1.2 }}>{file.name}</div>
                            {file.instruction && <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>Note: {file.instruction}</div>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 16 }}>
                          <button 
                            onClick={() => setPreviewFile({ ...file, url: ensureAbsoluteUrl(file.url) })}
                            className="ln-btn ln-btn-sm ln-btn-outline" 
                            style={{ height: 32, display: 'flex', alignItems: 'center', gap: 6, borderRadius: 6, padding: '0 12px', fontSize: 12, fontWeight: 600 }}
                          >
                            <Eye size={14} /> View
                          </button>
                          <button 
                            onClick={() => handleDownload(ensureAbsoluteUrl(file.url), file.name)}
                            className="ln-btn ln-btn-sm ln-btn-outline" 
                            style={{ height: 32, display: 'flex', alignItems: 'center', gap: 6, borderRadius: 6, padding: '0 12px', fontSize: 12, fontWeight: 600, background: '#f8fafc' }}
                          >
                            <Download size={14} /> Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Links Section */}
              {item.admin_metadata?.links && item.admin_metadata.links.length > 0 && (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>Requirement Links</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {item.admin_metadata.links.map((link, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0 }}>
                            <Link size={16} />
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', wordBreak: 'break-word', lineHeight: 1.2 }}>{link.label || 'Link'}</div>
                            {link.instruction && <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>Note: {link.instruction}</div>}
                          </div>
                        </div>
                        <a href={ensureAbsoluteUrl(link.url)} target="_blank" rel="noopener noreferrer" className="ln-btn ln-btn-sm ln-btn-outline" style={{ height: 32, display: 'flex', alignItems: 'center', gap: 6, borderRadius: 6, padding: '0 12px', fontSize: 12, fontWeight: 600, marginLeft: 16 }}>
                          <Eye size={14} /> Visit
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Detailed Actions */}
          {!isOwnPost && (
            <div style={{ display: 'flex', gap: 16, borderTop: '1px solid #f1f5f9', paddingTop: 24, marginBottom: 40 }}>
              {/* Contact Button */}
              <button 
                className="ln-btn ln-btn-outline" 
                onClick={() => onInquire(item)} 
                disabled={contacted}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 24px', borderRadius: 14, height: 56, fontWeight: 700, fontSize: 15, ...(contacted ? { color: '#057642', background: '#f0fdf4', border: '1px solid #bbf7d0' } : {}) }}
              >
                {contacted ? <><Check size={20} /> Contacted</> : <><Mail size={20} /> Contact</>}
              </button>
              
              {/* Save Button */}
              {(() => {
                const dbSaved = (getUserPostInteraction(item.id, 'save') || (isJob && Array.isArray(currentUser?.savedOpportunities) && currentUser.savedOpportunities.includes(item.id)));
                const isSaved = optimisticSaved !== null ? optimisticSaved : dbSaved;
                return (
                  <button 
                    className="ln-btn ln-btn-outline" 
                    onClick={() => {
                      setOptimisticSaved(!isSaved);
                      onSave(item.id);
                    }} 
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: 10, padding: '0 24px', borderRadius: 14, height: 56, fontWeight: 700, fontSize: 15,
                      ...(isSaved ? { color: '#d97706', background: '#fff7ed', border: '1px solid #fed7aa' } : {})
                    }}
                  >
                    {isSaved ? (
                      <>
                        <Bookmark size={20} fill="currentColor" /> Saved
                      </>
                    ) : (
                      <>
                        <Bookmark size={20} fill="none" /> Save
                      </>
                    )}
                  </button>
                );
              })()}

              {/* Apply Button */}
              {isBulletin && (BULLETIN_CONFIG[item.post_type]?.traineeLabel || BULLETIN_CONFIG[item.post_type]?.partnerLabel) && (
                (() => {
                  const cfg = BULLETIN_CONFIG[item.post_type] || BULLETIN_CONFIG.announcement;
                  const isPartner = userRole === 'partner' || currentUser?.user_type === 'industry_partner';
                  const label = isPartner ? (cfg.partnerLabel || 'Refer') : (cfg.traineeLabel || 'Apply');
                  const alreadyInteracted = getUserPostInteraction(item.id, cfg.type);
                  
                  return (
                    <button
                      className="ln-btn ln-btn-primary"
                      disabled={alreadyInteracted || item.status === 'Closed' || item.status === 'Full'}
                      onClick={() => onApply(item, cfg.type)}
                      style={{ flex: 1, borderRadius: 14, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 17, fontWeight: 800 }}
                    >
                      {alreadyInteracted ? <><CheckCircle size={22} /> {isPartner ? 'Submitted' : 'Applied'}</> : <>{isPartner ? <Users size={22} /> : <Send size={22} />} {label}</>}
                    </button>
                  );
                })()
              )}
              {isJob && (
                <button 
                  className="ln-btn ln-btn-primary" 
                  onClick={() => onApply(item)} 
                  disabled={isApplied || item.status !== 'Open'}
                  style={{ flex: 1, borderRadius: 14, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 17, fontWeight: 800 }}
                >
                  {isApplied ? <><CheckCircle size={22} /> Applied</> : <><Send size={22} /> Apply Now</>}
                </button>
              )}
            </div>
          )}

        </div>
      </div>
      {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
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
  onViewDetail
}) => {
  const { currentUser, getUserPostInteraction, trainees, partners, userRole } = useApp();

  const isJob = item.feedType === 'job';


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
        subtitle: `${cfg.label} | ${item.status || 'Open'}`,
        subtitleColor: sc[item.status] || sc.Open,
        text: item.content || item.title || '',
        tags: item.slots_available ? [`${item.slots_available} Slots`] : [],
        tagExtra: cfg.emoji,
        profileTarget: { id: item.author_id, type: targetType }
      };
    }
    if (item.feedType === 'job') {
      const theme = POST_THEME.job;
      const p = partners.find(p => String(p.id) === String(item.partnerId));
      return {
        coverColor: theme.bg,
        coverImage: (item.attachmentUrl && isImageAttachment(item.attachmentUrl, item.attachmentType)) ? item.attachmentUrl : null,
        iconEmoji: null,
        iconPhoto: p?.company_logo_url || p?.photo,
        iconFallback: <Building2 size={20} />,
        title: item.companyName || 'Company',
        subtitle: `${item.opportunityType || 'Job'} | ${timeAgo(item.createdAt)}`,
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
    const theme = POST_THEME[item.post_type] || POST_THEME.general;
    const author = isOwnPost ? currentUser : (isStudentAuthorType(item.author_type) ? trainees.find(t => t.id === item.author_id) : partners.find(p => p.id === item.author_id));
    const authorName = author?.name || author?.profileName || author?.companyName || 'Unknown User';
    const authorPhoto = author?.photo || author?.company_logo_url;
    const allTypes = [...TRAINEE_POST_TYPES, ...PARTNER_POST_TYPES];
    const matchType = allTypes.find(t => t.value === item.post_type);
    return {
      coverColor: theme.bg,
      coverImage: (item.media_url || item.attachmentUrl) && isImageAttachment(item.media_url || item.attachmentUrl) ? (item.media_url || item.attachmentUrl) : null,
      iconEmoji: null,
      iconPhoto: authorPhoto,
      iconFallback: authorName.charAt(0),
      title: authorName,
      subtitle: `${isStudentAuthorType(item.author_type) ? 'Trainee' : 'Partner'} | ${timeAgo(item.created_at || item.createdAt)} | ${matchType?.label || (item.post_type || 'general').replace('_', ' ')}`,
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
          { label: 'Save', onClick: (e) => { e.stopPropagation(); onSave(item.id); }, active: !!getUserPostInteraction(item.id, 'save') }
        ];
      }
      const isPartner = userRole === 'partner' || currentUser?.user_type === 'industry_partner';
      const actionLabel = isPartner ? (cfg.partnerLabel || 'Refer') : (cfg.traineeLabel || 'Apply');

      return [
        cfg.type ? {
          label: alreadyInteracted ? (isPartner ? 'Submitted' : 'Applied') : actionLabel,
          primary: !alreadyInteracted,
          disabled: !!alreadyInteracted || item.status === 'Closed' || item.status === 'Full',
          onClick: (e) => { e.stopPropagation(); onApply(item, cfg.type); }
        } : null,
        { label: contacted ? 'Contacted' : 'Inquire', onClick: (e) => { e.stopPropagation(); onInquire(item); }, disabled: contacted },
        { label: getUserPostInteraction(item.id, 'save') ? 'Saved' : 'Save', onClick: (e) => { e.stopPropagation(); onSave(item.id); }, active: !!getUserPostInteraction(item.id, 'save') }
      ].filter(Boolean);
    }
    if (item.feedType === 'job') {
      const isSaved = (Array.isArray(currentUser?.savedOpportunities) && currentUser.savedOpportunities.includes(item.id)) || !!getUserPostInteraction(item.id, 'save');
      const isApplied = Array.isArray(currentUser?.appliedOpportunities) && currentUser.appliedOpportunities.includes(item.id);
      if (isOwnPost) {
        return [
          { label: 'Applicants', primary: true, onClick: (e) => { e.stopPropagation(); onApply?.(item, 'applicants'); } },
          { label: 'Your Listing', disabled: true }
        ];
      }
      return [
        { 
            label: isApplied ? 'Applied' : 'Apply', 
            primary: !isApplied, 
            disabled: isApplied || item.status !== 'Open',
            onClick: (e) => { e.stopPropagation(); onApply(item); } 
        },
        { label: contacted ? 'Contacted' : 'Contact', primary: false, onClick: (e) => { e.stopPropagation(); onInquire(item); }, border: true, disabled: contacted },
        { label: isSaved ? 'Saved' : 'Save', onClick: (e) => { e.stopPropagation(); onSave(item.id); }, active: isSaved }
      ];
    }
    // Post
    if (isOwnPost) {
      return [];
    }
    return [
      { label: contacted ? 'Contacted' : 'Contact', primary: true, onClick: (e) => { e.stopPropagation(); onInquire?.(item); }, disabled: contacted },
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
      >
        {item.attachmentType && item.attachmentType.includes('(') && (
          <div style={{
            position: 'absolute', bottom: 8, right: 8,
            background: 'rgba(0,0,0,0.4)', color: '#fff',
            fontSize: 10, padding: '2px 6px', borderRadius: 4,
            fontWeight: 700, backdropFilter: 'blur(2px)'
          }}>
            {item.attachmentType.split('(').pop().replace(')', '')}
          </div>
        )}
      </div>

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
            ? <img loading="lazy" src={card.iconPhoto} alt="" />
            : (card.iconFallback || <Building2 size={20} />)
        }
      </div>

      {/* Content */}
      <div className="tt-feed-card-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="tt-feed-card-title">{card.title}</div>
          {isOwnPost && setPostMenuId && (
            <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPostMenuId(postMenuId === item.id ? null : item.id);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', borderRadius: '50%', color: '#65676b', display: 'flex', alignItems: 'center' }}
                title="More options"
              >
                <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 2, lineHeight: 1 }}>...</span>
              </button>
              {postMenuId === item.id && (
                <div style={{
                  position: 'absolute', right: 0, top: 24, background: '#fff',
                  borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  border: '1px solid #e4e6eb', zIndex: 10, minWidth: 150, overflow: 'hidden'
                }}>
                  <button
                    onClick={() => {
                      onEdit?.(item);
                      setPostMenuId(null);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                      padding: '10px 16px', border: 'none', background: 'none',
                      cursor: 'pointer', fontSize: 13, color: '#1c1e21', textAlign: 'left'
                    }}
                  >
                    <Edit size={14} /> Edit post
                  </button>
                  <button
                    onClick={() => {
                      onDelete?.(item.id);
                      setPostMenuId(null);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                      padding: '10px 16px', border: 'none', background: 'none',
                      cursor: 'pointer', fontSize: 13, color: '#dc3545', textAlign: 'left'
                    }}
                  >
                    <Trash2 size={14} /> Delete post
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
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
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                ...(btn.active ? { color: '#4f46e5', fontWeight: 700, borderColor: '#4f46e5' } : {})
              }}
            >
              {['Applied', 'Submitted', 'Registered'].includes(btn.label) && <CheckCircle size={14} />}
              {['Apply', 'Register'].includes(btn.label) && <Send size={14} />}
              {['Register Apprentice', 'Refer Apprentice'].includes(btn.label) && <Users size={14} />}
              {btn.label === 'Saved' && <Bookmark size={14} fill="currentColor" />}
              {btn.label === 'Save' && <Bookmark size={14} />}
              {btn.label}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};

export const CompactFeedItem = ({
  item,
  isOwnPost,
  onEdit,
  onDelete,
  onInquire,
  onSave,
  onApply,
  openProfile,
  onViewDetail,
  postMenuId,
  setPostMenuId,
  hideApply = false,
  applied = false,
  contacted = false,
  saved = false
}) => {
  const { currentUser, trainees, partners, getUserPostInteraction, userRole } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [optimisticSaved, setOptimisticSaved] = useState(null);
  const mobileMenuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  const isJob = item.feedType === 'job' || !!item.opportunityType;
  const isBulletin = item.feedType === 'bulletin';

  const dbSaved = saved || (Array.isArray(currentUser?.savedOpportunities) && currentUser.savedOpportunities.includes(item.id)) || !!getUserPostInteraction(item.id, 'save');
  const isSaved = optimisticSaved !== null ? optimisticSaved : dbSaved;

  const pastelColors = ['#bfdbfe', '#bbf7d0', '#e9d5ff', '#fed7aa', '#bae6fd', '#fbcfe8', '#fef08a'];
  const hashString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };
  const theme = isJob ? POST_THEME.job : (isBulletin ? (POST_THEME[item.post_type] || POST_THEME.announcement) : (POST_THEME[item.post_type] || POST_THEME.general));
  const borderColor = theme.color;
  const bgColor = theme.bg;

  let title = '';
  let subtitle = '';
  let moreOptionsMenu = null;
  let description = '';
  let iconContent = null;
  let buttons = [];

  if (isOwnPost && setPostMenuId) {
    moreOptionsMenu = (
      <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setPostMenuId(postMenuId === item.id ? null : item.id);
          }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%', color: '#65676b', display: 'flex', alignItems: 'center' }}
          title="More options"
        >
          <MoreVertical size={18} />
        </button>
        {postMenuId === item.id && (
          <div style={{
            position: 'absolute', right: 0, top: 24, background: '#fff',
            borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid #e4e6eb', zIndex: 10, minWidth: 150, overflow: 'hidden'
          }}>
            <button
              onClick={() => {
                onEdit?.(item);
                setPostMenuId(null);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '10px 16px', border: 'none', background: 'none',
                cursor: 'pointer', fontSize: 13, color: '#1c1e21', textAlign: 'left'
              }}
            >
              <Edit size={14} /> Edit post
            </button>
            <button
              onClick={() => {
                onDelete?.(item.id);
                setPostMenuId(null);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '10px 16px', border: 'none', background: 'none',
                cursor: 'pointer', fontSize: 13, color: '#dc3545', textAlign: 'left'
              }}
            >
              <Trash2 size={14} /> Delete post
            </button>
          </div>
        )}
      </div>
    );
  }

  if (isBulletin) {
    const cfg = BULLETIN_CONFIG[item.post_type] || BULLETIN_CONFIG.announcement;
    const alreadyInteracted = getUserPostInteraction(item.id, cfg.type);
    const authorId = String(item.author_id || '');
    const ADMIN_ID = 'de305d54-75b4-431b-adb2-eb6b9e546014';
    let authorName = 'PSTDII Admin';
    if (item.author_type === 'industry_partner' || item.author_type === 'partner') {
      const p = partners.find(p => String(p.id) === authorId);
      authorName = p ? (p.companyName || p.profileName) : 'Partner';
    } else if (item.author_type === 'student' || item.author_type === 'trainee') {
      const t = trainees.find(t => String(t.id) === authorId);
      authorName = t?.name || t?.profileName || 'Trainee';
    }
    title = item.title;
    subtitle = (
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
        <strong style={{ color: '#1e293b' }}>{authorName}</strong> | {cfg.label} | {item.status || 'Open'}
        {(item.schedule || item.time_range || item.slots) && <span style={{ color: '#94a3b8', margin: '0 4px' }}>•</span>}
        {item.schedule && <span style={{ color: '#64748b' }}>{formatBulletinDate(item.schedule)}</span>}
        {item.time_range && <><span style={{ color: '#94a3b8', margin: '0 2px' }}>•</span><span style={{ color: '#64748b' }}>{item.time_range}</span></>}
        {item.slots && <><span style={{ color: '#94a3b8', margin: '0 2px' }}>•</span><span style={{ color: BULLETIN_CONFIG[item.post_type]?.color || '#7c3aed', fontWeight: 700 }}>{item.slots} Slots</span></>}
      </span>
    );
    description = item.content || '';
    iconContent = <span style={{ fontSize: 24 }}>{cfg.emoji}</span>;

    const isPartner = userRole === 'partner' || currentUser?.user_type === 'industry_partner';
    const actionLabel = isPartner ? (cfg.partnerLabel || 'Refer') : (cfg.traineeLabel || 'Apply');

    if (isOwnPost) {
      buttons = [];
    } else {
      buttons = [
        (!hideApply && cfg.type) ? {
          label: alreadyInteracted ? (isPartner ? 'Submitted' : 'Applied') : actionLabel,
          primary: !alreadyInteracted,
          disabled: !!alreadyInteracted || item.status === 'Closed' || item.status === 'Full',
          onClick: (e) => { e.stopPropagation(); onApply?.(item, cfg.type); }
        } : null,
        { label: contacted ? 'Contacted' : 'Inquire', onClick: (e) => { e.stopPropagation(); onInquire?.(item); }, disabled: contacted },
        { 
          label: isSaved ? 'Saved' : 'Save', 
          onClick: (e) => { 
            e.stopPropagation(); 
            setOptimisticSaved(!isSaved);
            onSave?.(item.id); 
          }, 
          active: isSaved 
        }
      ].filter(Boolean);
    }
  } else if (isJob) {
    const isApplied = applied || (Array.isArray(currentUser?.appliedOpportunities) && currentUser.appliedOpportunities.includes(item.id));
    title = item.title;
    subtitle = [item.companyName, item.opportunityType, item.location].filter(Boolean).join(' | ');
    description = item.description || '';
    
    const p = partners.find(p => String(p.id) === String(item.partnerId));
    const photo = p?.company_logo_url || p?.photo;
    if (photo) {
      iconContent = <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />;
    } else {
      iconContent = <Building2 size={24} color="#0a66c2" />;
    }

    if (isOwnPost) {
      buttons = [];
    } else {
      buttons = [
        { 
          label: contacted ? 'Contacted' : 'Contact', 
          primary: false, 
          disabled: contacted,
          onClick: (e) => { e.stopPropagation(); onInquire?.(item); },
          icon: contacted ? <Check size={14} /> : <Mail size={14} />
        },
        { 
          label: isSaved ? 'Saved' : 'Save', 
          primary: false, 
          onClick: (e) => { 
            e.stopPropagation(); 
            setOptimisticSaved(!isSaved);
            onSave?.(item.id); 
          }, 
          active: isSaved 
        },
        !hideApply ? { 
            label: isApplied ? 'Applied' : 'Apply', 
            primary: !isApplied, 
            disabled: isApplied || item.status !== 'Open',
            onClick: (e) => { e.stopPropagation(); onApply?.(item); } 
        } : null
      ].filter(Boolean);
    }
  } else {
    const author = isOwnPost ? currentUser : (isStudentAuthorType(item.author_type) ? trainees.find(t => t.id === item.author_id) : partners.find(p => p.id === item.author_id));
    const authorName = author?.name || author?.profileName || author?.companyName || 'Unknown User';
    const authorPhoto = author?.photo || author?.company_logo_url;
    
    title = authorName;
    const allTypes = [...TRAINEE_POST_TYPES, ...PARTNER_POST_TYPES];
    const matchType = allTypes.find(t => t.value === item.post_type);
    const typeLabel = matchType?.label || (item.post_type || 'general').replace('_', ' ');
    subtitle = (
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        Public | {item.title || typeLabel}
      </span>
    );
    description = item.content || '';

    if (authorPhoto) {
      iconContent = <img src={authorPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />;
    } else {
      iconContent = <span style={{ fontSize: 20, fontWeight: 700, color: 'rgba(0,0,0,0.5)' }}>{authorName.charAt(0)}</span>;
    }

    if (isOwnPost) {
      buttons = [];
    } else {
      buttons = [
        { label: contacted ? 'Contacted' : 'Contact', primary: true, onClick: (e) => { e.stopPropagation(); onInquire?.(item); }, disabled: contacted },
        { 
          label: isSaved ? 'Saved' : 'Save', 
          onClick: (e) => { 
            e.stopPropagation(); 
            setOptimisticSaved(!isSaved);
            onSave?.(item.id); 
          }, 
          active: isSaved 
        }
      ];
    }
  }

  return (
    <div 
      className="compact-feed-item"
      onClick={() => {
         onViewDetail?.(item);
      }}
      style={{
        display: 'flex',
        padding: '16px',
        border: '1px solid #e2e8f0',
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: '12px',
        backgroundColor: '#ffffff',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        gap: '16px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
    >
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: isJob ? '#f0f7ff' : bgColor,
        color: isJob ? '#0a66c2' : 'inherit',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {iconContent}
      </div>

      {isJob ? (
        /* 3-Zone Grid Layout for Jobs — fills the width evenly */
        <div style={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: '1.2fr 1fr auto', alignItems: 'center', gap: '16px' }}>
          {/* Zone 1: Title, Company, Location */}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 20, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
            <div style={{ color: '#334155', fontSize: 14, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              {item.companyName}
              {partners.find(p => String(p.id) === String(item.partnerId))?.verificationStatus === 'Verified' && (
                <VerifiedBadge size={14} />
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#64748b', marginTop: 4, flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }} title={item.detailed_address || item.location}>
                <MapPin size={13} /> {item.location || 'Remote'}
                {item.detailed_address && (
                  <span style={{ opacity: 0.8, fontSize: 11, fontWeight: 400 }}>• {item.detailed_address}</span>
                )}
              </span>
              {item.employmentType && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={13} /> {item.employmentType}</span>}
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={13} /> {timeAgo(item.createdAt || item.created_at)}</span>
            </div>
          </div>

          {/* Zone 2: Tags & Salary */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {item.ncLevel && (
                <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, background: '#f3e8ff', color: '#9333ea' }}>
                  {item.ncLevel}{item.ncLevelRaw ? ` ${item.ncLevelRaw}` : ''}
                </span>
              )}
            </div>
            {item.salaryRange && (
              <span style={{ fontWeight: 700, fontSize: 14, color: '#16a34a' }}>{formatSalaryDisplay(item.salaryRange)}</span>
            )}
          </div>

          {/* Zone 3: Status + Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span className="tt-hide-mobile" style={{ padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: item.status === 'Open' ? '#dcfce7' : '#f1f5f9', color: item.status === 'Open' ? '#16a34a' : '#64748b' }}>{item.status}</span>
              <span className="tt-hide-mobile" style={{ padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: '#eff6ff', color: '#2563eb' }}>{item.opportunityType}</span>
              
              {/* Mobile Actions Kebab */}
              <div className="tt-show-mobile" style={{ position: 'relative' }} ref={mobileMenuRef} onClick={e => e.stopPropagation()}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMobileMenuOpen(!mobileMenuOpen);
                  }}
                  style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', color: '#475569', display: 'flex', alignItems: 'center' }}
                >
                  <MoreVertical size={20} />
                </button>
                {mobileMenuOpen && (
                  <div style={{
                    position: 'absolute', right: 0, top: 40, background: '#fff',
                    borderRadius: 12, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                    border: '1px solid #e2e8f0', zIndex: 100, minWidth: 180, overflow: 'hidden',
                    animation: 'ttFadeSlide 0.2s ease'
                  }}>
                    {buttons.map((btn, i) => (
                      <button
                        key={i}
                        onClick={(e) => { btn.onClick(e); setMobileMenuOpen(false); }}
                        disabled={btn.disabled}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                          padding: '12px 16px', border: 'none', background: 'none',
                          cursor: btn.disabled ? 'default' : 'pointer', fontSize: 14, 
                          color: btn.primary ? '#4f46e5' : (btn.active ? '#d97706' : '#475569'), textAlign: 'left',
                          fontWeight: (btn.primary || btn.active) ? 700 : 500, borderBottom: i < buttons.length - 1 ? '1px solid #f1f5f9' : 'none',
                          opacity: btn.disabled ? 0.5 : 1
                        }}
                      >
                        {['Applied', 'Submitted', 'Registered'].includes(btn.label) && <CheckCircle size={16} />}
                        {['Apply', 'Register'].includes(btn.label) && <Send size={16} />}
                        {['Register Apprentice', 'Refer Apprentice'].includes(btn.label) && <Users size={16} />}
                        {btn.label === 'Details' && <Eye size={16} />}
                        {btn.label === 'Saved' && <Bookmark size={16} fill="currentColor" />}
                        {btn.label === 'Save' && <Bookmark size={16} />}
                        {btn.label}
                      </button>
                    ))}
                    {isOwnPost && (
                      <>
                        <div style={{ height: 1, background: '#f1f5f9' }} />
                        <button
                          onClick={() => { onEdit?.(item); setMobileMenuOpen(false); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#475569', textAlign: 'left' }}
                        >
                          <Edit size={16} /> Edit
                        </button>
                        <button
                          onClick={() => { onDelete?.(item.id); setMobileMenuOpen(false); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#dc2626', textAlign: 'left' }}
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Desktop Kebab (if owner) */}
              <div className="tt-hide-mobile">
                {moreOptionsMenu}
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="tt-hide-mobile" style={{ display: 'flex', gap: '8px' }}>
              {buttons.map((btn, i) => (
                <button
                  key={i}
                  onClick={btn.onClick}
                  disabled={btn.disabled}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 600,
                    border: btn.primary ? 'none' : '1px solid #cbd5e1',
                    backgroundColor: btn.primary ? (btn.disabled && btn.label === 'Applied' ? '#818cf8' : '#4f46e5') : (btn.active ? '#fff7ed' : 'transparent'),
                    color: btn.primary ? '#fff' : (btn.active ? '#d97706' : '#475569'),
                    borderColor: btn.primary ? 'transparent' : (btn.active ? '#fed7aa' : '#cbd5e1'),
                    cursor: btn.disabled ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    opacity: btn.disabled && btn.label !== 'Applied' ? 0.5 : 1
                  }}
                >
                  {['Applied', 'Submitted', 'Registered'].includes(btn.label) && <CheckCircle size={14} />}
                  {['Apply', 'Register'].includes(btn.label) && <Send size={14} />}
                  {['Register Apprentice', 'Refer Apprentice'].includes(btn.label) && <Users size={14} />}
                  {btn.label === 'Details' && <Eye size={14} />}
                  {btn.label === 'Saved' && <Bookmark size={14} fill="currentColor" />}
                  {btn.label === 'Save' && <Bookmark size={14} />}
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Original Column Layout for non-jobs (posts, bulletins) */
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 20, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                {title}
                {!isJob && !isBulletin && (
                  (item.author_id === currentUser?.id ? currentUser?.verificationStatus === 'Verified' : partners.find(p => String(p.id) === String(item.author_id))?.verificationStatus === 'Verified') && (
                    <VerifiedBadge size={16} />
                  )
                )}
              </div>
              <div style={{ fontSize: 14, color: '#475569', marginTop: 2 }}>{subtitle}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              {moreOptionsMenu}
            </div>
          </div>
          <div style={{ 
            fontSize: 15.5, 
            color: '#475569', 
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            width: '100%',
            lineHeight: 1.6,
            marginTop: 6
          }}>
            {description}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            {/* Mobile Actions Kebab */}
            <div className="tt-show-mobile" style={{ position: 'relative' }} ref={mobileMenuRef} onClick={e => e.stopPropagation()}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMobileMenuOpen(!mobileMenuOpen);
                  }}
                  style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', color: '#475569', display: 'flex', alignItems: 'center' }}
                >
                  <MoreVertical size={20} />
                </button>
                {mobileMenuOpen && (
                  <div style={{
                    position: 'absolute', right: 0, top: 40, background: '#fff',
                    borderRadius: 12, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                    border: '1px solid #e2e8f0', zIndex: 100, minWidth: 180, overflow: 'hidden',
                    animation: 'ttFadeSlide 0.2s ease'
                  }}>
                    {buttons.map((btn, i) => (
                      <button
                        key={i}
                        onClick={(e) => { btn.onClick(e); setMobileMenuOpen(false); }}
                        disabled={btn.disabled}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                          padding: '12px 16px', border: 'none', background: 'none',
                          cursor: btn.disabled ? 'default' : 'pointer', fontSize: 14, 
                          color: btn.primary ? '#4f46e5' : '#475569', textAlign: 'left',
                          fontWeight: btn.primary ? 700 : 500, borderBottom: i < buttons.length - 1 ? '1px solid #f1f5f9' : 'none',
                          opacity: btn.disabled ? 0.5 : 1
                        }}
                      >
                        {btn.label === 'Applied' && <CheckCircle size={16} />}
                        {btn.label === 'Apply' && <Send size={16} />}
                        {btn.label === 'Details' && <Eye size={16} />}
                        {btn.label === 'Saved' && <Bookmark size={16} fill="currentColor" />}
                        {btn.label === 'Save' && <Bookmark size={16} />}
                        {btn.label}
                      </button>
                    ))}
                    {isOwnPost && (
                      <>
                        <div style={{ height: 1, background: '#f1f5f9' }} />
                        <button
                          onClick={() => { onEdit?.(item); setMobileMenuOpen(false); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#475569', textAlign: 'left' }}
                        >
                          <Edit size={16} /> Edit
                        </button>
                        <button
                          onClick={() => { onDelete?.(item.id); setMobileMenuOpen(false); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#dc2626', textAlign: 'left' }}
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

            <div className="tt-hide-mobile" style={{ display: 'flex', gap: '8px' }}>
              {buttons.map((btn, i) => (
                <button
                  key={i}
                  onClick={btn.onClick}
                  disabled={btn.disabled}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 600,
                    border: btn.primary ? 'none' : '1px solid #cbd5e1',
                    backgroundColor: btn.primary ? (btn.disabled && btn.label === 'Applied' ? '#818cf8' : '#4f46e5') : 'transparent',
                    color: btn.primary ? '#fff' : '#475569',
                    cursor: btn.disabled ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    opacity: btn.disabled && btn.label !== 'Applied' ? 0.5 : 1
                  }}
                >
                  {btn.label === 'Applied' && <CheckCircle size={14} />}
                  {btn.label === 'Apply' && <Send size={14} />}
                  {btn.label === 'Details' && <Eye size={14} />}
                  {btn.label === 'Saved' && <Bookmark size={14} fill="currentColor" />}
                  {btn.label === 'Save' && <Bookmark size={14} />}
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
