const fs = require('fs');
const p = 'src/components/dashboards/TraineeDashboard.jsx';
let content = fs.readFileSync(p, 'utf-8');

const startStr = '{/* Unified Feed */}';
const endStr = '{/* Right Column - Widgets */}';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
    const replacement = \{/* Unified Feed */}
                <div className="tt-feed-grid">
                    {unifiedFeed.filter(item => feedFilter === 'all' || (item.feedType === 'job' ? 'job' : (item.post_type || 'general')) === feedFilter).map(item => (
                        <FeedItem
                            key={\\\\-\\\\}
                            item={item}
                            isOwnPost={item.author_id === currentUser?.id}
                            onEdit={(it) => it.feedType === 'job' ? openEditJobModal(it) : handleEditPost(it)}
                            onDelete={(id) => deletePost(id)}
                            onInquire={(it) => it.feedType === 'bulletin' ? openBulletinModal(it, 'inquire') : openContactModal({ recipientId: it.author_id || it.partnerId, recipientType: it.feedType === 'job' ? 'industry_partner' : toRecipientAuthorType(it.author_type), recipientName: it.companyName || it.name, sourceLabel: it.title || it.content })}
                            onSave={(id) => item.feedType === 'job' ? toggleBookmark(id) : createPostInteraction(id, 'save')}
                            onApply={(it, type) => item.feedType === 'job' ? feedOpenApplyModal(it) : openBulletinModal(it, type)}
                            openProfile={openProfile}
                            setPostMenuId={() => { }}
                            onComment={handleCommentOnPost}
                            onViewDetail={setSelectedFeedItem}
                        />
                    ))}
                    {unifiedFeed.length === 0 && (
                        <div className="ln-empty-state"><Search size={48} /><h3>No posts yet</h3><p>Follow partners or update your profile to see relevant content.</p></div>
                    )}
                </div>
                {unifiedFeed.length > 0 && (
                    <div style={{ textAlign: 'center', marginTop: 24, marginBottom: 40 }}>
                        <button 
                            className="ln-btn-outline" 
                            onClick={async (e) => { 
                                const btn = e.target;
                                const origText = btn.innerText;
                                btn.innerText = 'Loading...';
                                btn.disabled = true;
                                const count = await loadMoreFeeds(); 
                                if(count === 0) { btn.innerText = 'No more posts'; }
                                else { btn.innerText = origText; btn.disabled = false; }
                            }} 
                            style={{ padding: '10px 32px', fontSize: 13, borderRadius: 20 }}
                        >
                            Load More
                        </button>
                    </div>
                )}
            </div>

            \;
    content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
    fs.writeFileSync(p, content, 'utf-8');
    console.log('Successfully replaced feed map with tt-feed-grid array in TraineeDashboard.');
} else {
    console.log('Start or end index not found.', { startIndex, endIndex });
}
