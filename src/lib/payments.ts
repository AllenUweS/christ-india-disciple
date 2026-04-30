// Mock payment system. All payment logic lives in `processPayment()` so
// it can be swapped for Razorpay / Stripe / Paddle later without touching UI.

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Level = "basic" | "intermediate" | "senior";
export type BillingType = "monthly" | "one_time";

export interface PaymentInput {
  candidateId: string;
  level: Level;
  billingType: BillingType;
  price: number;
  currency: string;
}

export interface PaymentResult {
  status: "success" | "failed";
  reference: string;
  subscriptionId?: string;
  error?: string;
}

/**
 * processPayment — the single entry point for all checkout flows.
 *
 * Mock mode (current): always succeeds after a 3s simulated network delay,
 * then writes an active subscription row to the database.
 *
 * To plug in a real gateway later, replace the body of this function with a
 * call to your provider (Razorpay/Stripe/Paddle). UI doesn't need to change.
 */
export async function processPayment(input: PaymentInput): Promise<PaymentResult> {
  // Simulate network call
  await new Promise((r) => setTimeout(r, 3000));

  const reference = `MOCK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const startsAt = new Date();
  const expiresAt =
    input.billingType === "monthly"
      ? new Date(startsAt.getTime() + 30 * 24 * 60 * 60 * 1000) // +30 days
      : null;

  const { data, error } = await supabase
    .from("candidate_subscriptions")
    .insert({
      candidate_id: input.candidateId,
      level: input.level as Database["public"]["Enums"]["course_level"],
      billing_type: input.billingType,
      price_paid: input.price,
      currency: input.currency,
      status: "active",
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt ? expiresAt.toISOString() : null,
      payment_reference: reference,
    })
    .select()
    .single();

  if (error) {
    return { status: "failed", reference, error: error.message };
  }
  return { status: "success", reference, subscriptionId: data.id };
}

/** Active = status='active' AND (no expiry OR expiry in future) */
export function isSubscriptionActive(sub: {
  status: string;
  expires_at: string | null;
}): boolean {
  if (sub.status !== "active") return false;
  if (!sub.expires_at) return true;
  return new Date(sub.expires_at).getTime() > Date.now();
}

export const formatPrice = (price: number, currency = "INR") => {
  if (price === 0) return "Free";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${currency} ${price}`;
  }
};

export const levelLabel = (l: Level) => l.charAt(0).toUpperCase() + l.slice(1);
