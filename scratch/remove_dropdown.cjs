const fs = require('fs');
const file = 'C:\\Users\\admin\\Downloads\\Latest_Capstone\\trainee-track-latest\\src\\components\\dashboards\\PartnerDashboard.jsx';
let text = fs.readFileSync(file, 'utf8');

const regex = /<div style=\{\{ marginBottom: 16 \}\}>\s*<label[^>]*>Announcement Type<\/label>\s*<select[^>]*>[\s\S]*?<\/select>\s*<\/div>\s*<div style=\{\{ marginBottom: 16 \}\}>/;

if(regex.test(text)) {
  text = text.replace(regex, '<div style={{ marginBottom: 16 }}>');
  fs.writeFileSync(file, text, 'utf8');
  console.log('Drop-down removed');
} else {
  console.log('Could not match drop-down');
}
