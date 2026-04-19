import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkRealtime() {
  // Let's create an entry in students to trigger realtime and see if it is enabled.
  // Actually, easiest way is to push a SQL command if we have pg credentials, but we only have supabase service role key.
  // Instead of querying internal pg_ tables via postgrest which might fail due to RLS, let's just make a script that listens for a change and applies a change!
  console.log('Listening via realtime...');
  
  let receivedChange = false;
  
  const channel = supabase.channel('test-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, (payload) => {
      console.log('RECEIVED CHANGE payload:', payload);
      receivedChange = true;
    })
    .subscribe(async (status) => {
      console.log('Subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('Triggering a change...');
        
        // Find a student
        const { data: students, error: err } = await supabase.from('students').select('id, activity_status').limit(1);
        if (students && students.length > 0) {
          const sid = students[0].id;
          const newStatus = students[0].activity_status === 'Online' ? 'Offline' : 'Online';
          console.log(`Updating student ${sid} to ${newStatus}`);
          await supabase.from('students').update({ activity_status: newStatus, last_seen_at: new Date().toISOString() }).eq('id', sid);
          
          setTimeout(() => {
            if (!receivedChange) {
              console.log('=============================================');
              console.log('NO EVENT RECEIVED - REALTIME IS LIKELY DISABLED FOR "students" TABLE');
              console.log('=============================================');
            }
            process.exit(0);
          }, 4000);
        } else {
            console.log('No student found', err);
            process.exit(1);
        }
      }
    });
}

checkRealtime();
