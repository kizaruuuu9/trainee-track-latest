const fs = require('fs');
const path = 'src/components/dashboards/TraineeDashboard.jsx';
let content = fs.readFileSync(path, 'utf8').split('\n');

// 0-indexed 983 is line 984
content[983] = content[983].replace('return (', 'return (<>');

// find the ); just before class ErrorBoundary
for (let i = 1820; i < 1840; i++) {
    if (content[i] && content[i].includes(');')) {
        content[i] = content[i].replace(');', '</>);');
        break;
    }
}

fs.writeFileSync(path, content.join('\n'), 'utf8');
console.log('Fixed TraineeDashboard.jsx');
