import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

    const { traineeId, updates } = req.body;

    if (!traineeId || !updates) {
        return res.status(400).json({ error: 'Trainee ID and updates are required.' });
    }

    try {
        const supabaseAdmin = createClient(
            process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Map frontend field names to database column names
        const dbUpdates = {};
        if (updates.name !== undefined) dbUpdates.full_name = updates.name;
        if (updates.email !== undefined) dbUpdates.email = updates.email;
        if (updates.address !== undefined) dbUpdates.address = updates.address;
        if (updates.birthday !== undefined) dbUpdates.birthdate = updates.birthday;
        if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
        // Employment fields
        if (updates.employmentStatus !== undefined) {
            dbUpdates.is_employed = updates.employmentStatus === 'Employed' || updates.employmentStatus === 'Self-Employed' || updates.employmentStatus === 'Underemployed' ? 'yes' : 'no';
            dbUpdates.employment_work = updates.employer || updates.jobTitle || null;
        }
        if (updates.employer !== undefined) dbUpdates.employment_work = updates.employer;
        if (updates.dateHired !== undefined) dbUpdates.employment_start = updates.dateHired;
        // JSONB fields
        if (updates.skills !== undefined) dbUpdates.skills = updates.skills;
        if (updates.interests !== undefined) dbUpdates.interests = updates.interests;
        if (updates.certifications !== undefined) dbUpdates.licenses = updates.certifications;
        if (updates.educHistory !== undefined) dbUpdates.educ_history = updates.educHistory;
        if (updates.workExperience !== undefined) dbUpdates.work_experience = updates.workExperience;
        if (updates.licenses !== undefined) dbUpdates.licenses = updates.licenses;
        if (updates.traineeStatus !== undefined) dbUpdates.trainee_status = updates.traineeStatus;

        if (Object.keys(dbUpdates).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update.' });
        }

        const { data, error } = await supabaseAdmin
            .from('registrations')
            .update(dbUpdates)
            .eq('id', traineeId)
            .select();

        if (error) {
            console.error('Profile update error:', error);
            return res.status(400).json({ error: error.message });
        }

        console.log(`✅ Profile updated for user: ${traineeId}`);
        res.json({ success: true, user: data?.[0] });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: 'Failed to update profile.' });
    }
}
