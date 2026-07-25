import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export async function GET(req: Request) {
  try {
    // 1. Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-06-24.dahlia", 
    });

    // 2. Authenticate the User via Supabase
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 3. Fetch the user's Stripe Customer ID from their profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.stripe_customer_id) {
      console.error("Missing Stripe Customer ID:", profileError);
      return new NextResponse("No active subscription found.", { status: 400 });
    }

    // 4. Determine where the portal should redirect them when they click "Return"
    const returnUrl = new URL("/dashboard", req.url).toString();

    // 5. Generate the highly-secure, temporary Stripe Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl,
    });

    // 6. Send the user to the portal
    return NextResponse.redirect(portalSession.url);
  } catch (error) {
    console.error("Stripe Portal Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}