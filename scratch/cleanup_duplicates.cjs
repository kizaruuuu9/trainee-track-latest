const fs = require('fs');
const path = require('path');

const paths = [
    'src/components/dashboards/PartnerDashboard.jsx',
    'src/components/dashboards/TraineeDashboard.jsx'
];

paths.forEach(p => {
    if (!fs.existsSync(p)) {
        console.log(`Skipping missing file: ${p}`);
        return;
    }

    let c = fs.readFileSync(p, 'utf8');
    console.log(`Processing ${p}...`);

    // 1. Deduplicate FeedComponents imports
    const impRegex = /import \{[\s\S]*?\} from '\.\/FeedComponents';/g;
    const imports = [];
    let match;
    while ((match = impRegex.exec(c)) !== null) {
        imports.push({ start: match.index, end: impRegex.lastIndex });
    }
    if (imports.length > 1) {
        console.log(`  Found ${imports.length} duplicate imports in ${p}. Keeping first only.`);
        for (let i = imports.length - 1; i >= 1; i--) {
            c = c.slice(0, imports[i].start) + c.slice(imports[i].end);
        }
    }

    // 2. Deduplicate State Hooks (isLoadingMore, selectedFeedItem)
    // We target they often appear as a pair
    const hookRegex = /const \[isLoadingMore, setIsLoadingMore\] = useState\(false\);(\s*)const \[selectedFeedItem, setSelectedFeedItem\] = useState\(null\);/g;
    const hooks = [];
    while ((match = hookRegex.exec(c)) !== null) {
        hooks.push({ start: match.index, end: hookRegex.lastIndex });
    }
    if (hooks.length > 1) {
        console.log(`  Found ${hooks.length} duplicate state blocks in ${p}. Keeping first only.`);
        for (let i = hooks.length - 1; i >= 1; i--) {
            c = c.slice(0, hooks[i].start) + c.slice(hooks[i].end);
        }
    }

    // 3. Remove local helper duplicates if they are imported
    // isVerified, getLivePartner, timeAgo, StatusBadge, resolvePartnerVisibility
    const importedFunctions = ['isVerified', 'getLivePartner', 'timeAgo', 'StatusBadge', 'resolvePartnerVisibility'];
    importedFunctions.forEach(fn => {
        // Only remove if it exists in the import block
        if (c.includes(`${fn},`) || c.includes(`{ ${fn}`)) {
            console.log(`  Checking for local duplicate of ${fn}...`);
            const localDefRegex = new RegExp(`const ${fn} = \\([\\s\\S]*?\\) => \\{[\\s\\S]*?\\};`, 'g');
            // Special case for StatusBadge which might be small
            const statusBadgeRegex = /const StatusBadge = \(\{ status \}\) => \{[\s\S]*?\};/g;
            
            if (fn === 'StatusBadge') {
                c = c.replace(statusBadgeRegex, '');
            } else {
                c = c.replace(localDefRegex, '');
            }
        }
    });

    // 4. Specifically remove the trice-duplicated declarations in TraineeDashboard if found separately
    c = c.replace(/const \[isLoadingMore, setIsLoadingMore\] = useState\(false\);\s*const \[selectedFeedItem, setSelectedFeedItem\] = useState\(null\);/g, (match, offset, string) => {
        return string.indexOf(match) === offset ? match : '';
    });

    // Clean up extra newlines created by removals
    c = c.replace(/\n\s*\n\s*\n/g, '\n\n');

    fs.writeFileSync(p, c.replace(/\r\n/g, '\n'), 'utf8');
    console.log(`  Successfully cleaned ${p}`);
});
