const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.jsx', 'utf8');
let target = \    const hiringUpdates = posts.filter(p => p.post_type === 'hiring_update');
    const ranked = hiringUpdates
      .filter(j => j.status === 'Open')
      .map(job => {
        const mappedJob = {
          ...job,
          ...(job.details || {}),
          partnerId: job.author_id,
          companyName: partners.find(p => p.id === job.author_id)?.companyName || job.details?.companyName || 'Company'
        };
        const rec = computeRecommendationForJob(trainee, mappedJob);\;
let replacement = \    const hiringUpdates = posts.filter(p => p.post_type === 'hiring_update');
    const ranked = hiringUpdates
      .filter(j => j.status === 'Open')
      .map(job => {
        let tJobDetails = job.details || {};
        if (typeof tJobDetails === 'string') {
          try { tJobDetails = JSON.parse(tJobDetails); } catch(e) {}
        }
        const partnerIdStr = String(job.author_id);
        const foundPartner = partners.find(p => String(p.id) === partnerIdStr);
        const mappedJob = {
          ...job,
          ...tJobDetails,
          partnerId: job.author_id,
          title: tJobDetails?.title || job.title || 'Untitled',
          companyName: foundPartner?.companyName || tJobDetails?.companyName || tJobDetails?.company_name || job?.companyName || 'Company',
          location: tJobDetails?.location || job.location || 'Not Specified',
          employmentType: tJobDetails?.employmentType || tJobDetails?.employment_type || job.employmentType || 'Not Specified',
          requiredCompetencies: tJobDetails?.requiredCompetencies || job.requiredCompetencies || [],
          requiredSkills: tJobDetails?.requiredSkills || job.requiredSkills || []
        };
        const rec = computeRecommendationForJob(trainee, mappedJob);\;
if (code.includes(target)) {
  fs.writeFileSync('src/context/AppContext.jsx', code.replace(target, replacement));
  console.log('Replaced.');
} else {
  console.log('Target not found!');
}

