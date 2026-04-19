import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: appSample } = await supabase.from('applications').select('*').limit(1);
if (appSample && appSample[0]) {
    console.log('\n=== APPLICATIONS TABLE COLUMNS ===');
    Object.keys(appSample[0]).forEach(col => {
        console.log(`  ${col}: ${JSON.stringify(appSample[0][col])?.substring(0, 100)}`);
    });
} else {
    console.log('No applications found or table error');
}

// Check if hired status exists in app
const { data: hiredApps } = await supabase.from('applications').select('id, status, trainee_id, job_posting_id').eq('status', 'Hired').limit(5);
console.log('\n=== HIRED APPLICATIONS ===');
console.log(JSON.stringify(hiredApps, null, 2));

// Also check the hireApplicant logic in context
const { data: allStatuses } = await supabase.from('applications').select('status').limit(100);
const statuses = [...new Set(allStatuses?.map(a => a.status))];
console.log('\n=== DISTINCT APPLICATION STATUSES ===', statuses);
