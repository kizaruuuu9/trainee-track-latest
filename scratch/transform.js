const fs = require('fs');
let code = fs.readFileSync('scratch/post_opp_form.txt', 'utf8');

// Swap wrapping containers completely by searching and replacing structurally.
const oldProfileWrapper = '<div className="ln-profile-two-col">';

code = code.replace(/className="ln-info-label"/g, 'style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, display: \\'block\\', color: \\'#1e293b\\' }}');

let newLayout = code.replace(oldProfileWrapper + '\\n          <div className="ln-card" style={{ padding: 20 }}>', '<div className="ln-card" style={{ padding: 24, display: \\'grid\\', gridTemplateColumns: \\'minmax(0, 1fr) minmax(0, 1fr)\\', gap: 16 }}>\\n            <h3 style={{ fontSize: 16, fontWeight: 700, color: \\'#1e293b\\', gridColumn: \\'span 2\\', marginBottom: 16 }}>Create an Opportunity</h3>');

newLayout = newLayout.replace(/<div className="form-group">/g, '<div>');
newLayout = newLayout.replace(/<div>(?:\\s*)<label style={{[^}]+}}>Title \\*<\\/label>/g, '<div style={{ gridColumn: \\'span 2\\' }}>\\n              <label style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, display: \\'block\\', color: \\'#1e293b\\' }}>Job Title *</label>');
newLayout = newLayout.replace(/<div>(?:\\s*)<label style={{[^}]+}}>Description<\\/label>/g, '<div style={{ gridColumn: \\'span 2\\' }}>\\n              <label style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, display: \\'block\\', color: \\'#1e293b\\' }}>Description</label>');
newLayout = newLayout.replace(/<div>(?:\\s*)<label style={{[^}]+}}>Attachment \\(Image or Document\\)<\\/label>/g, '<div style={{ gridColumn: \\'span 2\\' }}>\\n              <label style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, display: \\'block\\', color: \\'#1e293b\\' }}>Attachment (Image or Document)</label>');
newLayout = newLayout.replace(/<div className="ln-info-grid"(?:[^>]+)>/g, '<div style={{ display: \\'contents\\' }}>');

// Convert the competencies column
newLayout = newLayout.replace(/<div className="ln-card" style={{ padding: 20 }}>\\n(?:\\s*)<h3 style={{ fontSize: 16, fontWeight: 600, color: 'rgba\\(0,0,0,0\.9\\)', marginBottom: 16 }}>Required Competencies<\\/h3>/, '<div style={{ gridColumn: \\'span 2\\', marginTop: 16, paddingTop: 16, borderTop: \\'1px solid #e2e8f0\\' }}>\\n            <h3 style={{ fontSize: 16, fontWeight: 700, color: \\'#1e293b\\', marginBottom: 16 }}>Required Competencies</h3>');

// Adjust button
newLayout = newLayout.replace(/<div style={{ marginTop: 20 }}>\\n(?:\\s*)<button type="submit"/, '<div style={{ gridColumn: \\'span 2\\', marginTop: 20, display: \\'flex\\', justifyContent: \\'flex-end\\' }}>\\n              <button type="submit"');
newLayout = newLayout.replace(/className="ln-btn ln-btn-primary"(?:[^<]+)<Send size={16} \\/>/, 'className="ln-btn-sm" style={{ background: \\'#0a66c2\\', color: \\'white\\', border: \\'none\\', padding: \\'10px 24px\\', fontSize: 14, borderRadius: 20, opacity: posting ? 0.7 : 1, cursor: posting ? \\'not-allowed\\' : \\'pointer\\' }}>\\n                <Send size={15} />');

fs.writeFileSync('scratch/out.txt', newLayout);
console.log('done parsing');
