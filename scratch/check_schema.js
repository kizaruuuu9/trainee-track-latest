import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Check students table columns
const { data: sample } = await supabase.from('students').select('*').limit(1);
if (sample && sample[0]) {
    console.log('\n=== STUDENTS TABLE COLUMNS ===');
    Object.keys(sample[0]).forEach(col => {
        console.log(`  ${col}: ${JSON.stringify(sample[0][col])?.substring(0, 100)}`);
    });
}

// Check applications table
const { data: appSample } = await supabase.from('applications').select('*').limit(1);
if (appSample && appSample[0]) {
    console.log('\n=== APPLICATIONS TABLE COLUMNS ===');
    Object.keys(appSample[0]).forEach(col => {
        console.log(`  ${col}: ${JSON.stringify(appSample[0][col])?.substring(0, 100)}`);
    });
}

// Check job_postings table
const { data: jobSample } = await supabase.from('job_postings').select('*').limit(1);
if (jobSample && jobSample[0]) {
    console.log('\n=== JOB_POSTINGS TABLE COLUMNS ===');
    Object.keys(jobSample[0]).forEach(col => {
        console.log(`  ${col}: ${JSON.stringify(jobSample[0][col])?.substring(0, 100)}`);
    });
}

// Check if there's an employment_records table
const { data: empSample, error: empErr } = await supabase.from('employment_records').select('*').limit(1);
console.log('\n=== EMPLOYMENT_RECORDS TABLE ===');
console.log(empErr ? `Not found or error: ${empErr.message}` : `Exists with ${empSample?.length} rows`);
if (empSample && empSample[0]) {
    Object.keys(empSample[0]).forEach(col => {
        console.log(`  ${col}: ${JSON.stringify(empSample[0][col])?.substring(0, 100)}`);
    });
}
