import fs from 'fs';
const data = JSON.parse(fs.readFileSync('eslint-report.json'));
data.forEach(file => {
  file.messages.forEach(msg => {
    if (msg.ruleId === 'no-undef') {
      console.log(`${file.filePath}:${msg.line}:${msg.column} - ${msg.message}`);
    }
  });
});
