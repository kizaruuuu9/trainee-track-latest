const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'context', 'AppContext.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Use powerful regex to find block start -> next block start
const addJobPostingStart = content.indexOf('  const addJobPosting = async');
const deleteJobPostingEnd = content.indexOf('  const getJobPostingComments = async');

if (addJobPostingStart !== -1 && deleteJobPostingEnd !== -1) {
    content = content.substring(0, addJobPostingStart) + content.substring(deleteJobPostingEnd);
    console.log('Removed job posting functions block.');
}

const fetchJobPostingsStart = content.indexOf('  const fetchJobPostings = async');
const deletePostStart = content.indexOf('  const fetchJobPostings = async') !== -1 ? content.indexOf('  const fetchPosts = async') : -1;
// Wait, `fetchPosts` might be before or after.
// Let's just remove the fetchJobPostings explicitly using exact string matches.
const fetchJobStr = `  const fetchJobPostings = async (limitOverride = null) => {
    try {
      const { data: jobs, error } = await supabase
        .from('job_postings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limitOverride || 50);

      if (error) {
        if (error.code === '42P01') {
          console.warn('job_postings table not found in Supabase. Run migrations.');
          return;
        }
        throw error;
      }

      if (jobs) {
        // jobPostings state removed
          ...j,
          partnerId: j.partner_id || j.partnerId,
          opportunityType: j.opportunity_type || j.opportunityType,
          programId: j.program_id || j.programId,
          ncLevel: j.nc_level || j.ncLevel,
          employmentType: j.employment_type || j.employmentType,
          requiredCompetencies: Array.isArray(j.required_competencies) ? j.required_competencies : JSON.parse(j.required_competencies || '[]'),
          requiredSkills: Array.isArray(j.required_skills) ? j.required_skills : JSON.parse(j.required_skills || '[]'),
          salaryRange: j.salary_range || j.salaryRange,
          salaryMin: j.salary_min || j.salaryMin,
          salaryMax: j.salary_max || j.salaryMax,
          attachmentName: j.attachment_name || j.attachmentName,
          attachmentType: j.attachment_type || j.attachmentType,
          attachmentUrl: j.attachment_url || j.attachmentUrl,
          datePosted: j.created_at ? new Date(j.created_at).toISOString().split('T')[0] : (j.datePosted || new Date().toISOString().split('T')[0]),
          createdAt: j.created_at || j.createdAt || new Date().toISOString()
        })));
      }
    } catch (err) {
      console.error('Error fetching opportunity feeds:', err);
    }
  };`;

content = content.replace(/const fetchJobPostings = async[\s\S]*?console\.error\('Error fetching opportunity feeds:', err\);\n    \}\n  \};\n/g, '');

// Also remove `setJobPostings` calls inside fetchAllData
content = content.replace(/setJobPostings\(jobs\.map[\s\S]*?\}\)\)\);/g, '');

// Remove partner job logic inside deleteAccount
content = content.replace(/const partnerJobIds = new Set\(.*?\n/g, '');
content = content.replace(/setJobPostings\(prev => prev\.filter.*?accountId\)\);\n/g, '');
content = content.replace(/setJobPostingComments\(prev => prev\.filter\(c => c\.author_id !== accountId && !partnerJobIds\.has\(c\.job_posting_id\)\)\);/g, 'setJobPostingComments(prev => prev.filter(c => c.author_id !== accountId));');
content = content.replace(/setApplications\(prev => prev\.filter\(a => !partnerJobIds\.has\(a\.jobId\)\)\);/g, 'setApplications(prev => prev.filter(a => a.traineeId !== accountId));');

// Fix getSkillsDemand
content = content.replace(/jobPostings\.filter/g, "posts.filter(p => p.post_type === 'hiring_update')");

// Strip '... newJob' leftover error from previous script
content = content.replace(/setJobPostings\(\[\.\.\. newJob\]\);/g, '');

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Cleaned up AppContext additional logic.');