import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { field, value } = req.body;

    if (!field || !value) {
        return res.status(400).json({ error: 'field and value are required' });
    }

    // Only allow checking these two fields
    const allowedFields = ['student_id', 'email'];
    if (!allowedFields.includes(field)) {
        return res.status(400).json({ error: 'Invalid field. Allowed: student_id, email' });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return res.status(500).json({ error: 'Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY not set' });
    }

    try {
        const supabaseAdmin = createClient(
            process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { data: existing, error } = await supabaseAdmin
            .from('registrations')
            .select('id')
            .eq(field, value.trim())
            .maybeSingle();

        if (error) {
            console.error('Duplicate check DB error:', error);
            return res.status(500).json({ error: 'Database error' });
        }

        return res.json({ exists: !!existing });
    } catch (err) {
        console.error('Duplicate check error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
