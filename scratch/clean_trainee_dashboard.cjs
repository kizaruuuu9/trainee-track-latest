const fs = require('fs');
const path = 'src/components/dashboards/TraineeDashboard.jsx';
const content = fs.readFileSync(path, 'utf8').split('\n');
const newContent = [
    ...content.slice(0, 2320),
    '// TraineeProfileContent moved to ProfileBase.jsx',
    ...content.slice(4171)
];
fs.writeFileSync(path, newContent.join('\n'));
console.log('Successfully updated TraineeDashboard.jsx');
