const fs = require('fs');

const path = './src/components/dashboards/PartnerDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

const bulletinNew = `              return (
                <div key={\`bulletin-\${item.id}\`} className="tt-feed-card">
                  <div className="tt-feed-card-cover" style={{ backgroundColor: cfg.bg }}></div>
                  <div className="tt-feed-card-icon" style={{ background: cfg.bg, color: cfg.color, border: 'none' }}>
                      {cfg.emoji}
                  </div>
                  <div className="tt-feed-card-content">
                      <div className="tt-feed-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span>{item.title}</span>
                          {item.author_id === currentUser?.id && (
                              <button onClick={() => { if (window.confirm('Delete bulletin?')) deletePost(item.id); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                  <Trash2 size={16} />
                              </button>
                          )}
                      </div>
                      <div className="tt-feed-card-subtitle">
                          <span style={{ fontWeight: 600, color: cfg.color }}>{cfg.label}</span> • <span style={{ color: sc.color }}>{item.status || 'Open'}</span>
                          {item.accept_referrals && <span style={{ marginLeft: 6, color: '#7c3aed', background: '#ede9fe', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700 }}>Accepts Referrals</span>}
                      </div>
                      <div className="tt-feed-card-subtitle">
                          {(() => {
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
                          })()} • {timeAgo(item.created_at)}
                      </div>
                      <div className="tt-feed-card-text" style={{ whiteSpace: 'pre-wrap' }}>{item.content}</div>
                      {reqs.length > 0 && (
                          <div className="tt-feed-card-tags">
                              {reqs.map((req, i) => (
                                  <span key={i} className="tt-feed-card-tag">{req}</span>
                              ))}
                          </div>
                      )}
                      {item.media_url && (
                          <div style={{ marginTop: 12 }}>
                              {item.media_url.match(/\\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                  <img src={item.media_url} alt="Bulletin media" style={{ width: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc' }} />
                              ) : (
                                  <a href={item.media_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', textDecoration: 'none', color: '#0a66c2', fontWeight: 600, fontSize: 13 }}>
                                      <FileText size={20} /> View Attached Document
                                  </a>
                              )}
                          </div>
                      )}
                      {item.accept_referrals && cfg.partnerLabel && (
                          <div className="tt-feed-card-footer" style={{ marginTop: 12 }}>
                              <button
                                  className={\`tt-feed-card-btn \${alreadyInteracted ? '' : 'tt-feed-card-btn-primary'}\`}
                                  onClick={() => openBulletinModal(item, cfg.type)}
                                  disabled={alreadyInteracted || item.status === 'Closed' || item.status === 'Full'}
                              >
                                  {alreadyInteracted ? 'Submitted' : cfg.partnerLabel}
                              </button>
                          </div>
                      )}
                  </div>
                </div>
              );`;

const jobNew = `              return (
                <div key={\`job-\${item.id}\`} className="tt-feed-card">
                  {item.attachmentUrl && item.attachmentUrl.match(/\\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <div className="tt-feed-card-cover" style={{ backgroundImage: \`url(\${item.attachmentUrl})\`, backgroundPosition: 'center', backgroundSize: 'cover' }}></div>
                  ) : (
                      <div className="tt-feed-card-cover"></div>
                  )}
                  <button type="button" className="tt-feed-card-icon" onClick={() => openProfile({ id: item.partnerId, type: 'partner' })} style={{ cursor: item.partnerId ? 'pointer' : 'default', background: '#f0f7ff', color: '#0a66c2', border: 'none', padding: 0 }}>
                      <Building2 size={24} />
                  </button>
                  <div className="tt-feed-card-content">
                      <div className="tt-feed-card-title">{item.title}</div>
                      <div className="tt-feed-card-subtitle">{item.companyName} • {timeAgo(item.createdAt)}</div>
                      <div className="tt-feed-card-text">{item.description}</div>
                      <div className="tt-feed-card-tags">
                          <span className="tt-feed-card-tag">{item.opportunityType}</span>
                          {item.employmentType && item.opportunityType !== 'OJT' && <span className="tt-feed-card-tag">{item.employmentType}</span>}
                          {item.ncLevel && <span className="tt-feed-card-tag">{item.ncLevel}</span>}
                      </div>
                      <div className="tt-feed-card-footer" style={{ display: 'flex', gap: 8 }}>
                          {myJob && (
                              <button className="tt-feed-card-btn tt-feed-card-btn-primary" onClick={() => setActivePage('applicants')}>
                                  <Users size={14} /> View Applicants
                              </button>
                          )}
                          <button className="tt-feed-card-btn" onClick={() => openJobMediaModal(item, true)}>
                              <MessageSquare size={14} /> Comment ({jobComments.length})
                          </button>
                          <button
                              className="tt-feed-card-btn"
                              onClick={() => !myJob && openContactModal({ recipientId: item.partnerId, recipientType: 'industry_partner', recipientName: item.companyName, jobPostingId: item.id, sourceLabel: item.title })}
                              disabled={myJob}
                          >
                              <MessageSquare size={14} /> {myJob ? 'Your Listing' : 'Contact'}
                          </button>
                      </div>
                  </div>
                </div>
              );`;

const postNew = `              return (
                <div key={\`post-\${item.id}\`} className="tt-feed-card">
                  {item.media_url && item.media_url.match(/\\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <div className="tt-feed-card-cover" style={{ backgroundImage: \`url(\${item.media_url})\`, backgroundPosition: 'center', backgroundSize: 'cover' }}></div>
                  ) : (
                      <div className="tt-feed-card-cover"></div>
                  )}
                  <button type="button" className="tt-feed-card-icon" onClick={() => openProfile({ id: item.author_id, type: authorProfileType })} style={{ cursor: 'pointer', border: 'none', padding: 0, fontWeight: 700, color: '#334155' }}>
                      {author?.photo || author?.company_logo_url ? <img src={author.photo || author.company_logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : authorInitial}
                  </button>
                  <div className="tt-feed-card-content">
                      <div className="tt-feed-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span>{item.title ? item.title : (author?.name || author?.profileName || author?.companyName || 'Unknown User')}</span>
                          {isMe && (
                              <div style={{ position: 'relative' }}>
                                  <button onClick={(e) => { e.stopPropagation(); setPostMenuId(postMenuId === item.id ? null : item.id); }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                                      <MoreVertical size={16} />
                                  </button>
                                  {postMenuId === item.id && (
                                    <div style={{ position: 'absolute', right: 0, top: 24, background: '#fff', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0', zIndex: 10, minWidth: 150 }} onClick={e => e.stopPropagation()}>
                                      <button onClick={() => { setEditingPostId(item.id); setEditContent(item.content); setPostMenuId(null); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', color: '#1e293b', textAlign: 'left' }}><Edit size={14}/> Edit post</button>
                                      <button onClick={() => { if(window.confirm('Delete this post?')) deletePost(item.id); setPostMenuId(null); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626', textAlign: 'left' }}><Trash2 size={14}/> Delete post</button>
                                    </div>
                                  )}
                              </div>
                          )}
                      </div>
                      <div className="tt-feed-card-subtitle">
                          {item.title ? \`\${author?.name || author?.profileName || author?.companyName || 'Unknown User'} • \` : ''} 
                          {isStudentAuthorType(item.author_type) ? (author?.program || 'Trainee') : (author?.companyName || 'Industry Partner')} • {timeAgo(item.created_at)}
                          {item.post_type !== 'general' && \` • \${item.post_type.replace('_', ' ')}\`}
                          {isMe && <span style={{ marginLeft: 6, background: '#f1f5f9', color: '#475569', fontSize: 10, padding: '2px 6px', borderRadius: 12, fontWeight: 600 }}>You</span>}
                      </div>
                      <div className="tt-feed-card-text" style={{ whiteSpace: 'pre-wrap' }}>
                          {editingPostId === item.id ? (
                              <div style={{ marginTop: 8 }}>
                                  <textarea value={editContent} onChange={e => setEditContent(e.target.value)} style={{ width: '100%', minHeight: 80, padding: 12, borderRadius: 8, border: '1px solid #0a66c2', fontSize: 14, fontFamily: 'inherit', resize: 'vertical' }} maxLength={2000} />
                                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                                      <button onClick={() => { setEditingPostId(null); setEditContent(''); }} style={{ padding: '6px 14px', borderRadius: 20, border: 'none', background: '#f1f5f9', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                                      <button onClick={() => handleEditPost(item)} disabled={!editContent.trim()} style={{ padding: '6px 14px', borderRadius: 20, border: 'none', background: '#0a66c2', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Save</button>
                                  </div>
                              </div>
                          ) : (
                            item.content
                          )}
                      </div>
                      <div className="tt-feed-card-tags">
                          {item.tags?.map(tag => (
                              <span key={tag} className="tt-feed-card-tag">#{tag.replace(/\\s+/g, '')}</span>
                          ))}
                      </div>
                      <div className="tt-feed-card-footer" style={{ display: 'flex', gap: 8 }}>
                          <button className="tt-feed-card-btn" onClick={() => handleCommentOnPost(item)}>
                              Comment ({comments.length})
                          </button>
                          <button className="tt-feed-card-btn" disabled={isMe} onClick={() => openContactModal({ recipientId: item.author_id, recipientType: toRecipientAuthorType(item.author_type), recipientName: author?.name || author?.profileName || author?.companyName || 'Unknown', postId: item.id, sourceLabel: item.content })}>
                              Contact
                          </button>
                      </div>
                  </div>
                </div>
              );`;

// 1. bulletin
const startPatternBulletin = "              return (\r\n                <div key={`bulletin-${item.id}`}";
const endPatternBulletin = "                </div>\r\n              );";

// 2. job
const startPatternJob = "} else if (item.feedType === 'job') {";
const endPatternJob = "                </div>\r\n              );\r\n            } else {";

// 3. post
const startPatternPost = "              return (\r\n                <div key={`post-${item.id}`}";
const endPatternPost = "                </div>\r\n              );\r\n            }\r\n          })}";

// Find indices
let idxMap = content.indexOf('{unifiedFeed.map(item => {');
if (idxMap === -1) throw new Error("Could not find unifiedFeed.map");

// Use RegExp for more flexible newline matching
function replaceBlock(content, startString, endString, replacement, searchStartIdx) {
    const startIndex = content.indexOf(startString, searchStartIdx);
    if (startIndex === -1) {
        console.error("Could not find startString: " + startString.substring(0, 30));
        return content;
    }
    const endIndex = content.indexOf(endString, startIndex);
    if (endIndex === -1) {
        console.error("Could not find endString: " + endString.substring(0, 30));
        return content;
    }
    const realEnd = endIndex + endString.length;
    return content.substring(0, startIndex) + replacement + content.substring(realEnd);
}

// Actual indices for Bulletin 
let idxBull1 = content.indexOf("return (", idxMap);
let idxBull2 = content.indexOf(");", idxBull1) + 2;

// Replacement for bulletin
content = content.substring(0, idxBull1) + bulletinNew + content.substring(idxBull2);

// Refresh indices since length changed
let idxJobCond = content.indexOf("} else if (item.feedType === 'job') {");
let idxJobRet = content.indexOf("return (", idxJobCond);
let idxJobEnd = content.indexOf(");", idxJobRet) + 2;

content = content.substring(0, idxJobRet) + jobNew + content.substring(idxJobEnd);

// Refresh indices for Post
let idxPostCond = content.indexOf("} else {", idxJobEnd);
let idxPostRet = content.indexOf("return (", idxPostCond);
// We want the last return inside the map!
let idxPostEnd = content.indexOf(");", idxPostRet) + 2;

content = content.substring(0, idxPostRet) + postNew + content.substring(idxPostEnd);

fs.writeFileSync(path, content, 'utf8');
console.log("Successfully replaced unifiedFeed map elements!");
