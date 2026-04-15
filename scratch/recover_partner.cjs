const fs = require('fs');
const path = 'src/components/dashboards/PartnerDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix Imports
content = content.replace(
    "import { CompanyProfile } from './PartnerDashboard';",
    "import { \n    FeedItem, \n    FeedItemDetailModal, \n    CreatePostTrigger, \n    UniversalPostModal,\n    getLivePartner,\n    isVerified,\n    resolvePartnerVisibility,\n    StatusBadge,\n    timeAgo\n} from './FeedComponents';"
);

// 2. Add states to PartnerHome
// PartnerHome starts around line 900
const stateInjection = "\n  const [isLoadingMore, setIsLoadingMore] = useState(false);\n  const [selectedFeedItem, setSelectedFeedItem] = useState(null);";
content = content.replace(
    "const [postContent, setPostContent] = useState('');",
    "const [postContent, setPostContent] = useState('');" + stateInjection
);

// 3. Add loadMoreFeeds to useApp
content = content.replace(
    "const { currentUser, partners, deletePost, createPostInteraction } = useApp();",
    "const { currentUser, partners, deletePost, createPostInteraction, loadMoreFeeds } = useApp();"
);

// 4. Restore Feed Logic
// Find the filter bar and replace everything until the end of PartnerHome
const filterBarStart = '<div className="ln-feed-filter-bar">';
const filterBarEnd = '</div>';
const startIndex = content.indexOf(filterBarStart);

if (startIndex !== -1) {
    // We want to keep the filter bar but replace what's after it.
    // Let's find the closing tag of the filter bar div.
    let searchIndex = startIndex + filterBarStart.length;
    let divCount = 1;
    let filterBarCloseIndex = -1;
    
    // Simple div parser (assuming no nested divs with same name in a single line for simplicity here, or just find closing bracket)
    // Actually, I'll just look for '</div>' after the map.
    const mapEnd = '))}';
    const firstMapEnd = content.indexOf(mapEnd, startIndex);
    filterBarCloseIndex = content.indexOf('</div>', firstMapEnd);

    if (filterBarCloseIndex !== -1) {
        const feedLogic = `
        <div className="tt-feed-grid">
          {unifiedFeed
            .filter(item => feedFilter === 'all' || item.feedType === feedFilter)
            .map((item) => (
              <FeedItem
                key={\`\${item.feedType || 'post'}-\${item.id}\`}
                item={item}
                isOwnPost={item.author_id === currentUser?.id}
                onEdit={(it) => it.feedType === 'job' ? openEditJobModal(it) : handleEditPost(it)}
                onDelete={(id) => deletePost(id)}
                onInquire={() => { /* Not relevant for partners */ }}
                onSave={(id) => createPostInteraction(id, 'save')}
                onApply={() => { /* Not relevant for partners */ }}
                openProfile={openProfile}
                setPostMenuId={() => { }}
                onComment={handleCommentOnPost}
                onViewDetail={setSelectedFeedItem}
              />
            ))}
          {unifiedFeed.length === 0 && (
            <div className="ln-empty-state"><TrendingUp size={48} /><h3>No community activity</h3><p>Post an update to start the conversation.</p></div>
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
              {isLoadingMore ? (
                <>Loading...</>
              ) : (
                'Load older posts'
              )}
            </button>
          </div>
        )}

        {selectedFeedItem && (
          <FeedItemDetailModal
            item={selectedFeedItem}
            onClose={() => setSelectedFeedItem(null)}
            onApply={() => {}}
            onInquire={() => {}}
            onSave={(id) => createPostInteraction(id, 'save')}
            onRefer={() => {}}
          />
        )}`;

        // Replace from just after filterBarCloseIndex until the end of the div
        // Wait, the original code had:
        /*
        {unifiedFeed.filter(...).map(...)}
        {unifiedFeed.length === 0 && (...)}
        */
        // I'll replace everything between filterBarCloseIndex and the end of PartnerHome.
        
        const partnerHomeEnd = content.indexOf(');', filterBarCloseIndex);
        const before = content.substring(0, filterBarCloseIndex + 6); // include </div>
        const after = content.substring(partnerHomeEnd);
        
        content = before + feedLogic + '\n      </div>' + after;
    }
}

fs.writeFileSync(path, content, 'utf8');
console.log('Restored PartnerDashboard.jsx logic');
