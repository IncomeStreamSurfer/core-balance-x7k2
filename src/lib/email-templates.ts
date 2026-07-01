const BRAND_NAME = import.meta.env.BRAND_NAME ?? process.env.BRAND_NAME ?? "Core & Balance Pilates Studio";
const BRAND_ACCENT = "#54634a";
const SITE_URL = (import.meta.env.PUBLIC_SITE_URL ?? process.env.PUBLIC_SITE_URL ?? "").replace(/\/$/, "");

function layout(content: string, preheader = ""): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body { margin:0; padding:0; background:#faf7f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif; color:#22271f; }
  .preheader { display:none !important; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden; }
  .container { max-width:560px; margin:0 auto; padding:32px 24px; }
  .card { background:#fff; border:1px solid #e4ded1; border-radius:12px; padding:32px; }
  h1 { font-family: Georgia, 'Times New Roman', serif; font-size:28px; line-height:1.2; margin:0 0 16px; letter-spacing:-0.01em; }
  p { font-size:15px; line-height:1.6; margin:0 0 16px; color:#3a3f34; }
  .btn { display:inline-block; background:${BRAND_ACCENT}; color:#fff !important; padding:12px 24px; border-radius:999px; text-decoration:none; font-weight:600; }
  .muted { color:#8a8a8a; font-size:13px; line-height:1.5; }
  .dot { display:inline-block; width:8px; height:8px; border-radius:50%; background:${BRAND_ACCENT}; margin-right:8px; vertical-align:middle; }
  a { color: ${BRAND_ACCENT}; }
</style></head><body>
<span class="preheader">${preheader}</span>
<div class="container">
  <div style="margin-bottom:24px;"><span class="dot"></span><strong style="font-size:18px;">${BRAND_NAME}</strong></div>
  <div class="card">${content}</div>
  <p class="muted" style="text-align:center; margin-top:24px;">
    <a href="${SITE_URL}">${SITE_URL.replace(/^https?:\/\//, "")}</a>
  </p>
</div>
</body></html>`;
}

export function bookingConfirmationHtml(args: {
  name: string;
  className: string;
  instructor: string;
  when: string;
  spots: number;
  amount: string;
  currency: string;
  bookingRef: string;
}) {
  return layout(`
    <h1>You're booked in</h1>
    <p>Hi ${args.name} — your spot is confirmed. Here are the details:</p>
    <p>
      <strong>Class:</strong> ${args.className}<br />
      <strong>Instructor:</strong> ${args.instructor}<br />
      <strong>When:</strong> ${args.when}<br />
      <strong>Spots:</strong> ${args.spots}<br />
      <strong>Paid:</strong> ${args.currency} ${args.amount}<br />
      <strong>Booking ref:</strong> ${args.bookingRef}
    </p>
    <p>We're at 2114 South Lamar Blvd, Suite 210, Austin, TX 78704. Arrive 10 minutes early for your first visit — grip socks are recommended for reformer classes (we sell them at the front desk too).</p>
    <p><a class="btn" href="${SITE_URL}/schedule">View the schedule</a></p>
    <p class="muted">Need to reschedule? Reply to this email or call (512) 555-0184 at least 12 hours before class.</p>
  `, `Booking confirmed — ${args.className}, ${args.when}`);
}

export function contactAckHtml({ name }: { name: string }) {
  return layout(`
    <h1>Got your message</h1>
    <p>Hey ${name} — thanks for reaching out to ${BRAND_NAME}. We read every message and we'll get back to you within one business day.</p>
    <p class="muted">In the meantime, you can browse <a href="${SITE_URL}/schedule">this week's class schedule</a> or read up on <a href="${SITE_URL}/classes">our class types</a>.</p>
  `, "We got your message");
}
