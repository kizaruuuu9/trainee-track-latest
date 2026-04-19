const fs = require('fs');
const file = 'C:\\Users\\admin\\Downloads\\Latest_Capstone\\trainee-track-latest\\src\\components\\dashboards\\PartnerDashboard.jsx';
let text = fs.readFileSync(file, 'utf8');

const regex = /<div style=\{\{\s*marginBottom:\s*16\s*\}\}\>\s*<label[^>]*>Announcement Type<\/label>[\s\S]*?<\/select>\s*<\/div>\s*<div style=\{\{\s*marginBottom:\s*16\s*\}\}\>/;

if(regex.test(text)) {
  text = text.replace(regex, '<div style={{ marginBottom: 16 }}>');
  // Also change the placeholders to be general announcements
  text = text.replace('placeholder="Title (e.g. Join our upcoming Job Fair!)"', 'placeholder="Title"');
  text = text.replace('placeholder="What do you want to announce?"', 'placeholder="What do you want to announce to the community?"');

  fs.writeFileSync(file, text, 'utf8');
  console.log('Drop-down removed');
} else {
  console.log('Could not match drop-down');
}
