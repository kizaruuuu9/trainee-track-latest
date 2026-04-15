const fs = require('fs');
const path = 'src/components/dashboards/PartnerDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Replace Create Post Trigger
const oldTrigger = `{/* Create Post Trigger */}
        <div className="ln-card" style={{ padding: '12px 16px', marginBottom: 16, cursor: 'pointer' }} onClick={() => setShowPostModal(true)}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="ln-nav-avatar pn-nav-avatar" style={{ flexShrink: 0 }}>{initials}</div>
            <div style={{ flex: 1, padding: '12px 16px', borderRadius: 24, border: '1px solid rgba(0,0,0,0.15)', background: '#f9fafb', color: 'rgba(0,0,0,0.5)', fontSize: 14 }}>Share a hiring update or company announcement...</div>
          </div>
        </div>`;

const newTrigger = `{/* Create Post Bar — Forum Style */}
        <div className="ln-create-post-bar">
            <button className="ln-create-post-btn" onClick={() => setShowPostModal(true)}>
                <Plus size={16} /> New Post
            </button>
            <span className="ln-create-post-label">Share a hiring update or company announcement...</span>
        </div>`;

if (content.includes(oldTrigger)) {
    content = content.replace(oldTrigger, newTrigger);
    console.log('Replaced Create Post Trigger');
} else {
    // try replacing normalizing whitespace
    const startIdx = content.indexOf('{/* Create Post Trigger */}');
    if (startIdx !== -1) {
        const endIdx = content.indexOf('</div>', content.indexOf('</div>', content.indexOf('</div>', startIdx) + 6) + 6) + 6;
        content = content.substring(0, startIdx) + newTrigger + content.substring(endIdx);
        console.log('Replaced Create Post Trigger (via substring)');
    }
}

// 2. Replace Preview UI in Modal
const startModalPreview = content.indexOf('{filePreview && (');
if(startModalPreview !== -1) {
    const endModalPreview = content.indexOf('</button>', content.indexOf('{selectedFile && !filePreview && (')) + 10;
    const finalEnd = content.indexOf('</div>', endModalPreview) + 6; // closes selectedFile div
    
    const newPreviewUI = `{(postContent.trim() || filePreview || selectedFile) && (
                    <div style={{ marginTop: 20 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>Preview</div>
                        <div className="tt-feed-card" style={{ marginBottom: 0, pointerEvents: 'none' }}>
                            {filePreview && (
                                <div className="tt-feed-card-cover" style={{ backgroundImage: \`url(\${filePreview})\`, position: 'relative' }}>
                                    <button
                                        style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' }}
                                        onClick={(e) => { e.preventDefault(); setSelectedFile(null); setFilePreview(null); }}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                            {!filePreview && <div className="tt-feed-card-cover"></div>}
                            <div className="tt-feed-card-icon">
                                {partner?.photo ? <img src={partner.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : ((partner?.companyName || partner?.profileName || '').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'P')}
                            </div>
                            <div className="tt-feed-card-content" style={{ paddingTop: 32 }}>
                                <div className="tt-feed-card-title">{partner?.companyName || partner?.profileName || 'You'}</div>
                                <div className="tt-feed-card-subtitle">{postType.charAt(0).toUpperCase() + postType.slice(1)} • Just now</div>
                                <div className="tt-feed-card-text" style={{ whiteSpace: 'pre-wrap' }}>{postContent || 'Your text will appear here...'}</div>
                            </div>
                        </div>
                    </div>
                )}
                {selectedFile && !filePreview && (
                    <div style={{ marginTop: 20, padding: '12px', background: '#f0f2f5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <FileText size={20} color="#65676b" />
                            <span style={{ fontSize: 14, fontWeight: 500 }}>{selectedFile.name}</span>
                        </div>
                        <button
                            style={{ background: 'none', border: 'none', color: '#65676b', cursor: 'pointer' }}
                            onClick={() => setSelectedFile(null)}
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}`;
                
    content = content.substring(0, startModalPreview) + newPreviewUI + content.substring(finalEnd);
    console.log('Replaced Preview UI');
}

// 3. Add Filter Tabs & Feed Grid Wrapper
const feedStartIdx = content.indexOf('{/* Unified Community Feed */}');
if (feedStartIdx !== -1) {
    const endHeaderIdx = content.indexOf('</div>', content.indexOf('<div className="ln-section-header"', feedStartIdx)) + 6;
    
    const newHeaderAndTabs = `<div className="ln-feed-filter-bar">
            {[
                { id: 'all', label: 'All', count: unifiedFeed.length },
                { id: 'post', label: 'Updates', count: unifiedFeed.filter(i => i.feedType === 'post').length },
                { id: 'job', label: 'Opportunities', count: unifiedFeed.filter(i => i.feedType === 'job').length },
                { id: 'bulletin', label: 'Bulletins', count: unifiedFeed.filter(i => i.feedType === 'bulletin').length },
            ].map(tab => (
                <button
                    key={tab.id}
                    className={\`ln-feed-filter-tab \${feedFilter === tab.id ? 'active' : ''}\`}
                    onClick={() => setFeedFilter(tab.id)}
                >
                    {tab.label}
                    <span className="ln-filter-count">{tab.count}</span>
                </button>
            ))}
        </div>

        <div className="tt-feed-grid">`;

    // Replace everything from feedStartIdx to endHeaderIdx with new structure
    content = content.substring(0, feedStartIdx) + '{/* Unified Community Feed */}\n        ' + newHeaderAndTabs + content.substring(endHeaderIdx);
    
    // The previous structure was `<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>`
    // We replaced that inner header, but the opening wrap is still there. Let's fix that too.
    content = content.replace(`<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="ln-section-header" style={{ marginBottom: 0 }}>
            <h3 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(0,0,0,0.6)' }}>Community Activity</h3>
          </div>`, newHeaderAndTabs);
    
    // Also, update the map condition
    content = content.replace(`{unifiedFeed.map(item => {`, `{unifiedFeed.filter(item => feedFilter === 'all' || item.feedType === feedFilter).map(item => {`);
    
    console.log('Replaced Feed Tabs and GridWrapper');
}

// 4. Also need to define feedFilter state. Let's place it under const [unifiedFeed] block or before it.
if (!content.includes('const [feedFilter, setFeedFilter]')) {
    content = content.replace('const [showPostModal, setShowPostModal] = useState(false);', 
                              'const [showPostModal, setShowPostModal] = useState(false);\n    const [feedFilter, setFeedFilter] = useState(\'all\');');
    console.log('Added feedFilter state');
}

fs.writeFileSync(path, content);
console.log('Done!');
