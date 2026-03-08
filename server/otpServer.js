import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', '.env.local');

console.log('Looking for .env.local at:', envPath);
console.log('File exists?', fs.existsSync(envPath));

dotenv.config({ path: envPath });

// Also load .env for Supabase vars
dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('Loaded credentials:');
console.log('GMAIL_USER:', process.env.GMAIL_USER);
console.log('GMAIL_PASS:', process.env.GMAIL_PASS ? '[HIDDEN]' : 'NOT SET');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '[SET]' : 'NOT SET');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '[HIDDEN]' : 'NOT SET');

// Initialize Supabase admin client (service role — bypasses RLS)
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = 3001;

// ─── Rate Limiting ──────────────────────────────────────────────
const rateLimitStore = {};
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5; // max requests per window per IP

function rateLimit(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    if (!rateLimitStore[ip]) {
        rateLimitStore[ip] = { count: 1, resetAt: now + RATE_LIMIT_WINDOW };
        return next();
    }

    if (now > rateLimitStore[ip].resetAt) {
        rateLimitStore[ip] = { count: 1, resetAt: now + RATE_LIMIT_WINDOW };
        return next();
    }

    rateLimitStore[ip].count++;
    if (rateLimitStore[ip].count > RATE_LIMIT_MAX) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    next();
}

// OTP expiry in minutes (default to 5)
const OTP_EXPIRY_MIN = parseInt(process.env.OTP_EXPIRY_MIN || '5', 10);

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

app.post('/api/send-otp', rateLimit, async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
        return res.status(500).json({ error: 'Server misconfiguration: Gmail credentials not set in .env.local' });
    }

    // Check if email is already registered
    const { data: existing } = await supabaseAdmin
        .from('registrations')
        .select('id')
        .eq('email', email)
        .maybeSingle();

    if (existing) {
        return res.status(409).json({ error: 'This email is already registered. Please use a different email or log in.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MIN * 60 * 1000).toISOString();

    // Store OTP in Supabase (upsert — replaces existing OTP for same email)
    const { error: upsertErr } = await supabaseAdmin
        .from('otp_codes')
        .upsert({ email, otp, expires_at: expiresAt }, { onConflict: 'email' });

    if (upsertErr) {
        console.error('OTP store error:', upsertErr);
        return res.status(500).json({ error: 'Failed to generate OTP. Please try again.' });
    }

    try {
        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: 'TraineeTrack - Email Verification Code',
            html: `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #1e3a5f, #2563eb); border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; color: white;">TT</div>
                    <h2 style="color: #0f172a; margin: 12px 0 4px;">TraineeTrack</h2>
                    <p style="color: #94a3b8; font-size: 13px;">Email Verification</p>
                </div>
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center;">
                    <p style="color: #475569; font-size: 14px; margin-bottom: 16px;">Your verification code is:</p>
                    <div style="font-size: 36px; font-weight: 800; letter-spacing: 0.4em; color: #1e3a5f; background: #dbeafe; border-radius: 10px; padding: 16px; display: inline-block;">${otp}</div>
                    <p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">This code expires in ${OTP_EXPIRY_MIN} minutes. Do not share this code with anyone.</p>
                </div>
                <p style="color: #cbd5e1; font-size: 11px; text-align: center; margin-top: 24px;">&copy; 2026 TraineeTrack. All rights reserved.</p>
            </div>
            `
        });

        res.json({ success: true, message: 'OTP sent to email.' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send OTP email. Please check server logs.' });
    }
});

app.post('/api/verify-otp', rateLimit, async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Fetch OTP from Supabase
    const { data: storedData, error: fetchErr } = await supabaseAdmin
        .from('otp_codes')
        .select('otp, expires_at')
        .eq('email', email)
        .single();

    if (fetchErr || !storedData) {
        return res.status(400).json({ error: 'No OTP requested for this email' });
    }

    if (new Date() > new Date(storedData.expires_at)) {
        // Expired — delete it
        await supabaseAdmin.from('otp_codes').delete().eq('email', email);
        return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (storedData.otp === otp) {
        // Success — delete the used OTP
        await supabaseAdmin.from('otp_codes').delete().eq('email', email);
        return res.json({ success: true, verified: true });
    } else {
        return res.status(400).json({ error: 'Invalid OTP' });
    }
});

// ─── DUPLICATE CHECK ENDPOINT ─────────────────────────────────────────────
app.post('/api/check-duplicate', async (req, res) => {
    const { field, value } = req.body;

    if (!field || !value) {
        return res.status(400).json({ error: 'Field and value are required' });
    }

    // Only allow checking specific fields
    const allowedFields = ['student_id', 'email'];
    if (!allowedFields.includes(field)) {
        return res.status(400).json({ error: 'Invalid field' });
    }

    try {
        const { data: existing } = await supabaseAdmin
            .from('registrations')
            .select('id')
            .eq(field, value)
            .maybeSingle();

        return res.json({ exists: !!existing });
    } catch (err) {
        console.error('Duplicate check error:', err);
        return res.status(500).json({ error: 'Check failed' });
    }
});

// ─── REGISTER ENDPOINT (Secure — hashes password, uses service role) ────
app.post('/api/register', rateLimit, async (req, res) => {
    const { registrationData, password } = req.body;

    if (!registrationData || !password) {
        return res.status(400).json({ error: 'Registration data and password are required' });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return res.status(500).json({ error: 'Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY not set' });
    }

    try {
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

        // Hash the password (10 salt rounds)
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert into Supabase using service role (bypasses RLS)
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

        // Don't return sensitive data
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
});



// ─── LOGIN ENDPOINT (Secure — verifies bcrypt hash, uses service role) ────
app.post('/api/login', rateLimit, async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
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

        console.log(`✅ Trainee login successful: ${safeUser.email}`);
        res.json({ success: true, user: safeUser });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

// ─── UPDATE PROFILE ENDPOINT (Secure — uses service role) ────
app.post('/api/update-profile', rateLimit, async (req, res) => {
    const { userId, updates } = req.body;

    if (!userId || !updates) {
        return res.status(400).json({ error: 'User ID and updates are required.' });
    }

    try {
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
            .eq('id', userId)
            .select();

        if (error) {
            console.error('Profile update error:', error);
            return res.status(400).json({ error: error.message });
        }

        // Return updated data (exclude password_hash)
        const updated = data?.[0];
        if (updated) {
            delete updated.password_hash;
        }

        console.log(`✅ Profile updated for user: ${userId}`);
        res.json({ success: true, user: updated });
    } catch (err) {
        console.error('Profile update error:', err);
        res.status(500).json({ error: 'Failed to update profile. Please try again.' });
    }
});

// ─── DOCUMENT UPLOAD ENDPOINT ────────────────────────────────────
app.post('/api/documents/upload', rateLimit, async (req, res) => {
    const { traineeId, label, fileName, fileType, fileData } = req.body;

    if (!traineeId || !label || !fileName || !fileType || !fileData) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowedTypes.includes(fileType)) {
        return res.status(400).json({ error: 'Only PDF, DOC, and DOCX files are allowed.' });
    }

    try {
        // Convert base64 to buffer
        const buffer = Buffer.from(fileData, 'base64');
        const timestamp = Date.now();
        const storagePath = `documents/${traineeId}/${timestamp}_${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage
            .from('registration-uploads')
            .upload(storagePath, buffer, { contentType: fileType });

        if (uploadErr) {
            console.error('Document upload error:', uploadErr);
            return res.status(500).json({ error: 'Failed to upload file.' });
        }

        const { data: urlData } = supabaseAdmin.storage
            .from('registration-uploads')
            .getPublicUrl(storagePath);
        const fileUrl = urlData?.publicUrl || '';

        // Save metadata to trainee_documents table
        const { data, error } = await supabaseAdmin
            .from('trainee_documents')
            .insert({
                trainee_id: traineeId,
                label,
                file_url: fileUrl,
                file_name: fileName,
                file_type: fileType,
            })
            .select();

        if (error) {
            console.error('Document DB error:', error);
            return res.status(400).json({ error: error.message });
        }

        console.log(`✅ Document uploaded for user: ${traineeId}`);
        res.json({ success: true, document: data?.[0] });
    } catch (err) {
        console.error('Document upload error:', err);
        res.status(500).json({ error: 'Failed to upload document.' });
    }
});

// ─── DOCUMENT LIST ENDPOINT ─────────────────────────────────────
app.get('/api/documents/:traineeId', async (req, res) => {
    const { traineeId } = req.params;

    try {
        const { data, error } = await supabaseAdmin
            .from('trainee_documents')
            .select('*')
            .eq('trainee_id', traineeId)
            .order('uploaded_at', { ascending: false });

        if (error) {
            console.error('Document list error:', error);
            return res.status(400).json({ error: error.message });
        }

        // Also fetch resume_url from registrations table
        let registrationResumeUrl = null;
        const { data: regData } = await supabaseAdmin
            .from('registrations')
            .select('resume_url')
            .eq('id', traineeId)
            .single();
        if (regData?.resume_url) registrationResumeUrl = regData.resume_url;

        res.json({ success: true, documents: data || [], registrationResumeUrl });
    } catch (err) {
        console.error('Document list error:', err);
        res.status(500).json({ error: 'Failed to fetch documents.' });
    }
});

// ─── DOCUMENT DELETE ENDPOINT ────────────────────────────────────
app.delete('/api/documents/:docId', rateLimit, async (req, res) => {
    const { docId } = req.params;

    try {
        // Get the document first to find the storage path
        const { data: doc, error: fetchErr } = await supabaseAdmin
            .from('trainee_documents')
            .select('*')
            .eq('id', docId)
            .single();

        if (fetchErr || !doc) {
            return res.status(404).json({ error: 'Document not found.' });
        }

        // Extract storage path from URL
        const urlParts = doc.file_url.split('/registration-uploads/');
        if (urlParts[1]) {
            await supabaseAdmin.storage
                .from('registration-uploads')
                .remove([decodeURIComponent(urlParts[1])]);
        }

        // Delete from database
        const { error } = await supabaseAdmin
            .from('trainee_documents')
            .delete()
            .eq('id', docId);

        if (error) {
            console.error('Document delete error:', error);
            return res.status(400).json({ error: error.message });
        }

        console.log(`✅ Document deleted: ${docId}`);
        res.json({ success: true });
    } catch (err) {
        console.error('Document delete error:', err);
        res.status(500).json({ error: 'Failed to delete document.' });
    }
});

app.listen(PORT, () => {
    console.log(`OTP Server running on http://localhost:${PORT}`);
});
