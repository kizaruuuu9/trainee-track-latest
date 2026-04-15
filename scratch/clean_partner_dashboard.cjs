const fs = require('fs');
const path = 'src/components/dashboards/PartnerDashboard.jsx';
const content = fs.readFileSync(path, 'utf8').split('\n');
const newContent = [
    ...content.slice(0, 3521),
    '// PREDEFINED_CULTURE_TAGS, PREDEFINED_PERKS_TAGS, and CompanyProfile moved to ProfileBase.jsx',
    ...content.slice(4709)
];
fs.writeFileSync(path, newContent.join('\n'));
console.log('Successfully updated PartnerDashboard.jsx');
