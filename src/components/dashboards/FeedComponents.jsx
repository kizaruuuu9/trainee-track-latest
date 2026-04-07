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

// --- SHARED COMPONENTS ---

export const BULLETIN_CONFIG = {
  training: { label: 'Training Program', color: '#7c3aed', bg: '#ede9fe', emoji: '📚', traineeLabel: 'Apply Now', type: 'apply' },
  event: { label: 'Event', color: '#0ea5e9', bg: '#e0f2fe', emoji: '📅', traineeLabel: 'Register', type: 'register' },
  workshop: { label: 'Workshop', color: '#0ea5e9', bg: '#e0f2fe', emoji: '🛠️', traineeLabel: 'Register', type: 'register' },
  announcement: { label: 'Announcement', color: '#d97706', bg: '#fef3c7', emoji: '📢', traineeLabel: null, type: null },
  scholarship: { label: 'Scholarship', color: '#16a34a', bg: '#dcfce7', emoji: '🎓', traineeLabel: 'Apply Now', type: 'apply' },
  ojt_opportunity: { label: 'OJT Opportunity', color: '#ef4444', bg: '#fee2e2', emoji: '💼', traineeLabel: 'Apply Now', type: 'apply' },
  training_batch: { label: 'Training Batch', color: '#7c3aed', bg: '#ede9fe', emoji: '📚', traineeLabel: 'Apply Now', type: 'apply' },
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
  onComment
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

  // Render Bulletin
  if (item.feedType === 'bulletin') {
    const cfg = BULLETIN_CONFIG[item.post_type] || BULLETIN_CONFIG.announcement;
    const alreadyInteracted = getUserPostInteraction(item.id, cfg.type);
    const statusColors = {
      Open: { bg: '#dcfce7', color: '#16a34a' },
      Full: { bg: '#fef3c7', color: '#d97706' },
      Closed: { bg: '#fee2e2', color: '#dc2626' }
    };
    const sc = statusColors[item.status] || statusColors.Open;
    const reqs = Array.isArray(item.requirements) ? item.requirements : [];

    const getAuthorName = () => {
      const authorId = String(item.author_id || '');
      const ADMIN_ID = 'de305d54-75b4-431b-adb2-eb6b9e546014';
      if (item.author_type === 'admin' || authorId === ADMIN_ID) return 'PSTDII Admin';
      if (item.author_type === 'industry_partner' || item.author_type === 'partner') {
        const p = partners.find(p => String(p.id) === authorId);
        return p ? (p.companyName || p.profileName) : 'Industry Partner';
      }
      if (item.author_type === 'student' || item.author_type === 'trainee') {
        const t = trainees.find(t => String(t.id) === authorId);
        if (!t || t.name === 'Trainee' || t.profileName === 'Trainee') return 'PSTDII Admin';
        return t.name || t.profileName;
      }
      return 'PSTDII Admin';
    };

    return (
      <div className="ln-card ln-feed-card" style={{ marginBottom: 0, borderLeft: `4px solid ${cfg.color}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px 10px' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{cfg.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: cfg.color }}>{cfg.label}</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.color }}>{item.status || 'Open'}</span>
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
              {getAuthorName()} • {timeAgo(item.created_at)}
            </div>
          </div>
          {isOwnPost && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPostMenuId(postMenuId === item.id ? null : item.id);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: '50%', color: '#65676b' }}
              >
                <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2, lineHeight: 1 }}>···</span>
              </button>
              {postMenuId === item.id && (
                <div style={{ position: 'absolute', right: 0, top: 32, background: '#fff', borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.15)', border: '1px solid #e4e6eb', zIndex: 10, minWidth: 170, overflow: 'hidden' }}>
                  <button onClick={() => { onEdit(item); setPostMenuId?.(null); }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#1c1e21', textAlign: 'left' }}>
                    <Edit size={16} /> Edit post
                  </button>
                  <button onClick={() => { if (window.confirm('Delete this post?')) onDelete(item.id); setPostMenuId?.(null); }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#dc3545', textAlign: 'left' }}>
                    <Trash2 size={16} /> Delete post
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <div style={{ padding: '0 16px 12px' }}>
          <h4 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>{item.title}</h4>
          <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6 }}>{item.content}</p>
        </div>
        <div className="ln-feed-actions" style={{ borderTop: '1px solid #f3f3f3', padding: '8px 12px', display: 'flex', gap: 8 }}>
          {isOwnPost ? (
            <>
              <button className="ln-feed-action-btn" onClick={() => onApply?.(item, 'applicants')}>
                <Users size={14} /> View Applicants
              </button>
              <button className="ln-feed-action-btn" onClick={handleToggleComments}>
                <MessageSquare size={14} /> Comment ({commentCount})
              </button>
            </>
          ) : (
            <>
              {cfg.type && (
                <button className="ln-feed-action-btn" disabled={!!alreadyInteracted || item.status === 'Closed' || item.status === 'Full'} onClick={() => onApply(item, cfg.type)}>
                  {alreadyInteracted ? <><CheckCircle size={14} /> Applied</> : <><Send size={14} /> {cfg.traineeLabel}</>}
                </button>
              )}
              <button className="ln-feed-action-btn" onClick={() => onInquire(item)}>
                <MessageSquare size={14} /> Inquire
              </button>
              <button className="ln-feed-action-btn" onClick={() => onSave(item.id)} style={getUserPostInteraction(item.id, 'save') ? { color: '#d97706', fontWeight: 700 } : {}}>
                <Bookmark size={14} fill={getUserPostInteraction(item.id, 'save') ? "currentColor" : "none"} /> {getUserPostInteraction(item.id, 'save') ? 'Saved' : 'Save'}
              </button>
              <button className="ln-feed-action-btn" onClick={handleToggleComments}>
                <MessageSquare size={14} /> Comment ({commentCount})
              </button>
            </>
          )}
        </div>
        {renderCommentsSection()}
      </div>
    );
  }

  // Render Job
  if (item.feedType === 'job') {
    const isSaved = Array.isArray(currentUser?.savedOpportunities) && currentUser.savedOpportunities.includes(item.id);
    return (
      <div className="ln-card ln-feed-card" style={{ marginBottom: 0 }}>
        <div className="ln-feed-card-header">
          <button type="button" className="ln-feed-avatar" onClick={() => openProfile({ id: item.partnerId, type: 'partner' })} style={{ background: '#f0f7ff', color: '#0a66c2', border: 'none' }}>
            <Building2 size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <div className="ln-feed-author">
              <button type="button" onClick={() => openProfile({ id: item.partnerId, type: 'partner' })} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontWeight: 700, color: 'inherit', fontSize: 'inherit' }}>
                {item.companyName}
              </button>
              <span style={{ fontWeight: 400, color: 'rgba(0,0,0,0.45)', marginLeft: 4 }}>posted a new {item.opportunityType}</span>
            </div>
            <div className="ln-feed-meta">
              {[item.location, timeAgo(item.createdAt)].filter(Boolean).join(' • ')}
            </div>
          </div>
          {isOwnPost && (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setPostMenuId?.(postMenuId === item.id ? null : item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: '50%', color: '#65676b' }}>
                <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2, lineHeight: 1 }}>···</span>
              </button>
              {postMenuId === item.id && (
                <div style={{ position: 'absolute', right: 0, top: 32, background: '#fff', borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.15)', border: '1px solid #e4e6eb', zIndex: 10, minWidth: 170, overflow: 'hidden' }}>
                  <button onClick={() => { onEdit(item); setPostMenuId?.(null); }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#1c1e21', textAlign: 'left' }}>
                    <Edit size={16} /> Edit listing
                  </button>
                  <button onClick={() => { if (window.confirm('Delete this listing?')) onDelete(item.id); setPostMenuId?.(null); }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#dc3545', textAlign: 'left' }}>
                    <Trash2 size={16} /> Delete listing
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="ln-feed-content">
          <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{item.title}</h4>
          <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.6)', marginBottom: 8 }}>{item.description?.substring(0, 150)}...</p>
          {item.attachmentUrl && isImageAttachment(item.attachmentUrl, item.attachmentType) && (
            <div className="ln-media-frame" style={{ marginBottom: 10 }}>
              <img src={item.attachmentUrl} alt="" className="ln-media-image" />
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <span className="ln-opp-type-badge">{item.opportunityType}</span>
            {item.ncLevel && <span className="ln-opp-type-badge" style={{ background: '#ede9fe', color: '#6d28d9' }}>{item.ncLevel}</span>}
            {item.salaryRange && <span style={{ fontSize: 15, color: '#057642', fontWeight: 700 }}>{formatSalaryDisplay(item.salaryRange)}</span>}
          </div>
        </div>
        <div className="ln-feed-actions" style={{ borderTop: '1px solid #f3f3f3', padding: '4px 12px', display: 'flex', gap: 4 }}>
          {isOwnPost ? (
            <>
              <button className="ln-feed-action-btn" onClick={() => onApply?.(item, 'applicants')}>
                <Users size={14} /> View Applicants
              </button>
              <button className="ln-feed-action-btn" onClick={handleToggleComments}>
                <MessageSquare size={14} /> Comment ({commentCount})
              </button>
              <button className="ln-feed-action-btn" disabled style={{ opacity: 0.6, cursor: 'default' }}>
                <MessageSquare size={14} /> Your Listing
              </button>
            </>
          ) : (
            <>
              <button className="ln-feed-action-btn" onClick={() => onApply(item)}>
                <Send size={14} /> Apply
              </button>
              <button className="ln-feed-action-btn" onClick={() => onSave(item.id)} style={isSaved ? { color: '#0a66c2', fontWeight: 600 } : {}}>
                <Bookmark size={14} fill={isSaved ? '#0a66c2' : 'none'} /> {isSaved ? 'Saved' : 'Save'}
              </button>
              <button className="ln-feed-action-btn" onClick={() => onInquire(item)}>
                <Mail size={14} /> Inquire
              </button>
              <button className="ln-feed-action-btn" onClick={handleToggleComments}>
                <MessageSquare size={14} /> Comment ({commentCount})
              </button>
            </>
          )}
        </div>
        {renderCommentsSection()}
      </div>
    );
  }

  // Render Post
  const author = isOwnPost ? currentUser : (isStudentAuthorType(item.author_type) ? trainees.find(t => t.id === item.author_id) : partners.find(p => p.id === item.author_id));
  const authorName = author?.name || author?.profileName || author?.companyName || 'Unknown User';
  const authorPhoto = author?.photo || author?.company_logo_url;

  return (
    <div className="ln-card ln-feed-card" style={{ marginBottom: 0 }}>
      <div className="ln-feed-card-header">
        <button type="button" className="ln-feed-avatar" onClick={() => openProfile({ id: item.author_id, type: toProfileAuthorType(item.author_type) })} style={{ border: 'none', background: '#e4e6eb', overflow: 'hidden', cursor: 'pointer' }}>
          {authorPhoto ? <img src={authorPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : authorName.charAt(0)}
        </button>
        <div style={{ flex: 1 }}>
          <div className="ln-feed-author">
            <button type="button" onClick={() => openProfile({ id: item.author_id, type: toProfileAuthorType(item.author_type) })} style={{ background: 'none', border: 'none', padding: 0, fontWeight: 700, color: 'inherit', cursor: 'pointer' }}>
              {authorName}
            </button>
          </div>
          <div className="ln-feed-meta">
            {item.post_type && (
              <span className="ln-post-type-badge" style={{
                background: '#f1f5f9',
                color: '#475569',
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                marginRight: 6,
                textTransform: 'capitalize'
              }}>
                {(() => {
                  const allTypes = [...TRAINEE_POST_TYPES, ...PARTNER_POST_TYPES];
                  const match = allTypes.find(t => t.value === item.post_type);
                  return (
                    <>
                      {match?.icon || '📝'} {match?.label || item.post_type.replace('_', ' ')}
                    </>
                  );
                })()}
              </span>
            )}
            • {timeAgo(item.created_at || item.createdAt)}
          </div>
        </div>
        {isOwnPost && (
          <div style={{ position: 'relative' }}>
            <button onClick={() => setPostMenuId?.(postMenuId === item.id ? null : item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: '50%', color: '#65676b' }}>
              <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2, lineHeight: 1 }}>···</span>
            </button>
            {postMenuId === item.id && (
              <div style={{ position: 'absolute', right: 0, top: 32, background: '#fff', borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.15)', border: '1px solid #e4e6eb', zIndex: 10, minWidth: 170, overflow: 'hidden' }}>
                <button onClick={() => { onEdit(item); setPostMenuId?.(null); }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#1c1e21', textAlign: 'left' }}>
                  <Edit size={16} /> Edit post
                </button>
                <button onClick={() => { if (window.confirm('Delete this post?')) onDelete(item.id); setPostMenuId?.(null); }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#dc3545', textAlign: 'left' }}>
                  <Trash2 size={16} /> Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="ln-feed-content">
        {item.title && <h4 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>{item.title}</h4>}
        <p style={{ whiteSpace: 'pre-wrap', fontSize: 14, color: '#1c1e21', lineHeight: '1.4' }}>{item.content}</p>
        {(item.media_url || item.attachmentUrl) && isImageAttachment(item.media_url || item.attachmentUrl) && (
          <div className="ln-media-frame" style={{ marginTop: 12 }}>
            <img src={item.media_url || item.attachmentUrl} alt="" className="ln-media-image" />
          </div>
        )}
      </div>
      <div className="ln-feed-actions" style={{ borderTop: '1px solid #f3f3f3', padding: '4px 12px', display: 'flex', gap: 4 }}>
        {isOwnPost ? (
          <>
            <button className="ln-feed-action-btn" disabled style={{ opacity: 0.6, cursor: 'default' }}>
              <MessageSquare size={14} /> Your Post
            </button>
            <button className="ln-feed-action-btn" onClick={handleToggleComments}>
              <MessageSquare size={14} /> Comment ({commentCount})
            </button>
          </>
        ) : (
          <>
            <button className="ln-feed-action-btn" onClick={handleToggleComments}>
              <MessageSquare size={14} /> Comment ({commentCount})
            </button>
            <button className="ln-feed-action-btn">
              <Send size={14} /> Share
            </button>
          </>
        )}
      </div>
      {renderCommentsSection()}
    </div>
  );
};