const fs = require('fs');

const files = [
    'c:\\Users\\admin\\Downloads\\Latest_Capstone\\trainee-track-latest\\src\\components\\dashboards\\TraineeDashboard.jsx',
    'c:\\Users\\admin\\Downloads\\Latest_Capstone\\trainee-track-latest\\src\\components\\dashboards\\PartnerDashboard.jsx'
];

files.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix calendar separator in TraineeDashboard
    // Search for the specific pattern around weekDates
    content = content.replace(/weekDates\[0\].toLocaleDateString\('en-US', \{ month: 'short', day: 'numeric' \}\) \S+ weekDates\[6\]/g, (match) => {
        return match.replace(/\S+/, '-');
    });

    // Final sweep for any character that is NOT ASCII and NOT part of our allowed set
    // This is aggressive but ensures no more broken symbols
    // Only replace characters known to be breaking in these dashboards
    content = content.replace(/\ufffd/g, '-');

    fs.writeFileSync(filePath, content, 'utf8');
});
console.log('Final surgical fix completed.');
