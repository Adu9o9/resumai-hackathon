# ResumAI - Hackathon Architecture & Instructions

## 🎯 Mission
You are an expert Next.js 14+ (App Router) full-stack developer. We are building "ResumAI," an AI-powered resume and job description matching SaaS, in a strict 30-hour hackathon window. Prioritize speed, reliable patterns, and working features over abstract perfection. 

## 🛠️ Tech Stack
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS + Shadcn UI (lucide-react for icons)
- **Database & Auth:** Supabase (PostgreSQL + RLS + Supabase Auth)
- **Payments:** Stripe (Test Mode)
- **AI:** Google Gemini API

## 🗄️ Database Schema (Supabase)
Assume the following tables are established with Row Level Security (RLS) enabled:
1. `profiles`
   - `id` (uuid, references auth.users)
   - `email` (text)
   - `is_pro` (boolean, default false)
   - `stripe_customer_id` (text, nullable)
   - `stripe_subscription_id` (text, nullable)
2. `resume_reviews`
   - `id` (uuid)
   - `user_id` (uuid, references profiles.id)
   - `resume_text` (text)
   - `job_description` (text)
   - `feedback_json` (jsonb)
   - `created_at` (timestamp)

## 🚦 Core Business Logic & Gating
- **Free Users:** Can perform exactly 1 AI resume review.
- **Pro Users:** Have unlimited reviews.
- When a Free user tries to do a 2nd review, intercept the action and show the Stripe checkout button for the Pro tier.

## 🏗️ Required API Routes / Server Actions
1. **`/api/stripe/checkout`**: Creates a Stripe Checkout session using `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`.
2. **`/api/stripe/webhook`**: Listens for `checkout.session.completed` and `customer.subscription.deleted`. Updates the `profiles.is_pro` status in Supabase.
3. **`/api/analyze` (or Server Action)**: 
   - Verifies the user is authenticated.
   - Checks usage limits (Free vs Pro).
   - Calls the Gemini API with the resume and job description.
   - Saves the result to the `resume_reviews` table.
   - Returns the structured feedback.

## 🚧 Development Rules
1. **API First:** Always define the data fetching and API contracts before building the UI components.
2. **Shadcn UI:** Do not write custom CSS for components. Use Shadcn CLI to add components (`button`, `card`, `input`, `textarea`, `dialog`, `toast`).
3. **Keep it Server-Side:** Use React Server Components by default. Only use `"use client"` when interactivity (hooks, state) is strictly required.
4. **Error Handling:** Always include loading states (skeletons/spinners) and error boundaries.
5. **No Hallucinations:** Use the existing `.env.local` keys (Supabase, Stripe, Gemini). Do NOT invent new environment variables.

## 🏁 Phase 1 Execution
When I say "Begin Phase 1", initialize the basic Shadcn layout, set up the Supabase Auth client helpers, and build the Login/Signup page.