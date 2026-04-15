const fs = require('fs');
const lines = fs.readFileSync('src/components/dashboards/PartnerDashboard.jsx', 'utf8').split('\n');

// 1394 is index 1393. 1511 is index 1510.
// We want to keep up to 1393 (exclusive) and from 1511 (inclusive).
// wait, line 1393 is `              );`
// line 1512 is `            } else if (item.feedType === 'job') {`
// So we want to keep index 0 to 1392.
// And then we want to keep from index 1511 onwards.

// Splice out index 1393 to 1510 (which is length 1511 - 1393 = 118 lines).
lines.splice(1393, 118);

fs.writeFileSync('src/components/dashboards/PartnerDashboard.jsx', lines.join('\n'));
console.log("Lines spliced out.");
