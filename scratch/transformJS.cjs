const fs = require('fs');

const lines = fs.readFileSync('src/components/dashboards/PartnerDashboard.jsx', 'utf8').split('\n');

let pre = lines.slice(0, 3193).join('\n');
let block = lines.slice(3193, 3450).join('\n');
let post = lines.slice(3450).join('\n');


block = block.replace('<div className=\"ln-profile-two-col\">\\r\\n          <div className=\"ln-card\" style={{ padding: 20 }}>\\r\\n            <h3 style={{ fontSize: 16, fontWeight: 600, color: \\'rgba(0,0,0,0.9)\\', marginBottom: 16 }}>Opportunity Details</h3>',
  '<div className=\"ln-profile-one-col\">\\n          <div className=\"ln-card\" style={{ padding: 24 }}>\\n            <h3 style={{ fontSize: 16, fontWeight: 700, color: \\'#1e293b\\', marginBottom: 16 }}>Opportunity Details</h3>\\n            <div style={{ display: \\'grid\\', gridTemplateColumns: \\'minmax(0, 1fr) minmax(0, 1fr)\\', gap: 12 }}>'
);
block = block.replace('<div className=\"ln-profile-two-col\">\\n          <div className=\"ln-card\" style={{ padding: 20 }}>\\n            <h3 style={{ fontSize: 16, fontWeight: 600, color: \\'rgba(0,0,0,0.9)\\', marginBottom: 16 }}>Opportunity Details</h3>',
  '<div className=\"ln-profile-one-col\">\\n          <div className=\"ln-card\" style={{ padding: 24 }}>\\n            <h3 style={{ fontSize: 16, fontWeight: 700, color: \\'#1e293b\\', marginBottom: 16 }}>Opportunity Details</h3>\\n            <div style={{ display: \\'grid\\', gridTemplateColumns: \\'minmax(0, 1fr) minmax(0, 1fr)\\', gap: 12 }}>'
);

block = block.replace(/<\\/div>\\s*<div className=\"ln-card\" style={{ padding: 20 }}>\\s*<h3 style={{ fontSize: 16, fontWeight: 600, color: \\'rgba\\(0,0,0,0\\.9\\)\\', marginBottom: 16 }}>Required Competencies<\\/h3>/, 
  '\\n            <div style={{ gridColumn: \\'span 2\\', marginTop: 16, paddingTop: 16, borderTop: \\'1px solid #e2e8f0\\' }}>\\n              <h3 style={{ fontSize: 16, fontWeight: 700, color: \\'#1e293b\\', marginBottom: 16 }}>Required Competencies</h3>'
);

block = block.replace(/className=\"form-group\"/g, 'style={{ display: \\'contents\\' }}');
block = block.replace(/<div className=\"ln-info-grid\"[^>]+>/g, '<div style={{ display: \\'contents\\' }}>');
block = block.replace(/className=\"ln-info-label\"/g, 'style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, display: \\'block\\', color: \\'#1e293b\\' }}');
block = block.replace(/className=\"(form-input|form-select)\"/g, 'className=\"\" style={{ fontSize: 14, borderRadius: 10, padding: \\'10px 14px\\' }}');

block = block.replace(/<div style={{ display: \\'contents\\' }}>\\s*<label style={{[^}]+}}>Title \\*/, '<div style={{ gridColumn: \\'span 2\\' }}>\\n              <label style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, display: \\'block\\', color: \\'#1e293b\\' }}>Job Title *');
block = block.replace(/<div style={{ display: \\'contents\\' }}>\\s*<label style={{[^}]+}}>Description<\\/label>/, '<div style={{ gridColumn: \\'span 2\\' }}>\\n              <label style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, display: \\'block\\', color: \\'#1e293b\\' }}>Description</label>');
block = block.replace(/<div style={{ display: \\'contents\\' }}>\\s*<label style={{[^}]+}}>Attachment \\(Image or Document\\)<\\/label>/, '<div style={{ gridColumn: \\'span 2\\' }}>\\n              <label style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, display: \\'block\\', color: \\'#1e293b\\' }}>Attachment (Image or Document)</label>');

block = block.replace(/<button type=\"submit\" className=\"ln-btn ln-btn-primary\" disabled={posting} style={{ width: \\'100%\\', padding: \\'10px 20px\\', fontSize: 14, opacity: posting \\? 0\\.75 : 1, cursor: posting \\? \\'not-allowed\\' : \\'pointer\\' }}>/, 
  '<button type=\"submit\" className=\"ln-btn-sm\" disabled={posting} style={{ background: \\'#0a66c2\\', color: \\'white\\', border: \\'none\\', padding: \\'10px 24px\\', fontSize: 14, borderRadius: 20, opacity: posting ? 0.7 : 1, cursor: posting ? \\'not-allowed\\' : \\'pointer\\' }}>'
);
block = block.replace(/<div style={{ marginTop: 20 }}>/, '<div style={{ gridColumn: \\'span 2\\', marginTop: 20, display: \\'flex\\', justifyContent: \\'flex-end\\', width: \\'100%\\' }}>');


const rx = /<\\/div>\\s*<\\/div>\\s*<\\/div>\\s*<div className=\"ln-card ln-feed-card\"/;
block = block.replace(rx, '<\\/div>\\n              <\\/div>\\n            <\\/div>\\n          <\\/div>\\n\\n        <div className=\"ln-card ln-feed-card\"');

if (block.includes('minmax')) {
   fs.writeFileSync('src/components/dashboards/PartnerDashboard.jsx', pre + '\\n' + block + '\\n' + post);
   console.log('REPLACED WITH ZERO OUTSIDE INTERFERENCE');
} else {
   console.log('REPLACE FAILED');
}
