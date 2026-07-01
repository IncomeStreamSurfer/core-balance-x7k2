import type { APIRoute } from "astro";
import { stripe } from "../../../lib/stripe";
import { anonClient } from "../../../lib/supabase";
import { sendBookingConfirmation } from "../../../lib/email";

export const prerender = false;

const WEBHOOK_SECRET = import.meta.env.STRIPE_WEBHOOK_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET ?? "";

export const POST: APIRoute = async ({ request }) => {
  const sig = request.headers.get("stripe-signature");
  if (!sig) return new Response("no sig", { status: 400 });

  const rawBody = await request.text();
  let event: any;
  try {
    event = await stripe().webhooks.constructEventAsync(rawBody, sig, WEBHOOK_SECRET);
  } catch (err: any) {
    return new Response(`invalid sig: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object;
    const m = s.metadata ?? {};
    const sb = anonClient();
    if (!sb) return new Response("server not configured", { status: 500 });

    const spots = Math.max(1, Math.floor(Number(m.spots ?? 1)));
    const email = s.customer_details?.email ?? s.customer_email ?? "";

    // SECURITY DEFINER RPC: atomically inserts the booking (idempotent on
    // stripe_session_id) and increments spots_booked with capacity check.
    const { data: bookingId, error } = await sb.rpc("confirm_booking", {
      p_class_session_id: m.class_session_id,
      p_customer_name: m.customer_name ?? "Guest",
      p_customer_email: email,
      p_customer_phone: m.customer_phone ?? "",
      p_spots: spots,
      p_amount_paid_cents: s.amount_total ?? 0,
      p_currency: s.currency ?? "usd",
      p_stripe_session_id: s.id,
      p_notes: m.notes || null,
    });

    if (error) {
      // "Class is full" after payment is an edge case (two checkouts racing) —
      // log it; the studio resolves manually from the Stripe dashboard.
      console.error("[webhook] confirm_booking failed:", error.message);
      return new Response("booking failed", { status: 500 });
    }

    if (email && bookingId) {
      await sendBookingConfirmation({
        to: email,
        name: (m.customer_name ?? "there").split(" ")[0],
        className: m.class_name ?? "Pilates class",
        instructor: m.instructor || "Core & Balance team",
        when: `${m.class_when ?? ""} (Central Time)`,
        spots,
        amount: ((s.amount_total ?? 0) / 100).toFixed(2),
        currency: (s.currency ?? "usd").toUpperCase(),
        bookingRef: String(bookingId).slice(0, 8).toUpperCase(),
      }).catch(() => {});
    }
  }

  return new Response("ok", { status: 200 });
};
