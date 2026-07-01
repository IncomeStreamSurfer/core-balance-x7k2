// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  site: process.env.PUBLIC_SITE_URL || 'https://core-balance-x7k2.vercel.app',
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/api/') &&
        !page.includes('/checkout/success') &&
        !page.includes('/checkout/cancel') &&
        !page.includes('/admin'),
      customPages: [
        '/', '/classes', '/classes/mat-pilates', '/classes/reformer-pilates',
        '/classes/prenatal-pilates', '/classes/private-sessions', '/classes/barre-fusion',
        '/instructors', '/schedule', '/book', '/pricing', '/testimonials', '/about', '/contact',
      ].map((p) => (process.env.PUBLIC_SITE_URL || 'https://core-balance-x7k2.vercel.app') + p),
    }),
  ],
  security: { checkOrigin: false },
  vite: {
    plugins: [tailwindcss()],
  },
});
