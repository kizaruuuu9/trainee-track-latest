const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'context', 'AppContext.jsx');
let code = fs.readFileSync(file, 'utf8');

// 1. Remove fetchJobPostings (starts at 478, ends right before `const addPostComment`)
const addPostCommentIdx = code.indexOf('  const addPostComment = async');
const fetchJobPostingsIdx = code.indexOf('  const fetchJobPostings = async');
if (fetchJobPostingsIdx !== -1 && addPostCommentIdx !== -1) {
    code = code.substring(0, fetchJobPostingsIdx) + code.substring(addPostCommentIdx);
    console.log('Removed fetchJobPostings');
}

// 2. Remove addJobPosting, updatePartnerJobPosting, deleteJobPosting
// They start at '  const addJobPosting = async' and end right before '  const approvePartner'
const addJobPostingIdx = code.indexOf('  const addJobPosting = async');
const approvePartnerIdx = code.indexOf('  const approvePartner = async');
if (addJobPostingIdx !== -1 && approvePartnerIdx !== -1) {
    // Let's find the "// ─── PARTNER FUNCTIONS" comment before approvePartner to be safe
    const partnerFuncsCommentIdx = code.lastIndexOf('  // ', approvePartnerIdx);
    if (partnerFuncsCommentIdx > addJobPostingIdx) {
        code = code.substring(0, addJobPostingIdx) + code.substring(partnerFuncsCommentIdx);
        console.log('Removed addJobPosting, updatePartnerJobPosting, deleteJobPosting');
    }
}

// 3. Remove the last remaining references
// `setJobPostings(prev => prev.filter(j => j.partnerId !== accountId && j.partner_id !== accountId));` in deleteAccount
// Actually just replace all remaining `setJobPostings` and `jobPostings` calls!
code = code.replace(/setJobPostings\([\s\S]*?\);?/g, '');
code = code.replace(/const job = jobPostings\.find[\s\S]*?;/g, "const job = posts.find(p => p.post_type === 'hiring_update' && p.id === jobId);");

fs.writeFileSync(file, code, 'utf8');
console.log('Done');