import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

// Rate limiting (in-memory, per serverless instance)
if (!globalThis.loginRateLimit) globalThis.loginRateLimit = {};
const rateLimitStore = globalThis.loginRateLimit;
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 10;

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
        return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return res.status(500).json({ error: 'Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY not set' });
    }

    try {
        const supabaseAdmin = createClient(
            process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Find user by email
        const { data: user, error: queryError } = await supabaseAdmin
            .from('registrations')
            .select('*')
            .eq('email', email.trim().toLowerCase())
            .maybeSingle();

        if (queryError) {
            console.error('Login query error:', queryError);
            return res.status(500).json({ error: 'An error occurred. Please try again.' });
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Verify password
        if (!user.password_hash) {
            return res.status(401).json({ error: 'Account setup incomplete. Please contact support.' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Return user data (exclude sensitive fields)
        const { password_hash, ...safeUser } = user;

        res.json({ success: true, user: safeUser });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
}
