import fs from 'fs';

let code = fs.readFileSync('scratch/post_opp_form.txt', 'utf8');

code = code.replace(/className="ln-profile-two-col"/, '');

// Convert labels
code = code.replace(/<label className="ln-info-label">([^<]+)<\/label>/g, '<label style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, display: `block`, color: `#1e293b` }}>$1</label>');

// Convert form-input / form-select
code = code.replace(/className="(form-input|form-select)"/g, 'className="$1" style={{ fontSize: 14, borderRadius: 10, padding: `10px 14px` }}');

// Replace the top card
code = code.replace(/<div className="ln-card" style={{ padding: 20 }}>\s*<h3 style={{ fontSize: 16, fontWeight: 600, color: 'rgba\(0,0,0,0\.9\)', marginBottom: 16 }}>Opportunity Details<\/h3>/, 
  `<div className="ln-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>Opportunity Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12 }}>`
);

// Remove all form-groups wrapping and instead manage children.
code = code.replace(/<div className="form-group">/g, '<div>');

// Title gets gridColumn: span 2
code = code.replace(/<div>\s*<label style={{[^}]+}}>Title \*/, '<div style={{ gridColumn: `span 2` }}>\n              <label style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, display: `block`, color: `#1e293b` }}>Job Title *');

// description gets gridColumn: span 2
code = code.replace(/<div>\s*<label style={{[^}]+}}>Description/, '<div style={{ gridColumn: `span 2` }}>\n              <label style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, display: `block`, color: `#1e293b` }}>Description');

// attachment gets gridColumn: span 2
code = code.replace(/<div>\s*<label style={{[^}]+}}>Attachment \(Image or Document\)/, '<div style={{ gridColumn: `span 2` }}>\n              <label style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, display: `block`, color: `#1e293b` }}>Attachment (Image or Document)');

// Remove ln-info-grid wrappers
code = code.replace(/<div className="ln-info-grid"[^>]+>/g, '<div style={{ display: `contents` }}>');

// Clean up ending div of first card
code = code.replace(/<\/div>\s*<div className="ln-card" style={{ padding: 20 }}>\s*<h3 style={{ fontSize: 16, fontWeight: 600, color: 'rgba\\(0,0,0,0\\.9\\)', marginBottom: 16 }}>Required Competencies<\/h3>/,
  `</div></div>
          <div style={{ gridColumn: 'span 2', marginTop: 16, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>Required Competencies</h3>`
);

// Submit button styling
code = code.replace(/<button type="submit" className="ln-btn ln-btn-primary" disabled={posting} style={{ width: '100%', padding: '10px 20px', fontSize: 14, opacity: posting \? 0\.75 : 1, cursor: posting \? 'not-allowed' : 'pointer' }}>/,
  `<button type="submit" className="ln-btn-sm" disabled={posting} style={{ background: '#0a66c2', color: 'white', border: 'none', padding: '10px 24px', fontSize: 14, borderRadius: 20, opacity: posting ? 0.7 : 1, cursor: posting ? 'not-allowed' : 'pointer' }}>`
);

code = code.replace(/<div style={{ marginTop: 20 }}>/, `<div style={{ gridColumn: 'span 2', marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>`);

fs.writeFileSync('scratch/out.jsx', code);
console.log('done regex processing');