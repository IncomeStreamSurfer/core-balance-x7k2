import type { APIRoute } from "astro";
import { anonClient } from "../lib/supabase";

export const prerender = false;

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export const GET: APIRoute = async ({ site }) => {
  const SITE = (import.meta.env.PUBLIC_SITE_URL ?? site?.toString() ?? "").replace(/\/$/, "");
  const sb = anonClient();

  const parts: string[] = [];
  parts.push("# Core & Balance Pilates Studio — full content\n");
  parts.push("> Boutique Austin pilates studio: reformer, mat, prenatal, barre fusion, and private sessions. 2114 South Lamar Blvd, Suite 210, Austin, TX 78704. Open Mon–Fri 6am–8pm, Sat–Sun 8am–2pm. Book online at " + SITE + "/book\n");

  if (sb) {
    const [c, p, i, f] = await Promise.all([
      sb.from("classes").select("slug, name, short_description, body_html, price_cents, duration_minutes, level, capacity").not("published_at", "is", null).order("sort_order"),
      sb.from("pages").select("slug, title, body_html").not("published_at", "is", null),
      sb.from("instructors").select("name, role, bio, certifications, specialties").not("published_at", "is", null).order("sort_order"),
      sb.from("faqs").select("question, answer_html").order("sort_order"),
    ]);

    for (const cls of c.data ?? []) {
      parts.push(`# ${cls.name} (${SITE}/classes/${cls.slug})\n`);
      parts.push(`${cls.level} · ${cls.duration_minutes} minutes · max ${cls.capacity} people · $${(cls.price_cents / 100).toFixed(0)} per class\n`);
      parts.push(stripHtml(cls.body_html ?? cls.short_description ?? "") + "\n\n---\n");
    }
    parts.push(`# Instructors (${SITE}/instructors)\n`);
    for (const t of i.data ?? []) {
      parts.push(`## ${t.name} — ${t.role}\n${t.bio ?? ""}\nCertifications: ${(t.certifications ?? []).join(", ")}. Specialties: ${(t.specialties ?? []).join(", ")}.\n`);
    }
    parts.push("\n---\n# Frequently asked questions\n");
    for (const q of f.data ?? []) {
      parts.push(`Q: ${q.question}\nA: ${stripHtml(q.answer_html)}\n`);
    }
    for (const pg of p.data ?? []) {
      if (!pg.body_html) continue;
      parts.push(`\n---\n# ${pg.title}\n${stripHtml(pg.body_html)}\n`);
    }
  }

  return new Response(parts.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
