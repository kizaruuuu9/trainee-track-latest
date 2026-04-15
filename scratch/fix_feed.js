const fs = require('fs');

const p = 'src/components/dashboards/TraineeDashboard.jsx';
let content = fs.readFileSync(p, 'utf-8');

const bulletinOld = `                            return (
                                <div key={\`bulletin-\${item.id}\`} className="ln-card ln-feed-card" style={{ marginBottom: 0, borderLeft: \`4px solid \${cfg.color}\` }}>`;

const bulletinReplace = `                            return (
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
                                        <div className="tt-feed-card-subtitle">{cfg.label} • {item.status || 'Open'}</div>
                                        <div className="tt-feed-card-text" style={{ whiteSpace: 'pre-wrap' }}>{item.content}</div>
                                        <div className="tt-feed-card-tags">
                                            {(item.schedule || item.time_range || item.slots) && (
                                               <span className="tt-feed-card-tag" style={{ background: '#fef9c3', color: '#854d0e' }}>
                                                   {item.slots ? \`\${item.slots} Slots\` : 'Scheduled'}
                                               </span>
                                            )}
                                            {reqs.map((r, i) => <span key={i} className="tt-feed-card-tag">{r}</span>)}
                                        </div>
                                        <div className="tt-feed-card-footer" style={{ display: 'flex', gap: 8 }}>
                                            {cfg.type && (
                                                <button className="tt-feed-card-btn tt-feed-card-btn-primary" onClick={() => openBulletinModal(item, cfg.type)} disabled={!!alreadyInteracted || item.status === 'Closed' || item.status === 'Full'}>
                                                    {alreadyInteracted ? 'Applied' : cfg.traineeLabel}
                                                </button>
                                            )}
                                            <button className="tt-feed-card-btn" onClick={() => openBulletinModal(item, 'inquire')}>Inquire</button>
                                        </div>
                                    </div>
                                </div>
                            );`;

// find the bulletin return to end of return branch
const bStart = content.indexOf(bulletinOld);
const bEnd = content.indexOf(`                        } else if (item.feedType === 'job') {`, bStart);
if (bStart > -1 && bEnd > -1) {
    content = content.substring(0, bStart) + bulletinReplace + '\n' + content.substring(bEnd);
}

const jobOld = `                            return (
                                <div key={\`job-\${item.id}\`} className="ln-card ln-feed-card" style={{ marginBottom: 0 }}>`;

const jobReplace = `                            return (
                                <div key={\`job-\${item.id}\`} className="tt-feed-card">
                                    {item.attachmentUrl && isImageAttachment(item.attachmentUrl, item.attachmentType) ? (
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
                                            {item.employmentType && <span className="tt-feed-card-tag">{item.employmentType}</span>}
                                            {item.ncLevel && <span className="tt-feed-card-tag">{item.ncLevel}</span>}
                                        </div>
                                        <div className="tt-feed-card-footer" style={{ display: 'flex', gap: 8 }}>
                                            <button className="tt-feed-card-btn tt-feed-card-btn-primary" disabled={applied || item.status !== 'Open'} onClick={() => feedOpenApplyModal(item)}>
                                                {applied ? 'Applied' : 'Apply'}
                                            </button>
                                            <button className="tt-feed-card-btn" onClick={() => toggleBookmark(item.id)}>
                                                {isSaved ? 'Saved' : 'Save'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );`;

const jStart = content.indexOf(jobOld);
const jEnd = content.indexOf(`                        } else {`, jStart);
if (jStart > -1 && jEnd > -1) {
    content = content.substring(0, jStart) + jobReplace + '\n' + content.substring(jEnd);
}


const postOld = `                            return (
                                <div key={\`post-\${item.id}\`} className="ln-card ln-feed-card" style={{ marginBottom: 0 }}>`;

const postReplace = `                            return (
                                <div key={\`post-\${item.id}\`} className="tt-feed-card">
                                    {item.media_url && item.media_url.match(/\\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                        <div className="tt-feed-card-cover" style={{ backgroundImage: \`url(\${item.media_url})\`, backgroundPosition: 'center', backgroundSize: 'cover' }}></div>
                                    ) : (
                                        <div className="tt-feed-card-cover"></div>
                                    )}
                                    <button type="button" className="tt-feed-card-icon" onClick={() => openProfile({ id: item.author_id, type: authorProfileType })} style={{ cursor: 'pointer', border: 'none', padding: 0, fontWeight: 700, color: '#334155' }}>
                                        {authorPhoto ? <img src={authorPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : authorInitial}
                                    </button>
                                    <div className="tt-feed-card-content">
                                        <div className="tt-feed-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <span>{item.title ? item.title : authorName}</span>
                                            {isOwnPost && (
                                                <button onClick={() => { if (window.confirm('Delete post?')) deletePost(item.id); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="tt-feed-card-subtitle">
                                            {item.title ? \`\${authorName} • \` : ''} {isStudentAuthorType(item.author_type) ? (author?.program || 'Trainee') : (author?.companyName || 'Industry Partner')} • {timeAgo(item.created_at)}
                                            {item.post_type !== 'general' && \` • \${item.post_type.replace('_', ' ')}\`}
                                        </div>
                                        <div className="tt-feed-card-text" style={{ whiteSpace: 'pre-wrap' }}>{item.content}</div>
                                        <div className="tt-feed-card-tags">
                                            {item.tags?.map(tag => (
                                                <span key={tag} className="tt-feed-card-tag">#{tag.replace(/\\s+/g, '')}</span>
                                            ))}
                                        </div>
                                        <div className="tt-feed-card-footer" style={{ display: 'flex', gap: 8 }}>
                                            <button className="tt-feed-card-btn" onClick={() => handleCommentOnPost(item)}>
                                                Comment ({comments.length})
                                            </button>
                                            <button className="tt-feed-card-btn tt-feed-card-btn-primary" disabled={isOwnPost} onClick={() => openContactModal({ recipientId: item.author_id, recipientType: toRecipientAuthorType(item.author_type), recipientName: authorName, postId: item.id, sourceLabel: item.content })}>
                                                Contact
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );`;

const pStart = content.indexOf(postOld);
const pEnd = content.indexOf(`                        }`, pStart);
if (pStart > -1 && pEnd > -1) {
    // wait pEnd might be matching the closing brace of exactly what?
    // Let's find the end of the item map iteration
    let count = 1;
    let i = content.indexOf('{', postOld.length + pStart);
    for(; i < content.length; i++) {
        if(content[i] === '{') count++;
        if(content[i] === '}') count--;
        if(count === 0) break;
    }
    // We just replace up to that `}` which closes the map callback? 
    // No, there is a `}` that closes the `else` block or `div`. 
    // It's safer to find `                    })}
                    {unifiedFeed.length === 0`
    
    // Actually finding `);` for the return statement inside else.
    const pEndRet = content.indexOf(');', pStart);
    content = content.substring(0, pStart) + postReplace + '\n' + content.substring(pEndRet + 2);
}

fs.writeFileSync(p, content, 'utf-8');
