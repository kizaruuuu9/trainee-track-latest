# TraineeTrack

TraineeTrack — A Web-Based Graduate Employability Analytics and Competency-Based Job Matching Platform for Philippine School for Technology Development and Innovation Inc.

This project was refocused from a TESDA-style LMS to a school-centered graduate tracing and job referral website. The platform helps the school track graduates/certificate-takers, measure employability, and match graduates to competency-aligned job referrals posted by industry partners.

Design goals:
- Trace graduates and employment outcomes (who got hired, where, and how long after graduation)
- Provide competency-gap analysis and visual analytics for curriculum improvement
- Offer a job referral/posting board for verified industry partners
- Keep the UI professional, card-based, and responsive with a left sidebar layout

Core features
- Role-based access: Admin, Graduate (Student), Industry Partner, Trainer/Teacher
- Graduate Dashboard: match rate, applications, certifications, recommended jobs
- Partner Portal: post jobs, view applicants, manage listings (verification workflow)
- Admin Portal: manage graduates, partners, job oversight, employment tracking, analytics
- Job matching: competency-based match score and referral flow
- Exportable analytics (CSV/PDF) for employment reports

Developer notes
- Frontend: React + Tailwind CSS
- Backend: Express (OTP Server) + Vercel Serverless Functions
- Database: Supabase
- Multi-channel Notification: NodeMailer (Gmail)
- Charts: Recharts

## 🚀 Running Locally

To get the project up and running on your local machine, follow these steps:

### 1. Install Dependencies
First, install all necessary packages for both the frontend and backend:
```bash
npm install
```

### 2. Configure Environment Variables
You will need to set up your environment variables for local development. Create a `.env` and `.env.local` file in the root directory:

**For Frontend (.env):**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**For OTP Server (.env.local):**
- `GMAIL_USER` (Email for sending OTPs)
- `GMAIL_PASS` (Google App Password)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Start the Application
The platform requires both the frontend development server and the backend OTP server to be running simultaneously. Open **two separate terminals**:

**Terminal 1: Frontend (Vite)**
```bash
npm run dev
```

**Terminal 2: OTP Server**
```bash
npm run otp-server
```

---
© 2026 Philippine School for Technology Development and Innovation Inc.

