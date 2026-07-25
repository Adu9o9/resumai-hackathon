// src/app/actions/auth.ts
"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
// Replaced the incorrect import with the exact export from your file
import { createClient } from "@/lib/supabase/server"; 

export async function signOutServer() {
  try {
    // Updated the function call to match the imported name
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error("Server sign-out failed:", error);
  }

  // Fallback: Bruteforce cookie deletion if the Supabase client fails to clear them
  const cookieStore = await cookies(); // Awaited for Next.js 15+ compatibility
  const allCookies = cookieStore.getAll();
  
  allCookies.forEach((cookie) => {
    if (cookie.name.includes('sb-') || cookie.name.includes('supabase')) {
      cookieStore.delete(cookie.name);
    }
  });

  // Server-side redirect inherently clears the router cache for the new route
  redirect("/");
}