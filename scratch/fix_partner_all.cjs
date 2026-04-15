const fs = require('fs');
const path = 'src/components/dashboards/PartnerDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

// 0. REMOVE DUPLICATE LOCAL HELPERS (now in FeedComponents.jsx)
// We remove: isVerified, getLivePartner, timeAgo, isImageAttachment
const helpersToRemove = [
    /const isVerified = \(user\) => [\s\S]*?;/,
    /const getLivePartner = \(currentUser, partners = \[\]\) => \{[\s\S]*?\};/,
    /const timeAgo = \(dateStr\) => \{[\s\S]*?\};/,
    /const isImageAttachment = \(attachmentUrl, attachmentType\) => \{[\s\S]*?\};/
];

helpersToRemove.forEach(regex => {
    content = content.replace(regex, '');
});

// 1. ENSURE MODERN IMPORTS
if (content.indexOf("FeedItemDetailModal") === -1) {
    const importReplacement = "import BrandLogo from '../common/BrandLogo';\n" +
    "import { \n" +
    "    FeedItem, \n" +
    "    FeedItemDetailModal, \n" +
    "    CreatePostTrigger, \n" +
    "    UniversalPostModal,\n" +
    "    getLivePartner,\n" +
    "    isVerified,\n" +
    "    resolvePartnerVisibility,\n" +
    "    StatusBadge,\n" +
    "    timeAgo\n" +
    "} from './FeedComponents';";
    content = content.replace("import BrandLogo from '../common/BrandLogo';", importReplacement);
}

// 2. INJECT PARTNER HOME LOGIC (Hooks)
if (content.indexOf("loadMoreFeeds") === -1) {
    // Look for PartnerHome start and inject hooks
    content = content.replace(
        /const PartnerHome = \(\{ setActivePage \}\) => \{(\s*)const \{([\s\S]*?)\} = useApp\(\);/,
        "const PartnerHome = ({ setActivePage }) => {\n" +
        "  const { $2, loadMoreFeeds } = useApp();\n" +
        "  const [isLoadingMore, setIsLoadingMore] = useState(false);\n" +
        "  const [selectedFeedItem, setSelectedFeedItem] = useState(null);"
    );
}

// 3. SWAP FEED GRID UI
// We target the return statement of PartnerHome
// From <div className="ln-three-col"> to the next major section
const newFeedGrid = `
  return (
    <div className="tt-dashboard-grid">
      {/* Left Column - Sidenav space handled by layout, but we can put local widgets here if needed */}
      <div className="tt-col-left">
         <CompanySideCard partner={partner || currentUser} setActivePage={setActivePage} />
      </div>

      {/* Feed Column */}
      <div className="tt-col-feed">
        <CreatePostTrigger 
          onClick={() => setShowPostModal(true)} 
          placeholder="Share an update..." 
          userAvatar={partner?.company_logo_url || partner?.photo} 
        />
        
        <div className="tt-feed-grid">
            {unifiedFeed.filter(item => feedFilter === 'all' || item.feedType === feedFilter).map(item => (
                <FeedItem
                    key={item.feedType + '-' + item.id}
                    item={item}
                    isOwnPost={item.author_id === currentUser?.id}
                    onEdit={(it) => it.feedType === 'job' ? openEditJobModal(it) : handleEditPost(it)}
                    onDelete={(id) => deletePost(id)}
                    onSave={(id) => createPostInteraction(id, 'save')}
                    openProfile={openProfile}
                    onComment={handleCommentOnPost}
                    onViewDetail={setSelectedFeedItem}
                />
            ))}
        </div>

        {unifiedFeed.length >= 5 && (
            <div style={{ display: 'flex', justifyContent: 'center', margin: '32px 0' }}>
                <button 
                  className="tt-feed-load-more" 
                  onClick={async () => { setIsLoadingMore(true); await loadMoreFeeds(); setIsLoadingMore(false); }} 
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
              onSave={(id) => createPostInteraction(id, 'save')} 
            />
        )}
      </div>

      {/* Right Column - Widgets */}
      <div className="tt-col-right">
        <QuickActionsWidget setActivePage={setActivePage} verified={verified} />
        <RecruitmentStatsWidget myJobs={myJobs} myApplicants={myApplicants} />
      </div>
`;

// Replace from return start to the end of the return (roughly)
// We'll use a more surgical replace for the return block
content = content.replace(/return \(\s*<div className=\"ln-three-col\">[\s\S]*?\{?\/\\* Bulletin Interaction Modals \*\/\}?/, newFeedGrid + '\n\n      {/* Bulletin Interaction Modals */}');

fs.writeFileSync(path, content, 'utf8');
console.log("Partner Dashboard stabilized and modernized!");
