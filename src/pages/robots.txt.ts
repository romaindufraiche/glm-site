import type { APIRoute } from 'astro';
import { lien } from '../lib/hebergement';

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL(lien('/sitemap-index.xml'), site).href;
  return new Response(`User-agent: *\nAllow: /\nDisallow: ${lien('/contact.php')}\n\nSitemap: ${sitemap}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
