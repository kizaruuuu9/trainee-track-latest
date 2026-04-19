import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, anonKey);

async function checkRLS() {
  const { data: adminTokenData, error: adminTokenErr } = await supabase.auth.signInWithPassword({
    email: 'tracktrainee@gmail.com',
    password: 'Traineetrack4097!'
  });

  if (adminTokenErr) {
      console.log('Login failed', adminTokenErr);
      return;
  }
  
  console.log("Logged in as Admin. Testing RLS on students table...");
  const { data: testData, error: testErr } = await supabase.from('students').select('*').limit(10);
  
  if (testErr) {
      console.log("Admin RLS Error:", testErr.message);
  } else {
      console.log(`Admin can see ${testData.length} records in students table.`);
  }

}

checkRLS();
