import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

// Rate limiting (in-memory, per serverless instance)
if (!globalThis.registerRateLimit) globalThis.registerRateLimit = {};
const rateLimitStore = globalThis.registerRateLimit;
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 5;

function checkRateLimit(ip) {
    const now = Date.now();
    if (!rateLimitStore[ip] || now > rateLimitStore[ip].resetAt) {
        rateLimitStore[ip] = { count: 1, resetAt: now + RATE_LIMIT_WINDOW };
        return true;
    }
    rateLimitStore[ip].count++;
    return rateLimitStore[ip].count <= RATE_LIMIT_MAX;
}

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Rate limit
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    if (!checkRateLimit(ip)) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    const { registrationData, password } = req.body;

    if (!registrationData || !password) {
        return res.status(400).json({ error: 'Registration data and password are required' });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return res.status(500).json({ error: 'Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY not set' });
    }

    try {
        const supabaseAdmin = createClient(
            process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Check for duplicate email
        const { data: existingEmail } = await supabaseAdmin
            .from('registrations')
            .select('id')
            .eq('email', registrationData.email)
            .maybeSingle();

        if (existingEmail) {
            return res.status(409).json({ error: 'This email is already registered.' });
        }

        // Check for duplicate student ID
        const { data: existingId } = await supabaseAdmin
            .from('registrations')
            .select('id')
            .eq('student_id', registrationData.student_id)
            .maybeSingle();

        if (existingId) {
            return res.status(409).json({ error: 'This Student ID is already registered.' });
        }

        // Hash password (10 salt rounds)
        const passwordHash = await bcrypt.hash(password, 10);

        const { data, error } = await supabaseAdmin
            .from('registrations')
            .insert({
                ...registrationData,
                password_hash: passwordHash,
                status: 'pending',
            })
            .select();

        if (error) {
            console.error('Registration DB error:', error);
            return res.status(400).json({ error: error.message });
        }

        const safeData = data?.[0] ? {
            id: data[0].id,
            full_name: data[0].full_name,
            email: data[0].email,
            status: data[0].status,
            created_at: data[0].created_at,
        } : null;

        res.json({ success: true, registration: safeData });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Failed to register. Please try again.' });
    }
}
