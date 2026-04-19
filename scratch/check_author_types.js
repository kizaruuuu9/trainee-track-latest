import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data, error } = await supabase
  .from('posts')
  .select('id, title, post_type, author_type, author_id, is_active')
  .eq('is_active', true)
  .order('created_at', { ascending: false })
  .limit(30);

if (error) { console.error('Error:', error); process.exit(1); }

console.log('\n=== ALL ACTIVE POSTS ===');
data.forEach(p => {
  console.log(`[${p.post_type}] author_type="${p.author_type}" | title="${p.title}" | id=${p.id}`);
});

const types = [...new Set(data.map(p => p.author_type))];
console.log('\n=== DISTINCT author_type values ===', types);
