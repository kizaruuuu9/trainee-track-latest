const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'src', 'context', 'AppContext.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Remove state declaration
content = content.replace(
  /const \[jobPostings, setJobPostings\] = useState\(\[\]\);/g,
  '// jobPostings state removed'
);

// 2. Refactor getTraineeRecommendedJobs to use posts instead of jobPostings
content = content.replace(
  /const job = jobPostings\.find\(j => j.id === jobId\);/g,
  "const job = posts.find(j => j.id === jobId && j.post_type === 'hiring_update');"
);

content = content.replace(
  /const ranked = jobPostings/g,
  "const hiringUpdates = posts.filter(p => p.post_type === 'hiring_update');\n    const ranked = hiringUpdates"
);

content = content.replace(
  /const openJobs = jobPostings\.filter\(job => normalizeLooseText\(job\?\.status \|\| ''\) === 'open'\);/g,
  "const openJobs = posts.filter(job => job.post_type === 'hiring_update' && normalizeLooseText(job?.status || '') === 'open');"
);

content = content.replace(
  /const job = jobPostings\.find\(record => String\(record\.id\) === String\(app\.jobId\)\);/g,
  "const job = posts.find(record => record.post_type === 'hiring_update' && String(record.id) === String(app.jobId));"
);

content = content.replace(
  /const partnerJobs = jobPostings\.filter\(j => String\(j\.partnerId\) === String\(partnerId\)\);/g,
  "const partnerJobs = posts.filter(j => j.post_type === 'hiring_update' && String(j.author_id) === String(partnerId));"
);

content = content.replace(
  /const job = jobPostings\.find\(j => String\(j\.id\) === String\(jobId\)\);/g,
  "const job = posts.find(j => j.post_type === 'hiring_update' && String(j.id) === String(jobId));"
);

content = content.replace(
  /const job = jobPostings\.find\(j => String\(j\.id\) === String\(a\.jobId\)\);/g,
  "const job = posts.find(j => j.post_type === 'hiring_update' && String(j.id) === String(a.jobId));"
);

// 3. Remove addJobPosting, updatePartnerJobPosting, deleteJobPosting
// We'll replace the block from "const addJobPosting =" down to "const deleteJobPosting = "
const funcRegex = /\/\/ ─── JOB \/ OPPORTUNITY FUNCTIONS ───[\s\S]*?(?=\/\/ ─── BOOKING)/;
content = content.replace(funcRegex, '// ─── JOB / OPPORTUNITY FUNCTIONS REMOVED ───\n  ');

// 4. Remove fetchJobPostings from useEffect loadMoreFeeds wrapper
content = content.replace(
  /await Promise\.all\(\[fetchPosts\(newLimit\), fetchJobPostings\(newLimit\)\]\);/g,
  'await fetchPosts(newLimit);'
);

// 5. Remove fetchJobPostings definition entirely
const fetchJobRegex = /const fetchJobPostings = async[\s\S]*?\} catch \(err\) \{[\s\S]*?\}\n  \};\n/g;
content = content.replace(fetchJobRegex, '');

// Also remove generic update / delete references if any
content = content.replace(/const existing = jobPostings\.find\(j => j.id === jobId\);/g, '');

// 6. Fix provider exports
content = content.replace(/jobPostings,/g, '');
content = content.replace(/addJobPosting,/g, '');
content = content.replace(/updatePartnerJobPosting,/g, '');
content = content.replace(/deleteJobPosting,/g, '');
content = content.replace(/fetchJobPostings,/g, '');

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Cleaned AppContext.jsx of jobPostings!');