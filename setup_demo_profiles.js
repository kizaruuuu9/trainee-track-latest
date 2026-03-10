import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const DEMO_ADMIN_ID = 'de305d54-75b4-431b-adb2-eb6b9e546014';
const DEMO_PARTNER_ID = 'de305d54-75b4-431b-adb2-eb6b9e546015';

async function setup() {
    try {
        // 1. Ensure Admin Profile
        await supabase.from('profiles').upsert({
            id: DEMO_ADMIN_ID,
            user_type: 'admin',
            email: 'admin@pstdi.edu.ph'
        });

        // 2. Ensure Partner Profile
        await supabase.from('profiles').upsert({
            id: DEMO_PARTNER_ID,
            user_type: 'industry_partner',
            email: 'contact@techsolutions.com'
        });

        // 3. Ensure Industry Partner Record
        await supabase.from('industry_partners').upsert({
            id: DEMO_PARTNER_ID,
            company_name: 'TechSolutions Inc.',
            contact_person: 'James Wilson',
            business_type: 'Software Development',
            verification_status: 'verified'
        });

        console.log('Demo profiles setup successfully.');
    } catch (err) {
        console.error(err);
    }
}

setup();
