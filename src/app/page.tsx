"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client"; // Adjust path if needed

const targetSuggestions = '["Highlight product metrics", "Add B2B examples"]';

function TypingSuggestions() {
  const [displayText, setDisplayText] = useState("");
  const [phase, setPhase] = useState<"typing" | "pause" | "deleting">("typing");

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (phase === "typing") {
        if (displayText.length < targetSuggestions.length) {
          setDisplayText(targetSuggestions.slice(0, displayText.length + 1));
        } else {
          setPhase("pause");
        }
      } else if (phase === "pause") {
        setPhase("deleting");
      } else if (displayText.length > 0) {
        setDisplayText(targetSuggestions.slice(0, displayText.length - 1));
      } else {
        setPhase("typing");
      }
    }, phase === "pause" ? 2000 : 50);

    return () => window.clearInterval(interval);
  }, [displayText, phase]);

  return (
    <span className="text-[#ffd60a]">
      {displayText}
      <span className="ml-0.5 inline-block h-4 w-[0.6ch] animate-pulse rounded-sm bg-[#ffd60a] align-middle" />
    </span>
  );
}

function AnimatedMetric({
  value,
  suffix,
  label,
}: {
  value: number;
  suffix: string;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let frameId = 0;
    let startTime: number | null = null;
    const duration = 1800;

    const step = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(value * eased);

      if (progress < 1) {
        frameId = window.requestAnimationFrame(step);
      }
    };

    frameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frameId);
  }, [isVisible, value]);

  const formatValue = (current: number) => {
    const formatted = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: Number.isInteger(value) ? 0 : 1,
    }).format(current);

    return `${formatted}${suffix}`;
  };

  return (
    <div ref={ref} className="rounded-[24px] border border-white/10 bg-white/5 p-6">
      <p className="text-4xl font-semibold text-[#ffd60a]">{formatValue(displayValue)}</p>
      <p className="mt-3 text-sm uppercase tracking-[0.25em] text-slate-400">{label}</p>
    </div>
  );
}

export default function Home() {
  const router = useRouter();

  async function handleSecureNavigation() {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  } // <-- THIS WAS MISSING, WHICH CAUSED THE CRASH

  async function handleFreePlanClick() {
    const supabase = createSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (error) {
      console.error("Supabase profile fetch error:", error);
    }

    // Flexibly read whichever column exists in your schema
    const tier = String(data?.subscription_tier || data?.subscription || "").toLowerCase();
    const isPro = tier.includes("pro");

    if (isPro) {
      alert("You are currently on the Pro plan.");
    } else {
      router.push("/dashboard");
    }
  }

  async function handleProPlanClick() {
    const supabase = createSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (error) {
      console.error("Supabase profile fetch error:", error);
    }

    // Flexibly read whichever column exists in your schema
    const tier = String(data?.subscription_tier || data?.subscription || "").toLowerCase();
    const isPro = tier.includes("pro");

    if (isPro) {
      alert("You are currently in your Pro plan.");
    } else {
      window.location.href = "/api/stripe/checkout";
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      
      {/* 1. Hero Section */}
      <section className="mx-auto flex max-w-7xl flex-col px-6 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(255,214,10,0.18),_transparent_35%),linear-gradient(135deg,_#0b0b0b,_#050505)] p-8 shadow-2xl shadow-black/40 sm:p-10 lg:p-14">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ffd60a]" />
                AI-powered resume screening for modern teams
              </div>

              <div className="space-y-5">
                <h1 className="text-5xl font-semibold tracking-[-0.03em] text-white sm:text-6xl lg:text-7xl">
                  ResumAI
                </h1>
                <p className="max-w-xl text-lg leading-8 text-slate-300 sm:text-xl">
                  Stop guessing. Start matching. Enterprise-grade AI resume screening that finds your perfect candidate in seconds.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSecureNavigation}
                  className="inline-flex items-center justify-center rounded-full bg-[#ffd60a] px-5 py-3 text-sm font-semibold text-black transition hover:scale-[1.02]"
                >
                  Start reviewing
                </button>
                <button
                  type="button"
                  onClick={handleSecureNavigation}
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-transparent px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Open dashboard
                </button>
              </div>
            </div>

            <div className="w-full max-w-xl rounded-[24px] border border-white/10 bg-white/5 p-4 backdrop-blur">
              <div className="rounded-[20px] border border-white/10 bg-[#0f0f0f] p-4">
                <div className="mb-4 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ffd60a]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/30" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                </div>
                <div className="rounded-[16px] border border-white/10 bg-gradient-to-br from-[#171717] via-[#0d0d0d] to-[#080808] p-4 text-sm text-slate-300">
                  <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3 text-xs uppercase tracking-[0.3em] text-slate-500">
                    <span>Resume Analysis</span>
                    <span className="text-[#ffd60a]">JSON</span>
                  </div>
                  <pre className="overflow-x-auto font-mono text-xs leading-6 text-slate-200">
{`{
  "overallMatch": 91,
  "strengths": ["Cloud architecture", "Leadership"],
  "gaps": ["Enterprise SaaS", "Go-to-market"],
  "suggestions": `}
                    <TypingSuggestions />
                    {`}
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Product Brief Section */}
      <section className="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-10">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 sm:p-10 lg:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Product Brief</p>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                ResumAI compares resumes against job descriptions to output instant, structured feedback.
              </h2>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                From strengths and gaps to actionable suggestions, the platform translates raw candidate data into clear hiring signals that teams can act on immediately.
              </p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-[#0c0c0c] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Structured output</p>
              <div className="mt-4 space-y-4 text-sm text-slate-300">
                
                <div className="group rounded-2xl border border-white/10 bg-white/5 p-4 transition-all duration-500 ease-out hover:border-white/20 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,214,10,0.05)]">
                  <p className="font-semibold text-white transition-colors duration-300 group-hover:text-[#ffd60a]">
                    Strengths
                  </p>
                  <p className="mt-2 text-slate-300 transition-colors duration-300 group-hover:text-white">
                    Leadership, technical depth, measurable impact
                  </p>
                </div>

                <div className="group rounded-2xl border border-white/10 bg-white/5 p-4 transition-all duration-500 ease-out hover:border-white/20 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,214,10,0.05)]">
                  <p className="font-semibold text-white transition-colors duration-300 group-hover:text-[#ffd60a]">
                    Gaps
                  </p>
                  <p className="mt-2 text-slate-300 transition-colors duration-300 group-hover:text-white">
                    Domain alignment, soft-skill evidence, direct metrics
                  </p>
                </div>

                <div className="group rounded-2xl border border-white/10 bg-white/5 p-4 transition-all duration-500 ease-out hover:border-white/20 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,214,10,0.05)]">
                  <p className="font-semibold text-white transition-colors duration-300 group-hover:text-[#ffd60a]">
                    Suggestions
                  </p>
                  <p className="mt-2 text-slate-300 transition-colors duration-300 group-hover:text-white">
                    Refine bullets, emphasize scale, tailor to the target role
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Metrics Section */}
      <section className="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-10">
        <div className="rounded-[28px] border border-white/10 bg-[#0a0a0a] p-8 sm:p-10 lg:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">The Metrics</p>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <AnimatedMetric value={10000} suffix="+" label="Resumes Analyzed" />
            <AnimatedMetric value={98.5} suffix="%" label="Matching Accuracy" />
            <AnimatedMetric value={3} suffix="x" label="Faster Hiring Process" />
          </div>

          <div className="mt-8 grid gap-4 rounded-[24px] border border-white/10 bg-[#101010] p-6 sm:grid-cols-3">
            <div className="space-y-2">
              <div className="h-2 rounded-full bg-white/10">
                <div className="h-2 w-[88%] rounded-full bg-[#ffd60a]" />
              </div>
              <p className="text-sm text-slate-400">Review throughput</p>
            </div>
            <div className="space-y-2">
              <div className="h-2 rounded-full bg-white/10">
                <div className="h-2 w-[92%] rounded-full bg-[#ffd60a]" />
              </div>
              <p className="text-sm text-slate-400">Signal quality</p>
            </div>
            <div className="space-y-2">
              <div className="h-2 rounded-full bg-white/10">
                <div className="h-2 w-[79%] rounded-full bg-[#ffd60a]" />
              </div>
              <p className="text-sm text-slate-400">Time saved</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Pricing Section (NEW) */}
      <section className="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-10">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 sm:p-10 lg:p-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-white/60">
            Start for free, upgrade when you need unlimited power.
          </p>

          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-2 text-left">
            
            {/* Starter Tier */}
            <div className="flex flex-col justify-between rounded-[24px] border border-white/10 bg-[#0c0c0c] p-8 transition-all hover:bg-white/10">
              <div>
                <h3 className="text-lg font-semibold text-white">Starter</h3>
                <div className="mt-4 flex items-baseline text-5xl font-extrabold text-white">
                  $0
                  <span className="ml-1 text-xl font-medium text-white/50">/mo</span>
                </div>
                <p className="mt-4 text-sm text-white/60">Perfect for trying out the platform.</p>
                
                <ul className="mt-8 space-y-4 text-sm text-white/80">
                  <li className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
                    1 Resume Review
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
                    Full Deep-Dive AI Analysis
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
                    Standard Actionable Feedback
                  </li>
                </ul>
              </div>
              <button
                onClick={handleFreePlanClick}
                type="button"
                className="mt-8 w-full rounded-full border border-white/20 bg-transparent py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Get Started
              </button>
            </div>

            {/* Pro Tier */}
            <div className="relative flex flex-col justify-between rounded-[24px] border border-[#ffd60a]/30 bg-gradient-to-b from-[#ffd60a]/10 to-[#0c0c0c] p-8 shadow-[0_0_30px_rgba(255,214,10,0.1)] transition-all hover:border-[#ffd60a]/50">
              <div className="absolute -top-4 left-0 right-0 mx-auto w-32 rounded-full bg-[#ffd60a] px-3 py-1 text-center text-xs font-bold text-black">
                MOST POPULAR
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#ffd60a]">Pro</h3>
                <div className="mt-4 flex items-baseline text-5xl font-extrabold text-white">
                  $9
                  <span className="ml-1 text-xl font-medium text-white/50">/mo</span>
                </div>
                <p className="mt-4 text-sm text-white/60">For serious candidates ready to land the job.</p>
                
                <ul className="mt-8 space-y-4 text-sm text-white/80">
                  <li className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#ffd60a]" />
                    Unlimited Resume Reviews
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#ffd60a]" />
                    Full Deep-Dive AI Analysis
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#ffd60a]" />
                    Personalized Learning Roadmaps
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#ffd60a]" />
                    AI Job Matching Suggestions
                  </li>
                </ul>
              </div>
              <button
                onClick={handleProPlanClick}
                type="button"
                className="mt-8 w-full rounded-full bg-[#ffd60a] py-3 text-sm font-semibold text-black transition hover:scale-[1.02]"
              >
                Upgrade to Pro
              </button>
            </div>
            
          </div>
        </div>
      </section>

      {/* 5. Author / Footer Section */}
      <section className="mx-auto max-w-7xl px-6 py-8 pb-16 sm:px-8 lg:px-10">
        <div className="flex flex-col items-start justify-between gap-6 rounded-[28px] border border-white/10 bg-white/5 p-8 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 overflow-hidden rounded-full border border-white/10 bg-white/5">
              <img 
                src="https://avatars.githubusercontent.com/u/156180858?s=96&v=4" 
                alt="Adinath Manoj" 
                className="h-full w-full object-cover transition-all duration-300"
              />
            </div>
            <div>
              <p className="text-xl font-semibold text-white">Built by Adinath Manoj</p>
              <p className="text-sm text-slate-400">Founder • Product • AI workflows</p>
            </div>
          </div>
          <div className="text-sm text-slate-400">Built for fast-moving hiring teams.</div>
        </div>
      </section>
    </main>
  );
}