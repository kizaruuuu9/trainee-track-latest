import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { useApp } from '../../context/AppContext';
import { FeedItem, BULLETIN_CONFIG, UniversalPostModal } from './FeedComponents';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const ProfileActivityTab = ({ profileId, profileType, isOwnProfile }) => {
    const {
        posts, jobPostings, currentUser,
        createPost, updatePost, deletePost,
        updatePartnerJobPosting, deleteJobPosting,
        uploadOptimizedImage
    } = useApp();
    const navigate = useNavigate();


    const [postMenuId, setPostMenuId] = useState(null);
    const [showPostModal, setShowPostModal] = useState(false);
    const [editingPost, setEditingPost] = useState(null);

    // 1. Filter Content by authorId
    const profileActivityFeed = useMemo(() => {
        // 1. Filter job postings (only for partners)
        const myJobs = profileType === 'partner'
            ? jobPostings
                .filter(j => String(j.partnerId) === String(profileId))
                .map(j => ({ ...j, feedType: 'job' }))
            : [];

        // 2. Filter community posts
        const myPosts = posts
            .filter(p => String(p.author_id) === String(profileId))
            .filter(p => {
                // Deduplication: If this is a hiring update, check if we already have a structured job with same title/time
                if (p.post_type === 'hiring_update' && profileType === 'partner') {
                    const postDate = new Date(p.created_at);
                    const hasMatchingJob = myJobs.some(j => {
                        const jobDate = new Date(j.createdAt || j.created_at);
                        const sameTitle = String(j.title || '').toLowerCase() === String(p.title || '').toLowerCase();
                        const closeTime = Math.abs(jobDate - postDate) < 24 * 60 * 60 * 1000; // 24 hour tolerance
                        return sameTitle && closeTime;
                    });
                    if (hasMatchingJob) return false;
                }
                return true;
            })
            .map(p => ({
                ...p,
                // Only tag as bulletin if it's a bulletin type AND not an industry partner post
                feedType: (Object.keys(BULLETIN_CONFIG).includes(p.post_type) && p.author_type !== 'industry_partner') ? 'bulletin' : 'post'
            }));

        return [...myPosts, ...myJobs].sort((a, b) => {
            const dateA = new Date(a.created_at || a.createdAt || 0);
            const dateB = new Date(b.created_at || b.createdAt || 0);
            return dateB - dateA;
        });
    }, [posts, jobPostings, profileId, profileType]);

    // Handlers
    const handleOpenEditModal = (item) => {
        if (item.feedType === 'job') {
            // Redirect to post-job page with edit state
            navigate('/partner/post-job', { state: { editJobId: item.id } });
        } else {
            setEditingPost(item);
            setShowPostModal(true);
        }
    };


    const handleSavePost = async (postData) => {
        let res;
        let finalMediaUrl = postData.media_url || null;

        // 1. Handle File Upload if present
        if (postData.file) {
            try {
                const path = `post-media/${currentUser.id}/${Date.now()}_${postData.file.name}`;
                const res = await uploadOptimizedImage('registration-uploads', path, postData.file);
                if (!res.success) throw new Error(res.error);
                finalMediaUrl = res.url;
            } catch (err) {
                console.error('Upload error:', err);
                return { success: false, error: 'Failed to upload media: ' + err.message };
            }
        }

        // 2. Sanitize payload
        const { id, file, expiry_date, ...sanitizedData } = postData;
        const payload = { ...sanitizedData, media_url: finalMediaUrl };
        if (id) payload.id = id; // Only include ID if editing existing post

        if (editingPost) {
            if (editingPost.feedType === 'job') {
                res = await updatePartnerJobPosting(editingPost.id, payload);
            } else {
                res = await updatePost(editingPost.id, payload);
            }
        } else {
            res = await createPost(payload);
        }

        if (!res.success) {
            toast.error(res.error || 'Failed to save post');
        }
        return res;
    };

    const handleDelete = async (postId) => {
        const item = profileActivityFeed.find(f => f.id === postId);
        if (!item) return;

        const confirmMsg = item.feedType === 'job' 
            ? `Are you sure you want to delete the opportunity "${item.title}"? This cannot be undone.`
            : `Are you sure you want to delete this post?`;

        if (!window.confirm(confirmMsg)) return;

        let res;
        if (item.feedType === 'job') {
            res = await deleteJobPosting(postId);
        } else {
            res = await deletePost(postId);
        }

        if (res.success) {
            toast.success('Deleted successfully');
            setPostMenuId(null);
        } else {
            toast.error(res.error || 'Failed to delete post');
        }
    };

    return (
        <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {profileActivityFeed.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', background: '#fff', borderRadius: 12, border: '1px solid #e4e6eb', animation: 'fadeIn 0.3s ease-out' }}>
                        <p style={{ color: '#65676b', fontSize: 15 }}>
                            {isOwnProfile ? "No activity yet. Share your first post from the home feed!" : "No activity yet."}
                        </p>
                    </div>
                ) : (
                    profileActivityFeed.map(item => (
                        <FeedItem
                            key={`${item.feedType}-${item.id}`}
                            item={item}
                            isOwnPost={isOwnProfile}
                            onEdit={handleOpenEditModal}
                            onDelete={handleDelete}
                            onInquire={() => { }}
                            onSave={() => { }}
                            onApply={(job, type) => {
                                if (type === 'applicants') {
                                    toast.success('Navigating to applicants view...');
                                }
                            }}
                            onComment={() => { }}
                            openProfile={() => { }}
                            postMenuId={postMenuId}
                            setPostMenuId={setPostMenuId}
                        />
                    ))
                )}
            </div>

            {/* Robust Universal Modal */}
            <UniversalPostModal
                isOpen={showPostModal}
                onClose={() => setShowPostModal(false)}
                onSave={handleSavePost}
                editingPost={editingPost}
                userType={profileType}
                currentUser={currentUser}
            />
        </div>
    );
};

export default ProfileActivityTab;