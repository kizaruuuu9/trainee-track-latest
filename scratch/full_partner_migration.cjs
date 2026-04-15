// Full Partner Dashboard Migration Script
// 1. Run refactor_partner.cjs (feed cards)
// 2. Run navbar_partner.cjs (sidebar nav + layout wrapper)  
// 3. Fix \\n literals from navbar script
// 4. Replace three-col layout with tt-col-feed
// 5. Remove right column widgets
// 6. Replace old Create Post modal with new one
// 7. Fix livePartner -> partner variable name in new modal

const fs = require('fs');
const { execSync } = require('child_process');
const FILE = 'src/components/dashboards/PartnerDashboard.jsx';

// Step 1 & 2: Run existing scripts
console.log('Step 1: Running feed card refactor...');
execSync('node scratch/refactor_partner.cjs', { stdio: 'inherit' });

console.log('Step 2: Running navbar refactor...');  
execSync('node scratch/navbar_partner.cjs', { stdio: 'inherit' });

// Now do all remaining transformations in one pass
let content = fs.readFileSync(FILE, 'utf8');

// Step 3: No longer needed - navbar script now uses real newlines

// Step 4: Replace three-col layout with tt-col-feed + search bar
console.log('Step 4: Replacing layout wrappers...');
const oldLayoutStart = '    <div className="ln-three-col">\r\n      {/* Left Column - Company Card */}\r\n      <div className="ln-col-left">\r\n        <CompanySideCard partner={partner || currentUser} setActivePage={setActivePage} />\r\n      </div>\r\n\r\n      {/* Center Column - Feed */}\r\n      <div className="ln-col-center">';
const newLayoutStart = '    <div>\r\n      {/* Center Column - Feed */}\r\n      <div className="tt-col-feed">\r\n        {/* Search Bar */}\r\n        <div className="tt-feed-search" style={{ marginBottom: \'16px\' }}>\r\n          <Search size={18} color="#94a3b8" />\r\n          <input type="text" placeholder="Search for jobs, skills, companies..." />\r\n        </div>';

let idx = content.indexOf(oldLayoutStart);
if (idx === -1) throw new Error('Could not find old layout start');
content = content.substring(0, idx) + newLayoutStart + content.substring(idx + oldLayoutStart.length);

// Step 5: Remove right column widgets
console.log('Step 5: Removing right column widgets...');
const oldRightCol = '      {/* Right Column - Widgets */}\r\n      <div className="ln-col-right">\r\n        <QuickActionsWidget setActivePage={setActivePage} verified={verified} />\r\n        <RecruitmentStatsWidget myJobs={myJobs} myApplicants={myApplicants} />\r\n      </div>';
idx = content.indexOf(oldRightCol);
if (idx === -1) throw new Error('Could not find right column widgets');
content = content.substring(0, idx) + content.substring(idx + oldRightCol.length);

// Step 6: Replace old Create Post modal with new modern one
console.log('Step 6: Replacing Create Post modal...');
const oldModalStart = '        {/* Post Creator Modal */}\r\n        {showPostModal && (\r\n          <div className="modal-overlay" onClick={() => setShowPostModal(false)}>\r\n            <div className="ln-modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>';
const oldModalEnd = '              <div className="ln-modal-footer">\r\n                <button className="ln-btn ln-btn-outline" onClick={() => setShowPostModal(false)}>Cancel</button>\r\n                <button className="ln-btn ln-btn-primary" onClick={handleCreatePost} disabled={isPosting || (!postContent.trim() && !selectedFile)}>\r\n                  {isPosting ? \'Publishing...\' : \'Publish Post\'}\r\n                </button>\r\n              </div>\r\n            </div>\r\n          </div>\r\n        )}';

const newModal = `        {/* Post Creator Modal */}
        {showPostModal && (
          <div className="ln-modal-overlay" style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(4px)',
              zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }} onClick={() => setShowPostModal(false)}>
            <div className="ln-card ln-modal-content" style={{
                width: '100%', maxWidth: 500, padding: 0, borderRadius: 12,
                boxShadow: '0 12px 28px 0 rgba(0, 0, 0, 0.2), 0 2px 4px 0 rgba(0, 0, 0, 0.1)',
                overflow: 'hidden', animation: 'lnModalIn 0.2s ease-out'
            }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f2f5', position: 'relative', textAlign: 'center' }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Create a post</h3>
                <button
                    style={{
                        position: 'absolute', right: 12, top: 12, background: '#e4e6eb',
                        border: 'none', width: 32, height: 32, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                    }}
                    onClick={() => setShowPostModal(false)}
                >
                    <X size={20} />
                </button>
              </div>

              <div style={{ padding: '16px 16px' }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openProfile({ id: currentUser?.id, type: 'partner' }); }}
                        style={{ flexShrink: 0, width: 40, height: 40, fontSize: 14, border: 'none', cursor: 'pointer', borderRadius: '50%', overflow: 'hidden' }}
                    >
                        {partner?.company_logo_url || partner?.photo ? <img src={partner.company_logo_url || partner.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
                    </button>
                    <div>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); openProfile({ id: currentUser?.id, type: 'partner' }); }}
                            style={{ fontWeight: 600, fontSize: 15, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#1e293b' }}
                        >
                            {partner?.companyName || 'Company Name'}
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <select value={postType} onChange={e => setPostType(e.target.value)} style={{ padding: '2px 8px', borderRadius: 12, border: 'none', background: '#f0f2f5', fontSize: 13, fontWeight: 600, color: '#050505', outline: 'none', cursor: 'pointer' }}>
                                <option value="announcement">\u{1F4E2} Announcement</option>
                                <option value="hiring_update">\u{1F4BC} Hiring Update</option>
                                <option value="achievement">\u{1F3C6} Achievement</option>
                                <option value="general">\u{1F4DD} General</option>
                            </select>
                        </div>
                    </div>
                </div>

                <textarea
                    autoFocus
                    placeholder="Provide an update or make an announcement..."
                    value={postContent}
                    onChange={e => setPostContent(e.target.value)}
                    style={{
                        width: '100%', minHeight: 100, border: 'none', resize: 'none', outline: 'none',
                        fontSize: 20, color: '#050505', background: 'transparent'
                    }}
                />

                {filePreview && (
                    <div style={{ position: 'relative', marginTop: 12, borderRadius: 8, overflow: 'hidden', border: '1px solid #ced0d4' }}>
                        <img src={filePreview} alt="Preview" style={{ width: '100%', display: 'block', maxHeight: 300, objectFit: 'contain', background: '#f0f2f5' }} />
                        <button
                            style={{ position: 'absolute', top: 8, right: 8, background: '#fff', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                            onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                        >
                            <X size={16} color="#050505" />
                        </button>
                    </div>
                )}
                {selectedFile && !filePreview && (
                    <div style={{ marginTop: 12, padding: '12px 16px', background: '#f0f2f5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <FileText size={20} color="#65676b" />
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#050505' }}>{selectedFile.name}</span>
                        </div>
                        <button style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }} onClick={() => setSelectedFile(null)}>
                            <X size={16} color="#65676b" />
                        </button>
                    </div>
                )}
              </div>

              <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f0f2f5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx" />
                      <button
                          type="button"
                          style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
                          onMouseOver={e => e.currentTarget.style.background = '#f0f2f5'}
                          onMouseOut={e => e.currentTarget.style.background = 'none'}
                          onClick={() => fileInputRef.current?.click()}
                          title="Attach Media"
                      >
                          <Camera size={20} color="#45bd62" />
                      </button>
                  </div>
                  <button
                      className="tt-feed-card-btn tt-feed-card-btn-primary"
                      onClick={handleCreatePost}
                      disabled={isPosting || (!postContent.trim() && !selectedFile)}
                      style={{ padding: '8px 24px', opacity: (isPosting || (!postContent.trim() && !selectedFile)) ? 0.5 : 1, width: 'auto', flex: 0 }}
                  >
                      {isPosting ? 'Posting...' : 'Post'}
                  </button>
              </div>
            </div>
          </div>
        )}`.replace(/\n/g, '\r\n');

const modalStartIdx = content.indexOf(oldModalStart);
if (modalStartIdx === -1) throw new Error('Could not find old modal start');
const modalEndIdx = content.indexOf(oldModalEnd, modalStartIdx);
if (modalEndIdx === -1) throw new Error('Could not find old modal end');
content = content.substring(0, modalStartIdx) + newModal + content.substring(modalEndIdx + oldModalEnd.length);

fs.writeFileSync(FILE, content, 'utf8');
console.log('All steps completed successfully!');
