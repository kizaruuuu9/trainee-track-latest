# Vercel Environment Variables Setup

Follow these steps to configure the required environment variables for deploying TraineeTrack on Vercel.

---

## Step 1: Open Vercel Environment Settings

1. Go to [vercel.com](https://vercel.com) and log in.
2. Select your **TraineeTrack** project.
3. Navigate to **Settings** → **Environment Variables**.

---

## Step 2: Add the Following Variables

Add each variable below. Set them for **Production**, **Preview**, and **Development** environments (or only Production if you prefer).

| Variable Name               | Value                                      | Description                                                            |
| --------------------------- | ------------------------------------------ | ---------------------------------------------------------------------- |
| `GMAIL_USER`                | `tracktrainee@gmail.com`                   | Gmail account used to send OTP emails                                  |
| `GMAIL_PASS`                | _(your Google App Password)_               | Google App Password (not regular password)                             |
| `OTP_EXPIRY_MIN`            | `5`                                        | OTP expiration time in minutes                                         |
| `SUPABASE_URL`              | `https://eswsavataziekaxmqiix.supabase.co` | Supabase project URL                                                   |
| `SUPABASE_SERVICE_ROLE_KEY` | _(your Supabase service role key)_         | Found in Supabase Dashboard → Settings → API → `service_role` (secret) |

> **⚠️ Important:** Do NOT add `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` here — those are build-time variables already embedded in the frontend bundle from the `.env` file.

---

## Step 3: How to Get Each Value

### Gmail App Password

1. Go to [myaccount.google.com](https://myaccount.google.com).
2. Navigate to **Security** → **2-Step Verification** → **App passwords**.
3. Generate a new App Password for "Mail" on "Other (TraineeTrack)".
4. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`) and paste it **without spaces** as `GMAIL_PASS`.

### Supabase Service Role Key

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project.
3. Go to **Settings** → **API**.
4. Under **Project API keys**, copy the `service_role` key (the one marked **secret**).
5. Paste it as `SUPABASE_SERVICE_ROLE_KEY`.

---

## Step 4: Redeploy

After adding all environment variables, trigger a redeployment:

1. Go to the **Deployments** tab.
2. Click the **⋯** menu on the latest deployment.
3. Select **Redeploy**.

The serverless functions (`/api/send-otp`, `/api/verify-otp`, `/api/register`) will now pick up the new environment variables.

---

## Checklist

- [ ] `GMAIL_USER` added
- [ ] `GMAIL_PASS` added (App Password, no spaces)
- [ ] `OTP_EXPIRY_MIN` added
- [ ] `SUPABASE_URL` added
- [ ] `SUPABASE_SERVICE_ROLE_KEY` added
- [ ] Redeployed after adding variables
