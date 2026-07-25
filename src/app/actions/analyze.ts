"use server";

import { createClient } from "@/lib/supabase/server";

export type AnalyzeResult =
  | {
      success: true;
      requiresUpgrade: false;
      feedback: string;
      reviewCount: number;
    }
  | {
      success: true;
      requiresUpgrade: true;
      feedback: null;
      reviewCount: number;
    };

export async function analyzeResume(input: {
  resumeText: string;
  jobDescription: string;
}): Promise<AnalyzeResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in to analyze a resume.");
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("subscription_tier, usage_count")
    .eq("id", user.id)
    .maybeSingle();

  let isPro = false;
  let reviewCount = 0;

  if (profileError) {
    throw new Error("Unable to load your profile right now.");
  }

  if (!profileData) {
    const { error: createProfileError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email,
        subscription_tier: "free",
        usage_count: 0,
      },
      { onConflict: "id" },
    );

    if (createProfileError) {
      throw new Error("Unable to initialize your profile right now.");
    }
  } else {
    isPro = profileData.subscription_tier === "pro";
    reviewCount = Number(profileData.usage_count ?? 0);
  }

  if (!isPro && reviewCount >= 1) {
    return {
      success: true,
      requiresUpgrade: true,
      feedback: null,
      reviewCount,
    };
  }

  if (!process.env.GROQ_API_KEY) {
    throw new Error("Groq API key is not configured.");
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are an expert recruiting assistant. Return concise, actionable feedback as a JSON object with this exact structure: {\"summary\": \"string\", \"strengths\": [\"string\"], \"gaps\": [\"string\"], \"suggestions\": [\"string\"], \"ats_score\": 85, \"missing_keywords\": [\"Kubernetes\", \"GraphQL\"]}. Use ats_score as an integer from 0 to 100 and missing_keywords as an array of strings that represent the most important job requirements missing from the resume.",
          },
          {
            role: "user",
            content: `Resume:\n${input.resumeText}\n\nJob Description:\n${input.jobDescription}`,
          },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq request failed: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const feedback = data.choices?.[0]?.message?.content ?? "No feedback generated.";

    if (!feedback || feedback === "No feedback generated.") {
      throw new Error("Unable to generate AI feedback right now.");
    }

    let parsedFeedback: {
      overallMatch?: number;
      strengths?: string[];
      gaps?: string[];
      suggestions?: string[];
      summary?: string;
      ats_score?: number;
      missing_keywords?: string[];
    } | null = null;

    try {
      parsedFeedback = JSON.parse(feedback);
    } catch {
      parsedFeedback = null;
    }

    const jobTitle = input.jobDescription
      .split(/\n+/)[0]
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 255) || "Untitled Role";

    const normalizedScore = Number.isFinite(parsedFeedback?.overallMatch)
      ? Math.round(Number(parsedFeedback?.overallMatch) * 100)
      : 0;

    const insertPayload = {
      user_id: user.id,
      job_title: jobTitle,
      job_description: input.jobDescription,
      resume_text: input.resumeText,
      match_score: normalizedScore,
      summary: parsedFeedback?.summary ?? feedback,
      strengths: parsedFeedback?.strengths ?? [],
      weaknesses: parsedFeedback?.gaps ?? [],
      missing_keywords: parsedFeedback?.missing_keywords ?? [],
      improved_bullets: parsedFeedback?.suggestions ?? [],
      ats_score: parsedFeedback?.ats_score ?? 0,
    };

    const { error: insertError } = await supabase.from("resume_reviews").insert(insertPayload);

    if (insertError) {
      console.error("Resume review insert failed", insertError);
      throw new Error(`Unable to save review: ${insertError.message}`);
    }

    const nextUsageCount = !isPro ? reviewCount + 1 : reviewCount;

    if (!isPro) {
      const { error: updateUsageError } = await supabase
        .from("profiles")
        .update({ usage_count: nextUsageCount })
        .eq("id", user.id);

      if (updateUsageError) {
        console.warn("Profile usage update failed; continuing without persistence.", updateUsageError.message);
      }
    }

    return {
      success: true,
      requiresUpgrade: false,
      feedback,
      reviewCount: nextUsageCount,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate AI feedback right now.";
    throw new Error(message);
  }
}
