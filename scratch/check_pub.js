import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectPublications() {
  const { data, error } = await supabase.from('students').select('id').limit(1);
  if(error) {
    console.error(error);
    return;
  }
  
  // Actually, pg_publication_tables is a system table, postgrest might not serve it unless it's in the schema search path, or explicitly exposed.
  // Wait, I can try hitting it via RPC or directly.
  const { data: pubData, error: pubError } = await supabase.from('pg_publication_tables').select('*').limit(10).catch(e => ({error: e}));
  console.log("direct pg_publication query:");
  if (pubError) {
      console.log('Failed:', pubError.message || pubError);
  } else {
      console.log(pubData);
  }
}
inspectPublications();
