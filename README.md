# TraineeTrack

TraineeTrack — A Web-Based Graduate Employability Analytics and Competency-Based Job Matching Platform for Philippine School for Technology Development and Innovation Inc. (PSTDII).

This platform helps the school track graduates/certificate-takers, measure employability, and match graduates to competency-aligned job referrals posted by industry partners.

---

## 📋 Table of Contents
- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Database Setup (Supabase)](#-database-setup-supabase)
- [Environment Variables](#-environment-variables)
- [Running Locally](#-running-locally)
- [Tech Stack](#-tech-stack)

---

## ✨ Features
- **Role-based access**: Admin, Graduate (Student), Industry Partner.
- **Graduate Dashboard**: LinkedIn-style feed, match rate, applications, certifications, recommended jobs.
- **Partner Portal**: Post jobs, view applicants, manage listings with a verification workflow.
- **Admin Portal**: Command center for managing graduates, partners, job oversight, and visual analytics.
- **Job Matching**: Competency-based match score and referral flow.
- **Exportable Analytics**: Generate CSV/PDF reports for employment tracking.

---

## 🛠 Prerequisites
Before cloning the repo, ensure you have the following installed:
- **Node.js**: version 18.x or higher (Recommend 20.x LTS)
- **npm**: (comes with Node.js)
- **Git**: For cloning the repository
- **Supabase Account**: For database and authentication

---

## 📦 Installation
1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd trainee-track-latest
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

---

## 🔑 Environment Variables
You need to configure environment variables for both the frontend and the OTP backend server.

### 1. Frontend Setup
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3001
```

### 2. OTP Server Setup
Create a `.env.local` file in the root directory (used by the Node.js server):
```env
GMAIL_USER=your_gmail_address@gmail.com
GMAIL_PASS=your_google_app_password
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```
> **Note**: For `GMAIL_PASS`, you must generate an **App Password** from your Google Account settings (Security > 2-Step Verification > App Passwords).

---

## 🚀 Running Locally
The platform requires both the frontend development server and the backend OTP server to be running simultaneously.

**Terminal 1: Frontend (Vite)**
```bash
npm run dev
```
*Accessible at: `http://localhost:5173`*

**Terminal 2: OTP Server (Node.js)**
```bash
npm run otp-server
```
*Accessible at: `http://localhost:3001`*

---

## 💻 Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS, Lucide React
- **Backend**: Express (OTP Server), Supabase (Auth/DB/Storage)
- **Analytics**: Recharts
- **Image Processing**: Face-api.js, Tesseract.js (OCR), React Easy Crop
- **Mailing**: NodeMailer (Gmail)

---
© 2026 Philippine School for Technology Development and Innovation Inc.
