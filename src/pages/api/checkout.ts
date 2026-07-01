import type { APIRoute } from "astro";
import { stripe } from "../../lib/stripe";
import { anonClient } from "../../lib/supabase";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  // HONEYPOT — fake success for bots
  if (body.website) return json({ ok: true }, 200);

  // TIMING — humans take > 3s, forms older than 24h are stale replays
  const age = Date.now() - Number(body.renderedAt ?? 0);
  if (age < 3000 || age > 24 * 60 * 60 * 1000) {
    return json({ error: "Form expired — please reload the page" }, 400);
  }

  const sessionId = String(body.session_id ?? "").trim();
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim();
  const notes = String(body.notes ?? "").trim().slice(0, 300);
  const spots = Math.min(4, Math.max(1, Math.floor(Number(body.spots ?? 1))));

  if (!sessionId) return json({ error: "Please choose a session" }, 400);
  if (!name || name.length < 2) return json({ error: "Please enter your name" }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Please enter a valid email" }, 400);

  const sb = anonClient();
  if (!sb) return json({ error: "Server not configured" }, 500);

  // NEVER trust client-supplied prices — read from Supabase
  const { data: session, error } = await sb
    .from("class_sessions")
    .select("id, start_time, capacity, spots_booked, status, classes(id, name, slug, price_cents, currency, duration_minutes), instructors(name)")
    .eq("id", sessionId)
    .maybeSingle();

  if (error || !session) return json({ error: "Session not found — please pick another" }, 400);
  if (session.status !== "scheduled") return json({ error: "That session is no longer bookable" }, 400);
  if (new Date(session.start_time) < new Date()) return json({ error: "That session already started" }, 400);
  if (session.capacity - session.spots_booked < spots) {
    return json({ error: "Not enough spots left in that session" }, 400);
  }

  const cls: any = session.classes;
  if (!cls?.price_cents) return json({ error: "Class pricing unavailable" }, 500);

  const when = new Date(session.start_time).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    timeZone: "America/Chicago",
  });

  // NEVER use new URL(request.url).origin on Vercel SSR — returns localhost
  const origin =
    import.meta.env.PUBLIC_SITE_URL ??
    `${request.headers.get("x-forwarded-proto") ?? "https"}://${request.headers.get("x-forwarded-host") ?? request.headers.get("host")}`;

  try {
    const checkout = await stripe().checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          quantity: spots,
          price_data: {
            currency: (cls.currency ?? "usd").toLowerCase(),
            unit_amount: cls.price_cents,
            product_data: {
              name: `${cls.name} — ${when} (CT)`,
              description: `${cls.duration_minutes}-min class with ${(session.instructors as any)?.name ?? "our instructors"} at Core & Balance Pilates Studio, Austin`,
              metadata: { class_slug: cls.slug, class_session_id: session.id },
            },
          },
        },
      ],
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      metadata: {
        class_session_id: session.id,
        customer_name: name.slice(0, 100),
        customer_phone: phone.slice(0, 30),
        spots: String(spots),
        notes,
        class_name: cls.name,
        class_when: when,
        instructor: (session.instructors as any)?.name ?? "",
      },
    });

    return json({ url: checkout.url }, 200);
  } catch (err: any) {
    console.error("[checkout]", err?.message);
    return json({ error: "Could not start checkout — please try again" }, 500);
  }
};

function json(payload: object, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
