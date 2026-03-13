import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

// Load .env files only in local development (not on Vercel)
if (!process.env.VERCEL) {
    const { default: dotenv } = await import('dotenv');
    const { fileURLToPath } = await import('url');
    const { default: path } = await import('path');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
    dotenv.config({ path: path.join(__dirname, '..', '.env') });
}

// Initialize Supabase admin client (service role — bypasses RLS)
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const PORT = 3001;

const deriveActivityStatus = (isoDateString) => {
    if (!isoDateString) return 'Offline';
    const parsed = new Date(isoDateString).getTime();
    if (!Number.isFinite(parsed)) return 'Offline';

    const diffMs = Date.now() - parsed;
    if (diffMs < 0) return 'Online';

    return diffMs <= 15 * 60 * 1000 ? 'Online' : 'Offline';
};

// ─── Rate Limiting ──────────────────────────────────────────────
const rateLimitStore = {};
function createRateLimit({ windowMs = 60 * 1000, max = 10, keyPrefix = 'default' } = {}) {
    return function rateLimit(req, res, next) {
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        const now = Date.now();
        const endpointKey = `${req.method}:${req.path}`;
        const key = `${keyPrefix}:${ip}:${endpointKey}`;

        if (!rateLimitStore[key]) {
            rateLimitStore[key] = { count: 1, resetAt: now + windowMs };
            return next();
        }

        if (now > rateLimitStore[key].resetAt) {
            rateLimitStore[key] = { count: 1, resetAt: now + windowMs };
            return next();
        }

        rateLimitStore[key].count++;
        if (rateLimitStore[key].count > max) {
            const retryAfter = Math.ceil((rateLimitStore[key].resetAt - now) / 1000);
            return res.status(429).json({ error: 'Too many requests. Please try again later.', retryAfter });
        }

        next();
    };
}

const rateLimit = createRateLimit({ windowMs: 60 * 1000, max: 10, keyPrefix: 'general' });
const uploadRateLimit = createRateLimit({ windowMs: 60 * 1000, max: 30, keyPrefix: 'upload' });

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

    // Check if email is already registered in auth
    const { data: { users }, error: authErr } = await supabaseAdmin.auth.admin.listUsers();

    if (authErr) {
        console.error('Auth fetch error:', authErr);
        return res.status(500).json({ error: 'Failed to check email. Please try again.' });
    }

    const existing = users.find(u => u.email === email);

    if (existing) {
        return res.status(409).json({ error: 'This email is already registered. Please use a different email or log in.' });
    }

    // Per-email resend cooldown (60s) to prevent OTP spam
    const { data: previousOtp, error: previousOtpErr } = await supabaseAdmin
        .from('otp_codes')
        .select('expires_at')
        .eq('email', email)
        .maybeSingle();

    if (previousOtpErr) {
        console.error('OTP cooldown check error:', previousOtpErr);
        return res.status(500).json({ error: 'Failed to process OTP request. Please try again.' });
    }

    if (previousOtp?.expires_at) {
        const expiryTime = new Date(previousOtp.expires_at).getTime();
        const approxSentAt = expiryTime - OTP_EXPIRY_MIN * 60 * 1000;
        const elapsedMs = Date.now() - approxSentAt;
        const cooldownMs = 60 * 1000;

        if (Number.isFinite(expiryTime) && elapsedMs < cooldownMs) {
            const retryAfter = Math.max(1, Math.ceil((cooldownMs - elapsedMs) / 1000));
            return res.status(429).json({
                error: `Please wait ${retryAfter}s before requesting another OTP.`,
                retryAfter,
            });
        }
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

// Admin Data Endpoint (Bypass RLS for Admin Dashboard)
app.get('/api/admin/data', rateLimit, async (req, res) => {
    try {
        const { data: stds, error: stdsErr } = await supabaseAdmin
            .from('students')
            .select('*, programs(name)');

        const { data: parts, error: partsErr } = await supabaseAdmin
            .from('industry_partners')
            .select('*');

        const { data: submittedRows, error: submittedErr } = await supabaseAdmin
            .from('partner_verifications')
            .select('partner_id');

        const { data: profiles, error: profilesErr } = await supabaseAdmin
            .from('profiles')
            .select('id, user_type');

        if (stdsErr) throw stdsErr;
        if (partsErr) throw partsErr;
        if (submittedErr) console.warn('Could not fetch partner submission rows:', submittedErr);
        if (profilesErr) console.warn('Could not fetch profiles for role filtering:', profilesErr);

        const { data: authUsers, error: usersErr } = await supabaseAdmin.auth.admin.listUsers();
        if (usersErr) console.warn('Could not fetch auth users for emails:', usersErr);

        const submittedPartnerIds = [...new Set((submittedRows || []).map(row => row.partner_id))];

        const profileRoleById = new Map((profiles || []).map(profile => [
            profile.id,
            String(profile.user_type || '').toLowerCase(),
        ]));

        const allowedStudentRoles = new Set(['student', 'trainee']);
        const allowedPartnerRoles = new Set(['industry_partner', 'partner']);

        const filteredStds = (stds || []).filter(std => allowedStudentRoles.has(profileRoleById.get(std.id)));
        const filteredPartners = (parts || []).filter(partner => allowedPartnerRoles.has(profileRoleById.get(partner.id)));

        const mappedStds = filteredStds.map(std => {
            const authRecord = authUsers?.users?.find(u => u.id === std.id);
            return {
                ...std,
                profile_name: std.full_name || 'Trainee',
                email: authRecord?.email || 'None',
                activity_status: deriveActivityStatus(authRecord?.last_sign_in_at),
                last_seen_at: authRecord?.last_sign_in_at || null,
            };
        });

        const mappedPartners = filteredPartners.map(partner => {
            const authRecord = authUsers?.users?.find(u => u.id === partner.id);
            return {
                ...partner,
                profile_name: partner.company_name || partner.contact_person || 'Industry Partner',
                email: authRecord?.email || 'None',
                activity_status: deriveActivityStatus(authRecord?.last_sign_in_at),
                last_seen_at: authRecord?.last_sign_in_at || null,
            };
        });

        res.json({ students: mappedStds, partners: mappedPartners, submittedPartnerIds });
    } catch (error) {
        console.error('Admin data fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch admin data.' });
    }
});

// Admin Delete Account Endpoint (Bypass RLS — deletes all associated data)
// Helper: run a Supabase delete and throw if it fails (ignores "table not found")
async function sbDelete(query, label) {
    const { error } = await query;
    if (error) {
        if (['42P01', 'PGRST205', 'PGRST204', '42703'].includes(error.code)) {
            console.warn(`[delete-account] Table not found (skipped): ${label}`);
            return;
        }
        const msg = `[delete-account] Failed step "${label}": ${error.message} (code: ${error.code})`;
        console.error(msg);
        throw new Error(msg);
    }
    console.log(`[delete-account] OK: ${label}`);
}

// Admin Delete Account Endpoint (Bypass RLS — deletes all associated data)
// Uses POST so request body is reliably forwarded through proxies
const adminDeleteAccountHandler = async (req, res) => {
    const { accountId, accountType } = req.body;
    console.log('[delete-account] Request received:', { accountId, accountType });

    if (!accountId || !accountType) {
        return res.status(400).json({ error: 'accountId and accountType are required.' });
    }
    if (!['trainee', 'partner'].includes(accountType)) {
        return res.status(400).json({ error: 'Invalid accountType.' });
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(accountId)) {
        return res.status(400).json({ error: 'Invalid accountId format.' });
    }

    try {
        // 1. Delete posts authored by this user (comments cascade via FK)
        await sbDelete(supabaseAdmin.from('post_comments').delete().eq('author_id', accountId), 'post_comments by author');
        await sbDelete(supabaseAdmin.from('job_posting_comments').delete().eq('author_id', accountId), 'job_posting_comments by author');
        await sbDelete(supabaseAdmin.from('posts').delete().eq('author_id', accountId), 'posts by author');

        // 2. Delete contact requests where user is sender or recipient
        await sbDelete(supabaseAdmin.from('contact_requests').delete().eq('sender_id', accountId), 'contact_requests as sender');
        await sbDelete(supabaseAdmin.from('contact_requests').delete().eq('recipient_id', accountId), 'contact_requests as recipient');

        if (accountType === 'trainee') {
            // 3a. Delete student-specific rows (FK children before parent)
            await sbDelete(supabaseAdmin.from('student_competencies').delete().eq('student_id', accountId), 'student_competencies');
            await sbDelete(supabaseAdmin.from('student_skills').delete().eq('student_id', accountId), 'student_skills');
            await sbDelete(supabaseAdmin.from('student_interests').delete().eq('student_id', accountId), 'student_interests');
            await sbDelete(supabaseAdmin.from('student_documents').delete().eq('student_id', accountId), 'student_documents');
            await sbDelete(supabaseAdmin.from('job_applications').delete().eq('student_id', accountId), 'job_applications');
            await sbDelete(supabaseAdmin.from('students').delete().eq('id', accountId), 'students');
        } else {
            // 3b. Delete partner-specific rows
            const { data: partnerJobs, error: jobsErr } = await supabaseAdmin
                .from('job_postings')
                .select('id')
                .eq('partner_id', accountId);
            if (jobsErr && !['42P01', 'PGRST205', 'PGRST204', '42703'].includes(jobsErr.code)) {
                throw new Error(`[delete-account] Failed to fetch partner jobs: ${jobsErr.message}`);
            }
            if (partnerJobs && partnerJobs.length > 0) {
                const jobIds = partnerJobs.map(j => j.id);
                await sbDelete(supabaseAdmin.from('job_applications').delete().in('job_id', jobIds), 'job_applications for partner jobs');
                await sbDelete(supabaseAdmin.from('job_posting_comments').delete().in('job_posting_id', jobIds), 'job_posting_comments for partner jobs');
                await sbDelete(supabaseAdmin.from('job_postings').delete().eq('partner_id', accountId), 'job_postings');
            }
            await sbDelete(supabaseAdmin.from('partner_verifications').delete().eq('partner_id', accountId), 'partner_verifications');
            await sbDelete(supabaseAdmin.from('industry_partners').delete().eq('id', accountId), 'industry_partners');
        }

        // 4. Delete profile row
        await sbDelete(supabaseAdmin.from('profiles').delete().eq('id', accountId), 'profiles');

        // 5. Delete the auth user (removes login credentials)
        const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(accountId);
        if (authErr) {
            console.warn('[delete-account] Could not delete auth user (may already be gone):', authErr.message);
        } else {
            console.log('[delete-account] Auth user deleted.');
        }

        console.log('[delete-account] Complete for:', accountId);
        res.json({ success: true });
    } catch (error) {
        console.error('[delete-account] Aborted:', error.message);
        res.status(500).json({ error: error.message });
    }
};

app.post('/api/admin/delete-account', rateLimit, adminDeleteAccountHandler);
app.delete('/api/admin/delete-account', rateLimit, adminDeleteAccountHandler);

// Admin Update Student Endpoint (Bypass RLS)
app.post('/api/admin/update-student', rateLimit, async (req, res) => {
    const { studentId, updates } = req.body;
    if (!studentId || !updates) {
        return res.status(400).json({ error: 'studentId and updates are required.' });
    }
    try {
        const { error } = await supabaseAdmin
            .from('students')
            .update(updates)
            .eq('id', studentId);
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        console.error('Admin update student error:', error);
        res.status(500).json({ error: 'Failed to update student.' });
    }
});

const isColumnShapeError = (error) => {
    const message = String(error?.message || '').toLowerCase();
    return ['PGRST204', '42703'].includes(error?.code) || message.includes('column');
};

const toEmploymentDbValue = (value, opportunityType) => {
    if (String(opportunityType || '').trim().toUpperCase() === 'OJT') return null;

    const raw = String(value || '').trim().toLowerCase();
    if (!raw) return null;

    const map = {
        'full-time': 'full_time',
        'full time': 'full_time',
        'full_time': 'full_time',
        'part-time': 'part_time',
        'part time': 'part_time',
        'part_time': 'part_time',
        contract: 'contract',
        internship: 'internship',
    };

    return map[raw] || raw.replace(/\s+/g, '_').replace(/-/g, '_');
};

const toEmploymentUiValue = (value) => {
    const raw = String(value || '').trim().toLowerCase();
    if (!raw) return '';

    if (raw === 'full_time' || raw === 'full-time' || raw === 'fulltime') return 'Full-time';
    if (raw === 'part_time' || raw === 'part-time' || raw === 'parttime') return 'Part-time';
    if (raw === 'contract') return 'Contract';
    if (raw === 'internship') return 'Internship';

    return String(value);
};

app.post('/api/partner/opportunities', uploadRateLimit, async (req, res) => {
    const {
        partnerId,
        title,
        opportunityType,
        programId,
        ncLevel,
        description,
        employmentType,
        location,
        salaryRange,
        requiredCompetencies,
        requiredSkills,
        industry,
        attachmentName,
        attachmentType,
        attachmentUrl,
    } = req.body || {};

    if (!partnerId || !title || !location) {
        return res.status(400).json({ error: 'partnerId, title, and location are required.' });
    }

    try {
        const normalizedComps = Array.isArray(requiredCompetencies)
            ? requiredCompetencies.map(item => String(item || '').trim()).filter(Boolean)
            : [];
        const normalizedSkills = Array.isArray(requiredSkills)
            ? requiredSkills.map(item => String(item || '').trim()).filter(Boolean)
            : [];

        const normalizedOpportunityType = String(opportunityType || 'Job').trim() || 'Job';
        const normalizedEmploymentType = toEmploymentDbValue(employmentType, normalizedOpportunityType);

        const commonPayload = {
            partner_id: partnerId,
            program_id: programId || null,
            title: String(title || '').trim(),
            company_name: null,
            description: String(description || '').trim() || null,
            requirements: normalizedComps.length > 0 ? normalizedComps : null,
            location: String(location || '').trim(),
            employment_type: normalizedEmploymentType,
            source: 'partner',
            source_url: String(attachmentUrl || '').trim() || null,
            is_active: true,
        };

        const salaryNumbers = String(salaryRange || '')
            .match(/\d[\d,]*/g)?.map(value => Number(value.replace(/,/g, '')))
            .filter(value => Number.isFinite(value)) || [];

        const legacyPayload = {
            ...commonPayload,
            salary_min: salaryNumbers[0] ?? null,
            salary_max: salaryNumbers[1] ?? null,
            slots: 1,
        };

        const extendedPayload = {
            ...commonPayload,
            opportunity_type: normalizedOpportunityType,
            nc_level: String(ncLevel || '').trim() || null,
            required_competencies: normalizedComps,
            required_skills: normalizedSkills,
            salary_range: String(salaryRange || '').trim() || null,
            status: 'Open',
            industry: String(industry || '').trim() || 'General',
            attachment_name: String(attachmentName || '').trim() || null,
            attachment_type: String(attachmentType || '').trim() || null,
            attachment_url: String(attachmentUrl || '').trim() || null,
        };

        const attempts = [
            extendedPayload,
            {
                ...extendedPayload,
                attachment_name: undefined,
                attachment_type: undefined,
                attachment_url: undefined,
            },
            legacyPayload,
        ];

        let inserted = null;
        let lastError = null;

        for (const payload of attempts) {
            const cleanPayload = Object.fromEntries(
                Object.entries(payload).filter(([, value]) => value !== undefined)
            );

            const { data, error } = await supabaseAdmin
                .from('job_postings')
                .insert([cleanPayload])
                .select('*, industry_partners(company_name), programs(name, competencies, description)')
                .single();

            if (!error) {
                inserted = data;
                break;
            }

            lastError = error;
            if (isColumnShapeError(error)) {
                continue;
            }

            throw error;
        }

        if (!inserted) {
            throw lastError || new Error('Failed to insert job posting.');
        }

        const resolvedAttachmentUrl = inserted.attachment_url || inserted.source_url || String(attachmentUrl || '').trim() || null;
        const fallbackAttachmentName = resolvedAttachmentUrl
            ? decodeURIComponent(String(resolvedAttachmentUrl).split('/').pop()?.split('?')[0] || '')
            : null;

        const mapped = {
            id: inserted.id,
            partnerId: inserted.partner_id || partnerId,
            companyName: inserted.company_name || inserted.industry_partners?.company_name || 'Company',
            industry: inserted.industry || String(industry || '').trim() || 'General',
            title: inserted.title,
            opportunityType: inserted.opportunity_type || normalizedOpportunityType,
            programId: inserted.program_id || programId || null,
            ncLevel: inserted.nc_level || inserted.programs?.name || String(ncLevel || '').trim() || '',
            requiredCompetencies: inserted.required_competencies || inserted.requirements || normalizedComps,
            requiredSkills: inserted.required_skills || normalizedSkills,
            description: inserted.description || '',
            employmentType: toEmploymentUiValue(inserted.employment_type || normalizedEmploymentType || ''),
            location: inserted.location || location,
            salaryRange: inserted.salary_range || String(salaryRange || '').trim() || '',
            slots: inserted.slots || 1,
            status: inserted.status || 'Open',
            datePosted: inserted.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            createdAt: inserted.created_at || new Date().toISOString(),
            attachmentName: inserted.attachment_name || (fallbackAttachmentName || null),
            attachmentType: inserted.attachment_type || String(attachmentType || '').trim() || null,
            attachmentUrl: resolvedAttachmentUrl,
        };

        res.json({ success: true, job: mapped });
    } catch (error) {
        console.error('Partner opportunity create error:', error);
        res.status(500).json({ error: error?.message || 'Failed to post opportunity.' });
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
        if (field === 'email') {
            const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
            if (error) throw error;
            const exists = users.some(u => u.email === value);
            return res.json({ exists });
        } else if (field === 'student_id') {
            const { data: existing } = await supabaseAdmin
                .from('students')
                .select('id')
                .eq('student_id', value)
                .maybeSingle();

            return res.json({ exists: !!existing });
        }
    } catch (err) {
        console.error('Duplicate check error:', err);
        return res.status(500).json({ error: 'Check failed' });
    }
});

// ─── REGISTER ENDPOINT (Atomic — creates auth user, profile, student) ────
app.post('/api/register', rateLimit, async (req, res) => {
    const { email, password, fullName, studentId, program, address, gender, trainingStatus, graduationYear, birthdate, frontIdBase64, backIdBase64, selfieBase64 } = req.body;

    if (!email || !password || !fullName || !studentId) {
        return res.status(400).json({ error: 'Email, password, full name, and student ID are required.' });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return res.status(500).json({ error: 'Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY not set' });
    }

    let userId = null;

    try {
        // 1. Check for duplicate student ID
        const { data: existingStudent } = await supabaseAdmin
            .from('students')
            .select('id')
            .eq('student_id', studentId)
            .maybeSingle();

        if (existingStudent) {
            return res.status(409).json({ error: 'This Student ID is already registered.' });
        }

        // 2. Create auth user (auto-confirmed)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

        if (authError) {
            if (authError.message?.includes('already been registered') || authError.status === 422) {
                return res.status(409).json({ error: 'This email is already registered.' });
            }
            throw new Error(authError.message);
        }

        userId = authData.user.id;

        // 3. Upsert profile (in case a dashboard trigger already created it)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({ id: userId, user_type: 'student' });

        if (profileError) throw new Error(`Profile creation failed: ${profileError.message}`);

        // 4. Upload images
        const timestamp = Date.now();
        let frontIdUrl = null, backIdUrl = null, selfieUrl = null;

        if (frontIdBase64) {
            const base64Data = frontIdBase64.includes(',') ? frontIdBase64.split(',')[1] : frontIdBase64;
            const buffer = Buffer.from(base64Data, 'base64');
            const filePath = `ids/${userId}/${timestamp}_front.jpg`;
            const { error: upErr } = await supabaseAdmin.storage.from('registration-uploads').upload(filePath, buffer, { contentType: 'image/jpeg' });
            if (!upErr) {
                const { data: urlData } = supabaseAdmin.storage.from('registration-uploads').getPublicUrl(filePath);
                frontIdUrl = urlData?.publicUrl || null;
            }
        }

        if (backIdBase64) {
            const base64Data = backIdBase64.includes(',') ? backIdBase64.split(',')[1] : backIdBase64;
            const buffer = Buffer.from(base64Data, 'base64');
            const filePath = `ids/${userId}/${timestamp}_back.jpg`;
            const { error: upErr } = await supabaseAdmin.storage.from('registration-uploads').upload(filePath, buffer, { contentType: 'image/jpeg' });
            if (!upErr) {
                const { data: urlData } = supabaseAdmin.storage.from('registration-uploads').getPublicUrl(filePath);
                backIdUrl = urlData?.publicUrl || null;
            }
        }

        if (selfieBase64) {
            const base64Data = selfieBase64.includes(',') ? selfieBase64.split(',')[1] : selfieBase64;
            const buffer = Buffer.from(base64Data, 'base64');
            const filePath = `selfies/${userId}/${timestamp}_selfie.jpg`;
            const { error: upErr } = await supabaseAdmin.storage.from('registration-uploads').upload(filePath, buffer, { contentType: 'image/jpeg' });
            if (!upErr) {
                const { data: urlData } = supabaseAdmin.storage.from('registration-uploads').getPublicUrl(filePath);
                selfieUrl = urlData?.publicUrl || null;
            }
        }

        // 5. Look up program_id
        let programId = null;
        if (program) {
            const { data: progData } = await supabaseAdmin.from('programs').select('id').eq('name', program).maybeSingle();
            programId = progData?.id || null;
        }

        // 5. Upsert student record
        const genderVal = gender?.toLowerCase() === 'male' ? 'male'
            : gender?.toLowerCase() === 'female' ? 'female' : 'other';

        const { error: studentError } = await supabaseAdmin
            .from('students')
            .upsert({
                id: userId,
                full_name: fullName,
                student_id: studentId,
                program_id: programId,
                gender: genderVal,
                training_status: trainingStatus,
                graduation_year: trainingStatus === 'Graduated' ? graduationYear : null,
                front_id_url: frontIdUrl,
                back_id_url: backIdUrl,
                selfie_url: selfieUrl,
                birthdate: birthdate || null,
                detailed_address: address || null,
            });

        if (studentError) throw new Error(`Student record creation failed: ${studentError.message}`);

        console.log(`✅ Registration successful: ${email} (${userId})`);
        res.json({ success: true, userId });

    } catch (err) {
        console.error('Registration error:', err);

        // Cleanup on failure
        if (userId) {
            try {
                await supabaseAdmin.from('students').delete().eq('id', userId);
                await supabaseAdmin.from('profiles').delete().eq('id', userId);
                await supabaseAdmin.auth.admin.deleteUser(userId);
                console.log('Cleaned up failed registration for:', userId);
            } catch (cleanupErr) {
                console.error('Cleanup error:', cleanupErr);
            }
        }

        res.status(500).json({ error: err.message || 'Failed to register. Please try again.' });
    }
});

// ─── REGISTER PARTNER ENDPOINT ──────────────────────────────────────
app.post('/api/register-partner', rateLimit, async (req, res) => {
    const { email, password, companyName, contactPerson, address } = req.body;

    if (!email || !password || !companyName || !contactPerson) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return res.status(500).json({ error: 'Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY not set' });
    }

    let userId = null;

    try {
        // Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

        if (authError) {
            if (authError.message?.includes('already been registered') || authError.status === 422) {
                return res.status(409).json({ error: 'This email is already registered.' });
            }
            throw new Error(authError.message);
        }

        userId = authData.user.id;

        // Upsert profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({ id: userId, user_type: 'industry_partner' });

        if (profileError) throw new Error(`Profile creation failed: ${profileError.message}`);

        // Insert into industry_partners
        const { error: partnerError } = await supabaseAdmin
            .from('industry_partners')
            .upsert({
                id: userId,
                company_name: companyName,
                contact_person: contactPerson,
                contact_number: null,
                city: address || null,
                verification_status: 'pending',
                contact_email: email,
            });

        if (partnerError) throw new Error(`Partner record creation failed: ${partnerError.message}`);

        console.log(`✅ Partner Registration successful: ${email} (${userId})`);
        res.json({ success: true, userId });

    } catch (err) {
        console.error('Partner Registration error:', err);

        // Cleanup on failure
        if (userId) {
            try {
                await supabaseAdmin.from('industry_partners').delete().eq('id', userId);
                await supabaseAdmin.from('profiles').delete().eq('id', userId);
                await supabaseAdmin.auth.admin.deleteUser(userId);
                console.log('Cleaned up failed partner registration for:', userId);
            } catch (cleanupErr) {
                console.error('Cleanup error:', cleanupErr);
            }
        }

        res.status(500).json({ error: err.message || 'Failed to register. Please try again.' });
    }
});

// ─── DOCUMENT UPLOAD ENDPOINT ────────────────────────────────────
app.post('/api/documents/upload', uploadRateLimit, async (req, res) => {
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

        if (label === 'Resume') {
            const { error: updateErr } = await supabaseAdmin
                .from('students')
                .update({ resume_url: fileUrl })
                .eq('id', traineeId);

            if (updateErr) {
                console.error('Resume update DB error:', updateErr);
            }
        }

        // Save metadata to student_documents table
        const { data, error } = await supabaseAdmin
            .from('student_documents')
            .insert({
                student_id: traineeId,
                category: label === 'Resume' ? 'document' : 'certification',
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
            .from('student_documents')
            .select('*')
            .eq('student_id', traineeId)
            .order('uploaded_at', { ascending: false });

        if (error) {
            console.error('Document list error:', error);
            return res.status(400).json({ error: error.message });
        }

        // Also fetch resume_url from students table
        let registrationResumeUrl = null;
        const { data: regData } = await supabaseAdmin
            .from('students')
            .select('resume_url')
            .eq('id', traineeId)
            .maybeSingle();

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
            .from('student_documents')
            .select('*')
            .eq('id', docId)
            .single();

        if (fetchErr || !doc) {
            return res.status(404).json({ error: 'Document not found.' });
        }

        // Extract storage path from URL
        if (doc.file_url) {
            const urlParts = doc.file_url.split('/registration-uploads/');
            if (urlParts[1]) {
                await supabaseAdmin.storage
                    .from('registration-uploads')
                    .remove([decodeURIComponent(urlParts[1])]);
            }
        }

        // Delete from database
        const { error } = await supabaseAdmin
            .from('student_documents')
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

// ─── PARTNER VERIFICATION DOCUMENT UPLOAD ────────────────────────
app.post('/api/partner-verification/upload', uploadRateLimit, async (req, res) => {
    const { partnerId, documentType, label, fileName, fileType, fileData } = req.body;

    if (!partnerId || !documentType || !label || !fileName || !fileType || !fileData) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(fileType)) {
        return res.status(400).json({ error: 'Only PDF, JPG, and PNG files are allowed.' });
    }

    try {
        const buffer = Buffer.from(fileData, 'base64');
        if (buffer.length > 3 * 1024 * 1024) {
            return res.status(400).json({ error: 'File size must be under 3MB.' });
        }

        const timestamp = Date.now();
        const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `${partnerId}/${timestamp}_${safeName}`;

        const { error: uploadErr } = await supabaseAdmin.storage
            .from('partner-verifications')
            .upload(storagePath, buffer, { contentType: fileType });

        if (uploadErr) {
            console.error('Partner verification upload error:', uploadErr);
            return res.status(500).json({ error: 'Failed to upload file.' });
        }

        const fileUrl = storagePath;

        const { data, error } = await supabaseAdmin
            .from('partner_verifications')
            .insert({
                partner_id: partnerId,
                document_type: documentType,
                label,
                file_url: fileUrl,
                file_name: fileName,
                file_type: fileType,
            })
            .select();

        if (error) {
            console.error('Partner verification DB error:', error);
            return res.status(400).json({ error: error.message });
        }

        console.log(`✅ Partner verification doc uploaded for: ${partnerId}`);
        res.json({ success: true, document: data?.[0] });
    } catch (err) {
        console.error('Partner verification upload error:', err);
        res.status(500).json({ error: 'Failed to upload verification document.' });
    }
});

// ─── PARTNER VERIFICATION DOCUMENT LIST ──────────────────────────
app.get('/api/partner-verification/:partnerId', async (req, res) => {
    const { partnerId } = req.params;
    try {
        const { data, error } = await supabaseAdmin
            .from('partner_verifications')
            .select('*')
            .eq('partner_id', partnerId)
            .order('uploaded_at', { ascending: false });

        if (error) {
            console.error('Partner verification list error:', error);
            return res.status(400).json({ error: error.message });
        }

        const docs = data || [];
        const docsWithUrls = await Promise.all(docs.map(async (doc) => {
            if (doc.file_url) {
                const { data: signedData, error: signErr } = await supabaseAdmin.storage
                    .from('partner-verifications')
                    .createSignedUrl(doc.file_url, 3600);
                if (!signErr && signedData?.signedUrl) {
                    return { ...doc, file_url: signedData.signedUrl };
                }
            }
            return doc;
        }));

        res.json({ success: true, documents: docsWithUrls });
    } catch (err) {
        console.error('Partner verification list error:', err);
        res.status(500).json({ error: 'Failed to fetch verification documents.' });
    }
});

// ─── PARTNER VERIFICATION DOCUMENT DELETE ────────────────────────
app.delete('/api/partner-verification/:docId', rateLimit, async (req, res) => {
    const { docId } = req.params;
    try {
        const { data: doc, error: fetchErr } = await supabaseAdmin
            .from('partner_verifications')
            .select('*')
            .eq('id', docId)
            .single();

        if (fetchErr || !doc) {
            return res.status(404).json({ error: 'Document not found.' });
        }

        if (doc.file_url) {
            await supabaseAdmin.storage
                .from('partner-verifications')
                .remove([doc.file_url]);
        }

        const { error } = await supabaseAdmin
            .from('partner_verifications')
            .delete()
            .eq('id', docId);

        if (error) {
            console.error('Partner verification delete error:', error);
            return res.status(400).json({ error: error.message });
        }

        console.log(`✅ Partner verification doc deleted: ${docId}`);
        res.json({ success: true });
    } catch (err) {
        console.error('Partner verification delete error:', err);
        res.status(500).json({ error: 'Failed to delete verification document.' });
    }
});

// ─── PARTNER VERIFICATION STATUS UPDATE ──────────────────────────
app.put('/api/partner-verification/status/:partnerId', rateLimit, async (req, res) => {
    const { partnerId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'under_review', 'verified', 'rejected', null];
    const hasStatusField = Object.prototype.hasOwnProperty.call(req.body || {}, 'status');
    if (!hasStatusField || !validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status.' });
    }

    // DB constraint supports: pending | verified | rejected | null.
    // Normalize UI status to DB-compatible value.
    const normalizedStatus = status === 'under_review' ? 'pending' : status;

    try {
        const { error } = await supabaseAdmin
            .from('industry_partners')
            .update({ verification_status: normalizedStatus, updated_at: new Date().toISOString() })
            .eq('id', partnerId);

        if (error) {
            console.error('Partner status update error:', error);
            return res.status(400).json({ error: error.message });
        }

        console.log(`✅ Partner ${partnerId} status updated to: ${normalizedStatus}`);
        res.json({ success: true, status: normalizedStatus });
    } catch (err) {
        console.error('Partner status update error:', err);
        res.status(500).json({ error: 'Failed to update verification status.' });
    }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`OTP Server running on http://localhost:${PORT}`);
    });
}

export default app;
