const fs = require('fs');
const path = require('path');

const targetDir = 'c:\\Users\\admin\\Downloads\\Latest_Capstone\\trainee-track-latest\\src\\components\\dashboards';

const replacements = [
    // Replace the replacement character (diamond question mark)
    { pattern: /\ufffd/g, replacement: '—' },
    { pattern: /\u00EF\u00BF\u00BD/g, replacement: '—' }, // UTF-8 bytes for 
    
    // Currency fixes for PartnerDashboard specifically
    { pattern: /label: 'PHP \(\?\)'/g, replacement: "label: 'PHP (\u20B1)'" },
    { pattern: /PHP: '\?'/g, replacement: "PHP: '\u20B1'" },
    
    // Fix separators
    { pattern: / \.join\('  '\)/g, replacement: " .join(' | ')" },
    { pattern: / \.join\('  '\)/g, replacement: " .join(' | ')" },
    
    // Common non-ASCII separators
    { pattern: / · /g, replacement: ' | ' },
    { pattern: / • /g, replacement: ' | ' },
    { pattern: / – /g, replacement: ' - ' },
    { pattern: / — /g, replacement: ' - ' },
    
    // Triple dots
    { pattern: /···/g, replacement: '...' },
    { pattern: /…/g, replacement: '...' }
];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    replacements.forEach(({ pattern, replacement }) => {
        if (pattern.test(content)) {
            content = content.replace(pattern, replacement);
            changed = true;
        }
    });
    
    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (file.endsWith('.jsx')) {
            processFile(fullPath);
        }
    });
}

walkDir(targetDir);
console.log('Encoding fix script completed.');
