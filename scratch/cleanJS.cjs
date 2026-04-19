const fs = require('fs');

let pre = [];
let block = [];
let post = [];
let inBlock = false;
let passes = 0;

const lines = fs.readFileSync('src/components/dashboards/PartnerDashboard.jsx', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (!inBlock && line.includes('const PostJob =')) {
     passes++;
  }
  
  if (passes === 1 && !inBlock && line.includes('ln-profile-two-col')) {
     inBlock = true;
     block.push(line);
     continue;
  }
  
  if (inBlock) {
     block.push(line);
     if (line.includes('Live Post Preview')) {
        inBlock = false;
        passes = 2; // done
     }
  } else {
     if (passes < 2) pre.push(line);
     else post.push(line);
  }
}

// Convert block
let bStr = block.join('\n');
bStr = bStr.replace(/ln-profile-two-col/, 'ln-profile-one-col');
bStr = bStr.replace(/padding: 20/, 'padding: 24');
bStr = bStr.replace(/<div className="form-group">/g, '<div style={{ display: `contents` }}>');
bStr = bStr.replace(/className="ln-info-label"/g, 'style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, display: `block`, color: `#1e293b` }}');
bStr = bStr.replace(/className="form-input"/g, 'className="form-input" style={{ fontSize: 14, borderRadius: 10, padding: `10px 14px` }}');
bStr = bStr.replace(/className="form-select"/g, 'className="form-select" style={{ fontSize: 14, borderRadius: 10, padding: `10px 14px` }}');
bStr = bStr.replace(/<div className="ln-info-grid"[^>]*>/g, '<div style={{ display: `contents` }}>');

bStr = bStr.replace(/<\/div>\s*<div className="ln-card" style=\{\{ padding: 24 \}\}>\s*<h3[^>]+>Required Competencies<\/h3>/, 
'\n            <div style={{ gridColumn: `span 2`, marginTop: 16, paddingTop: 16, borderTop: `1px solid #e2e8f0` }}>\n              <h3 style={{ fontSize: 16, fontWeight: 700, color: `#1e293b`, marginBottom: 16 }}>Required Competencies</h3>');

bStr = bStr.replace(/<div className="ln-card" style=\{\{ padding: 24 \}\}>\s*<h3[^>]+>Opportunity Details<\/h3>/, '<div className="ln-card" style={{ padding: 24 }}>\n            <h3 style={{ fontSize: 16, fontWeight: 700, color: `#1e293b`, marginBottom: 16 }}>Opportunity Details</h3>\n            <div style={{ display: `grid`, gridTemplateColumns: `minmax(0, 1fr) minmax(0, 1fr)`, gap: 12 }}>');

bStr = bStr.replace(/<button type="submit" className="ln-btn ln-btn-primary" disabled=\{posting\} style=\{\{[^}]+\}\}>/, '<button type="submit" className="ln-btn-sm" disabled={posting} style={{ background: `#0a66c2`, color: `white`, border: `none`, padding: `10px 24px`, fontSize: 14, borderRadius: 20, opacity: posting ? 0.7 : 1, cursor: posting ? `not-allowed` : `pointer` }}>');
bStr = bStr.replace(/<div style=\{\{ marginTop: 20 \}\}>/, '<div style={{ gridColumn: `span 2`, marginTop: 20, display: `flex`, justifyContent: `flex-end`, width: `100%` }}>');

// Close the grid inside block before feed preview
const endRx = /<\/div>\s*<\/div>\s*<\/div>\s*<div className="ln-card ln-feed-card"/g;
bStr = bStr.replace(endRx, '</div>\n              </div>\n            </div>\n          </div>\n\n        <div className="ln-card ln-feed-card"');

fs.writeFileSync('src/components/dashboards/PartnerDashboard.jsx', pre.join('\n') + '\n' + bStr + '\n' + post.join('\n'));
console.log('REPLACED', passes);
