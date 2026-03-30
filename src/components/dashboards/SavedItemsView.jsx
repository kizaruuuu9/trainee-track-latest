import React from 'react';
import { Bookmark, Building2, MapPin, Trash2, Send, Eye, MessageSquare, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const SavedItemsView = ({ userId, userType, onApply, onOpenBulletin }) => {
    const { 
        jobPostings, posts, postInteractions, updateTrainee, 
        applications, createPostInteraction, currentUser, 
        partners, trainees 
    } = useApp();

    // 1. Get saved Jobs (Trainee only for now based on current schema)
    const trainee = userType === 'trainee' ? (currentUser || trainees.find(t => t.id === userId)) : null;
    const savedJobIds = trainee?.savedOpportunities || [];
    const savedJobs = jobPostings
        .filter(j => savedJobIds.includes(j.id))
        .map(j => ({ ...j, itemType: 'job' }));

    // 2. Get saved Bulletins (Shared logic)
    const savedBulletinInteractions = postInteractions.filter(i => 
        i.user_id === userId && 
        i.interaction_type === 'save'
    );
    const savedBulletins = posts
        .filter(p => savedBulletinInteractions.some(i => i.post_id === p.id))
        .map(p => ({ ...p, itemType: 'bulletin' }));

    // Combined list, sorted by "recently saved" if possible (fall back to item creation/id)
    const allSavedItems = [...savedJobs, ...savedBulletins].sort((a, b) => {
        const dateA = new Date(a.created_at || a.createdAt || 0);
        const dateB = new Date(b.created_at || b.createdAt || 0);
        return dateB - dateA;
    });

    const removeJobBookmark = async (jobId) => {
        if (!userId || userType !== 'trainee') return;
        const newList = savedJobIds.filter(id => id !== jobId);
        await updateTrainee(userId, { savedOpportunities: newList });
    };

    const removeBulletinBookmark = async (postId) => {
        // Since createPostInteraction handles toggling for 'save', 
        // calling it again will remove the current save record.
        await createPostInteraction(postId, 'save');
    };

    const timeAgo = (dateStr) => {
        if (!dateStr) return 'Recently';
        try {
            const now = new Date();
            const past = new Date(dateStr);
            const diff = Math.floor((now - past) / 1000);
            if (diff < 60) return 'Just now';
            if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
            if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
            return `${Math.floor(diff / 86400)}d ago`;
        } catch (e) {
            return 'Recently';
        }
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
                const isJob = item.itemType === 'job';
                const hasApplied = isJob && applications.some(a => a.traineeId === userId && a.jobId === item.id);

                return (
                    <div 
                        key={`${item.itemType}-${item.id}`} 
                        style={{ 
                            background: '#fff',
                            margin: 0, 
                            padding: '20px', 
                            borderRadius: 16, 
                            border: '1px solid #e2e8f0', 
                            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                            <div style={{ display: 'flex', gap: 16 }}>
                                <div style={{ 
                                    width: 52, height: 52, 
                                    background: isJob ? '#eff6ff' : '#fff7ed', 
                                    borderRadius: 14, 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: isJob ? '#2563eb' : '#ea580c',
                                    border: `1px solid ${isJob ? '#dbeafe' : '#ffedd5'}`
                                }}>
                                    {isJob ? <Building2 size={24} /> : <Bookmark size={24} />}
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <span style={{ 
                                            fontSize: 10, fontWeight: 800, textTransform: 'uppercase', 
                                            letterSpacing: 0.8, padding: '3px 10px', borderRadius: 99,
                                            background: isJob ? '#dbeafe' : '#ffedd5',
                                            color: isJob ? '#1e40af' : '#9a3412',
                                            display: 'inline-block'
                                        }}>
                                            {isJob ? 'Job Posting' : 'Bulletin Post'}
                                        </span>
                                        <span style={{ fontSize: 12, color: '#94a3b8' }}>{timeAgo(item.created_at || item.createdAt)}</span>
                                    </div>
                                    <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>{item.title}</h3>
                                    <p style={{ fontSize: 13.5, color: isJob ? '#2563eb' : '#475569', fontWeight: isJob ? 700 : 500 }}>
                                        {isJob ? item.companyName : (item.post_type?.replace('_', ' ') || 'Notice')}
                                    </p>
                                    <div style={{ marginTop: 8, display: 'flex', gap: 12, fontSize: 13, color: '#64748b', alignItems: 'center' }}>
                                        {item.location && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={13} />{item.location}</span>}
                                        {isJob && <span style={{ color: '#059669', fontWeight: 700 }}>{item.opportunityType}</span>}
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => isJob ? removeJobBookmark(item.id) : removeBulletinBookmark(item.id)}
                                style={{ 
                                    background: '#fff1f2', border: 'none', color: '#e11d48', 
                                    padding: '8px 14px', borderRadius: 10, fontSize: 12, 
                                    fontWeight: 800, cursor: 'pointer', 
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    marginRight: 0, marginLeft: 'auto'
                                }}
                            >
                                <Trash2 size={14} /> Remove
                            </button>
                        </div>

                        <div style={{ 
                            marginTop: 20, paddingTop: 16, 
                            borderTop: '1px solid #f1f5f9', 
                            display: 'flex', justifyContent: 'space-between', 
                            alignItems: 'center', gap: 10 
                        }}>
                            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                                {isJob ? 'Available for application' : 'Bulletin board announcement'}
                            </span>
                            <div style={{ display: 'flex', gap: 10 }}>
                                {isJob ? (
                                    <button 
                                        className="ln-btn-sm ln-btn-primary" 
                                        onClick={() => !hasApplied && onApply && onApply(item)}
                                        disabled={hasApplied}
                                        style={{ 
                                            height: 34, padding: '0 18px', borderRadius: 10, 
                                            fontSize: 13, fontWeight: 700,
                                            background: hasApplied ? '#f1f5f9' : '#0a66c2',
                                            color: hasApplied ? '#94a3b8' : '#fff'
                                        }}
                                    >
                                        {hasApplied ? <><CheckCircle size={14} style={{ marginRight: 6 }} /> Applied</> : 'Apply'}
                                    </button>
                                ) : (
                                    <button 
                                        className="ln-btn-sm ln-btn-outline" 
                                        onClick={() => onOpenBulletin && onOpenBulletin(item)}
                                        style={{ 
                                            height: 34, padding: '0 18px', borderRadius: 10, 
                                            fontSize: 13, fontWeight: 700, border: '1.5px solid #e2e8f0',
                                            background: '#fff', color: '#334155'
                                        }}
                                    >
                                        <Eye size={14} style={{ marginRight: 6 }} /> View
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
