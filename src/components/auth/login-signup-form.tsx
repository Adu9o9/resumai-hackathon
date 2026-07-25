"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithEmail, signUpWithEmail } from "@/lib/supabase/client";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function LoginSignupForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      setMessage("Please enter a valid email address.");
      setIsSubmitting(false);
      return;
    }

    if (normalizedEmail.endsWith("@example.com") || normalizedEmail.endsWith("@example.org") || normalizedEmail.endsWith("@example.net")) {
      setMessage("Please use a real email address. Example domains are not accepted for sign-up.");
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters long.");
      setIsSubmitting(false);
      return;
    }

    const { data, error } =
      mode === "login"
        ? await signInWithEmail(normalizedEmail, password)
        : await signUpWithEmail(normalizedEmail, password);

    if (error) {
      setMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    if (mode === "signup") {
      setMessage("Account created. Please confirm your email if required, then sign in.");
      setIsSubmitting(false);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      return;
    }

    setIsSubmitting(false);
  }

  return (
    <Card className="w-full max-w-md border-slate-200/80 shadow-lg">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Welcome to ResumAI</CardTitle>
        <CardDescription>
          {mode === "login"
            ? "Sign in to continue reviewing resumes and job descriptions."
            : "Create an account to start using ResumAI."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required
            />
          </div>
          {message ? (
            <p className="text-sm text-slate-600">{message}</p>
          ) : null}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>
        <div className="mt-4 flex items-center justify-center text-sm text-slate-500">
          <button
            type="button"
            className="font-medium text-slate-700 underline-offset-4 hover:underline"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setMessage(null);
            }}
          >
            {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
