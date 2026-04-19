const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'src', 'components', 'dashboards', 'AdminDashboard.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Swap jobPostings -> posts in destructurings
content = content.replace(/,\s*jobPostings\s*,/g, ', posts, ');
content = content.replace(/\{(\s*)trainees,\s*partners,\s*jobPostings(.*)\}/g, '{$1trainees, partners, posts$2}');
content = content.replace(/\{(\s*)trainees,\s*jobPostings,\s*partners(.*)\}/g, '{$1trainees, posts, partners$2}');

// For the specific one with updateJobPosting
content = content.replace(
    /const \{\s*jobPostings,\s*updateJobPosting,\s*deleteJobPosting\s*\}\s*=\s*useApp\(\);/g,
    'const { posts, updatePost, deletePost, adminDeletePost, adminUpdatePost } = useApp();'
);

// 2. Fix variable usage
content = content.replace(/jobPostings\.forEach\(/g, "posts.filter(p => p.post_type === 'hiring_update').forEach(");
content = content.replace(/const job = jobPostings\.find\(j => j\.id === app\.jobId\);/g, "const job = posts.find(p => p.post_type === 'hiring_update' && String(p.id) === String(app.jobId));");
content = content.replace(/jobPostings\.filter\(j => j\.status === 'Open'\)\.length/g, "posts.filter(p => p.post_type === 'hiring_update' && p.status === 'Open').length");

// In Opportunities view
content = content.replace(/const filtered = jobPostings\.filter\(j => \{/g, "const hiringUpdates = posts.filter(p => p.post_type === 'hiring_update');\n    const filtered = hiringUpdates.filter(j => {");
content = content.replace(/\{s\} \(\{s === 'All' \? jobPostings\.length : jobPostings\.filter\(j => j\.status === s\)\.length\}\)/g, "{s} ({s === 'All' ? hiringUpdates.length : hiringUpdates.filter(j => j.status === s).length})");

// Fix updateJobPosting calls to use adminUpdatePost
content = content.replace(/updateJobPosting\((.*?),\s*\{(.*?)\}\)/g, "adminUpdatePost($1, {$2})");
// Fix deleteJobPosting calls to use adminDeletePost
content = content.replace(/deleteJobPosting\((.*?)\)/g, "adminDeletePost($1)");

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Cleaned AdminDashboard.jsx');