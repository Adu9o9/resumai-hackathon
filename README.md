# ⚡ RESUMAI: AI-Powered Resume Matcher & ATS Scorecard SaaS

🌍 Live Demo: https://resumai-hackathon.vercel.app  
▶️ Video Walkthrough: *([Insert Google Drive / Loom Link Here](https://drive.google.com/file/d/1s_5o64WgYs1z_ZsjZPENIXWX1m0z4_ox/view?usp=sharing))*  

## The Problem

Job seekers struggle to tailor their resumes for specific roles, often guessing what keywords applicant tracking systems (ATS) look for. Manually rewriting resumes for every application leads to fatigue, missed keywords, and low interview conversion rates, while recruiters waste hours manually cross-referencing candidate skills against technical job descriptions.

## The Solution

An end-to-end, production-ready SaaS application that instantly analyzes resumes against target job descriptions using advanced LLMs, calculates a real-time ATS compatibility score, surfaces missing keywords, and gates advanced insights behind an automated Stripe Pro subscription tier.

Unlike typical hackathon prototypes that rely on mock state or manual intervention, ResumAI features fully persistent user data, secure authentication, and live webhook-driven billing infrastructure.

## 🚀 Key Features Implemented

* **Instant ATS Scorecard**: Computes a precise 0-100 match percentage using a custom radial progress algorithm and parses deep structural feedback (Strengths, Gaps, and Suggestions).
* **Pro Gated Keyword Insights**: Dynamically detects missing keywords from the job description, fully unlocked for Pro subscribers while displaying secure blur-gated previews for free users.
* **Automated Stripe Billing Pipeline**: Complete with live tier management, checkout session redirection, secure customer portal integration, and server-side webhook processing (`checkout.session.completed`) that updates user roles instantly with zero human intervention.
* **Persistent User History**: Every review is tied securely to the authenticated user via Supabase PostgreSQL, allowing candidates to revisit and track past resume analyses from a dedicated dashboard sidebar.
* **Responsive Dark-Mode UI**: Built with Next.js (App Router), Tailwind CSS, and Radix UI components, featuring smooth loading skeletons, zero layout flicker, and mobile-responsive layouts.

## Tech Stack

* **Frontend & Backend**: Next.js (App Router), React, Tailwind CSS
* **Database & Auth**: Supabase (PostgreSQL with custom JSONB keyword storage & Row Level Security)
* **AI Engine**: Groq API (Llama 3.3 70B) for ultra-fast, structured JSON extraction
* **Billing & Payments**: Stripe Billing & Checkout (Test Mode)
* **Deployment**: Vercel (Production Live URL)

## Setup Instructions

If you prefer to run the architecture locally rather than using the live demo, follow these steps:

1. Clone the repository:
```bash
git clone <your-repo-url>
cd resumai-hackathon
Install dependencies:

Bash
npm install
Configure Environment Variables:
Create a new file named .env.local in the root directory and add your keys:

Code snippet
NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key"
GROQ_API_KEY="your_groq_api_key"
STRIPE_SECRET_KEY="your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="your_stripe_webhook_secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
Run Database Migrations:
Execute the SQL schema setup in your Supabase SQL Editor to create the profiles, subscriptions, and resume_reviews tables with columns for ats_score and missing_keywords.

Run the Development Server:

Bash
npm run dev
Open http://localhost:3000 in your browser.