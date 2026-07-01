import type { APIRoute } from "astro";
import { anonClient } from "../lib/supabase";

export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
  const SITE = (import.meta.env.PUBLIC_SITE_URL ?? site?.toString() ?? "").replace(/\/$/, "");
  const sb = anonClient();

  let classes: any[] = [];
  let pages: any[] = [];
  if (sb) {
    const [c, p] = await Promise.all([
      sb.from("classes").select("slug, name, short_description").not("published_at", "is", null).order("sort_order"),
      sb.from("pages").select("slug, title, meta_description").not("published_at", "is", null),
    ]);
    classes = c.data ?? [];
    pages = p.data ?? [];
  }

  const lines: string[] = [];
  lines.push("# Core & Balance Pilates Studio");
  lines.push("");
  lines.push("> Boutique Austin pilates studio offering reformer, mat, prenatal, and barre fusion classes with expert instructors and easy online booking. Located at 2114 South Lamar Blvd, Austin, TX 78704.");
  lines.push("");
  lines.push("## Classes");
  lines.push("");
  for (const c of classes) {
    lines.push(`- [${c.name}](${SITE}/classes/${c.slug}): ${c.short_description ?? ""}`);
  }
  lines.push("");
  lines.push("## Key pages");
  lines.push("");
  const staticPages = [
    { path: "/", title: "Home", desc: "Reformer, mat, and prenatal pilates classes in Austin — book online." },
    { path: "/classes", title: "All classes", desc: "Overview of every class type we teach." },
    { path: "/schedule", title: "Class schedule", desc: "This week's bookable sessions with live availability." },
    { path: "/book", title: "Book a class", desc: "Pick a session and pay securely online with Stripe." },
    { path: "/pricing", title: "Pricing", desc: "Simple per-class pricing — no contracts or joining fees." },
    { path: "/instructors", title: "Instructors", desc: "Certified pilates instructors: reformer, prenatal, and rehab specialists." },
    { path: "/testimonials", title: "Member stories", desc: "Reviews from Core & Balance members." },
    { path: "/about", title: "About the studio", desc: "Why we keep classes small and coaching personal." },
    { path: "/contact", title: "Contact", desc: "Questions answered within one business day." },
  ];
  for (const p of staticPages) {
    lines.push(`- [${p.title}](${SITE}${p.path}): ${p.desc}`);
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
};
