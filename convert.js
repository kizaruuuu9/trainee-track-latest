const fs = require('fs');
const content = fs.readFileSync('old_trainee.jsx', 'utf16le');
fs.writeFileSync('temp.txt', content, 'utf8');
