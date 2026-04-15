
const fs = require('fs');
const files = ['src/components/dashboards/TraineeDashboard.jsx', 'src/components/dashboards/PartnerDashboard.jsx'];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/const formatTabLabel = \\(type\\) => \\{[\\s\\S]*?return type\\.charAt\\(0\\)\\.toUpperCase\\(\\) \\+ type\\.slice\\(1\\);\\s*\\};/g, 
  \const formatTabLabel = (type) => {
                                if (type === 'all') return 'All Posts';
                                if (type === 'job') return '💼 Opportunities';
                                if (type === 'general') return '📝 Public';
                                if (type === 'achievement') return '🏆 Achievement';
                                if (type === 'certification') return '📣 Certification';
                                if (type === 'project') return '🚀 Project';
                                if (type === 'hiring_update') return '💼 Hiring Updates';
                                if (type === 'training_batch') return '🎓 Training Batches';
                                if (type === 'exam_schedule') return '📅 Exam Schedules';
                                if (type === 'certification_assessment') return '📋 Assessments';
                                if (type === 'announcement') return '📢 Announcements';
                                return type.charAt(0).toUpperCase() + type.slice(1);
                            };\);
  fs.writeFileSync(f, content, 'utf8');
});
console.log('Done!');
