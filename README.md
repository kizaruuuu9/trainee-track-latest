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
- UI: React + Tailwind CSS
- State: Context API (no backend in this prototype)
- Charts: Recharts

Run locally

```bash
npm install
npm run dev
```

© {new Date().getFullYear()} Philippine School for Technology Development and Innovation Inc.
