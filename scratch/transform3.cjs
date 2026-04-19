const fs = require('fs');

let src = fs.readFileSync('scratch/post_opp_form.txt', 'utf8');

src = src.replace(/<div className="ln-profile-two-col">\s*<div className="ln-card" style={{ padding: 20 }}>\s*<h3 style={{ fontSize: 16, fontWeight: 600, color: 'rgba\\(0,0,0,0\\.9\\)', marginBottom: 16 }}>Opportunity Details<\/h3>/,
  `<div className="ln-profile-one-col">
          <div className="ln-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>Opportunity Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12 }}`
);

// We need to keep grid open when we reach competencies.
// So we just replace the card divider.
src = src.replace(/<\/div>\s*<div className="ln-card" style={{ padding: 20 }}>\s*<h3 style={{ fontSize: 16, fontWeight: 600, color: 'rgba\\(0,0,0,0\\.9\\)', marginBottom: 16 }}>Required Competencies<\/h3>/,
  `
          <div style={{ gridColumn: 'span 2', marginTop: 16, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>Required Competencies</h3>`
);

// Form groups -> plain div
src = src.replace(/<div className="form-group">/g, '<div>');

// Fix text styling of inputs
src = src.replace(/className="ln-info-label"/g, 'style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, display: `block`, color: `#1e293b` }}');
src = src.replace(/className="(form-input|form-select)"/g, 'className="$1" style={{ fontSize: 14, borderRadius: 10, padding: `10px 14px` }}');

// Span 2 columns for wider inputs
src = src.replace(/<div>\s*<label style={{[^}]+}}>Title \*/, '<div style={{ gridColumn: `span 2` }}>\n              <label style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, display: `block`, color: `#1e293b` }}>Job Title *');
src = src.replace(/<div>\s*<label style={{[^}]+}}>Description/, '<div style={{ gridColumn: `span 2` }}>\n              <label style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, display: `block`, color: `#1e293b` }}>Description');
src = src.replace(/<div>\s*<label style={{[^}]+}}>Attachment \(Image or Document\)/, '<div style={{ gridColumn: `span 2` }}>\n              <label style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, display: `block`, color: `#1e293b` }}>Attachment (Image or Document)');

src = src.replace(/<div className="ln-info-grid"[^>]+>/g, '<div style={{ display: `contents` }}>');

// Button
src = src.replace(/<button type="submit" className="ln-btn ln-btn-primary" disabled={posting} style={{ width: '100%', padding: '10px 20px', fontSize: 14, opacity: posting \? 0\.75 : 1, cursor: posting \? 'not-allowed' : 'pointer' }}>/,
  `<button type="submit" className="ln-btn-sm" disabled={posting} style={{ background: '#0a66c2', color: 'white', border: 'none', padding: '10px 24px', fontSize: 14, borderRadius: 20, opacity: posting ? 0.7 : 1, cursor: posting ? 'not-allowed' : 'pointer' }}>`
);

src = src.replace(/<div style={{ marginTop: 20 }}>/, `<div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', width: '100%' }}>`);

// Since we opened a grid, we must close it at the very end of the single card block!
// The entire original block ended with:
//         </div> (closes second card)
//       </div> (closes ln-profile-two-col)
// Now we have:
//      <div display:grid>
//        ...
//          <div span 2>
//            ... competencies
//          </div> (this one was closed properly because we just replaced the wrapper)
//
// BUT wait, is there an extra </div> we need to add to close the GRID?
// Let's add it before we close the final card.

src = src.replace(/<\/form>/, `</div>\n        </form>`); // add an extra </div> to close the grid we opened!

fs.writeFileSync('scratch/out3.txt', src);
console.log('done regex');
