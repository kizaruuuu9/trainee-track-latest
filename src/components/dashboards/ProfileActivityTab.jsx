import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { FeedItem, CreatePostTrigger, BULLETIN_CONFIG, UniversalPostModal } from './FeedComponents';
import { supabase } from '../../lib/supabase';

const ProfileActivityTab = ({ profileId, profileType, isOwnProfile }) => {
    const { 
        posts, jobPostings, currentUser, 
        createPost, updatePost, deletePost, 
        updatePartnerJobPosting, deleteJobPosting
    } = useApp();

    const [postMenuId, setPostMenuId] = useState(null);
    const [showPostModal, setShowPostModal] = useState(false);
    const [editingPost, setEditingPost] = useState(null);

    // 1. Filter Content by authorId
    const profileActivityFeed = useMemo(() => {
        // Filter community posts
        const myPosts = posts
            .filter(p => String(p.author_id) === String(profileId))
            .map(p => ({ 
                ...p, 
                // Only tag as bulletin if it's a bulletin type AND not an industry partner post
                feedType: (Object.keys(BULLETIN_CONFIG).includes(p.post_type) && p.author_type !== 'industry_partner') ? 'bulletin' : 'post' 
            }));

        // Filter job postings (only for partners)
        const myJobs = profileType === 'partner' 
            ? jobPostings
                .filter(j => String(j.partnerId) === String(profileId))
                .map(j => ({ ...j, feedType: 'job' }))
            : [];

        return [...myPosts, ...myJobs].sort((a, b) => {
            const dateA = new Date(a.created_at || a.createdAt || 0);
            const dateB = new Date(b.created_at || b.createdAt || 0);
            return dateB - dateA;
        });
    }, [posts, jobPostings, profileId, profileType]);

    // Handlers
    const handleOpenCreateModal = () => {
        setEditingPost(null);
        setShowPostModal(true);
    };

    const handleOpenEditModal = (item) => {
        setEditingPost(item);
        setShowPostModal(true);
    };

    const handleSavePost = async (postData) => {
        let res;
        let finalMediaUrl = postData.media_url || null;

        // 1. Handle File Upload if present
        if (postData.file) {
            try {
                const path = `post-media/${currentUser.id}/${Date.now()}_${postData.file.name}`;
                const { error: uploadErr } = await supabase.storage
                    .from('registration-uploads')
                    .upload(path, postData.file, { contentType: postData.file.type });
                if (uploadErr) throw uploadErr;
                const { data: urlData } = supabase.storage.from('registration-uploads').getPublicUrl(path);
                finalMediaUrl = urlData?.publicUrl;
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
            alert(res.error || 'Failed to save post');
        }
        return res;
    };

    const handleDelete = async (postId) => {
        const item = profileActivityFeed.find(f => f.id === postId);
        let res;
        if (item?.feedType === 'job') {
            res = await deleteJobPosting(postId);
        } else {
            res = await deletePost(postId);
        }
        
        if (!res.success) alert(res.error || 'Failed to delete post');
    };

    if (!isOwnProfile) return null;

    return (
        <div style={{ marginTop: 20 }}>
            {/* Create Post Input */}
            <CreatePostTrigger 
                onClick={handleOpenCreateModal} 
                userAvatar={currentUser?.photo || currentUser?.company_logo_url}
                placeholder={profileType === 'partner' ? "Share an update or announcement..." : "What's on your mind?"}
            />

            {/* Feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {profileActivityFeed.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', background: '#fff', borderRadius: 12, border: '1px solid #e4e6eb', animation: 'fadeIn 0.3s ease-out' }}>
                        <p style={{ color: '#65676b', fontSize: 15 }}>No activity yet. Share your first post!</p>
                    </div>
                ) : (
                    profileActivityFeed.map(item => (
                        <FeedItem 
                            key={`${item.feedType}-${item.id}`}
                            item={item}
                            isOwnPost={true} 
                            onEdit={handleOpenEditModal}
                            onDelete={handleDelete}
                            onInquire={() => {}} 
                            onSave={() => {}} 
                            onApply={(job, type) => {
                                if (type === 'applicants') {
                                    alert('Navigating to applicants view...');
                                }
                            }}
                            onComment={(i) => alert(`Opening comments for ${i.title || 'post'}...`)}
                            openProfile={() => {}} 
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
