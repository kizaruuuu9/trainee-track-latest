import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    try {
        // Fetch one student
        const { data: trainee } = await supabase.from('students').select('id').limit(1).maybeSingle();
        // Fetch one partner
        const { data: partner } = await supabase.from('industry_partners').select('id').limit(1).maybeSingle();
        // Fetch any profile
        const { data: profile } = await supabase.from('profiles').select('id, user_type').limit(1).maybeSingle();

        console.log('TRAINEE_ID:', trainee?.id);
        console.log('PARTNER_ID:', partner?.id);
        console.log('PROFILE_ID:', profile?.id, 'TYPE:', profile?.user_type);
    } catch (err) {
        console.error(err);
    }
}

check();
