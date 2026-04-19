const fs = require('fs');
const file = 'C:\\Users\\admin\\Downloads\\Latest_Capstone\\trainee-track-latest\\src\\components\\dashboards\\PartnerDashboard.jsx';
let text = fs.readFileSync(file, 'utf8');

const s1 = text.indexOf('Announcement Type</label>');
if(s1 === -1) { console.log('not found label'); process.exit(1); }

// Find the beginning of the wrapper div
let divStart = text.lastIndexOf('<div style={{ marginBottom: 16 }}>', s1);

// Find the end of the select tag
let selectEnd = text.indexOf('</select>', s1);

// Find the end of the wrapper div after the select map
let divEnd = text.indexOf('</div>', selectEnd) + 6;

const toRemove = text.substring(divStart, divEnd);
text = text.replace(toRemove, '');
text = text.replace('{(postType === \'announcement\' || postExpiryEnabled) && (', '{(true) && (');
text = text.replace("const [postType, setPostType] = useState('announcement');", "const [postType, setPostType] = useState('general');");

fs.writeFileSync(file, text, 'utf8');
console.log('Drop-down removed exactly!');
