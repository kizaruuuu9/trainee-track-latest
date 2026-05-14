import React from 'react';
import { Bookmark, Building2, MapPin, Trash2, Eye, CheckCircle, FileText, Megaphone, Users, Star } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePosts, useJobPostings, useApplications, usePostInteractions } from '../../hooks';
import { BULLETIN_CONFIG } from './FeedComponents';

// Post types that are admin-issued bulletins
const BULLETIN_TYPES = new Set(Object.keys(BULLETIN_CONFIG));

// Community post types (partner/trainee authored)
const COMMUNITY_POST_TYPES = new Set([
    'general', 'achievement', 'certification', 'project',
    'hiring_update', 'announcement', 'post', ''
]);

// Derive what kind of saved post it is
const classifyPost = (item) => {
    const postType = item.post_type || '';
    const authorType = item.author_type || '';

    // Admin-issued bulletins
    if (authorType === 'admin' && BULLETIN_TYPES.has(postType)) {
        return 'bulletin';
    }
    // All other posts are community posts
    return 'community';
};

// Human-readable label for a post type
const getPostTypeLabel = (postType) => {
    const cfg = BULLETIN_CONFIG[postType];
    if (cfg) return cfg.label;
    const MAP = {
        general: 'General Post',
        achievement: 'Achievement',
        certification: 'Certification',
        project: 'Project',
        hiring_update: 'Hiring Update',
        announcement: 'Announcement',
        post: 'Post',
    };
    return MAP[postType] || (postType ? postType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Post');
};

// Author display name resolver
const resolveAuthorName = (item, partners = [], trainees = []) => {
    const authorType = item.author_type || '';
    const authorId = item.author_id;

    if (authorType === 'admin') return 'PSTDII Admin';
    if (authorType === 'industry_partner' || authorType === 'partner') {
        const p = partners.find(p => String(p.id) === String(authorId));
        return p?.companyName || p?.company_name || 'Industry Partner';
    }
    if (authorType === 'trainee' || authorType === 'student') {
        const t = trainees.find(t => String(t.id) === String(authorId));
        return t?.name || t?.full_name || 'Trainee';
    }
    return 'Unknown';
};

// Author photo resolver
const resolveAuthorPhoto = (item, partners = [], trainees = []) => {
    const authorType = item.author_type || '';
    const authorId = item.author_id;
    const partnerId = item.partnerId; // For job postings

    if (item._savedKind === 'job') {
        const p = partners.find(p => String(p.id) === String(partnerId));
        return p?.company_logo_url || p?.photo || null;
    }

    if (authorType === 'industry_partner' || authorType === 'partner') {
        const p = partners.find(p => String(p.id) === String(authorId));
        return p?.company_logo_url || p?.photo || null;
    }
    if (authorType === 'trainee' || authorType === 'student') {
        const t = trainees.find(t => String(t.id) === String(authorId));
        return t?.photo || null;
    }
    return null;
};

// Badge config by classification
const BADGE_STYLES = {
    job: { bg: '#dbeafe', color: '#1e40af', icon: Building2, label: 'Job Posting' },
    bulletin: { bg: '#ede9fe', color: '#5b21b6', icon: Megaphone, label: 'Bulletin Post' },
    community: { bg: '#f0fdf4', color: '#166534', icon: Users, label: 'Community Post' },
};

const SavedItemsView = ({ userId, userType, onApply, onOpenBulletin, onViewDetail }) => {
    const {
        toggleBookmark, currentUser,
        partners, trainees
    } = useApp();

    const { data: postInteractions = [] } = usePostInteractions({ userId });
    const { data: applications = [] } = useApplications(userId, userType);

    // 1. Get saved IDs from both profile and interactions
    const trainee = userType === 'trainee' ? (currentUser || (trainees || []).find(t => t.id === userId)) : null;
    const profileSavedJobIds = trainee?.savedOpportunities || [];
    const interactionSavedIds = postInteractions
        .filter(i => i.interaction_type === 'save')
        .map(i => i.post_id);

    const allSavedIds = [...new Set([...profileSavedJobIds, ...interactionSavedIds])].filter(Boolean);

    // 2. Fetch specific items by ID
    const { data: jobPostings = [] } = useJobPostings({ ids: allSavedIds });
    const { data: posts = [] } = usePosts({ ids: allSavedIds });

    // 3. Resolve and classify
    const savedJobs = jobPostings
        .filter(j => j.hasValidPartner !== false)
        .map(j => ({ ...j, _savedKind: 'job' }));

    const savedPosts = posts.map(p => ({
        ...p,
        _savedKind: classifyPost(p),
    }));

    // 4. Combine and deduplicate
    const combined = [...savedJobs, ...savedPosts];
    const seenIds = new Set();
    const allSavedItems = combined.filter(item => {
        if (seenIds.has(item.id)) return false;
        seenIds.add(item.id);
        return true;
    }).sort((a, b) => {
        const dateA = new Date(a.created_at || a.createdAt || 0);
        const dateB = new Date(b.created_at || b.createdAt || 0);
        return dateB - dateA;
    });

    const timeAgo = (dateStr) => {
        if (!dateStr) return 'Recently';
        try {
            const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
            if (diff < 60) return 'Just now';
            if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
            if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
            return `${Math.floor(diff / 86400)}d ago`;
        } catch { return 'Recently'; }
    };

    if (allSavedItems.length === 0) {
        return (
            <div style={{
                padding: '60px 0',
                textAlign: 'center',
                background: '#f8fafc',
                borderRadius: 20,
                border: '2px dashed #e2e8f0',
                margin: '20px 0'
            }}>
                <Bookmark size={48} style={{ opacity: 0.1, marginBottom: 16 }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>No saved items</h3>
                <p style={{ color: '#64748b', fontSize: 14, maxWidth: 300, margin: '8px auto 0' }}>
                    Items you bookmark will appear here for quick access later.
                </p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
            {allSavedItems.map(item => {
                const kind = item._savedKind; // 'job' | 'bulletin' | 'community'
                const isJob = kind === 'job';
                const isBulletin = kind === 'bulletin';
                const hasApplied = isJob && applications.some(a => a.traineeId === userId && a.jobId === item.id);

                const badge = BADGE_STYLES[kind] || BADGE_STYLES.community;
                const BadgeIcon = badge.icon;

                // Author info
                const authorName = isJob
                    ? item.companyName
                    : resolveAuthorName(item, partners || [], trainees || []);

                // Author photo
                const authorPhoto = resolveAuthorPhoto(item, partners || [], trainees || []);

                // Author role label
                const authorRole = isJob
                    ? 'Industry Partner'
                    : (item.author_type === 'admin' ? 'Administrator'
                        : item.author_type === 'industry_partner' || item.author_type === 'partner' ? 'Industry Partner'
                        : 'Trainee');

                // Type label shown under the title
                const subLabel = isJob
                    ? `${item.opportunityType || 'Job'} • ${item.companyName}`
                    : getPostTypeLabel(item.post_type);

                // Footer description
                const footerText = isJob
                    ? 'Job opportunity posted by a verified partner'
                    : isBulletin
                        ? `Bulletin posted by ${authorName}`
                        : `Community post by ${authorName} · ${authorRole}`;

                // Icon color for the left icon box
                const iconBg = isJob ? '#eff6ff' : isBulletin ? '#f5f3ff' : '#f0fdf4';
                const iconColor = isJob ? '#2563eb' : isBulletin ? '#7c3aed' : '#16a34a';
                const iconBorder = isJob ? '#dbeafe' : isBulletin ? '#ddd6fe' : '#bbf7d0';

                return (
                    <div
                        key={`${kind}-${item.id}`}
                        style={{
                            background: '#fff',
                            padding: '20px',
                            borderRadius: 16,
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                            transition: 'box-shadow 0.2s',
                            cursor: 'pointer'
                        }}
                        onClick={() => onViewDetail && onViewDetail(item)}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.07)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)'}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                            <div style={{ display: 'flex', gap: 16, flex: 1, minWidth: 0 }}>
                                {/* Left icon / Photo */}
                                <div style={{
                                    width: 52, height: 52, flexShrink: 0,
                                    background: authorPhoto ? '#f8fafc' : iconBg,
                                    borderRadius: 14,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: iconColor,
                                    border: `1px solid ${authorPhoto ? '#e2e8f0' : iconBorder}`,
                                    overflow: 'hidden'
                                }}>
                                    {authorPhoto ? (
                                        <img src={authorPhoto} alt={authorName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        isJob ? <Building2 size={24} /> : isBulletin ? <Megaphone size={24} /> : <Users size={24} />
                                    )}
                                </div>

                                {/* Content */}
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    {/* Badge row */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                                        <span style={{
                                            fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                                            letterSpacing: 0.8, padding: '3px 10px', borderRadius: 99,
                                            background: badge.bg, color: badge.color,
                                            display: 'inline-flex', alignItems: 'center', gap: 4
                                        }}>
                                            <BadgeIcon size={10} />
                                            {badge.label}
                                        </span>
                                        <span style={{ fontSize: 12, color: '#94a3b8' }}>
                                            {timeAgo(item.created_at || item.createdAt)}
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 3, lineHeight: 1.3 }}>
                                        {item.title}
                                    </h3>

                                    {/* Sub-label (type + author) */}
                                    <p style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>
                                        <span style={{ color: isJob ? '#2563eb' : isBulletin ? '#7c3aed' : '#16a34a', fontWeight: 700 }}>
                                            {subLabel}
                                        </span>
                                    </p>

                                    {/* Posted by */}
                                    <p style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Star size={10} />
                                        Posted by <strong style={{ color: '#64748b', marginLeft: 3 }}>{authorName}</strong>
                                        <span style={{ marginLeft: 4, color: '#cbd5e1' }}>·</span>
                                        <span style={{ color: '#94a3b8' }}>{authorRole}</span>
                                    </p>

                                    {/* Location for jobs */}
                                    {item.location && (
                                        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b' }}>
                                            <MapPin size={12} />{item.location}
                                            {isJob && item.opportunityType && (
                                                <span style={{ marginLeft: 8, color: '#059669', fontWeight: 700 }}>{item.opportunityType}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Remove button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleBookmark(item.id);
                                }}
                                style={{
                                    background: '#fff1f2', border: 'none', color: '#e11d48',
                                    padding: '8px 14px', borderRadius: 10, fontSize: 12,
                                    fontWeight: 800, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    flexShrink: 0
                                }}
                            >
                                <Trash2 size={14} /> Remove
                            </button>
                        </div>

                        {/* Footer */}
                        <div style={{
                            marginTop: 16, paddingTop: 14,
                            borderTop: '1px solid #f1f5f9',
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', gap: 10
                        }}>
                            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                                {footerText}
                            </span>
                            <div style={{ display: 'flex', gap: 10 }}>
                                {isJob ? (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); !hasApplied && onApply && onApply(item); }}
                                        disabled={hasApplied}
                                        style={{
                                            height: 34, padding: '0 18px', borderRadius: 10,
                                            fontSize: 13, fontWeight: 700, border: 'none',
                                            background: hasApplied ? '#f1f5f9' : '#0a66c2',
                                            color: hasApplied ? '#94a3b8' : '#fff',
                                            cursor: hasApplied ? 'default' : 'pointer',
                                            display: 'flex', alignItems: 'center', gap: 6
                                        }}
                                    >
                                        {hasApplied ? <><CheckCircle size={14} /> Applied</> : 'Apply'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onOpenBulletin && onOpenBulletin(item); }}
                                        style={{
                                            height: 34, padding: '0 18px', borderRadius: 10,
                                            fontSize: 13, fontWeight: 700,
                                            border: '1.5px solid #e2e8f0',
                                            background: '#fff', color: '#334155',
                                            cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: 6
                                        }}
                                    >
                                        <Eye size={14} /> View
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default SavedItemsView;
