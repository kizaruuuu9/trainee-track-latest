const fs = require('fs');
const text = fs.readFileSync('src/components/dashboards/PartnerDashboard.jsx', 'utf8');
const p1 = '<h1 className="ln-page-title">{isEditMode ? ';
const p2 = "'Edit Opportunity' : 'Post Opportunities'}</h1>";
const searchStr = p1 + p2;
const idx = text.indexOf(searchStr);
if (idx !== -1) {
    const endIdx = text.indexOf('</form>', idx) + 7;
    fs.writeFileSync('scratch/post_opp_form.txt', text.substring(idx - 100, endIdx));
    console.log('done');
} else {
    console.log('not found');
}