import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceRoleClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-06-24.dahlia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret ?? "");
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id || session.metadata?.user_id;

    if (userId) {
      const supabaseAdmin = createServiceRoleClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        },
      );

      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ 
          subscription_tier: "pro",
          stripe_customer_id: session.customer as string 
        })
        .eq("id", userId);

      if (error) {
        console.error("Failed to update profile to pro", error);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
      }
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer;

    if (customerId) {
      const supabaseAdmin = createServiceRoleClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        },
      );
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ subscription_tier: "free" })
        .eq("stripe_customer_id", customerId);

      if (error) {
        console.error("Failed to downgrade profile", error);
        return NextResponse.json({ error: "Failed to downgrade profile" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
