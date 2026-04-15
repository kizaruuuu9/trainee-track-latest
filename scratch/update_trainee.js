import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p = path.resolve(__dirname, '..', 'src/components/dashboards/TraineeDashboard.jsx');
let content = fs.readFileSync(p, 'utf-8');

// 0. IMPORTS
if (content.indexOf("FeedItemDetailModal") === -1) {
    content = content.replace(
        "import BrandLogo from '../common/BrandLogo';",
        "import BrandLogo from '../common/BrandLogo';\nimport { \n    FeedItem, \n    FeedItemDetailModal, \n    CreatePostTrigger, \n    UniversalPostModal,\n    isVerified,\n    resolvePartnerVisibility,\n    StatusBadge,\n    timeAgo\n} from './FeedComponents';"
    );
}

// 1. TraineeHome Hook & Logic Injection
if (content.indexOf("isLoadingMore") === -1) {
    content = content.replace(
        "const TraineeDashboardHome = ({ setActivePage }) => {",
        "const TraineeDashboardHome = ({ setActivePage }) => {\n    const { currentUser, partners, jobPostings, deletePost, createPostInteraction, loadMoreFeeds, trainees } = useApp();\n    const [isLoadingMore, setIsLoadingMore] = useState(false);\n    const [selectedFeedItem, setSelectedFeedItem] = useState(null);"
    );
}

// 2. Feed Grid rendering rewrite with FeedItem & Load More
const feedStartIdx = content.indexOf("{/* Unified Feed */}");
// Robust finding of the next section
let feedEndIdx = content.indexOf("{/* Right Column - Widgets */}");
if (feedEndIdx === -1) feedEndIdx = content.indexOf("{/* Right Aside - Widgets */}");

if(feedStartIdx !== -1 && feedEndIdx !== -1) {
    const startStr = content.substring(0, feedStartIdx);
    const endStr = content.substring(feedEndIdx);
    
    const newFeedHtml = `{/* Unified Feed */}
            <div className="tt-col-feed">
                <div className="tt-feed-grid">
                    {unifiedFeed.filter(item => feedFilter === 'all' || item.feedType === feedFilter).map(item => (
                        <FeedItem
                            key={item.feedType + '-' + item.id}
                            item={item}
                            isOwnPost={item.author_id === currentUser?.id}
                            onEdit={(it) => it.feedType === 'job' ? openEditJobModal(it) : handleEditPost(it)}
                            onDelete={(id) => deletePost(id)}
                            onInquire={(it) => it.feedType === 'bulletin' ? openBulletinModal(it, 'inquire') : openContactModal({ recipientId: it.author_id, recipientType: 'industry_partner', recipientName: it.companyName, sourceLabel: it.title })}
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

                {unifiedFeed.length >= 5 && (
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '32px 0' }}>
                        <button 
                            className="tt-feed-load-more" 
                            onClick={async () => {
                                setIsLoadingMore(true);
                                await loadMoreFeeds();
                                setIsLoadingMore(false);
                            }}
                            disabled={isLoadingMore}
                        >
                            {isLoadingMore ? 'Loading...' : 'Load older posts'}
                        </button>
                    </div>
                )}

                {selectedFeedItem && (
                    <FeedItemDetailModal
                        item={selectedFeedItem}
                        onClose={() => setSelectedFeedItem(null)}
                        onApply={(item, type) => item.feedType === 'job' ? feedOpenApplyModal(item) : openBulletinModal(item, type)}
                        onInquire={(item) => openBulletinModal(item, 'inquire')}
                        onSave={(id) => createPostInteraction(id, 'save')}
                        onRefer={() => {}}
                    />
                )}
            </div>
            `;
    content = startStr + newFeedHtml + endStr;
}

fs.writeFileSync(p, content, 'utf-8');
console.log('Update complete');
