import React from 'react';
import { MessageSquare, Heart } from 'lucide-react';

/**
 * CommunityFeedPostCard - Clean post card layout with:
 * 1. Cover Area (top) - for images/media
 * 2. User Info Section - profile picture, name, role, metadata
 * 3. Post Content - text/caption
 * 4. Actions - Contact button (primary) and secondary actions
 */
export const CommunityFeedPostCard = ({
  coverImage,          // Optional media/image at top
  profileImage,        // Avatar image
  name,               // User name
  role,               // e.g., "Trainee", "Industry Partner"
  metadata = [],      // e.g., ["5d ago", "certification"]
  postContent,        // Post text/caption
  onContactClick,     // Primary action callback
  onCommentClick,     // Secondary action callback
  onSaveClick,        // Secondary action callback
  contactLabel = 'CONTACT'
}) => {
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 12,
      overflow: 'hidden',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      {/* ═══════════════════════════════════════════════════
          1. COVER AREA (Media/Image Section)
          ═══════════════════════════════════════════════════ */}
      {coverImage && (
        <div style={{
          width: '100%',
          height: 180,
          background: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          <img
            src={coverImage}
            alt="Post cover"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          2. USER INFO SECTION (with overlapping avatar)
          ═══════════════════════════════════════════════════ */}
      <div style={{
        position: 'relative',
        paddingTop: coverImage ? 0 : 16,
        paddingLeft: 16,
        paddingRight: 16,
        paddingBottom: 12,
        flex: coverImage ? '0 0 auto' : '0 0 auto'
      }}>
        {/* Avatar - overlapping cover if present */}
        <div style={{
          position: coverImage ? 'absolute' : 'relative',
          top: coverImage ? -24 : 0,
          left: coverImage ? 16 : 0,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: '#f0f7ff',
          color: '#0a66c2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          fontWeight: 700,
          border: '3px solid #fff',
          overflow: 'hidden',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          {profileImage ? (
            <img src={profileImage} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            initials
          )}
        </div>

        {/* User Info */}
        <div style={{
          marginTop: coverImage ? 16 : 8,
          paddingRight: 70
        }}>
          {/* Name */}
          <div style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#0f172a',
            lineHeight: 1.3
          }}>
            {name}
          </div>

          {/* Role + Time + Post Type */}
          <div style={{
            fontSize: 12,
            color: '#64748b',
            marginTop: 4,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px'
          }}>
            {role && <span>{role}</span>}
            {role && metadata.length > 0 && <span> | </span>}
            {metadata.map((item, idx) => (
              <span key={idx}>
                {item}
                {idx < metadata.length - 1 && (
                  <span style={{ marginLeft: '4px' }}> | </span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Contact Button - Positioned top-right */}
        {onContactClick && (
          <button
            onClick={onContactClick}
            style={{
              position: 'absolute',
              top: coverImage ? 16 : 12,
              right: 16,
              padding: '8px 16px',
              background: '#0a66c2',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 1px 3px rgba(10, 102, 194, 0.3)'
            }}
            onMouseEnter={e => {
              e.target.style.background = '#0952a3';
              e.target.style.boxShadow = '0 4px 8px rgba(10, 102, 194, 0.4)';
            }}
            onMouseLeave={e => {
              e.target.style.background = '#0a66c2';
              e.target.style.boxShadow = '0 1px 3px rgba(10, 102, 194, 0.3)';
            }}
          >
            {contactLabel}
          </button>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════
          3. POST CONTENT SECTION
          ═══════════════════════════════════════════════════ */}
      {postContent && (
        <div style={{
          padding: '0 16px',
          fontSize: 14,
          color: '#1f2937',
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          flex: '1 1 auto',
          display: 'flex',
          alignItems: 'flex-start'
        }}>
          {postContent}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          4. ACTION FOOTER (Comment, Save)
          ═══════════════════════════════════════════════════ */}
      <div style={{
        borderTop: '1px solid #e5e7eb',
        padding: '10px 16px',
        display: 'flex',
        gap: 12,
        justifyContent: 'space-between',
        background: '#fafbfc',
        marginTop: 'auto'
      }}>
        {/* Comment Button */}
        {onCommentClick && (
          <button
            onClick={onCommentClick}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: 12,
              fontWeight: 600,
              padding: '8px 0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'color 0.2s',
              borderRadius: 6
            }}
            onMouseEnter={e => {
              e.target.style.color = '#0a66c2';
              e.target.style.background = '#f0f7ff';
            }}
            onMouseLeave={e => {
              e.target.style.color = '#64748b';
              e.target.style.background = 'none';
            }}
          >
            <MessageSquare size={14} /> COMMENT
          </button>
        )}

        {/* Save Button */}
        {onSaveClick && (
          <button
            onClick={onSaveClick}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: 12,
              fontWeight: 600,
              padding: '8px 0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'color 0.2s',
              borderRadius: 6
            }}
            onMouseEnter={e => {
              e.target.style.color = '#0a66c2';
              e.target.style.background = '#f0f7ff';
            }}
            onMouseLeave={e => {
              e.target.style.color = '#64748b';
              e.target.style.background = 'none';
            }}
          >
            <Heart size={14} /> SAVE
          </button>
        )}
      </div>
    </div>
  );
};

export default CommunityFeedPostCard;
