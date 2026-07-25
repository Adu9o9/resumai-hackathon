"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { analyzeResume } from "@/app/actions/analyze";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";


type ParsedFeedback = {
  summary?: string;
  strengths?: string[];
  gaps?: string[];
  suggestions?: string[];
};

type PastReview = {
  id: string;
  job_title: string;
  created_at: string;
  summary: string;
  strengths: string[] | string;
  weaknesses: string[] | string;
  improved_bullets: string[] | string;
};

function parseFeedback(feedback: string): ParsedFeedback {
  try {
    return JSON.parse(feedback) as ParsedFeedback;
  } catch {
    return { summary: feedback };
  }
}

function safeParseArray(data: any): string[] {
  // If Supabase already parsed it into an array, just return it
  if (Array.isArray(data)) return data;
  if (!data) return [];
  
  // If it somehow comes in as a string, try to parse it
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function DashboardPage() {
  const router = useRouter();
  
  // Form State
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  
  // UI State
  const [result, setResult] = useState<Awaited<ReturnType<typeof analyzeResume>> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // User & History State
  // User & History State
  const [isPro, setIsPro] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true); 
  const [pastReviews, setPastReviews] = useState<PastReview[]>([]);
  const [selectedReview, setSelectedReview] = useState<PastReview | null>(null); // Restore this line

  // Data Fetching
  const fetchHistory = async () => {
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from("resume_reviews")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data) {
        setPastReviews(data as PastReview[]);
      }
    }
  };

  useEffect(() => {
    async function init() {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("subscription_tier")
          .eq("id", user.id)
          .single();

        if (data) {
          setIsPro(data.subscription_tier === "pro");
        }
      }
      setIsLoadingProfile(false); // <-- Add this here, before fetchHistory
      await fetchHistory();
    }
    init();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setResult(null);
    setSelectedReview(null); // Clear selected review if submitting a new one

    try {
      const response = await analyzeResume({
        resumeText,
        jobDescription,
      });
      setResult(response);
      
      // Refresh the history sidebar immediately so the new review appears
      if (!response.requiresUpgrade) {
        await fetchHistory(); 
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to analyze resume right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpgrade() {
    setIsUpgrading(true);
    setError(null);
    try {
      window.location.assign("/api/stripe/checkout");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start checkout right now.");
      setIsUpgrading(false);
    }
  }

  async function handleSignOut() {
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.trim().split("=")[0] + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
      });
      localStorage.clear();
      sessionStorage.clear();
    } catch (err) {
      console.error("Sign out failed", err);
    } finally {
      window.location.href = "/";
    }
  }

  function renderFeedbackContent(
    summary: string, 
    strengths: string[], 
    gaps: string[], 
    suggestions: string[]
  ) {
    return (
      <div className="flex flex-col gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Match summary</p>
          <p className="text-sm leading-relaxed text-white/90">{summary}</p>
        </div>

        <div className="grid gap-4">
          <div className="rounded-xl border border-white/10 bg-black/40 p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/50">Strengths</p>
            <ul className="space-y-3 text-sm leading-relaxed text-white/80">
              {strengths.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ffd60a]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/40 p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/50">Gaps</p>
            <ul className="space-y-3 text-sm leading-relaxed text-white/80">
              {gaps.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ffd60a]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/40 p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/50">Suggestions</p>
            <ul className="space-y-3 text-sm leading-relaxed text-white/80">
              {suggestions.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ffd60a]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#0a0a0a] px-6 py-10 font-sans selection:bg-[#ffd60a] selection:text-black">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        
        {/* Navbar */}
        <div className="mb-8 flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-6 py-3 shadow-2xl">
          <Link href="/" className="group flex items-center gap-3 transition-opacity hover:opacity-80">
            <div className="h-2 w-2 animate-pulse rounded-full bg-[#ffd60a] transition-all duration-300 group-hover:scale-125 group-hover:shadow-[0_0_12px_rgba(255,214,10,0.6)]" />
            <span className="text-sm font-semibold uppercase tracking-widest text-white transition-colors group-hover:text-white/90">
              ResumAI
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {isLoadingProfile ? (
              <div className="h-6 w-24 animate-pulse rounded-full bg-white/10" />
            ) : isPro ? (
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-[#ffd60a]/30 bg-[#ffd60a]/10 px-3 py-1 text-xs font-semibold tracking-widest text-[#ffd60a]">
                  PRO PLAN
                </span>
                <a 
                  href="/api/stripe/portal"
                  className="text-xs font-semibold uppercase tracking-widest text-white/50 transition hover:text-white"
                >
                  Manage
                </a>
              </div>
            ) : (
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-widest text-white/70">
                FREE PLAN
              </span>
            )}
            <div className="h-4 w-[1px] bg-white/20" />
            <button onClick={handleSignOut} type="button" className="relative z-50 cursor-pointer text-sm font-medium text-white/60 transition-all duration-200 hover:text-[#ffd60a]">
              Sign out
            </button>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          
          {/* History Sidebar */}
          <div className="flex flex-col gap-4 lg:col-span-1">
            <button
              onClick={() => {
                setSelectedReview(null);
                setResult(null);
                setResumeText("");
                setJobDescription("");
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              + New Review
            </button>

            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/50">Past Reviews</p>
              <div className="flex max-h-[600px] flex-col gap-2 overflow-y-auto pr-1">
                {pastReviews.length === 0 ? (
                  <p className="text-xs text-white/40">No reviews yet.</p>
                ) : (
                  pastReviews.map((review) => (
                    <button
                      key={review.id}
                      onClick={() => {
                        setSelectedReview(review);
                        setResult(null);
                      }}
                      className={`text-left w-full rounded-lg px-3 py-2 text-sm transition-all ${
                        selectedReview?.id === review.id 
                          ? "bg-[#ffd60a]/10 text-[#ffd60a] border border-[#ffd60a]/20" 
                          : "text-white/60 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <p className="truncate font-medium">{review.job_title || "Untitled Role"}</p>
                      <p className="mt-1 text-[10px] text-white/40">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Main Stage */}
          <div className="space-y-8 lg:col-span-3">
            {/* Conditional Rendering: Show Past Review OR the Input Form */}
            {selectedReview ? (
              <div className="space-y-6">
                <div className="rounded-[2rem] border border-[#ffd60a]/20 bg-[#ffd60a]/5 p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#ffd60a]">Archived Review</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">{selectedReview.job_title}</h2>
                  <p className="mt-1 text-sm text-white/50">Reviewed on {new Date(selectedReview.created_at).toLocaleString()}</p>
                </div>
                {renderFeedbackContent(
                  selectedReview.summary,
                  safeParseArray(selectedReview.strengths),
                  safeParseArray(selectedReview.weaknesses), // DB calls it weaknesses, UI calls it gaps
                  safeParseArray(selectedReview.improved_bullets) // DB calls it improved_bullets, UI calls it suggestions
                )}
              </div>
            ) : (
              <>
                <Card className="border-white/10 bg-white/5 shadow-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl text-white">Analyze a match</CardTitle>
                    <CardDescription className="text-white/50">
                      Provide the candidate details to generate structured feedback.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-6" onSubmit={handleSubmit}>
                      <div className="space-y-3">
                        <Label htmlFor="resume" className="text-xs font-medium uppercase tracking-widest text-white/70">
                          Resume
                        </Label>
                        <textarea
                          id="resume"
                          className="min-h-40 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-[#ffd60a] focus:ring-1 focus:ring-[#ffd60a]"
                          value={resumeText}
                          onChange={(event) => setResumeText(event.target.value)}
                          placeholder="Paste the candidate resume here"
                          required
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="job" className="text-xs font-medium uppercase tracking-widest text-white/70">
                          Job Title / Description
                        </Label>
                        <textarea
                          id="job"
                          className="min-h-24 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-[#ffd60a] focus:ring-1 focus:ring-[#ffd60a]"
                          value={jobDescription}
                          onChange={(event) => setJobDescription(event.target.value)}
                          placeholder="Paste the target role requirements"
                          required
                        />
                      </div>
                      
                      {error ? <p className="text-sm font-medium text-red-400">{error}</p> : null}
                      
                      <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="inline-flex h-11 items-center justify-center rounded-full bg-[#ffd60a] px-8 text-sm font-semibold text-black transition hover:bg-[#e5c009] disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isSubmitting ? "Analyzing..." : "Analyze resume"}
                      </button>
                    </form>
                  </CardContent>
                </Card>

                {isSubmitting ? (
                  <div className="flex items-center gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-6 text-white/70 sm:p-8">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-[#ffd60a]" />
                    <span className="text-sm font-medium tracking-wide">Analyzing match...</span>
                  </div>
                ) : null}

                {/* Newly Generated Results */}
                {result && !result.requiresUpgrade ? (
                  renderFeedbackContent(
                    parseFeedback(result.feedback ?? "").summary ?? "Your AI-generated review is ready.",
                    parseFeedback(result.feedback ?? "").strengths ?? [],
                    parseFeedback(result.feedback ?? "").gaps ?? [],
                    parseFeedback(result.feedback ?? "").suggestions ?? []
                  )
                ) : null}

                {/* Upgrade Block */}
                {result && result.requiresUpgrade ? (
                  <div className="rounded-[2rem] border border-[#ffd60a]/30 bg-[#ffd60a]/10 p-6 text-white sm:p-8">
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#ffd60a]">Upgrade required</p>
                    <p className="mt-4 text-xl font-semibold">Unlock Unlimited Reviews</p>
                    <p className="mt-2 text-sm leading-relaxed text-white/70">
                      You have already used {result.reviewCount} review{result.reviewCount === 1 ? "" : "s"}. Upgrade to Pro to process as many candidates as you need.
                    </p>
                    <button
                      type="button"
                      onClick={handleUpgrade}
                      disabled={isUpgrading}
                      className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#ffd60a] px-8 text-sm font-semibold text-black transition hover:bg-[#e5c009] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isUpgrading ? "Redirecting to Stripe..." : "Upgrade to Pro"}
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}